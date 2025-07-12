/**
 * Utilidades para manejar respuestas HTTP de manera consistente
 * Proporciona funciones estandarizadas para diferentes tipos de respuestas
 */

/**
 * Respuesta para errores de validación (400 Bad Request)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @returns {object} - Respuesta JSON con error 400
 */
const badRequest = (res, message) => {
  return res.status(400).json({
    success: false,
    message
  });
};

/**
 * Respuesta para errores de autenticación (401 Unauthorized)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error (opcional)
 * @returns {object} - Respuesta JSON con error 401
 */
const unauthorized = (res, message = 'No tienes permisos para realizar esta acción') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Respuesta para errores de autorización (403 Forbidden)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error (opcional)
 * @returns {object} - Respuesta JSON con error 403
 */
const forbidden = (res, message = 'Acceso denegado') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * Respuesta para recursos no encontrados (404 Not Found)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error (opcional)
 * @returns {object} - Respuesta JSON con error 404
 */
const notFound = (res, message = 'Recurso no encontrado') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * Respuesta para conflictos de datos (409 Conflict)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @returns {object} - Respuesta JSON con error 409
 */
const conflict = (res, message) => {
  return res.status(409).json({
    success: false,
    message
  });
};

/**
 * Respuesta para errores internos del servidor (500 Internal Server Error)
 * Incluye detalles del error solo en modo desarrollo
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error (opcional)
 * @param {object} error - Objeto de error (opcional)
 * @returns {object} - Respuesta JSON con error 500
 */
const internalError = (res, message = 'Error interno del servidor', error = null) => {
  const response = {
    success: false,
    message
  };
  
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message || error;
  }
  
  return res.status(500).json(response);
};

/**
 * Respuesta para listados paginados (200 OK)
 * @param {object} res - Objeto response de Express
 * @param {array} data - Array de datos
 * @param {number} totalItems - Total de elementos
 * @param {number} totalPages - Total de páginas
 * @param {number} currentPage - Página actual
 * @returns {object} - Respuesta JSON con datos paginados
 */
const paginatedResponse = (res, data, totalItems, totalPages, currentPage) => {
  return res.json({
    data,
    totalItems,
    totalPages,
    currentPage
  });
};

/**
 * Respuesta para recursos creados exitosamente (201 Created)
 * @param {object} res - Objeto response de Express
 * @param {object} data - Datos del recurso creado (opcional)
 * @param {string} message - Mensaje de éxito (opcional)
 * @returns {object} - Respuesta JSON con código 201
 */
const created = (res, data, message = 'Recurso creado exitosamente') => {
  return res.status(201).json({
    success: true,
    message,
    data
  });
};

/**
 * Respuesta para recursos actualizados exitosamente (200 OK)
 * @param {object} res - Objeto response de Express
 * @param {object} data - Datos del recurso actualizado (opcional)
 * @param {string} message - Mensaje de éxito (opcional)
 * @returns {object} - Respuesta JSON con código 200
 */
const updated = (res, data, message = 'Recurso actualizado exitosamente') => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

/**
 * Respuesta para recursos eliminados exitosamente (200 OK)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de éxito (opcional)
 * @returns {object} - Respuesta JSON con código 200
 */
const deleted = (res, message = 'Recurso eliminado exitosamente') => {
  return res.status(200).json({
    success: true,
    message,
    data: null
  });
};

module.exports = {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,
  paginatedResponse,
  created,
  updated,
  deleted
}; 