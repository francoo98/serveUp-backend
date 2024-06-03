const express = require('express')
const crypto = require('crypto')
const router = express.Router()

router.use(express.json())

const users = [
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

function findUser (token) {
  if (!token) return undefined
  return users.find(user => user.token === token)
}

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
  let user = users.find(user => user.token === req.cookies.sessionToken)
  if (user) {
    user.token = null
    res.status(200).send()
  } else {
    res.status(401).send()
  }
})

function generateToken () {
  return crypto.randomBytes(6).toString('hex')
}

module.exports = [router, findUser]
