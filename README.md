# Graph Explorer

A full-stack, AI-powered Graph Visualization and Data Exploration platform.
This framework takes natural language questions ("Show me sales orders related to delivery X"),
deduces the required database multi-hop join paths using Google Gemini, runs the SQL natively, and
builds a real-time reactive Graph showing how the extracted rows relate to each other.

## Architecture Structure

The mono-repository is structured cleanly separating concerns:

### /frontend
A React.js application rendering real-time graphs with D3-force optimization via React Flow.
- **`src/components/`**: Pure UI layout components, separated from logic.
- **`src/hooks/`**: Business logic extraction (e.g., `useChatEngine.js` for API syncing).
- **`src/store/`**: Global Zustand state for history caching and view modes.

### /backend
An Express Node.js application driving the AI interpretation pipeline.
- **`src/controllers/`**: HTTP Request mapping directly controlling the business flow.
- **`src/services/`**: Independent, testable layers (Multi-Hop deduction, Neo4j Graph Builder, Postgres Execution Queue).
- **`src/config/`**: Centralized Database credentials and Schema mappings.
- **`src/scripts/`**: Development utility scripts for pinging and validating DB/AI models.

## Usage

**Frontend**
```bash
cd frontend
npm run dev
```

**Backend**
```bash
cd backend
node index.js
```


Copy

# Dodge-AI Graph Explorer
 
> A natural language-powered graph exploration tool for navigating complex datasets through conversation, visual graphs, and structured tables.
 
---
 
## Table of Contents
 
- [Overview](#overview)
- [Interface Layout](#interface-layout)
- [Executing a Query](#executing-a-query)
- [Graph Visualization](#graph-visualization)
- [Exploring Node Relationships](#exploring-node-relationships)
- [Filtering and Data Selection](#filtering-and-data-selection)
- [Performance and Rendering](#performance-and-rendering)
- [Query History](#query-history)
- [Natural Language Capability](#natural-language-capability)
- [Guardrails and Query Scope](#guardrails-and-query-scope)
- [Asset Structure](#asset-structure)
 
---
 
## Overview
 
The Dodge-AI Graph Explorer combines **natural language querying**, **visual graph exploration**, and **structured table inspection** to make navigating complex datasets intuitive and efficient. Instead of writing manual queries, you simply describe what you want to find — the system handles the rest.
 
---
 
## Interface Layout
 
When the application loads, the screen is divided into two primary areas:
 
### Chat Panel *(Right Side)*
 
This is where you interact with the AI.
 
- Type queries in plain English
- The system interprets your intent and retrieves relevant data
 
**Example query:**
```
Trace the full flow of a billing document
```
 
<p align="center">
  <img src="./assets/ui/01-initial-screen.png" width="800"/>
</p>
 
---
 
### Main Canvas *(Center Workspace)*
 
The central workspace contains three functional views:
 
| View | Purpose |
|---|---|
| **Database Schema Viewer** | Understand how entities are structured and related before querying |
| **Graph View** | Visual representation of nodes and edges when relationships are involved |
| **Table View** | Structured results with filtering and row selection |
 
<p align="center">
  <img src="./assets/ui/02-query-input.png" width="800"/>
</p>

<p align="center">
  <img src="./assets/ui/schema-view" width="800"/>
</p>

---
 
## Executing a Query
 
1. Type your query in the chat panel and submit it.
2. The system sends the request to the backend.
3. A **processing indicator** appears while the query runs.
4. The query is **logged in the sidebar** for later reuse.
 
<p align="center">
  <img src="./assets/ui/03-processing-state.png" width="300"/>
</p>
 
Once complete, the system returns:
 
- A **graph** (if relationships are involved)
- A **structured explanation** of the result
 
<p align="center">
  <img src="./assets/ui/04-query-result.png" width="800"/>
</p>
 
---
 
## Graph Visualization
 
When a query involves relationships between entities:
 
- **Nodes** represent entities (e.g., orders, deliveries, documents)
- **Edges** represent relationships between those entities
 
> **Note:** Graphs are generated only when necessary. Simple queries — such as lists or aggregations — return only table results.
 
<img src="./assets/ui/node-view.gif" width="800"/>
 
---
 
## Exploring Node Relationships
 
There are two ways to explore connections within the graph.
 
### Option 1 — Direct Node Interaction
 
Click on any node to:
 
- Expand its related nodes
- View the direction of relationships
- Access detailed metadata in a dialog panel
 
This is the fastest way to dynamically inspect connections.
 
### Option 2 — Table-Based Exploration
 
1. Navigate to the **Table View**
2. Use the search bar to filter results
   - Example: `delivery document-80738043`
3. Select one or more rows using the checkboxes
4. Switch back to the **Graph View**
5. Selected entries will be **highlighted** in the graph for focused analysis
 
<p align="center">
  <img src="./assets/ui/06-table-view.png" width="800"/>
  <img src="./assets/ui/07-table-selection.png" width="800"/>
  <img src="./assets/ui/08-graph-highlight.png" width="800"/>
</p>
 
---
 
## Filtering and Data Selection
 
The Table View provides structured control over your data:
 
- **Search and filter** large datasets using the search bar
- **Select multiple entities** using checkboxes
- **Narrow results** before switching to the graph for visualization
 
This is especially useful when working with large or complex query outputs.
 
---
 
## Performance and Rendering
 
To ensure smooth performance:
 
- Graphs are rendered **on demand** — only when required
- Large datasets are handled with **automatic pagination**
 
If the number of nodes exceeds **3,000**:
 
- Pagination is automatically applied
- Rendering is optimized to prevent UI slowdown
 
> Large graphs may take a few seconds to load depending on dataset size.
 
---
 
## Query History
 
- All queries are **stored locally in the browser**
- You can revisit and rerun previous queries at any time
 
<p align="center">
  <img src="./assets/ui/09-query-history.png" width="300"/>
</p>
 
### ⚠️ Known Issue
 
In some cases, **edges may take time to render** after revisiting a previous query.
 
**Temporary workaround:** Refresh the page and reload the query.
 
---
 
## Natural Language Capability
 
The system is designed to understand queries written in plain English. It can:
 
- Interpret intent from natural language
- Identify relevant entities and relationships in the dataset
- Generate structured backend queries automatically
- Return accurate, data-backed responses
 
<p align="center">
  <img src="./assets/ui/10-natural-language.png" width="800"/>
</p>
 
---
 
## Guardrails and Query Scope
 
The AI operates strictly within the bounds of the connected dataset.
 
| Type | Examples |
|---|---|
| ✅ **Supported** | Dataset-specific questions, relationship and flow analysis |
| ❌ **Not Supported** | General knowledge questions, unrelated or out-of-scope prompts |
 
If a query falls outside the dataset scope, the system responds:
 
```
This system is designed to answer questions related to the dataset only.
```
 
<p align="center">
  <img src="./assets/ui/11-guardrails.png" width="400" />
</p>


## How My Query is processed from frontend to backend

```
User types query
      │
      ▼
useChatEngine (Frontend Hook)
      │
      ▼
POST /api/interpret-query
      │
      ▼
multiHopService → promptGenerator (Gemini AI)
      │
      ├──► SQL → PostgreSQL → Table Data
      │
      └──► Cypher → Neo4j → Graph Nodes + Edges
      │
      ▼
Frontend renders Graph Canvas / Table Canvas / Chat
```

---

## Step 1 — User Types a Query

When you send a message like *"Show sales orders with broken delivery flows"*, the `Sidebar.jsx` calls the `useChatEngine` hook.

**File:** `frontend/src/hooks/useChatEngine.js`

- The query + last 6 messages of conversation history are bundled together.
- A `limit` setting controls how many results to fetch: `few` (default), `50%`, or `all`.
- An `AbortController` is attached so a stale request can be instantly cancelled.

---

## Step 2 — Sending to the Backend

**File:** `frontend/src/services/api.js`

The hook calls `interpretQuery()`, which sends:

```json
POST /api/interpret-query
{
  "query": "Show sales orders with broken delivery flows",
  "history": [...last 6 messages],
  "limit": "few"
}
```

The Nginx reverse proxy routes this from the frontend port `5173` → backend port `3000`.

---

## Step 3 — AI Query Planning (Gemini)

**File:** `backend/src/services/promptGenerator.js`

The backend passes the query to **Google Gemini** (via the `@google/generative-ai` SDK).

The system prompt instructs Gemini to act as a *Senior Data Engineer + AI Query Planner*. It is given:

- The **full PostgreSQL database schema** (all tables + columns).
- All **relationship definitions** (JOIN paths between tables).
- **Strict SQL rules**: always `SELECT DISTINCT`, never use `LIMIT 100`, always use PostgreSQL-native functions.
- **Graph generation rules**: only generate Cypher if the query implies tracing a flow or relationship.

Gemini responds with a structured **Execution Plan** in JSON:

```json
{
  "type": "graph",
  "message": "Here is the order-to-cash flow...",
  "queries": [
    { "sql": "SELECT DISTINCT soh.sales_order, ...", "purpose": "Fetch order-delivery chain" }
  ],
  "cypher": "UNWIND $rows AS row\nFOREACH (_ IN CASE WHEN row.sales_order IS NOT NULL THEN [1] ...",
  "options": [{ "label": "Show billing documents", "action": "..." }]
}
```

### 🔄 API Key Rotation & Multi-Model Fallback

If Gemini returns a `429 Rate Limit` error, the system automatically:
1. Rotates to the next API key (`GEMINI_API_KEY1` → `GEMINI_API_KEY2` → ... up to 5 keys).
2. If all keys are exhausted for a model, switches to the next model:
   - `gemini-2.5-flash` → `gemini-2.5-pro` → `gemini-2.0-flash` → etc.

---

## Step 4 — Plan Validation

**File:** `backend/src/utils/validatePlan.js`

Before executing anything, the AI's plan is validated:
- Does it have valid SQL queries?
- Are the node types recognizable?
- Is the Cypher safe to run?

If validation **fails**, the system gracefully returns a `clarification_required` message instead of crashing, and suggests alternative follow-up actions.

---

## Step 5A — SQL Execution (PostgreSQL)

**File:** `backend/src/services/executionQueue.js`

For all plan types (`graph`, `chat`, `interactive`), the SQL queries are executed against **PostgreSQL**.

```sql
SELECT DISTINCT soh.sales_order, soi.sales_order_item, odh.delivery_document, ...
FROM sales_order_headers soh
LEFT JOIN sales_order_items soi ON soh.sales_order = soi.sales_order
LEFT JOIN outbound_delivery_items odi ON soi.sales_order = odi.reference_sd_document
...
LIMIT 5000
```

The results are:
- Stored in `plan.table` (the **Table Canvas**).
- Passed into the next step as `$rows` for graph hydration.

---

## Step 5B — Graph Generation (Neo4j)

**File:** `backend/src/services/neo4jService.js`

If the plan type is `graph`, the Cypher query runs on **Neo4j**. The SQL results from Step 5A are passed as `$rows` parameters so the graph always reflects the real data.

**Example Cypher pattern:**
```cypher
UNWIND $rows AS row

FOREACH (_ IN CASE WHEN row.sales_order IS NOT NULL THEN [1] ELSE [] END |
  MERGE (so:SalesOrder {id: row.sales_order})
)
FOREACH (_ IN CASE WHEN row.delivery_document IS NOT NULL THEN [1] ELSE [] END |
  MERGE (od:OutboundDelivery {id: row.delivery_document})
  MERGE (so:SalesOrder {id: row.sales_order})
  MERGE (so)-[:DELIVERED_AS]->(od)
)

MATCH (n) WHERE n.id IN all_ids
OPTIONAL MATCH (n)-[r]-(m) WHERE m.id IN all_ids
RETURN n, r, m
```

This `FOREACH` + null-safe `MERGE` pattern ensures:
- No rows are silently dropped if a column is `NULL`.
- Isolated nodes are still returned (no `RETURN p` path dropping).

Neo4j returns `nodes[]` and `edges[]`, which the frontend renders with **React Flow + D3 Force** physics.

---

## Step 6 — Silent Retry on Failure

**File:** `frontend/src/hooks/useChatEngine.js`

If the SQL or graph execution fails (e.g. a column name mismatch), the frontend **automatically retries once**:

1. The original error message is packaged into a new "healing" prompt sent back to Gemini.
2. Gemini is told: *"Your previous plan failed with this error: [error]. Fix the query."*
3. The corrected plan is executed.

This happens silently — the user only sees the final result, not the retry attempt.

---

## Step 7 — Frontend Rendering

**Files:** `GraphCanvas.jsx`, `Sidebar.jsx`, `useChatStore.js`

Based on the response type, the UI switches canvas views:

| Response Type | Canvas Shown | What Gets Populated |
|---|---|---|
| `graph` | Graph Canvas | Nodes + Edges via React Flow |
| `chat` / `interactive` | Table Canvas | Tabular SQL rows |
| `clarification_required` | Chat Sidebar | Follow-up suggestion chips |

The query is also saved to the search history cache so it can be quickly toggled via the **Recent Searches** topbar.

---

## 🔑 Key Files Reference

| File | Role |
|---|---|
| `frontend/src/hooks/useChatEngine.js` | Orchestrates the whole query lifecycle |
| `frontend/src/services/api.js` | HTTP calls to the backend |
| `backend/src/services/promptGenerator.js` | Builds the Gemini prompt + executes AI |
| `backend/src/services/multiHopService.js` | Coordinates SQL + Cypher execution |
| `backend/src/services/executionQueue.js` | Runs SQL against PostgreSQL |
| `backend/src/services/neo4jService.js` | Runs Cypher against Neo4j |
| `backend/src/utils/validatePlan.js` | Validates AI plan before execution |
| `backend/src/services/keyManager.js` | Rotates Gemini API keys on rate limits |

