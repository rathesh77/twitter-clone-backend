import Neo4jDB from './database/neo4j.database'
import UserDao from './models/dao/user.dao'
import TweetDao from './models/dao/tweet.dao'
import neo4jDatabase from './database/neo4j.database'
import TweetDto from './models/dto/tweet.dto'

async function initData(db: typeof Neo4jDB, userDao: UserDao, tweetDao: TweetDao) {
  if (!db) {
    return
  }
  try {
    await db.flushDB()

    let user = ({ username: "test", email: "test@", password: 'toto', avatar: 'https://i.imgflip.com/43j133.png', banner: 'https://previews.123rf.com/images/starlineart/starlineart1812/starlineart181200561/114211162-indian-flag-banner-with-geometric-pattern.jpg' });
    let tweet = new TweetDto({
      content: "tweet",
      date: Date.now()
    });
    const tweet2 = new TweetDto({ 
      content: "message from tweet 1", 
      date: Date.now() 
    });
    const createdUser = await userDao.create(user)
    const userId = createdUser!['uid']!

    tweet.userId = userId

    const createdTweet = await tweetDao.create(tweet)

    const tweetId = createdTweet?.tweet!['uid']!

    tweet2.userId = userId

    const createdTweet2 = await tweetDao.create(tweet2)
    const tweet2Id = createdTweet2!.tweet['uid']



    await neo4jDatabase!.createRelationship({
      leftNode: { label: "Tweet", uid: tweet2Id! },
      rightNode: { label: "Tweet", uid: tweetId },
      relation: "PART_OF"
    });


    const user2 = await userDao.create({ email: 'jogabi@', username: 'jogabi', password: 'pwd', avatar: 'https://thefitgirlz.com/wp-content/uploads/2018/07/anacheri-2.jpg', banner: "https://www.muscleandfitness.com/wp-content/uploads/2017/09/ana-cheri-main-1109.jpg?quality=86&strip=all" })

    const tweet3 = await tweetDao.create(new TweetDto({ userId: user2!['uid']!, content: 'testtweet', date: Date.now() }))
    await neo4jDatabase!.createRelationship({
      leftNode: { label: "User", uid: user2!['uid']! },
      rightNode: { label: "Tweet", uid: tweet3?.tweet!['uid']! },
      relation: "WROTE_TWEET"
    });

    const user3 = await userDao.create({ email: 'user2@', username: 'user2', password: 'pwd', avatar: 'https://pbs.twimg.com/profile_images/1192991057/144621476_400x400.jpg', banner: 'https://steamuserimages-a.akamaihd.net/ugc/1613797962877782991/99A32B4CA5FA378E7152B2A3449AA479B4705E38/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%2523000000&letterbox=false' })

  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    //db.close();
    console.log("CLOSE DRIVER");
  }
}

export default initData