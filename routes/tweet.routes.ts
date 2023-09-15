
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
    requestData.userId == null ||
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
    const user = await userDao.findByUserId(requestData.userId)
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
    const createdTweetId = createdTweet!['uid']!

    await neo4jDatabase!.createRelationship({
      leftNode: { label: "User", uid: userId },
      rightNode: { label: "Tweet", uid: createdTweetId },
      relation: "WROTE_TWEET"
    });
    if (requestData.tweetId != null) {
      await neo4jDatabase!.createRelationship({
        leftNode: { label: "Tweet", uid: createdTweetId },
        rightNode: { label: "Tweet", uid: requestData.tweetId },
        relation: "PART_OF"
      });
      await tweetDao.increaseRepliesCount(requestData.tweetId)
    }
    res.status(200);
    res.json({ ...createdTweet, author: user });
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
    const deepTweets = await tweetDao.findAllRelatedTweetsToUser(userId)

    res.status(200);
    res.json(deepTweets);
  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.get("/tweet/:id", shouldBeAuthenticated, async function (req, res) {
  const { id } = req.params;
  if (
    id == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await tweetDao.findById(id)
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

router.get("/tweet/:id/messages", shouldBeAuthenticated, async function (req, res) {
  const { id } = req.params;
  console.log(req.params)
  if (
    id == null
    || typeof id !== 'string'
  ) {
    res.status(400);
    res.json({ msg: "ersor" });
    return;
  }

  try {
    const tweet = await tweetDao.findById(id)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'error' });
      return
    }
    const messages = await tweetDao.findInnerTweetsByTweetId(id)


    res.status(200);
    res.json({ tweet, messages });
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

router.post("/retweet/:id", shouldBeAuthenticated, async function (req, res) {
  const { id } = req.params;
  if (id == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  const tweet = await tweetDao.findById(id)

  try {
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'error' });
      return
    }

    const userAlreadyRetweet = await tweetDao.findUserThatRetweeted(id, req.session.userId!)
    if (userAlreadyRetweet != null) {

      await tweetDao.cancelRetweet(id)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid: id },
        relation: "RETWEETED"
      }
      );

      res.status(200);
      res.json({ msg: 'you cancelled retweet', retweetsIncrement: -1 });
      return
    }

    await tweetDao.retweet(id)
    await neo4jDatabase!.createRelationship({
      leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
      rightNode: { label: "Tweet", uid: id },
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
  const { uid } = req.params;
  if (uid == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await tweetDao.findById(uid)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'tweet doesnt exist' });
      return
    }

    let likesIncrement = 1
    let dislikesDecrement = 0

    const userThatDisliked = await tweetDao.findUserThatDisliked(uid, req.session.userId!)
    const userThatLiked = await tweetDao.findUserThatLiked(uid, req.session.userId!)

    console.log(uid)

    console.log(userThatLiked)
    console.log(userThatDisliked)
    if (userThatDisliked != null) {
      await tweetDao.cancelTweetDislike(uid)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "DISLIKED"
      }
      );
      dislikesDecrement = 1
    }
    if (await tweetDao.findUserThatLiked(uid, req.session.userId!) == null) {
      await tweetDao.likeTweet(uid)
      await neo4jDatabase!.createRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid },
        relation: "LIKED"
      }
      );
    } else {
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
    res.json({ /*tweet,*/ likesIncrement, dislikesDecrement });

  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});

router.post("/dislikeTweet/:id", shouldBeAuthenticated, async function (req, res) {
  const { id } = req.params;
  if (id == null) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  try {
    const tweet = await tweetDao.findById(id)
    if (tweet == null) {
      res.status(400);
      res.json({ msg: 'tweet doesnt exist' });
      return
    }

    let dislikesIncrement = 1
    let likesDecrement = 0
    if (await tweetDao.findUserThatLiked(id, req.session.userId!) != null) {
      await tweetDao.cancelTweetLike(id)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid: id },
        relation: "LIKED"
      }
      );
      likesDecrement = 1
    }
    if (await tweetDao.findUserThatDisliked(id, req.session.userId!) == null) {
      await tweetDao.dislikeTweet(id)
      await neo4jDatabase!.createRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid: id },
        relation: "DISLIKED"
      }
      );

    } else {
      await tweetDao.cancelTweetDislike(id)
      await neo4jDatabase!.removeRelationship({
        leftNode: { label: "User", uid: req.session.userId ? req.session.userId : '' },
        rightNode: { label: "Tweet", uid: id },
        relation: "DISLIKED"
      }
      );
      dislikesIncrement = -1

    }
    res.status(200)
    res.json({ tweet, dislikesIncrement, likesDecrement });

  } catch (e) {
    console.log(e)
    res.status(400);
    res.json('error');
  }

});
export default router