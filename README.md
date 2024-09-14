
# MQTT Client

A Node.js MQTT client for managing secure MQTT connections with certificate-based authentication.

## Features

- Connect to MQTT brokers securely using TLS/SSL.
- Manage certificates with a built-in certificate manager.
- Easily configure and handle MQTT connections, subscriptions, and messages.

## Installation

Install the package via npm:

```bash
npm install node-mqtt-client
```

## Libraries Used

This project makes use of the following libraries:

- **[fs](https://nodejs.org/api/fs.html):** File system module to handle reading and writing of files.
- **[mqtt](https://www.npmjs.com/package/mqtt):** MQTT.js library to handle MQTT connections and communication.
- **[node-forge](https://www.npmjs.com/package/node-forge):** Library for creating and managing X.509 certificates.

## Usage

Here's an example of how to use the MQTT client:

```javascript
const { MQTTClient } = require('node-mqtt-client');

const mqttClient = new MQTTClient();
mqttClient.host = 'broker.fabris.io';
mqttClient.port = 8883;
mqttClient.hostProtocol = MQTTClient.Protocol.MQTTS;
mqttClient.certificateManager.loadCertificates(
  'authority.pem',
  'certificate.pem',
  'key.pem'
);
mqttClient.connect();
```

### Configuration Parameters

| Parameter             | Type                     | Description                                                         | Default                  |
|-----------------------|--------------------------|---------------------------------------------------------------------|--------------------------|
| `host`                | `string`                 | The MQTT broker's host address.                                     | `'your-mqtt-broker-host'`|
| `port`                | `number`                 | The port to connect to on the MQTT broker.                          | `8883`                   |
| `hostProtocol`        | `string`                 | The protocol to use (`mqtt`, `mqtts`, `ws`, `wss`).                 | `mqtts`                  |

## Public Methods

### MQTTClient Methods

#### `connect()`

Connects to the MQTT broker using the loaded certificates.

**Returns:**  
`MQTTClient` - The instance of MQTTClient.

#### `subscribe(topic, options, callback)`

Subscribes to a topic or topics on the MQTT broker.

- `topic` (`string|string[]|Object`): The topic(s) to subscribe to. Can be a single topic, an array of topics, or an object with topics as keys and QoS levels as values.
- `options` (`Object`): Optional parameters for the subscription.
  - `qos` (`number`): QoS level for the subscription (0, 1, or 2). Default is 0.
  - `nl` (`boolean`): No Local flag for MQTT 5.0. Default is false.
  - `rap` (`boolean`): Retain as Published flag for MQTT 5.0. Default is false.
  - `rh` (`number`): Retain Handling option for MQTT 5.0. Default is 0.
  - `properties` (`Object`): MQTT 5.0 properties object.
- `callback` (`Function`): The callback function to handle the subscription response.

**Returns:**  
`MQTTClient` - The instance of MQTTClient.

#### `publish(topic, message, options, callback)`

Publishes a message to a topic on the MQTT broker.

- `topic` (`string`): The topic to publish to.
- `message` (`string|Buffer`): The message to publish.
- `options` (`Object`): Optional parameters for publishing.
  - `qos` (`number`): QoS level (0, 1, or 2). Default is 0.
  - `retain` (`boolean`): Retain flag. Default is false.
  - `dup` (`boolean`): Mark as duplicate flag. Default is false.
  - `properties` (`Object`): MQTT 5.0 properties object.
- `callback` (`Function`): Callback called when QoS handling completes or an error occurs.

**Returns:**  
`MQTTClient` - The instance of MQTTClient.

#### `onMessage(callback)`

Registers a callback for incoming messages.

- `callback` (`Function`): The callback function to handle incoming messages.

**Returns:**  
`MQTTClient` - The instance of MQTTClient.

### CertificateManager Methods

#### `loadCertificates(ca, certificate, key)`

Loads certificates from the specified paths.

- `ca` (`string`): Path to the CA certificate.
- `certificate` (`string`): Path to the client certificate.
- `key` (`string`): Path to the private key.

**Returns:**  
`CertificateManager` - The instance of CertificateManager.

#### `getCertificates()`

Returns the loaded certificates.

**Returns:**  
`{ cert: Buffer, key: Buffer, ca: Buffer }` - The loaded certificates.

## Example

#### 1. Subscribing to a Topic

Subscribe to a topic to receive messages:

```javascript
mqttClient.subscribe('your/topic', { qos: 1 }, (err, granted) => {
    if (err) console.error('Subscription error:', err);
    // Anything you want
});
```

#### 2. Publishing a Message

Publish a message to a specific topic:

```javascript
mqttClient.publish('your/topic', 'Hello MQTT!', { qos: 1, retain: true }, (err) => {
    if (err) console.error('Error publishing message:', err);
    // Anything you want
});
```

#### 3. Handling Incoming Messages

Register a callback to handle incoming messages:

```javascript
mqttClient.onMessage((topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    // Anything you want
});
```
## Versioning

We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/ubyte-source/node-mqtt-client/tags). 

## Authors

* **Paolo Fabris** - *Initial work* - [ubyte.it](https://ubyte.it/)

See also the list of [contributors](https://github.com/ubyte-source/node-mqtt-client/blob/main/CONTRIBUTORS.md) who participated in this project.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/ubyte-source/node-mqtt-client/blob/main/LICENSE) file for details.
