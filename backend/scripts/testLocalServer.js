async function test() {
  try {
    console.log("1. Sending query to /ai/interpret...");
    const aiResponse = await fetch('http://localhost:3000/ai/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "Show delivery items and their plants" })
    });
    const plan = await aiResponse.json();
    console.log("AI Plan Received:", JSON.stringify(plan, null, 2));

    if (!plan.sql || !plan.graph) {
      console.error("AI did not return a valid plan object. Cannot proceed.");
      return;
    }

    console.log("\n2. Sending plan to /graph/execute...");
    const executeResponse = await fetch('http://localhost:3000/graph/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    const graphData = await executeResponse.json();
    console.log("Graph Execution Result:");
    if (graphData.nodes) {
      console.log(`Success! Nodes returned: ${graphData.nodes.length}, Edges returned: ${graphData.edges.length}`);
    } else {
      console.log("Error or invalid response:", graphData);
    }
  } catch (error) {
    console.error("Test script failed:", error.message);
  }
}

test();
