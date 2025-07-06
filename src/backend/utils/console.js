/**
 * Sistema de logging personalizado para modos desarrollo y producción
 * Respeta el sistema de logs existente de winston para inicio de sesión
 */

// Determinar el modo basado en NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

/**
 * Console personalizado que solo muestra mensajes en modo desarrollo
 */
const devConsole = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

module.exports = devConsole;