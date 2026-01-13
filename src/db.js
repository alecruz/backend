// src/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

// Función helper para hacer consultas
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  query,
};
