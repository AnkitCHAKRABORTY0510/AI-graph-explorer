import { processMultiHopQuery } from '../services/multiHopService.js';
import dotenv from 'dotenv';
dotenv.config();

const O2C_WARMUP_QUERIES = [
  "start o2c walkthrough",
  "show me the latest 5 sales orders with customer names",
  "list all cancelled billing documents",
  "show me the delivery status of sales order 10",
  "what is the total net amount of billing by currency?",
  "trace sales order 851 to delivery and billing",
  "is there any payment record for sales order 305?",
  "show me all products and their gross weights",
  "list business partners in the city of Berlin"
];

async function prepopulate() {
  console.log("🔥 Pre-populating Cache with REAL O2C Data...");
  
  for (const query of O2C_WARMUP_QUERIES) {
    console.log(`\n🔍 Processing: "${query}"`);
    try {
      // Use empty history [] for pre-population
      const result = await processMultiHopQuery(query, []);
      if (result) {
        console.log(`✅ Success: Cached plan for "${query}" (Type: ${result.type})`);
      }
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
      if (err.message.includes("429")) {
        console.log("⏳ Rate limit hit. Waiting 60s...");
        await new Promise(r => setTimeout(r, 65000));
      }
    }
    // Small delay between requests to be safe
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log("\n✨ Cache Pre-population Complete!");
  process.exit(0);
}

prepopulate();
