const express = require('express')
const app = express()
const port = 3001
const { requireLogin } = require('./middleware')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('./database')
const session = require('express-session')

const server = app.listen(port, () => console.log('Sever listening on ' + port))
const io = require('socket.io')(server, { pingTimeout: 60000 })

app.engine('pug', require('pug').__express)
app.set('view engine', 'pug')
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: false }))

// 在每個靜止檔案(css, image...)前加上 public 的路徑，要先引入 path
app.use(express.static(path.join(__dirname, 'public')))

// 建立 session 可以存放暫存資料，伺服器刷新後就會消失
app.use(session({
  secret: 'where we go',
  resave: true,
  saveUninitialized: false
}))

// Routes
const loginRoute = require('./routes/loginRoutes')
const registerRoute = require('./routes/registerRoutes')
const logoutRoute = require('./routes/logoutRoutes')
const postRoute = require('./routes/postRoutes')
const profileRoute = require('./routes/profileRoutes')
const uploadRoute = require('./routes/uploadRoutes')
const searchRoute = require('./routes/searchRoutes')
const messagesRoute = require('./routes/messagesRoutes')

app.use('/login', loginRoute)
app.use('/logout', logoutRoute)
app.use('/register', registerRoute)
app.use('/posts', requireLogin, postRoute)
app.use('/profile', requireLogin, profileRoute)
app.use('/uploads', uploadRoute)
app.use('/search', requireLogin, searchRoute)
app.use('/messages', requireLogin, messagesRoute)

// Api routes
const postsApiRoute = require('./routes/api/posts')
const usersApiRoute = require('./routes/api/users')
const chatsApiRoute = require('./routes/api/chats')
const messagesApiRoute = require('./routes/api/messages')

app.use('/api/posts', postsApiRoute)
app.use('/api/users', usersApiRoute)
app.use('/api/chats', chatsApiRoute)
app.use('/api/messages', messagesApiRoute)

app.get('/', requireLogin, (req, res, next) => {
  const payload = {
    pageTitle: 'Home',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user)
  }
  res.status(200).render('home', payload)
})

io.on('connection', (socket) => {
  socket.on('setup', (userData) => {
    // setup 是自定義名稱，需與 client 端的 emit 對應
    socket.join(userData._id) // 這裡的 join 與 javascript 不同，單純就是加入
    socket.emit('connected')
  })
  socket.on('join room', room => socket.join(room))
  // in 代表只在這個 room 發布 emit
  socket.on('typing', room => socket.in(room).emit('typing'))
  socket.on('stop typing', room => socket.in(room).emit('stop typing'))
  socket.on('new message', newMessage => {
    const { chat, sender } = newMessage
    if (!chat.users) return console.log('Chat.users not defined')
    chat.users.forEach(user => {
      if (user._id == sender._id) return
      console.log(user._id) // populate 有問題！
      socket.in(user._id).emit('message received', newMessage)
    })
  })
})