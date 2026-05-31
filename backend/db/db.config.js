import 'dotenv/config';
import mysql from 'mysql2/promise';

/**
 * Create a pool of connections to the database.
 * @returns {Promise<Pool>} A pool of connections to the database.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;
