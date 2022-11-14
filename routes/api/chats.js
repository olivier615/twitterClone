const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema')
const Chat = require('../../schemas/ChatSchema')

app.use(bodyParser.urlencoded({ extended: false }))

router.post('/', async (req, res, next) => {
  if (!req.body.users) {
    console.log('Users param not send with request')
    return res.sendStatus(400)
  }
  const users = JSON.parse(req.body.users)
  if (users.length == 0) {
    console.log('Users array is empty')
    return res.sendStatus(400)
  }
  users.push(req.session.user) // put yourself into chat
  const chatData = {
    users,
    isGroupChat: true
  }
  Chat.create(chatData)
  .then(results => res.status(200).send(results))
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
})

router.get('/', async (req, res, next) => {
  Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } } })
  // $elemMatch 在陣列中尋找符合的元素
  .populate('users')
  .sort({ updateAt: -1 })
  .then(results => res.status(200).send(results))
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
})

module.exports = router