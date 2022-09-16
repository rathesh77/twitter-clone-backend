const User = require('./models/User')
const Message = require('./models/Message')
const Tweet = require('./models/Tweet')

async function initData(db) {

    try {
      await db.flushDB()

      const user = { username: "user", email: "toto@toto.fr" };
      const tweet = {
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
  
  
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      //db.close();
      console.log("CLOSE DRIVER");
    }
}

module.exports = initData