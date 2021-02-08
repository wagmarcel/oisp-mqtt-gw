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
    rewire = require('rewire');
var fileToTest = "../../api/data.ingestion.js";

describe(fileToTest, function() {

    process.env.OISP_KEYCLOAK_CONFIG = '{\
        "listenerPort": 4080, \
        "auth-server-url": "keycloak" \
    }'
    process.env.OISP_KAFKA_CONFIG = '{\
        "uri": "uri", \
        "partitions": 1, \
        "metricsPartitions": 1, \
        "replication": 1, \
        "timeoutMs": 10000, \
        "topicsObservations": "metricsTopic", \
        "topicsRuleEngine": "rules-update", \
        "topicsHeartbeatName": "heartbeat", \
        "topicsHeartbeatInterval": 5000, \
        "maxPayloadSize": 1234456, \
        "retries": 10, \
        "requestTimeout": 4, \
        "maxRetryTime": 10 \
    }'
    process.env.OISP_MQTT_GATEWAY_CONFIG = '{ \
        "mqttBrokerUrl": "brokerUrl", \
        "mqttBrokerLocalPort": "1234", \
        "mqttBrokerUsername": "brokerUsername", \
        "mqttBrokerPassword": "brokerPassword", \
        "authServicePort": "2345", \
        "redisConf": "@@OISP_REDIS_CONFIG", \
        "kafkaConfig": "@@OISP_KAFKA_CONFIG", \
        "postgresConfig": "@@OISP_POSTGRES_CONFIG", \
        "keycloakConfig": "@@OISP_KEYCLOAK_CONFIG", \
        "aesKey": "/app/keys/mqtt/mqtt_gw_secret.key" \
    }';

    process.env.OISP_REDIS_CONFIG = '{\
        "hostname": "redis",\
        "port": "6379",\
        "password": "password" \
    }'

    process.env.OISP_POSTGRES_CONFIG = '{\
        "dbname": "oisp",\
        "hostname": "postgres-ro",\
        "writeHostname": "postgres",\
        "port": "5432",\
        "su_username": "su_username",\
        "su_password": "su_password",\
        "username": "username",\
        "password": "password"\
    }'

    var config = {
        "mqttBrokerUrl": "brokerUrl",
        "mqttBrokerLocalPort": "1234",
        "mqttBrokerUsername": "brokerUsername",
        "mqttBrokerPassword": "brokerPassword",
        "authServicePort": "2345",
        "topics": {
            "subscribe": "topic/subscribe"
        },
        "cache": {
            "hostname": "redis",
            "port": "6379",
            "password": "password" 
        },
        "kafka": {
            "host": "uri",
            "partitions": 1,
            "metricsPartitions": 1,
            "replication": 1,
            "timeoutMs": 10000,
            "metricsTopic": "metricsTopic",
            "topicsRuleEngine": "rules-update",
            "topicsHeartbeatName": "heartbeat",
            "topicsHeartbeatInterval": 5000,
            "maxPayloadSize": 1234456,
            "retries": 10,
            "requestTimeout": 4,
            "maxRetryTime": 10
        },
        "postgres": {
            "dbname": "oisp",
            "hostname": "postgres-ro",
            "writeHostname": "postgres",
            "port": "5432",
            "su_username": "su_username",
            "su_password": "su_password",
            "username": "username",
            "password": "password"
        },
        "aesKey": "/app/keys/mqtt/mqtt_gw_secret.key"
    }
    var toTest = rewire(fileToTest);

    var Kafka = function(loglevel, brokers, clientId, requestTimeout, retry) {
        return {
            producer: function(partitioner){
                return {
                    connect: function() {
                    },
                    on: function() {
                    },
                    send: function(payload) {
                        done()
                    },
                    events: "event"
                }
            }
        }

    }
    
    var redis = {
        createClient: function(port, host) {
            return {
                on: function(event, callback) {

                }
            }
        }
        
    }

    var Sequelize = function(){
        return {
        }
    }
    var logger = {
        error: function(){

        },
        debug: function() {

        },
        info: function() {

        }
    } 

    var getDidAndDataType = function() {
        return {
            id: "id",
            dataType: "dataType"
        }
    }
    var cid = "dfcd5482-6fb5-4341-a887-b8041fe83dc2";
    it('Shall initialize data ingestion modules Kafka, Redis and Postgres', function (done) {
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);
        var dataIngestion = new toTest(logger);
        done();
    });
    it('Shall get did and datatype from redis', function (done) {
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);

        var sequelize = {
            query: function() {
                console.log("query");
            }
        }
        toTest.__set__("sequelize", sequelize);
        var payload = {
            componentId: "dfcd5482-6fb5-4341-a887-b8041fe83dc2"
        }
        var redisClient = {
            hgetall: function(cid, cb) {
                cb(null, {
                    id: "id",
                    dataType: "dataType"
                });
            },
            hmset: function(key, idKey, idValue, dataTypeKey, dataTypeValue) {
                assert.equal(key, payload.componentId, "wrong key");
                assert.equal(idValue, "id", "wrong id value");
                assert.equal(idKey, "id", "wrong id key");
                assert.equal(dataTypeValue, "dataType", "wrong datatype value");
                assert.equal(dataTypeKey, "dataType", "wrong datatype key");
                return 1;
            }
        }
        toTest.__set__("redisClient", redisClient)
    
        var getDidAndDataType = toTest.__get__("getDidAndDataType");
        
        //var dataIngestion = new toTest(logger);

        getDidAndDataType(payload)
        .then((result) => {
            assert.equal(result.id, "id", "wrong id");
            assert.equal(result.dataType, "dataType", "wrong dataType");
            done();
        })
        .catch(err => done(err))
    });
    it('Shall get did and datatype from postgres', function (done) {
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);

        var sequelize = {
            query: function() {
                return [{
                    id: "id",
                    dataType: "dataType"
                }]
            }
        }
        toTest.__set__("sequelize", sequelize);
        var payload = {
            componentId: cid
        }
        var redisClient = {
            hgetall: function(cid, cb) {
                cb(null, null);
            },
            hmset: function(key, idKey, idValue, dataTypeKey, dataTypeValue) {
                assert.equal(key, payload.componentId, "wrong key");
                assert.equal(idValue, "id", "wrong id value");
                assert.equal(idKey, "id", "wrong id key");
                assert.equal(dataTypeValue, "dataType", "wrong datatype value");
                assert.equal(dataTypeKey, "dataType", "wrong datatype key");
                return 1;
            }
        }
        toTest.__set__("redisClient", redisClient)
    
        var getDidAndDataType = toTest.__get__("getDidAndDataType");
        
        getDidAndDataType(payload)
        .then((result) => {
            assert.equal(result.id, "id", "wrong id");
            assert.equal(result.dataType, "dataType", "wrong dataType");
            done();
        })
        .catch(err => done(err))
    });
    it('Ingest data to Kafka', function (done) {
        var Kafka = function(loglevel, brokers, clientId, requestTimeout, retry) {
            return {
                producer: function(partitioner){
                    return {
                        connect: function() {
                        },
                        on: function() {
                        },
                        send: function(payload) {
                            message = payload.messages[0];
                            assert.equal(message.key, "accountId." + cid, "Received Kafka payload key not correct");
                            var value = {
                                dataType: "String",
                                aid: "accountId",
                                cid:"dfcd5482-6fb5-4341-a887-b8041fe83dc2",
                                value:"value",
                                systemOn:1,
                                on:1,
                                loc:null
                            }
                            assert.deepEqual(JSON.parse(message.value), value, "Received Kafke message not correct")

                            done()
                            return null;
                        },
                        events: "event"
                    }
                }
            }
    
        }
        var prepareKafkaPayload = function(didAndDataType, accountId){
            return {"dataType":"String", "aid":"accountId", "cid":cid, "value":"value", "systemOn": 1, "on": 1, "loc": null}
        }
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);
        toTest.__set__("getDidAndDataType", getDidAndDataType)
        var dataIngestion = new toTest(logger);
        dataIngestion.prepareKafkaPayload = prepareKafkaPayload;
        var message = {
            accountId: "accountId",
            on: 1,
            data: [
                {
                    "componentId": cid,
                    "on": 1,
                    "value": "value"
                }
            ]
        };
    
        dataIngestion.processDataIngestion("server/metric/accountId/device", message)
        //done();
    });
    it('Validate data types', function (done) {
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);
        toTest.__set__("getDidAndDataType", getDidAndDataType)

        var validate = toTest.__get__("validate");
        assert.isTrue(validate("string", "String"), "Error in Validation");
        assert.isTrue(validate("1.23", "Number"), "Error in Validation");
        assert.isTrue(validate("1", "Boolean"), "Error in Validation");
        done();
    });
    it('Normalize Boolean', function (done) {
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);
        toTest.__set__("getDidAndDataType", getDidAndDataType)

        var normalizeBoolean = toTest.__get__("normalizeBoolean");
        assert.equal(normalizeBoolean("true", "Boolean"), 1, "Error in Validation");
        assert.equal(normalizeBoolean("0", "Boolean"), 0, "Error in Validation");
        assert.equal(normalizeBoolean("fAlse", "Boolean"), 0, "Error in Validation");
        assert.equal(normalizeBoolean(true, "Boolean"), 1, "Error in Validation");
        assert.equal(normalizeBoolean(1, "Boolean"), 1, "Error in Validation");
        assert.equal(normalizeBoolean("falsetrue", "Boolean"), "NaB", "Error in Validation");
        assert.equal(normalizeBoolean(2, "Boolean"), "NaB", "Error in Validation");
        done();
    });
    it('Shall prepare Kafka payload', function (done) {
        toTest.__set__("Kafka", Kafka);
        toTest.__set__("redis", redis);
        toTest.__set__("config", config);
        toTest.__set__("getDidAndDataType", getDidAndDataType)
        var dataIngestion = new toTest(logger);
        var didAndDataType = {
            dataType: "String",
            on: 1,
            dataElement:
                {
                    "componentId": cid,
                    "on": 1,
                    "value": "value",
                    "systemOn": 2
                }
        };
    
        var msg = dataIngestion.prepareKafkaPayload(didAndDataType, "accountId");
        var expectedMsg = {
            dataType: "String",
            aid: "accountId",
            value: "value",
            cid: cid,
            on: 1,
            systemOn: 2
        }
        assert.deepEqual(msg, expectedMsg, "Wrong kafka payload");
        done();
    });
});
