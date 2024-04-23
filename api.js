const express = require('express')
const k8s = require('@kubernetes/client-node');

const app = express()
const port = 3000

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sAppsApi = kc.makeApiClient(k8s.CoreV1Api);

app.get('/api/server/', (req, res) => {
    k8sAppsApi.listNamespacedService('default')
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
        console.error('Error:', err);
    });
})

app.post('/api/server/', (req, res) => {
    /*cloudProvider.createServer().then(server => {
        res.send(server)
    })*/
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})