const neo4j = require("neo4j-driver");

class Neo4jDB {
  constructor({uri, user, password}) {
    
    this.uri = uri
    this.user = user
    this.password = password
    this.driver = null
  }

  connect() {
    this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));
    
  }


  async createRelationship(leftNode, rightNode, relation) {
    const session = this.driver.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const writeQuery = `MERGE (a: ${leftNode.label} {uid: $leftId })
          MERGE (b:${rightNode.label} {uid: $rightId })
          MERGE (a)-[:${relation}]->(b)
          RETURN a, b`;
      tx.run(writeQuery, { leftId: leftNode.uid, rightId: rightNode.uid }) *
        (await tx.commit());
      console.log("relationship created");
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  async flushDB() {
    const session = this.driver.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const writeQuery = `MATCH (n) DETACH DELETE n`;
      tx.run(writeQuery)
      await tx.commit()
      console.info(`FLUSHED DATABASE`);
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  
  async close() {
    await this.driver.close();
  }
}

module.exports = Neo4jDB