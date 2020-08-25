const { createGuid } = require("../utils/utils");
var Promise = require('bluebird');

class Room {
    constructor(knex) {
        this.knex = knex;
    }

    getHost(uuid) {
        let self = this;
        return new Promise(function(resolve, reject) {
            console.log("Getting host for: ", uuid);

            return self.knex('rooms')
            .where({
                room_uuid: uuid,
                deleted_at: null
            })
            .limit(1)
           .then(function(entry) {
               return resolve(entry.host_user_uuid);
           })
           .catch(function(err) {
               return reject(err);
           });
        });
    }

    getNumRooms() {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('rooms')
            .count('uuid')
            .first()
            .then(function(results) {
                return resolve(results);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    createNewRoom(roomUUID, host, problemId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var createdAt = new Date();

            return self.knex('rooms')
            .insert({
                uuid: roomUUID,
                problem_id: problemId,
                host_user_uuid: host,
                created_at: createdAt,
                updated_at: createdAt
            })
            .then(function() {
                return resolve(true);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    closeRoom(uuid) {
        let self = this;
        return new Promise(function(resolve, reject) {
            console.log("Deleting Room & Participants for: ", uuid);

            return self.knex('room_members')
            .where({
                room_uuid: uuid,
                deleted_at: null
            })
            .update({
                deleted_at: new Date()
            })
           .then(function() {
               return self.knex('rooms')
               .where({
                   uuid: uuid,
                   deleted_at: null
               })
               .update({
                   deleted_at: new Date()
               })
           })
           .then(function() {
               return resolve();
           })
           .catch(function(err) {
               return reject(err);
           });
        });
    }

    removeRoomMember(playerId) {
        //Remove the player from the room
        console.log("going to remove player from room_members db");
        let self = this;
        return new Promise(function(resolve, reject) {
            console.log("Removing player from room");

            return self.knex('room_members')
            .where({
                participant_user_uuid: playerId,
                deleted_at: null
            })
            .update({
                deleted_at: new Date()
            })
           .then(function() {
               return resolve();
           })
           .catch(function(err) {
               return reject(err);
           });
        });
    }

    getAllRoomMembers(roomUUID, askingUserUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('room_members')
                .where({
                    room_uuid: roomUUID,
                    deleted_at: null
                })
                .whereNot({
                    participant_user_uuid: askingUserUUID
                })
                .select(
                    'participant_user_uuid',
                    'nickname',
                    'nickname_color',
                    'ready'
                )
                .then(function(results) {
                    if (results.length == 0) {
                        return resolve([]);
                    }

                    return resolve(results);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    allUsersReady(roomUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('room_members')
            .where({
                room_uuid: roomUUID,
                ready: false,
                deleted_at: null
            })
            .limit(1) // If a single result is returned, all users aren't ready
            .then(function(result) {
               return resolve(result.length == 0);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    allUsersSubmitted(roomUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('room_members')
            .where({
                room_uuid: roomUUID,
                submitted: true,
                deleted_at: null
            })
            .limit(1) // If a single result is returned, all users aren't finished
            .then(function(result) {
               return resolve(result.length == 0);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    changeRoomStarted(roomUUID, started) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var updatedAt = new Date();
            return self.knex('rooms')
            .where({
                uuid: roomUUID,
                deleted_at: null
            })
            .update({
                started: started,
                updated_at: updatedAt
            })
            .then(function(results) {
                return resolve();
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }
}

module.exports = Room;


