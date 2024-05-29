const express = require('express')
const k8s = require('@kubernetes/client-node')
const gameServerCreators = require('./gameServerCreators')

const router = express.Router()

const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api)

const supportedGames = ['minecraft', 'xonotic']
const users = ['franco', 'tomi']

router.get('', (req, res) => {
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

router.post('/:game', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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

module.exports = router
