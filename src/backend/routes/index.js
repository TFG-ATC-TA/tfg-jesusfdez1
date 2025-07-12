/**
 * Rutas principales del sistema
 * Incluye autenticación de usuarios con rate limiting y logging
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Farm = require('../models/Farm');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger'); // Logging de login
const dotenv = require('dotenv'); // Token generation imports

// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());

/**
 * Configuración de rate limiting para intentos de login
 * Limita a 5 intentos por IP en 30 minutos
 * Penalización de 24 horas tras exceder el límite
 */
const loginLimiter = rateLimit({
  windowMs: 30 * 60  * 1000, // 30 minutos
  max: 5, // máximo de intentos fallidos
  headers: true, // Incluye información de los headers de rate limit
  keyGenerator: (req) => req.ip, // Usa la IP del cliente para limitar los intentos
  handler: (req, res) => {
    res.status(429).json({
      message: 'Demasiados intentos de autentificación fallidos, inténtalo más tarde.'
    });
  },
  resetTime: 24 * 60 * 60 * 1000 // 24 horas de penalización
});

/**
 * POST /login - Autenticación de usuarios
 * Incluye rate limiting, logging detallado y generación de JWT
 * Valida credenciales y registra intentos de acceso
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  const timestamp = new Date().toISOString();

  // Validación básica
  if (!email || !password) {
    logger.info(`${timestamp} | ${email || 'NO_EMAIL'} | ${ip} | VALIDATION_FAIL`);
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.info(`${timestamp} | ${email} | ${ip} | FAIL`);
      return res.status(400).json({ message: 'Credenciales inválidas. Por favor, verifica tu correo electrónico y contraseña.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.info(`${timestamp} | ${email} | ${ip} | FAIL`);
      return res.status(400).json({ message: 'Credenciales inválidas. Por favor, verifica tu correo electrónico y contraseña.' });
    }

    logger.info(`${timestamp} | ${email} | ${ip} | SUCCESS`);

    const payload = {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    logger.error(`${timestamp} | ${email} | ${ip} | ERROR | ${err.message}`);
    res.status(500).json({ message: 'Error del servidor' + err.message });
  }
});

module.exports = router;