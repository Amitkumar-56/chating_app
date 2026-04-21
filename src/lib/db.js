import mysql from 'mysql2/promise';


const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'masafipetro_dev',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Generic query function for executing SQL commands
 */
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error(`Database Error: ${error.message}`);
    throw error;
  }
}

export const executeQuery = query;
export default pool;
