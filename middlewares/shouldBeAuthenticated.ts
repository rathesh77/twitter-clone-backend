import { NextFunction, Response, Request } from "express"

export default function(req: any, res: Response, next: NextFunction) {
  if(!req.session.userId) {
    res.status(400)
    res.json('user must be authenticated')
    return
  }
  next()
}