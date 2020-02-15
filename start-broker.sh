#!/bin/bash

# Copyright (c) 2019 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


ROOTPATH=/app/mosquitto
echo ""
echo "============================================"
echo " start MQTT broker with OISP auth module "
echo "============================================"

cp ${ROOTPATH}/mosquitto.conf ${ROOTPATH}/mosquitto-oisp.conf
PORT=$(echo ${OISP_MQTT_BROKER_CONFIG} | jq   '.mqttBrokerPort' | tr -d '"')
CAFILE=$(echo ${OISP_MQTT_BROKER_CONFIG} | jq   '.cafile' | tr -d '"')
KEYFILE=$(echo ${OISP_MQTT_BROKER_CONFIG} | jq   '.keyfile' | tr -d '"')
CERTFILE=$(echo ${OISP_MQTT_BROKER_CONFIG} | jq   '.certfile' | tr -d '"')
PRODUCTION=false
echo "PORT $PORT CAFILE $CAFILE KEYFILE $KEYFILE CERTFILE $CERTFILE PRODUCTION $PRODUCTION"
echo "auth_plugin ${ROOTPATH}/mosquitto_jwt_auth/jwt_auth_plugin.so" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "auth_opt_path ${ROOTPATH}/mosquitto_jwt_auth" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "port $PORT" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "cafile $CAFILE" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "keyfile $KEYFILE" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "certfile $CERTFILE" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "tls_version tlsv1.2" >> ${ROOTPATH}/mosquitto-oisp.conf

echo "require_certificate $PRODUCTION" >> ${ROOTPATH}/mosquitto-oisp.conf

${ROOTPATH}/src/mosquitto -c ${ROOTPATH}/mosquitto-oisp.conf
