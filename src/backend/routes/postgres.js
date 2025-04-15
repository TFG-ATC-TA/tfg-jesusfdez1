var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB
});

/* Setup CORS */
router.use(cors());

// Ruta de prueba para obtener todos los datos de tank_state_intervals
router.get('/test', async (req, res) => {
    try {
        const query = 'SELECT * FROM tank_state_intervals';
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error al consultar tank_state_intervals:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los datos',
            error: error.message
        });
    }
});

module.exports = router;
