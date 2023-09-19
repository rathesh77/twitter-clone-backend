import neo4j, { Driver } from 'neo4j-driver';
import config from './config';

type Node = { 
  label: string, 
  uid: string 
}

type Relationship = { 
  leftNode: Node,
  rightNode: Node, 
  relation: string 
}

// Singleton
class Neo4jDB {
  private uri: string;
  private user: string;
  private password: string;
  public driver: Driver | null;
  private static isInitialized: boolean = false;

  private constructor() {
    this.uri = config.uri!;
    this.user = config.user!;
    this.password = config.password!;
    this.driver = null;
    
    console.log(config);
  }

  public static __construct() {
    if (Neo4jDB.isInitialized || !config || !config.uri || !config.user || !config.password) {
      return null;
    }
    Neo4jDB.isInitialized = true;
    return new Neo4jDB();
  }

  public connect() {
    this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));
  }

  public async createRelationship(relationship: Relationship) {
    if (!this.driver) {
      return null;
    }
    const {leftNode, rightNode, relation} = relationship;
    const session = this.driver.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const writeQuery = `MERGE (a: ${leftNode.label} {uid: $leftId })
          MERGE (b:${rightNode.label} {uid: $rightId })
          MERGE (a)-[:${relation}]->(b)
          RETURN a, b`;
      const result = await tx.run(writeQuery, { leftId: leftNode.uid, rightId: rightNode.uid });
      await tx.commit();
      console.log('relationship created');
      return {'a': result.records[0].get('a'), 'b': result.records[0].get('b')};
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  async removeRelationship(relationship: Relationship) {
    if (!this.driver) {
      return null;
    }
    const session = this.driver.session({ database: 'neo4j' });
    const {leftNode, rightNode, relation} = relationship;

    try {
      const tx = session.beginTransaction();
      const writeQuery = `
          MATCH (a: ${leftNode.label} {uid: $leftId })-[r:${relation}]->(b:${rightNode.label} {uid: $rightId })
          DELETE r
          `;
      await tx.run(writeQuery, { leftId: leftNode.uid, rightId: rightNode.uid });
      await tx.commit();
      console.log('relationship removed');
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async flushDB() {
    if (!this.driver) {
      return null;
    }
    const session = this.driver.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const writeQuery = 'MATCH (n) DETACH DELETE n';
      tx.run(writeQuery);
      await tx.commit();
      console.info('FLUSHED DATABASE');
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  async close() {
    if (this.driver)
      await this.driver.close();
  }
}

export default Neo4jDB.__construct();
export type { Relationship };