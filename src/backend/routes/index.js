var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Farm = require('../models/Farm');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');


// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());


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

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas. Por favor, verifica tu correo electrónico y contraseña.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas. Por favor, verifica tu correo electrónico y contraseña.' });
    }

    //Imprimir el usuario
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
    res.status(500).json({ message: 'Error del servidor' + err.message });
  }
});

module.exports = router;