const express = require('express')
const crypto = require('crypto')
const router = express.Router()

router.use(express.json())

let users = [
  {
    id: 1,
    username: 'franco',
    password: '123456',
    token: null
  },
  {
    id: 2,
    username: 'tomi',
    password: 'qwerty',
    token: null
  }
]

router.post('/login', (req, res) => {
  let user = users.find(user => user.username === req.body.username && user.password === req.body.password)
  if (user) {
    user.token = generateToken()
    res.status(200).cookie('sessionToken', user.token).send()
  } else {
    res.status(401).send()
  }
})

router.post('/logout', (req, res) => {
  res.send('About birds')
})

function generateToken () {
  return crypto.randomBytes(6).toString('hex')
}

module.exports = router
