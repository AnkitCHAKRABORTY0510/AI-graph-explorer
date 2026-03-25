/**
 * Deterministic Graph Builder
 * Converts flat, redundant SQL row results into deduplicated Graph Nodes and Edges
 * without relying on AI or Neo4j execution.
 * 
 * Logic:
 * 1. Identifies "Entity" columns (usually ending in _id or known keys like sales_order).
 * 2. Groups metadata columns (like _name, _date) into the corresponding entity.
 * 3. Builds distinct Nodes.
 * 4. Links Entities found in the same row serially (e.g. Customer -> Order -> Delivery).
 */

export function buildGraphFromSqlRows(rows) {
  if (!rows || rows.length === 0) return { nodes: [], edges: [] };

  const nodesMap = new Map();
  const edgesMap = new Map();

  // Colors for visualization based on common entity types
  const typeColors = {
    'customer': '#6B7280',
    'sales_order': '#4F46E5',
    'delivery': '#F59E0B',
    'billing': '#EF4444',
    'payment': '#10B981',
    'product': '#3B82F6',
    'plant': '#8B5CF6'
  };

  rows.forEach((row) => {
    // 1. Extract Entities from Row
    const rowEntities = [];
    const properties = Object.keys(row);

    // Group properties by their primitive prefix (e.g. customer_id, customer_name -> 'customer')
    const entityGroups = {};

    properties.forEach(prop => {
      // Very basic heuristic: if it ends with _id, it's an entity key.
      // Alternatively, check common exact matches:
      let baseName = null;
      let isKey = false;

      if (prop.endsWith('_id')) {
        baseName = prop.replace('_id', '');
        isKey = true;
      } else if (['sales_order', 'delivery_document', 'business_partner', 'product', 'plant'].includes(prop)) {
        baseName = prop;
        isKey = true;
      }

      if (baseName && isKey) {
        if (!entityGroups[baseName]) entityGroups[baseName] = { keyProp: prop, id: row[prop], data: {} };
      }
    });

    // Extract side-car attributes (like customer_name going to customer entity)
    properties.forEach(prop => {
      Object.keys(entityGroups).forEach(baseName => {
        if (prop.startsWith(baseName) && prop !== entityGroups[baseName].keyProp) {
          entityGroups[baseName].data[prop] = row[prop];
        }
      });
    });

    // 2. Register Unique Nodes
    Object.keys(entityGroups).forEach(baseName => {
      const entity = entityGroups[baseName];
      if (!entity.id) return; // Skip null IDs

      const nodeId = `${baseName}-${entity.id}`;
      rowEntities.push({ id: nodeId, baseName });

      if (!nodesMap.has(nodeId)) {
        // Determine Color
        let color = '#999';
        Object.keys(typeColors).forEach(tc => {
          if (baseName.includes(tc)) color = typeColors[tc];
        });

        // Determine Label (Use name/description if available, else ID)
        let label = entity.id;
        if (entity.data[`${baseName}_name`]) label = entity.data[`${baseName}_name`];
        else if (entity.data[`${baseName}_description`]) label = entity.data[`${baseName}_description`];
        else if (entity.data[`full_name`]) label = entity.data[`full_name`];

        nodesMap.set(nodeId, {
          id: nodeId,
          color,
          data: {
            label: String(label),
            typeLabel: baseName.toUpperCase(),
            originalId: entity.id,
            ...entity.data
          }
        });
      }
    });

    // 3. Register Edges (Sequentially link entities found in this row)
    // E.g., Customer -> Sales Order -> Delivery
    for (let i = 0; i < rowEntities.length - 1; i++) {
        const source = rowEntities[i];
        const target = rowEntities[i + 1];

        const edgeId = `${source.id}=>${target.id}`;
        if (!edgesMap.has(edgeId)) {
            edgesMap.set(edgeId, {
                id: edgeId,
                source: source.id,
                target: target.id,
                label: `HAS_${target.baseName.toUpperCase()}`
            });
        }
    }
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values())
  };
}
