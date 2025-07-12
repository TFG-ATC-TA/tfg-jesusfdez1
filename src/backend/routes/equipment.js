/**
 * Rutas para gestión de equipos de la granja
 * Incluye operaciones CRUD con control de acceso basado en granjas
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const Farm = require('../models/Farm');

// Importar el sistema de console personalizado
const devConsole = require('../utils/console');
const { validateFarmName, trimFields, validateRequiredFields } = require('../utils/validators');
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
 * GET /equipment/listName - Obtener lista simple de equipos (solo nombre e ID)
 * Para uso en dropdowns y selecciones
 * Control de acceso basado en granjas del usuario
 */
router.get('/listName', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'Administrador') {
      // Para usuarios regulares, mostrar equipos de sus granjas
      const userFarms = await Farm.find({ users: req.user.id }).select('_id');
      const farmIds = userFarms.map(farm => farm._id);
      query.farm = { $in: farmIds };
    }
    
    const equipments = await Equipment.find(query).select('_id name');
    return res.json(equipments);
  } catch (error) {
    return internalError(res, 'Error obteniendo datos de los equipos', error);
  }
});

/**
 * GET /equipment/list - Obtener lista paginada de equipos
 * Control de acceso basado en granjas del usuario
 * Incluye filtros por tipo y granja
 */
router.get('/list', verifyToken, async (req, res) => {
  try {
    const searchFields = ['name', 'description'];
    let baseQuery = {};
    
    // Control de acceso basado en rol
    if (req.user.role !== 'Administrador') {
      // Para usuarios regulares, sólo mostrar equipos de sus granjas
      const userFarms = await Farm.find({ users: req.user.id }).select('_id');
      const farmIds = userFarms.map(farm => farm._id);
      baseQuery.farm = { $in: farmIds };
    }
    
    // Filtrar por tipos si se proporcionan
    if (req.query.types) {
      const types = req.query.types.split(',');
      if (types.length > 0) {
        baseQuery.type = { $in: types };
      }
    }
    
    // Filtrar por granja específica
    if (req.query.farmId) {
      baseQuery.farm = req.query.farmId;
    }

    const query = buildCompleteQuery(req, searchFields, baseQuery);
    const result = await handlePaginatedResponse(res, Equipment, query, {
      select: '_id name type devices',
      sort: { name: 1 }
    });

    // Enviar también la longitud de devices
    const equipmentsWithDeviceCount = result.data.map(equipment => ({
      ...equipment.toObject(),
      deviceCount: equipment.devices.length
    }));

    return paginatedResponse(res, equipmentsWithDeviceCount, result.totalItems, result.totalPages, result.currentPage);
  } catch (error) {
    devConsole.error('Error en listado de equipos:', error);
    return internalError(res, 'Error obteniendo datos de los equipos', error);
  }
});

/**
 * GET /equipment/listTanks - Obtener lista de tanques de una granja específica
 * Solo muestra tanques de leche de la granja especificada
 * Verifica permisos de acceso a la granja
 */
router.get('/listTanks', verifyToken, async (req, res) => {
  try {
    const farmId = req.query.farmId;
    
    // Verificar que se proporciona un farmId
    if (!farmId) {
      return badRequest(res, 'Se requiere el ID de la granja');
    }
    
    // Verificar que la granja existe
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return notFound(res, 'Granja no encontrada');
    }
    
    // Verificar que el usuario tiene acceso a esta granja
    const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
    if (!hasAccess) {
      return unauthorized(res, 'No tienes acceso a esta granja');
    }
    
    // Obtener sólo los tanques de leche de la granja especificada
    const tanks = await Equipment.find({
      type: "Tanque de leche",
      farm: farmId
    }).select('_id name');
    
    return res.json(tanks);
  } catch (error) {
    devConsole.error('Error obteniendo datos de los tanques:', error);
    return internalError(res, 'Error obteniendo datos de los tanques', error);
  }
});

/**
 * POST /equipment - Crear nuevo equipo
 * Verifica permisos de acceso a la granja
 * Incluye validaciones de campos obligatorios
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    let { name, type, description, farm, devices, associatedTanks } = trimFields(req.body);
    
    // Validar campos obligatorios
    const requiredFields = ['name', 'type', 'farm'];
    const validation = validateRequiredFields({ name, type, farm }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, 'Nombre, tipo y granja son obligatorios');
    }
    
    // Verificar que el usuario tiene acceso a la granja
    const farmDoc = await Farm.findById(farm);
    if (!farmDoc) {
      return notFound(res, 'Granja no encontrada');
    }
    
    const hasAccess = req.user.role === 'Administrador' || farmDoc.users.includes(req.user.id);
    if (!hasAccess) {
      return unauthorized(res, 'No tienes acceso a esta granja');
    }
    
    // Validar nombre
    const nameValidation = validateFarmName(name);
    if (!nameValidation.isValid) {
      return badRequest(res, nameValidation.message);
    }
    
    const newEquipment = new Equipment({
      name,
      type,
      description,
      farm,
      devices: devices || [], // Guardar los dispositivos asociados
      associatedTanks: type === "Estación de lavado" ? (associatedTanks || []) : [] // Guardar tanques sólo para estaciones de lavado
    });
    
    await newEquipment.save();
    return created(res, newEquipment, 'Equipo creado con éxito');
  } catch (error) {
    return internalError(res, 'Error al crear el equipo', error);
  }
});

/**
 * GET /equipment/:id - Obtener equipo específico
 * Verifica permisos de acceso a la granja del equipo
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Primero obtenemos los datos básicos del equipo
    const equipment = await Equipment.findById(req.params.id)
                                    .populate('farm', 'name');
    
    if (!equipment) {
      return notFound(res, 'Equipo no encontrado');
    }
    
    // Verificar que el usuario tiene acceso a la granja
    const hasAccess = req.user.role === 'Administrador' || 
                      (await Farm.exists({ _id: equipment.farm, users: req.user.id }));
                      
    if (!hasAccess) {
      return unauthorized(res, 'No tienes acceso a este equipo');
    }
    
    // En lugar de cargar todos los datos de los dispositivos y tanques,
    // simplemente enviamos sus IDs para optimizar la carga
    const equipmentData = {
      ...equipment.toObject(),
      devices: equipment.devices,
      associatedTanks: equipment.associatedTanks
    };
    
    return res.json(equipmentData);
  } catch (error) {
    return internalError(res, 'Error al obtener el equipo', error);
  }
});

/**
 * PUT /equipment/:id - Actualizar equipo existente
 * Verifica permisos de acceso y valida los datos de entrada
 * Maneja tanques asociados según el tipo de equipo
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, type, description, devices, associatedTanks } = req.body;
    
    // Verificar que el equipo existe
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return notFound(res, 'Equipo no encontrado');
    }
    
    // Verificar que el usuario tiene acceso a la granja
    const hasAccess = req.user.role === 'Administrador' || 
                      (await Farm.exists({ _id: equipment.farm, users: req.user.id }));
                      
    if (!hasAccess) {
      return unauthorized(res, 'No tienes acceso a este equipo');
    }
    
    // Actualizar campos si se proporcionan
    if (name) {
      const nameValidation = validateFarmName(name);
      if (!nameValidation.isValid) {
        return badRequest(res, nameValidation.message);
      }
      equipment.name = name.trim();
    }
    
    if (type) equipment.type = type;
    if (description !== undefined) equipment.description = description.trim();
    
    // Actualizar dispositivos asociados si se proporcionan
    if (devices && Array.isArray(devices)) {
      equipment.devices = devices;
    }
    
    // Manejar tanques asociados según el tipo del equipo
    if (equipment.type === "Estación de lavado") {
      // Solo permitir tanques asociados si se proporcionan y el tipo es "Estación de lavado"
      if (associatedTanks && Array.isArray(associatedTanks)) {
        equipment.associatedTanks = associatedTanks;
      }
    } else {
      // Si no es estación de lavado, limpiar siempre los tanques asociados
      equipment.associatedTanks = [];
    }
    
    await equipment.save();
    return updated(res, equipment, 'Equipo actualizado con éxito');
  } catch (error) {
    return internalError(res, 'Error al actualizar el equipo', error);
  }
});

/**
 * DELETE /equipment/:id - Eliminar equipo
 * Solo accesible por administradores
 * Verifica permisos de acceso antes de eliminar
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Verificar que el equipo existe
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return notFound(res, 'Equipo no encontrado');
    }
    
    // Verificar que el usuario tiene acceso a la granja y es administrador
    const hasAccess = req.user.role === 'Administrador';
    if (!hasAccess) {
      return unauthorized(res, 'No tienes permisos para eliminar este equipo');
    }
    
    await Equipment.findByIdAndDelete(req.params.id);
    return deleted(res, 'Equipo eliminado con éxito');
  } catch (error) {
    return internalError(res, 'Error al eliminar el equipo', error);
  }
});




module.exports = router;
