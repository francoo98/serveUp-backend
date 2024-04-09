const axios = require('axios');

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
    
    getServers() {
        return axios.get('http://nova.openstack.svc.metal.kube.um.edu.ar/v2.1/82e080d7e97f4cfb858eb766b25a9bd6/servers')
        .then(response => {
            return response.data
        })
        .catch(error => {
            return error.toJSON()
        })
    }
}

module.exports = {
    UMCloudProvider
}