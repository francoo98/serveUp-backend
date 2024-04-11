const axios = require('axios');
require('dotenv').config()

class CloudProvider {
    constructor() {
        if (new.target === CloudProvider) {
            throw new TypeError("No puedes instanciar una clase abstracta!");
        }
    }
    
    getServers() {
        throw new TypeError("Metodo no implementado");
    }
}

class UMCloudProvider extends CloudProvider {
    constructor() {
        super()
    }
    
    async authenticate() {
        const body = {
            "auth": {
                "identity": {
                    "methods": [
                        "password"
                    ],
                    "password": {
                        "user": {
                            "name": process.env.UM_CLOUD_USERNAME,
                            "domain": {
                                "name": "Default"
                            },
                            "password": process.env.UM_CLOUD_PASSWORD,
                        }
                    }
                }
            }
        }

        const res = await axios.post('http://keystone.openstack.svc.metal.kube.um.edu.ar/v3/auth/tokens', body)
        this.tokenID = res.headers['x-subject-token']
    }

    async getServers() {
        try {
            await this.authenticate()
            const res = await axios.get('http://nova.openstack.svc.metal.kube.um.edu.ar/v2.1/82e080d7e97f4cfb858eb766b25a9bd6/servers',
            {
                headers: {
                    'X-Auth-Token': this.tokenID
                }
            })
            return res.data
        }
        catch(error) {
            return error.toJSON()
        }
    }

    async createServer() {
        try {
            await this.authenticate()
            const res = await axios.post('http://nova.openstack.svc.metal.kube.um.edu.ar/v2.1/82e080d7e97f4cfb858eb766b25a9bd6/servers',
            {
                "server": {
                    "name": "auto-allocate-network",
                    "imageRef": "b6c2998a-006f-4c7d-a62f-0062891e408e",
                    "flavorRef": "2d357d3d-32c1-4af8-81dd-a71a7d7cf303",
                    "networks" : [{
                        "uuid" : "6f728afe-d289-4ccc-b108-87c3fbcfc30c"
                    }]
                }
                
            },
            {
                headers: {
                    'X-Auth-Token': this.tokenID
                }
            })
            return res.data
        }
        catch(error) {
            return error.toJSON()
        }
    }
}

module.exports = {
    UMCloudProvider
}