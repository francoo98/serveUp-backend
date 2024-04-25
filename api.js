const express = require('express')
const k8s = require('@kubernetes/client-node');

const app = express()
const port = 3000

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

app.get('/api/server/', (req, res) => {
    k8sApi.listNamespacedService('default')
    .then((resK8s) => {
        let services = []
        resK8s.body.items.forEach((item, i) => {
            let service = {}
            service.name = item.metadata.name
            if(item.spec.type === "ClusterIP") {
                service.ip = item.spec.clusterIP
            }
            else if(item.spec.type === "LoadBalancer") {
                service.ip = item.status.loadBalancer.ingress[0].ip
            }
            service.port = item.spec.ports[0].port;
            services.push(service)
        })
        res.send(services)
    })
    .catch((err) => {
        console.error('Error:', err)
        res.send(err)
    });
})

app.post('/api/server/', async (req, res) => {
    const deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: 'minecraft-deployment',
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: 'game-server',
                },
            },
            template: {
                metadata: {
                    labels: {
                        app: 'game-server',
                        game: 'minecraft'
                    },
                },
                spec: {
                    containers: [
                        {
                            name: 'minecraft',
                            image: 'minecraft',
                            imagePullPolicy: 'Never'
                        },
                    ],
                },
            },
        },
    }

    try {
        const createDeployment = await k8sAppsApi.createNamespacedDeployment('default', deployment)
      
        const service = {
          kind: "Service",
          apiVersion: "v1",
          metadata: {
            name: "minecraft-service",
          },
          spec: {
            selector: {
              app: "minecraft",
            },
            ports: [{
              protocol: "TCP",
              port: 25565,
              targetPort: 25565,
            }],
            type: "LoadBalancer"
          }
        }
      
        const createService = await k8sApi.createNamespacedService('default', service)
        await sleep(10000);
        console.log(createService.body.status.loadBalancer)
        // Por defecto, algunos kube-proxy y servicios solo llenarán 'status.loadBalancer.ingress[0].ip', otros llenarán 'status.loadBalancer.ingress[0].hostname'.
        const ip = createService.status.loadBalancer.ingress[0].ip || createService.status.loadBalancer.ingress[0].hostname
        res.json({ ip })
      
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.toString() })
    }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
 }