module.exports = function(req, res, next) {
  if(req.session.userId) {
    res.status(400)
    res.json('user must not be authenticated')
    return
  }
  next()
}