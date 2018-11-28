/*
 * Copyright (c) HiMinds.com
 *
 * Author:  Suru Dissanaike
 *
* MIT License
*
* Copyright (c) 2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

load('api_config.js');
load('api_mqtt.js');
load('api_gpio.js');
load('api_sys.js');
load('api_timer.js');
load('api_net.js');
load('api_esp32.js');

let ADC1_CHANNEL_4 = 32;
let ESP32_THING_BUTTON = 0;
let SEND_TIMER_MS = 10000;

let PCADC = {
    pc_adc_configuration: ffi('int pc_adc_configuration(void)')
};

let esp32ThingLED = Cfg.get('pins.led');

let topicEvents = '/devices/' + Cfg.get('device.id') + '/events';
let topicState = '/devices/' + Cfg.get('device.id') + '/state';
let topicConfig = '/devices/' + Cfg.get('device.id') + '/config';
let topicCommands = '/devices/' + Cfg.get('device.id') + '/commands/#';
let topicCommandHardware = '/devices/' + Cfg.get('device.id') + '/commands/hardware';

let appName = 'init.js             ';

GPIO.set_mode(esp32ThingLED, GPIO.MODE_OUTPUT);

let isConnected = false;

//Set the temperature difference between your room and ESP32
let tempOffset = 10;

if (PCADC.pc_adc_configuration() === 0) 
    print("ADC configured");

// convert Fahrenheit to Celsius
function getTemperature() {
    return ((5 / 9) * (ESP32.temp() - 32) - tempOffset);
}

function getEvent() {
    return JSON.stringify({
        free_ram: Sys.free_ram() / 1024,
        uptime: Sys.uptime() / 60,
        temp: getTemperature()
    });
};

function getState() {
    return JSON.stringify({
        hardware: "ESP32 Thing",
        revision: "A1",
        firmware: "0.1b",
        total_ram: Sys.total_ram() / 1024
    });
};

function publishEvent() {
    let eventData = getEvent();
    if (MQTT.pub(topicEvents, eventData)) {
        print(appName, "Published Event: " + eventData);
    } else {
        print(appName, 'Not connected');
    }
}

function publishState() {
    if (MQTT.pub(topicState, getState())) {
        print(appName, 'Published State');
    } else {
        print(appName, 'Not connected');
    }
}

MQTT
    .sub(topicConfig, function (conn, topic, msg) {
        print('Topic:', topic, 'message:', msg);
        let obj = JSON.parse(msg) || {
            esp32ThingLED: 0
        };
        GPIO.write(esp32ThingLED, obj.led);
        tempOffset = obj.tempOffset;
    }, null);

MQTT.sub(topicCommands, function (conn, topic, msg) {
    print('Topic:', topic, 'message:', msg);

    let obj = JSON.parse(msg);
    if (topic === topicCommandHardware) 
        GPIO.write(esp32ThingLED, obj.led);

    }
, null);

//Timer for publishing events
Timer.set(SEND_TIMER_MS, true, function () {
    if (isConnected) {
        publishEvent();
    } else {
        print(appName, 'Info:', getEvent());
    }
}, null);

// Toogle LED
GPIO.set_button_handler(ESP32_THING_BUTTON, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 20, function () {
    let state = GPIO.toggle(esp32ThingLED);
    print("Toggled LED, state is: ", state
        ? 'on'
        : 'off');
}, null);

//Handler for MQTT events
MQTT.setEventHandler(function (conn, ev, data) {
    if (ev !== 0) {
        let evs = '?';
        if (ev === MQTT.EV_CONNACK) {
            evs = 'CONNACK'; // Connection to broker has been established
        } else if (ev === MQTT.EV_PUBLISH) {
            evs = 'PUBLISH'; // msg published to topics we are subscribed to
        } else if (ev === MQTT.EV_PUBACK) {
            evs = 'PUBACK'; // ACK for publishing of a message with QoS&amp;gt;0
        } else if (ev === MQTT.EV_SUBACK) {
            evs = 'SUBACK'; // ACK for a subscribe request
        } else if (ev === MQTT.EV_UNSUBACK) {
            evs = 'UNSUBACK'; // ACK for an unsubscribe request
        } else if (ev === MQTT.EV_CLOSE) {
            evs = 'CLOSE'; // connection to broker was closed
        }
        print(appName, 'MQTT event:', evs, ev);
        if (ev === MQTT.EV_CONNACK) {
            print(appName, 'MQTT CONNACK &amp;gt; PUBLISHING');
            isConnected = true;
            publishEvent();
            publishState();
        }
    }
}, null);

// Monitor network connectivity.
Net.setStatusEventHandler(function (ev, arg) {
    let evs = '???';
    if (ev === Net.STATUS_DISCONNECTED) {
        evs = 'DISCONNECTED';
    } else if (ev === Net.STATUS_CONNECTING) {
        evs = 'CONNECTING';
    } else if (ev === Net.STATUS_CONNECTED) {
        evs = 'CONNECTED';
    } else if (ev === Net.STATUS_GOT_IP) {
        evs = 'GOT_IP';
    }
    print('== Net event:', ev, evs);
}, null);
