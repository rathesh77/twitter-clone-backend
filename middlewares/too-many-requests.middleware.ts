import * as express from 'express';
import ipAddrs from '../cache/ip-addrs';

const tooManyRequestsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction)=> {
  const {ip_addr} = res.locals;
  if (!ip_addr) {
    res.status(401).send('no ip found');
    return;
  }

  if (!ipAddrs[ip_addr]) {
    ipAddrs[ip_addr] = {};
    ipAddrs[ip_addr][req.route.path] = Date.now();
  } else if (!ipAddrs[ip_addr][req.route.path]) {
    ipAddrs[ip_addr][req.route.path] = Date.now();
  } else {
    const deltaTimePreviousRequest = Date.now() - ipAddrs[ip_addr][req.route.path];
    if ( deltaTimePreviousRequest  < 2000) {
      console.log(`${ip_addr} is spamming the API`);
      res.status(429);
      res.send('sending too many request');
      return;
    }
    ipAddrs[ip_addr][req.route.path] = Date.now();
  }
  next();
};

export default tooManyRequestsMiddleware;