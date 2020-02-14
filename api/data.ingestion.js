/**
* Copyright (c) 2017, 2020 Intel Corporation
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
const fs = require('fs');
var devices = require('../api/iot.devices');
var config = require("../config");
var util = require("../lib/common").time;
var topics_subscribe = config.topics.subscribe;
var kafka = require('kafka-node');
const client = new kafka.KafkaClient({kafkaHost: config.kafka.host});
var producer = new kafka.Producer(client);
var dataSchema = require("../lib/schemas/data.json");
var Validator = require('jsonschema').Validator;
var validator = new Validator();
var uuidValidate = require('uuid-validate');
const redis = require("redis");
var redisClient = redis.createClient({port: config.cache.port, host: config.cache.host});
const { Sequelize } = require('sequelize');
const { QueryTypes } = require('sequelize');
const sequelize = new Sequelize(config.postgres.dbname, config.postgres.username, config.postgres.password, {
  host: config.postgres.host,
  port: config.postgres.port,
  dialect: 'postgres'
});



module.exports = function(logger) {
    var me = this;
    me.logger = logger;
    /**
     * @descritpion xxxxxxx
     * @param topic: it is the MQTT topic subscribe, the topic has device id in between
     * @param message: the message contain the code require to ask for authorization token.
    */
    me.token = null;
    var getDidAndDataType = function(item) {
        var cid = item.componentId;
        return new Promise((resolve, reject) => {
            //check whether cid = uuid
            if (!uuidValidate(cid)) {
                reject("cid not UUID. Rejected!");
            }
            redisClient.hgetall(cid, function(err, value) {
                if (err) {
                    throw err;
                } else {
                  resolve(value)
                }
            })
        })
        .then( (value) => {
              if (value === null || (Array.isArray(value) && value.length == 1 && value[0] == null)) {
                  // no cached value found => make db lookup and store in cache
                  var sqlquery='SELECT devices.id,"dataType" FROM dashboard.device_components,dashboard.devices,dashboard.component_types WHERE "componentId"::text=\'' + cid + '\' and "deviceUID"::text=devices.uid::text and device_components."componentTypeId"::text=component_types.id::text'
                   return sequelize.query(sqlquery, { type: QueryTypes.SELECT })
              } else {
                  return [value];
              }
          })
          .then((didAndDataType) => new Promise((resolve, reject) => {
              if (didAndDataType == undefined || didAndDataType == null) {
                  reject("DB lookup failed!");
                  return;
              }
              var redisResult = redisClient.hmset(cid, "id", didAndDataType[0].id, "dataType", didAndDataType[0].dataType);
              didAndDataType[0].dataElement = item;
              if (redisResult) {
                  resolve(didAndDataType[0]);
              } else {
                  me.logger.warn("Could not store db value in redis. This will significantly reduce performance");
                  resolve(didAndDataType[0])
              }
          }))
          .catch(err => reject(err));
    }

    producer.on('error', function (err) {
      me.logger.info("Error in Kafka connection: " + err)
    })
    redisClient.on("error", function(err) {
      me.logger.info("Error in Redis client: " + err);
    });

    try {
      sequelize.authenticate();
      console.log('DB connection has been established.');
    } catch (error) {
      console.error('Unable to connect to DB:', error);
    }

    me.getToken = function (did) {
        return new Promise(function(resolve, reject) {
          resolve(null);
        })
    };
    me.processDataIngestion = function (topic, message) {
        /*
            It will be checked if the ttl exist, if it exits the package need to be discarded
        */
        me.logger.debug(
          "Data Submission Detected : " + topic + " Message " + JSON.stringify(message)
        );

        //legacy mqtt format is putting actual message in body.
        //Future formats will directly send valid data.
        var bodyMessage;
        if (message.body === undefined) {
            bodyMessage = message;
        } else {
            bodyMessage = message.body;
        }

        if (!validator.validate(bodyMessage, dataSchema["POST"])) {
            me.logger.info("Schema rejected message! Message will be discarded: " + bodyMessage);
        } else {
          //Check: Does accountid fit to topic?
            var match = topic.match(/server\/metric\/([^\/]*)\/(.*)/);
            var accountId = match[1];
            var deviceId =  match[0];

            if (accountId !== match[1]) {
                me.logger.info("AccountId in message does not fit to topic! Message will be discarded: " + bodyMessage);
                return;
            }

            // Go through data and check whether cid is correct
            // Also retrieve dataType
            var promarray = [];
            bodyMessage.data.forEach(item => {
                var value = getDidAndDataType(item)
                promarray.push(value);
              }
            );
            Promise.all(promarray)
            .then(values => {
                var promarray = [];
                values.forEach(item => {
                    promarray.push(new Promise((resolve, reject) => {
                        var kafkaMessage = me.prepareKafkaPayload(item, accountId);
                          var payloads = [
                              {topic: config.kafka.metricsTopic, messages: JSON.stringify(kafkaMessage)}
                          ]
                          producer.send(payloads, function (err, data) {
                              if (err) {
                                  throw err;
                              }
                          });
                    }))
                });
                return Promise.all(promarray);
            })
            .catch(function(err) {
              me.logger.warn("Could not send data to Kafka");
            });
        };
    }
    me.connectTopics = function() {
        me.broker.bind(topics_subscribe.data_ingestion, me.processDataIngestion);
        return true;
    };
    me.handshake = function () {
        if (me.broker) {
            me.broker.on('reconnect', function(){
                me.logger.debug('Reconnect topics' );
                me.broker.unbind(topics_subscribe.data_ingestion, function () {
                    me.token = null;
                    me.connectTopics();
                    me.sessionObject = {};
                });
            });
        }
    };
    /**
    * @description It's bind to the MQTT topics
    * @param broker
    */
    me.bind = function (broker) {
        me.broker = broker;
        me.handshake();
        me.connectTopics();

    };

    /**
     * Prepare datapoint from frontend data structure to Kafka like the following example:
     * {"dataType":"Number", "aid":"account_id", "cid":"component_id", "value":"1",
     * "systemOn": 1574262569420, "on": 1574262569420, "loc": null}
     */
    me.prepareKafkaPayload = function(didAndDataType, accountId){
        var dataElement = didAndDataType.dataElement;

        const msg = {
            dataType: didAndDataType.dataType,
            aid: accountId,
            cid: dataElement.componentId,
            on: dataElement.on,
            value: dataElement.value.toString()
        };
        if (dataElement.systemOn !== undefined) {
            msg.systemOn = dataElement.systemOn;
        } else {
            msg.systemOn = dataElement.on;
        }

        if (undefined !== dataElement.attributes) {
            msg.attributes = dataElement.attributes;
        }
        if (undefined !== dataElement.loc) {
            msg.loc = dataElement.loc;
        }

        return msg;
    };
}
