const express = require('express')
const k8s = require('@kubernetes/client-node')
const cors = require('cors')

const app = express()
const port = 3000

const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api)

const allowedOrigins = {
    origin: 'http://localhost:3000'
}
app.use(cors(allowedOrigins))


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

app.post('/api/server/', async (req, res) => {
    const deploymentDefinition = {
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

    const serviceDefinition = {
        kind: "Service",
        apiVersion: "v1",
        metadata: {
            name: "minecraft-service",
        },
        spec: {
            selector: {
                app: "game-server",
            },
            ports: [{
                protocol: "TCP",
                port: 25565,
                targetPort: 25565,
            }],
            type: "LoadBalancer"
        }
    }

    try {
        await k8sApi.createNamespacedService('default', serviceDefinition)
        await k8sAppsApi.createNamespacedDeployment('default', deploymentDefinition)
        const service = await getService()
        res.json({ 
                    "name": service.body.metadata.name,
                    'ip': service.body.status.loadBalancer.ingress[0].hostname,
                    'port': service.body.spec.ports[0].port
                })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.toString() })
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

async function getService() {
    // This function is needed because ingress is not initialize everytime you get the service
    // So we need to retry until we get the ingress
    try {
        const service = await k8sApi.readNamespacedService('minecraft-service', 'default')
        service.body.status.loadBalancer.ingress[0]
        return service
    }
    catch {
        return getService()
    }
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}