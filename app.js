const express = require('express')
const app = express()
const port = 3001
const { requireLogin } = require('./middleware')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('./database')
const session = require('express-session')

const sever = app.listen(port, () => console.log('Sever listening on ' + port))

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

app.use('/login', loginRoute)
app.use('/logout', logoutRoute)
app.use('/register', registerRoute)
app.use('/posts', requireLogin, postRoute)
app.use('/profile', requireLogin, profileRoute)
app.use('/uploads', uploadRoute)

// Api routes
const postsApiRoute = require('./routes/api/posts')
const usersApiRoute = require('./routes/api/users')

app.use('/api/posts', postsApiRoute)
app.use('/api/users', usersApiRoute)

app.get('/', requireLogin, (req, res, next) => {
  const payload = {
    pageTitle: 'Home',
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user)
  }
  res.status(200).render('home', payload)
})
