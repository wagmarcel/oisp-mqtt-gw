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


var assert =  require('chai').assert,
    sinon = require('sinon'),
    rewire = require('rewire');


var fileToTest = "../../lib/authService/authenticate.js";

describe(fileToTest, function(){
    var toTest = rewire(fileToTest);
    it('Shall check url parameters to check username/password', function(done){
        var config = {};
        var logger = {
            debug: function() {

            }
        };
        authenticate = new toTest(config, logger);
        var req = {
            params: {
                username: "username",
                password: "password"
            }
        };
        var res = {
            sendStatus: function(status) {
                assert.equal(status, 200, "Wrong status");
                done()
            }
        };
        authenticate.authenticate(req, res);
    });
});