const Promise = require('bluebird');
const Logger = require('../observability/logging/logger');

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

    _extractLabelsAndDataFromGroupedResponse(data, groupName) {
        var labels = [];
        var dataVals = [];

        for (var i = 0; i < data.length; i++) {
            labels.push(data[i][groupName]);
            dataVals.push(data[i].count);
        }

        return [labels, dataVals];
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
}

module.exports = Metrics;