var Promise = require('bluebird');
const { createGuid } = require("../utils/utils");
const randomAnimalName = require('random-animal-name');
const randomColor = require('randomcolor');

class RoomMember{
    constructor(knex) {
        this.knex = knex;
    }

    setRoomId(userUUID, roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var roomCreatedAt = new Date();
            var participationUUID = createGuid();
            var nickname, nickname_color;

            return self.buildUniqueNickname(roomId, userUUID, 15)
            .then(function(n) {
                nickname = n;
                return self.buildUniqueNicknameColor(roomId, 15);
            })
            .then(function(nc) {
                nickname_color = nc;
                console.log("Setting user (" + userUUID + ") Nickname (" + nickname + ") and Color (" + nickname_color + ") to be in room: " + roomId);
                return self.knex('room_members')
                .insert({
                    uuid: participationUUID,
                    room_uuid: roomId,
                    participant_user_uuid: userUUID,
                    nickname: nickname,
                    nickname_color: nickname_color,
                    created_at: roomCreatedAt,
                    updated_at: roomCreatedAt
                });
            })
            .then(function() {
                return resolve({
                    nickname: nickname,
                    nickname_color: nickname_color
                });
            })
            .catch(function(err) {
                return reject(err)
            });
        });
    }

    inRoomAlready(playerUUID, roomUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('room_members')
            .where({
                room_uuid: roomUUID,
                participant_user_uuid: playerUUID,
            })
            .select("*")
            .then(function(result) {
                if (result.length == 0) {
                    return resolve(null);
                }

                return resolve(result[0]);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    hasRoomAlready(hostUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            console.log("Checking for other rooms hosted by: ", hostUUID);
            return self.knex('rooms')
            .where({
                host_user_uuid: hostUUID
            })
            .select('uuid')
            .then(function(results) {
                return resolve(results);
            })
            .catch(function(err) {
               return reject(err);
            });
        });
    }

    deleteAllHostedRooms(rooms) {
        var roomDeletions = [];
        for (var i = 0; i < rooms.length; i++) {
            roomDeletions.push(this.buildRoomDeletePromise(rooms[i]));
        }

        return Promise.all(roomDeletions);
    }

    buildRoomDeletePromise(room) {
        let self = this;
        return new Promise(function(resolve, reject) {
            console.log("Deleting Room & Participants for: ", room.uuid);

            return self.knex('room_members')
            .where({
                room_uuid: room.uuid,
            })
            .del()
           .then(function() {
               return self.knex('rooms')
               .where({
                   uuid: room.uuid,
               })
               .del()
           })
           .then(function() {
               return resolve();
           })
           .catch(function(err) {
               return reject(err);
           });
        });
    }

    findRoomMember(userUUID, roomUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('room_members')
            .where({
                room_uuid: roomUUID,
                participant_user_uuid: userUUID
            })
            .limit(1)
            .then(function(result) {
                if (result.length == 0) {
                    return resolve(null);
                }

                return resolve(result[0]);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    buildUniqueNickname(roomUUID, userUUID, attemptsLeft) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var nickname = randomAnimalName();

            return self.knex('room_members')
            .where({
                room_uuid: roomUUID,
                nickname: nickname,
            })
            .limit(1)
            .then(function(result) {
                if (result.length == 0) {
                    return resolve(nickname);
                }
                if (attemptsLeft == 0) {
                    // Ceiling of attempts, fallback to userUUID worst case
                    console.log("Ran out of attempts to get a unique nickname! Fallback to UUID.");
                    return resolve(userUUID);
                }

                return self.buildUniqueNickname(roomUUID, userUUID, attemptsLeft - 1);
            })
            .then(function(uniqueNickname) {
                return resolve(uniqueNickname);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    buildUniqueNicknameColor(roomUUID, attemptsLeft) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var nickname_color = randomColor();

            return self.knex('room_members')
            .where({
                room_uuid: roomUUID,
                nickname_color: nickname_color,
            })
            .limit(1)
            .then(function(result) {
                if (result.length == 0) {
                    return resolve(nickname_color);
                }
                if (attemptsLeft == 0) {
                    // Ceiling of attempts, fallback to userUUID worst case
                    console.log("Ran out of attempts to get a unique nickname! Fallback to #af59f1.");
                    return resolve("#af59f1");
                }

                return self.buildUniqueNicknameColor(roomUUID, attemptsLeft - 1);
            })
            .then(function(uniqueNicknameColor) {
                return resolve(uniqueNicknameColor);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }
}

module.exports = RoomMember
