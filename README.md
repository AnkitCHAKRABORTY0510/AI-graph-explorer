# AI-Graph Explorer

A natural language-powered graph exploration framework for navigating complex unstructured relational datasets through conversation, visual graphs, and structured table inspection.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![React Flow](https://img.shields.io/badge/ReactFlow-Graph_UI-FF0072?style=flat-square&logo=react&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-Visualization-F9A03C?style=flat-square&logo=d3.js&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State_Management-000000?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Cloud_DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-Aura-008CC1?style=flat-square&logo=neo4j&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite&logoColor=white)

---

## Live Demo

**[http://16.171.65.40/](http://16.171.65.40/)**

> **Note:** The live instance depends on a Neo4j Aura free-tier database. Free-tier instances are paused automatically after a period of inactivity. If the application is unresponsive or the graph queries are failing, the Neo4j instance may need to be resumed.
>
> To request the instance be brought back online, contact: **ankitchakraborty0510@gmail.com**

---

## Overview

AI-Graph Explorer bridges the gap between natural language intent and multi-hop relational data. You describe what you want to find in plain English. The system deduces the required join paths across your PostgreSQL schema using Google Gemini, executes the SQL, hydrates a live Neo4j graph from the results, and renders the relationships as an interactive force-directed canvas.

No manual query writing. No pre-baked graph schemas. The graph is always derived from real, live data.

---

## Table of Contents

- [Architecture](#architecture)
- [Interface Layout](#interface-layout)
- [Query Pipeline](#query-pipeline)
- [Core Design Decisions](#core-design-decisions)
- [Graph Visualization](#graph-visualization)
- [Table View and Filtering](#table-view-and-filtering)
- [Pagination and Performance](#pagination-and-performance)
- [Caching](#caching)
- [Rate Limiting and Model Fallback](#rate-limiting-and-model-fallback)
- [Self-Healing on Failure](#self-healing-on-failure)
- [Scalability Roadmap](#scalability-roadmap)
- [Local Setup Guide](#local-setup-guide)
- [Common Issues](#common-issues)
- [Future Improvements](#future-improvements)
- [Project Structure](#project-structure)
- [Key Files Reference](#key-files-reference)

---

## Architecture

```
User Query
    |
    v
useChatEngine  (Frontend Hook)
    |
    v
POST /api/interpret-query
    |
    v
multiHopService  -->  promptGenerator  (Gemini AI)
    |
    |---->  SQL  -->  PostgreSQL  -->  Table Data
    |
    +---->  Cypher  -->  Neo4j  -->  Graph Nodes + Edges
    |
    v
Frontend renders  Graph Canvas / Table Canvas / Chat
```

**Dual-database strategy:**

| Layer | Role |
|---|---|
| PostgreSQL (Supabase) | Source of truth — executes aggregations, filters, and large row scans |
| Neo4j (Aura) | Graph projection engine — builds an in-memory relationship graph from PostgreSQL rows at query time |
| Google Gemini | AI query planner — receives the full schema and returns a structured JSON execution plan |

---

## Interface Layout

### Chat Panel (Right Side)

Where you interact with the AI. Type queries in plain English; the system interprets intent and retrieves the relevant data.

Example:
```
Trace the full flow of a billing document
```

<p align="center">
  <img src="./assets/ui/01-initial-screen.png" width="800"/>
</p>

### Main Canvas (Center Workspace)

| View | Purpose |
|---|---|
| Database Schema Viewer | Understand entity structure and relationships before querying |
| Graph View | Visual representation of nodes and edges when relationships are involved |
| Table View | Structured results with filtering and row selection |

<p align="center">
  <img src="./assets/ui/02-query-input.png" width="800"/>
</p>

<p align="center">
  <img src="./assets/ui/schema-view.png" width="800"/>
</p>

### Executing a Query

1. Type your query in the chat panel and submit it
2. A processing indicator appears while the query runs
3. The query is logged in the sidebar for later reuse

<p align="center">
  <img src="./assets/ui/03-processing-state.png" width="300"/>
</p>

Once complete, the system returns a graph (if relationships are involved) and a structured explanation of the result.

<p align="center">
  <img src="./assets/ui/04-query-result.png" width="800"/>
</p>

### Graph View

Nodes represent entities (orders, deliveries, documents). Edges represent the relationships between them. Click any node to expand its connections, view relationship direction, and access metadata in a side panel.

<p align="center">
  <img src="./assets/ui/node-view.gif" width="800"/>
</p>

### Table View and Row Selection

Filter results using the search bar, select one or more rows using checkboxes, then switch to Graph View — selected rows are highlighted in the graph for focused analysis.


### Natural Language Capability

<p align="center">
  <img src="./assets/ui/10-natural-language.png" width="800"/>
</p>

### Query History

All queries are stored locally in the browser and can be revisited at any time via the Recent Searches topbar.

<p align="center">
  <img src="./assets/ui/09-query-history.png" width="300"/>
</p>

**Known issue:** Edges may take time to render after revisiting a query from history. Workaround: refresh the page and reload the query.

### Guardrails

<p align="center">
  <img src="./assets/ui/11-guardrails.png" width="400"/>
</p>

---

## Query Pipeline

### Step 1 — User Submits a Query

`frontend/src/hooks/useChatEngine.js`

The query plus the last 6 messages of conversation history are bundled. A `limit` setting controls result volume (`few` by default, `50%`, or `all`). An `AbortController` is attached so stale requests can be cancelled immediately.

### Step 2 — HTTP Request to the Backend

`frontend/src/services/api.js`

```json
POST /api/interpret-query
{
  "query": "Show sales orders with broken delivery flows",
  "history": [...last 6 messages],
  "limit": "few"
}
```

Nginx routes traffic from frontend port `5173` to backend port `3000`.

### Step 3 — AI Query Planning via Gemini

`backend/src/services/promptGenerator.js`

Gemini receives:
- The full PostgreSQL schema (all tables and columns)
- All relationship definitions (JOIN paths)
- Strict guardrails: always `SELECT DISTINCT`, never `LIMIT 100`, always use PostgreSQL-native functions
- Conversation history for context-aware follow-ups

Gemini returns a structured JSON execution plan:

```json
{
  "type": "graph",
  "message": "Here is the order-to-cash flow...",
  "queries": [
    { "sql": "SELECT DISTINCT soh.sales_order, ...", "purpose": "Fetch order-delivery chain" }
  ],
  "cypher": "UNWIND $rows AS row\nFOREACH (_ IN CASE WHEN row.sales_order IS NOT NULL ...)",
  "options": [{ "label": "Show billing documents", "action": "..." }]
}
```

Gemini acts as a **planner**, not an executor. Business logic stays in code.

### Step 4 — Plan Validation

`backend/src/utils/validatePlan.js`

Before execution, the plan is validated for SQL integrity, recognizable node types, and safe Cypher. Validation failure returns a `clarification_required` message with suggested follow-ups rather than crashing.

### Step 5A — SQL Execution (PostgreSQL)

`backend/src/services/executionQueue.js`

SQL queries run against PostgreSQL. Results populate the Table Canvas and are passed as `$rows` to the Cypher step.

### Step 5B — Graph Generation (Neo4j)

`backend/src/services/neo4jService.js`

For `graph`-type responses, the Cypher query runs on Neo4j with the PostgreSQL rows as parameters. The `FOREACH` + null-safe `MERGE` pattern ensures no rows are dropped on `NULL` columns and isolated nodes are still returned.

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
```

Neo4j returns `nodes[]` and `edges[]`. The frontend renders these with **React Flow + D3 Force** physics.

### Step 6 — Silent Retry on Failure

`frontend/src/hooks/useChatEngine.js`

If execution fails, the frontend retries once by sending a healing prompt to Gemini:

```
"The previous execution for query '...' failed with error:
column 'xyz' does not exist.
Please fix the query and provide a valid execution plan."
```

This is invisible to the user in the majority of cases.

### Step 7 — Frontend Rendering

`GraphCanvas.jsx`, `Sidebar.jsx`, `useChatStore.js`

| Response Type | Canvas | What is Populated |
|---|---|---|
| `graph` | Graph Canvas | Nodes and edges via React Flow |
| `chat` / `interactive` | Table Canvas | Tabular SQL rows |
| `clarification_required` | Chat Sidebar | Follow-up suggestion chips |

---

## Core Design Decisions

### Decision 1 — Dual-Database Strategy

SQL excels at aggregation and large row scans. Graph databases natively express multi-hop relationships. Neither alone is sufficient.

The solution is hybrid execution: PostgreSQL fetches the business records; Neo4j builds a relationship graph from those records at runtime. The graph always reflects real data, not pre-baked static relationships.

### Decision 2 — AI-First Query Planning

Rather than writing rule-parsers for every possible query, all query planning is delegated to Gemini. The AI receives the schema and guardrails and returns a deterministic JSON execution plan which the backend validates and executes. The AI is a planner; the code is the executor.

### Decision 3 — Decoupled Frontend Architecture

| Layer | File | Responsibility |
|---|---|---|
| UI | `Sidebar.jsx`, `GraphCanvas.jsx` | Render only, no business logic |
| Logic | `useChatEngine.js` | Query lifecycle, retries, abort |
| State | `useChatStore.js` | Global messages, history, pagination |
| Graph State | `useGraphStore.js` | Node and edge data for canvas |
| API | `services/api.js` | HTTP calls to backend |

`Sidebar.jsx` has zero knowledge of how a query is sent. It calls `handleSend()`. This makes query history replay and programmatic re-querying trivial to implement.

---

## Graph Visualization

Graphs are generated only when relationships are involved. Simple queries — lists, aggregations — return table results only.

### Exploring Node Connections

**Option 1 — Direct Interaction**

Click any node to expand related nodes, view relationship direction, and access metadata in a dialog panel.

**Option 2 — Table-Based Exploration**

1. Navigate to Table View
2. Filter results using the search bar (e.g. `delivery document-80738043`)
3. Select one or more rows using checkboxes
4. Switch to Graph View
5. Selected entries are highlighted in the graph for focused analysis

<p align="center">
  <img src="./assets/ui/06-table-view.png" width="800"/>
  <img src="./assets/ui/07-table-selection.png" width="800"/>
  <img src="./assets/ui/08-graph-highlight.png" width="800"/>
</p>

---

## Table View and Filtering

- Search and filter large datasets using the search bar
- Select multiple entities using checkboxes
- Narrow results before switching to the graph for visualization

---

## Pagination and Performance

Graphs with more than 3,000 nodes cannot be rendered all at once without degrading browser performance.

### Tier 1 — Adaptive Mode (3,000 rows or fewer)

All rows hydrate the graph simultaneously for a complete picture.

```js
const itemsPerGraphLoad = 3000;
const isAdaptive = totalRowsCount > 0 && totalRowsCount <= itemsPerGraphLoad;
```

### Tier 2 — Page-Based Slicing (more than 3,000 rows)

Only the current page's rows determine which graph nodes are displayed.

```js
const startIndex = (currentPage - 1) * itemsPerPage; // itemsPerPage = 300
const currentTableData = tableData.slice(startIndex, startIndex + itemsPerPage);
```

The Graph Canvas updates reactively as you browse table pages. `GraphCanvas` is wrapped in `React.memo` to prevent full re-renders.

Nodes connected to the current page's nodes via edges are always included — even if those connected nodes are not on the current page — to prevent disconnected graph islands.

---

## Caching

`backend/src/services/cacheService.js`

Every successfully generated execution plan can be cached to avoid re-querying Gemini for identical requests.

1. The query is normalized (lowercased, whitespace trimmed)
2. A SHA-256 hash is generated from the normalized query, limit setting, and conversation history
3. The hash is used as the cache key
4. The full execution plan is written to a persistent JSON file on disk (`data/plan_cache.json`)

```js
function generateHash(query) {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
```

The cache survives server restarts. The same query cased differently maps to the same hash. Usage counts per plan are tracked for analytics.

> **Note:** The cache is currently disabled during development. Re-enable `getPlanFromCache` in `multiHopService.js` before deploying to production to reduce Gemini API costs significantly.

---

## Rate Limiting and Model Fallback

`backend/src/services/keyManager.js`

### Round-Robin Key Rotation

A `KeyManager` class loads `GEMINI_API_KEY1` through `GEMINI_API_KEY5` from `.env` at startup. On a `429 Too Many Requests` error, it rotates to the next key and retries the same model.

```js
rotate() {
  this.currentIndex = (this.currentIndex + 1) % this.keys.length;
}
```

### Cascading Model Fallback

If all keys are exhausted for a given model, the system tries the next model in priority order:

```
gemini-2.5-flash
      |  (all keys exhausted)
      v
gemini-2.5-pro
      |  (all keys exhausted)
      v
gemini-2.0-flash
      |  (all keys exhausted)
      v
gemini-3.1-flash-lite-preview
```

A single query may silently try up to 20 combinations (5 keys x 4 models) before failing, usually resolving without any user-visible error.

---

## Self-Healing on Failure

`frontend/src/hooks/useChatEngine.js`

When Gemini generates an incorrect column name or a malformed JOIN, the frontend automatically retries once with a structured healing prompt that includes the exact error message. The user sees only the final result.

---

## Guardrails

The AI operates strictly within the bounds of the connected dataset.

| Type | Examples |
|---|---|
| Supported | Dataset-specific questions, relationship and flow analysis |
| Not Supported | General knowledge questions, unrelated or out-of-scope prompts |

Out-of-scope queries receive the response:
```
This system is designed to answer questions related to the dataset only.
```

---

## Query History

All queries are stored locally in the browser and can be revisited and rerun at any time via the Recent Searches topbar.

**Known Issue:** In some cases, edges may take time to render after revisiting a previous query from history. Workaround: refresh the page and reload the query.

---

## Scalability Roadmap

The system has been tested up to approximately 20,000 SQL rows and 8,000 graph nodes.

### Short Term

| Strategy | Detail |
|---|---|
| Reduce `itemsPerPage` | Lower from 300 to 100 for faster graph updates |
| Disable adaptive mode | Force page-based mode even for under 3,000 rows |
| Increase `alphaDecay` | Faster D3 force simulation for sparse graphs |

### Medium Term

| Strategy | Effort |
|---|---|
| WebGL rendering | Replace React Flow with `sigma.js` or `pixi.js` for 100k+ nodes at 60fps |
| Clustered nodes | Group nodes by type (all `SalesOrder` nodes collapse into one cluster) |
| Backend graph aggregation | Pre-aggregate the graph in Neo4j before returning to the frontend |
| Streaming responses | Stream graph node batches progressively instead of one large JSON payload |

### Long Term

| Strategy | Effort |
|---|---|
| Neo4j Graph Data Science | Use GDS algorithms (PageRank, Community Detection) to surface meaningful subgraphs |
| Redis cache | Replace disk-file cache with Redis for shared multi-instance caching |
| Worker threads | Move SQL execution to Node.js worker threads for non-blocking request handling |
| Read replicas | Route heavy SELECT queries to PostgreSQL read replicas |

---

## Local Setup Guide

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | v20+ |
| npm | v10+ |
| Git | Latest |

```bash
node -v    # v20.x.x
npm -v     # 10.x.x
```

### Step 1 — Clone the Repository

```bash
git clone https://github.com/AnkitCHAKRABORTY0510/AI-graph-explorer.git
cd AI-graph-explorer
```

### Step 2 — Create a Supabase Account (PostgreSQL)

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Navigate to **Project Settings > Database > Connection parameters**
3. Copy the following values for your `.env`:

| Key | Source |
|---|---|
| `DB_HOST` | Host field (e.g. `db.xxxx.supabase.co`) |
| `DB_PORT` | Always `5432` |
| `DB_USER` | Always `postgres` |
| `DB_PASSWORD` | The password you set on project creation |
| `DB_NAME` | Always `postgres` |

4. In the SQL Editor, run the contents of `backend/db/schema.sql` to create your tables
5. Insert your business data via the Table Editor or SQL INSERT statements

### Step 3 — Create a Neo4j Aura Account (Graph Database)

1. Go to [https://neo4j.com/cloud/platform/aura-graph-database](https://neo4j.com/cloud/platform/aura-graph-database)
2. Create a free instance and **immediately copy the credentials** shown — the password is only displayed once
3. Copy the following for your `.env`:

| Key | Source |
|---|---|
| `NEO4J_URI` | Connection URI (e.g. `neo4j+s://xxxxxxxx.databases.neo4j.io`) |
| `NEO4J_USERNAME` | Always `neo4j` |
| `NEO4J_PASSWORD` | Password from creation |
| `NEO4J_DATABASE` | Instance ID (e.g. `1fa8d248`) |

> Neo4j does not connect to Supabase directly. The backend passes PostgreSQL rows as `$rows` parameters to Neo4j at query time. The graph is always built fresh from real data.

### Step 4 — Get Gemini API Keys

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create an API key and copy it to `GEMINI_API_KEY1` in your `.env`
3. Optionally repeat with up to 4 additional Google accounts for `GEMINI_API_KEY2` through `GEMINI_API_KEY5` — the system rotates through all keys to multiply your effective rate limit

### Step 5 — Configure Environment Variables

Create `backend/.env`:

```bash
cd backend
cp .env.example .env
```

```env
# PostgreSQL (Supabase)
DB_HOST=db.xxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_NAME=postgres

# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=xxxxxxxx
AURA_INSTANCEID=xxxxxxxx
AURA_INSTANCENAME=Free instance

# Gemini API Keys
GEMINI_API_KEY1=AIzaSy...
GEMINI_API_KEY2=AIzaSy...
GEMINI_API_KEY3=AIzaSy...
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Step 6 — Generate the Schema JSON

The `schema.json` file is what the AI reads to understand your database and write correct SQL. Run this after creating your tables in Supabase:

```bash
cd backend
node scripts/schema-Json-generator.js
```

Expected output:
```
Reading schema.sql...
Parsing schema...
Writing schema.json...
schema.json generated successfully.
Tables found: 19
Relationships found: 23
```

Re-run this script whenever your database schema changes.

### Step 7 — Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 8 — Start the Application

Two terminal windows are required.

**Terminal 1 — Backend:**
```bash
cd backend
node index.js
```

Expected:
```
Backend server running on 0.0.0.0:3000
PostgreSQL pool connected
Neo4j driver initialized
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Expected:
```
VITE ready
Local: http://localhost:5173/
```

### Step 9 — Open the App

Navigate to **http://localhost:5173** and try:

```
Show me recent sales orders
```

### Verification Checklist

| Check | Command | Expected |
|---|---|---|
| Backend running | `curl http://localhost:3000/schema` | Returns schema JSON |
| Frontend running | Open `http://localhost:5173` | App loads |
| AI working | Type a query in chat | Graph or table appears |
| Neo4j connected | Query involving flow or relationships | Graph nodes render |

---

## Common Issues

**`Error: Connection terminated unexpectedly`**
Your Supabase credentials are wrong. Double-check `DB_HOST`, `DB_PASSWORD`, and `DB_NAME` in `.env`.

**`Neo4j ServiceUnavailable: Could not perform discovery`**
Your `NEO4J_URI` is malformed. Ensure it begins with `neo4j+s://` (the `+s` is required for SSL).

**`429 Too Many Requests` from Gemini**
You have hit the rate limit. Add additional API keys (`GEMINI_API_KEY2` through `GEMINI_API_KEY5`). The system rotates through them automatically.

**`Schema MISS` or incorrect SQL from the AI**
Your `schema.json` is outdated relative to your database. Re-run:
```bash
cd backend && node scripts/schema-Json-generator.js
```

**Blank graph / no nodes**
SQL returned data but Cypher execution failed. Check the backend terminal logs. The most common cause is a column name mismatch between the SQL results and the Cypher `UNWIND $rows AS row` variable names.

---

## Future Improvements

### AI and Query Intelligence

- Intent Classifier — pre-classify queries before sending to Gemini to skip expensive AI calls for simple lookups
- Schema-aware autocomplete — suggest column and table names in the chat input as you type
- Query explainer — show users the exact SQL and Cypher generated in a collapsible panel

### Performance

- Virtual scrolling — replace table pagination with virtualized row rendering (`react-virtual`) to eliminate DOM overhead on large tables
- Graph layout caching — cache D3 force simulation results per query hash to avoid recomputing physics on revisit
- Re-enable plan cache — remove the debug comment-out in `multiHopService.js` to restore Gemini call deduplication

### User Experience

- Graph minimap — overlay for navigating large graphs with hundreds of nodes
- Node drill-down — click a node to lazy-load its detailed sub-graph on demand
- Export — export graph as PNG/SVG or table as CSV/Excel directly from the UI

### Infrastructure

- Horizontal scaling — move from PM2 single-instance to cluster mode (`pm2 start index.js -i max`)
- SSL/HTTPS — Certbot and Let's Encrypt on the Nginx server for production HTTPS
- Health dashboard — surface backend logs, cache hit rate, API key usage, and response time in a real-time admin panel
- CI/CD pipeline — GitHub Actions workflow: on push to `main`, `scp` new files to EC2 and trigger `runner.sh` automatically

---

## Project Structure

```
graph-explorer/
├── frontend/
│   └── src/
│       ├── components/      # Pure UI (GraphCanvas, Sidebar, Topbar)
│       ├── hooks/           # Business logic (useChatEngine)
│       ├── store/           # Global state (useChatStore, useGraphStore)
│       └── services/        # API calls (api.js)
│
├── backend/
│   ├── index.js             # Express entry point and route registration
│   └── src/
│       ├── config/          # DB connections (db.js, neo4j.js, schema.json)
│       ├── controllers/     # HTTP request handlers (aiController, graphController)
│       ├── routes/          # Route definitions (ai.js, graph.js, schema.js)
│       ├── services/
│       │   ├── promptGenerator.js    # Gemini AI and key rotation
│       │   ├── multiHopService.js    # Orchestrates SQL and Cypher execution
│       │   ├── executionQueue.js     # PostgreSQL query runner
│       │   ├── neo4jService.js       # Cypher executor
│       │   ├── cacheService.js       # SHA-256 disk plan cache
│       │   └── keyManager.js         # Round-robin API key rotation
│       └── utils/           # Helpers (schemaLoader, validatePlan)
├── README.md
```

---

## Key Files Reference

| File | Role |
|---|---|
| `frontend/src/hooks/useChatEngine.js` | Orchestrates the entire query lifecycle |
| `frontend/src/services/api.js` | HTTP calls to the backend |
| `backend/src/services/promptGenerator.js` | Builds the Gemini prompt and executes AI |
| `backend/src/services/multiHopService.js` | Coordinates SQL and Cypher execution |
| `backend/src/services/executionQueue.js` | Runs SQL against PostgreSQL |
| `backend/src/services/neo4jService.js` | Runs Cypher against Neo4j |
| `backend/src/utils/validatePlan.js` | Validates AI plan before execution |
| `backend/src/services/keyManager.js` | Rotates Gemini API keys on rate limits |

---

