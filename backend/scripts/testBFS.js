import { processMultiHopQuery } from '../services/multiHopService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testBFS() {
  console.log("🚀 Testing BFS Relation Flow & Neo4j Integration...");

  const query = "trace sales order 740556 with a 3-hop BFS depth to find related nodes in the canvas";
  
  try {
    const res = await processMultiHopQuery(query, []);
    console.log("Plan Type:", res.type);
    if (res.cypher) {
      console.log("✅ Cypher Generated:", res.cypher);
      if (res.graph && res.graph.nodes && res.graph.nodes.length > 0) {
        console.log(`✅ Success: Found ${res.graph.nodes.length} nodes and ${res.graph.edges.length} edges.`);
      } else {
        console.log("⚠️  Graph empty (data gap or ID mismatch), but logic executed.");
      }
    } else {
      console.log("ℹ️  AI chose SQL deduction over Cypher.");
    }
  } catch (err) {
    console.error("❌ Test Error:", err.message);
  }
  process.exit(0);
}

testBFS();
