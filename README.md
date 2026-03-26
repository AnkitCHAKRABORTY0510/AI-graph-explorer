




# AI-Graph Explorer
 
> A natural language-powered graph exploration tool for navigating complex datasets through conversation, visual graphs, and structured tables.
This framework takes natural language questions ("Show me sales orders related to delivery X"),
deduces the required database multi-hop join paths using Google Gemini, runs the SQL natively, and
builds a real-time reactive Graph showing how the extracted rows relate to each other.
 
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


## 🏛️ Core Architectural Decisions

### Decision 1: Dual-Database Strategy (PostgreSQL + Neo4j)

**Why not just SQL?**

SQL can answer *"show me all sales orders"* but struggles with *"trace a broken flow across 5 tables"*. Graph databases natively express multi-hop relationships as first-class citizens.

**Why not just Neo4j?**

Neo4j cannot efficiently handle aggregations, filters, and large row scans on 1M+ records. PostgreSQL is optimized for this.

**The solution — hybrid execution:**

```
User Query
   │
   ├── PostgreSQL: "Fetch the actual business records"
   │         → Returns raw rows (e.g. 5,000 Sales Orders + their Delivery + Billing data)
   │
   └── Neo4j: "Build an in-memory relationship graph from those records"
             → Takes the SQL rows as $rows parameters
             → MERGEs nodes + relationships into a live graph
             → Returns visual nodes[] + edges[]
```

This means the graph is **always backed by real data** — not pre-baked static relationships.

---

### Decision 2: AI-First Query Planning (No Hardcoded Logic)

Rather than writing explicit rule-parsers for every possible query, the system offloads all query planning to **Google Gemini**.

Gemini receives:
- The full PostgreSQL schema (tables + columns)
- All relationship definitions (JOIN paths)
- Strict guardrails (no hallucinated columns, no `LIMIT 100`, always `SELECT DISTINCT`)
- Conversation history (last 6 messages) for context-aware follow-ups

Gemini returns a structured JSON execution plan — not free text — which the backend validates and executes deterministically. This means the AI is used as a **planner**, not an executor. Business logic stays in code.

---

### Decision 3: Decoupled Frontend Architecture (React Hooks)

All heavy frontend logic is extracted into dedicated custom hooks and Zustand stores:

| Layer | File | Responsibility |
|---|---|---|
| UI | `Sidebar.jsx`, `GraphCanvas.jsx` | Render only, no business logic |
| Logic | `useChatEngine.js` | Query lifecycle, retries, abort |
| State | `useChatStore.js` | Global messages, history, pagination |
| Graph State | `useGraphStore.js` | Node/edge data for canvas |
| API | `services/api.js` | HTTP calls to backend |

This means `Sidebar.jsx` has zero knowledge of *how* a query is sent. It just calls `handleSend()`. This makes features like query history replay and programmatic re-querying trivial.

---

## 📄 Pagination — Handling Thousands of Graph Nodes

Large datasets cannot be rendered as a graph all at once. Rendering 50,000 React Flow nodes would freeze any browser.

**Two-Tier Pagination Strategy:**

### Tier 1: Adaptive Mode (≤ 3,000 rows)
If the SQL query returns 3,000 or fewer total rows, all rows are used to hydrate the graph simultaneously. This gives the user a complete picture for reasonably sized datasets.

```js
const itemsPerGraphLoad = 3000;
const isAdaptive = totalRowsCount > 0 && totalRowsCount <= itemsPerGraphLoad;
```

### Tier 2: Page-Based Slicing (> 3,000 rows)
For larger datasets, only the **current page's rows** are used to filter which graph nodes to show.

```js
const startIndex = (currentPage - 1) * itemsPerPage; // itemsPerPage = 300
const currentTableData = tableData.slice(startIndex, startIndex + itemsPerPage);
```

The user can browse through pages in the **Table Canvas**, and the **Graph Canvas updates automatically** to show only the nodes related to that page's records. This is fully reactive — no full re-renders because `GraphCanvas` is wrapped in `React.memo`.

**Connector Node Inclusion:**
When a node is shown from the current page, all nodes it has **edges to** are also included — even if those nodes aren't in the current page's data. This prevents orphaned, disconnected graph islands.

---

## 💾 Caching — Avoiding Redundant AI Calls

**File:** `backend/src/services/cacheService.js`

Every successfully generated execution plan can be cached to avoid re-querying Gemini for the same question.

**How it works:**

1. The query is **normalized** (lowercased, whitespace trimmed, collapsed).
2. A **SHA-256 hash** is generated from the normalized query + limit setting + history.
3. The hash is used as the cache key.
4. The full execution plan (SQL + Cypher + message + options) is written to a **persistent JSON file** on disk (`data/plan_cache.json`).

```js
function generateHash(query) {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
```

**Advantages:**
- Survives server restarts (disk-persisted).
- Semantic deduplication — *"show me sales orders"* and *"Show Me Sales Orders"* map to the same hash.
- Tracks `usage_count` per plan for analytics.

> **Note:** The cache is currently disabled during debugging (`getPlanFromCache` is commented out in `multiHopService.js`). Re-enable it to drastically reduce Gemini API costs in production.

---

## 🔄 Rate Limiting — Multi-Key + Multi-Model Fallback

**File:** `backend/src/services/keyManager.js`

Gemini's free-tier API has tight rate limits (requests per minute per key). To stay within limits across heavy usage:

### Round-Robin Key Rotation

A `KeyManager` class loads all `GEMINI_API_KEY1` → `GEMINI_API_KEY5` from `.env` at startup.

```js
rotate() {
  this.currentIndex = (this.currentIndex + 1) % this.keys.length;
}
```

When a `429 Too Many Requests` error is detected, the system immediately rotates to the next key and retries the same model without throwing an error upward.

### Cascading Model Fallback

If **all keys are exhausted** for a given model, the system tries the next model in priority order:

```
gemini-2.5-flash  (fastest, lowest quota)
       ↓ if 429 on all keys
gemini-2.5-pro    (smarter, different quota bucket)
       ↓ if 429 on all keys
gemini-2.0-flash
       ↓ if 429 on all keys
gemini-3.1-flash-lite-preview
```

This means a single user query can automatically try up to **20 combinations** (5 keys × 4 models) before finally failing — usually successfully resolving without any user-visible error.

---

## 🔁 Silent Retry — Self-Healing on SQL Failures

**File:** `frontend/src/hooks/useChatEngine.js`

Sometimes Gemini hallucinates a column name or generates a slightly wrong JOIN. Instead of showing an error immediately, the frontend **automatically retries once** with a healing prompt:

```js
// On first failure:
await handleSend(queryToUse, {
  error: gErr.message,
  hint: gErr.response?.data?.hint
});
```

The retry prompt tells Gemini exactly what went wrong:

```
"The previous execution for query '...' failed with error:
column 'xyz' does not exist.
Hint: Check table and column names in schema.json.
Please fix the query and provide a valid execution plan."
```

This means transient AI errors are invisible to the user in the majority of cases.

---

## 🧠 Handling More Nodes — Scalability Guide

Currently tested up to ~20,000 SQL rows / ~8,000 graph nodes. Here's how to scale further:

### Short Term (current system)
| Strategy | Implementation |
|---|---|
| Reduce `itemsPerPage` | Lower from 300 → 100 for faster graph updates |
| Disable adaptive mode | Force page-based mode even for < 3,000 rows |
| Increase `alphaDecay` | Faster D3 force simulation for sparse graphs |

### Medium Term (next upgrades)
| Strategy | Effort |
|---|---|
| **WebGL Rendering** | Replace React Flow with `sigma.js` or `pixi.js` — handles 100k+ nodes at 60fps |
| **Clustered Nodes** | Group nodes by type (e.g. all `SalesOrder` nodes collapse into 1 cluster) |
| **Backend Graph Aggregation** | Pre-aggregate the graph in Neo4j before returning to frontend |
| **Streaming Responses** | Stream graph node batches progressively instead of one large JSON payload |

### Long Term (production scale)
| Strategy | Effort |
|---|---|
| **Neo4j Graph Data Science** | Use GDS algorithms (PageRank, Community Detection) to surface meaningful subgraphs |
| **Redis Cache** | Replace the disk-file cache with Redis for shared multi-instance caching |
| **Worker Threads** | Move SQL execution to Node.js worker threads for non-blocking request handling |
| **Read Replicas** | Route heavy SELECT queries to PostgreSQL read replicas |

---

## 🚀 Future Improvements

### AI & Query Intelligence
- [ ] **Intent Classifier** — Pre-classify queries before sending to Gemini (`graph`, `table`, `chat`) to skip expensive AI calls for simple lookups.
- [ ] **Schema-Aware Autocomplete** — Suggest column/table names in the chat input as you type.
- [ ] **Query Explainer** — Show users the exact SQL + Cypher that was generated in a collapsible panel.

### Performance
- [ ] **Virtual Scrolling** — Replace the table pagination with virtualized row rendering (`react-virtual`) to eliminate DOM overhead on large tables.
- [ ] **Graph Layout Caching** — Cache D3 force simulation results per query hash to avoid re-computing physics on revisit.
- [ ] **Re-enable Plan Cache** — Remove the debug comment-out in `multiHopService.js` to restore Gemini call deduplication.

### UX
- [ ] **Graph Minimap** — Add a minimap overlay for navigating large graphs with hundreds of nodes.
- [ ] **Node Drill-Down** — Click a node to load its detailed sub-graph on demand (lazy graph expansion).
- [ ] **Export** — Export graph as PNG/SVG or table as CSV/Excel directly from the UI.

### Infrastructure
- [ ] **Horizontal Scaling** — Move from PM2 single-instance to a PM2 cluster mode (`pm2 start index.js -i max`).
- [ ] **SSL / HTTPS** — Set up Certbot + Let's Encrypt on the Nginx server for production-grade HTTPS.
- [ ] **Health Dashboard** — Surface backend logs, cache hit rate, API key usage, and response time in a real-time admin panel.
- [ ] **CI/CD Pipeline** — GitHub Actions workflow: on push to `main`, `scp` new files to EC2 and trigger `runner.sh` automatically.

---

## 📁 Full Project Structure

```
graph-Explorer/
├── frontend/
│   └── src/
│       ├── components/      # Pure UI (GraphCanvas, Sidebar, Topbar)
│       ├── hooks/           # Business logic (useChatEngine)
│       ├── store/           # Global state (useChatStore, useGraphStore)
│       └── services/        # API calls (api.js)
│
├── backend/
│   ├── index.js             # Express entry point + route registration
│   └── src/
│       ├── config/          # DB connections (db.js, neo4j.js, schema.json)
│       ├── controllers/     # HTTP request handlers (aiController, graphController)
│       ├── routes/          # Route definitions (ai.js, graph.js, schema.js)
│       ├── services/        # Core logic
│       │   ├── promptGenerator.js    # Gemini AI + key rotation
│       │   ├── multiHopService.js    # Orchestrates SQL + Cypher execution
│       │   ├── executionQueue.js     # PostgreSQL query runner
│       │   ├── neo4jService.js       # Cypher executor
│       │   ├── cacheService.js       # SHA-256 disk plan cache
│       │   └── keyManager.js         # Round-robin API key rotation
│       └── utils/           # Helpers (schemaLoader, validatePlan)
├── README.md                # Project overview
```


# 🚀 Complete Local Setup Guide (0 → 100)

Everything you need to clone this project and run it locally — from creating accounts to starting the servers.

---

## 📋 Prerequisites

Install these on your local machine before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | v20+ | https://nodejs.org |
| Git | Latest | https://git-scm.com |
| npm | v10+ (comes with Node.js) | — |

Verify:
```bash
node -v    # Should print v20.x.x
npm -v     # Should print 10.x.x
```

---

## 🗂️ Step 1 — Clone the Repository

```bash
git clone https://github.com/AnkitCHAKRABORTY0510/AI-graph-explorer.git
cd AI-graph-explorer
```

---

## 🗄️ Step 2 — Create a Supabase Account (PostgreSQL)

Supabase is a free hosted PostgreSQL cloud database. Your app reads business data from here.

### 2.1 Create Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project** → Sign up with GitHub or Email
3. Click **New Project**
4. Enter a **Project Name** (e.g. `graph-explorer`)
5. Set a strong **database password** — save it, you'll need it
6. Choose the **region** closest to you
7. Click **Create new project** (takes ~2 minutes to provision)

### 2.2 Get Your Connection Credentials

Once the project is ready:

1. In the left sidebar → **Project Settings** → **Database**
2. Scroll down to **Connection parameters**
3. Copy these values:

| .env Key | Where to find it |
|---|---|
| `DB_HOST` | Host field (e.g. `db.xxxx.supabase.co`) |
| `DB_PORT` | Always `5432` |
| `DB_USER` | Always `postgres` |
| `DB_PASSWORD` | The password you set in Step 2.1 |
| `DB_NAME` | Always `postgres` |

### 2.3 Upload Your Schema to Supabase

Your schema lives in a SQL file. You need to create the tables in Supabase first.

1. In Supabase sidebar → click **SQL Editor**
2. Click **New Query**
3. Open the file `backend/db/schema.sql` from this project in a text editor
4. Copy the entire content and paste it into the Supabase SQL editor
5. Click **Run** (▶️)
6. You should see "Success. No rows returned" — your tables are now created

### 2.4 Upload Your Data (the `raw` column)

Each table has a `raw` column that stores the original JSON payload for each row.

To insert your actual business data:

1. In Supabase → **Table Editor** → select a table (e.g. `sales_order_headers`)
2. Click **Import Data** → Upload a CSV file, or
3. Use the SQL Editor to run `INSERT INTO` statements

**Example insert format:**
```sql
INSERT INTO sales_order_headers (sales_order, sales_order_type, sold_to_party, creation_date, total_net_amount, currency, raw)
VALUES ('5000001', 'OR', 'CUST-001', '2024-01-15', 25000.00, 'USD', '{"original": "json payload"}');
```

---

## 🌐 Step 3 — Create a Neo4j Aura Account (Graph Database)

Neo4j Aura is the free hosted graph database. Your app builds and queries dynamic graphs here.

### 3.1 Create Account

1. Go to [https://neo4j.com/cloud/platform/aura-graph-database](https://neo4j.com/cloud/platform/aura-graph-database)
2. Click **Start Free**
3. Sign up with GitHub/Google or Email
4. Click **Create Free Instance**
5. Name it (e.g. `graph-explorer`) → Click **Create**
6. **IMPORTANT**: A popup will appear showing your credentials. **Download or copy them immediately** — Neo4j only shows the password once.

### 3.2 Get Your Connection Credentials

After creating the instance, click on it in the dashboard. You'll see:

| .env Key | Where to find it |
|---|---|
| `NEO4J_URI` | The **Connection URI** field (e.g. `neo4j+s://xxxxxxxx.databases.neo4j.io`) |
| `NEO4J_USERNAME` | Always `neo4j` |
| `NEO4J_PASSWORD` | The password shown during creation |
| `NEO4J_DATABASE` | The **Instance ID** shown on the instance card (e.g. `1fa8d248`) |
| `AURA_INSTANCEID` | Same as `NEO4J_DATABASE` |
| `AURA_INSTANCENAME` | The name you gave it (e.g. `Free instance`) |

### 3.3 How Neo4j Interacts With Supabase (PostgreSQL)

Neo4j does **not** connect to Supabase directly. The flow is:

```
1. PostgreSQL (Supabase) → returns SQL rows
2. Backend takes those rows as "$rows"
3. Cypher query runs on Neo4j: UNWIND $rows AS row
4. Neo4j MERGES nodes + edges from the PostgreSQL data
5. Neo4j returns the graph structure back to the frontend
```

This means **Neo4j is always in sync with your PostgreSQL data** because the graph is built fresh from real database rows every time a query runs. Neo4j acts as a **read-time graph projection engine**, not a separate data store.

---

## 🤖 Step 4 — Get Gemini API Keys (Google AI)

The AI interpreter uses Google Gemini. You need at least 1 key (up to 5 for better rate limits).

### 4.1 Get Your First Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key (starts with `AIzaSy...`)
5. Paste into `GEMINI_API_KEY1=` in your `.env`

### 4.2 Add More Keys for Better Rate Limits

The system automatically rotates through up to 5 keys to avoid hitting the per-minute quota.

- Repeat Step 4.1 with **different Google accounts** (e.g. personal + work + new accounts)
- Paste each key into `GEMINI_API_KEY2`, `GEMINI_API_KEY3`, etc.
- Having 5 keys effectively multiplies your usable rate limit by 5×

---

## ⚙️ Step 5 — Configure Environment Variables

### 5.1 Create Backend `.env`

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in all the values you collected above:

```env
# Supabase PostgreSQL
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

# Gemini API Keys (add as many as you have)
GEMINI_API_KEY1=AIzaSy...
GEMINI_API_KEY2=AIzaSy...
GEMINI_API_KEY3=AIzaSy...
```

### 5.2 Create Frontend `.env`

```bash
cd ../frontend
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:3000
```

> **Note:** This is only needed if you want to override the API URL. The app defaults to this automatically.

---

## 🗺️ Step 6 — Generate the Schema JSON

After uploading your tables to Supabase, you need to generate a `schema.json` file. This is what the AI reads to understand your database structure and write correct SQL.

### 6.1 What the Script Does

The `schema-Json-generator.js` script reads your `schema.sql` file, parses every `CREATE TABLE` block, extracts all column names and foreign key relationships, and outputs a clean `schema.json`.

### 6.2 Run the Generator

```bash
cd backend
node scripts/schema-Json-generator.js
```

You should see:
```
📄 Reading schema.sql...
Parsing schema...
Writing schema.json...
✅ schema.json generated successfully!
📊 Tables found: 19
🔗 Relationships found: 23
```

This creates `backend/db/schema.json`. The backend loads this at startup and injects it into every Gemini AI prompt so the AI knows exactly your database structure.

> **Whenever you change your database schema**, re-run this script to keep the AI in sync.

---

## 📦 Step 7 — Install Dependencies

### 7.1 Backend

```bash
cd backend
npm install
```

### 7.2 Frontend

```bash
cd ../frontend
npm install
```

---

## ▶️ Step 8 — Run the Application

You need **two terminal windows** running simultaneously.

### Terminal 1 — Start the Backend

```bash
cd backend
node index.js
```

You should see:
```
✅ Backend server running on 0.0.0.0:3000
🗄️ PostgreSQL pool connected
🌐 Neo4j driver initialized
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v8.x.x  ready in 999 ms
➜  Local:   http://localhost:5173/
```

---

## 🌐 Step 9 — Open the App

Navigate to **http://localhost:5173** in your browser.

You should see the Graph Explorer interface with the Chat sidebar on the right. Try typing:

> *"Show me recent sales orders"*

---

## ✅ Verifying Everything Works

| Check | Command / URL | Expected |
|---|---|---|
| Backend is running | `curl http://localhost:3000/schema` | Returns your schema JSON |
| Frontend is running | Open `http://localhost:5173` | App loads in browser |
| AI works | Type a query in chat | Graph or table appears |
| Neo4j connected | Query involving "graph" or "flow" | Graph nodes render on canvas |

---

## 🛠️ Common Issues & Fixes

### `Error: Connection terminated unexpectedly`
→ Your Supabase credentials are wrong. Double-check `DB_HOST`, `DB_PASSWORD`, and `DB_NAME` in `.env`.

### `Neo4j ServiceUnavailable: Could not perform discovery`
→ Your `NEO4J_URI` is wrong. Make sure it starts with `neo4j+s://` (with the `+s` for SSL).

### `429 Too Many Requests` from Gemini
→ You've hit the rate limit. Add more API keys to `GEMINI_API_KEY2` through `GEMINI_API_KEY5`. The system will automatically rotate through them.

### `Schema MISS` or wrong SQL from AI
→ Your `schema.json` is outdated. Re-run the schema generator:
```bash
cd backend && node scripts/schema-Json-generator.js
```

### Blank graph / no nodes
→ The SQL returned data but the Cypher failed. Check your backend terminal logs for the error. Usually a column name mismatch between SQL results and the Cypher `UNWIND $rows AS row` variable names.

---

