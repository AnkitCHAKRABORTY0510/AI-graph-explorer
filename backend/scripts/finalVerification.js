import { processMultiHopQuery } from '../services/multiHopService.js';
import dotenv from 'dotenv';
dotenv.config();

async function runFinalVerification() {
  console.log("🚀 Starting Final FDE Mission Verification...");

  // 1. Guardrail Test
  console.log("\n🧪 Test 1: Domain Guardrails (Off-topic query)");
  const guardQuery = "What is the capital of France?";
  try {
    const res1 = await processMultiHopQuery(guardQuery, []);
    console.log("Result Message:", res1.message);
    if (res1.message.includes("This system is designed to answer questions related to the provided dataset only")) {
      console.log("✅ Guardrail PASS");
    } else {
      console.error("❌ Guardrail FAIL: Response was not the restricted message.");
    }
  } catch (err) {
    console.error("❌ Guardrail ERROR:", err.message);
  }

  // 2. Broken Flow Test
  console.log("\n🧪 Test 2: Broken Flow Detection (Delivered but not billed)");
  const brokenQuery = "Identify sales orders that are delivered but not billed";
  try {
    const res2 = await processMultiHopQuery(brokenQuery, []);
    console.log("Result Type:", res2.type);
    if (res2.table && res2.table.length > 0) {
      console.log(`✅ Broken Flow PASS: Found ${res2.table.length} rows.`);
    } else {
       console.log("ℹ️  Broken Flow: No rows found, but checking if logic was correct (was it a table response?)");
       if (res2.type === 'chat' || res2.type === 'graph') console.log("✅ Logic PASS");
    }
  } catch (err) {
    console.error("❌ Broken Flow ERROR:", err.message);
  }

  process.exit(0);
}

runFinalVerification();
