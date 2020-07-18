const Promise = require('bluebird');
const Rooms = require('../../classes/Rooms');
const Users = require('../../classes/Users');
const RoomMember = require('../../classes/RoomMember');
const Room = require('../../classes/Room');
const { createGuid } = require("../../utils/utils");

class SocketController {
    constructor(io, knex) {
        this.room = new Room(knex);
        this.roomMember = new RoomMember(knex);
        this.rooms = new Rooms(knex);
        this.users = new Users(knex);
        this.knex = knex;
        this.io = io;
    }

    newUser(socket, userId = '') {
        let self = this;
        return new Promise(function(resolve, reject) {
            if (userId == '') {
                userId = createGuid();
            }
            return self.users.addUser(userId)
                .then(function() {
                    socket.emit("userId", userId);
                    console.log('New User! ' + userId);
                    return resolve();
                })
                .catch(function(err) {
                    console.log("Failed to add user: ", err);
                    return reject(err);
                });
        });
    }

    createRoom(host, problemId, socket, callback) {
        const roomId = createGuid();
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.roomMember.hasRoomAlready(host)
                .then(function(rooms) {
                    if (rooms.length > 0) {
                        console.log("Host had previous rooms, cleaning them up: ", rooms);
                        return self.roomMember.deleteAllHostedRooms(rooms);
                    }

                    return Promise.resolve();
                })
                .then(function() {
                    return self.room.createNewRoom(roomId, host, problemId)
                })
                .then(function() {
                    return self.roomMember.setRoomId(host, roomId);
                })
                .then(function(nicknameInfo) {
                    socket.join(roomId);
                    callback({
                        roomId,
                        problemId,
                        nicknameInfo
                    });

                    console.log('User ' + host + ' created room ' + roomId + ' with problem ' + problemId);
                    return resolve();
                })
                .catch(function(err) {
                    console.log("Failed to create room: ", err);
                    return reject(err);
                });
        });
    }

    // Closes the room + removes all sockets from the socket room
    closeRoomWrapper(roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.room.closeRoom(roomId)
                .then(function(result) {
                    return self.deleteSocketRoomAndAllSockets(roomId);
                })
                .then(function() {
                    return resolve();
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    // Rooms the user from the room + removes the socket from the room
    removeRoomMemberWrapper(socket, userId, roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
           return self.room.removeRoomMember(userId)
               .then(function(result) {
                   socket.leave(roomId)
                   return resolve();
               })
               .catch(function(err) {
                   return reject(err);
               });
        });
    }

    removeUserFromRoom(socket, userId, roomId, callback) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.rooms.getRoom(roomId)
            .then(function(foundRoom) {
                if (foundRoom.host_user_uuid == userId) {
                    console.log("This user is the host, so we should close the room.");
                    return self.closeRoomWrapper(foundRoom.uuid);
                }

                console.log("Removing the user from the game (by deleting room_member rows")
                return self.removeRoomMemberWrapper(socket, userId, roomId);
            })
            .then(function(result) {
               return resolve();
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    joinSocketInSocketRoom(socket, roomId) {
        return new Promise(function(resolve, reject) {
            console.log("New Socket joining Room: ", roomId);
            socket.join(roomId);
            return resolve();
        });
    }

    emitMessageToSocketRoomMembers(socket, roomId, msgType, msgValue) {
        let self = this;
        return new Promise(function(resolve, reject) {
            console.log("Sending the following message to room (" + roomId + "). MessageType=" + msgType + " MsgValue=", msgValue);
            socket.to(roomId).emit(msgType, msgValue);
            return resolve();
        });
    }

    deleteSocketRoomAndAllSockets(roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.io.of('/').in(roomId).clients((error, clients) => {
                if (error) {
                    return reject(error);
                }

                for (var i = 0; i < clients.length; i++) {
                    self.io.sockets.sockets[clients[i]].leave(roomId);
                }
                return resolve();
            });
        });
    }
}

module.exports = SocketController;