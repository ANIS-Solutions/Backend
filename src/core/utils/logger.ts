import config from '@/config/base';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

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
/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string */

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) log += `\n${stack}`;
    const metaString = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : '';
    if (metaString && metaString !== '{}') log += `\n${metaString}`;
    return log;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    silent: !config.IS_DEV_ENV,
    format: consoleFormat,
  }),
];

// Skip file transports in test env (logs/ may be owned by Docker root)
if (!config.IS_TEST_ENV) {
  const dailyRotateTransport = new DailyRotateFile({
    filename: 'logs/api-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '3d',
    format: fileFormat,
  });

  const errorRotateTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '10d',
    level: 'error',
    format: fileFormat,
  });

  transports.push(dailyRotateTransport, errorRotateTransport);
}

const logger = winston.createLogger({
  level: config.IS_DEV_ENV ? 'debug' : 'info',
  levels,
  transports,
});

export default logger;
