import app from "~/app";
import winston from "winston"

const {PORT = 8080} = process.env;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`)); // eslint-disable-line no-console

const logger = winston.createLogger({
    level: 'silly',
    format: winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `silly` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
logger.add(new winston.transports.Console({
    format: winston.format.simple()
}));
}

logger.info('test info')
logger.error('test error')
logger.debug('test debug')

