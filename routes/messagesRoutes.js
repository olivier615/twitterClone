const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('../schemas/UserSchema')
const Chat = require('../schemas/ChatSchema')

router.get("/", (req, res, next) => {
  res.status(200).render("inboxPage", {
    pageTitle: 'Inbox',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user)
  });
})

router.get("/new", (req, res, next) => {
  res.status(200).render("newMessage", {
    pageTitle: 'New message',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user)
  });
})

router.get("/:chatId", async (req, res, next) => {
  const userId = req.session.user._id
  const chatId = req.params.chatId
  const isValidId = mongoose.isValidObjectId(chatId)
  const payload =  {
    pageTitle: 'Chat',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  }
  if (!isValidId) {
    payload.errorMessage = 'Chat not exist or you do not have permission to view it.'
    return res.status(200).render("chatPage", payload)
  }
  let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
  .populate('users')
  // 同時尋找 chatId 與 userId，才不會讓不在對話的使用者也找到對話
  if (chat == null) {
    // 如果找不到對話時，改為查找用戶
    const userFound = await User.findById(chatId)
    if (userFound != null) {
      // get chat using user id
      chat = await getChatByUserId(userFound._id, userId)
    }
  }
  if (chat == null) {
    payload.errorMessage = 'Chat not exist or you do not have permission to view it.'
  }
  else {
    payload.chat = chat
  }
  res.status(200).render("chatPage", payload)
})

const getChatByUserId = (userLoggedInId, otherUserId) => {
  return Chat.findOneAndUpdate({
    isGroupChat: false,
    users: {
      $size: 2,
      $all: [ // all the condition
        { $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInId) } },
        { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } }
        // 使用 mongoose.Types.ObjectId() 確保找尋的是 ObjectId，才不會每次都創建新的對話
      ]
    }
  },
  {
    $setOnInsert: {
      users: [userLoggedInId, otherUserId]
    }
  },
  {
    new: true,
    upsert: true // if this doesn't exist already, create one
  })
  .populate('users')
}

module.exports = router