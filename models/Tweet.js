const { 
  v4: uuidv4,
} = require('uuid');

const Neo4jDB = require('../database/Neo4jDB')

class Tweet {

  static async create(tweet) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });

    try {
      const uid = uuidv4()
      const tx = session.beginTransaction();
      let {authorId} = tweet;
      console.log(authorId)
      const getAuthorQuery = `MATCH (u: User) WHERE u.uid = $authorId RETURN u LIMIT 1`;
      const author = await tx.run(getAuthorQuery, { authorId });
    
      if (author.records.length === 0) {
        throw 'l\'auteur n\'existe pas'
      }
      const postTweetQuery = `
      CREATE (t:Tweet {
                             uid: $uid,
                              authorId: $authorId,
                              content: $content,  
                              likes: $likes, 
                              dislikes: $dislikes, 
                              shares: $shares, 
                              mentionnedPeople: $mentionnedPeople,
                              date: TIMESTAMP()
                            })
                            return t, t.uid AS uid
                          `;
      const createdTweet = await tx.run(postTweetQuery, { ...tweet, uid });
      console.info(`Created tweet: ${JSON.stringify(createdTweet.records[0])}`);
      await tx.commit();

      return createdTweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  static async findAllByAuthorId(authorId) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getAuthorTweetsQuery = `MATCH (t: Tweet {authorId: $authorId})<-[:WROTE_TWEET]-(u: User) RETURN t, t.uid AS uid, u ORDER BY t.date DESC`;
      const tweets = await tx.run(getAuthorTweetsQuery, { authorId });
    
      await tx.commit();

      return tweets.records;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  static async findById(id) {
    const session = Neo4jDB.driver.session({ database: "neo4j" });

    try {
      console.log(id)
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet) WHERE t.uid = $id RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });
    
      await tx.commit();

      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
}

module.exports = Tweet