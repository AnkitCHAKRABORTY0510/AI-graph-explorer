import { executePlanQuery } from '../services/dbService.js';
import { buildGraphFromRows } from '../services/graphBuilder.js';
import { loadSchema } from '../utils/schemaLoader.js';
import { findPaths } from '../graph/pathFinder.js';
import { generateSQL } from '../sql/sqlGenerator.js';
import dotenv from 'dotenv';
dotenv.config();

async function mockProcessMultiHopQuery(query) {
  const schema = loadSchema();
  const targetTables = ['outbound_delivery_items', 'plants'];
  
  const path = findPaths(schema.relationships, targetTables);
  const { sql, pathConfig } = generateSQL(path, 'few', targetTables, schema.tables);
  
  return {
    sql,
    path: pathConfig,
    tables_used: Array.from(new Set(pathConfig.flatMap(p => [p.fromTable, p.toTable])))
  };
}

async function run() {
  try {
    console.log("Testing data mapping with mocked intent...");
    const plan = await mockProcessMultiHopQuery("Show delivery items and their plants");
    console.log("Plan generated.");
    
    if (!plan || !plan.sql || !plan.path) {
      throw new Error("Plan validation failed (missing sql or path)");
    }
    
    const rows = await executePlanQuery(plan);
    console.log(`Executed DB Query. Got ${rows.length} rows.`);
    
    const graphData = await buildGraphFromRows(rows, plan);
    console.log("Built graph successfully. Nodes:", graphData.nodes.length, "Edges:", graphData.edges.length);
    process.exit(0);
  } catch(e) {
    console.error("Test failed:", e);
    process.exit(1);
  }
}

run();
