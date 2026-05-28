import { Pool } from "pg";

// The Pool manages multiple database connections efficiently.
// It reuses connections instead of opening a new TCP connection on every request.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;
