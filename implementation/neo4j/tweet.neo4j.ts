import uuidv4 from 'uuid';

import neo4jDatabase from "../../database/neo4j.database";
import TweetInterface from "../../interface/tweet.interface";

class TweetNeo4j implements TweetInterface {
  async create(tweet: TweetDto): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const uid = uuidv4.v4()
      const tx = session.beginTransaction();
      const { authorId } = tweet;
      const getAuthorQuery = `MATCH (u: User) WHERE u.uid = $authorId RETURN u LIMIT 1`;
      const author = await tx.run(getAuthorQuery, { authorId });

      if (author.records.length === 0) {
        throw 'l\'auteur n\'existe pas'
      }
      const postTweetQuery = `
                            CREATE (t:Tweet {
                              uid: $uid,
                              content: $content,
                              likes: 0.0,
                              dislikes: 0.0,
                              replies: 0.0,
                              shares: 0.0,
                              retweets: 0.0,
                              mentionnedPeople: $mentionnedPeople,
                              date: TIMESTAMP()
                            })
                            return t, t.uid AS uid
                          `;
      const createdTweet = await tx.run(postTweetQuery, { ...tweet, uid });
      console.info(`Created tweet: ${JSON.stringify(createdTweet.records[0])}`);
      const mergeAuthorAndTweetQuery = `
                                        MATCH (u: User {uid: $authorId}), (t: Tweet {uid: $uid})
                                        return u, t, t.uid as uid
                                      `
      const mergeAuthorAndTweet = await tx.run(mergeAuthorAndTweetQuery, { authorId, uid });
      await tx.commit();
      return mergeAuthorAndTweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async findAllTweetsUserInteractedWith(userId: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const AllTweetsUserInteractedWith = `
                                          MATCH (t: Tweet)<-[r]-(u: User {uid: $userId})
                                          WHERE NOT (t)-[:PART_OF]->(:Tweet)
                                          RETURN DISTINCT t, type(r), u ORDER BY t.date DESC
                                          `;
      const tweets = await tx.run(AllTweetsUserInteractedWith, { userId });

      await tx.commit();

      return tweets.records;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

  async findAllRelatedTweetsToUser(userId: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getAllRelatedTweetsToUser = `
                                          MATCH (me: User {uid: $userId})
                                          OPTIONAL MATCH (me)-[*]->(u: User)-[ut]->(t: Tweet)
                                          RETURN u,type(ut), t
                                          ORDER BY t.date desc
                                          UNION
                                          MATCH (t: Tweet)<-[ut]-(u: User {uid: $userId}) 
                                          return  u,type(ut), t
                                          ORDER BY t.date desc
                                          `;
      const tweets = await tx.run(getAllRelatedTweetsToUser, { userId });

      await tx.commit();

      return tweets.records;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async findById(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (u: User)-[:WROTE_TWEET]->(t: Tweet) WHERE t.uid = $id RETURN t, u, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });

      await tx.commit();

      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async findInnerTweetsByTweetId(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getMessagesQuery = `MATCH (t: Tweet {uid: $id})<-[:PART_OF]-(m: Tweet)<-[:WROTE_TWEET]-(u: User) RETURN u, m ORDER BY m.date DESC`;
      const messages = await tx.run(getMessagesQuery, { id });

      await tx.commit();
      return messages.records;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async increaseRepliesCount(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $id}) SET t.replies = t.replies + 1 RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });

      await tx.commit();

      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async findLimit1(): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet) RETURN t, t.uid as uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery);

      await tx.commit();

      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async retweet(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $id}) SET t.retweets = t.retweets + 1 RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async cancelRetweet(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async findUserThatRetweeted(id: number, userId: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (u :User {uid: $userId})-[:RETWEETED]->(t: Tweet {uid: $id}) RETURN u, t LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id, userId });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async findUserThatLiked(id: number, userId: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (u :User {uid: $userId})-[:LIKED]->(t: Tweet {uid: $id}) RETURN u, t LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id, userId });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async findUserThatDisliked(id: number, userId: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (u :User {uid: $userId})-[:DISLIKED]->(t: Tweet {uid: $id}) RETURN u, t LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id, userId });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async likeTweet(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $id}) SET t.likes = t.likes + 1 RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async cancelTweetLike(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $id}) SET t.likes = t.likes - 1 RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async dislikeTweet(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $id}) SET t.dislikes = t.dislikes + 1 RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { id });
      await tx.commit();
      return tweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
  async cancelTweetDislike(id: number): Promise<any> {
    const session = neo4jDatabase!.driver!.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $id}) SET t.dislikes = t.dislikes - 1 RETURN t, t.uid AS uid LIMIT 1`;
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

export default TweetNeo4j