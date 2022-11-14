const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const User = require('../../schemas/UserSchema')
const Post = require('../../schemas/PostSchema')

app.use(bodyParser.urlencoded({ extended: false }))

router.get('/', async (req, res, next) => {
  const searchObj = req.query
  if (searchObj.isReply !== undefined) {
    const isReply = searchObj.isReply == 'true'
    // 如果 searchObj.isReply 是 true，則 isReply 為 true
    searchObj.replyTo = { $exists: isReply }
    // 如果 isReply 為 true，$exists 尋找存在 replyTo 的物件
    // 如果為 false 則尋找不存在 replyTo 的物件
    delete searchObj.isReply
  }
  if (searchObj.search !== undefined) {
    searchObj.content = { $regex: searchObj.search, $options: 'i' }
    //  $option: 'i'，忽略大小寫，只搜尋值
    delete searchObj.search
  }
  // followingOnly 來自於 home.js
  // 這邊的目的是只看的到追蹤中的朋友的 post
  if (searchObj.followingOnly !== undefined) {
    const followingOnly = searchObj.followingOnly == 'true'
    if (followingOnly) {
      let objectIds = []
      if (!req.session.user.following) {
        req.session.user.following = []
        // 如果 req.session.user.following 不是陣列的話(還沒有following)
        // 將 following 改為 []，避免出錯
      }
      req.session.user.following.forEach(user => {
        objectIds.push(user)
        // 這是要避免 following 人數因重複點擊累加
      })
      objectIds.push(req.session.user._id) // 這樣才看的到自己的 post
      searchObj.postedBy = { $in: objectIds }
      // 把追蹤名單用 $in 查找出 post
    }
    delete searchObj.followingOnly
  }
  const results = await getPosts(searchObj)
  res.status(200).send(results)
})

router.get('/:id', async (req, res, next) => {
  const postId = req.params.id
  const postData = await getPosts({ _id: postId })
  const results = {
    postData: postData[0]
    // 因為 getPosts 使用 find() 返回的是 array
  }
  if (postData.reply !== undefined) {
    results.replyTo = postData.replyTo
  }
  results.replies = await getPosts({ replyTo: postId })
  // 把所有回覆該 postId 的貼文都撈出來
  res.status(200).send(results)
})

router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    console.log('Content param not send with request')
    return res.sendStatus(400)
  }
  const postData = {
    content: req.body.content,
    postedBy: req.session.user
  }
  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo
  }
  Post.create(postData)
    .then(async newPost => {
      newPost = await User.populate(newPost, {
        path: 'postedBy'
      })
      res.status(201).send(newPost)
    })
    .catch(error => {
      console.log(error)
      res.sendStatus(400)
    })
})

router.put('/:id/like', async (req, res, next) => {
  const postId = req.params.id
  const userId = req.session.user._id
  const isLiked = req.session.user.likes && req.session.user.likes.includes(postId)
  // 使用 && 是因為要先確認 req.session.user.likes 這個陣列存在
  // 再使用 .includes(postId) 確認
  const option = isLiked ? '$pull' : '$addToSet'
  // [option]: 在 mongoDB 使用變數時，加上 []
  req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true })
  // 在 findByIdAndUpdate(Id, data, { new: true }) 第三個參數加上 new: true 使返回的 document 為更新過的
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
  const post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true })
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
  res.status(200).send(post)
})

router.post('/:id/retweet', async (req, res, next) => {
  const postId = req.params.id
  const userId = req.session.user._id
  // 用 MongoDB 的 findOneAndDelete，直接找對應的 retweet，結果是 null 的話，直接新增一條 retweet
  const deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
    .catch(error => {
      console.log(error)
      res.sendStatus(400)
    })
  const option = deletedPost != null ? '$pull' : '$addToSet'
  let rePost = deletedPost
  if (rePost == null) {
    rePost = await Post.create({ postedBy: userId, retweetData: postId })
  }
  // 在使用者的 User 加入 retweets 資料
  req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: rePost._id } }, { new: true })
  // retweets: rePost._id 指的是被轉貼推文的 _id
  // [option]: 在 mongoDB 使用變數時，加上 []
  // 在 findByIdAndUpdate(Id, data, { new: true }) 第三個參數加上 new: true 使返回的 document 為更新過的
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
  // 在原推文的 Post 加入轉推者的 id
  const post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true })
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
  res.status(200).send(post)
})

router.delete('/:id', async (req, res, next) => {
  Post.findByIdAndDelete({ _id: req.params.id })
  .then(() => res.sendStatus(202))
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
})

router.put('/:id', async (req, res, next) => {
  if (req.body.pinned !== undefined) {
    await Post.updateMany({ postedBy: req.session.user }, { pinned: false })
    .catch(error => {
      console.log(error)
      res.sendStatus(400)
    })
  }

  Post.findByIdAndUpdate(req.params.id, req.body)
  .then(() => res.sendStatus(204))
  .catch(error => {
    console.log(error)
    res.sendStatus(400)
  })
})


const getPosts = async (filter) => {
  let results = await Post.find(filter)
  .populate('postedBy')
  .populate('retweetData')
  .populate('replyTo')
  .sort({ 'createdAt': -1 })
  .catch(error => console.log(error))
  results = await User.populate(results, { path: 'replyTo.postedBy'})
  return await User.populate(results, { path: 'retweetData.postedBy'})
}

module.exports = router