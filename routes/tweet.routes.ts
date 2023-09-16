
import * as express from 'express'
import UserDao from '../models/dao/user.dao'
import TweetDao from '../models/dao/tweet.dao'
import shouldBeAuthenticated from '../middlewares/shouldBeAuthenticated'
import multer from 'multer'
import TweetNeo4j from '../implementation/neo4j/tweet.neo4j'
import neo4jDatabase from '../database/neo4j.database'
import UserNeo4j from '../implementation/neo4j/user.neo4j'

const tweetDao = new TweetDao(new TweetNeo4j())
const userDao = new UserDao(new UserNeo4j())

const router = express.Router()

let storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, './uploads');
  },
  filename: (_, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName)
  },
});

const upload = multer({ storage })

const fileLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const fileSize = parseInt(req.headers["content-length"]!) / (10 ** 6)
  if (fileSize > 512.0) {
    res.status(400)
    res.json({ msg: 'file size exceeded' })
    return
  }
  next()
}

router.post("/media", fileLimit, upload.single('file'), shouldBeAuthenticated, async function (req, res) {
  res.status(200)
  res.json({ ...req.file })
})

router.post("/tweet", shouldBeAuthenticated, async function (req, res) {
  const requestData = req.body.data;
  if (
    requestData.content == null ||
    requestData.mentionnedPeople == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  const tweet = {
    ...requestData,
    userId: req.session.userId
  };
  try {
    const user = await userDao.findByUserId(tweet.userId)
    if (!user) {
      res.json({ msg: "unknown tweet authorId" });
      return
    }
    const userId = user['uid']!
    const createdTweet = await tweetDao.create(tweet);
    if (!createdTweet) {
    res.status(400);
    res.json({ msg: "error when creating tweet" });
    return;
  }
    const createdTweetId = createdTweet!.tweet['uid']!
    console.log('requestData')
  console.log(requestData)
    if (requestData.masterTweetId != null) {
      await neo4jDatabase!.createRelationship({
        leftNode: { label: "Tweet", uid: createdTweetId },
        rightNode: { label: "Tweet", uid: requestData.masterTweetId },
        relation: "PART_OF"
      });
      await tweetDao.increaseRepliesCount(requestData.masterTweetId)
    }
    console.log(createdTweet)
    res.status(200);
    res.json(createdTweet);
  } catch (e) {
    res.status(400);
    console.log(e)
    res.json({ 'error': e });
  }

});

router.get("/my-related-tweets", shouldBeAuthenticated, async function (req, res) {
  const { userId } = req.query;
  if (
    userId == null
    || typeof userId !== 'string'
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }
  
  try {
    const tweets = await tweetDao.findAllTweetsUserInteractedWith(userId)

    res.status(200);
    res.json(tweets);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/deep-tweets", shouldBeAuthenticated, async function (req, res) {
  const { userId } = req.query;
  if (
    userId == null
    || typeof userId !== 'string'

  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    console.log(userId)
    const deepTweets = await tweetDao.findAllRelatedTweetsToUser(userId)

    res.status(200);
    res.json(deepTweets);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/tweet/:uid", shouldBeAuthenticated, async function (req, res) {
  const { uid } = req.params;
  if (
    uid == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await tweetDao.findById(uid)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'error' });
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

router.get("/tweet/:uid/messages", shouldBeAuthenticated, async function (req, res) {
  const { uid } = req.params;
  console.log(req.params)
  if (
    uid == null
    || typeof uid !== 'string'
  ) {
    res.status(400);
    res.json({ msg: "ersor" });
    return;
  }

  try {
    const tweet = await tweetDao.findById(uid)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'error' });
      return
    }
    const tweets = await tweetDao.findInnerTweetsByTweetId(uid)


    res.status(200);
    res.json(tweets);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error:'+e);
  }

});

router.get("/tweet-author", shouldBeAuthenticated, async function (req, res) {
  const { id } = req.query;
  if (
    id == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const author = await userDao.findAuthoredTweet(+id)

    res.status(200);
    res.json(author);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/retweet/:uid", shouldBeAuthenticated, async function (req, res) {
  const { uid } = req.params;
  if (uid == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  const tweet = await tweetDao.findById(uid)

  try {
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'error' });
      return
    }

    const userAlreadyRetweet = await tweetDao.findUserThatRetweeted(uid, req.session.userId!)
    if (userAlreadyRetweet != null) {

      await tweetDao.cancelRetweet(uid)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "RETWEETED"
      }
      );

      res.status(200);
      res.json({ msg: 'you cancelled retweet', retweetsIncrement: -1 });
      return
    }

    await tweetDao.retweet(uid)
    await neo4jDatabase!.createRelationship({
      leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
      rightNode: { label: "Tweet", uid },
      relation: "RETWEETED"
    }
    );
    res.status(200);
    res.json({ tweet, retweetsIncrement: 1 });
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/likeTweet/:uid", shouldBeAuthenticated, async function (req, res) {
  setTimeout(async ()=> {
  const { uid } = req.params;
  if (uid == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  if (!req.session.lastUpdatedTweet) {
    req.session.lastUpdatedTweet = {
      tweetId: uid,
      lastUpdated: Date.now()
    }
  } else if (Date.now() - req.session.lastUpdatedTweet.lastUpdated < 2000) {
    res.status(400);
    res.json({ msg: 'pre-check : tweet was updated very recently' });
    return
  }
  try {
    const tweet = await tweetDao.findById(uid)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'tweet doesnt exist' });
      return
    }

    if (tweet.tweet.lastUpdated && Date.now() - tweet.tweet.lastUpdated < 2000 ) {
      res.status(400);
      res.json({ msg: 'tweet was updated very recently' });
      return
    }
    let likesIncrement = 0
    let dislikesIncrement = 0

    const userThatDisliked = await tweetDao.findUserThatDisliked(uid, req.session.userId!)
    const userThatLiked = await tweetDao.findUserThatLiked(uid, req.session.userId!)

    if (userThatDisliked != null) { // s'il a deja disliké
      await tweetDao.cancelTweetDislike(uid) // on retire le dislike
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "DISLIKED"
      }
      );
      dislikesIncrement = -1
    }
    if (await tweetDao.findUserThatLiked(uid, req.session.userId!) == null) { // s'il n'a pas deja liké
      await tweetDao.likeTweet(uid)
      await neo4jDatabase!.createRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "LIKED"
      }
      );
      likesIncrement = 1
    } else { // s'il a deja liké
      await tweetDao.cancelTweetLike(uid)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "LIKED"
      }
      );
      likesIncrement = -1

    }

    res.status(200)
    res.json({ tweet, likesIncrement, dislikesIncrement });

  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }
}, 100)

});

router.post("/dislikeTweet/:uid", shouldBeAuthenticated, async function (req, res) {
  setTimeout(async ()=> {


  const { uid } = req.params;
  if (uid == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }
  if (!req.session.lastUpdatedTweet) {
    req.session.lastUpdatedTweet = {
      tweetId: uid,
      lastUpdated: Date.now()
    }
  } else if (Date.now() - req.session.lastUpdatedTweet.lastUpdated < 2000) {
    res.status(400);
    res.json({ msg: 'pre-check : tweet was updated very recently' });
    return
  }
  try {
    const tweet = await tweetDao.findById(uid)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'tweet doesnt exist' });
      return
    }
    if (tweet.tweet.lastUpdated && Date.now() - tweet.tweet.lastUpdated < 2000 ) {
      res.status(400);
      res.json({ msg: 'tweet was updated very recently' });
      return
    }
    let dislikesIncrement = 0
    let likesIncrement = 0
    if (await tweetDao.findUserThatLiked(uid, req.session.userId!)) {
      await tweetDao.cancelTweetLike(uid)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "LIKED"
      }
      );
      likesIncrement = -1
    }
    if (await tweetDao.findUserThatDisliked(uid, req.session.userId!) == null) {
      await tweetDao.dislikeTweet(uid)
      await neo4jDatabase!.createRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "DISLIKED"
      }
      );
      dislikesIncrement = 1
    } else {
      await tweetDao.cancelTweetDislike(uid)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "DISLIKED"
      }
      );
      dislikesIncrement = -1

    }
    res.status(200)
    res.json({ tweet, dislikesIncrement, likesIncrement });

  } catch (e) {
    res.status(400);
    res.json('error');
  }
}, 100)
});
export default router