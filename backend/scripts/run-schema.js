import fs from "fs";
import pool from "../db/connection.js";

const runSchema = async () => {
  try {
    const sql = fs.readFileSync("./db/schema.sql", "utf-8");

    console.log("Running schema...");
    await pool.query(sql);

    console.log("✅ Database schema created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating schema:", err);
    process.exit(1);
  }
};

runSchema();