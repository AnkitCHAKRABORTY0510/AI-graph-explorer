import { buildGraphFromSqlRows } from '../services/deterministicGraphBuilder.js';

const mockSqlRows = [
  {
    customer_id: '320000083',
    customer_name: 'Nelson, Fitzpatrick and Jordan',
    sales_order_id: '740587',
    sales_order_date: '2025-04-02T00:00:00.000Z',
    delivery_id: '80738105',
    delivery_date: '2025-04-02T00:00:00.000Z'
  },
  {
    customer_id: '320000083',
    customer_name: 'Nelson, Fitzpatrick and Jordan',
    sales_order_id: '740572',
    sales_order_date: '2025-04-02T00:00:00.000Z',
    delivery_id: '80738092',
    delivery_date: '2025-04-02T00:00:00.000Z'
  },
  {
    customer_id: '320000088',
    customer_name: 'Flores-Simmons',
    sales_order_id: '740545',
    sales_order_date: '2025-04-02T00:00:00.000Z',
    delivery_id: '80737921',
    delivery_date: '2025-04-02T00:00:00.000Z'
  }
];

const result = buildGraphFromSqlRows(mockSqlRows);

console.log("Nodes Count:", result.nodes.length);
console.log(JSON.stringify(result.nodes, null, 2));

console.log("Edges Count:", result.edges.length);
console.log(JSON.stringify(result.edges, null, 2));
