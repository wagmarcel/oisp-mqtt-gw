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

const express = require('express')
const app = express()
var config;

var init = function(conf) 
{
    config = conf;
    app.use(express.json())

    app.post('/hook', (req, res) => {
        console.log("Web hook request " + JSON.stringify(req.body))
        res.sendStatus(200);
    })

    app.get('/auth', (req, res) => {
        console.log("Auth request " + JSON.stringify(req.query))
        res.sendStatus(200)
    })

    app.get('/acl', (req, res) => {
        console.log("ACL request " + JSON.stringify(req.query) + "---" + JSON.stringify(req.body))
        res.sendStatus(200)
    })

    app.listen(config.authService.port, () => {
        console.log(`Auth Service  http://localhost:${config.authService.port}`)
    })
}
module.exports.init = init;