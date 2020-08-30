const winston = require('winston');
const Constants = require('../../constants/constants');

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
            // TODO: Add Sentry
        }

        this.logger = winston.createLogger({
            transports: transports
        });
    }

    error(errMsg, data = null) {
        this.logger.error(errMsg + " %o", data);
    }

    info(msg, data = null) {
        this.logger.info(msg + " %o", data);
    }

    warn(msg, data = null) {
        this.logger.warn(msg + " %o", data);
    }
}

module.exports = Logger;