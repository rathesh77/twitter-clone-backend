const router = require('express').Router()
const User = require('../models/User')

const shouldNotBeAuthenticated = require('../middlewares/shouldNotBeAuthenticated')
const shouldBeAuthenticated = require('../middlewares/shouldBeAuthenticated')

router.post("/login", shouldNotBeAuthenticated, async function (req, res) {
  const requestData = req.body
  if (
    requestData == null ||
    requestData.email == null ||
    requestData.password == null
  ) {
    res.status(400)
    res.json({ msg: "invalid POST payload" })
    return
  }

  const credentials = {...requestData}
  try {
    const currentUser = await User.findByEmailAndPassword(credentials)
    if (!currentUser) {
      res.status(400)
      res.json({ msg: "invalid credentials" })
      return
    }
    const currentUserNode = currentUser.get('u').properties
    req.session.userId = currentUserNode.uid
    res.status(200)
    res.json(currentUserNode)
  } catch (e) {
    res.status(400)
    res.json(e)
  }

})

router.post("/register", shouldNotBeAuthenticated, async function (req, res) {
  const requestData = req.body
  console.log(requestData)
  if (
    requestData == null ||
    requestData.email == null ||
    requestData.password == null ||
    requestData.username == null
  ) {
    res.status(400)
    res.json({ msg: "invalid POST payload" })
    return
  }
  const credentials = {...requestData}
  try {
    const userAlreadyExists = await User.findByEmail(credentials.email)
    if (userAlreadyExists) {
      res.status(400)
      res.json({ msg: "email already in use" })
      return
    }
    const newUser = await User.create(credentials)
    const newUserNode = newUser.get('u').properties
    const newUserId = newUser.get('uid')
    req.session.userId = newUserId
    res.status(200)
    res.json(newUserNode)
  } catch (e) {
    res.status(400)
    res.json(e)
  }

})

router.get("/logout", shouldBeAuthenticated, async function (req, res) {
  req.session.userId = null
  res.status(200)
  res.json({ msg: 'logged out successfully' })
})


module.exports = router