const Promise = require('bluebird');
const Rooms = require('../../classes/Rooms');
const Users = require('../../classes/Users');
const RoomMember = require('../../classes/RoomMember');
const Room = require('../../classes/Room');
const Submissions = require('../../classes/Submissions');
const SubmissionReceipts = require('../../classes/SubmissionReceipts');
const Scoring = require('../../classes/Scoring');
const Metrics = require('../../classes/Metrics');
const Logger = require('../../observability/logging/logger');
const { createGuid, buildHostRoomID } = require("../../utils/utils");

class SocketController {
    constructor(io, knex) {
        this.logger = new Logger('socket-controller');
        this.room = new Room(knex);
        this.roomMember = new RoomMember(knex);
        this.rooms = new Rooms(knex);
        this.users = new Users(knex);
        this.submissions = new Submissions(knex);
        this.submission_receipts = new SubmissionReceipts(knex);
        this.scoring = new Scoring(knex);
        this.metrics = new Metrics(knex);
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
                    self.logger.info("New User", userId);
                    return resolve(userId);
                })
                .catch(function(err) {
                    self.logger.error("Failed to add user", err);
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
                    socket.join(buildHostRoomID(roomId));
                    callback({
                        roomId,
                        problemId,
                        nicknameInfo
                    });

                    self.logger.info("User created a room", {
                        host,
                        roomId,
                        problemId
                    });
                    return resolve();
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    // Closes the room + removes all sockets from the socket room
    closeRoomWrapper(socket, roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.room.closeRoom(roomId)
                .then(function() {
                    return self.emitMessageToSocketRoomMembers(socket, roomId, "roomClosing", true);
                })
                .then(function(result) {
                    // Since this is the host socket, we should also leave the host socket room
                    socket.leave(buildHostRoomID(roomId));

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
                    return self.emitMessageToSocketRoomMembers(socket, roomId, "userLeftRoom", {
                        userId: userId
                    })
               })
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
                    return self.closeRoomWrapper(socket, foundRoom.uuid);
                }

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
            socket.join(roomId);
            return resolve();
        });
    }

    emitMessageToSocketRoomMembers(socket, roomId, msgType, msgValue) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.logger.warn("Sending the following message to room", {
                roomId,
                msgType,
                msgValue,
                warning: "This method is deprecated in favour of emitMessageToAllSocketRoomMembers"
            });
            socket.to(roomId).emit(msgType, msgValue);
            return resolve();
        });
    }

    emitMessageToAllSocketRoomMembers(roomId, msgType, msgValue) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.logger.info("Sending the following message to room", {
                roomId,
                msgType,
                msgValue
            });
            self.io.to(roomId).emit(msgType, msgValue);
            return resolve();
        });
    }

    emitMessageToSocketRoomHost(socket, roomId, msgType, msgValue) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var roomHostID = buildHostRoomID(roomId);

            self.logger.info("Sending the following message to room host", {
                roomHostID,
                msgType,
                msgValue
            });
            socket.to(roomHostID).emit(msgType, msgValue);
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

    getNumUsers() {
        return this.users.getNumUsers();
    }

    getNumRooms() {
        return this.room.getNumRooms();
    }

    getUserSignupGraph() {
        return this.metrics.getUserSignupGraph();
    }

    getRoomCreationGraph() {
        return this.metrics.getRoomCreationGraph()
    }
}

module.exports = SocketController;