/**
 * Utilidades de validación para el backend
 * Incluye validaciones para contraseñas, nombres, emails y campos obligatorios
 */

/**
 * Valida la fortaleza de una contraseña
 * Verifica que cumpla con los requisitos de seguridad mínimos
 * @param {string} password - Contraseña a validar
 * @returns {object} - Objeto con isValid y failedRequirements
 */
const validatePasswordStrength = (password) => {
  const requirements = [
    { regex: /.{8,}/, text: "Al menos 8 caracteres" },
    { regex: /[0-9]/, text: "Al menos 1 número" },
    { regex: /[a-z]/, text: "Al menos 1 letra minúscula" },
    { regex: /[A-Z]/, text: "Al menos 1 letra mayúscula" },
  ];

  const failedRequirements = requirements
    .filter(req => !req.regex.test(password))
    .map(req => req.text);

  return {
    isValid: failedRequirements.length === 0,
    failedRequirements
  };
};

/**
 * Valida nombres de usuario
 * Permite letras, espacios y caracteres acentuados
 * @param {string} name - Nombre a validar
 * @returns {object} - Objeto con isValid y message
 */
const validateUserName = (name) => {
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
  return {
    isValid: nameRegex.test(name),
    message: 'El nombre debe contener al menos 2 caracteres y solo puede contener letras'
  };
};

/**
 * Valida nombres de granjas y equipos
 * Permite letras, números, espacios y caracteres acentuados
 * @param {string} name - Nombre a validar
 * @returns {object} - Objeto con isValid y message
 */
const validateFarmName = (name) => {
  const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
  return {
    isValid: nameRegex.test(name),
    message: 'El nombre debe contener entre 2 y 50 caracteres y solo puede contener letras, números y espacios'
  };
};

/**
 * Valida formato de email
 * Verifica que tenga un formato de email válido
 * @param {string} email - Email a validar
 * @returns {object} - Objeto con isValid y message
 */
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return {
    isValid: emailRegex.test(email),
    message: 'El formato del email no es válido'
  };
};

/**
 * Valida ID de granja
 * Permite letras minúsculas, números y guiones
 * @param {string} idname - ID a validar
 * @returns {object} - Objeto con isValid y message
 */
const validateFarmId = (idname) => {
  const idRegex = /^[a-z0-9-]{2,30}$/;
  return {
    isValid: idRegex.test(idname),
    message: 'El ID debe contener entre 2 y 30 caracteres y solo puede contener letras minúsculas, números y guiones'
  };
};

/**
 * Elimina espacios en blanco de los campos de entrada
 * Aplica trim() a todos los campos string de un objeto
 * @param {object} obj - Objeto con campos a procesar
 * @returns {object} - Objeto con campos procesados
 */
const trimFields = (obj) => {
  const trimmed = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      trimmed[key] = obj[key].trim();
    } else {
      trimmed[key] = obj[key];
    }
  });
  return trimmed;
};

/**
 * Valida que todos los campos obligatorios estén presentes
 * @param {object} fields - Objeto con los campos a validar
 * @param {array} requiredFields - Array con los nombres de campos obligatorios
 * @returns {object} - Objeto con isValid, missingFields y message
 */
const validateRequiredFields = (fields, requiredFields) => {
  const missingFields = requiredFields.filter(field => !fields[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
    message: 'Faltan campos obligatorios'
  };
};

module.exports = {
  validatePasswordStrength,
  validateUserName,
  validateFarmName,
  validateEmail,
  validateFarmId,
  trimFields,
  validateRequiredFields
}; 