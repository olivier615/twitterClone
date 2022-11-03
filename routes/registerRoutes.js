const express = require('express')
const app = express()
const router = express.Router()
const bodyParser = require('body-parser')
const User = require('../schemas/UserSchema')
const bcrypt = require('bcrypt')

app.engine('pug', require('pug').__express)
app.set('view engine', 'pug')
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: false }))

router.get('/', (req, res, next) => {
  res.status(200).render('register')
})

router.post('/', async (req, res, next) => {
  const payload = req.body
  const { firstName, lastName, username, email, password } = req.body
  if (firstName.trim() && lastName.trim() && username.trim() && email.trim() && password) {
    const user = await User.findOne({
      $or: [
        { username },
        { email }
      ]
    })
    .catch((err) => {
      console.log(err)
      payload.errorMessage = 'Something went wrong'
      res.status(200).render('register', payload)
    })
    if (user === null) {
      // No user found
      const data = req.body
      data.password = await bcrypt.hash(password, 10)
      User.create(data)
      .then((user) => {
        req.session.user = user
        return res.redirect('/')
      })
    }
    else {
      // User found
      if (email.trim() === user.email) {
        payload.errorMessage = 'Email already in use'
      }
      else {
        payload.errorMessage = 'Username already in use'
      }
      res.status(200).render('register', payload)
    }
  }
  else {
    payload.errorMessage = 'Make sure each field has a valid value'
    res.status(200).render('register', payload)
  }
})

module.exports = router