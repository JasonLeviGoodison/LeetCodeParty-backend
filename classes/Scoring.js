const { requireUncached, trimLetters, secondsBetweenDates } = require("../utils/utils");
const Logger = require('../observability/logging/logger');
const Constants = require('../constants/constants');
var Promise = require('bluebird');

const POINTS_FOR_VIEWING_CODE = 1000;

class Scoring {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger('scoring');
    }

    buildPointsConstant(id, points) {
        return {
            identifier: id,
            points: Math.floor(points),
            range: null,
            exponent: null
        }
    }

    buildPointsRangeBased(id, points, range) {
        return {
            identifier: id,
            points: Math.floor(points),
            range: range,
            exponent: null
        }
    }

    buildPointsRangeExpBased(id, points, range, exponent, exponentOriginal) {
        return {
            identifier: id,
            points: Math.floor(points),
            range: range,
            exponent: exponent,
            exponentOriginal: exponentOriginal
        }
    }

    buildPointsExponentBased(id, points, exponent, exponentOriginal) {
        return {
            identifier: id,
            points: Math.floor(points),
            range: null,
            exponent: exponent,
            exponentOriginal: exponentOriginal
        }
    }

    _buildMaxValSafely(max) {
        if (max === null) {
            return "Inf";
        }

        return max;
    }

    buildRuntimePoints(multipliers, runTime) {
        let self = this;
        return new Promise(function(resolve, reject) {
            runTime = trimLetters(runTime);

            var points = null;
            var rangeChosen = null;
            for (var i = 0; i < multipliers['runTimePiecewise'].length; i++) {
                var multiRange = multipliers['runTimePiecewise'][i];

                if (runTime >= multiRange.min && (multiRange.max === null || runTime <= multiRange.max)) {
                    points = multiRange.points;
                    rangeChosen = [multiRange.min + "ms", self._buildMaxValSafely(multiRange.max) + "ms"];
                    break;
                }
            }

            if (points === null || rangeChosen === null) {
                self.logger.error('Runtime not in any multiplier range!', {
                    multipliers,
                    rangeChosen,
                    runTime
                });
                return reject('Runtime not in any multiplier range! This should never happen');
            }

            self.logger.info("Using RunTime Points", {
                runTimePoints: points,
                runTime,
                rangeChosen,
            });
            return resolve(self.buildPointsRangeBased(Constants.RUNTIME_POINTS_ID, points, rangeChosen));
        });
    }

    buildMemPoints(multipliers, memoryUsage) {
        let self = this;

        let originalMemUsage = memoryUsage;
        memoryUsage = trimLetters(memoryUsage);
        return new Promise(function(resolve, reject) {
            let exp = multipliers['memoryUsage'];
            var points = Math.pow(memoryUsage, exp);

            self.logger.info("Using Memory Points", {
                memPoints: points,
                memoryUsage,
                exp,
            })
            return resolve(self.buildPointsExponentBased(Constants.MEM_POINTS_ID, points, exp, originalMemUsage));
        });
    }

    buildWritingTimePoints(multipliers, startTime, finishTime) {
        let self = this;

        let seconds = secondsBetweenDates(startTime, finishTime);
        let multiplierVal = multipliers['writingTimePiecewise'];
        return new Promise(function(resolve, reject) {

            var points = null;
            var rangeResp = null;
            for (var i = 0; i < multiplierVal.length; i++) {
                var range = multiplierVal[i];

                if (seconds >= range.min && (range.max === null || seconds <= range.max)) {
                    points = Math.pow(seconds, range.exp);
                    rangeResp = range;
                    break;
                }
            }

            if (points === null || rangeResp === null) {
                self.logger.error('Writing Time not in any multiplier range!', {
                    seconds
                });
                return reject('Writing Time not in any multiplier range! This should never happen');
            }

            self.logger.info("Using Writing Time Points", {
                writingTimePoints: points,
                seconds,
                rangeResp,
            });
            return resolve(self.buildPointsRangeExpBased(
                Constants.WRITING_TIME_POINTS_ID,
                points,
                [rangeResp.min, self._buildMaxValSafely(rangeResp.max)],
                rangeResp.exp,
                Math.floor(seconds) + " sec",
            ));
        });
    }

    buildReadReceiptPoints(roomUUID, userUUID) {
        let self = this;

        return new Promise(function(resolve, reject) {
            return self.knex('submission_receipts')
            .where({
                room_uuid: roomUUID,
                viewer_user_uuid: userUUID,
                deleted_at: null
            })
            .count('uuid as CNT')
            .then(function(results) {
                var count = 0;
                if (results.length > 0 && results[0].CNT) {
                    count = results[0].CNT;
                }

                var points = 0;
                if (count > 0) {
                    points = POINTS_FOR_VIEWING_CODE;
                }

                self.logger.info("Using Read Receipt Points", {
                    points,
                    count,
                });
                return resolve(self.buildPointsConstant(Constants.READ_RECEIPT_POINTS_ID, points));
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    buildScoreResponse(userUUID, data) {
        let self = this;

        return new Promise(function(resolve, reject) {
            var totalPoints = 0;
            for (var i = 0; i < data.length; i++) {
                totalPoints += data[i].points;
            }

            let scoreResponse = {
                user_uuid: userUUID,
                total_points: totalPoints,
                explanation: data
            };
            self.logger.info("Built Final Score Response", scoreResponse)
            return resolve(scoreResponse);
        })
    }

    buildPoints(
        userUUID,
        roomUUID,
        runTime,
        memoryUsage,
        startTime,
        finishTime,
    ) {
        let self = this;

        let multipliers = requireUncached('../config/multipliers.json');
        return new Promise(function(resolve, reject) {
            var runTimePoints = 0;
            var memPoints = 0;
            var writingTimePoints = 0;
            var readReceiptPoints = 0;

            return self.buildRuntimePoints(multipliers, runTime)
            .then(function(runTimePts) {
                runTimePoints = runTimePts;

                return self.buildMemPoints(multipliers, memoryUsage);
            })
            .then(function(memoryPts) {
                memPoints = memoryPts;

                return self.buildWritingTimePoints(multipliers, startTime, finishTime);
            })
            .then(function(writingTimePts) {
                writingTimePoints = writingTimePts;

                return self.buildReadReceiptPoints(roomUUID, userUUID);
            })
            .then(function(readReceiptPts) {
                readReceiptPoints = readReceiptPts;

                return self.buildScoreResponse(userUUID, [
                    runTimePoints,
                    memPoints,
                    writingTimePoints,
                    readReceiptPoints,
                ]);
            })
            .then(function(response) {
                return resolve(response);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }
}

module.exports = Scoring;