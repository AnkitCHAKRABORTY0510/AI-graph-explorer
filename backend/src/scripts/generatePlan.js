import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadSchema } from '../utils/schemaLoader.js';

export async function generatePlan(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", generationConfig: { responseMimeType: "application/json" } });

  const schema = loadSchema();
  const schemaStr = JSON.stringify(schema, null, 2);

  const prompt = `
You are an expert system architect and SQL developer for a PostgreSQL and Neo4j graph database system.
Your goal is to convert natural language queries into an execution plan.

Here is the database schema:
${schemaStr}

User Query: "${query}"

Return a STRICT JSON object representing the execution plan. Do not include markdown blocks like \`\`\`json.
The JSON must have the following structure:
{
  "sql": "A valid PostgreSQL SELECT query joining the necessary tables. MUST include LIMIT 1000. MUST NOT use SELECT *. DO NOT include a terminating semicolon.",
  "graph": {
    "from": {
      "label": "The Neo4j Node Label for the source entity (e.g. SalesOrder)",
      "id_field": "The EXACT column name from the SQL SELECT clause to use as the unique ID for the source node"
    },
    "to": {
      "label": "The Neo4j Node Label for the target entity (e.g. DeliveryDocument)",
      "id_field": "The EXACT column name from the SQL SELECT clause to use as the unique ID for the target node"
    },
    "relationship": "The relationship type between from and to (e.g. HAS_DELIVERY). MUST BE UPPERCASE SNAKE_CASE."
  }
}

Constraints:
1. The SQL query MUST ONLY be a SELECT statement. No mutations.
2. Ensure you join tables correctly using standard primary/foreign key logic based on column names.
3. The id_field in the graph mapping MUST EXACTLY MATCH an alias or column selected in your SQL query.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const plan = JSON.parse(text);
    return plan;
  } catch (error) {
    throw new Error('Failed to parse Gemini response as JSON: ' + text);
  }
}
