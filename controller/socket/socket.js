const Promise = require('bluebird');
const Rooms = require('../../classes/Rooms');
const Users = require('../../classes/Users');
const RoomMember = require('../../classes/RoomMember');
const Room = require('../../classes/Room');
const { createGuid } = require("../../utils/utils");

class Socket {
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
                .then(function() {
                    socket.join(roomId);
                    callback({
                        roomId,
                        problemId
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

    removeUserFromRoom(userId, roomId, callback) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.rooms.getRoom(roomId)
            .then(function(foundRoom) {
                if (foundRoom.host_user_uuid == userId) {
                    console.log("This user is the host, so we should close the room.");
                    return self.room.closeRoom(foundRoom.uuid);
                }

                console.log("Removing the user from the game (by deleting room_member rows")
                return self.room.removePlayer(userId);
            })
            .then(function(result) {
               return resolve();
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    _getNewUserId(socket) {
        this.newUser(socket);
    }

    _newSocket(socket, userId) {
        let self = this;
        self.users.getUser(userId)
        .then(function(user) {
            if (!user) {
                return self.newUser(socket, userId)
            }

            console.log("Returning User: ", userId);
            return Promise.resolve();
        })
        .then(function() {
            return;
        })
        .catch(function(err) {
            console.log("Failed with err: ", err);
        });
    }

    _joinRoom(socket, roomId, userId, callback) {
        let self = this;
        var roomVal;
        self.users.getUser(userId)
            .then(function(user) {
                if (!user) {
                    return Promise.reject("User does not exist");
                }

                return self.rooms.getRoom(roomId);
            })
            .then(function(room) {
                if (!room) {
                    return Promise.reject("Room does not exist");
                }

                roomVal = room;
                return self.roomMember.inRoomAlready(userId, room.uuid);
            })
            .then(function(inRoomAlready) {
                if (!inRoomAlready) {
                    return self.roomMember.setRoomId(userId, roomVal.uuid);
                }

                console.log("User is already a member of the room.");
                return Promise.resolve();
            })
            .then(function() {

                // Emit a message to all the sockets in the room that a new user joined
                console.log("Emitting New Member (" + userId + ") to RoomID: " + roomId);
                socket.to(roomId).emit('newMember', userId);

                // Join this user into the room of sockets
                socket.join(roomId);

                callback({roomId, problemId: roomVal.problem_id});
            })
            .catch(function(msg) {
                console.log("Failed: ", msg);
                callback({errorMessage: msg});
            });
    }

    _createRoom(socket, data, callback) {
        let self = this;
        self.users.getUser(data.userId)
        .then(function(user) {
            if (!user) {
                callback("User does not exist!");
            }

            console.log("Found user: ", user);
            return self.createRoom(user.uuid, data.problemId, socket, callback);
        })
        .then(function(room) {
            console.log("Made room");
        })
        .catch(function(err) {
            callback("Failed with error: ", err);
        });
    }

    _readyUp(socket, id) {
        console.log("ready up", id)
    }

    _leaveRoom(socket, data, callback) {
        let self = this;
        console.log("Client", data.userId, "wants to leave room");
        self.users.getUser(data.userId)
        .then(function(user) {
            if (!user) {
                callback("User does not exist!");
            }
            return self.removeUserFromRoom(user.uuid, data.roomId, callback);
        })
        .then( () => {
            console.log("Successfully left room");
            callback();
        })
        .error((err) => {
            callback("Couldn't disconnect from room: ", err);
        });
    }

    Start() {
        var self = this;
        this.io.on("connection", (socket) => {

            socket.on("getNewUserId", () => {
                self._getNewUserId(socket);
            });

            socket.on("newSocket", ({userId}) => {
                self._newSocket(socket, userId);
            });

            socket.on("joinRoom", ({roomId, userId}, callback) => {
                self._joinRoom(socket, roomId, userId, callback);
            });

            socket.on('createRoom', function(data, callback) {
                self._createRoom(socket, data, callback);
            });

            socket.on("readyUp", (id) => {
                self._readyUp(socket, id);
            });

            socket.on("leaveRoom", (data, callback) => {
                self._leaveRoom(socket, data, callback);
            });
        });
    }
}

module.exports = Socket;