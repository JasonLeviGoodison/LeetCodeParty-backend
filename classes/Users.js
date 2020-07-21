var Promise = require('bluebird');

class Users {
    constructor(knex) {
        this.knex = knex;
    }

    getUser(userId) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('users')
            .where({
                uuid: userId,
            })
            .select('*')
            .limit(1)
            .then(function(results) {
                if (results.length < 1) {
                    return resolve(null);
                }

                return resolve(results[0]);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    addUser(userUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.userExists(userUUID)
            .then(function(exists) {
                console.log("User Exists = ", exists);
                if (!exists) {
                    return self.createNewUser(userUUID);
                }

                return Promise.resolve();
            })
            .then(function(resp) {
                return resolve();
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    userExists(userUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('users')
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
        let self = this;
        return new Promise(function(resolve, reject) {
            var createdAt = new Date();

            console.log("Creating New User: ", userUUID);
            return self.knex('users').insert({
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

    updateReadyState(roomMemberUUID, state) {
        let self = this;
        return new Promise(function(resolve, reject) {
           var updatedAt = new Date();

           console.log("Setting Room Member Row (" + roomMemberUUID + ") to ready=" + state);
           return self.knex('room_members')
           .where({
               uuid: roomMemberUUID
           })
           .update({
               ready: state,
               updated_at: updatedAt
           })
           .then(function(result) {
               return resolve();
           })
           .catch(function(err) {
                return reject(err);
           });
        });
    }
}

module.exports = Users;