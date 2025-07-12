/**
 * Rutas para gestión de granjas
 * Incluye operaciones CRUD con control de acceso basado en roles
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken, isAdmin } = require('../middleware/auth');
const Farm = require('../models/Farm');
const { validateFarmName, validateFarmId, trimFields, validateRequiredFields } = require('../utils/validators');
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
const { buildCompleteQuery, handlePaginatedResponse } = require('../utils/pagination');

// Middleware
router.use(cors());
router.use(express.json());

/**
 * GET /farm/list - Obtener lista paginada de granjas
 * Los administradores ven todas las granjas, otros usuarios solo las suyas
 */
router.get('/list', verifyToken, async (req, res) => {
  try {
    const searchFields = ['name'];
    let baseQuery = {};
    
    // Control de acceso basado en rol
    if (req.user.role !== 'Administrador') {
      baseQuery.users = req.user.id;
    }

    const query = buildCompleteQuery(req, searchFields, baseQuery);
    const result = await handlePaginatedResponse(res, Farm, query, {
      select: '_id name idname',
      sort: { name: 1 }
    });

    return paginatedResponse(res, result.data, result.totalItems, result.totalPages, result.currentPage);
  } catch (error) {
    return internalError(res, 'Error obteniendo datos de las granjas', error);
  }
});

/**
 * POST /farm - Crear nueva granja
 * Solo accesible por administradores
 * Incluye validaciones de nombre e ID único
 */
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    let { name, idname } = trimFields(req.body);

    // Validar campos obligatorios
    const requiredFields = ['name', 'idname'];
    const validation = validateRequiredFields({ name, idname }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, 'Nombre e ID de la granja son obligatorios');
    }

    // Validar nombre de granja
    const nameValidation = validateFarmName(name);
    if (!nameValidation.isValid) {
      return badRequest(res, nameValidation.message);
    }

    // Validar ID de granja
    const idValidation = validateFarmId(idname);
    if (!idValidation.isValid) {
      return badRequest(res, idValidation.message);
    }

    // Verificar si ya existe una granja con este ID
    const existingFarm = await Farm.findOne({ idname });
    if (existingFarm) {
      return conflict(res, 'La granja con este ID ya existe');
    }

    const newFarm = new Farm({ name, idname });
    await newFarm.save();
    
    return created(res, newFarm, 'Granja creada con éxito');
  } catch (error) {
    return internalError(res, 'Error al crear la granja', error);
  }
});

/**
 * GET /farm/listName - Obtener lista simple de granjas (solo nombre e ID)
 * Para uso en dropdowns y selecciones
 */
router.get('/listName', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'Administrador') {
      query.users = req.user.id;
    }
    
    const farms = await Farm.find(query).select('_id name');
    return res.json(farms);
  } catch (error) {
    return internalError(res, 'Error obteniendo datos de las granjas', error);
  }
});

/**
 * GET /farm/:id - Obtener granja específica por ID
 * Verifica permisos de acceso del usuario
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const farm = await Farm.findById(id).select('_id name idname users');
    
    if (!farm) {
      return notFound(res, 'Granja no encontrada');
    }

    // Verificar que el usuario tenga acceso a esta granja
    if (req.user.role !== 'Administrador' && !farm.users.includes(req.user.id)) {
      return unauthorized(res, 'No tienes permisos para acceder a esta granja');
    }

    // No incluir usuarios en la respuesta por seguridad
    const farmResponse = {
      _id: farm._id,
      name: farm.name,
      idname: farm.idname
    };

    return res.json(farmResponse);
  } catch (error) {
    return internalError(res, 'Error al obtener la granja', error);
  }
});

/**
 * PUT /farm/:id - Actualizar granja existente
 * Solo accesible por administradores
 * Incluye validaciones de unicidad del ID
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let { name, idname } = trimFields(req.body);

    // Validar campos obligatorios
    const requiredFields = ['name', 'idname'];
    const validation = validateRequiredFields({ name, idname }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, 'Nombre e ID de la granja son obligatorios');
    }

    // Validar nombre de granja (versión más permisiva para actualización)
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-\'.,;:!?()]{2,50}$/;
    if (!nameRegex.test(name)) {
      return badRequest(res, 'El nombre debe contener entre 2 y 50 caracteres y puede contener letras, números, espacios, guiones, apóstrofes y signos de puntuación');
    }

    // Validar ID de granja
    const idValidation = validateFarmId(idname);
    if (!idValidation.isValid) {
      return badRequest(res, idValidation.message);
    }

    // Verificar si existe otra granja con el mismo idname
    const existingFarm = await Farm.findOne({ idname, _id: { $ne: id } });
    if (existingFarm) {
      return conflict(res, 'Ya existe una granja con este ID');
    }

    const updatedFarm = await Farm.findByIdAndUpdate(
      id,
      { name, idname },
      { new: true, runValidators: true }
    );

    if (!updatedFarm) {
      return notFound(res, 'Granja no encontrada');
    }

    return updated(res, updatedFarm, 'Granja actualizada con éxito');
  } catch (error) {
    return internalError(res, 'Error al actualizar la granja', error);
  }
});

/**
 * DELETE /farm/:id - Eliminar granja
 * Solo accesible por administradores
 * Limpia automáticamente las referencias en otros modelos
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try { 
    const { id } = req.params;
    const deletedFarm = await Farm.findByIdAndDelete(id);
    
    if (!deletedFarm) {
      return notFound(res, 'Granja no encontrada');
    }

    return deleted(res, 'Granja eliminada con éxito');
  } catch (error) {
    return internalError(res, 'Error al eliminar la granja', error);
  }
});

/**
 * GET /farm/:farmId/access - Verificar acceso a granja específica
 * Verifica si el usuario tiene permisos para acceder a la granja
 */
router.get('/:farmId/access', verifyToken, async (req, res) => {
  try {
    const farm = await Farm.findOne({ idname: req.params.farmId }).select('-__v');
    if (!farm) {
      return notFound(res, 'Granja no encontrada');
    }

    if (req.user.role === 'Administrador' || farm.users.includes(req.user.id)) {
      const { users, ...farmData } = farm.toObject();
      return res.json(farmData);
    }
    
    return unauthorized(res, 'No tienes acceso a esta granja');
  } catch (error) {
    return internalError(res, 'Error verificando acceso a la granja', error);
  }
});

module.exports = router;
