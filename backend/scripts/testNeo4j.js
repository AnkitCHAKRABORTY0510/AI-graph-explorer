import { processMultiHopQuery } from '../services/multiHopService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testNeo4jTrace() {
  console.log("🚀 Testing Neo4j Cypher Generation & Execution...");
  
  const query = "trace sales order 740556 through its entire O2C lifecycle in the graph";
  
  try {
    const start = Date.now();
    const result = await processMultiHopQuery(query, []);
    const end = Date.now();
    
    console.log(`⏱️  Time: ${end - start}ms`);
    console.log(`📁 Type: ${result.type}`);
    if (result.cypher) console.log(`🧬 Generated Cypher: ${result.cypher}`);
    
    if (result.graph) {
      console.log(`✅ Success! Graph data received.`);
      console.log(`🌐 Nodes: ${result.graph.nodes?.length}`);
      console.log(`🔗 Edges: ${result.graph.edges?.length}`);
    } else {
      console.error(`❌ Graph data missing from result.`);
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
  process.exit(0);
}

testNeo4jTrace();
