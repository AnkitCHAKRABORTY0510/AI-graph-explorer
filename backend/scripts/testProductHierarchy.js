import { processMultiHopQuery } from '../services/multiHopService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testProductHierarchy() {
  console.log("🔍 Testing Inventory Hierarchy: Product -> Plant -> Storage Location");
  console.log("---------------------------------------------------------------");

  // Querying for a common test product
  const query = "Find the relationship between product Z-01, its plants, and its storage locations. Show as a graph.";
  
  try {
    console.log("🚀 Stage 1: AI Planning & Deduction...");
    const plan = await processMultiHopQuery(query, []);
    
    console.log("\n✅ Stage 2: Intelligence Result");
    console.log(`- Type: ${plan.type}`);
    console.log(`- AI Message: ${plan.message}`);
    
    if (plan.queries) {
      console.log(`- SQL Fetches: ${plan.queries.length}`);
      plan.queries.forEach((q, i) => console.log(`  [Query ${i+1}]: ${q.purpose}`));
    }

    // Stage 3: Verification of Graph Output
    console.log("\n🎨 Stage 3: Graph Visualization Result");
    if (plan.graph && plan.graph.nodes.length > 0) {
      console.log(`- Nodes Found: ${plan.graph.nodes.length}`);
      console.log(`- Edges Found: ${plan.graph.edges.length}`);
      
      const nodeTypes = [...new Set(plan.graph.nodes.map(n => n.data.typeLabel))];
      console.log(`- Detected Entity Types: ${nodeTypes.join(', ')}`);
      
      // Look for expected types
      const hasProduct = nodeTypes.some(t => t?.toLowerCase().includes('product'));
      const hasPlant = nodeTypes.some(t => t?.toLowerCase().includes('plant'));
      const hasStorage = nodeTypes.some(t => t?.toLowerCase().includes('storage'));
      
      if (hasProduct && hasPlant && hasStorage) {
        console.log("✅ SUCCESS: Found complete hierarchy (Product -> Plant -> Storage Location)");
      } else {
        console.warn("⚠️  PARTIAL: Missing some hierarchy levels in the result samples.");
      }
    } else {
      console.warn("⚠️  EMPTY: No data found for product Z-01 in the current dataset.");
    }

  } catch (err) {
    console.error("\n❌ Test Error:", err.message);
  }
  process.exit(0);
}

testProductHierarchy();
