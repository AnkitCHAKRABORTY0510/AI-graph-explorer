import fs from "fs";
import path from "path";

const INPUT_FILE = "./db/schema.sql";
const OUTPUT_FILE = "./db/schema.json";

// 🧠 Extract tables + columns + foreign keys
function parseSchema(sql) {
  const tables = {};
  const relationships = [];

  // Match CREATE TABLE blocks
  const tableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;

  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const block = match[2];

    const columns = [];

    const lines = block.split("\n");

    for (let line of lines) {
      line = line.trim();

      if (!line || line.startsWith("--")) continue;

      // Remove trailing comma
      line = line.replace(/,$/, "");

      // 🔹 Extract column name
      const colMatch = line.match(/^(\w+)/);

      if (colMatch) {
        const colName = colMatch[1];

        // Skip constraints
        if (
          colName.toLowerCase() !== "constraint" &&
          colName.toLowerCase() !== "primary" &&
          colName.toLowerCase() !== "foreign"
        ) {
          columns.push(colName);
        }
      }

      // 🔥 Extract foreign key
      const fkMatch = line.match(
        /FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/i
      );

      if (fkMatch) {
        relationships.push({
          from_table: tableName,
          from_column: fkMatch[1],
          to_table: fkMatch[2],
          to_column: fkMatch[3]
        });
      }
    }

    tables[tableName] = columns;
  }

  return { tables, relationships };
}

// 🚀 Main
function generateSchemaJson() {
  console.log("📄 Reading schema.sql...");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error("❌ schema.sql not found");
    process.exit(1);
  }

  const sql = fs.readFileSync(INPUT_FILE, "utf-8");

  console.log("🧠 Parsing schema...");
  const schema = parseSchema(sql);

  console.log("💾 Writing schema.json...");

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(schema, null, 2)
  );

  console.log("✅ schema.json generated successfully!");
  console.log("📊 Tables found:", Object.keys(schema.tables).length);
  console.log("🔗 Relationships found:", schema.relationships.length);
}

generateSchemaJson();