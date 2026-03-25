import axios from 'axios';

const API_URL = 'http://localhost:3000';

export async function interpretQuery(query, history = [], limit = 'few', signal = undefined) {
  const response = await axios.post(API_URL + '/ai/interpret', { query, history, limit }, { signal });
  return response.data;
}

export async function executeGraphPlan(plan, signal = undefined) {
  const response = await axios.post(API_URL + '/graph/execute', plan, { signal });
  return response.data; // { nodes, edges }
}

export async function fetchSchema() {
  const response = await axios.get(API_URL + '/schema');
  return response.data;
}
