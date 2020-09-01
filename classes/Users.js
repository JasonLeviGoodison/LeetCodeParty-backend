var Promise = require('bluebird');
const Logger = require('../observability/logging/logger');

class Users {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger("users");
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

    getNumUsers() {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.knex('users')
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

    addUser(userUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
            return self.userExists(userUUID)
            .then(function(exists) {
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

            self.logger.info("Creating new User", userUUID);
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

           self.logger.info("Setting Room Member to Ready", {
               roomMemberUUID,
               state
           });
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

    updateSubmittedState(roomMemberUUID, state, latestSubmissionUUID) {
        let self = this;
        return new Promise(function(resolve, reject) {
           var updatedAt = new Date();

            self.logger.info("Setting Room Member to Submitted", {
                roomMemberUUID,
                state
            });
           return self.knex('room_members')
           .where({
               uuid: roomMemberUUID
           })
           .update({
               submitted: state,
               latest_submission_uuid: latestSubmissionUUID,
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