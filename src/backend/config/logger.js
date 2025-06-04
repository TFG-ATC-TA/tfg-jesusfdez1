const { createLogger, format, transports } = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ message }) => message)
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '30d' // Mantener 30 días de logs
    })
  ]
});

module.exports = logger;
