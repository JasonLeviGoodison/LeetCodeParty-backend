var Promise = require('bluebird');

class Users {
    constructor() {
        this.users = {}
    }

    getUsers() {
        return this.users;
    }

    hasUser(userId) {
        return this.users.hasOwnProperty(userId);
    }
    
    getUser(userId) {
        return this.users[userId];
    }

    addUser(player) {
        this.users[player.id] = player;
        var self = this;

        return self.userExists(player.id)
        .then(function(exists) {
            console.log("User Exists = ", exists);

            if (!exists) {
                return self.createNewUser(player.id);
            }

            return Promise.resolve();
        })
        .then(function(resp) {
            return;
        })
        .catch(function(err) {
            return err;
        });
    }

    userExists(userUUID) {
        return new Promise(function(resolve, reject) {
            return global.knex('users')
            .where({
                uuid: userUUID
            })
            .select('uuid')
            .then(function(resp) {
                return resolve(resp.length > 0);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    createNewUser(userUUID) {
        return new Promise(function(resolve, reject) {
            var createdAt = new Date();

            console.log("Creating New User: ", userUUID);
            return global.knex('users').insert({
                uuid: userUUID,
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

module.exports = Users;