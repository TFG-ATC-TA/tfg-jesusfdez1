/**
 * Middleware de autenticación y autorización
 * Maneja la verificación de tokens JWT y control de acceso por roles
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar token JWT
 * Extrae y valida el token del header Authorization
 * Añade la información del usuario decodificada a req.user
 */
module.exports.verifyToken = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.error('No authorization header provided');
    return res.status(401).json({ 
      success: false,
      message: 'Acceso denegado. No hay token proporcionado.' 
    });
  }

  // Extraer el token del header "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  if (!token) {
    console.error('No token found in authorization header');
    return res.status(401).json({ 
      success: false,
      message: 'Token no encontrado en el header de autorización.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ 
      success: false,
      message: 'Token inválido o expirado.' 
    });
  }
};

/**
 * Middleware para verificar rol de administrador
 * Restringe el acceso solo a usuarios con rol "Administrador"
 */
module.exports.isAdmin = function (req, res, next) {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para administradores.' });
  }
  next();
};
