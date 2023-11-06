import * as express from 'express';
import cache from '../cache/user-actions.cache';

const TIMEOUT_DELAY = 2000;

const tooManyRequestsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction)=> {

  const sessionId = req.session.userId;
  if (!cache[sessionId]) {
    cache[sessionId] = {};
    cache[sessionId][req.route.path] = Date.now();
  } else if (!cache[sessionId][req.route.path]) {
    cache[sessionId][req.route.path] = Date.now();
  } else {
    const deltaTimePreviousRequest = Date.now() - cache[sessionId][req.route.path];
    if ( deltaTimePreviousRequest  < TIMEOUT_DELAY) {
      console.log(`${sessionId} is spamming the API`);
      res.status(429);
      res.setHeader('Retry-After', Math.ceil((TIMEOUT_DELAY - deltaTimePreviousRequest) / 1000));
      res.send('sending too many request');
      return;
    }
    cache[sessionId][req.route.path] = Date.now();
  }
  next();
};

export default tooManyRequestsMiddleware;