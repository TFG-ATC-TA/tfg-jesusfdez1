const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports.verifyToken = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Acceso denegado. No hay token proporcionado.' });

  // Extraer el token del header "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports.isAdmin = function (req, res, next) {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para administradores.' });
  }
  next();
};
