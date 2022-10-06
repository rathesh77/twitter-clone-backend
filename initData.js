const User = require('./models/User')
const Message = require('./models/Message')
const Tweet = require('./models/Tweet')

async function initData(db) {

    try {
      await db.flushDB()

      let user = { username: "test", email: "test@", password: 'toto', avatar: 'https://i.imgflip.com/43j133.png', banner: 'https://previews.123rf.com/images/starlineart/starlineart1812/starlineart181200561/114211162-indian-flag-banner-with-geometric-pattern.jpg' };
      let tweet = {
        content: "tweet",
        mentionnedPeople: ["a"],
      };
      const message = {content: "message from tweet 1",
      mentionnedPeople: ["a"], };
      const createdUser = await User.create(user)
      const userId = createdUser.get('uid')

      tweet.authorId = userId

      const createdTweet = await Tweet.create(tweet)
      const tweetId = createdTweet.get('uid')

      message.authorId = userId
      message.tweetId = tweetId

      const createdMessage = await Tweet.create(message)
      const messageId = createdMessage.get('uid')

      await db.createRelationship(
        { label: "User", uid: userId },
        { label: "Tweet", uid: tweetId },
        "WROTE_TWEET"
      );
      await db.createRelationship(
        { label: "Tweet", uid: messageId },
        { label: "Tweet", uid: tweetId },
        "PART_OF"
      );
      await db.createRelationship(
        { label: "User", uid: userId },
        { label: "Tweet", uid: messageId },
        "WROTE_TWEET"
      );
      user = await User.create({email: 'jogabi@', username: 'jogabi', password: 'pwd', avatar: 'https://www.capri-sun.com/fr/wp-content/uploads/sites/11/2021/03/TP_Multivitamin_NA_CCEP_3D_Packshot_clean_Paper.png', banner: "https://www.capri-sun.com/fr/wp-content/uploads/sites/11/2021/07/221038_CS_Improved_Paperstraw_Banner_Sprachen_FR_1.png"})
      tweet = await Tweet.findLimit1('*')

      tweet = await Tweet.create({authorId: user.get('uid'), content: 'testtweet', mentionnedPeople: [], date: '0'})
      await db.createRelationship(
        { label: "User", uid: user.get('uid') },
        { label: "Tweet", uid: tweet.get('uid') },
        "WROTE_TWEET"
      );
    
      user = await User.create({email: 'user2@', username: 'user2', password: 'pwd', avatar: 'https://pbs.twimg.com/profile_images/1192991057/144621476_400x400.jpg', banner: 'https://steamuserimages-a.akamaihd.net/ugc/1613797962877782991/99A32B4CA5FA378E7152B2A3449AA479B4705E38/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%2523000000&letterbox=false'})

    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      //db.close();
      console.log("CLOSE DRIVER");
    }
}

module.exports = initData