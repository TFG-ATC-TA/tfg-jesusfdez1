/**
 * Sistema de logging personalizado para modos desarrollo y producción
 * Respeta el sistema de logs existente de winston para inicio de sesión
 */

/**
 * Función para determinar si está en modo desarrollo
 * Se recalcula dinámicamente para permitir cambios en NODE_ENV durante tests
 */
const isDevelopmentMode = () => {
  const env = process.env.NODE_ENV;
  return env === 'development' || env === 'dev';
};

/**
 * Console personalizado que solo muestra mensajes en modo desarrollo
 */
const devConsole = {
  log: (...args) => {
    if (isDevelopmentMode()) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopmentMode()) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopmentMode()) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopmentMode()) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopmentMode()) {
      console.debug(...args);
    }
  }
};

module.exports = devConsole;