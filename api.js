const express = require('express')
const cloudProviders = require('./cloudProvider')

const app = express()
const port = 3000
const cloudProvider = new cloudProviders.UMCloudProvider()

app.get('/api/server/', (req, res) => {
    cloudProvider.getServers().then(servers => {
        res.send(servers)
    })
})

app.post('/api/server/', (req, res) => {
    res.send('Got a POST request')
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})