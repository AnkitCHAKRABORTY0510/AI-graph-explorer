import { processExecutionQueue } from '../services/executionQueue.js';
import { buildGraphFromRows } from '../services/graphBuilder.js';
import { validatePlan } from '../utils/validatePlan.js';

/**
 * Handles the execution of a validated AI-generated SQL plan.
 * Executes the queries on the database securely, then maps the raw rows to 
 * a structured graph format.
 * 
 * @param {import('express').Request} req - Express Request
 * @param {import('express').Response} res - Express Response
 */
export const executeGraph = async (req, res) => {
  try {
    const plan = req.body;
    
    const validation = validatePlan(plan);
    if (!validation.isValid) {
       return res.status(400).json({ 
         error: validation.error || 'Invalid Plan', 
         hint: validation.hint || 'Check query syntax' 
       });
    }

    if (plan.type === 'clarification_required' || plan.type === 'interactive') {
       return res.status(400).json({ error: 'Cannot execute a non-data payload. Use a data-producing mode.' });
    }

    const rows = await processExecutionQueue(plan.queries);
    const graphData = await buildGraphFromRows(rows, plan);
    
    res.json(graphData);
  } catch (error) {
    console.error('Graph Execution Error:', error);
    res.status(500).json({ error: error.message });
  }
};
