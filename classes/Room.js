const { createGuid } = require("../utils/utils");
var Promise = require('bluebird');

class Room {
    constructor(roomUUID, host, problemId) {
        this.uuid = roomUUID;
        this.host = host;
        this.players = [ host ];
        this.createdDate = new Date();
        this.problemId = problemId;

        return this.createNewRoom(roomUUID, host, problemId)
        .then(function(resp) {
            return;
        })
        .catch(function(err) {
            return err;
        });
    }

    addPlayer(player) {
        this.players.push(player);
    }

    getProblemId() {
        return this.problemId;
    }
    
    getHost() {
        return new Promise(function(resolve, reject) {
            console.log("Getting host for: ", room.uuid);

            return global.knex('rooms')
            .where({
                room_uuid: this.uuid,
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

    isReady() {
        let playersLen = this.players.length;
        if (playersLen == 1) {
            return false;
        }
        let ready = true;
        for (let i = 0; i < playersLen; i++) {
            ready = ready && this.players[i].state === 'ready';
        }
        return ready;
    }

    createNewRoom(roomUUID, host, problemId) {
        return new Promise(function(resolve, reject) {
            var createdAt = new Date();

            return global.knex('rooms')
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

    static closeRoom(uuid) {
        return new Promise(function(resolve, reject) {
            console.log("Deleting Room & Participants for: ", uuid);

            return global.knex('room_members')
            .where({
                room_uuid: uuid,
            })
            .del()
           .then(function() {
               return global.knex('rooms')
               .where({
                   uuid: uuid,
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

    static removePlayer(playerId) {
        //Remove the player from the room
        console.log("going to remove player from room_members db");
        return new Promise(function(resolve, reject) {
            console.log("Removing player from room");

            return global.knex('room_members')
            .where({
                participant_user_uuid: playerId
            })
            .del()
           .then(function() {
               return resolve();
           })
           .catch(function(err) {
               return reject(err);
           });
        });
        //TODO broacast to the rest of the room that this player left
    }
}

module.exports = Room;


