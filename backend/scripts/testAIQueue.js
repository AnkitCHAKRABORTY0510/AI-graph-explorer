import { generateExecutionPlan } from '../ai/promptGenerator.js';
import { processExecutionQueue } from '../services/executionQueue.js';
import { buildGraphFromRows } from '../services/graphBuilder.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  try {
    const query = "show me the order to cash flow";
    console.log(`\n============================`);
    console.log(`🧠 AI Generating Plan for: "${query}"`);
    
    // 1. AI Prompt Generation
    const plan = await generateExecutionPlan(query);
    console.log(`✅ Plan generated correctly.`);
    console.log(JSON.stringify(plan, null, 2));
    
    // 2. Queue Execution
    console.log(`\n⏳ Executing PostgreSQL Queue...`);
    // Passing process.env.SKIP_NEO4J to prevent driver hang during this local test script
    process.env.SKIP_NEO4J = 'true';
    const rows = await processExecutionQueue(plan.queries);
    console.log(`✅ Queue Executed. Aggregated ${rows.length} rows.`);

    // 3. Graph Building
    console.log(`\n⏳ Building Graph Mapping...`);
    const graphData = await buildGraphFromRows(rows, plan);
    console.log(`✅ Success! Graph Mapping Results:`);
    console.log(`   Nodes Count: ${graphData.nodes.length}`);
    console.log(`   Edges Count: ${graphData.edges.length}`);
         
    process.exit(0);
  } catch(err) {
    console.error(`❌ Unexpected Test Error:`, err);
    process.exit(1);
  }
}

runTest();
