import { Pool } from 'pg';

let pool;

if (!pool) {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: false, // Assuming local development, adjust for production
  });
}

export default pool;
