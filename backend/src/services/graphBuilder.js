import driver from '../config/neo4j.js';

export async function buildGraphFromRows(rows, plan) {
  if (!rows || rows.length === 0) return { nodes: [], edges: [] };

  const graphMapping = plan.graph;
  const nodesMap = new Map();
  const edges = [];
  const colors = ['#d48c41', '#aee2db', '#e8a5a5', '#aabce1', '#d8b4e2'];
  const labelColorMap = {};

  // Build Front-End Nodes
  graphMapping.nodes.forEach(nodeDef => {
    if (!labelColorMap[nodeDef.label]) labelColorMap[nodeDef.label] = colors[Object.keys(labelColorMap).length % colors.length];
    
    rows.forEach(r => {
      const idRaw = r[nodeDef.id_field];
      if (idRaw == null) return;
      
      const id = String(idRaw);
      if (!nodesMap.has(id)) {
        nodesMap.set(id, {
          id: 'node-' + id,
          color: labelColorMap[nodeDef.label],
          data: { label: id, typeLabel: nodeDef.label }
        });
      }
    });
  });

  // Build Front-End Edges
  graphMapping.edges.forEach((edgeDef, idx) => {
    rows.forEach((r, rowIdx) => {
      const sourceIdRaw = r[edgeDef.source_id_field];
      const targetIdRaw = r[edgeDef.target_id_field];
      
      if (sourceIdRaw != null && targetIdRaw != null) {
        edges.push({
          id: `e-${String(sourceIdRaw)}-${String(targetIdRaw)}-${idx}-${rowIdx}`,
          source: 'node-' + String(sourceIdRaw),
          target: 'node-' + String(targetIdRaw),
          label: edgeDef.relationship
        });
      }
    });
  });

  // Neo4j Merge Check
  if (process.env.SKIP_NEO4J !== 'true') {
    const session = driver.session();
    try {
      // Create Nodes
      for (const nodeDef of graphMapping.nodes) {
        const cypher = `UNWIND $data AS row MERGE (n:\`${nodeDef.label}\` { id: row.id }) SET n += row.props`;
        
        const nodeData = rows.map(r => {
          const id = r[nodeDef.id_field];
          if (id == null) return null;
          
          const props = {};
          if (nodeDef.properties) {
            nodeDef.properties.forEach(p => {
              if (r[p] != null) {
                 props[p] = typeof r[p] === 'object' ? JSON.stringify(r[p]) : String(r[p]);
              }
            });
          }
          return { id: String(id), props };
        }).filter(d => d !== null);
        
        if (nodeData.length > 0) {
          await session.run(cypher, { data: nodeData });
        }
      }

      // Create Relationships
      for (const edgeDef of graphMapping.edges) {
        const cypher = `UNWIND $data AS row 
                        MATCH (source:\`${edgeDef.from}\` { id: row.sourceId })
                        MATCH (target:\`${edgeDef.to}\` { id: row.targetId })
                        MERGE (source)-[r:\`${edgeDef.relationship}\`]->(target)`;
        
        const edgeData = rows.map(r => {
          const sourceId = r[edgeDef.source_id_field];
          const targetId = r[edgeDef.target_id_field];
          if (sourceId == null || targetId == null) return null;
          return { sourceId: String(sourceId), targetId: String(targetId) };
        }).filter(d => d !== null);

        if (edgeData.length > 0) {
          await session.run(cypher, { data: edgeData });
        }
      }
    } finally {
      await session.close();
    }
  }

  return { nodes: Array.from(nodesMap.values()), edges };
}
