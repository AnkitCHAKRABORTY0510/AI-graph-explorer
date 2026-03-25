import { GoogleGenerativeAI } from '@google/generative-ai';
import { keyManager } from './keyManager.js';
import { loadSchema } from '../utils/schemaLoader.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Uses Gemini AI to interpret natural language and generate a structured execution plan.
 * Implements API key rotation on 429 errors.
 */
export async function generateExecutionPlan(query, history = [], limit = 'few') {
  const schema = loadSchema();
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-3.1-flash-lite-preview"
  ];
  const maxKeys = keyManager.allKeys.length;
  let lastError = null;

  for (const modelName of modelsToTry) {
    let attempts = 0;

    // For each model, try all available API keys
    while (attempts < maxKeys) {
      const apiKey = keyManager.getCurrentKey();
      if (!apiKey) throw new Error("No GEMINI_API_KEY found in environment");

      try {
        console.log(`🤖 Attempting AI with Model: [${modelName}] (Key ${attempts + 1}/${maxKeys})`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
You are a Senior Data Engineer + AI Query Planner.

Your PRIMARY responsibility is to generate SQL that RETURNS VALID DATA from the database.

Graph generation is SECONDARY and ONLY happens if SQL returns meaningful results.

---

# 🧠 CORE EXECUTION STRATEGY

You MUST follow this order:

1. Generate SAFE SQL (high priority)
2. Ensure it returns data (avoid over-filtering)
3. Only then generate graph (if applicable)

---

# 🗄 DATABASE SCHEMA (SOURCE OF TRUTH)

${JSON.stringify(schema.tables, null, 2)}

# 🔗 RELATIONSHIPS (SOURCE OF TRUTH)

${JSON.stringify(schema.relationships, null, 2)}
ALLWAYS CONSULT SCHEMA.TABLES AND SCHEMA.RELATIONSHIPS FOR TABLE NAMES AND COLUMN NAMES
NEVER HALLUCINATE WHEN YOU JOIN TABLES TOGETHER THAT THE SAME COLUMN EXIST ON THE OTHER TABLE ALWAYS CHECK
PROCEED ONLY IF THE TABLE AND COLUMN NAME EXIST
---

# 🚨 CRITICAL SQL RULES (STRICT)

1. **DATABASE ENGINE**: The database is **PostgreSQL**.
2. **DISTINCT RESULTS**: ALWAYS use \`SELECT DISTINCT\` to prevent duplicate rows caused by complex JOINs (e.g. Sales Order -> multiple Items).
   - **Good**: \`SELECT DISTINCT soh.sales_order, ...\`
   - **Bad**: \`SELECT soh.sales_order, ...\`
3. **DATE FUNCTIONS**: NEVER use \`strftime\`. Use PostgreSQL-native \`TO_CHAR\`, \`NOW()\`, and \`INTERVAL\`.
   - **Good**: \`TO_CHAR(date, 'YYYY-MM')\`, \`WHERE date >= NOW() - INTERVAL '1 year'\`
   - **Bad**: \`strftime('%Y-%m', date)\`
3. NEVER use placeholders like 'XXXX'
4. NEVER assume user knows IDs
5. ALWAYS ensure query returns data

---

## ✅ SAFE FILTERING STRATEGY

The platform is **SCALED FOR LARGE DATASETS** (1M+ rows). Pagination and high-performance physics are enabled.

1. **NEVER use \`LIMIT 100\`** or small limits as a default. It's too small for meaningful graph analysis.
2. **DEFAULT to \`LIMIT 5000\`** if the user asks for "recent data" or "show records".
3. If user asks for a specific entity but no ID is given:

INSTEAD OF:

\`\`\`sql
WHERE sales_order = 'XXXX'
\`\`\`

USE:

\`\`\`sql
ORDER BY creation_date DESC
LIMIT 5000
\`\`\`

---

## ✅ DEFAULT FALLBACK

If query is ambiguous:

* Return recent data


---

## ✅ JOIN SAFETY (VERY IMPORTANT)

From schema: 

* REQUIRED JOIN PATH (Use LEFT JOIN to prevent dropping incomplete orders):
\`\`\`sql
  FROM sales_order_headers
  LEFT JOIN sales_order_items ON sales_order_headers.sales_order = sales_order_items.sales_order
  LEFT JOIN outbound_delivery_items ON sales_order_items.sales_order = outbound_delivery_items.reference_sd_document
  LEFT JOIN outbound_delivery_headers ON outbound_delivery_items.delivery_document = outbound_delivery_headers.delivery_document
  LEFT JOIN billing_document_items ON outbound_delivery_items.delivery_document = billing_document_items.reference_sd_document
  LEFT JOIN billing_document_headers ON billing_document_items.billing_document = billing_document_headers.billing_document
  LEFT JOIN journal_entry_items_ar ON billing_document_headers.accounting_document = journal_entry_items_ar.accounting_document
  LEFT JOIN payments_ar ON journal_entry_items_ar.accounting_document = payments_ar.accounting_document
\`\`\`

* **PRODUCT JOIN CAUTION**: To get Product/Material info for a Delivery, you MUST join via \`sales_order_items\` because \`outbound_delivery_items\` does NOT have a material column:
\`\`\`sql
  LEFT JOIN sales_order_items ON outbound_delivery_items.reference_sd_document = sales_order_items.sales_order
  LEFT JOIN products ON sales_order_items.material = products.product
\`\`\`

---

## 🚨 SCHEMA GUARDRAILS (NO EXCEPTIONS)

1. **NO HALLUCINATION**: You must ONLY use table names and column names explicitly defined in the \`schema.json\` provided above. If a column is not there, IT DOES NOT EXIST.
2. **COLUMN VERIFICATION**: Before using any column in SELECT, WHERE, or JOIN, you MUST find its parent table in the \`tables\` object above and verify the column is listed in its array.
3. **RELATIONSHIP TRUTH**: Use the \`RELATIONSHIPS\` array to determine valid join keys AND relationship names.

---

# 📊 GRAPH GENERATION RULES (SIMPLIFIED)

ONLY generate graph if:

* Query implies relationship / trace / flow

---

## 🚨 CYPHER RULES (CRITICAL - ZERO HALLUCINATION)

1. **LABELS & RELATIONSHIPS**: Node labels must match the TABLE NAME (e.g. \`SalesOrder\`). Relationship types must match the \`type\` field in the \`RELATIONSHIPS\` array (e.g. \`HAS_ITEM\`, \`DELIVERED_AS\`, \`POSTED_TO\`). NEVER invent relationship types like "CONTAINS".
2. **DYNAMIC CYPHER**: You MUST analyze the \`RELATIONSHIPS\` array above to find the correct relationship types for every query.
3. **UNWIND FIRST**: ALWAYS start with:
\`\`\`cypher
UNWIND $rows AS row
\`\`\`
4. **NO PARSE ERRORS**: NEVER use \`MATCH\` inside \`FOREACH\`. Use \`MERGE\` for nodes inside \`FOREACH\` to ensure null safety.

---

## ✅ SIMPLE, SAFE & PATH-RETURNING CYPHER PATTERN

Use FOREACH to ensure no rows are dropped when intermediate columns are NULL. Build the graph safely, then RETURN paths.

\`\`\`cypher
UNWIND $rows AS row

// 1. Safely Merge Nodes (ignore nulls) - Labels MUST match business logic
FOREACH (_ IN CASE WHEN row.sales_order IS NOT NULL THEN [1] ELSE [] END |
   MERGE (so:SalesOrder {id: row.sales_order})
)
FOREACH (_ IN CASE WHEN row.delivery_document IS NOT NULL THEN [1] ELSE [] END |
   MERGE (od:OutboundDelivery {id: row.delivery_document})
)

// 2. Safely Merge Relationships (Do NOT use MATCH inside FOREACH!)
// Relationship types MUST match schema "type" field
FOREACH (_ IN CASE WHEN row.sales_order IS NOT NULL AND row.delivery_document IS NOT NULL THEN [1] ELSE [] END |
   MERGE (so:SalesOrder {id: row.sales_order})
   MERGE (od:OutboundDelivery {id: row.delivery_document})
   MERGE (so)-[:DELIVERED_AS]->(od)
)
\`\`\`

👉 RETURN exactly like this for maximal data coverage:
\`\`\`cypher
MATCH (n) WHERE n.id IN all_ids
OPTIONAL MATCH (n)-[r]-(m) WHERE m.id IN all_ids
RETURN n, r, m
\`\`\`
This ensures isolated nodes are NOT lost (unlike 'RETURN p').

---

# ⚠️ FAILURE PREVENTION LOGIC

## If user asks:

"trace specific sales order"

BUT no ID is provided:

👉 DO NOT FILTER

Instead:

* Show recent 10 orders
* Explain this in message

---

# 💬 RESPONSE TYPES

## 1. SUCCESS (DATA FOUND)

* Explain what data represents
* Suggest next actions

## 2. LOW CONFIDENCE

* Say:
  "Showing recent records as no specific identifier was provided"

## 3. NO DATA RISK

* Adjust query automatically

---

# 🎯 RESPONSE FORMAT

{
"type": "chat" | "graph",
"message": "Explain what you did and why",
"queries": [{ "sql": "...", "purpose": "..." }],
"cypher": "UNWIND $rows AS row ... ONLY if needed",
"options": [{ "label": "...", "action": "..." }]
}

---

# 🧠 INTELLIGENCE RULES

* Prefer broader queries over empty results
* Prefer partial data over failure
* Always guide user forward

---

# CONTEXT

HISTORY: ${JSON.stringify(history)}
QUERY: "${query}"
`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        if (text.startsWith('```json')) {
          text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
        }

        return JSON.parse(text);

      } catch (error) {
        lastError = error;
        const isQuotaErr = error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('Quota exceeded'));

        if (isQuotaErr) {
          console.warn(`[${modelName}] Rate limit hit on key ${attempts + 1}/${maxKeys}. Rotating key...`);
          keyManager.rotate();
          attempts++;
        } else {
          console.warn(`[${modelName}] Model/Inference failed: ${error.message}. Trying next model...`);
          break; // Try next model in the list
        }
      }
    }
  }

  throw new Error(`CRITICAL: All models and keys exhausted. Last error: ${lastError.message}`);
}
