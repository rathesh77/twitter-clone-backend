const router = require('express').Router()
const User = require('../models/User')
const Tweet = require('../models/Tweet')

const Neo4jDB = require('../database/Neo4jDB');
const Message = require('../models/Message');

router.post("/tweet", async function (req, res) {
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
    likes: 0,
    replies: 0,
    shares: 0,
  };
  try {
    const user = await User.findByUserId(requestData.authorId)
    const userId = user.get('uid')
    const createdTweet = await Tweet.create(tweet);
    const createdTweetId = createdTweet.get('uid')
    tweet.author = createdTweet.get('u').properties
    tweet.uid = createdTweetId
    tweet.date = createdTweet.get('t').properties.date
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
    res.json({...tweet});
  } catch (e) {
    res.status(400);
    console.log(e)
    res.json({'error': e});
  }

});

router.get("/my-related-tweets", async function (req, res) {
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

router.get("/deep-tweets", async function (req, res) {
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

router.get("/tweet/:id", async function (req, res) {
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
      res.status(404);
      res.json({msg:'error'});
    }
    res.status(200);
    res.json(tweet);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/tweet/:id/messages", async function (req, res) {
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
      res.status(404);
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

router.get("/tweet-author", async function (req, res) {
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

router.post("/message", async function (req, res) {
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
module.exports = router