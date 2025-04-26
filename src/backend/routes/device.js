var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const Device = require('../models/Device');

// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());


router.get("/list", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const types = req.query.types ? req.query.types.split(',') : [];
    const filters = req.query.filters ? JSON.parse(decodeURIComponent(req.query.filters)) : {};

    let query = {};
    if (req.user.role === "Administrador") {
      if (searchTerm) {
        query.boardId = { $regex: searchTerm, $options: 'i' };
      }
      if (types.length > 0) {
        query.type = { $in: types };
      }
      // Aplicar filtros adicionales
      Object.keys(filters).forEach(key => {
        if (filters[key].length > 0) {
          query[key] = { $in: filters[key] };
        }
      });
      
      const totalItems = await Device.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);
      
      // Si la página solicitada excede el total, usar la primera página
      const adjustedPage = page > totalPages ? 1 : page;
      const skip = (adjustedPage - 1) * limit;

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
        { $unwind: { path: '$farm', preserveNullAndEmptyArrays: true } },
        { $sort: { 'farm.name': 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            boardId: 1,
            type: 1,
            farm: { name: '$farm.name' }
          }
        }
      ]);

      res.json({ 
        data: devices, 
        totalItems, 
        totalPages, 
        currentPage: adjustedPage 
      });
    } else {
      res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo datos de los dispositivos" });
  }
});

router.get('/:deviceId', verifyToken, async (req, res) => {
  try {
   let device;
    if (req.user.role === 'Administrador') {
      device = await Device.findOne({ _id: req.params.deviceId }).select('_id boardId type description equipment sensors farm');
    } else {
     // devices = await Device.find({ users: req.user.id }).select('_id name idname'); // Regular users see only their farms
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos del dispositivo' });
  }
});

router.put('/:deviceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return res.status(401).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    const { deviceId } = req.params;
    const { boardId, type, description, sensors, equipment, farm } = req.body;
    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }

    if (boardId && type && sensors) {
      device.boardId = boardId;
      device.type = type;
      device.sensors = sensors;

    }
    else {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    if (equipment) {
      device.equipment = equipment;
    } else{
      device.equipment = null;
    }
    
    if (farm) {
      device.farm = farm;
    } else  {
      device.farm = null;
    }

    device.description = description;
    
    await device.save();
    res.json({ message: 'Dispositivo actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando el dispositivo: ' + error });
  }
});

router.delete('/:deviceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return res.status(401).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    const { deviceId } = req.params;
    const device = await Device.findByIdAndDelete(deviceId);

    if (!device) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }

    res.json({ message: 'Dispositivo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando el dispositivo' });
  }
});


router.post('/', verifyToken, async(req,res) => {
  try {
    if (req.user.role !== 'Administrador') {
      return res.status(401).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    const { boardId, type, description, sensors, equipment, farm } = req.body;
    if (!boardId || !type ) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const existingDevice = await Device.findOne({ boardId });  
    if (existingDevice) {
      return res.status(400).json({ message: 'El identificador ya existe en la base de datos' });
    }
    const device = new Device({ boardId, type, description, sensors, equipment, farm });
    if (!equipment) {
      device.equipment = null;
    }
    
    if (!farm) {
      device.farm = null;
    }

    await device.save();
    res.json({ message: 'Dispositivo creado correctamente' });

  } catch (error) {
    res.status(500).json({ message: 'Error creando el dispositivo: ' + error });
  }
});

module.exports = router;

