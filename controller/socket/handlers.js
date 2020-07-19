const Promise = require('bluebird');
const SocketController = require('./socket');

class SocketHandlers extends SocketController {
    constructor(io, knex) {
        super(io, knex);
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
        var roomVal, nicknameInfo, roomMembers;
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
                if (inRoomAlready == null) {
                    return self.roomMember.setRoomId(userId, roomVal.uuid);
                }

                console.log("User is already a member of the room.");
                return Promise.resolve(inRoomAlready);
            })
            .then(function(nicknameI) {
                nicknameInfo = nicknameI;
                return self.room.getAllRoomMembers(roomId, userId);
            })
            .then(function(members) {
                roomMembers = members;
                // Emit a message to all the sockets in the room that a new user joined
                return self.emitMessageToSocketRoomMembers(socket, roomId, "newMember", {
                    userId: userId,
                    nicknameInfo: nicknameInfo
                });
            })
            .then(function() {
                // Join this user into the room of sockets
                return self.joinSocketInSocketRoom(socket, roomId);
            })
            .then(function() {
                callback({
                    roomId: roomId,
                    problemId: roomVal.problem_id,
                    members: roomMembers,
                    nicknameInfo: nicknameInfo
                });
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
                return;
            }

            return self.removeUserFromRoom(socket, user.uuid, data.roomId, callback);
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

module.exports = SocketHandlers;