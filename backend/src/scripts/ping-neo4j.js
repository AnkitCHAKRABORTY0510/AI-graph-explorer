import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD
  )
);

const pingNeo4j = async () => {
  const session = driver.session();

  try {
    console.log("🔌 Connecting to Neo4j...");

    const res = await session.run("RETURN datetime() AS now");

    console.log("✅ Connected successfully!");
    console.log("🕒 Server Time:", res.records[0].get("now").toString());

    await session.close();
    await driver.close();

    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err.message);

    await session.close();
    await driver.close();

    process.exit(1);
  }
};

pingNeo4j();