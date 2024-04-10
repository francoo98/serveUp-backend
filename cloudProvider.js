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
}

module.exports = {
    UMCloudProvider
}