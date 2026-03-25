import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // IMPORTANT for Supabase
  ssl: {
    rejectUnauthorized: false
  }
});

const pingDB = async () => {
  try {
    console.log("🔌 Connecting to database...");

    const res = await pool.query("SELECT NOW()");

    console.log("✅ Connected successfully!");
    console.log("🕒 Server Time:", res.rows[0].now);

    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err.message);

    process.exit(1);
  }
};

pingDB();