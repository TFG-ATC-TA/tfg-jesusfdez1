/**
 * Rutas para gestión de recolección de leche
 * Incluye operaciones CRUD con control de acceso basado en granjas
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const Collection = require('../models/Collection');
const Farm = require('../models/Farm');
const Equipment = require('../models/Equipment');

// Importar el sistema de console personalizado
const devConsole = require('../utils/console');
const { trimFields, validateRequiredFields } = require('../utils/validators');
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
 * GET /collection/list - Obtener listado de recogidas con paginación y búsqueda
 * Control de acceso basado en granjas del usuario
 * Incluye filtros por granja y búsqueda por múltiples campos
 */
router.get('/list', verifyToken, async (req, res) => {
  try {
    const searchFields = ['sampleLabel', 'collectionCompany', 'cisternLicensePlate', 'driver'];
    let baseQuery = {};
    
    // Si se proporciona un farmId, verificar acceso del usuario a esa granja
    if (req.query.farmId) {
      const farm = await Farm.findById(req.query.farmId);
      if (!farm) {
        return notFound(res, 'Granja no encontrada');
      }

      const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
      if (!hasAccess) {
        return unauthorized(res, 'No tienes acceso a esta granja');
      }
      
      baseQuery.farmId = req.query.farmId;
    }

    const query = buildCompleteQuery(req, searchFields, baseQuery);
    const result = await handlePaginatedResponse(res, Collection, query, {
      sort: { collectionDate: -1 }, // Ordenar por fecha descendente
      populate: {
        path: 'litersPerTank.tankId',
        select: 'name',
        model: Equipment
      }
    });

    return paginatedResponse(res, result.data, result.totalItems, result.totalPages, result.currentPage);
  } catch (error) {
    devConsole.error('Error al obtener recogidas de leche:', error);
    return internalError(res, 'Error obteniendo datos de recogidas de leche', error);
  }
});

/**
 * GET /collection/:id - Obtener detalles de una recogida específica
 * Verifica permisos de acceso a la granja de la recogida
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id)
      .populate({
        path: 'litersPerTank.tankId',
        select: 'name',
        model: Equipment
      });
    
    if (!collection) {
      return notFound(res, 'Recogida de leche no encontrada');
    }

    // Si la colección tiene un farmId, verificar acceso
    if (collection.farmId) {
      const farm = await Farm.findById(collection.farmId);
      if (farm) {
        const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
        if (!hasAccess) {
          return unauthorized(res, 'No tienes acceso a esta recogida de leche');
        }
      }
    }

    return res.json(collection);
  } catch (error) {
    devConsole.error('Error al obtener detalles de recogida:', error);
    return internalError(res, 'Error obteniendo detalles de la recogida de leche', error);
  }
});

/**
 * POST /collection - Crear una nueva recogida
 * Incluye validaciones de campos obligatorios y permisos de granja
 * Verifica que los tanques pertenezcan a la granja especificada
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      collectionDate,
      cisternLicensePlate,
      collectionCompany,
      driver,
      tankId,
      sampleLabel,
      milkTemperature,
      inhibitorSampleTaken,
      litersPerTank,
      farmId
    } = req.body;

    // Validar campos obligatorios
    const requiredFields = ['collectionDate', 'sampleLabel', 'collectionCompany', 'litersPerTank'];
    const validation = validateRequiredFields({ collectionDate, sampleLabel, collectionCompany, litersPerTank }, requiredFields);
    if (!validation.isValid) {
      return badRequest(res, 'La fecha, etiqueta de muestra, empresa de recogida y al menos un tanque con litros son obligatorios');
    }

    // Validar que litersPerTank tenga al menos un elemento
    if (!litersPerTank || litersPerTank.length === 0) {
      return badRequest(res, 'Debe proporcionar al menos un tanque con litros');
    }

    // Validar que sampleLabel sea único
    const existingCollection = await Collection.findOne({ sampleLabel });
    if (existingCollection) {
      return conflict(res, 'Ya existe una recogida con esta etiqueta de muestra');
    }

    // Si se proporciona un farmId, verificar que exista y que el usuario tenga acceso
    if (farmId) {
      const farm = await Farm.findById(farmId);
      if (!farm) {
        return notFound(res, 'Granja no encontrada');
      }

      const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
      if (!hasAccess) {
        return unauthorized(res, 'No tienes permiso para crear recogidas en esta granja');
      }
    }

    // Validar que todos los tanques existan
    for (const tankEntry of litersPerTank) {
      if (tankEntry.tankId) {
        const tank = await Equipment.findById(tankEntry.tankId);
        if (!tank) {
          return notFound(res, `Tanque con ID ${tankEntry.tankId} no encontrado`);
        }
        
        // Verificar que el tanque pertenezca a la granja proporcionada
        if (farmId && tank.farm && tank.farm.toString() !== farmId) {
          return badRequest(res, `El tanque ${tank.name} no pertenece a la granja proporcionada`);
        }
      }
    }

    // Crear la nueva recogida
    const newCollection = new Collection({
      collectionDate,
      cisternLicensePlate,
      collectionCompany,
      driver,
      tankId,
      sampleLabel,
      milkTemperature,
      inhibitorSampleTaken,
      litersPerTank,
      farmId
    });

    await newCollection.save();
    
    return created(res, newCollection, 'Recogida de leche creada con éxito');
  } catch (error) {
    devConsole.error('Error al crear recogida de leche:', error);
    return internalError(res, 'Error al crear la recogida de leche', error);
  }
});

/**
 * PUT /collection/:id - Actualizar una recogida existente
 * Verifica permisos de acceso y valida la integridad de los datos
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      collectionDate,
      cisternLicensePlate,
      collectionCompany,
      driver,
      tankId,
      sampleLabel,
      milkTemperature,
      inhibitorSampleTaken,
      litersPerTank,
      farmId
    } = req.body;

    // Buscar la recogida a actualizar
    const collection = await Collection.findById(id);
    if (!collection) {
      return notFound(res, 'Recogida de leche no encontrada');
    }

    // Verificar acceso a la granja
    if (farmId) {
      const farm = await Farm.findById(farmId);
      if (!farm) {
        return notFound(res, 'Granja no encontrada');
      }

      const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
      if (!hasAccess) {
        return unauthorized(res, 'No tienes permiso para actualizar recogidas en esta granja');
      }
    }

    // Validar que la etiqueta de muestra actualizada no colisione con otras recogidas
    if (sampleLabel && sampleLabel !== collection.sampleLabel) {
      const existingCollection = await Collection.findOne({ sampleLabel });
      if (existingCollection && existingCollection._id.toString() !== id) {
        return conflict(res, 'Ya existe otra recogida con esta etiqueta de muestra');
      }
    }

    // Validar que todos los tanques existan
    if (litersPerTank && litersPerTank.length > 0) {
      for (const tankEntry of litersPerTank) {
        if (tankEntry.tankId) {
          const tank = await Equipment.findById(tankEntry.tankId);
          if (!tank) {
            return notFound(res, `Tanque con ID ${tankEntry.tankId} no encontrado`);
          }
          
          // Verificar que el tanque pertenezca a la granja proporcionada
          if (farmId && tank.farm && tank.farm.toString() !== farmId) {
            return badRequest(res, `El tanque ${tank.name} no pertenece a la granja proporcionada`);
          }
        }
      }
    }

    // Actualizar la recogida
    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      {
        collectionDate: collectionDate || collection.collectionDate,
        cisternLicensePlate: cisternLicensePlate !== undefined ? cisternLicensePlate : collection.cisternLicensePlate,
        collectionCompany: collectionCompany || collection.collectionCompany,
        driver: driver !== undefined ? driver : collection.driver,
        tankId: tankId !== undefined ? tankId : collection.tankId,
        sampleLabel: sampleLabel || collection.sampleLabel,
        milkTemperature: milkTemperature !== undefined ? milkTemperature : collection.milkTemperature,
        inhibitorSampleTaken: inhibitorSampleTaken !== undefined ? inhibitorSampleTaken : collection.inhibitorSampleTaken,
        litersPerTank: litersPerTank || collection.litersPerTank,
        farmId: farmId || collection.farmId
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'litersPerTank.tankId',
      select: 'name',
      model: Equipment
    });

    return updated(res, updatedCollection, 'Recogida de leche actualizada con éxito');
  } catch (error) {
    devConsole.error('Error al actualizar recogida de leche:', error);
    return internalError(res, 'Error al actualizar la recogida de leche', error);
  }
});

/**
 * DELETE /collection/:id - Eliminar una recogida
 * Verifica permisos de acceso a la granja antes de eliminar
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la recogida a eliminar
    const collection = await Collection.findById(id);
    if (!collection) {
      return notFound(res, 'Recogida de leche no encontrada');
    }

    // Verificar acceso si hay farmId
    if (collection.farmId) {
      const farm = await Farm.findById(collection.farmId);
      if (farm) {
        const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
        if (!hasAccess) {
          return unauthorized(res, 'No tienes permiso para eliminar recogidas en esta granja');
        }
      }
    }

    // Eliminar la recogida
    await Collection.findByIdAndDelete(id);
    
    return deleted(res, 'Recogida de leche eliminada con éxito');
  } catch (error) {
    devConsole.error('Error al eliminar recogida de leche:', error);
    return internalError(res, 'Error al eliminar la recogida de leche', error);
  }
});

module.exports = router;