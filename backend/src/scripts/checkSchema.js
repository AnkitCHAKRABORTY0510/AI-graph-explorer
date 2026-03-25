import driver from '../config/neo4j.js';

async function checkSchema() {
  const session = driver.session();
  try {
    const labels = await session.run('CALL db.labels()');
    console.log('Labels:', labels.records.map(r => r.get(0)));
    
    const rels = await session.run('CALL db.relationshipTypes()');
    console.log('Relationships:', rels.records.map(r => r.get(0)));
    
    const counts = await session.run('MATCH (n) RETURN labels(n) as l, count(n) as c');
    console.log('Node Counts:', counts.records.map(r => ({ label: r.get('l'), count: r.get('c').toNumber() })));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkSchema();
