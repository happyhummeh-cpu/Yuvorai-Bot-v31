const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp: ts, level, message, stack }) =>
      `[${ts}] ${level.toUpperCase().padEnd(5)}: ${stack || message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app.log'   }),
  ],
});
module.exports = logger;
