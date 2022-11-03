const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({
  content:{
    type: String,
    trim: true
  },
  // 如果要用在 retweet 轉推文，則 content 須改為非必要; required: true 要拿掉
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  pinned: Boolean,
  likes:[{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  retweetUsers:[{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  retweetData:{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  replyTo:{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }
},
  {
    timestamps: true
  }
)

const Post = mongoose.model('Post', PostSchema)
module.exports = Post