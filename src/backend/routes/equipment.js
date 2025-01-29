var express = require("express");
var router = express.Router();
const cors = require("cors");
const { verifyToken } = require("../middleware/auth");
const Equipment = require("../models/Equipment");

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



module.exports = router;
