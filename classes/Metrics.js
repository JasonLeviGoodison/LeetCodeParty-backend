const Promise = require('bluebird');
const Logger = require('../observability/logging/logger');
const { formatDate } = require('../utils/utils');
const randomColor = require('randomcolor');

class Metrics {
    constructor(knex) {
        this.knex = knex;
        this.logger = new Logger('metrics');
    }

    _executeRaw(sql) {
        let self = this;

        return new Promise(function(resolve, reject) {
            return self.knex.raw(sql)
            .then(function(results) {
                return resolve(results.rows);
            })
            .catch(function(err) {
                return reject(err);
            });
        });
    }

    _buildChartJSLineGraph(labels, label, dataVals, bcolor, bgcolor) {
        return {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label, // Name the series
                    data: dataVals, // Specify the data values array
                    fill: true,
                    borderColor: bcolor, // Add custom color border (Line)
                    backgroundColor: bgcolor, // Add custom color background (Points and Fill)
                    borderWidth: 1 // Specify bar border width
                }]},
            options: {
                responsive: true, // Instruct chart js to respond nicely.
                maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
            }
        };
    }

    _buildChartJSPieGraph(labels, dataVal, bcolors) {
        return {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [
                    {
                        data: dataVal,
                        backgroundColor: bcolors
                    }
                ]
            }
        };
    }

    _extractLabelsAndDataFromGroupedResponse(data, groupName, formatLabelDate = true) {
        var labels = [];
        var dataVals = [];

        for (var i = 0; i < data.length; i++) {
            var labelRaw = data[i][groupName];
            if (formatLabelDate) {
                labelRaw = formatDate(labelRaw);
            }

            labels.push(labelRaw);
            dataVals.push(data[i].count);
        }

        return [labels, dataVals];
    }

    _buildBackgroundColorSet(len) {
        var bcolors = [];
        for (var i = 0; i < len; i++) {
            bcolors.push(randomColor());
        }

        return bcolors;
    }

    getUserSignupGraph() {
        let self = this;
        let sql =
            'select ' +
                'count(*), ' +
                'created_at::DATE as signup_date ' +
            'from ' +
                'users ' +
            'group by created_at::DATE ' +
            'order by signup_date ASC;';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    var extractedData = self._extractLabelsAndDataFromGroupedResponse(data, "signup_date");
                    return resolve(self._buildChartJSLineGraph(extractedData[0], "User Signups", extractedData[1], '#2196f3', '#2196f3'));
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getRoomCreationGraph() {
        let self = this;
        let sql =
            'select ' +
                'count(*), ' +
                'created_at::DATE as room_created ' +
            'from ' +
                'rooms ' +
            'group by created_at::DATE ' +
            'order by room_created ASC;'

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    var extractedData = self._extractLabelsAndDataFromGroupedResponse(data, "room_created");
                    return resolve(self._buildChartJSLineGraph(extractedData[0], "Room Creations", extractedData[1], '#76072c', '#f3216a'));
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getSubmissionsCount() {
        let self = this;
        let sql =
            'select ' +
                'count(*) ' +
            'from ' +
                'submissions;'

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    return resolve(data[0]);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getSubmissionsTodayCount() {
        let self = this;
        let sql =
            'select ' +
                'count(*) ' +
            'from ' +
                'submissions ' +
            'where ' +
                'created_at::DATE = NOW()::DATE;';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    return resolve(data[0]);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getProblemsUniqueCount() {
        let self = this;
        let sql =
            'select ' +
                'count(data.*) ' +
            'from (' +
                'select ' +
                    'count(*) ' +
                'from ' +
                    'rooms ' +
                'group by problem_id' +
            ') as data;'

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    return resolve(data[0]);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getActiveRoomsCount() {
        let self = this;
        let sql =
            'select ' +
                'count(r.*) ' +
            'from ' +
                'rooms as r ' +
            'where ' +
                'r.deleted_at is null AND ' +
                'exists ( ' +
                    'select ' +
                        'r.uuid ' +
                    'from ' +
                        'room_members as rm ' +
                    'where ' +
                        'rm.room_uuid = r.uuid AND ' +
                        'not exists ( ' +
                            'select ' +
                                's.uuid ' +
                            'from ' +
                                'submissions as s ' +
                            'where ' +
                                's.room_uuid = r.uuid AND ' +
                                's.user_uuid = rm.participant_user_uuid ' +
                            ') ' +
                        ') AND ' +
                'r.updated_at >= (NOW() - INTERVAL \'1 hours\');';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    return resolve(data[0]);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getRoomUsersPiGraph() {
        let self = this;
        let sql =
            'select ' +
                'count(*) as count, ' +
                'data.count || \' users\' as users_per_room ' +
            'from ' +
                '( ' +
                    'select ' +
                        'count(*) ' +
                    'from ' +
                        'room_members ' +
                    'group by room_uuid ' +
                ') as data ' +
            'group by data.count;';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    var extractedData = self._extractLabelsAndDataFromGroupedResponse(data, "users_per_room", false);

                    var labels = extractedData[0];
                    let dataVals = extractedData[1];
                    var bcolors = self._buildBackgroundColorSet(dataVals.length);

                    return resolve(self._buildChartJSPieGraph(labels, dataVals, bcolors));
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getRoomFinishedPiGraph() {
        let self = this;

        function buildSQL(notVal = "") {
            return 'select ' +
                'count(r.*) ' +
            'from ' +
                'rooms as r ' +
            'where ' +
                'r.deleted_at is null AND ' +
                notVal + 'exists ( ' +
                    'select ' +
                        'r.uuid ' +
                    'from ' +
                        'room_members as rm ' +
                    'where ' +
                        'rm.room_uuid = r.uuid AND ' +
                        'not exists ( ' +
                            'select ' +
                                's.uuid ' +
                            'from ' +
                                'submissions as s ' +
                            'where ' +
                                's.room_uuid = r.uuid AND ' +
                                's.user_uuid = rm.participant_user_uuid ' +
                        ') ' +
                    ');';
        }

        return new Promise(function(resolve, reject) {
            var activeRooms;
            return self._executeRaw(buildSQL())
                .then(function(activeRoomsRes) {
                    activeRooms = activeRoomsRes[0];

                    return self._executeRaw(buildSQL("not "))
                })
                .then(function(notActiveRoomsRes) {
                    var labels = [
                        "room_open",
                        "room_closed",
                    ];
                    var dataVals = [
                        activeRooms.count,
                        notActiveRoomsRes[0].count,
                    ];
                    var bcolors = self._buildBackgroundColorSet(2);

                    return resolve(self._buildChartJSPieGraph(labels, dataVals, bcolors));
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getUserStickiness() {
        let self = this;
        let sql =
            'select ' +
            '((  ' +
            '   SELECT ' +
            '      count(DISTINCT(data.participant_user_uuid)) as sticky_users  ' +
            '   FROM ' +
            '      ( ' +
            '         SELECT ' +
            '            Count(*), ' +
            '            rm.participant_user_uuid, ' +
            '            Min(rm.created_at) AS min_created_at, ' +
            '            Max(rm.created_at) AS max_created_at, ' +
            '            Extract(epoch  ' +
            '         FROM ' +
            '            ( ' +
            '               Max(rm.created_at) - Min(rm.created_at)  ' +
            '            ) ' +
            ') AS epoch_diff_sec  ' +
            '         FROM ' +
            '            room_members AS rm  ' +
            '         GROUP BY ' +
            '            rm.participant_user_uuid  ' +
            '      ) ' +
            '      AS data  ' +
            '   WHERE ' +
            '      data.epoch_diff_sec > 3600)::decimal / (  ' +
            '      select ' +
            '         count(DISTINCT(u.uuid)) as all_users  ' +
            '      from ' +
            '         users as u)::decimal) * 100 as stickiness;';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    return resolve(data[0]);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    _buildTableRow(col1Val, col1SubText, col2Val, col3Val) {
        var itemColor = randomColor();

        return '<ul class="guiz-awards-row guiz-awards-row-even">' +
                    '<li class="guiz-awards-star"><span class="star" style="background-color: ' + itemColor + ';"></span></li>' +
                    '<li class="guiz-awards-title">' + col1Val +
                        '<div class="guiz-awards-subtitle">' + col1SubText + '</div>' +
                    '</li>' +
                    '<li class="guiz-awards-track">' + col2Val + '</li>' +
                    '<li class="guiz-awards-time">' + col3Val + '</li>' +
                '</ul>';
    }

    getTopProblems() {
        let self = this;
        let sql =
            'select ' +
                'count(*) as problem_rooms, ' +
                'problem_id, ' +
                '( ' +
                    'select ' +
                        'count(*) ' +
                    'from ' +
                        'submissions as s ' +
                    'where ' +
                        's.room_uuid in ( ' +
                            'select ' +
                                'rr.uuid ' +
                            'from ' +
                                'rooms as rr ' +
                            'where ' +
                                'rr.problem_id = r.problem_id ' +
                        ') ' +
                ') as problem_submissions ' +
            'from ' +
                'rooms as r ' +
            'group by r.problem_id ' +
            'order by problem_rooms DESC ' +
            'limit 5;';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    var htmlDataRows = "";
                    for (var i = 0; i < data.length; i++) {
                        var currData = data[i];
                        htmlDataRows += self._buildTableRow(
                            currData.problem_id,
                            ((parseInt(currData.problem_submissions) / parseInt(currData.problem_rooms)) * 100).toFixed(2) + "% of rooms submitted.",
                            currData.problem_rooms,
                            currData.problem_submissions,
                        );
                    }

                    return resolve(htmlDataRows);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }

    getTopUsers() {
        let self = this;
        let sql =
            'select ' +
                'u.uuid as user_uuid, ' +
                '(select  ' +
                    'count(*) ' +
                'from ' +
                    'room_members as rm ' +
                'where ' +
                    'rm.participant_user_uuid = u.uuid ' +
                ') as rooms_count, ' +
                '(select ' +
                    'count(*) ' +
                'from ' +
                    'submissions as s ' +
                'where  ' +
                    's.user_uuid = u.uuid ' +
                ') as finished_problems ' +
            'from ' +
                'users as u ' +
            'order by rooms_count DESC ' +
            'limit 5';

        return new Promise(function(resolve, reject) {
            return self._executeRaw(sql)
                .then(function(data) {
                    var htmlDataRows = "";
                    for (var i = 0; i < data.length; i++) {
                        var currData = data[i];
                        htmlDataRows += self._buildTableRow(
                            currData.user_uuid,
                            ((parseInt(currData.finished_problems) / parseInt(currData.rooms_count)) * 100).toFixed(2) + "% of rooms submitted.",
                            currData.rooms_count,
                            currData.finished_problems,
                        );
                    }

                    return resolve(htmlDataRows);
                })
                .catch(function(err) {
                    return reject(err);
                });
        });
    }
}

module.exports = Metrics;