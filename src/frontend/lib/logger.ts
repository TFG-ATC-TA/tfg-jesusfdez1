/**
 * Utilidad de logging que muestra mensajes solo en desarrollo
 * Proporciona métodos de logging que solo funcionan en modo desarrollo
 * para evitar logs innecesarios en producción
 * Incluye métodos para diferentes niveles de logging
 */

/**
 * Objeto logger con métodos de logging condicionales
 * Todos los métodos solo muestran mensajes en modo desarrollo
 * Facilita el debugging sin afectar el rendimiento en producción
 */
export const logger = {
  /**
   * Log de información general
   * Útil para seguimiento de flujo de aplicación
   * @param args - Argumentos a mostrar en consola
   */
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  
  /**
   * Log de errores
   * Captura y muestra errores para debugging
   * @param args - Argumentos del error a mostrar en consola
   */
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args);
    }
  },
  
  /**
   * Log de advertencias
   * Muestra advertencias que no son errores pero requieren atención
   * @param args - Argumentos de la advertencia a mostrar en consola
   */
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  
  /**
   * Log de información
   * Proporciona información contextual útil para debugging
   * @param args - Argumentos informativos a mostrar en consola
   */
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    }
  },
  
  /**
   * Log de debug
   * Información detallada para debugging avanzado
   * @param args - Argumentos de debug a mostrar en consola
   */
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  }
};

// Para compatibilidad hacia atrás, exportamos también como default
export default logger;
