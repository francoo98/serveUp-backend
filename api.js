const express = require('express')
const k8s = require('@kubernetes/client-node')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const gameServerCreators = require('./gameServerCreators')

const app = express()
const port = 3000

const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api)

const corsConfiguration = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsConfiguration))

app.use(cookieParser('nose'))

const users = ['franco', 'tomi']
const supportedGames = ['minecraft', 'xonotic']

app.get('/api/server/', (req, res) => {
  if (!req.cookies.user || !users.includes(req.cookies.user)) {
    res.status(401).send()
    return
  }

  k8sApi.listNamespacedService('user-' + req.cookies.user)
    .then((resK8s) => {
      const services = []
      resK8s.body.items.forEach((item, i) => {
        const service = {}
        service.id = item.metadata.name.slice(-4)
        if (item.spec.type === 'ClusterIP') {
          service.ip = item.spec.clusterIP
        } else if (item.spec.type === 'LoadBalancer') {
          service.ip = item.status.loadBalancer.ingress[0].hostname
        }
        service.port = item.spec.ports[0].port
        services.push(service)
      })
      res.send(services)
    })
    .catch((err) => {
      console.error('Error:', err)
      res.send(err)
    })
})

app.post('/api/server/:game', async (req, res) => {
  if (!supportedGames.includes(req.params.game)) {
    res.status(404).send()
  }

  if (req.cookies.user === undefined || !users.includes(req.cookies.user)) {
    res.status(401).send()
  }

  let server
  try {
    switch (req.params.game) {
      case 'minecraft':
        server = await gameServerCreators.createMinecraftServer(req.cookies.user)
        break
      case 'xonotic':
        server = await gameServerCreators.createXonoticServer(req.cookies.user)
        break
      default:
        return res.status(404).send()
    }
    console.log('server', server)
    res.status(201).send(server)
  } catch (error) {
    console.log('error endpoint: ', { error })
    res.status(500).send(error)
  }
})

app.delete('/api/server/:id', async (req, res) => {
  const userNamespace = 'user-' + req.cookies.user
  const serviceName = 'gameserver-service-' + req.params.id
  const deploymentName = 'gameserver-deployment-' + req.params.id

  try {
    await k8sAppsApi.deleteNamespacedDeployment(deploymentName, userNamespace)
    await k8sApi.deleteNamespacedService(serviceName, userNamespace)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.toString() })
  }
  res.status(204).send()
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

async function getService (serviceName, namespace, recursionCount = 0) {
  // This function is needed because ingress is not initialize everytime you get the service
  // So we need to retry until we get the ingress
  recursionCount++
  const service = await k8sApi.readNamespacedService(serviceName, namespace)
  const exists = service?.body?.status?.loadBalancer?.ingress?.length !== 0
  console.log(JSON.stringify(service.body, null, 2))
  if (exists) {
    return service
  } else {
    if (recursionCount < 50) {
      await sleep(300)
      return getService(serviceName, namespace, recursionCount)
    } else {
      return -1
    }
  }

  /* try {
    const service = await k8sApi.readNamespacedService(serviceName, namespace)
    service.body.status.loadBalancer.ingress[0]
    return service
  } catch {
    if (recursionCount < 50) {
      return getService(serviceName, namespace, recursionCount)
    } else {
      return -1
    }
  } */
}

function sleep (milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function generateRandomString () {
  return Math.random().toString(36).substring(2, 6)
}
