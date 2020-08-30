const winston = require('winston');
const Constants = require('../../constants/constants');

const myConsoleFormat = winston.format.printf(function (info) {
    return `${info.level} (${info.timestamp}): ${info.message}`;
});

class Logger {
    constructor() {
        var env = Constants.SERVER_ENV;

        var transports = [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.splat(),
                    winston.format.timestamp(),
                    myConsoleFormat,
                )
            })
        ];

        if (env == "production") {
            // TODO: Add Sentry
        }

        this.logger = winston.createLogger({
            transports: transports,
            defaultMeta: { service: 'user-service' },
        });
    }

    error(errMsg, data = null) {
        this.logger.error(errMsg + "\nData: %o", data);
    }

    info(msg, data = null) {
        this.logger.info(msg + "\nData: %o", data);
    }
}

module.exports = Logger;