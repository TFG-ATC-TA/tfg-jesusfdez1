/**
 * Rutas para gestión de dispositivos IoT
 * Incluye operaciones CRUD con control de acceso por roles
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const Device = require('../models/Device');
const { validateRequiredFields } = require('../utils/validators');
const { 
  paginatedResponse, 
  badRequest, 
  unauthorized, 
  notFound, 
  conflict, 
  internalError, 
  created, 
  updated, 
  deleted 
} = require('../utils/responseHandler');
const { buildCompleteQuery } = require('../utils/pagination');
const mongoose = require('mongoose');

// Middleware
router.use(cors());
router.use(express.json());

/**
 * GET /device/list - Obtener lista paginada de dispositivos
 * Solo accesible por administradores
 * Incluye filtros por granja y tipo de dispositivo
 */
router.get("/list", verifyToken, async (req, res) => {
  try {
    
    if (req.user.role !== "Administrador") {
      return unauthorized(res, 'No tienes permisos para esta acción');
    }

    const searchFields = ['boardId'];
    let baseQuery = {};
    
    // Filtrar por granja específica si se proporciona
    if (req.query.farmId) {
      baseQuery.farm = new mongoose.Types.ObjectId(req.query.farmId);
    }

    // Construir la query base primero
    const query = buildCompleteQuery(req, searchFields, baseQuery);
    
    // Añadir filtros de tipos si se proporcionan en el parámetro types
    // Esto tiene prioridad sobre los filtros JSON
    if (req.query.types) {
      const types = req.query.types.split(',');
      if (types.length > 0) {
        query.type = { $in: types };
      }
    }

    // Usar aggregate para incluir información de granjas
    const { page, limit } = require('../utils/pagination').getPaginationParams(req);
    const totalItems = await Device.countDocuments(query);
    const { skip, totalPages, adjustedPage } = require('../utils/pagination').calculatePagination(page, limit, totalItems);

    const devices = await Device.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'farms',
          localField: 'farm',
          foreignField: '_id',
          as: 'farm'
        }
      },
      { $sort: { 'boardId': 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          boardId: 1,
          type: 1,
          farm: { 
            $cond: {
              if: { $gt: [{ $size: '$farm' }, 0] },
              then: { name: { $arrayElemAt: ['$farm.name', 0] } },
              else: { name: null }
            }
          }
        }
      }
    ]);

    return paginatedResponse(res, devices, totalItems, totalPages, adjustedPage);
  } catch (error) {
    return internalError(res, "Error obteniendo datos de los dispositivos", error);
  }
});

/**
 * GET /device/:deviceId - Obtener dispositivo específico
 * Solo accesible por administradores
 */
router.get('/:deviceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res, 'No tienes permisos para acceder a esta información');
    }

    const device = await Device.findOne({ _id: req.params.deviceId })
      .select('_id boardId type description equipment sensors farm');
    
    if (!device) {
      return notFound(res, 'Dispositivo no encontrado');
    }

    return res.json(device);
  } catch (error) {
    return internalError(res, 'Error obteniendo datos del dispositivo', error);
  }
});

/**
 * PUT /device/:deviceId - Actualizar dispositivo existente
 * Solo accesible por administradores
 * Incluye validaciones de campos obligatorios
 */
router.put('/:deviceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const { deviceId } = req.params;
    const { boardId, type, description, sensors, equipment, farm } = req.body;
    
    // Validar campos obligatorios
    const requiredFields = ['boardId', 'type', 'sensors'];
    const validation = validateRequiredFields({ boardId, type, sensors }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, 'Faltan campos obligatorios');
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return notFound(res, 'Dispositivo no encontrado');
    }

    // Actualizar campos obligatorios
    device.boardId = boardId;
    device.type = type;
    device.sensors = sensors;
    device.description = description;

    // Manejar campos opcionales
    device.equipment = equipment || null;
    device.farm = farm || null;
    
    await device.save();
    
    return updated(res, null, 'Dispositivo actualizado correctamente');
  } catch (error) {
    return internalError(res, 'Error actualizando el dispositivo', error);
  }
});

/**
 * DELETE /device/:deviceId - Eliminar dispositivo
 * Solo accesible por administradores
 */
router.delete('/:deviceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const { deviceId } = req.params;
    const device = await Device.findByIdAndDelete(deviceId);

    if (!device) {
      return notFound(res, 'Dispositivo no encontrado');
    }

    return deleted(res, 'Dispositivo eliminado correctamente');
  } catch (error) {
    return internalError(res, 'Error eliminando el dispositivo', error);
  }
});

/**
 * POST /device - Crear nuevo dispositivo
 * Solo accesible por administradores
 * Incluye validación de boardId único
 */
router.post('/', verifyToken, async(req,res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return unauthorized(res);
    }

    const { boardId, type, description, sensors, equipment, farm } = req.body;
    
    // Validar campos obligatorios
    const requiredFields = ['boardId', 'type'];
    const validation = validateRequiredFields({ boardId, type }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, 'Faltan campos obligatorios');
    }

    // Verificar si ya existe un dispositivo con este boardId
    const existingDevice = await Device.findOne({ boardId });  
    if (existingDevice) {
      return conflict(res, 'El identificador ya existe en la base de datos');
    }

    const device = new Device({ 
      boardId, 
      type, 
      description, 
      sensors, 
      equipment: equipment || null, 
      farm: farm || null 
    });

    await device.save();
    
    return created(res, null, 'Dispositivo creado correctamente');
  } catch (error) {
    return internalError(res, 'Error creando el dispositivo', error);
  }
});

module.exports = router;

