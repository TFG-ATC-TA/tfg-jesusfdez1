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

router.get('/list', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.searchTerm || '';
    const roles = req.query.roles ? req.query.roles.split(',') : [];
    const filters = req.query.filters ? JSON.parse(decodeURIComponent(req.query.filters)) : {};

    let query = {
      _id: { $ne: req.user.id } // Exclude the requesting user
    };
    
    if (req.user.role === 'Administrador') { 
      if (searchTerm) {
        query.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { surname: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ];
      }
      if (roles.length > 0) {
        query.role = { $in: roles };
      }

      if (req.query.farmId) {
        query.farms = req.query.farmId;
      }

      // Aplicar filtros adicionales
      Object.keys(filters).forEach(key => {
        if (filters[key].length > 0) {
          query[key] = { $in: filters[key] };
        }
      });

      const totalItems = await User.countDocuments(query);
      const users = await User.find(query)
        .select('_id name surname email role')
        .skip(skip)
        .limit(limit);
      const totalPages = Math.ceil(totalItems / limit);

      res.json({ data: users, totalItems, totalPages, currentPage: page });
    } else {
      res.status(401).json({ message: 'No tienes permisos para acceder a esta información' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos de los usuarios' });
  }
});


router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return res.status(401).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    let { name, surname, email, password, role, farms } = req.body;
    
    // Trim all input fields
    name = name ? name.trim() : '';
    surname = surname ? surname.trim() : '';
    email = email ? email.trim() : '';
    
    if (!name || !email || !role || !password) { 
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Validate name and surname format
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        message: 'El nombre debe contener al menos 2 caracteres y solo puede contener letras' 
      });
    }

    if (surname && !nameRegex.test(surname)) {
      return res.status(400).json({ 
        message: 'El apellido debe contener al menos 2 caracteres y solo puede contener letras' 
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El formato del email no es válido' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email introducida ya está registrado en el sistema. Introduce otro distinto' });
    }

    const passwordHash = password;
    const newUser = new User({ name, surname, email, passwordHash, role, farms: farms || [] });

    await newUser.save();

    res.json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error creando el usuario: ' + error });
  }
});

router.put('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return res.status(401).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(403).json({ message: 'No puedes modificarte a ti mismo por esta ruta. Usa /update-basic en su lugar' });
    }

    let { name, surname, email, password, role, farms } = req.body;

    // Trim all input fields
    name = name ? name.trim() : '';
    surname = surname ? surname.trim() : '';
    email = email ? email.trim() : '';

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Validate name and surname format
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        message: 'El nombre debe contener al menos 2 caracteres y solo puede contener letras' 
      });
    }

    if (surname && !nameRegex.test(surname)) {
      return res.status(400).json({ 
        message: 'El apellido debe contener al menos 2 caracteres y solo puede contener letras' 
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El formato del email no es válido' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.name = name;
    user.email = email;
    user.role = role;
    user.surname = surname;
    user.farms = farms;

    if (password) {
      user.passwordHash = password;
    }

    await user.save();

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando el usuario: ' + error});
  }
});

router.delete('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return res.status(401).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    const { userId } = req.params;

    // Evitar que un usuario se borre a sí mismo
    if (userId === req.user.id) {
      return res.status(403).json({ message: 'No puedes eliminarte a ti mismo' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando el usuario' });
  }
});

router.get('/:userId', verifyToken, async (req, res) => {
  try {
    let user;
    if (req.user.role === 'Administrador') {
      user = await User.findOne({ _id: req.params.userId }).select('_id name surname email role farms'); 
      res.json(user);
    } else {
      res.status(401).json({ message: 'No tienes permisos para acceder a esta información' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos de los usuarios' });
  }
});


router.post('/update-basic', verifyToken, async (req, res) => {
  try {
    let { name, surname, email } = req.body;
    
    // Trim all input fields to remove extra whitespace
    name = name ? name.trim() : '';
    surname = surname ? surname.trim() : '';
    email = email ? email.trim() : '';

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Validate name (at least 2 characters, only letters, spaces and some accents)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        message: 'El nombre debe contener al menos 2 caracteres y solo puede contener letras' 
      });
    }

    // Validate surname if provided
    if (surname && !nameRegex.test(surname)) {
      return res.status(400).json({ 
        message: 'El apellido debe contener al menos 2 caracteres y solo puede contener letras' 
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El formato del email no es válido' });
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