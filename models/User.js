const { 
  v4: uuidv4,
} = require('uuid');

const Neo4jDB = require('../database/Neo4jDB')

class User {

  static async create(user) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });
    const uid = uuidv4()
    try {
      const writeQuery = `CREATE (u:User {
                                username: $username, 
                                email: $email,
                                password: $password,
                               uid: $uid
                              })
                              RETURN u, u.uid AS uid
                            `;

      const writeResult = await session.writeTransaction((tx) =>
        tx.run(writeQuery, { ...user, uid })
      );

      writeResult.records.forEach((record) => {
        const user = record.get("uid");
        console.info(`Created user: ${JSON.stringify(user)}`);
      });
      return writeResult.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  static async findByUserId(userId) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getAuthorQuery = `MATCH (u: User) WHERE u.uid = $userId RETURN u, u.uid AS uid LIMIT 1`;
      const author = await tx.run(getAuthorQuery, { userId });
    
      if (author.records.length === 0)
        throw 'l\'auteur n\'existe pas'
      
      await tx.commit();

      return author.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  static async findByEmailAndPassword({email, password}) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });
    try {
      const tx = session.beginTransaction();
      const getUserQuery = `MATCH (u: User {email: $email, password: $password}) RETURN u`;
      const user = await tx.run(getUserQuery, { email, password });
      if (user.records.length === 0) 
        return false
      
      await tx.commit();
      return user.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  static async findByEmail(email) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });
    try {
      const tx = session.beginTransaction();
      const getUserQuery = `MATCH (u: User {email: $email}) RETURN u`;
      const user = await tx.run(getUserQuery, { email });
      if (user.records.length === 0) {
        return false
      }

      await tx.commit();

      return user.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  static async findAuthoredTweet(tweetId) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });
    try {
      const tx = session.beginTransaction();
      const getUserWhoAuthoredTweet = `MATCH (u: User)-[:WROTE_TWEET]->(t: Tweet {uid: $tweetId}) RETURN u`;
      const user = await tx.run(getUserWhoAuthoredTweet, { tweetId });
      if (user.records.length === 0) {
        return false
      }
      await tx.commit();
      return user.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

}

module.exports = User