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
    const skip = (page - 1) * limit
    const searchTerm = req.query.searchTerm || ''

    let query = {}
    if (req.user.role !== 'Administrador') {
      query.users = req.user.id
    }
    if (searchTerm) {
      query.name = { $regex: searchTerm, $options: 'i' }
    }

    // Ajustar el cálculo de totalItems para incluir el término de búsqueda
    const totalItems = await Farm.countDocuments(query)

    const farms = await Farm.find(query).select('_id name idname').skip(skip).limit(limit)
    const totalPages = Math.ceil(totalItems / limit)

    res.json({ data: farms, totalItems, totalPages, currentPage: page })
    
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo datos de las granjas' })
  }
})


  
module.exports = router;
