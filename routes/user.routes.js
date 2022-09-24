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

router.get("/me", shouldBeAuthenticated, async function (req, res) {
  try {
    const currentUser = await User.findByUserId(req.session.userId)
    if (!currentUser) {
      res.status(400)
      res.json({ msg: "error" })
      return
    }
    const currentUserNode = currentUser.get('u').properties
    delete currentUserNode.password
    res.status(200)
    res.json(currentUserNode)
  } catch (e) {
    res.status(400)
    res.json(e)
  }

})

router.get("/search", shouldBeAuthenticated, async function (req, res) {
  try {
    const {value} = req.query
    if (!value) {
      res.status(400)
      res.json({ msg: "error" })
      return
    }
    const results = await User.findResults(value)
    if (!results) {
      res.status(200)
      res.json([])
      return
    }

    res.status(200)
    res.json(results)
  } catch (e) {
    res.status(400)
    res.json(e)
  }

})

router.get("/user", shouldBeAuthenticated, async function (req, res) {
  try {
    const {id} = req.query
    if (!id) {
      res.status(400)
      res.json({ msg: "error" })
      return
    }
    const user = await User.findByUserId(id)
    if (!user) {
      res.status(200)
      res.json({msg: 'error'})
      return
    }
    if (user.password)
      delete user.password
      
    res.status(200)
    res.json(user)
  } catch (e) {
    res.status(400)
    res.json(e)
  }

})
router.post("/register", shouldNotBeAuthenticated, async function (req, res) {
  const requestData = req.body
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

router.delete("/logout", shouldBeAuthenticated, async function (req, res) {
  req.session.userId = null
  res.status(200)
  res.json({ msg: 'logged out successfully' })
})


module.exports = router