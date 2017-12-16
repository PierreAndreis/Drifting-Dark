import { createLogger, format, transports } from "winston"
import moment from "moment";

const { combine, timestamp, prettyPrint, json, colorize } = format;

const consoleFormat = combine(format.printf(function (info) {
  return `[${process.pid}](${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZZ')}) ${info.level}: ${info.message}`;
}));

let logDestination = process.env.LOGS || `${__dirname}/../../logs/`;

const logger = createLogger({
    level: 'silly',
    format: combine(
        timestamp(),
        prettyPrint(),
        json(),
        colorize(),
      ),
    colorize: true,
    transports: [
      //
      // - Write to all logs with level `silly` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      // - Write Error to console as well
      //
      new transports.Console({ level: 'error', level: 'warn', format: consoleFormat}),
      new transports.File({ filename: `${logDestination}rateLimit.log`, level: 'silly' }),
      new transports.File({ filename: `${logDestination}error.log`, level: 'error' }),
      new transports.File({ filename: `${logDestination}combined.log` })
    ]
  });
  
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
// if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
      format: consoleFormat,
  }));
// }

export default logger;
