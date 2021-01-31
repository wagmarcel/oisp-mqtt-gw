/**
* Copyright (c) 2021 Intel Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


"use strict";

const request = require("request");


// @brief sends validation request to keycloak
// @param token jwt token
// @return true if token is valid, false if not, and exception if problems with service
var validateToken = function(keycloakHost, keycloakPort, realmName, token){
    const options = {
        method: 'GET',
        url: `http://${keycloakHost}:${keycloakPort}/auth/realms/${realmName}/protocol/openid-connect/userinfo`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      request(options, (error, response) => {
        if (error) throw new Error(error);
  
        if (response.statusCode !== 200) {
          return false;
        }
        return true;
    })
}

class Authenticate {

    constructor(config, logger){
        this.config = config;
        this.logger = logger; 
    }
    // expects "username" and "password" as url-parameters
    authenticate(req, res) {
        this.logger.debug("Auth request " + JSON.stringify(req.query));
        var username = req.params.username;
        var token = req.params.password;
        res.sendStatus(200);
    }
}
module.exports = Authenticate;