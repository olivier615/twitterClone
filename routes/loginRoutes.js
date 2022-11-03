const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const User = require('../schemas/UserSchema')

app.engine('pug', require('pug').__express)
app.set('view engine', 'pug')
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: false }))

router.get('/', (req, res, next) => {
  res.status(200).render('login')
})

router.post('/', async (req, res, next) => {
  const payload = req.body
  const { logUserName, logPassword } = req.body
  if (logUserName && logPassword) {
    const user = await User.findOne({
      $or: [
        { username: logUserName },
        { email: logUserName }
      ]
    })
    .catch((err) => {
      console.log(err)
      payload.errorMessage = 'Something went wrong'
      res.status(200).render('login', payload)
    })
    if (user != null) {
      const result = await bcrypt.compare(logPassword, user.password)
      // 比較由使用者輸入的 logPassword 與 database 撈出的 user.password 是否一致
      if (result === true) {
        req.session.user = user
        return res.redirect('/')
      }
    }
    payload.errorMessage = 'Login credentials incorrect.'
    return res.status(200).render('login', payload)
  }
  payload.errorMessage = 'Make sure each field has a valid value'
  return res.status(200).render('login', payload)
})

module.exports = router