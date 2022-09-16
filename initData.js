const User = require('./models/User')
const Message = require('./models/Message')
const Tweet = require('./models/Tweet')

async function initData(db) {

    try {
      await db.flushDB()
      const user = { uid: 1, username: "user", email: "toto@toto.fr" };
      const tweet = {
        uid: 1,
        content: "tweet",
        likes: 0,
        dislikes: 32,
        shares: 10,
        mentionnedPeople: ["a"],
      };
      const message = { uid: 1, content: "message from tweet 1" };
      const userId = (await User.create(db.driver, user)).get("uid");
      const tweetId = (await Tweet.create(db.driver, tweet)).get("uid");
  
      await db.createRelationship(
        { label: "User", uid: userId },
        { label: "Tweet", uid: tweetId },
        "WROTE_TWEET"
      );
      const messageId = (await Message.create(db.driver, message)).get("uid");
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