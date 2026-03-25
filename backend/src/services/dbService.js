import pool from '../config/db.js';
import { validatePlan } from '../utils/validatePlan.js';

export async function executePlanQuery(plan) {
  validatePlan(plan);
  const client = await pool.connect();
  try {
    const result = await client.query(plan.sql);
    return result.rows;
  } finally {
    client.release();
  }
}
