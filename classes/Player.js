var Promise = require('bluebird');

class Player{
    constructor(knex, id, socket) {
        this.id = id;
        this.state = 'waiting';
        this.code = '';
        this.socket = socket;
        this.roomId = '';

        return new Promise(function(resolve, reject) {
            return knex.schema.hasTable('player')
            .then(function(exists) {
                return knex.schema.createTable('player', function(t) {
                    t.increments('id').primary();
                });
            })
            .then(function() {
                return resolve();
            })
            .catch(function(err) {
                return reject(err);
            });
        });
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

    setRoomId(id) {
        this.roomId = id;
    }
}

module.exports = Player
