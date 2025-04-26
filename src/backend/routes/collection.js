var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken, isAdmin } = require('../middleware/auth');
const Collection = require('../models/Collection');
const Farm = require('../models/Farm');
const Equipment = require('../models/Equipment');

// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());

// Obtener listado de recogidas con paginación y búsqueda
router.get('/list', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const farmId = req.query.farmId;

    // Si se proporciona un farmId, verificar acceso del usuario a esa granja
    if (farmId) {
      const farm = await Farm.findById(farmId);
      if (!farm) {
        return res.status(404).json({ message: 'Granja no encontrada' });
      }

      const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'No tienes acceso a esta granja' });
      }
    }

    // Construir query para la búsqueda
    let query = {};
    
    // Si hay un farmId, buscar recogidas de esa granja
    if (farmId) {
      query.farmId = farmId;
    }
    
    // Si hay término de búsqueda, buscar coincidencias en campos relevantes
    if (searchTerm) {
      query.$or = [
        { sampleLabel: { $regex: searchTerm, $options: 'i' } },
        { collectionCompany: { $regex: searchTerm, $options: 'i' } },
        { cisternLicensePlate: { $regex: searchTerm, $options: 'i' } },
        { driver: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Contar total de elementos que coinciden con la búsqueda
    const totalItems = await Collection.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Si la página solicitada excede el total, usar la primera página
    const adjustedPage = page > totalPages ? 1 : page;
    const skip = (adjustedPage - 1) * limit;

    // Obtener recogidas con paginación y población de referencias
    const collections = await Collection.find(query)
      .sort({ collectionDate: -1 }) // Ordenar por fecha descendente (más recientes primero)
      .populate({
        path: 'litersPerTank.tankId',
        select: 'name',
        model: Equipment
      })
      .skip(skip)
      .limit(limit);

    res.json({
      data: collections,
      totalItems,
      totalPages,
      currentPage: adjustedPage
    });
  } catch (error) {
    console.error('Error al obtener recogidas de leche:', error);
    res.status(500).json({ message: 'Error obteniendo datos de recogidas de leche' });
  }
});

// Obtener detalles de una recogida específica
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
      return res.status(404).json({ message: 'Recogida de leche no encontrada' });
    }

    // Si la colección tiene un farmId, verificar acceso
    if (collection.farmId) {
      const farm = await Farm.findById(collection.farmId);
      if (farm) {
        const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
        if (!hasAccess) {
          return res.status(403).json({ message: 'No tienes acceso a esta recogida de leche' });
        }
      }
    }

    res.json(collection);
  } catch (error) {
    console.error('Error al obtener detalles de recogida:', error);
    res.status(500).json({ message: 'Error obteniendo detalles de la recogida de leche' });
  }
});

// Crear una nueva recogida
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
    if (!collectionDate || !sampleLabel || !collectionCompany || !litersPerTank || litersPerTank.length === 0) {
      return res.status(400).json({ 
        message: 'La fecha, etiqueta de muestra, empresa de recogida y al menos un tanque con litros son obligatorios' 
      });
    }

    // Validar que sampleLabel sea único
    const existingCollection = await Collection.findOne({ sampleLabel });
    if (existingCollection) {
      return res.status(409).json({ message: 'Ya existe una recogida con esta etiqueta de muestra' });
    }

    // Si se proporciona un farmId, verificar que exista y que el usuario tenga acceso
    if (farmId) {
      const farm = await Farm.findById(farmId);
      if (!farm) {
        return res.status(404).json({ message: 'Granja no encontrada' });
      }

      const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'No tienes permiso para crear recogidas en esta granja' });
      }
    }

    // Validar que todos los tanques existan
    for (const tankEntry of litersPerTank) {
      if (tankEntry.tankId) {
        const tank = await Equipment.findById(tankEntry.tankId);
        if (!tank) {
          return res.status(404).json({ message: `Tanque con ID ${tankEntry.tankId} no encontrado` });
        }
        
        // Verificar que el tanque pertenezca a la granja proporcionada
        if (farmId && tank.farm && tank.farm.toString() !== farmId) {
          return res.status(400).json({ 
            message: `El tanque ${tank.name} no pertenece a la granja proporcionada` 
          });
        }
      }
    }

    // Crear la nueva recogida
    const newCollection = new Collection({
      collectionDate,
      cisternLicensePlate,
      collectionCompany,
      driver,
      tankId, // Este campo parece redundante con litersPerTank
      sampleLabel,
      milkTemperature,
      inhibitorSampleTaken,
      litersPerTank,
      farmId // Añadir referencia a la granja
    });

    // Guardar la nueva recogida
    await newCollection.save();
    
    res.status(201).json({
      message: 'Recogida de leche creada con éxito',
      collection: newCollection
    });
  } catch (error) {
    console.error('Error al crear recogida de leche:', error);
    res.status(500).json({ 
      message: 'Error al crear la recogida de leche',
      error: error.message
    });
  }
});

// Actualizar una recogida existente
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
      return res.status(404).json({ message: 'Recogida de leche no encontrada' });
    }

    // Verificar acceso a la granja
    if (farmId) {
      const farm = await Farm.findById(farmId);
      if (!farm) {
        return res.status(404).json({ message: 'Granja no encontrada' });
      }

      const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar recogidas en esta granja' });
      }
    }

    // Validar que la etiqueta de muestra actualizada no colisione con otras recogidas
    if (sampleLabel && sampleLabel !== collection.sampleLabel) {
      const existingCollection = await Collection.findOne({ sampleLabel });
      if (existingCollection && existingCollection._id.toString() !== id) {
        return res.status(409).json({ message: 'Ya existe otra recogida con esta etiqueta de muestra' });
      }
    }

    // Validar que todos los tanques existan
    if (litersPerTank && litersPerTank.length > 0) {
      for (const tankEntry of litersPerTank) {
        if (tankEntry.tankId) {
          const tank = await Equipment.findById(tankEntry.tankId);
          if (!tank) {
            return res.status(404).json({ message: `Tanque con ID ${tankEntry.tankId} no encontrado` });
          }
          
          // Verificar que el tanque pertenezca a la granja proporcionada
          if (farmId && tank.farm && tank.farm.toString() !== farmId) {
            return res.status(400).json({ 
              message: `El tanque ${tank.name} no pertenece a la granja proporcionada` 
            });
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

    res.json({
      message: 'Recogida de leche actualizada con éxito',
      collection: updatedCollection
    });
  } catch (error) {
    console.error('Error al actualizar recogida de leche:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la recogida de leche',
      error: error.message
    });
  }
});

// Eliminar una recogida
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la recogida a eliminar
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ message: 'Recogida de leche no encontrada' });
    }

    // Verificar acceso si hay farmId
    if (collection.farmId) {
      const farm = await Farm.findById(collection.farmId);
      if (farm) {
        const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
        if (!hasAccess) {
          return res.status(403).json({ message: 'No tienes permiso para eliminar recogidas en esta granja' });
        }
      }
    }

    // Eliminar la recogida
    await Collection.findByIdAndDelete(id);
    
    res.json({ message: 'Recogida de leche eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar recogida de leche:', error);
    res.status(500).json({ 
      message: 'Error al eliminar la recogida de leche',
      error: error.message
    });
  }
});

module.exports = router;