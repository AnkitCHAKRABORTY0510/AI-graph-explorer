import { loadSchema } from '../utils/schemaLoader.js';

/**
 * Fetches and serves the raw database schema representations.
 * 
 * @param {import('express').Request} req - Express Request
 * @param {import('express').Response} res - Express Response
 */
export const getSchema = (req, res) => {
  try {
    const schema = loadSchema();
    res.json(schema);
  } catch (error) {
    console.error('Schema Load Error:', error);
    res.status(500).json({ error: error.message });
  }
};
