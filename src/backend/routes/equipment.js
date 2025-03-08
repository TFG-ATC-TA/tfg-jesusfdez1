var express = require("express");
var router = express.Router();
const cors = require("cors");
const { verifyToken } = require("../middleware/auth");
const Equipment = require("../models/Equipment");
const Farm = require("../models/Farm");

// Token generation imports
const dotenv = require("dotenv");
// get config vars
dotenv.config();
// Middleware
router.use(cors());
router.use(express.json());


router.get('/list', verifyToken, async (req, res) => {
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

// Endpoint mejorado para listar sólo los tanques de una granja específica
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

module.exports = router;
