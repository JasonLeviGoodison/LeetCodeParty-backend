const { requireUncached, trimLetters, secondsBetweenDates } = require("../utils/utils");
const Logger = require('../observability/logging/logger');
const Constants = require('../constants/constants');
var Promise = require('bluebird');

const POINTS_FOR_VIEWING_CODE = 1000;

class ScoringExplanation {
    constructor(id, pts) {
        this.response = {
            identifier: id,
            points: Math.floor(pts),
            range: null,
            exponent: null,
            exponentOriginal: null
        }
    }

    Get() {
        return this.response;
    }

    isPointsSet() {
        return this.response !== null;
    }

    setRange(range) {
        this.response.range = range;
    }

    setExponent(exp, originalVal) {
        this.response.exponent = exp;
        this.response.exponentOriginal = originalVal;
    }
}

class Scoring {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger('scoring');
    }

    _buildMaxValSafely(max) {
        if (max === null) {
            return "Inf";
        }

        return max;
    }


    findRangeBuildResponse(multipliers, val, multiName, buildRespFn) {
        let self = this;

        return new Promise(function(resolve, reject) {
            var response;
            for (var i = 0; i < multipliers[multiName].length; i++) {
                var multiRange = multipliers[multiName][i];

                if (val >= multiRange.min && (multiRange.max === null || val <= multiRange.max)) {
                    response = buildRespFn(multiRange);
                    break;
                }
            }

            if (!response.isPointsSet()) {
                self.logger.error('Not in any multiplier range!', {
                    multipliers,
                    response,
                    val
                });
                return reject('Runtime not in any multiplier range! This should never happen');
            }

            return resolve(response.Get());
        });
    }

    buildRuntimePoints(multipliers, runTime) {
        let self = this;
        return new Promise(function(resolve, reject) {
            runTime = trimLetters(runTime);

            return self.findRangeBuildResponse(multipliers, runTime, 'runTimePiecewise', function(multiRange) {
                var response = new ScoringExplanation(Constants.RUNTIME_POINTS_ID, multiRange.points);
                response.setRange([multiRange.min + "ms", self._buildMaxValSafely(multiRange.max) + "ms"]);

                return response;
            })
            .then(function(response) {
                self.logger.info("Using RunTime Points", {
                    runTime,
                    response,
                });

                return resolve(response);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    buildMemPoints(multipliers, memoryUsage) {
        let self = this;

        let originalMemUsage = memoryUsage;
        memoryUsage = trimLetters(memoryUsage);
        return new Promise(function(resolve, reject) {
            let exp = multipliers['memoryUsage'];
            var points = Math.pow(memoryUsage, exp);

            var response = new ScoringExplanation(Constants.MEM_POINTS_ID, points);
            response.setExponent(exp, originalMemUsage);

            self.logger.info("Using Memory Points", {
                memoryUsage,
                response,
            })
            return resolve(response.Get());
        });
    }

    buildWritingTimePoints(multipliers, startTime, finishTime) {
        let self = this;

        let seconds = secondsBetweenDates(startTime, finishTime);
        return new Promise(function(resolve, reject) {

            return self.findRangeBuildResponse(multipliers, seconds, 'writingTimePiecewise', function(multiRange) {
                var points = Math.pow(seconds, multiRange.exp);
                var response = new ScoringExplanation(Constants.WRITING_TIME_POINTS_ID, points);
                response.setRange(multiRange);
                response.setExponent(multiRange.exp, (Math.round(seconds * 10) / 10) + " sec");

                return response;
            })
            .then(function(response) {
                self.logger.info("Using Writing Time Points", {
                    seconds,
                    response,
                });

                return resolve(response);
            })
            .catch(function(err) {
                return reject(err);
            });
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

                var response = new ScoringExplanation(Constants.READ_RECEIPT_POINTS_ID, points);
                self.logger.info("Using Read Receipt Points", {
                    response,
                    count,
                });
                return resolve(response.Get());
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