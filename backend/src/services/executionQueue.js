import pool from '../config/db.js';

export async function processExecutionQueue(queries) {
  if (!queries || !Array.isArray(queries)) return [];
  
  const client = await pool.connect();
  const allRows = [];
  
  try {
    for (const q of queries) {
      console.log(`\n⏳ Executing Queue Item: ${q.purpose || 'SQL Execution'}`);
      console.log(`💻 SQL: ${q.sql}`);
      
      const result = await client.query(q.sql);
      console.log(`✅ Loaded ${result.rows.length} rows`);
      
      allRows.push(...result.rows);
    }
    return allRows;
  } finally {
    client.release();
  }
}
