'use strict';

const fs = require('fs');
const mqtt = require('mqtt');
const forge = require('node-forge');

/**
 * CertificateManager class to handle certificates for MQTT connections.
 */
class CertificateManager {
    /**
     * @private
     * @type {MQTTClient}
     */
    #MQTTClient;

    /**
     * @private
     * @type {string}
     */
    #commonName;

    /**
     * @private
     * @type {{ cert: Buffer | null, key: Buffer | null, ca: Buffer | null }}
     */
    #certificates;

    /**
     * Creates an instance of CertificateManager.
     * @param {MQTTClient} MQTTClient - An instance of the MQTT client.
     */
    constructor(MQTTClient) {
        this.#MQTTClient = MQTTClient;
        this.#commonName = '';
        this.#certificates = {
            cert: null,
            key: null,
            ca: null
        };
    }

    /**
     * Gets the MQTT client.
     * @returns {MQTTClient} The MQTT client.
     */
    get MQTTClient() {
        return this.#MQTTClient;
    }

    /**
     * Gets the common name from the certificate.
     * @returns {string} The common name of the certificate.
     */
    get commonName() {
        return this.#commonName;
    }

    /**
     * Loads certificates from the specified paths.
     * @param {string} ca - Path to the CA certificate.
     * @param {string} certificate - Path to the client certificate.
     * @param {string} key - Path to the private key.
     * @returns {CertificateManager} The instance of CertificateManager.
     * @throws {Error} If one or more certificate paths are invalid.
     */
    loadCertificates(ca, certificate, key) {
        try {
            if (false === fs.existsSync(ca) || false === fs.existsSync(certificate) || false === fs.existsSync(key))
				throw new Error('One or more certificate paths are invalid.');

            this.#certificates.ca = fs.readFileSync(ca);
            this.#certificates.cert = fs.readFileSync(certificate);
            this.#certificates.key = fs.readFileSync(key);
        } catch (error) {
            throw new Error('Unable to load certificates. Please check the provided paths.');
        }

        this.#extractCommonName();
        return this;
    }

    /**
     * Returns the loaded certificates.
     * @returns {{ cert: Buffer, key: Buffer, ca: Buffer }} The loaded certificates.
     * @throws {Error} If the certificates are not loaded.
     */
    getCertificates() {
        if (null === this.#certificates.ca || null === this.#certificates.cert || null === this.#certificates.key)
			throw new Error('Certificates are not loaded. Please load the certificates first.');

        return this.#certificates;
    }

    /**
     * Extracts the common name from the certificate.
     * @private
     * @throws {Error} If the certificate is not loaded or unable to extract CN.
     */
    #extractCommonName() {
        if (false === !!this.#certificates.cert)
            throw new Error('Certificate is not loaded. Please load the certificate first.');

        try {
            const cert = forge.pki.certificateFromPem(this.#certificates.cert.toString());
            const subject = cert.subject.attributes.find(attr => attr.name === 'commonName');
            this.#commonName = subject
				? subject.value
				: '';
        } catch (error) {
            throw new Error('Unable to extract CN from certificate.');
        }
    }
}

/**
 * MQTTClient class to handle MQTT connection and communication.
 */
class MQTTClient {
    /**
     * Protocol types for MQTT connections.
     * @enum {string}
     */
    static Protocol = {
        WS: 'ws',
        WSS: 'wss',
        MQTT: 'mqtt',
        MQTTS: 'mqtts'
    };

    /**
     * @private
     * @type {string}
     */
    #host;

    /**
     * @private
     * @type {string}
     */
    #hostProtocol;

    /**
     * @private
     * @type {number}
     */
    #port;

    /**
     * @private
     * @type {Object}
     */
    #client;

    /**
     * @private
     * @type {CertificateManager}
     */
    #certificateManager;

    /**
     * Creates an instance of MQTTClient.
     */
    constructor() {
        this.#host = 'your-mqtt-broker-host';
        this.#port = 8883;
        this.#client = null;
        this.#hostProtocol = MQTTClient.Protocol.MQTTS;
        this.#certificateManager = new CertificateManager(this);
    }

    /**
     * Gets the MQTT host.
     * @returns {string} The MQTT host.
     */
    get host() {
        return this.#host;
    }

    /**
     * Sets the MQTT host.
     * @param {string} value - The MQTT host.
     */
    set host(value) {
        this.#host = value;
    }

    /**
     * Gets the MQTT port.
     * @returns {number} The MQTT port.
     */
    get port() {
        return this.#port;
    }

    /**
     * Sets the MQTT port.
     * @param {number} value - The MQTT port.
     * @throws {Error} If the port is not a positive number.
     */
    set port(value) {
        if (typeof value !== 'number'
			|| value <= 0) throw new Error('Invalid port. It must be a positive number.');

        this.#port = value;
    }

    /**
     * Gets the MQTT protocol.
     * @returns {string} The MQTT protocol.
     */
    get hostProtocol() {
        return this.#hostProtocol;
    }

    /**
     * Sets the MQTT protocol.
     * @param {string} value - The MQTT protocol.
     * @throws {Error} If the protocol is not valid.
     */
    set hostProtocol(value) {
        if (false === Object.values(MQTTClient.Protocol).includes(value)) {
            const divider = String.fromCharCode(44, 32);
			const protocolsPermitted = Object.values(MQTTClient.Protocol).join(divider);
            throw new Error(`Invalid hostProtocol. Must be one of the following: ${protocolsPermitted}`);
        }

        this.#hostProtocol = value;
    }

    /**
     * Gets the MQTT client instance.
     * @returns {Object} The MQTT client instance.
     */
    get client() {
        return this.#client;
    }

    /**
     * Gets the CertificateManager instance.
     * @returns {CertificateManager} The CertificateManager instance.
     */
    get certificateManager() {
        return this.#certificateManager;
    }

    /**
     * Connects to the MQTT broker using the loaded certificates.
     * @returns {MQTTClient} The instance of MQTTClient.
     */
    connect() {
        const certificates = this.#certificateManager.getCertificates();
        const options = {
            ca: certificates.ca,
            key: certificates.key,
            host: this.#host,
            port: this.#port,
            cert: certificates.cert,
            protocol: this.#hostProtocol,
            reconnectPeriod: 2 * 1e3,
            connectTimeout: 20 * 1e3,
            resubscribe: true
        };

        this.#client = mqtt.connect(options);
        this.#client.on('error', (err) => this.#handleError(err));
        this.#client.on('connect', () => {
            console.log('Connected to MQTT broker');
        });
        this.#client.on('reconnect', () => {
            console.log('Attempting to reconnect to MQTT broker...');
        });
        this.#client.on('close', () => {
            console.log('MQTT connection closed.');
        });
        return this;
    }

    /**
     * Subscribes to a topic or topics on the MQTT broker.
     * @param {string|string[]|Object} topic - The topic(s) to subscribe to. Can be a single topic (string), an array of topics (string[]), or an object with topics as keys and QoS levels as values (e.g., {'topic1': {qos: 0}, 'topic2': {qos: 1}}).
     * @param {Object} [options] - Optional parameters for the subscription.
     * @param {number} [options.qos=0] - QoS level for the subscription (0, 1, or 2).
     * @param {boolean} [options.nl=false] - No Local flag for MQTT 5.0 (prevents messages sent by this client from being received by this client).
     * @param {boolean} [options.rap=false] - Retain as Published flag for MQTT 5.0 (retains the original retain flag of the published message).
     * @param {number} [options.rh=0] - Retain Handling option for MQTT 5.0 (whether retained messages are sent on subscription establishment).
     * @param {Object} [options.properties] - MQTT 5.0 properties object.
     * @param {number} [options.properties.subscriptionIdentifier] - Identifier of the subscription.
     * @param {Object} [options.properties.userProperties] - User properties object, representing multiple name-value pairs.
     * @param {Function} callback - The callback function to handle the subscription response. Called with (err, granted) parameters.
     * @returns {MQTTClient} The instance of MQTTClient.
     */
    subscribe(topic, options = {}, callback) {
        const fullTopic = this.#generateFullTopic(topic);
        this.#client.subscribe(fullTopic, options, (err, granted) => {
            callback(err, granted, fullTopic);
        });
        return this;
    }

    /**
     * Publishes a message to a topic on the MQTT broker.
     * @param {string} topic - The topic to publish to.
     * @param {string|Buffer} message - The message to publish.
     * @param {Object} [options] - Optional parameters for publishing.
     * @param {number} [options.qos=0] - QoS level (0, 1, or 2).
     * @param {boolean} [options.retain=false] - Retain flag.
     * @param {boolean} [options.dup=false] - Mark as duplicate flag.
     * @param {Object} [options.properties] - MQTT 5.0 properties object.
     * @param {boolean} [options.properties.payloadFormatIndicator] - Payload is UTF-8 Encoded Character Data or not.
     * @param {number} [options.properties.messageExpiryInterval] - Lifetime of the Application Message in seconds.
     * @param {number} [options.properties.topicAlias] - Alias to identify the topic instead of using the Topic Name.
     * @param {string} [options.properties.responseTopic] - Topic name for a response message.
     * @param {Buffer} [options.properties.correlationData] - Correlation data for identifying request-response messages.
     * @param {Object} [options.properties.userProperties] - User properties object, representing multiple name-value pairs.
     * @param {number} [options.properties.subscriptionIdentifier] - Identifier of the subscription.
     * @param {string} [options.properties.contentType] - Content type description of the Application Message.
     * @param {function} [options.cbStorePut] - Callback when the message is put into the outgoing store if QoS is 1 or 2.
     * @param {function} [callback] - Function called when QoS handling completes or an error occurs.
     * @returns {MQTTClient} The instance of MQTTClient.
     */
    publish(topic, message, options = {}, callback) {
        const fullTopic = this.#generateFullTopic(topic);
        this.#client.publish(fullTopic, message, options, (err) => {
            if (err) this.#handleError(`Error publishing to topic ${fullTopic}: ${err}`);
            if (callback) callback(err);
        });
        return this;
    }

    /**
     * Registers a callback for incoming messages.
     * @param {Function} callback - The callback function to handle incoming messages.
     * @returns {MQTTClient} The instance of MQTTClient.
     */
    onMessage(callback) {
        this.#client.on('message', callback);
        return this;
    }

    /**
     * Handles MQTT errors.
     * @private
     * @param {Error} err - The error object.
     */
    #handleError(err) {
        console.error('MQTT error:', err);
    }

    /**
     * Generates a full topic string using the common name.
     * @private
     * @param {string} topic - The base topic.
     * @returns {string} The full topic with the common name prefix.
     */
    #generateFullTopic(topic) {
        return `${this.#certificateManager.commonName}/${topic}`;
    }
}

module.exports = {
    MQTTClient
};