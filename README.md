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
 
<p align="center">
  <img src="./assets/ui/node-interaction.gif" width="800"/>
</p>
 
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

