import driver from '../config/neo4j.js';

/**
 * Executes a Cypher query on Neo4j and formats the result for the frontend.
 */
export async function executeCypher(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    console.log(`\n================= NEO4J DEBUG =================`);
    console.log(`CYPHER QUERY: \n${cypher}`);
    console.log(`NEO4J RECORDS RETURNED: ${result.records.length}`);
    console.log(`===============================================\n`);

    const nodesMap = new Map();
    const edges = [];

    const colors = {
      'SalesOrder': '#4F46E5', // Indigo
      'OutboundDelivery': '#F59E0B', // Amber
      'BillingDocument': '#EF4444', // Red
      'Payment': '#10B981', // Emerald
      'BusinessPartner': '#6B7280', // Gray
      'Customer': '#6B7280',
      'Plant': '#8B5CF6' // Violet
    };

    const processNode = (node) => {
      const internalId = node.identity.toString();
      const businessId = node.properties.id || internalId;
      const type = node.labels[0];
      
      if (!nodesMap.has(internalId)) {
        nodesMap.set(internalId, {
          id: 'node-' + internalId,
          color: colors[type] || '#999',
          data: { 
            label: businessId, 
            typeLabel: type,
            ...node.properties
          }
        });
      }
      return 'node-' + internalId;
    };

    const processRel = (rel) => {
      edges.push({
        id: `e-${rel.identity.toString()}`,
        source: 'node-' + rel.start.toString(),
        target: 'node-' + rel.end.toString(),
        label: rel.type
      });
    };

    result.records.forEach(record => {
      record.forEach(value => {
        if (!value) return;

        // 1. Handle Path
        if (value.segments) {
          value.segments.forEach(seg => {
            processNode(seg.start);
            processNode(seg.end);
            processRel(seg.relationship);
          });
        } 
        // 2. Handle Node
        else if (value.labels && value.identity) {
          processNode(value);
        }
        // 3. Handle Relationship
        else if (value.start && value.end) {
          processRel(value);
        }
      });
    });

    // Post-process edges: Map internal Neo4j IDs to business IDs used in nodesMap
    const finalEdges = edges.map(e => {
       const sourceIntId = e.source.replace('node-', '');
       const targetIntId = e.target.replace('node-', '');
       
       // Try to find if these internal IDs match any business IDs in our nodes
       // Actually, it's safer to just use internal IDs for everything in the graph
       // But the user likes seeing "740556".
       return e;
    });

    const finalNodes = Array.from(nodesMap.values());
    console.log(`✅ Processed Graph: Found ${finalNodes.length} unique nodes and ${finalEdges.length} unique edges.`);
    return { nodes: finalNodes, edges: finalEdges };
  } finally {
    await session.close();
  }
}
