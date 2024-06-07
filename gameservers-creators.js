const k8s = require('@kubernetes/client-node')

const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api)

async function createMinecraftServer (user) {
  const serverId = generateServerId()

  const deploymentDefinition = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'gameserver-deployment-' + serverId
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          gameserver: 'gameserver-' + serverId
        }
      },
      template: {
        metadata: {
          labels: {
            gameserver: 'gameserver-' + serverId
          }
        },
        spec: {
          containers: [
            {
              name: 'minecraft',
              image: 'minecraft',
              imagePullPolicy: 'Never'
            }
          ]
        }
      }
    }
  }

  const serviceDefinition = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name: 'gameserver-service-' + serverId
    },
    spec: {
      selector: {
        gameserver: 'gameserver-' + serverId
      },
      ports: [{
        protocol: 'TCP',
        port: 25565,
        targetPort: 25565
      }],
      type: 'LoadBalancer'
    }
  }

  await k8sApi.createNamespacedService('user-' + user, serviceDefinition)
  await k8sAppsApi.createNamespacedDeployment('user-' + user, deploymentDefinition)
  await sleep(1000) // need to wait for the service ingress to be created
  const service = await k8sApi.readNamespacedService('gameserver-service-' + serverId, 'user-' + user)
  return {
    id: serverId,
    ip: service.body.status.loadBalancer.ingress[0].hostname,
    port: service.body.spec.ports[0].port
  }
}

async function createXonoticServer (user) {
  const serverId = generateServerId()

  const deploymentDefinition = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'gameserver-deployment-' + serverId
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          gameserver: 'gameserver-' + serverId
        }
      },
      template: {
        metadata: {
          labels: {
            gameserver: 'gameserver-' + serverId
          }
        },
        spec: {
          containers: [
            {
              name: 'xonotic',
              image: 'xonotic',
              imagePullPolicy: 'Never',
              volumeMounts: [
                {
                  name: 'config',
                  mountPath: '/root/.xonotic'
                }
              ]
            }
          ],
          volumes: [
            {
              name: 'config',
              emptyDir: {}
            }
          ]
        }
      }
    }
  }

  const serviceDefinition = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name: 'gameserver-service-' + serverId
    },
    spec: {
      selector: {
        gameserver: 'gameserver-' + serverId
      },
      ports: [{
        protocol: 'UDP',
        port: 26000,
        targetPort: 26000
      }],
      type: 'LoadBalancer'
    }
  }

  await k8sApi.createNamespacedService('user-' + user, serviceDefinition)
  await k8sAppsApi.createNamespacedDeployment('user-' + user, deploymentDefinition)
  // For some reason, the container with the server needs to be restarted to be able to work.
  // Restarting the deployment restarts the container.
  await restartDeployment('user-' + user, 'gameserver-deployment-' + serverId)
  sleep(1000) // need to wait for the service ingress to be created
  const service = await k8sApi.readNamespacedService('gameserver-service-' + serverId, 'user-' + user)
  return {
    id: serverId,
    ip: service.body.status.loadBalancer.ingress[0].hostname,
    port: service.body.spec.ports[0].port
  }
}

async function createTerrariaServer (user) {
  const serverId = generateServerId()

  const deploymentDefinition = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'gameserver-deployment-' + serverId
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          gameserver: 'gameserver-' + serverId
        }
      },
      template: {
        metadata: {
          labels: {
            gameserver: 'gameserver-' + serverId
          }
        },
        spec: {
          containers: [
            {
              name: 'terraria',
              image: 'terraria',
              imagePullPolicy: 'Never'
            }
          ]
        }
      }
    }
  }

  const serviceDefinition = {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name: 'gameserver-service-' + serverId
    },
    spec: {
      selector: {
        gameserver: 'gameserver-' + serverId
      },
      ports: [{
        protocol: 'TCP',
        port: 7777,
        targetPort: 7777
      }],
      type: 'LoadBalancer'
    }
  }

  await k8sApi.createNamespacedService('user-' + user, serviceDefinition)
  await k8sAppsApi.createNamespacedDeployment('user-' + user, deploymentDefinition)
  sleep(1000) // need to wait for the service ingress to be created
  const service = await k8sApi.readNamespacedService('gameserver-service-' + serverId, 'user-' + user)
  return {
    id: serverId,
    ip: service.body.status.loadBalancer.ingress[0].hostname,
    port: service.body.spec.ports[0].port
  }
}

function generateServerId () {
  return Math.random().toString(36).substring(2, 6)
}

function sleep (milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function restartDeployment(namespace, deploymentName) {
  try {
    const deployment = await k8sAppsApi.readNamespacedDeployment(deploymentName, namespace)
    const annotations = deployment.body.spec.template.metadata.annotations || {}
    annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString()
    deployment.body.spec.template.metadata.annotations = annotations

    await k8sAppsApi.replaceNamespacedDeployment(deploymentName, namespace, deployment.body)
    console.log(`Deployment ${deploymentName} restarted`)
  } catch (error) {
    console.error(`Error restarting Deployment ${deploymentName}:`, error)
  }
}

module.exports = { createXonoticServer, createMinecraftServer, createTerrariaServer }
