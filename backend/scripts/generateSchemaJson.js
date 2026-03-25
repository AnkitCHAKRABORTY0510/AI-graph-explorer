import fs from 'fs';
import path from 'path';

export function parseSchema(sqlContent) {
  const tables = [];
  const tableRegex = /CREATE TABLE\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/g;
  let match;

  while ((match = tableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columnsText = match[2];
    
    // Parse columns by newline and comma
    const columnLines = columnsText.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('PRIMARY KEY') && !line.startsWith('FOREIGN KEY') && !line.startsWith('--'));

    const columns = columnLines.map(line => {
      // Remove trailing comma
      line = line.replace(/,$/, '');
      const parts = line.split(/\s+/);
      return {
        name: parts[0],
        type: parts[1] || 'TEXT',
        isPrimaryKey: line.includes('PRIMARY KEY')
      };
    }).filter(c => c.name);

    tables.push({
      tableName,
      columns
    });
  }

  return tables;
}

const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
const destPath = path.join(process.cwd(), 'data', 'schema.json');

if (import.meta.url === `file://${process.argv[1]}`) {
  const sqlContent = fs.readFileSync(schemaPath, 'utf8');
  const schema = parseSchema(sqlContent);
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
  fs.writeFileSync(destPath, JSON.stringify(schema, null, 2));
  console.log('Schema JSON generated successfully at data/schema.json');
}
