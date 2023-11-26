import Neo4jDB from './database/neo4j.database';
import UserDao from './models/dao/user.dao';
import TweetDao from './models/dao/tweet.dao';
import neo4jDatabase from './database/neo4j.database';
import TweetDto from './models/dto/tweet.dto';
import TweetNeo4j from './implementation/neo4j/tweet.neo4j';
import UserNeo4j from './implementation/neo4j/user.neo4j';

(async () => {
  const userDao = new UserDao(new UserNeo4j());
  const tweetDao = new TweetDao(new TweetNeo4j());
  Neo4jDB!.connect();

  if (!Neo4jDB) {
    return;
  }
  try {
    await Neo4jDB.flushDB();

    const avatar = 'https://img.freepik.com/vecteurs-premium/photo-profil-avatar-homme-illustration-vectorielle_268834-538.jpg';
    const banner = 'https://img.freepik.com/premium-photo/universal-linkedin-banner-with-pink-sunset-alps-any-profession_198208-983.jpg?w=2000'
    const user = ({ username: 'test', email: 'test@', password: 'toto', avatar, banner });
    const tweet: TweetDto = ({
      content: 'tweet',
      date: Date.now()
    });
    const tweet2: TweetDto = ({
      content: 'message from tweet 1',
      date: Date.now()
    });
    const createdUser = await userDao.create(user);
    const userId = createdUser!['uid']!;

    tweet.userId = userId;

    const createdTweet = await tweetDao.create(tweet);

    const tweetId = createdTweet!.tweet!['uid']!;

    tweet2.userId = userId;

    const createdTweet2 = await tweetDao.create(tweet2);
    const tweet2Id = createdTweet2!.tweet['uid'];



    await neo4jDatabase!.createRelationship({
      leftNode: { label: 'Tweet', uid: tweet2Id! },
      rightNode: { label: 'Tweet', uid: tweetId },
      relation: 'PART_OF'
    });


    const user2 = await userDao.create({ email: 'jogabi@', username: 'jogabi', password: 'pwd', avatar, banner });

    const tweet3 = await tweetDao.create(({ userId: user2!['uid']!, content: 'testtweet', date: Date.now() }));
    await neo4jDatabase!.createRelationship({
      leftNode: { label: 'User', uid: user2!['uid']! },
      rightNode: { label: 'Tweet', uid: tweet3!.tweet!['uid']! },
      relation: 'WROTE_TWEET'
    });

    await userDao.create({ email: 'user2@', username: 'user2', password: 'pwd', avatar, banner });

  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    //db.close();
    console.log('CLOSE DRIVER');
    Neo4jDB.close();
  }
})();