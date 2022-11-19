const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema')
const Chat = require('../../schemas/ChatSchema')
const Message = require('../../schemas/MessageSchema')

app.use(bodyParser.urlencoded({ extended: false }))

router.post("/", async (req, res, next) => {
  const { content, chatId } = req.body
  if (!content || !chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
  }
  const newMessage = {
      sender: req.session.user._id,
      content,
      chat: req.body.chatId
  };

  Message.create(newMessage)
  .then(async message => {
      message = await message.populate("sender")
      message = await message.populate("chat")
      // 這兩個 await 後面到底需要加 .execPopulate() 嗎?
      Chat.findByIdAndUpdate(chatId, { latestMessage: message })
      .catch(error => console.log(error))
      res.status(201).send(message)
  })
  .catch(error => {
      console.log(error)
      res.sendStatus(400)
  })
})

module.exports = router
