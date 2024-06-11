const k8s = require('@kubernetes/client-node')

const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api)

const users = ['franco', 'tomi']

async function deleteServers () {
  for (const user of users) {
    const services = await k8sApi.listNamespacedService('user-' + user)
    const deployments = await k8sAppsApi.listNamespacedDeployment('user-' + user)

    for (const service of services.body.items) {
      if (new Date() - service.metadata.creationTimestamp > 30000) {
        k8sApi.deleteNamespacedService(service.metadata.name, 'user-' + user)
      }
    }

    for (const deployment of deployments.body.items) {
      if (new Date() - deployment.metadata.creationTimestamp > 30000) {
        k8sAppsApi.deleteNamespacedDeployment(deployment.metadata.name, 'user-' + user)
      }
    }
  }
}

deleteServers()
