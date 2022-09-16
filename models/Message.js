const { 
  v4: uuidv4,
} = require('uuid');

const Neo4jDB = require('../database/Neo4jDB')

class Message {

  static async create(message) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });

    try {
      const uid = uuidv4()
      const tx = session.beginTransaction();
      let {authorId, tweetId} = message;
      const getAuthorQuery = `MATCH (u: User) WHERE u.uid = $authorId RETURN u LIMIT 1`;
      const author = await tx.run(getAuthorQuery, { authorId });
      if (author.records.length === 0) {
        throw 'l\'auteur n\'existe pas'
      }
      const getTweetQuery = `
                            MATCH 
                              (t: Tweet) 
                            WHERE t.uid = $tweetId
                            RETURN t 
                            LIMIT 1`;

      const tweet = await tx.run(getTweetQuery, { tweetId });
      if (tweet.records.length === 0) {
        throw 'le tweet n\'existe pas'
      }
      const writeQuery = `CREATE (message:Message {
                            uid: $uid,
                            content: $content,
                            authorId: $authorId,
                            tweetId: $tweetId})
                            return message, message.uid AS uid
                        `;
      const createdMessage = await tx.run(writeQuery, {
        ...message,
        tweetId,
        authorId,
        uid
      });
      await tx.commit();
      return createdMessage.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
}

module.exports = Message