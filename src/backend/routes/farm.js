var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken, isAdmin } = require('../middleware/auth');
const Farm = require('../models/Farm');

// Token generation imports
const dotenv = require('dotenv');
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());

router.get('/list', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const searchTerm = req.query.searchTerm || ''

    let query = {}
    if (req.user.role !== 'Administrador') {
      query.users = req.user.id
    }
    if (searchTerm) {
      query.name = { $regex: searchTerm, $options: 'i' }
    }

    const totalItems = await Farm.countDocuments(query)
    const totalPages = Math.ceil(totalItems / limit)
    
    // Si la página solicitada excede el total, usar la primera página
    const adjustedPage = page > totalPages ? 1 : page;
    const skip = (adjustedPage - 1) * limit

    const farms = await Farm.find(query)
      .select('_id name idname')
      .skip(skip)
      .sort({ name: 1 })
      .limit(limit)

    res.json({ 
      data: farms, 
      totalItems, 
      totalPages, 
      currentPage: adjustedPage 
    })
    
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos de las granjas' })
  }
})


router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    let { name, idname } = req.body;
    
    // Trim input fields
    name = name ? name.trim() : '';
    idname = idname ? idname.trim() : '';

    if (!name || !idname) {
      return res.status(400).json({ message: 'Nombre e ID de la granja son obligatorios' });
    }

    // Validate farm name (letters, numbers, and spaces, 2-50 characters)
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        message: 'El nombre debe contener entre 2 y 50 caracteres y solo puede contener letras, números y espacios' 
      });
    }

    // Validate farm ID (lowercase letters, numbers, and hyphens, 2-30 characters)
    const idRegex = /^[a-z0-9-]{2,30}$/;
    if (!idRegex.test(idname)) {
      return res.status(400).json({ 
        message: 'El ID debe contener entre 2 y 30 caracteres y solo puede contener letras minúsculas, números y guiones' 
      });
    }

    const existingFarm = await Farm.findOne({ idname });
    if (existingFarm) {
      return res.status(409).json({ message: 'La granja con este ID ya existe' });
    }

    const newFarm = new Farm({ name, idname });
    await newFarm.save();
    res.status(201).json({ message: 'Granja creada con éxito', farm: newFarm });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la granja: ' + error });
  }
});


router.get('/listName', verifyToken, async (req, res) => {
  try {
    let farms;
    if (req.user.role === 'Administrador') {
      farms = await Farm.find().select('_id name'); // Admin can see all farms
    } else {
      res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos de las granjas' });
  }
});

// Obtener una granja específica por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const farm = await Farm.findById(id).select('_id name idname');
    
    if (!farm) {
      return res.status(404).json({ message: 'Granja no encontrada' });
    }

    // Verificar que el usuario tenga acceso a esta granja
    if (req.user.role !== 'Administrador' && !farm.users.includes(req.user.id)) {
      return res.status(403).json({ message: 'No tienes acceso a esta granja' });
    }

    res.json(farm);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la granja: ' + error.message });
  }
});

// Actualizar una granja
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let { name, idname } = req.body;
    
    // Trim input fields
    name = name ? name.trim() : '';
    idname = idname ? idname.trim() : '';

    if (!name || !idname) {
      return res.status(400).json({ message: 'Nombre e ID de la granja son obligatorios' });
    }

    // Validate farm name (letters, numbers, spaces, hyphens, apostrophes, and punctuation, 2-50 characters)
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-\'.,;:!?()]{2,50}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        message: 'El nombre debe contener entre 2 y 50 caracteres y puede contener letras, números, espacios, guiones, apóstrofes y signos de puntuación' 
      });
    }

    // Validate farm ID (lowercase letters, numbers, and hyphens, 2-30 characters)
    const idRegex = /^[a-zA-Z0-9-]{2,30}$/;
    if (!idRegex.test(idname)) {
      return res.status(400).json({ 
        message: 'El ID debe contener entre 2 y 30 caracteres y solo puede contener letras minúsculas, números y guiones' 
      });
    }

    // Verificar si existe otra granja con el mismo idname
    const existingFarm = await Farm.findOne({ idname, _id: { $ne: id } });
    if (existingFarm) {
      return res.status(409).json({ message: 'Ya existe una granja con este ID' });
    }

    const updatedFarm = await Farm.findByIdAndUpdate(
      id,
      { name, idname },
      { new: true, runValidators: true }
    );

    if (!updatedFarm) {
      return res.status(404).json({ message: 'Granja no encontrada' });
    }

    res.json({ message: 'Granja actualizada con éxito', farm: updatedFarm });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la granja: ' + error.message });
  }
});

// Eliminar una granja
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedFarm = await Farm.findByIdAndDelete(id);
    
    if (!deletedFarm) {
      return res.status(404).json({ message: 'Granja no encontrada' });
    }

    res.json({ message: 'Granja eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la granja: ' + error.message });
  }
});

  
router.get('/:farmId/access', verifyToken, async (req, res) => {
  try {
    const { farmId } = req.params;
    const farm = await Farm.findOne({ idname: farmId }).select('_id name idname');
    if (!farm) {
      return res.status(404).json({ message: 'Granja no encontrada' });
    }

    const hasAccess = req.user.role === 'Administrador' || (farm.users && farm.users.includes(req.user.id));
    if (hasAccess) {
      res.json(farm);
    } else {
      res.status(403).json({ message: 'No tienes acceso a esta granja' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verificando acceso a la granja' });
  }
});

module.exports = router;
