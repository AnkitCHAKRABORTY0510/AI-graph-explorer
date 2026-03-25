import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pkg;

async function testPort(port) {
  const client = new Client({
    host: process.env.DB_HOST,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`✅ Success connecting to port ${port}!`);
    await client.end();
  } catch(e) {
    console.log(`❌ Failed port ${port}: ${e.message}`);
  }
}

async function run() {
  console.log("Testing port 5432 (Direct IPv6)...");
  await testPort(5432);
  console.log("Testing port 6543 (Transaction Pooler)...");
  await testPort(6543);
}

run();
