/* eslint-disable @typescript-eslint/no-explicit-any */
import { uuid } from 'uuidv4';

import neo4jDatabase from '../../database/neo4j.database';
import TweetInterface from '../../interface/tweet.interface';
import TweetDto from '../../models/dto/tweet.dto';
import UserTweetDto from '../../models/dto/userTweet.dto';

class TweetNeo4j implements TweetInterface {
  async create(tweet: TweetDto): Promise<UserTweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const uid = uuid();
      const tx = session.beginTransaction();
      const { userId } = tweet;
      const getAuthorQuery = 'MATCH (u: User) WHERE u.uid = $userId RETURN u LIMIT 1';
      const author = await tx.run(getAuthorQuery, { userId });

      if (!tweet.mentionnedPeople) {
        tweet.mentionnedPeople = [];
      }
      if (author.records.length === 0) {
        throw 'l\'auteur n\'existe pas';
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
                                        MATCH (u: User {uid: $userId}), (t: Tweet {uid: $uid})
                                        return u, t, t.uid as uid
                                      `;
      const mergeAuthorAndTweet = await tx.run(mergeAuthorAndTweetQuery, { userId, uid });
      await tx.commit();
      if (!mergeAuthorAndTweet.records.length)
        return null;
      const node = {
        leftNode: { label: 'User', uid: userId! },
        rightNode: { label: 'Tweet', uid: uid },
        relation: 'WROTE_TWEET'
      };
      const relationShip = await neo4jDatabase!.createRelationship(node);
  
      if (!relationShip) {
        throw 'error when creating relationship between user and tweet [WROTE_TWEET]';
      }

      return {
        tweet: mergeAuthorAndTweet.records[0].get('t').properties,
        user: {...mergeAuthorAndTweet.records[0].get('u').properties, password: null},
        relation: 'WROTE_TWEET'

      };
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.create');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findAllTweetsUserInteractedWith(userId: string): Promise<UserTweetDto[] | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const AllTweetsUserInteractedWith = `
                                          MATCH (t: Tweet)<-[r]-(u: User {uid: $userId})
                                          WHERE NOT (t)-[:PART_OF]->(:Tweet)
                                          RETURN DISTINCT t, type(r), u ORDER BY t.date DESC
                                          `;
      const tweets = await tx.run(AllTweetsUserInteractedWith, { userId });

      await tx.commit();

      return tweets.records.map((t) => {
        return ({
          tweet: t.get('t').properties,
          user: {...t.get('u').properties, password: null},
          relation: t.get('type(r)'),
        });
      }) as UserTweetDto[];
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findAllTweetsUserInteractedWith');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }

  async findAllRelatedTweetsToUser(userId: string): Promise<UserTweetDto[] | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

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

      return tweets.records.filter((t) => t.get('t') != null).map((t: any) => {
        return (
          {
            tweet: t.get('t').properties,
            user: {...t.get('u').properties, password: null},
            relation: t.get('type(ut)')
          }
        );
      }
      ) as unknown as UserTweetDto[];
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findAllRelatedTweetsToUser');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;

  }
  async findById(uid: string): Promise<UserTweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (u: User)-[:WROTE_TWEET]->(t: Tweet) WHERE t.uid = $uid RETURN t, u, t.uid AS uid LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid });

      await tx.commit();
      if (!tweet.records.length)
        return null;
      return {
        tweet: tweet.records[0].get('t').properties,
        user: {...tweet.records[0].get('u').properties, password: null},
        relation: 'WROTE_TWEET'

      };
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findById');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findInnerTweetsByTweetId(uid: string): Promise<UserTweetDto[] | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getMessagesQuery = 'MATCH (t: Tweet {uid: $uid})<-[:PART_OF]-(m: Tweet)<-[:WROTE_TWEET]-(u: User) RETURN u, m ORDER BY m.date DESC';
      const messages = await tx.run(getMessagesQuery, { uid });

      await tx.commit();
      return messages.records.map(t => {
        return ({
          user: {...t.get('u').properties, password: null},
          tweet: t.get('m').properties,
          relation: 'WROTE_TWEET'
        });
      });
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findInnerTweetsByTweetId');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async increaseRepliesCount(uid: string): Promise<TweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (t: Tweet {uid: $uid}) SET t.replies = t.replies + 1 RETURN t, t.uid AS uid LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid });

      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properties;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.increaseRepliesCount');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }

  async retweet(uid: string): Promise<TweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (t: Tweet {uid: $uid}) SET t.retweets = t.retweets + 1 RETURN t, t.uid AS uid LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properties;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.retweet');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async cancelRetweet(uid: string): Promise<TweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (t: Tweet {uid: $uid}) SET t.retweets = t.retweets - 1 RETURN t, t.uid AS uid LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properties;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.cancelRetweet');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findUserThatRetweeted(uid: string, userId: string): Promise<UserTweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (u :User {uid: $userId})-[:RETWEETED]->(t: Tweet {uid: $uid}) RETURN u, t LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid, userId });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return {
        tweet: tweet.records[0].get('t').properties,
        user: {...tweet.records[0].get('u').properties, password: null},
        relation: 'RETWEETED',
      };
      
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findUserThatRetweeted');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  
  async findUserThatLiked(uid: string, userId: string): Promise<UserTweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (u :User {uid: $userId})-[:LIKED]->(t: Tweet {uid: $uid}) RETURN u, t LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid, userId });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return {
        tweet: tweet.records[0].get('t').properties,
        user: {...tweet.records[0].get('u').properties, password: null},
        relation: 'LIKED',
      };
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findUserThatLiked');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findUserThatDisliked(uid: string, userId: string): Promise<UserTweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = 'MATCH (u :User {uid: $userId})-[:DISLIKED]->(t: Tweet {uid: $uid}) RETURN u, t LIMIT 1';
      const tweet = await tx.run(getTweetQuery, { uid, userId });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return {
        tweet: tweet.records[0].get('t').properties,
        user: {...tweet.records[0].get('u').properties, password: null},
        relation: 'DISLIKED',
      };
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.findUserThatDisliked');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async likeTweet(uid: string): Promise<TweetDto | null > {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $uid}) 
      SET t.lastUpdated = $lastUpdated,
      t.likes = t.likes + 1 
      RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { uid, lastUpdated: Date.now() });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properies;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.likeTweet');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async cancelTweetLike(uid: string): Promise<TweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $uid})
      SET t.lastUpdated = $lastUpdated,
      t.likes = t.likes - 1 
       RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { uid, lastUpdated: Date.now() });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properties;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.cancelTweetLike');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async dislikeTweet(uid: string): Promise<TweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $uid}) 
      SET t.lastUpdated = $lastUpdated ,
      t.dislikes = t.dislikes + 1 
      RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { uid, lastUpdated: Date.now() });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properties;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.dislikeTweet');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async cancelTweetDislike(uid: string): Promise<TweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getTweetQuery = `MATCH (t: Tweet {uid: $uid}) 
      SET t.lastUpdated = $lastUpdated,
      t.dislikes = t.dislikes - 1 
      RETURN t, t.uid AS uid LIMIT 1`;
      const tweet = await tx.run(getTweetQuery, { uid, lastUpdated: Date.now() });
      await tx.commit();
      if (!tweet.records.length)
        return null;
      return tweet.records[0].get('t').properties;
    } catch (error) {
      console.error('Error thrown in TweetNeo4j.cancelTweetDislike');
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }

}

export default TweetNeo4j;