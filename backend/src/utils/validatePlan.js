export function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('Invalid plan structure: not an object');
  }

  // If the AI is asking for user clarification, bypass execution validation
  if (plan.type === 'clarification_required' || plan.type === 'interactive') {
    return { isValid: true };
  }

  // Data-heavy types must have valid queries or a static graph
  if (plan.type === 'graph') {
    const hasSql = Array.isArray(plan.queries) && plan.queries.length > 0;
    const hasCypher = typeof plan.cypher === 'string' && plan.cypher.length > 0;
    const hasStaticGraph = plan.graph && Array.isArray(plan.graph.nodes) && Array.isArray(plan.graph.edges);

    if (!hasSql && !hasCypher && !hasStaticGraph) {
        return {
          isValid: false,
          error: "Invalid plan: Missing executable queries or static graph payload",
          hint: "The AI failed to generate SQL, Cypher, or a static mapping for this request. Try rephrasing or asking interactively."
        };
    }
  }

  const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE'];

  if (Array.isArray(plan.queries) && plan.queries.length > 0) {
    for (const q of plan.queries) {
      if (!q.sql || typeof q.sql !== 'string') {
        return {
          isValid: false,
          error: "Invalid plan: Broken query object",
          hint: "One of the generated queries is missing SQL text."
        };
      }
      
      const upperSql = q.sql.toUpperCase();
      
      // 1. Strict SELECT only
      if (!upperSql.startsWith('SELECT')) {
        return {
          isValid: false,
          error: "Forbidden SQL operation detected: Non-SELECT query",
          hint: "Only SELECT queries are allowed for security reasons."
        };
      }

      // 2. Forbidden Keywords check
      for (const keyword of forbiddenKeywords) {
        if (upperSql.includes(keyword)) {
          return {
            isValid: false,
            error: `Forbidden SQL operation detected: ${keyword}`,
            hint: "Only SELECT queries are allowed. Operations like INSERT, UPDATE, DELETE, etc., are strictly prohibited."
          };
        }
      }

      // 3. Prevent SELECT *
      if (upperSql.includes('SELECT *')) {
        return {
          isValid: false,
          error: "Forbidden SQL pattern: SELECT *",
          hint: "Please specify explicit columns instead of using '*' to improve performance and reliability."
        };
      }
    }
  }

  // 4. Graph Validation
  if (!plan.graph || typeof plan.graph !== 'object') {
     // Chat doesn't need a graph, and Graph types with Cypher will build it dynamically
     const hasSql = Array.isArray(plan.queries) && plan.queries.length > 0;
     if (plan.type === 'chat' || (plan.type === 'graph' && (plan.cypher || hasSql))) return { isValid: true };

     return {
      isValid: false,
      error: "Invalid plan: Missing graph mapping",
      hint: "The AI failed to generate a valid graph for this query. Please try rephrasing."
    };
  }

  if (!Array.isArray(plan.graph.nodes) || !Array.isArray(plan.graph.edges)) {
    return {
      isValid: false,
      error: "Invalid plan: Broken graph structure",
      hint: "The AI generated an incomplete graph. Please try a simpler query."
    };
  }

  return { isValid: true };
}
