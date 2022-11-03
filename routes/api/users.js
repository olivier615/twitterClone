const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const upload = multer({ dest: 'uploads/' })
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema')

app.use(bodyParser.urlencoded({ extended: false }))

router.put("/:userId/follow", async (req, res, next) => {
  const { userId } = req.params
  const user = await User.findById(userId)
  if (user == null) return res.sendStatus(404)
  const isFollowing = user.followers && user.followers.includes(req.session.user._id)
  const option = isFollowing ? '$pull' : '$addToSet'
    // [option]: 在 mongoDB 使用變數時，加上 []
    req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option]: { following: userId } }, { new: true })
    // 在 findByIdAndUpdate(Id, data, { new: true }) 第三個參數加上 new: true 使返回的 document 為更新過的
    .catch(error => {
      console.log(error)
      res.sendStatus(400)
    })
    User.findByIdAndUpdate(userId, { [option]: { followers: req.session.user._id } })
    .catch(error => {
      console.log(error)
      res.sendStatus(400)
    })
  res.status(200).send(req.session.user)
})

router.get("/:userId/following", async (req, res, next) => {
  User.findById(req.params.userId)
  .populate('following')
  .then(results => {
    res.status(200).send(results)
  })
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
})

router.get("/:userId/followers", async (req, res, next) => {
  User.findById(req.params.userId)
  .populate('followers')
  .then(results => {
    res.status(200).send(results)
  })
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
})

router.post("/profilePicture", upload.single('croppedImage'), async (req, res, next) => {
  if (!req.file) {
    console.log('No file uploaded with ajax request.')
    return res.sendStatus(400)
  }
  const filePath = `/uploads/images/${ req.file.filename }.png`
  const tempPath = req.file.path
  const targetPath = path.join(__dirname, `../../${ filePath }`)
  fs.rename(tempPath, targetPath, async error => {
    if (error != null) {
      console.log(error)
      return sendStatus(400)
    }
    req.session.user = await User.findByIdAndUpdate(
      req.session.user._id,
      { profilePic: filePath },
      { new: true }
      )
    res.sendStatus(204) // 成功，但沒有 data 需要回傳
  })
})

router.post("/coverPhoto", upload.single('croppedImage'), async (req, res, next) => {
  if (!req.file) {
    console.log('No file uploaded with ajax request.')
    return res.sendStatus(400)
  }
  const filePath = `/uploads/images/${ req.file.filename }.png`
  const tempPath = req.file.path
  const targetPath = path.join(__dirname, `../../${ filePath }`)
  fs.rename(tempPath, targetPath, async error => {
    if (error != null) {
      console.log(error)
      return sendStatus(400)
    }
    req.session.user = await User.findByIdAndUpdate(
      req.session.user._id,
      { coverPhoto: filePath },
      { new: true }
      )
    res.sendStatus(204) // 成功，但沒有 data 需要回傳
  })
})

module.exports = router