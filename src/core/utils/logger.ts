import config from '@config/base';
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);
/* eslint-disable @typescript-eslint/restrict-template-expressions */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const logger = winston.createLogger({
  level: config.IS_DEV_ENV ? 'debug' : 'warn',
  levels,
  transports: [
    new winston.transports.Console({
      format: format,
    }),
    // new winston.transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    // }),
  ],
});

export default logger;
