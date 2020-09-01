const Promise = require('bluebird');
const SocketController = require('./socket');
const Constants = require('../../constants/constants');
const currentLine = require("current-line");
const { registerController } = require("../../routes/index");
const { points } = require("../../utils/utils");

class SocketHandlers extends SocketController {
    constructor(io, knex) {
        super(io, knex);
        registerController(this);
    }

    _handlerErrorGraceful(callback, caller, resp, err) {
        this.logger.error("Handler has failed", {
            handler: caller,
            response: resp,
            err: err
        });
        callback(resp);
    }

    _executeHandler(cl, data, endpoint, callback) {
        this.logger.info("Handler Called", {
            endpoint: endpoint,
            data: data,
            current_line: cl,
        });

        callback();
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

                self.logger.info("Returning User", userId);
                return Promise.resolve();
            })
            .then(function() {
                return;
            })
            .catch(function(err) {
                self._handlerErrorGraceful(function() {}, currentLine.get(), null, err);
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
            .catch(function(err) {
                self._handlerErrorGraceful(callback, currentLine.get(), {errorMessage: err}, err);
            });
    }

    _createRoom(socket, data, callback) {
        let self = this;
        self.users.getUser(data.userId)
        .then(function(user) {
            if (!user) {
                callback("User does not exist!");
            }

            return self.createRoom(user.uuid, data.problemId, socket, callback);
        })
        .then(function(room) {
            self.logger.info("Created Room", room);
        })
        .catch(function(err) {
            self._handlerErrorGraceful(callback, currentLine.get(), ("Failed with error: " + err), err);
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
            self._handlerErrorGraceful(callback, currentLine.get(), ("Failed with error: " + err), err);
        });
    }

    _userSubmitted(socket, userId, roomId, meta, callback) {
        let self = this;
        let newState = meta.newState;
        var roomMemberVal;
        
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
            roomMemberVal = roomMemberEntity;

            return self.submissions.createSubmission({
                userUUID: userId,
                roomUUID: roomId,
                runTime: meta.runTime,
                memUsage: meta.memoryUsage,
                startWritingTime: new Date(meta.startTime),
                finishedWritingTime: new Date(meta.finishTime)
            });
        })
        .then(function(submissionUUID) {
            return self.users.updateSubmittedState(roomMemberVal.uuid, newState, submissionUUID);
        })
        .then(function () {
            let numPoints = points(meta.runTime, meta.memoryUsage, new Date(meta.startTime), new Date(meta.finishTime))
            meta.points = numPoints;

            return self.emitMessageToAllSocketRoomMembers(roomId, Constants.USER_SUBMITTED_MESSAGE, {
                userId: userId,
                submittedState: newState,
                meta
            });
        })
        .then(function() {
            return self.room.allUsersSubmitted(roomId)
        })
        .then(function(allSubmitted) {
            if (allSubmitted) {
                return self.emitMessageToAllSocketRoomMembers(roomId, Constants.GAME_OVER_MESSAGE, {});
            }
        })
        .then(function() {
            callback({
                success: true,
                userId: userId
            });
        })
        .catch(function(err) {
            self._handlerErrorGraceful(callback, currentLine.get(), ("Failed with error: " + err), err);
        });
    }

    _leaveRoom(socket, data, callback) {
        let self = this;
        self.users.getUser(data.userId)
        .then(function(user) {
            if (!user) {
                callback("User does not exist!");
                return;
            }

            return self.removeUserFromRoom(socket, user.uuid, data.roomId, callback);
        })
        .then( () => {
            callback();
        })
        .error((err) => {
            self._handlerErrorGraceful(callback, currentLine.get(), ("Failed with error: " + err), err);
        });
    }

    _startRoom(socket, data, callback) {
        let self = this;
        self.logger.info("Starting Room", data);
        return self.room.changeRoomStarted(data.roomId, true)
        .then(function() {
            return self.emitMessageToSocketRoomMembers(socket, data.roomId, Constants.ROOM_STARTED_MESSAGE, {});
        })
        .then(function() {
            callback({success: true});
        })
        .catch(function(err) {
            self._handlerErrorGraceful(callback, currentLine.get(), ("Failed with error: " + err), err);
        });
    }

    _userViewedCode(socket, data, callback) {
        let self = this;
        return self.submission_receipts.createSubmissionReceipt(data.roomUUID, data.viewer, data.viewed)
        .then(function(submissionReceiptUUID) {
            return self.emitMessageToAllSocketRoomMembers(data.roomUUID, Constants.USER_VIEWED_CODE_MESSAGE, {
                submissionReceiptUUID: submissionReceiptUUID,
                viewerUserUUID: data.viewer,
                viewedUserUUID: data.viewed
            });
        })
        .then(function() {
            callback({success: true});
        })
        .catch(function(err) {
            self._handlerErrorGraceful(callback, currentLine.get(), ("Failed with error: " + err), err);
        });
    }

    Start() {
        var self = this;
        this.io.on("connection", (socket) => {

            socket.on(Constants.GET_NEW_USER_ID_MESSAGE, () => {
                self._executeHandler(
                    currentLine.get(),
                    {},
                    Constants.GET_NEW_USER_ID_MESSAGE,
                    function() {
                        self._getNewUserId(socket)
                    }
                );
            });

            socket.on(Constants.NEW_SOCKET_MESSAGE, ({userId}) => {
                self._executeHandler(
                    currentLine.get(),
                    {
                        userId
                    },
                    Constants.NEW_SOCKET_MESSAGE,
                    function() {
                        self._newSocket(socket, userId);
                    }
                );
            });

            socket.on(Constants.JOIN_ROOM_MESSAGE, ({roomId, userId}, callback) => {
                self._executeHandler(
                    currentLine.get(),
                    {
                        roomId,
                        userId
                    },
                    Constants.JOIN_ROOM_MESSAGE,
                    function() {
                        self._joinRoom(socket, roomId, userId, callback);
                    }
                );
            });

            socket.on(Constants.CREATE_ROOM_MESSAGE, function(data, callback) {
                self._executeHandler(
                    currentLine.get(),
                    data,
                    Constants.CREATE_ROOM_MESSAGE,
                    function() {
                        self._createRoom(socket, data, callback);
                    }
                );
            });

            socket.on(Constants.READY_UP_MESSAGE, function(data, callback) {
                self._executeHandler(
                    currentLine.get(),
                    data,
                    Constants.READY_UP_MESSAGE,
                    function() {
                        self._readyUp(socket, data.userId, data.roomId, data.newState, callback);
                    }
                );
            });

            socket.on(Constants.LEAVE_ROOM_MESSAGE, (data, callback) => {
                self._executeHandler(
                    currentLine.get(),
                    data,
                    Constants.LEAVE_ROOM_MESSAGE,
                    function() {
                        self._leaveRoom(socket, data, callback);
                    }
                );
            });

            socket.on(Constants.USER_SUBMITTED_MESSAGE, (data, callback) => {
                self._executeHandler(
                    currentLine.get(),
                    data,
                    Constants.USER_SUBMITTED_MESSAGE,
                    function() {
                        self._userSubmitted(socket, data.userId, data.roomId, data.meta, callback);
                    }
                );
            });

            socket.on(Constants.START_ROOM_MESSAGE, (data, callback) => {
                self._executeHandler(
                    currentLine.get(),
                    data,
                    Constants.START_ROOM_MESSAGE,
                    function() {
                        self._startRoom(socket, data, callback);
                    }
                );
            });

            socket.on(Constants.USER_VIEWED_CODE_MESSAGE, (data, callback) => {
                self._executeHandler(
                    currentLine.get(),
                    data,
                    Constants.USER_VIEWED_CODE_MESSAGE,
                    function() {
                        self._userViewedCode(socket, data, callback);
                    }
                );
            });
        });
    }
}

module.exports = SocketHandlers;
