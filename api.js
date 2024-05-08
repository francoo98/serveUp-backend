const express = require('express')
const k8s = require('@kubernetes/client-node')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()
const port = 3000

const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api)

const allowedOrigins = {
    origin: 'http://localhost:3000',
    credentials: true
}
app.use(cors(allowedOrigins))

app.use(cookieParser('nose'))

const users = ['franco', 'tomi']

app.get('/api/server/', (req, res) => {

    if(!req.cookies.user || !users.includes(req.cookies.user)) {
        res.status(401).send()
        return
    }

    k8sApi.listNamespacedService('user-'+req.cookies.user)
        .then((resK8s) => {
            let services = []
            resK8s.body.items.forEach((item, i) => {
                let service = {}
                service.name = item.metadata.name
                if(item.spec.type === 'ClusterIP') {
                    service.ip = item.spec.clusterIP
                }
                else if(item.spec.type === 'LoadBalancer') {
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

    if(req.cookies.user === undefined || !users.includes(req.cookies.user)) {
        res.status(401).send()
    }

    const deploymentDefinition = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: 'minecraft-deployment-' + generateRandomString(),
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

    const serviceName = 'minecraft-service-' + generateRandomString()
    const serviceDefinition = {
        kind: 'Service',
        apiVersion: 'v1',
        metadata: {
            name: serviceName,
        },
        spec: {
            selector: {
                app: 'game-server',
            },
            ports: [{
                protocol: 'TCP',
                port: 25565,
                targetPort: 25565,
            }],
            type: 'LoadBalancer'
        }
    }

    try {
        await k8sApi.createNamespacedService('user-'+req.cookies.user, serviceDefinition)
        await k8sAppsApi.createNamespacedDeployment('user-'+req.cookies.user, deploymentDefinition)
        const service = await getService(serviceName, 'user-'+req.cookies.user)
        console.log(service)
        res.status(201).json({ 
                    'name': service.body.metadata.name,
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

async function getService(serviceName, namespace, recursionCount = 0) {
    // This function is needed because ingress is not initialize everytime you get the service
    // So we need to retry until we get the ingress
    recursionCount++
    try {
        const service = await k8sApi.readNamespacedService(serviceName, namespace)
        service.body.status.loadBalancer.ingress[0]
        return service
    }
    catch {
        if(recursionCount < 50) {
            return getService(serviceName, namespace, recursionCount)
        }
        else {
            return -1
        }
    }
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function generateRandomString() {
    return Math.random().toString(36).substring(2, 6)
}