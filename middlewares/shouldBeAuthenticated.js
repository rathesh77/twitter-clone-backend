module.exports = function(req, res, next) {
  if(!req.session.userId) {
    res.status(400)
    res.json('user must be authenticated')
    return
  }
  next()
}