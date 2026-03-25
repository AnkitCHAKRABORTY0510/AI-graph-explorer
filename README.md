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
