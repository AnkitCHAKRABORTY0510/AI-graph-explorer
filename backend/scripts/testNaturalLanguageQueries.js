import { processMultiHopQuery } from '../services/multiHopService.js';
import { executePlanQuery } from '../services/dbService.js';
import { buildGraphFromRows } from '../services/graphBuilder.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
  const queries = [
    { name: "Delivery to Plant (Few)", query: "Show delivery items and their plants" },
    { name: "Sales to Deliveries (50%)", query: "Show sales orders and outbound deliveries (50%)" },
    { name: "Order to Cash Flow (All)", query: "Show full order to cash flow including billing and payments (Return ALL matching entries)" }
  ];

  for (const testCase of queries) {
    try {
      console.log(`\n============================`);
      console.log(`Testing Query: "${testCase.name}"`);
      
      const plan = await processMultiHopQuery(testCase.query);
      
      if (!plan || !plan.sql || !plan.path) {
        console.error("❌ Failed: Valid plan not generated.", plan);
        continue;
      }
      
      console.log(`✅ AI generated SQL with ${plan.path.length} multi-hops.`);
      console.log(`   SQL limit detected: ${plan.sql.includes('LIMIT') ? 'Yes' : 'No'}`);
      console.log(`   Tables identified: ${plan.tables_used.join(', ')}`);
      
      console.log(`⏳ Executing PostgreSQL Query...`);
      const rows = await executePlanQuery(plan);
      console.log(`✅ Postgres Query returned ${rows.length} rows.`);

      console.log(`⏳ Building Graph Mapping...`);
      const graphData = await buildGraphFromRows(rows, plan);
      
      console.log(`✅ Success! Graph Mapping Results:`);
      console.log(`   Nodes Count: ${graphData.nodes.length}`);
      console.log(`   Edges Count: ${graphData.edges.length}`);
         
      if (graphData.nodes.length > 500) {
        console.log("   Warning: Node count exceeds 500. This is expected if 'ALL matching entries' is specified and Data is large.");
      }
      
      // Delay so we don't hit Gemini Rate limits
      await new Promise(r => setTimeout(r, 6000));
      
    } catch(err) {
      console.error(`❌ Unexpected Test Error: ${err.message}`);
    }
  }
}

runTests();
