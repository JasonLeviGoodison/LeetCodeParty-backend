var Promise = require('bluebird');
const { createGuid } = require("../utils/utils");

class Player{
    constructor(id, socket) {
        this.id = id;
        this.state = 'waiting';
        this.code = '';
        this.socket = socket;
        this.roomId = '';
    }

    // On submit
    setCode(code) {
        this.code = ''
    }

    getCode(code) {
        return this.code
    }

    setState(state) {
        this.state = state;
    }

    setRoomId(userUUID, roomId) {
        return new Promise(function(resolve, reject) {
            var roomCreatedAt = new Date();
            var participationUUID = createGuid();

            console.log("Setting user (" + userUUID + ") to be in room: " + roomId);
            return global.knex('room_members')
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

    setSocket(socket) {
        this.socket = socket;
    }
    
    getSocket() {
        return this.socket;
    }

    hasRoomAlready(hostUUID) {
        return new Promise(function(resolve, reject) {
            console.log("Checking for other rooms hosted by: ", hostUUID);
            return global.knex('rooms')
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
        return new Promise(function(resolve, reject) {
            console.log("Deleting Room & Participants for: ", room.uuid);

            return global.knex('room_members')
            .where({
                room_uuid: room.uuid,
            })
            .del()
           .then(function() {
               return global.knex('rooms')
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

module.exports = Player
