const { createGuid } = require("../utils/utils");
var Promise = require('bluebird');
const Logger = require('../observability/logging/logger');

class Submissions {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger("submissions");
    }

    createSubmission(data) {
        let self = this;

        return new Promise(function(resolve, reject) {
            var createdAt = new Date();
            var submissionUUID = createGuid();

            return self.knex('submissions')
            .insert({
                uuid: submissionUUID,
                room_uuid: data.roomUUID,
                user_uuid: data.userUUID,
                run_time: data.runTime,
                memory_usage: data.memUsage,
                start_writing_time: data.startWritingTime,
                end_writing_time: data.finishedWritingTime,
                created_at: createdAt,
                updated_at: createdAt
            })
            .then(function(result) {
                return resolve(submissionUUID);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }
}

module.exports = Submissions;