import { NextFunction, Response, Request } from 'express';

export default function (req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    res.status(400);
    res.json('user must not be authenticated');
    return;
  }
  next();
}