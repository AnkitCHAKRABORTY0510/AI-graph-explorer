import { processMultiHopQuery } from '../services/multiHopService.js';

/**
 * Handles interpretation of natural language queries using AI.
 * Upgrades queries based on user confirmation of typos, runs the multi-hop service,
 * and passes the generated execution plan back to the client.
 * 
 * @param {import('express').Request} req - Express Request
 * @param {import('express').Response} res - Express Response
 */
export const interpretQuery = async (req, res) => {
  try {
    const { query, suggested_statement, history = [], limit = 'few' } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    
    let queryToProcess = query;
    const isConfirmation = ["yes", "y", "yeah", "yep", "sure", "correct"].includes(query.trim().toLowerCase());
    
    if (isConfirmation && suggested_statement) {
       queryToProcess = suggested_statement;
       console.log(`✅ User confirmed typo suggestion. Upgraded query to: "${queryToProcess}"`);
    } else {
       console.log("Processing multi-hop query: " + queryToProcess + " | Limit: " + limit);
    }
    
    const plan = await processMultiHopQuery(queryToProcess, history, limit);
    
    // Attach the query to the plan for execution-layer logging and frontend tracking
    plan.query = queryToProcess;
    
    res.json(plan);
    
  } catch (error) {
    console.error("AI Interpret Error:", error);
    
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.error && parsedError.hint) {
        return res.status(400).json(parsedError);
      }
    } catch (e) {}

    res.status(500).json({ 
      error: "AI interpretation failed", 
      message: error.message,
      hint: "The AI encountered an issue processing your request. Please try a different query." 
    });
  }
};
