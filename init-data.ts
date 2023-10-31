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

    const user = ({ username: 'test', email: 'test@', password: 'toto', avatar: 'https://list.lisimg.com/image/9768637/700full.jpg', banner: 'https://49.media.tumblr.com/61edc98494c766f54540a0b8425a3b04/tumblr_npt3odClI51u6nwqio1_540.gif' });
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


    const user2 = await userDao.create({ email: 'jogabi@', username: 'jogabi', password: 'pwd', avatar: 'https://thefitgirlz.com/wp-content/uploads/2018/07/anacheri-2.jpg', banner: 'https://www.muscleandfitness.com/wp-content/uploads/2017/09/ana-cheri-main-1109.jpg?quality=86&strip=all' });

    const tweet3 = await tweetDao.create(({ userId: user2!['uid']!, content: 'testtweet', date: Date.now() }));
    await neo4jDatabase!.createRelationship({
      leftNode: { label: 'User', uid: user2!['uid']! },
      rightNode: { label: 'Tweet', uid: tweet3!.tweet!['uid']! },
      relation: 'WROTE_TWEET'
    });

    await userDao.create({ email: 'user2@', username: 'user2', password: 'pwd', avatar: 'https://pbs.twimg.com/profile_images/1192991057/144621476_400x400.jpg', banner: 'https://steamuserimages-a.akamaihd.net/ugc/1613797962877782991/99A32B4CA5FA378E7152B2A3449AA479B4705E38/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%2523000000&letterbox=false' });

  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    //db.close();
    console.log('CLOSE DRIVER');
    Neo4jDB.close();
  }
})();