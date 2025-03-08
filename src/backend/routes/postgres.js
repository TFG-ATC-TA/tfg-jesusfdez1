var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const pool = require('../config/postgres');

/* Setup CORS */
router.use(cors());

/* List all tables in the database */
router.get('/tables', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Error fetching tables from PostgreSQL', error: error.message });
  }
});

/* Get table structure (columns) */
router.get('/tables/:tableName/structure', verifyToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Validate tableName to prevent SQL injection
    if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const query = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(query, [tableName]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ message: 'Error fetching table structure', error: error.message });
  }
});

/* Get table contents with pagination */
router.get('/tables/:tableName/data', verifyToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate tableName to prevent SQL injection
    if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
    const countResult = await pool.query(countQuery);
    const totalRows = parseInt(countResult.rows[0].count);
    
    // Get data with pagination
    const dataQuery = `SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`;
    const dataResult = await pool.query(dataQuery, [limit, offset]);
    
    res.json({
      data: dataResult.rows,
      pagination: {
        totalRows,
        totalPages: Math.ceil(totalRows / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ message: 'Error fetching table data', error: error.message });
  }
});

/* Execute a custom SQL query (restricted to SELECT statements for security) */
router.post('/query', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    
    // Security check: Only allow SELECT queries
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select ')) {
      return res.status(403).json({ message: 'Only SELECT queries are allowed' });
    }
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
});

module.exports = router;
