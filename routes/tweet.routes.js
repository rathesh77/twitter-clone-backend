const router = require('express').Router()
const User = require('../models/User')
const Tweet = require('../models/Tweet')

const Neo4jDB = require('../database/Neo4jDB')

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
    dislikes: 0,
    shares: 0,
    uid: 59,
  };
  try {
    const user = await User.findByUserId(requestData.authorId)
    const userId = user.get('uid')
    const createdTweet = await Tweet.create(tweet);
    const tweetId = createdTweet.get('uid')
    tweet.author = createdTweet.get('u').properties
    await Neo4jDB.createRelationship(
      { label: "User", uid: userId },
      { label: "Tweet", uid: tweetId },
      "WROTE_TWEET"
    );
    res.status(200);
    res.json(tweet);
  } catch (e) {
    res.status(400);
    res.json('error');
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

    res.status(200);
    res.json(tweet);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

module.exports = router