import { processMultiHopQuery } from '../services/multiHopService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testTraceWorkflow() {
  console.log("🔍 Testing Workflow: 'trace order to cash flow'");
  console.log("-------------------------------------------");

  const query = "trace order to cash flow for sales order 740556";
  
  try {
    // Stage 1: Intent & Plan Generation
    console.log("🚀 Stage 1: AI Planning...");
    const plan = await processMultiHopQuery(query, []);
    
    console.log("\n✅ Stage 2: Intelligence Decision");
    console.log(`- Type: ${plan.type}`);
    if (plan.cypher) {
      console.log("- Selected Engine: Neo4j (Cypher)");
      console.log(`- Cypher generated: ${plan.cypher}`);
    } else {
      console.log("- Selected Engine: Hybrid SQL Deduction");
      console.log(`- SQL Fetches: ${plan.queries.length}`);
    }

    // Stage 3: Execution & Transformation
    console.log("\n🎨 Stage 3: Graph Result");
    if (plan.graph && plan.graph.nodes.length > 0) {
      console.log(`- Nodes Found: ${plan.graph.nodes.length}`);
      console.log(`- Edges Found: ${plan.graph.edges.length}`);
      console.log("- Sample Node ID:", plan.graph.nodes[0].id);
      console.log("- Sample Node Data:", JSON.stringify(plan.graph.nodes[0].data, null, 2));
    } else {
      console.warn("⚠️  Graph is empty - likely no data path found for this ID.");
    }

    console.log("\n✨ Workflow Test Complete!");
  } catch (err) {
    console.error("\n❌ Workflow Test Failed:", err.message);
  }
  process.exit(0);
}

testTraceWorkflow();
