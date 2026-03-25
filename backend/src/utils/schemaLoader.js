import fs from 'fs';
import path from 'path';

export function loadSchema() {
  const schemaPath = path.join(process.cwd(), 'src', 'config', 'schema.json');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Schema JSON not found. Please run generateSchemaJson.js first.');
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}
