import { Request, Response } from 'express';

import * as express from 'express';
import UserDao from '../models/dao/user.dao';
import UserNeo4j from '../implementation/neo4j/user.neo4j';
import shouldNotBeAuthenticated from '../middlewares/should-not-be-authenticated.middleware';
import shouldBeAuthenticated from '../middlewares/should-be-authenticated.middleware';
import neo4jDatabase from '../database/neo4j.database';

const userDao = new UserDao(new UserNeo4j());
const router = express.Router();
router.post('/login', shouldNotBeAuthenticated, async function (req: Request, res: Response) {
  const requestData = req.body;
  if (
    requestData == null ||
    requestData.email == null ||
    requestData.password == null
  ) {
    res.status(400);
    res.json({ msg: 'invalid POST payload' });
    return;
  }

  const credentials = { ...requestData };
  try {
    const currentUser = await userDao.findByEmailAndPassword(credentials.email, credentials.password);
    if (!currentUser) {
      res.status(400);
      res.json({ msg: 'invalid credentials' });
      return;
    }
    const currentUserNode = currentUser;

    req.session.userId = currentUserNode.uid!;
    res.status(200);
    res.json(currentUserNode);
  } catch (e) {
    res.status(400);
    res.json(e);
  }

});

router.get('/me', shouldBeAuthenticated, async function (req: Request, res: Response) {
  try {
    const currentUser = await userDao.findByUserId(req.session.userId);
    if (!currentUser) {
      res.status(400);
      res.json({ msg: 'error' });
      return;
    }
    const currentUserNode = currentUser;
    res.status(200);
    res.json(currentUserNode);
  } catch (e) {
    res.status(400);
    res.json(e);
  }

});

router.get('/search', shouldBeAuthenticated, async function (req: Request, res: Response) {
  try {
    const { value } = req.query;
    if (typeof value !== 'string') {
      throw 'error';
    }
    if (!value) {
      res.status(400);
      res.json({ msg: 'error' });
      return;
    }
    const results = await userDao.findResults(value);
    if (!results) {
      res.status(200);
      res.json([]);
      return;
    }

    res.status(200);
    res.json(results);
  } catch (e) {
    res.status(400);
    res.json(e);
  }

});

router.get('/user', shouldBeAuthenticated, async function (req: Request, res: Response) {
  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      res.status(400);
      res.json({ msg: 'error' });
      return;
    }
    const user = await userDao.findByUserId(id);
    if (!user) {
      res.status(200);
      res.json({ msg: 'error' });
      return;
    }

    res.status(200);
    res.json(user);
  } catch (e) {
    res.status(400);
    res.json(e);
  }

});
router.post('/register', shouldNotBeAuthenticated, async function (req: Request, res: Response) {
  const requestData = req.body;
  if (
    requestData == null ||
    requestData.email == null ||
    requestData.password == null ||
    requestData.username == null
  ) {
    res.status(400);
    res.json({ msg: 'invalid POST payload' });
    return;
  }
  const credentials = { ...requestData };
  try {
    const userAlreadyExists = await userDao.findByEmail(credentials.email);
    if (userAlreadyExists) {
      res.status(400);
      res.json({ msg: 'email already in use' });
      return;
    }
    const newUser = await userDao.create(credentials);
    if (!newUser || !newUser['uid']) {
      res.json({ msg: 'error when creating user' });
      return;
    }
    const newUserNode = newUser;
    const newUserId = newUser['uid'];
    req.session.userId = newUserId;
    res.status(200);
    res.json(newUserNode);
  } catch (e) {
    res.status(400);
    res.json(e);
  }

});

router.put('/follow/:userId', shouldBeAuthenticated, async function (req: Request, res: Response) {
  const { userId } = req.params;
  if (!userId) {
    res.status(400);
    res.json({ msg: 'invalid params' });
    return;
  }
  const recipientId = userId;

  if (await userDao.doesUserFollowRecipient(req.session.userId, recipientId) !== false) {
    res.status(400);
    res.json({ msg: 'you already follow this user' });
    return;
  }

  await neo4jDatabase!.createRelationship({
    leftNode:{ label: 'User', uid: req.session.userId },
    rightNode:{ label: 'User', uid: recipientId },
    relation:'KNOWS'
  });
  res.status(200);
  res.json({ msg: 'success' });
});

router.get('/follow/:userId', shouldBeAuthenticated, async function (req: Request, res: Response) {
  const { userId } = req.params;
  if (!userId) {
    res.status(400);
    res.json({ msg: 'invalid params' });
    return;
  }
  const recipientId = userId;

  const relation = await userDao.doesUserFollowRecipient(req.session.userId, recipientId);
  if (relation !== false) {
    res.status(200);
    res.json(relation);
    return;
  }

  res.status(200);
  res.json(false);
});

router.get('/suggestions', shouldBeAuthenticated, async function (req: Request, res: Response) {

  const suggestions = await userDao.getSuggestionsForUser(req.session.userId);
  res.status(200);
  res.json(suggestions);
});

router.get('/followers', shouldBeAuthenticated, async function (req: Request, res: Response) {

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    res.status(400);
    res.json({ msg: 'invalid params' });
    return;
  }

  const count = await userDao.getFollowersCount(id);
  res.status(200);
  res.json({ count });
});

router.get('/followings', shouldBeAuthenticated, async function (req: Request, res: Response) {

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    res.status(400);
    res.json({ msg: 'invalid params' });
    return;
  }

  const count = await userDao.getFollowingsCount(id);
  res.status(200);
  res.json({ count });
});


router.delete('/logout', shouldBeAuthenticated, async function (req: Request, res: Response) {
  delete req.session.userId;
  res.status(200);
  res.json({ msg: 'logged out successfully' });
});


export default router;