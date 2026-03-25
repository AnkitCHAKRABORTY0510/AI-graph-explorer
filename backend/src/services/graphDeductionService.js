import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { keyManager } from './keyManager.js';

dotenv.config();

/**
 * Uses LLM to deduce relationships between disparate row sets from SQL.
 */
export async function deduceGraph(rowsByTable, schema) {
  const currentKey = keyManager.getCurrentKey();
  const genAI = new GoogleGenerativeAI(currentKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a Data Graph Engineer. I have several sets of rows from different Order-to-Cash (O2C) tables.
    Your task is to identify relationships (edges) between these rows by matching attribute values.
    
    TABLE DATA:
    ${JSON.stringify(rowsByTable, null, 2)}
    
    SCHEMA RELATIONSHIPS (Hints):
    ${JSON.stringify(schema.relationships, null, 2)}
    
    INSTRUCTIONS:
    1. STRICT DEDUPLICATION: Do NOT create duplicate nodes. If multiple rows contain the same entity (e.g., Product '3001456' or Storage Location 'WB05'), you MUST create exactly ONE node for that entity. 
    2. The node "id" MUST be the exact unique database key/name (e.g., "3001456"). DO NOT prepend row numbers.
    3. Create an "edge" between nodes that are related in the same row.
    4. Return ONLY a JSON object with this structure:
       {
         "nodes": [{ "id": "...", "label": "Human Readable Name", "typeLabel": "Entity Type", "color": "hex" }],
         "edges": [{ "id": "...", "source": "...", "target": "...", "label": "RELATIONSHIP_TYPE" }]
       }
    
    COLORS:
    - SalesOrder: #4F46E5
    - Delivery: #F59E0B
    - Billing: #EF4444
    - Payment: #10B981
    - Customer / BusinessPartner: #6B7280
    - Product / Material: #3B82F6
    - StorageLocation / Plant: #8B5CF6
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const graphData = JSON.parse(cleanJson);

    // Javascript Post-Process Deduplication Guard
    const uniqueNodes = new Map();
    (graphData.nodes || []).forEach(n => {
       if (!uniqueNodes.has(n.id)) uniqueNodes.set(n.id, n);
    });
    
    // Deduplicate Edges (just in case AI draws the exact same link twice)
    const uniqueEdges = new Map();
    (graphData.edges || []).forEach(e => {
       const edgeKey = e.source + '-' + e.target + '-' + e.label;
       if (!uniqueEdges.has(edgeKey)) uniqueEdges.set(edgeKey, e);
    });

    return { 
      nodes: Array.from(uniqueNodes.values()), 
      edges: Array.from(uniqueEdges.values()) 
    };
  } catch (err) {
    console.error("Graph Deduction Error:", err);
    return { nodes: [], edges: [] };
  }
}
