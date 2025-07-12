/**
 * Rutas para gestión de usuarios
 * Incluye operaciones CRUD con validaciones y control de acceso
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const User = require('../models/User');
const Farm = require('../models/Farm');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { 
  validatePasswordStrength, 
  validateUserName, 
  validateEmail, 
  trimFields, 
  validateRequiredFields 
} = require('../utils/validators');
const { 
  paginatedResponse, 
  badRequest, 
  unauthorized, 
  forbidden,
  notFound, 
  conflict, 
  internalError, 
  created, 
  updated, 
  deleted 
} = require('../utils/responseHandler');
const { 
  buildCompleteQuery, 
  handlePaginatedResponse 
} = require('../utils/pagination');

// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());

/**
 * GET /user/list - Obtener lista paginada de usuarios
 * Solo accesible por administradores
 * Incluye filtros por roles y granjas
 */
router.get('/list', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const searchFields = ['name', 'surname', 'email'];
    const baseQuery = { _id: { $ne: req.user.id } }; // Exclude the requesting user
    
    // Añadir filtros específicos
    if (req.query.roles) {
      const roles = req.query.roles.split(',');
      if (roles.length > 0) {
        baseQuery.role = { $in: roles };
      }
    }

    if (req.query.farmId) {
      baseQuery.farms = req.query.farmId;
    }

    const query = buildCompleteQuery(req, searchFields, baseQuery);
    const result = await handlePaginatedResponse(res, User, query, {
      select: '_id name surname email role',
      sort: { surname: 1 }
    });

    return paginatedResponse(res, result.data, result.totalItems, result.totalPages, result.currentPage);
  } catch (error) {
    return internalError(res, 'Error obteniendo datos de los usuarios', error);
  }
});

/**
 * POST /user - Crear nuevo usuario
 * Solo accesible por administradores
 * Incluye validaciones completas de datos
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    let { name, surname, email, password, role, farms } = trimFields(req.body);
    
    // Validar campos obligatorios
    const requiredFields = ['name', 'email', 'role', 'password'];
    const validation = validateRequiredFields({ name, email, role, password }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, validation.message);
    }

    // Validar nombre
    const nameValidation = validateUserName(name);
    if (!nameValidation.isValid) {
      return badRequest(res, nameValidation.message);
    }

    // Validar apellido si se proporciona
    if (surname) {
      const surnameValidation = validateUserName(surname);
      if (!surnameValidation.isValid) {
        return badRequest(res, surnameValidation.message);
      }
    }

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return badRequest(res, emailValidation.message);
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflict(res, 'El email introducido ya está registrado en el sistema. Introduce otro distinto');
    }

    // Validar contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return badRequest(res, 'La contraseña no cumple con los requisitos de seguridad', {
        failedRequirements: passwordValidation.failedRequirements
      });
    }

    const newUser = new User({ 
      name, 
      surname, 
      email, 
      passwordHash: password, 
      role, 
      farms: farms || [] 
    });

    await newUser.save();

    return created(res, null, 'Usuario creado correctamente');
  } catch (error) {
    return internalError(res, 'Error creando el usuario', error);
  }
});

/**
 * PUT /user/:userId - Actualizar usuario existente
 * Solo accesible por administradores
 * No permite auto-modificación
 */
router.put('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const { userId } = req.params;

    if (userId === req.user.id) {
      return forbidden(res, 'No puedes modificarte a ti mismo por esta ruta. Usa /update-basic en su lugar');
    }

    let { name, surname, email, password, role, farms } = trimFields(req.body);

    // Validar campos obligatorios
    const requiredFields = ['name', 'email', 'role'];
    const validation = validateRequiredFields({ name, email, role }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, validation.message);
    }

    // Validar nombre
    const nameValidation = validateUserName(name);
    if (!nameValidation.isValid) {
      return badRequest(res, nameValidation.message);
    }

    // Validar apellido si se proporciona
    if (surname) {
      const surnameValidation = validateUserName(surname);
      if (!surnameValidation.isValid) {
        return badRequest(res, surnameValidation.message);
      }
    }

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return badRequest(res, emailValidation.message);
    }

    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    // Actualizar campos
    user.name = name;
    user.email = email;
    user.role = role;
    user.surname = surname;
    user.farms = farms;

    // Validar y actualizar contraseña si se proporciona
    if (password) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return badRequest(res, 'La contraseña no cumple con los requisitos de seguridad', {
          failedRequirements: passwordValidation.failedRequirements
        });
      }
      user.passwordHash = password;
    }

    await user.save();

    return updated(res, null, 'Usuario actualizado correctamente');
  } catch (error) {
    return internalError(res, 'Error actualizando el usuario', error);
  }
});

/**
 * DELETE /user/:userId - Eliminar usuario
 * Solo accesible por administradores
 * No permite auto-eliminación
 */
router.delete('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const { userId } = req.params;

    // Evitar que un usuario se borre a sí mismo
    if (userId === req.user.id) {
      return forbidden(res, 'No puedes eliminarte a ti mismo');
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    return deleted(res, 'Usuario eliminado correctamente');
  } catch (error) {
    return internalError(res, 'Error eliminando el usuario', error);
  }
});

/**
 * GET /user/:userId - Obtener usuario específico
 * Solo accesible por administradores
 */
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const user = await User.findOne({ _id: req.params.userId })
      .select('_id name surname email role farms');
    
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    return res.json(user);
  } catch (error) {
    return internalError(res, 'Error obteniendo datos de los usuarios', error);
  }
});


/**
 * POST /user/update-basic - Actualizar datos básicos del usuario actual
 * Permite a cualquier usuario actualizar su información personal
 * Genera un nuevo token con los datos actualizados
 */
router.post('/update-basic', verifyToken, async (req, res) => {
  try {
    let { name, surname, email } = trimFields(req.body);

    // Validar campos obligatorios
    const requiredFields = ['name', 'email'];
    const validation = validateRequiredFields({ name, email }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, validation.message);
    }

    // Validar nombre
    const nameValidation = validateUserName(name);
    if (!nameValidation.isValid) {
      return badRequest(res, nameValidation.message);
    }

    // Validar apellido si se proporciona
    if (surname) {
      const surnameValidation = validateUserName(surname);
      if (!surnameValidation.isValid) {
        return badRequest(res, surnameValidation.message);
      }
    }

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return badRequest(res, emailValidation.message);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
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

    return res.json({ 
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
    return internalError(res, 'Error actualizando los datos básicos', error);
  }
});

/**
 * POST /user/update-password - Actualizar contraseña del usuario actual
 * Requiere la contraseña actual para validar la identidad
 * Incluye validaciones de fortaleza de contraseña
 */
router.post('/update-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validar campos obligatorios
    const requiredFields = ['currentPassword', 'newPassword'];
    const validation = validateRequiredFields({ currentPassword, newPassword }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, validation.message);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return badRequest(res, 'Contraseña actual incorrecta');
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return badRequest(res, 'La nueva contraseña no cumple con los requisitos de seguridad', {
        failedRequirements: passwordValidation.failedRequirements
      });
    }

    user.passwordHash = newPassword;
    await user.save();
    
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return internalError(res, 'Error actualizando la contraseña', error);
  }
});

module.exports = router;