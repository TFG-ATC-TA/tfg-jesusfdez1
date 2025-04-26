var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken, isAdmin } = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const Farm = require('../models/Farm');

// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());

router.get('/listName', verifyToken, async (req, res) => {
  try {
    let equipments;
    if (req.user.role === 'Administrador') {
      equipments = await Equipment.find().select('_id name')
    } else {
    //  equipments = await Equipment.find({ users: req.user.id }).select('_id name idname'); // Regular users see only their farms
    }
    res.json(equipments);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos de los equipos' });
  }
});

router.get('/list', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const sortField = req.query.sortField || 'name';
    const types = req.query.types ? req.query.types.split(',') : [];
    const filters = req.query.filters ? JSON.parse(decodeURIComponent(req.query.filters)) : {};

    let query = {};
    
    // Control de acceso basado en rol
    if (req.user.role !== 'Administrador') {
      // Para usuarios regulares, sólo mostrar equipos de sus granjas
      const userFarms = await Farm.find({ users: req.user.id }).select('_id');
      const farmIds = userFarms.map(farm => farm._id);
      query.farm = { $in: farmIds };
    }
    
    // Búsqueda por término
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Filtrar por tipos
    if (types.length > 0) {
      query.type = { $in: types };
    }
    
    // Filtrar por granja específica
    if (req.query.farmId) {
      query.farm = req.query.farmId;
    }
    
    // Aplicar filtros adicionales
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].length > 0) {
        query[key] = { $in: filters[key] };
      }
    });
    
    const totalItems = await Equipment.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Si la página solicitada excede el total, usar la última página válida
    const adjustedPage = page > totalPages && totalPages > 0 ? totalPages : page;
    const skip = (adjustedPage - 1) * limit;


    const equipments = await Equipment.find(query)
      .select('_id name type devices')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    // Enviar también la longitud de devices
    const equipmentsWithDeviceCount = equipments.map(equipment => ({
      ...equipment.toObject(),
      deviceCount: equipment.devices.length
    }));

    res.json({ 
      data: equipmentsWithDeviceCount, 
      totalItems, 
      totalPages, 
      currentPage: adjustedPage 
    });
  } catch (error) {
    console.error('Error en listado de equipos:', error);
    res.status(500).json({ message: 'Error obteniendo datos de los equipos' });
  }
});

// Endpoint para listar sólo los tanques de una granja específica
router.get('/listTanks', verifyToken, async (req, res) => {
  try {
    const farmId = req.query.farmId;
    
    // Verificar que se proporciona un farmId
    if (!farmId) {
      return res.status(400).json({ message: 'Se requiere el ID de la granja' });
    }
    
    // Verificar que la granja existe
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ message: 'Granja no encontrada' });
    }
    
    // Verificar que el usuario tiene acceso a esta granja
    const hasAccess = req.user.role === 'Administrador' || farm.users.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a esta granja' });
    }
    
    // Obtener sólo los tanques de leche de la granja especificada
    const tanks = await Equipment.find({
      type: "Tanque de leche",
      farm: farmId
    }).select('_id name');
    
    res.json(tanks);
  } catch (error) {
    console.error('Error obteniendo datos de los tanques:', error);
    res.status(500).json({ message: 'Error obteniendo datos de los tanques' });
  }
});

// Crear nuevo equipo
router.post('/', verifyToken, async (req, res) => {
  try {
    let { name, type, description, farm, devices, associatedTanks } = req.body;
    
    // Trim input fields
    name = name ? name.trim() : '';
    description = description ? description.trim() : '';
    
    if (!name || !type || !farm) {
      return res.status(400).json({ message: 'Nombre, tipo y granja son obligatorios' });
    }
    
    // Verificar que el usuario tiene acceso a la granja
    const farmDoc = await Farm.findById(farm);
    if (!farmDoc) {
      return res.status(404).json({ message: 'Granja no encontrada' });
    }
    
    const hasAccess = req.user.role === 'Administrador' || farmDoc.users.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a esta granja' });
    }
    
    // Validar nombre (letras, números y espacios, 2-50 caracteres)
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        message: 'El nombre debe contener entre 2 y 50 caracteres y solo puede contener letras, números y espacios' 
      });
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
    res.status(201).json({ message: 'Equipo creado con éxito', equipment: newEquipment });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el equipo: ' + error });
  }
});

// Obtener un equipo específico
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Primero obtenemos los datos básicos del equipo
    const equipment = await Equipment.findById(req.params.id)
                                    .populate('farm', 'name');
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Verificar que el usuario tiene acceso a la granja
    const hasAccess = req.user.role === 'Administrador' || 
                      (await Farm.exists({ _id: equipment.farm, users: req.user.id }));
                      
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a este equipo' });
    }
    
    // En lugar de cargar todos los datos de los dispositivos y tanques,
    // simplemente enviamos sus IDs para optimizar la carga
    const equipmentData = {
      ...equipment.toObject(),
      devices: equipment.devices,
      associatedTanks: equipment.associatedTanks
    };
    
    res.json(equipmentData);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el equipo: ' + error });
  }
});

// Actualizar un equipo existente
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, type, description, devices, associatedTanks } = req.body;
    
    // Verificar que el equipo existe
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Verificar que el usuario tiene acceso a la granja
    const hasAccess = req.user.role === 'Administrador' || 
                      (await Farm.exists({ _id: equipment.farm, users: req.user.id }));
                      
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a este equipo' });
    }
    
    // Validar campos requeridos
    if (name) equipment.name = name.trim();
    if (type) equipment.type = type;
    if (description !== undefined) equipment.description = description.trim();
    
    // Actualizar dispositivos asociados si se proporcionan
    if (devices && Array.isArray(devices)) {
      equipment.devices = devices;
    }
    
    // Actualizar tanques asociados si se proporcionan y el tipo es "Estación de lavado"
    if (type === "Estación de lavado" && associatedTanks && Array.isArray(associatedTanks)) {
      equipment.associatedTanks = associatedTanks;
    } else if (type !== "Estación de lavado") {
      // Si no es estación de lavado, limpiar los tanques asociados
      equipment.associatedTanks = [];
    }
    
    // Validar nombre si se proporciona
    if (name) {
      const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({ 
          message: 'El nombre debe contener entre 2 y 50 caracteres y solo puede contener letras, números y espacios' 
        });
      }
    }
    
    await equipment.save();
    res.json({ message: 'Equipo actualizado con éxito', equipment });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el equipo: ' + error });
  }
});

// Eliminar un equipo
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Verificar que el equipo existe
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Verificar que el usuario tiene acceso a la granja y es administrador
    const hasAccess = req.user.role === 'Administrador';
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este equipo' });
    }
    
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Equipo eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el equipo: ' + error });
  }
});




module.exports = router;
