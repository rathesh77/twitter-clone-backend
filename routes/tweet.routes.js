const router = require('express').Router()
const User = require('../models/User')
const Tweet = require('../models/Tweet')

const Neo4jDB = require('../database/Neo4jDB');
const Message = require('../models/Message');
const shouldBeAuthenticated = require('../middlewares/shouldBeAuthenticated')

router.post("/tweet", shouldBeAuthenticated, async function (req, res) {
  const requestData = req.body.data;
  if (
    requestData.authorId == null ||
    requestData.content == null ||
    requestData.mentionnedPeople == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  const tweet = {
    ...requestData,
  };
  try {
    const user = await User.findByUserId(requestData.authorId)
    const userId = user.get('uid')
    const createdTweet = await Tweet.create(tweet);
    const createdTweetId = createdTweet.get('uid')
    await Neo4jDB.createRelationship(
      { label: "User", uid: userId },
      { label: "Tweet", uid: createdTweetId },
      "WROTE_TWEET"
    );
    if (requestData.tweetId != null) {
      await Neo4jDB.createRelationship(
        { label: "Tweet", uid: createdTweetId },
        { label: "Tweet", uid: requestData.tweetId },
        "PART_OF"
      );
      await Tweet.increaseRepliesCount(requestData.tweetId)
    }
    res.status(200);
    res.json({...createdTweet.get('t').properties, author: user.get('u').properties});
  } catch (e) {
    res.status(400);
    console.log(e)
    res.json({'error': e});
  }

});

router.get("/my-related-tweets", shouldBeAuthenticated, async function (req, res) {
  const {userId} = req.query;
  if (
   userId == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweets = await Tweet.findAllTweetsUserInteractedWith(userId)

    res.status(200);
    res.json(tweets);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/deep-tweets", shouldBeAuthenticated, async function (req, res) {
  const {userId} = req.query;
  if (
   userId == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const deepTweets = await Tweet.findAllRelatedTweetsToUser(userId)

    res.status(200);
    res.json(deepTweets);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/tweet/:id", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.params;
  if (
   id == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await Tweet.findById(id)
    if (tweet == null) {
      res.status(400);
      res.json({msg:'error'});
      return
    }
    res.status(200);
    res.json(tweet);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/tweet/:id/messages", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.params;
  if (
   id == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await Tweet.findById(id)
    if (tweet == null) {
      res.status(400);
      res.json({msg:'error'});
      return
    }
    const messages = await Message.findByTweetId(id)


    res.status(200);
    res.json({tweet, messages});
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/tweet-author", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.query;
  if (
   id == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const author = await User.findAuthoredTweet(id)

    res.status(200);
    res.json(author);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/message", shouldBeAuthenticated, async function (req, res) {
  const {authorId, content, mentionnedPeople, tweetId} = req.body.data;
  if (
    authorId == null || 
   content == null || 
   mentionnedPeople == null || 
   tweetId == null 

  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const message = await Message.create(req.body.data)
    const messageId = message._fields[1]
    await Neo4jDB.createRelationship(
      { label: "User", uid: authorId },
      { label: "Message", uid: messageId },
      "WROTE_MESSAGE"
    );
    await Neo4jDB.createRelationship(
      { label: "Message", uid: messageId },
      { label: "Tweet", uid: tweetId },
      "PART_OF"
    );
    res.status(200);
    res.json(message);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/retweet/:id", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.params;
  if (id == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const didUserAlreadyRetweet = await Tweet.findUserThatRetweeted(id, req.session.userId)
    if (didUserAlreadyRetweet != null) {
      res.status(400);
      res.json({msg:'you already retweeted this tweet'});
      return
    }
    const tweet = await Tweet.findById(id)
    
    if (tweet == null) {
      res.status(400);
      res.json({msg:'error'});
      return
    }
    await Tweet.retweet(id)
    await Neo4jDB.createRelationship(
      { label: "User", uid: req.session.userId },
      { label: "Tweet", uid: id },
      "RETWEETED"
    );
    res.status(200);
    res.json(tweet);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});
module.exports = router