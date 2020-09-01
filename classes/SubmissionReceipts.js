const { createGuid } = require("../utils/utils");
var Promise = require('bluebird');
const Logger = require('../observability/logging/logger');

class SubmissionReceipts {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger("submission-receipts");
    }

    createSubmissionReceipt(roomUUID, viewerUUID, viewedUUID) {
        let self = this;
        let submissionReceiptUUID = createGuid();
        return new Promise(function(resolve, reject) {
            return self.knex('submissions')
            .where({
                room_uuid: roomUUID,
                user_uuid: viewedUUID,
                deleted_at: null
            })
            .orderBy('created_at', 'DESC')
            .limit(1)
            .then(function(results) {
                if (results.length < 1) {
                    return reject("No submission exists for viewedUUID");
                }
                let submissionObj = results[0];
                let createdAt = new Date();

                return self.knex('submission_receipts')
                .insert({
                    uuid: submissionReceiptUUID,
                    submission_uuid: submissionObj.uuid,
                    viewer_user_uuid: viewerUUID,
                    room_uuid: roomUUID,
                    deleted_at: null,
                    created_at: createdAt,
                    updated_at: createdAt
                })
            })
            .then(function(results) {
                return resolve(submissionReceiptUUID);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }
}

module.exports = SubmissionReceipts;