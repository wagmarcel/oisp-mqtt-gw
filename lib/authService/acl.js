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


class Acl {
    constructor(config, logger){
        this.config = config;
        this.logger = logger; 
    }
    acl(req, res) {
        this.logger.debug("ACL request " + JSON.stringify(req.query) + "---" + JSON.stringify(req.body));
        res.sendStatus(200);
    }
}

module.exports = Acl;