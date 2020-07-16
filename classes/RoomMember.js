var Promise = require('bluebird');
const { createGuid } = require("../utils/utils");

class RoomMember{
    constructor(knex) {
        this.knex = knex;
    }

    setRoomId(userUUID, roomId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            var roomCreatedAt = new Date();
            var participationUUID = createGuid();

            console.log("Setting user (" + userUUID + ") to be in room: " + roomId);
            return self.knex('room_members')
            .insert({
                uuid: participationUUID,
                room_uuid: roomId,
                participant_user_uuid: userUUID,
                created_at: roomCreatedAt,
                updated_at: roomCreatedAt
            })
            .then(function() {
                return resolve();
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
            .then(function(result) {
                if (result.length == 0) {
                    return resolve(false);
                }

                return resolve(true);
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
}

module.exports = RoomMember
