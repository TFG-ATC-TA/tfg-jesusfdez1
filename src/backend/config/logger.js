/**
 * Configuración del sistema de logging con Winston
 * Maneja logs de acceso con rotación diaria y compresión
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Configuración del logger principal
 * Utiliza Winston para logging estructurado con rotación de archivos
 */
const logger = createLogger({
  level: 'info', // Nivel mínimo de logging
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Añadir timestamp
    format.printf(({ message }) => message) // Formato simple del mensaje
  ),
  transports: [
    // Transporte para archivos con rotación diaria
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/access-%DATE%.log'), // Patrón de nombre con fecha
      datePattern: 'YYYY-MM-DD', // Formato de fecha para rotación
      zippedArchive: false, // No comprimir archivos antiguos
      maxSize: '20m', // Tamaño máximo por archivo
      maxFiles: '30d' // Mantener 30 días de logs
    })
  ]
});

module.exports = logger;
