var express = require('express');
var router = express.Router();
const cors = require('cors');
const User = require('../models/User');
const Farm = require('../models/Farm');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');



// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());


router.post('/update-basic', verifyToken, async (req, res) => {
  try {
    const { name, surname, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.name = name;
    user.surname = surname;
    user.email = email;

    await user.save();

    // Actualizar los datos de sesión
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
      message: 'Datos básicos actualizados correctamente',
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando los datos básicos: ' + error });
  }
});

router.post('/update-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

      user.passwordHash = newPassword;
      await user.save();
      res.json({ message: 'Contraseña actualizada correctamente' });
    

  } catch (error) {
    res.status(500).json({ message: 'Error actualizando la contraseña: ' + error });
  }
});

module.exports = router;