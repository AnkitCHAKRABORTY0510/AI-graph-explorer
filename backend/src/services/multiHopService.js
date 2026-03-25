import { generateExecutionPlan } from './promptGenerator.js';
import { validatePlan } from '../utils/validatePlan.js';
import { getPlanFromCache, savePlanToCache } from './cacheService.js';
import { processExecutionQueue } from './executionQueue.js';

export async function processMultiHopQuery(query, history = [], limit = 'few') {
  // --- TEMPORARILY DISABLED CACHE FOR DEBUGGING ---
  // const cacheKey = query + limit + JSON.stringify(history);
  // const cachedPlan = getPlanFromCache(cacheKey);
  // if (cachedPlan) return cachedPlan;
  // ------------------------------------------------

  // 2. MISS -> Generate execution plan using the LLM
  console.log(`🧠 Engaging AI Assistant for Query: "${query}" (Limit: ${limit})`);
  const plan = await generateExecutionPlan(query, history, limit);

  console.log(`\n================= AI EXECUTION PLAN =================`);
  console.log(JSON.stringify(plan, null, 2));
  console.log(`=====================================================\n`);
  
  // 3. Validate generated plan
  const validation = validatePlan(plan);
  if (!validation.isValid) {
     console.warn(`⚠️ Plan Validation Failed: ${validation.error}`);
     
     // Instead of throwing an HTTP 500 error, gracefully fallback to interactive mode
     plan.type = 'clarification_required';
     plan.message = `I hit a roadblock trying to build that specific network: **${validation.error}.**\n\n${validation.hint}\n\nCould you clarify or simplify what relationship you're trying to trace?`;
     plan.options = ["Show available products", "Show all storage locations", "Reset map"];
     delete plan.queries;
     delete plan.cypher;
     delete plan.graph;
     delete plan.table;
     
     return plan;
  }

  // 4. Auto-execute for CHAT/INTERACTIVE types if queries are present
  if ((plan.type === 'chat' || plan.type === 'interactive') && plan.queries && plan.queries.length > 0) {
     console.log(`📊 Auto-executing SQL for ${plan.type} response...`);
     plan.table = await processExecutionQueue(plan.queries);
  }

  // 5. Execute Graph Generation (Neo4j native UNWIND + SQL context)
  if (plan.type === 'graph') {
     
     // Step A: ALways execute SQL if present to populate Canvas Table
     if (plan.queries && plan.queries.length > 0) {
        console.log(`📊 Executing SQL to fetch backing data for Table View...`);
        const results = await processExecutionQueue(plan.queries);
        plan.table = results;

        if (limit !== 'all' && results.length > 1000) {
           console.warn(`⚠️ Note: SQL returned ${results.length} rows. Node Limit constraint may apply.`);
           plan.message = (plan.message || "") + "\n\n**Note:** Dataset limits applied. Select 'Unlimited' in the Node Limit to load everything.";
        } else if (limit === 'all') {
           console.warn(`🚀 CAUTION: UNLIMITED MODE ACTIVE. Fetched all ${results.length} records.`);
           plan.message = (plan.message || "") + `\n\n**Scale Note:** Processed complete dataset of ${results.length} records.`;
        }
     }

     // Step B: Execute Cypher Mapping using Table Data parameters
     if (plan.cypher) {
        console.log(`🌐 Executing Cypher on Neo4j for Graph Generation...`);
        const { executeCypher } = await import('./neo4jService.js');
        // Flatten the SQL data to ensure we don't pass JS Date objects (which Neo4j rejects as Maps)
        const sanitizedRows = JSON.parse(JSON.stringify(plan.table || []));
        plan.graph = await executeCypher(plan.cypher, { rows: sanitizedRows });
     } else if (!plan.cypher && (!plan.queries || plan.queries.length === 0)) {
        console.log(`🧠 AI provided a pre-built static schema graph...`);
     } else {
        console.warn(`⚠️ Plan returned graph queries but strictly omitted cypher fallback mappings.`);
        plan.graph = { nodes: [], edges: [] };
     }
  }

  // 5. Save to Cache
  // savePlanToCache(cacheKey, plan);
  
  return plan;
}
