const winston = require('winston');
const Constants = require('../../constants/constants');
const Secrets = require('../../config/secrets');
var Rollbar = require("rollbar");

const myConsoleFormat = winston.format.printf(function (info) {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

class Logger {
    constructor(source) {
        var env = Constants.SERVER_ENV;

        var transports = [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.splat(),
                    winston.format.timestamp(),
                    winston.format.label({ label: source }),
                    myConsoleFormat,
                )
            })
        ];

        if (env == "production") {
            this.rollbar = new Rollbar({
                accessToken: Secrets.ROLLBAR_ACCESS_CODE,
                captureUncaught: true,
                captureUnhandledRejections: true
            });
        }

        this.logger = winston.createLogger({
            transports: transports
        });
    }

    error(errMsg, data = null) {
        let self = this;
        this.rollbar.error(errMsg, null, data, function() {
            self.logger.error(errMsg + " %o", data);
        });
    }

    warn(msg, data = null) {
        let self = this;
        this.rollbar.warn(msg, null, data, function() {
            self.logger.warn(msg + " %o", data);
        });
    }

    info(msg, data = null) {
        this.logger.info(msg + " %o", data);
    }
}

module.exports = Logger;