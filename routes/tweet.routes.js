const router = require('express').Router()
const User = require('../models/User')
const Tweet = require('../models/Tweet')

const Neo4jDB = require('../database/Neo4jDB');
const Message = require('../models/Message');
const shouldBeAuthenticated = require('../middlewares/shouldBeAuthenticated')
const multer = require('multer')

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, fileName)
    },
});

const upload = multer({ storage })

const fileLimit = (req, res, next) => {
  const fileSize = parseInt(req.headers["content-length"]) / (10**6)
  if (fileSize > 512.0) {
    res.status(400)
    res.json({msg: 'file size exceeded'})
    return
  }
  next()
}

router.post("/media", fileLimit, upload.single('file'), shouldBeAuthenticated, async function (req, res) {
  res.status(200)
  res.json({...req.file})
})

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
    const messages = await Tweet.findInnerTweetsByTweetId(id)


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

router.post("/retweet/:id", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.params;
  if (id == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  const tweet = await Tweet.findById(id)
    
  try {
    if (tweet == null) {
      res.status(400);
      res.json({msg:'error'});
      return
    }
    
    const didUserAlreadyRetweet = await Tweet.findUserThatRetweeted(id, req.session.userId)
    if (didUserAlreadyRetweet != null) {

      await Tweet.cancelRetweet(id)
      await Neo4jDB.removeRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "RETWEETED"
      );

      res.status(200);
      res.json({msg:'you cancelled retweet', retweetsIncrement: -1});
      return
    }

    await Tweet.retweet(id)
    await Neo4jDB.createRelationship(
      { label: "User", uid: req.session.userId },
      { label: "Tweet", uid: id },
      "RETWEETED"
    );
    res.status(200);
    res.json({tweet, retweetsIncrement: 1});
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/likeTweet/:id", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.params;
  if (id == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await Tweet.findById(id)
    if (tweet == null) {
      res.status(400);
      res.json({msg:'tweet doesnt exist'});
      return
    }
    
    let likesIncrement = 1
    let dislikesDecrement = 0

    if (await Tweet.findUserThatDisliked(id, req.session.userId) != null) {
      await Tweet.cancelTweetDislike(id, req.session.userId)
      await Neo4jDB.removeRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "DISLIKED"
      );
      dislikesDecrement = 1
    }
    if (await Tweet.findUserThatLiked(id, req.session.userId) == null) {
      await Tweet.likeTweet(id, req.session.userId)
      await Neo4jDB.createRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "LIKED"
      );
    } else {
      await Tweet.cancelTweetLike(id, req.session.userId)
      await Neo4jDB.removeRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "LIKED"
      );
      likesIncrement = -1

    }

    res.status(200)
    res.json({tweet, likesIncrement, dislikesDecrement});

  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/dislikeTweet/:id", shouldBeAuthenticated, async function (req, res) {
  const {id} = req.params;
  if (id == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await Tweet.findById(id)
    if (tweet == null) {
      res.status(400);
      res.json({msg:'tweet doesnt exist'});
      return
    }
    
    let dislikesIncrement = 1
    let likesDecrement = 0
    if (await Tweet.findUserThatLiked(id, req.session.userId) != null) {
      await Tweet.cancelTweetLike(id, req.session.userId)
      await Neo4jDB.removeRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "LIKED"
      );
      likesDecrement = 1
    }
    if (await Tweet.findUserThatDisliked(id, req.session.userId) == null) {
      await Tweet.dislikeTweet(id, req.session.userId)
      await Neo4jDB.createRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "DISLIKED"
      );

    } else {
      await Tweet.cancelTweetDislike(id, req.session.userId)
      await Neo4jDB.removeRelationship(
        { label: "User", uid: req.session.userId },
        { label: "Tweet", uid: id },
        "DISLIKED"
      );
      dislikesIncrement = -1

    }
    res.status(200)
    res.json({tweet, dislikesIncrement, likesDecrement});

  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});
module.exports = router