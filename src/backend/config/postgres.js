const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB || 'postgres'
});

// Test the connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected successfully');
    done();
  }
});

module.exports = pool;