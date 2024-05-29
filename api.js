const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const serversApi = require('./servers-api')
const usersApi = require('./users-api')

const app = express()
const port = 3000

const corsConfiguration = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsConfiguration))

app.use(cookieParser('nose'))

app.use('/api/user', usersApi)
app.use('/api/server', serversApi)

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
