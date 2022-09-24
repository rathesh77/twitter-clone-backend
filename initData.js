const User = require('./models/User')
const Message = require('./models/Message')
const Tweet = require('./models/Tweet')

async function initData(db) {

    try {
      await db.flushDB()

      let user = { username: "user", email: "toto@toto.fr", password: 'toto', avatar: 'https://pbs.twimg.com/profile_images/1557819838222966785/JeYuvKvT_400x400.jpg' };
      let tweet = {
        content: "tweet",
        likes: 0,
        dislikes: 32,
        shares: 10,
        mentionnedPeople: ["a"],
      };
      const message = {content: "message from tweet 1" };
      const createdUser = await User.create(user)
      const userId = createdUser.get('uid')

      tweet.authorId = userId

      const createdTweet = await Tweet.create(tweet)
      const tweetId = createdTweet.get('uid')

      message.authorId = userId
      message.tweetId = tweetId

      const createdMessage = await Message.create(message)
      const messageId = createdMessage.get('uid')

      await db.createRelationship(
        { label: "User", uid: userId },
        { label: "Tweet", uid: tweetId },
        "WROTE_TWEET"
      );
      await db.createRelationship(
        { label: "Message", uid: messageId },
        { label: "Tweet", uid: tweetId },
        "PART_OF"
      );
      await db.createRelationship(
        { label: "User", uid: userId },
        { label: "Message", uid: messageId },
        "WROTE_MESSAGE"
      );
      user = await User.create({email: 'titi@', username: 'titi', password: 'pwd', avatar: 'https://pbs.twimg.com/profile_images/1557819838222966785/JeYuvKvT_400x400.jpg'})
      tweet = await Tweet.findLimit1('*')
      await db.createRelationship(
        { label: "User", uid: user.get('uid') },
        { label: "Tweet", uid: tweet.get('uid') },
        "RETWEETED"
      );
      tweet = await Tweet.create({authorId: user.get('uid'), content: 'testtweet', likes: 0, dislikes: 0, shares: 0, mentionnedPeople: [], date: '0'})
      await db.createRelationship(
        { label: "User", uid: user.get('uid') },
        { label: "Tweet", uid: tweet.get('uid') },
        "WROTE_TWEET"
      );
    
  
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      //db.close();
      console.log("CLOSE DRIVER");
    }
}

module.exports = initData