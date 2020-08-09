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

    _readyUp(socket, userId, roomId, newState, callback) {
        let self = this;
        self.users.getUser(userId)
        .then(function(user) {
            if (!user) {
                callback("User does not exist!");
                return;
            }

            return self.roomMember.findRoomMember(userId, roomId);
        })
        .then(function(roomMemberEntity) {
            if (!roomMemberEntity) {
                return Promise.reject("User is not part of this room yet!");
            }

            return self.users.updateReadyState(roomMemberEntity.uuid, newState);
        })
        .then(function () {
            console.log("Client " + userId + " readied up=" + newState);

            return self.emitMessageToSocketRoomMembers(socket, roomId, "userReadyUp", {
                userId: userId,
                readyState: newState
            });
        })
        .then(function() {
            return self.room.allUsersReady(roomId)
        })
        .then(function(allReady) {
            // Let the host know the state of the room, and if they should surface the start game button
            return self.emitMessageToSocketRoomHost(socket, roomId, "roomReady", {
                allUsersReady: allReady
            });
        })
        .then(function() {
            callback({
                success: true,
                userId: userId
            });
        })
        .catch(function(err) {
            callback("Failed with error: ", err);
        });
    }

    _userSubmitted(socket, userId, roomId, newState, callback) {
        let self = this;
        self.users.getUser(userId)
        .then(function(user) {
            if (!user) {
                callback("User does not exist!");
                return;
            }
            console.log("user found")

            return self.roomMember.findRoomMember(userId, roomId);
        })
        .then(function(roomMemberEntity) {
            console.log("got the user", roomMemberEntity)
            if (!roomMemberEntity) {
                return Promise.reject("User is not part of this room yet!");
            }
            console.log("going to update submitted state")
            return self.users.updateSubmittedState(roomMemberEntity.uuid, newState);
        })
        .then(function () {
            console.log("Client " + userId + " submitted code " + newState);

            return self.emitMessageToSocketRoomMembers(socket, roomId, "userSubmitted", {
                userId: userId,
                submittedState: newState
            });
        })
        .then(function() {
            return self.room.allUsersSubmitted(roomId)
        })
        .then(function(allSubmitted) {
            // Let the host know the state of the room, end game
            return self.emitMessageToSocketRoomHost(socket, roomId, "roomSubmitted", {
                allUsersSubmitted: allSubmitted
            });
        })
        .then(function() {
            callback({
                success: true,
                userId: userId
            });
        })
        .catch(function(err) {
            callback("Failed with error: ", err);
        });
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

            socket.on("readyUp", function(data, callback) {
                self._readyUp(socket, data.userId, data.roomId, data.newState, callback);
            });

            socket.on("leaveRoom", (data, callback) => {
                self._leaveRoom(socket, data, callback);
            });

            socket.on("userSubmitted", (data, callback) => {
                console.log("got user submitted")
                self._userSubmitted(socket, data.userId, data.roomId, data.newState, callback);
            })
        });
    }
}

module.exports = SocketHandlers;