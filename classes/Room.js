const { createGuid } = require("../utils/utils");
var Promise = require('bluebird');

class Room {
    constructor(roomUUID, host, problemId) {
        this.id = roomUUID;
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
}

module.exports = Room;


