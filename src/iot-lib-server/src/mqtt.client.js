/**
 *  MQTT Client Library
 */
import net from "net";
import crypto from "crypto";
import { IOReceptor, IOSecure, IOServer, IOStream, IOTxBuffer } from "./io.stream.js";
import { TLS } from "./tls.module.js";
import { CRC16, Fn, RawBuffer } from "./utilities.js";
import { IOREASON, PACK_TYPE, MQTT_PACK_KEYS, MQTT_V5_CODE, MQTT_V5_KEYS } from "./constants.js";

/** **AES Algorithme to use**.
 * @type {String}               */
const TLS_AES_CIPHER = "aes-256-cbc";
/** **Fixed Packet Size in bytes**.
 * 
 * Maximum packet size for each transmission.
 * @type {Number}               */
const PACKET_SIZE = 4096;

/** MQTT V5 Properties          */
class MQTTV5 {
    constructor() {
        this.assigned_client_identifier = null;
        this.authentication_data = null;
        this.authentication_method = null;
        this.content_type = null;
        this.correlation_data = null;
        this.maximum_packet_size = null;
        this.maximum_qos = null;
        this.message_expiry_interval = null;
        this.payload_format_indicator = null;
        this.reason_string = null;
        this.receive_maximum = null;
        this.request_problem_information = null;
        this.request_response_information = null;
        this.response_information = null;
        this.response_topic = null;
        this.retain_available = null;
        this.server_keep_alive = null;
        this.server_reference = null;
        this.session_expiry_interval = null;
        this.shared_subscription_available = null;
        this.subscription_identifier = null;
        this.subscription_identifiers_available = null;
        this.topic_alias = null;
        this.topic_alias_maximum = null;
        this.user_property = null;
        this.wildcard_subscription_available = null;
        this.will_delay_interval = null;
    }
    /** Decode V5 from specified array.
     * 
     * @param {Array<Number>} bff   */
    decode(bff) {
        let v5 = this;
        let raw = new RawBuffer(bff);
        while (raw.available > 0) {
            let cde = raw.get08();
            let key = MQTT_V5_CODE[cde];
            if (key) {
                switch (key) {
                    case 'payload_format_indicator':
                    case 'request_response_information':
                    case 'request_problem_information':
                    case 'maximum_qos':
                    case 'retain_available':
                    case 'wildcard_subscription_available':
                    case 'subscription_identifier_available':
                    case 'shared_subscription_available':
                        v5[key] = raw.get08();
                        break;

                    case 'server_keep_alive':
                    case 'receive_maximum':
                    case 'topic_alias_maximum':
                    case 'topic_alias':
                        v5[key] = raw.get16();
                        break;

                    case 'message_expiry_interval':
                    case 'session_expiry_interval':
                    case 'will_delay_interval':
                    case 'maximum_packet_size':
                        v5[key] = raw.get32();
                        break;

                    case 'correlation_data':
                    case 'authentication_data':
                        v5[key] = raw.getData();
                        break;

                    case 'subscription_identifier':
                        v5[key] = raw.getSize();
                        break;

                    case 'content_type':
                    case 'response_topic':
                    case 'assignned_client_identifier':
                    case 'authentication_method':
                    case 'response_information':
                    case 'server_reference':
                    case 'reason_string':
                    case 'user_property':
                        v5[key] = raw.getString();
                        break;

                    default: return v5;
                }
            } else break;
        }
        return v5;
    }
    /**
     * @returns {Array<Number>}         */
    encode() {
        let v5 = this;
        let raw = new RawBuffer();
        Object.keys(v5).map((key) => {
            let cde = Fn.asNumber(MQTT_V5_KEYS[key]);
            let val = v5[key];
            if (typeof val !== "function" && cde > 0) {
                switch (key) {
                    case 'payload_format_indicator':
                    case 'request_response_information':
                    case 'request_problem_information':
                    case 'maximum_qos':
                    case 'retain_available':
                    case 'wildcard_subscription_available':
                    case 'subscription_identifier_available':
                    case 'shared_subscription_available':
                        val = Fn.asNumber(val);
                        raw.put08(cde);
                        raw.put08(val);
                        break;

                    case 'server_keep_alive':
                    case 'receive_maximum':
                    case 'topic_alias_maximum':
                    case 'topic_alias':
                        val = Fn.asNumber(val);
                        raw.put08(cde);
                        raw.put16(val);
                        break;

                    case 'message_expiry_interval':
                    case 'session_expiry_interval':
                    case 'will_delay_interval':
                    case 'maximum_packet_size':
                        val = Fn.asNumber(val);
                        raw.put08(cde);
                        raw.put32(val);
                        break;

                    case 'correlation_data':
                    case 'authentication_data':
                        val = Fn.asBytes(val);
                        raw.put08(cde);
                        raw.putData(val);
                        break;

                    case 'subscription_identifier':
                        val = Fn.asNumber(val);
                        raw.put08(cde);
                        raw.putSize(val);
                        break;

                    case 'content_type':
                    case 'response_topic':
                    case 'assignned_client_identifier':
                    case 'authentication_method':
                    case 'response_information':
                    case 'server_reference':
                    case 'reason_string':
                    case 'user_property':
                        val = Fn.asString(val);
                        raw.put08(cde);
                        raw.putString(val);
                        break;
                }
            }
        });
        return raw;
    }
    /** Gets the Object as Map
     * @returns {Record}        */
    getMap() {
        let v5 = this;
        let map = {};
        Object.keys(v5).map((key) => {
            let cde = Fn.asNumber(MQTT_V5_KEYS[key]);
            if (cde > 0) {
                let val = v5[key];
                if (!(!val || (Array.isArray(val) && val.length < 1))) {
                    map[`${cde}`] = val;
                }
            }
        });
        return map;
    }
}
/** **MQTT Topic**
 * 
 * The meeting place.       */
class MQTTTopic {
    /** **MQTT Topic**
     * 
     * The meeting place.
     * @param {String} topicname 
     * @param {Number} qos    
     * @param {import("./iot.defines").IOT.TopicBasicType} tdata 
     * */
    constructor(topicname, qos, tdata) {
        if (!tdata) tdata = MQTT.getTopicName(topicname);
        /** **MQTT Topic**: Full name
         * @type {String}               */
        this.fullname = topicname;
        /** **MQTT Topic**: Short name
         * @type {String}               */
        this.name = tdata.name;
        /** **MQTT Topic**: Dashboard enabled
         * @type {Boolean}              */
        this.dash = tdata.dash;
        /** **MQTT Topic**: Quality Of Service
         * @type {Number}               */
        this.qos = Fn.asNumber(qos);
        /** **MQTT Topic**: Subscribe status
         * @type {Boolean}              */
        this.subscribed = false;
        /** **MQTT Topic**: Queue, wait for acknowledge
         * @type {Number}               */
        this.queue = 0;
        /** **MQTT Topic**: Process timestamp
         * @type {Number}               */
        this.tstamp = Fn.millis();
        /** Topic Client List
         * @type {Record<String,MQTTStream>}    */
        this.clients = {};
        /** Last Message sender
         * @type {MQTTStream}           */
        this.sender;
        /** Last Message received
         * @type {Array<Number>}        */
        this.value = [];
        return this;
    }
    /** Adds a new subscriber to this topic
     * @param {*} client 
     * @returns {MQTTStream}        */
    addClient(client) {
        let topic = this;
        let /** @type {MQTTStream}  */ stream;
        if (client instanceof MQTTStream) {
            let addr = client.address;
            topic.clients[addr] = client;
            stream = topic.clients[addr];
        }
        return stream;
    }
    /** Gets a subscriber from this Topic
     * @param {*} client 
     * @returns {MQTTStream}        */
    getClient(client) {
        let topic = this;
        let /** @type {MQTTStream}  */ stream;
        let addr = MQTT.getAddress(client);
        if (addr && (addr in topic.clients)) {
            stream = topic.clients[addr];
        }
        return stream;
    }
    /** Remove Subscriber from this Topic
     * @param {*} client 
     * @returns {Boolean}           */
    removeClient(client) {
        let topic = this;
        let /** @type {MQTTStream}  */ stream;
        stream = topic.getClient(client);
        if (stream) {
            let addr = MQTT.getAddress(stream);
            delete (topic.clients[addr]);
            return true;
        }
        return false;
    }
    /** Checks if this Topic has at least one subscriber.
     * 
     * Returns `true` if no has subscribers.
     * @returns {Boolean}    */
    isEmpty() {
        let topic = this;
        let names = Fn.keySet(topic.clients);
        return names.length === 0;
    }
}
/** Mqtt Message Object         */
class MQTTMessage {
    /** MQTT Message
     * 
     * @param {import("./iot.defines").IOT.PacketNamesEnum} mtype 
     * @param {Number} version 
     */
    constructor(mtype, version) {
        version = Fn.asNumber(version);
        if (version < 3) version = 3;
        if (version > 5) version = 5;
        /** The packet type code
         * @type {import("./iot.defines").IOT.PacketNamesEnum}  */
        this.packetType = mtype;
        /** @type {Number}          */
        this.version = version;
        /** The packet control flags
         * @type {Number}           */
        this.flags = null;
        /** The MQTT Protocol
         * @type {String}           */
        this.protocol = null;
        /** The Connection Identity
         * @type {String}           */
        this.clientId = null;
        /** The User/Workspace that connection belong
         * @type {String}           */
        this.userName = null;
        /** The Connection Security string
         * @type {String}           */
        this.password = null;
        /** The Connection Keep Alive time in seconds
         * @type {Number}           */
        this.keepAlive = null;
        /** The Message Topic destiny
         * @type {String}           */
        this.topic = null;
        /** The Message Payload/Data
         * @type {Array<Number>}    */
        this.payload = null;
        /** The Message Quality of service
         * @type {Number}           */
        this.qos = null;
        /** The Message Identity
         * @type {Number            */
        this.pid = null;
        /** `true` If message was duplicated
         * @type {Boolean}          */
        this.dup = null;
        /** `true` If message must be retained
         * @type {Boolean}          */
        this.ret = null;
        /** Message session flag
         * @type {Boolean}          */
        this.session = null;
        /** Message response code
         * @type {Number}           */
        this.reason = null;
        /** Subscrition/Unsubscription Topic List
         * @type {Array}            */
        this.topics = null;
        /** Will Topic Name
         * 
         * Used at connection time
         * @type {String}           */
        this.willTopic = null;
        /** Will Payload/Data Message
         * 
         * Used at connection time
         * @type {Array<Number>}    */
        this.willPayload = null;
        /** Will Quality of Message
         * 
         * Used at connection time
         * @type {Number}           */
        this.willQos = null;
        /** Will Retain Flag
         * 
         * Used at connection time
         * @type {Boolean}          */
        this.willRet = null;
        /** Will Version 5 properties
         * 
         * Used at connection time
         * @type {MQTTV5}           */
        this.willV5 = null;
        /** Version 5 properties
         * @type {MQTTV5}           */
        this.v5 = null;
        /** Message was received from secured channel
         * @type {Boolean}          */
        this.secured = false;
    }
    /** Gets teh Message payload accord its data type.
     * @returns {Record<String,Object>|String}  */
    getPayload() {
        let msg = this;
        let pload = msg.payload;
        if (Fn.isAscii(pload)) {
            let map, txt;
            txt = Fn.asString(pload);
            try {
                map = JSON.parse(txt);
            } catch (err) { };
            return map ? map : txt;
        }
        return pload;
    }
    /** Clone this Object
     * 
     * @returns {MQTTMessage}   */
    clone() {
        let msg = this;
        let rsp = new MQTTMessage(msg.packetType, msg.version);
        let keys = Object.keys(msg);
        keys.map((key) => {
            let val = msg[key];
            if (Array.isArray(val)) {
                rsp[key] = val.slice();
            } else if (val !== null
                && val !== undefined
                && (typeof val !== "function")) rsp[key] = val;
        });
        return rsp;
    }
    /** Get the Message as Map in JSon notation
     * 
     * @returns {Record<String,Object>}    */
    getMap() {
        let msg = this;
        let rsp = {};
        for (let k0 in msg) {
            let val = msg[k0];
            if ((val === null)
                || (val === undefined)
                || (typeof val === "function")) continue;
            //------------------------------------------
            if (k0 === "payload") val = msg.getPayload();
            if (Array.isArray(val) && typeof val[0] === "number") {
                val = `base64:${Fn.encodeBase64(val)}`;
            }
            if (val instanceof MQTTV5) val = val.getMap();
            rsp[k0] = val;
        }
        return rsp;
    }
}
/** MQTT Protocol Utilities     */
class MQTTParser {
    constructor() {
        this._pidcounter = 2;
    }
    /** Gets next packet Identity
     * @returns {Number}        */
    nextPacketId() {
        let pid = this._pidcounter;
        pid = (pid + 1) & 0xffff;
        if ((pid < 2) || (pid > 0xfffb)) pid = 2;
        this._pidcounter = pid;
        return pid;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_connect(raw, version) {
        let msg = new MQTTMessage("connect", version);
        raw.rewind();
        msg.protocol =  /**/ raw.getString();
        msg.version =   /**/ raw.get08();
        msg.flags =     /**/ raw.get08();
        msg.keepAlive = /**/ raw.get16();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        msg.clientId = raw.getString();
        if ((msg.flags & 0x04) === 0x04) {
            if (msg.version > 4) {
                let sze = raw.getSize();
                let bff = raw.read(sze);
                msg.v5.decode(bff);
            }
            msg.willQos = (msg.flags >> 3) & 3;
            msg.willRet = (msg.flags & 0x20) === 0x20;
            msg.willTopic = raw.getString();
            msg.willPayload = raw.getData();
        }
        if ((msg.flags & 0x80) === 0x80) {
            msg.userName = raw.getString();
        }
        if ((msg.flags & 0x40) === 0x40) {
            msg.password = raw.getString();
        }
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_conack(raw, version) {
        let msg = new MQTTMessage("conack", version);
        raw.rewind();
        msg.session = raw.get08();
        msg.reason = raw.get08();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_publish(raw, version) {
        let msg = new MQTTMessage("publish", version);
        raw.rewind();
        let tpe = raw.bytes[0];
        msg.qos = (tpe >> 1) & 3;
        msg.dup = (tpe & 0x04) === 0x04;
        msg.ret = (tpe & 0x01) === 0x01;
        msg.topic = raw.getString();
        msg.pid = (msg.qos) ? raw.get16() : 0;
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        msg.payload = raw.read();
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw 
     * @param {Number} version 
     * @param {import("./iot.defines").IOT.PacketNamesEnum} tpe */
    decode_puback(raw, version, tpe) {
        let msg = new MQTTMessage(tpe, version);
        raw.rewind();
        msg.pid = raw.get16();
        msg.reason = raw.get08();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_subscribe(raw, version) {
        let msg = new MQTTMessage("subscribe", version);
        raw.rewind();
        msg.pid = raw.get16();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        msg.topics = [];
        while (raw.available() > 0) {
            msg.topics.push({
                name: raw.getString(),
                qos: raw.get08(),
            });
        }
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_suback(raw, version) {
        let msg = new MQTTMessage("suback", version);
        raw.rewind();
        msg.pid = raw.get16();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        msg.reason = raw.get08();
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_unsubscribe(raw, version) {
        let msg = new MQTTMessage("unsubscribe", version);
        raw.rewind();
        msg.pid = raw.get16();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        msg.topics = [];
        while (raw.available() > 0) {
            msg.topics.push(raw.getString());
        }
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_unsuback(raw, version) {
        let msg = new MQTTMessage("unsuback", version);
        raw.rewind();
        msg.pid = raw.get16();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        msg.reason = raw.get08();
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_disconnect(raw, version) {
        let msg = new MQTTMessage("disconnect", version);
        raw.rewind();
        msg.reason = raw.get08();
        if (msg.version > 4) {
            msg.v5 = new MQTTV5();
            let sze = raw.getSize();
            let bff = raw.read(sze);
            msg.v5.decode(bff);
        }
        return msg;
    }
    /** Decode Packet accord its type
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode_auth(raw, version) {
        let msg = new MQTTMessage("auth", version);
        raw.rewind();
        return msg;
    }
    /** Decode The incoming packet
     * 
     * 
     * @param {RawBuffer} raw
     * @param {Number} version 
     * @returns {MQTTMessage}   */
    decode(raw, version) {
        let parser = this;
        let tpe = raw.bytes[0] & 0xf0;
        if (raw.rewind()) {
            switch (tpe) {
                case 0x10: return parser.decode_connect(raw, version);
                case 0x20: return parser.decode_conack(raw, version);
                case 0x30: return parser.decode_publish(raw, version);
                case 0x40: return parser.decode_puback(raw, version, "pub.ack");
                case 0x50: return parser.decode_puback(raw, version, "pub.receive");
                case 0x60: return parser.decode_puback(raw, version, "pub.release");
                case 0x70: return parser.decode_puback(raw, version, "pub.complete");
                case 0x80: return parser.decode_subscribe(raw, version);
                case 0x90: return parser.decode_suback(raw, version);
                case 0xa0: return parser.decode_unsubscribe(raw, version);
                case 0xb0: return parser.decode_unsuback(raw, version);
                case 0xc0: return new MQTTMessage("ping.request", version);
                case 0xd0: return new MQTTMessage("ping.response", version);
                case 0xe0: return parser.decode_disconnect(raw, version);
                case 0xf0: return parser.decode_auth(raw, version);
                default: break;
            }
        }
        return null;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @returns {RawBuffer}     */
    encode_connect(msg) {
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let protocol =  /**/ Fn.getString(msg, ["protocol"], "MQTT");
        let clientid =  /**/ Fn.getString(msg, ["clientid", "deviceid", "device"]);
        let username =  /**/ Fn.getString(msg, ["username", "user"]);
        let password =  /**/ Fn.getString(msg, ["password", "passwd"]);
        let keepalive = /**/ Fn.getNumber(msg, ["keepalive", "timeout"], 30);
        let version =   /**/ Fn.getNumber(msg, ["version"], 3);
        if ((version < 3) || (version > 5)) version = 3;
        if ((keepalive < 1) || (keepalive > 300)) keepalive = 300;
        if (!protocol) protocol = "MQTT";
        //--------------------------------------------------------------
        let wtopic = /**/ Fn.getString(msg, ["willtopic"]);
        let wpload = /**/ Fn.asBytes(Fn.getKey(msg, ["willpayload"]));
        let wqos =   /**/ Fn.getNumber(msg, ["willqos"]);
        let wret =   /**/ Fn.getBool(msg, ["willret"]);
        //--------------------------------------------------------------
        let flg = 0;
        let sze = 8;
        sze += protocol.length;
        sze += clientid.length;
        if (username) {
            flg |= 0x80;
            sze += username.length + 2;
        }
        if (password) {
            flg |= 0x40;
            sze += password.length + 2;
        }
        if (version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        if (wtopic) {
            flg |= 0x04;
            flg |= ((wqos & 3) << 3);
            if (wret) flg |= 0x20;
            if (version > 4) sze += 1;
            sze += wtopic.length + 2;
            sze += wpload.length + 2;
        }
        raw.put08(0x10);
        raw.putSize(sze);
        raw.putString(protocol);
        raw.put08(version);
        raw.put08(flg);
        raw.put16(keepalive);
        if (version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        raw.putString(clientid);
        if ((flg & 0x04) === 0x04) {
            if (version > 4) {
                raw.put08(0);
            }
            raw.putString(wtopic);
            raw.putData(wpload);
        }
        if ((flg & 0x80) === 0x80) {
            raw.putString(username);
        }
        if ((flg & 0x40) === 0x40) {
            raw.putString(password);
        }
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @returns {RawBuffer}     */
    encode_conack(msg) {
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 2;
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(0x20);
        raw.putSize(sze);
        raw.put08(Fn.asNumber(msg.session));
        raw.put08(Fn.asNumber(msg.reason));
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @returns {RawBuffer}     */
    encode_publish(msg) {
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        msg.topic =   /**/ Fn.asString(msg.topic);
        msg.payload = /**/ Fn.asBytes(msg.payload);
        msg.qos =     /**/ Fn.asNumber(msg.qos);
        msg.pid =     /**/ Fn.asNumber(msg.pid);
        let head = 0x30;
        head |= ((msg.qos & 3) << 1);
        if (msg.dup) head |= 0x04;
        if (msg.ret) head |= 0x01;
        let sze = 2;
        if (msg.qos) sze += 2;
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        sze += msg.topic.length;
        sze += msg.payload.length;
        raw.put08(head);
        raw.putSize(sze);
        raw.putString(msg.topic);
        if (msg.qos) raw.put16(msg.pid);
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        raw.write(msg.payload);
        return raw;
    }
    /**
     * @param {MQTTMessage} msg 
     * @param  {...any} args 
     * @returns {RawBuffer}         */
    encode_puback(msg) {
        msg.reason = /**/ Fn.asNumber(msg.reason);
        msg.pid =    /**/ Fn.asNumber(msg.pid);
        let tpe = MQTT_PACK_KEYS[msg.packetType];
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 3;
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(tpe);
        raw.putSize(sze);
        raw.put16(msg.pid);
        raw.put08(msg.reason);
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @returns {RawBuffer}     */
    encode_subscribe(msg) {
        msg.pid =    /**/ Fn.asNumber(msg.pid);
        if (!Array.isArray(msg.topics)) return [];
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 2;
        msg.topics.map((item) => { sze += item.name.length + 3 });
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(0x82);
        raw.putSize(sze);
        raw.put16(msg.pid);
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        msg.topics.map((item) => {
            raw.putString(item.name);
            raw.put08(item.qos);
        });
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @param  {...any} args 
     * @returns {RawBuffer}     */
    encode_suback(msg) {
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 3;
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(0x90);
        raw.putSize(sze);
        raw.put16(msg.pid);
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        raw.put08(msg.reason);
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @returns {RawBuffer}     */
    encode_unsubscribe(msg) {
        msg.pid =    /**/ Fn.asNumber(msg.pid);
        if (!Array.isArray(msg.topics)) return [];
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 2;
        msg.topics.map((item) => { sze += item.length + 2 });
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(0xa2);
        raw.putSize(sze);
        raw.put16(msg.pid);
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        msg.topics.map((item) => {
            raw.putString(item);
        });
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @param  {...any} args 
     * @returns {RawBuffer}     */
    encode_unsuback(msg) {
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 3;
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(0xb0);
        raw.putSize(sze);
        raw.put16(msg.pid);
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        raw.put08(msg.reason);
        return raw;
    }
    /** Ping Request 
     * @returns {RawBuffer} */
    encode_ping_request() {
        let raw = new RawBuffer();
        raw.put08(PACK_TYPE.PING_REQUEST);
        raw.put08(0);
        return raw;
    }
    /** Ping Response 
     * @returns {RawBuffer} */
    encode_ping_response() {
        let raw = new RawBuffer();
        raw.put08(PACK_TYPE.PING_RESPONSE);
        raw.put08(0);
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @param  {...any} args 
     * @returns {RawBuffer}     */
    encode_disconnect(msg) {
        let raw = new RawBuffer();
        let bff = msg.v5 ? msg.v5.encode() : [];
        let sze = 1;
        if (msg.version > 4) {
            sze += raw.sizeFor(bff.length);
            sze += bff.length;
        }
        raw.put08(0xe0);
        raw.putSize(sze);
        raw.put08(Fn.asNumber(msg.reason));
        if (msg.version > 4) {
            raw.putSize(bff.length);
            raw.write(bff);
        }
        return raw;
    }
    /** From message to byte array
     * @param {MQTTMessage} msg 
     * @param  {...any} args 
     * @returns {RawBuffer}         */
    encode_auth() {
        return new RawBuffer();
    }
    /** Encode Message.
     * 
     * Returns the binary data.
     * 
     * @param {MQTTMessage} msg     
     * @param {Number} version 
     * @returns RawBuffer}          */
    encode(msg, version) {
        let parser = this;
        if (typeof version !== "number") {
            version = msg.version;
        }
        if ((version < 3) || (version > 5)) version = 3;
        msg.version = version;
        switch (msg.packetType) {
            case "connect":         /**/ return parser.encode_connect(msg);
            case "conack":          /**/ return parser.encode_conack(msg)
            case "publish":         /**/ return parser.encode_publish(msg);
            case "pub.ack":         /**/ return parser.encode_puback(msg);
            case "pub.receive":     /**/ return parser.encode_puback(msg);
            case "pub.release":     /**/ return parser.encode_puback(msg);
            case "pub.complete":    /**/ return parser.encode_puback(msg);
            case "subscribe":       /**/ return parser.encode_subscribe(msg);
            case "suback":          /**/ return parser.encode_suback(msg);
            case "unsubscribe":     /**/ return parser.encode_unsubscribe(msg);
            case "unsuback":        /**/ return parser.encode_unsuback(msg);
            case "ping.request":    /**/ return parser.encode_ping_request();
            case "ping.response":   /**/ return parser.encode_ping_response();
            case "disconnect":      /**/ return parser.encode_disconnect(msg);
            case "auth":            /**/ return parser.encode_auth();
            default: return null;
        }
    }
    /** Sets/Normalize Topic name
     * @param {String} topic 
     * @returns {import("./iot.defines").IOT.TopicBasicType}    */
    getTopicName(topic) {
        topic = Fn.asString(topic).trim();
        let resp = {
            fullname: topic,
            name: topic.toLowerCase(),
            dash: false,
        }
        let name = topic.toLowerCase();
        if (name.endsWith("/*") || name.endsWith("/#")) {
            name = name.substring(0, name.length - 2);
            resp.dash = true;
        }
        while (name.endsWith("/")) {
            name = name.substring(0, name.length - 1);
        }
        while (name.startsWith("/")) {
            name = name.substring(1);
        }
        resp.name = name.trim();
        return resp;
    }
    /** Checks if given name belong 
     * to a dash type connection
     * 
     * @param {*} topicname 
     * @returns {Boolean}               */
    isTopicDash(topicname) {
        if (typeof topicname === "str") {
            return topicname.trim().endsWith("/*")
                || topicname.trim().endsWith("/#");
        }
        return false;
    }
    /** Gets the client address
     * @param {*} client 
     * @returns {String} */
    getAddress(client) {
        let addr = ""
        if (client instanceof net.Socket) {
            let ipa = client.remoteAddress;
            let ipo = client.remotePort;
            addr = `${ipa}:${ipo}`;

        } else if (client instanceof IOStream) {
            addr = client.address;

        } else if (typeof client === "string") {
            addr = client;
        }
        addr = addr.trim().toLowerCase();
        return addr;
    }
}
/** MQTT Parser
 * @type {MQTTParser}         */
const MQTT = new MQTTParser();
/** ***MQTT Secure Element***.
 * 
 * Key exchange before send connection packet */
class MQTTSecure extends IOSecure {
    constructor(parent) {
        super(parent);
        /** @type {Buffer}      */
        this.rxvector = null;
        /** @type {Buffer}      */
        this.txvector = null;
        /** @type {Buffer}      */
        this.privatekey = null;
        /** @type {crypto.DiffieHellman}*/
        this.dhm = null;
        /** @type {Boolean}         */
        this.secured = false;
        /** The name for the peer 
         * @type {String}           */
        this.peerName = "";
    }
    /** Load the cipher keys.
     * 
     * @param {Buffer} secret 
     * @returns {Boolean}       */
    setSecret(secret) {
        let tls = this;
        let sze = secret.length - 48;
        if (sze >= 0) {
            tls.rxvector = Buffer.from(secret.slice(sze, sze + 16));
            tls.txvector = Buffer.from(secret.slice(sze, sze + 16));
            tls.privatekey = Buffer.from(secret.slice(sze + 16));
            return true;
        }
        return false;
    }
    /** **Key Exchange**.
     * 
     * First step using Diffie-Hellman exchange.
     * 
     * From Client to Server.
     * 
     * Two cases:
     *  - argument empty or string
     *     - Client starts key exchange
     *  - argument is a `RawBuffer`
     *    - Server receives from client
     * 
     * @param {RawBuffer|String} raw
     * @returns {Array<Number>}     */
    clientHello(raw) {
        let tls = this;
        if (raw instanceof RawBuffer) {
            //-----------------------------------
            // Server recieves from client ...
            if (raw.bytes.length >= 132) {
                tls.peerName = raw.getString();
                let peerkey = Buffer.from(raw.getData());
                let modulo = Buffer.from(raw.getData());
                modulo = TLS.xored(modulo, peerkey);
                try {
                    tls.dhm = crypto.createDiffieHellman(modulo);
                    let pubkey = tls.dhm.generateKeys();
                    let secret = tls.dhm.computeSecret(peerkey);
                    if (tls.setSecret(secret)) {
                        let pattern = tls.encrypt(IOSecure.pattern);
                        let rsp = new RawBuffer();
                        rsp.put08(PACK_TYPE.SERVER_HELLO);
                        rsp.putSize(4
                            + pubkey.length
                            + pattern.length);
                        rsp.putData(pubkey);
                        rsp.putData(pattern);
                        return tls.parent.send(rsp);
                    }
                } catch (err) { tls.parent.onError(err); }
            }
            let rsp = new RawBuffer();
            rsp.put08(PACK_TYPE.EXCHANGE_DONE);
            rsp.put08(1);
            rsp.put08(2);
            return tls.parent.send(rsp);
        }
        //----------------------------------------------------
        // Client starts key exchange
        let keyfile = Fn.asString(raw);
        if (!keyfile) {
            keyfile = Fn.getString(tls.parent.options,
                ["privatekey", "keyfile", "keypath"]);
            if (keyfile && !tls.peerName) {
                let uname = Fn.getString(
                    tls.parent.options,
                    ["keyuser", "username"]
                );
                if (uname) tls.peerName = uname;
            }
        }
        if (keyfile) {
            const fasync = async () => {
                if (!tls.peerName) tls.peerName = "generic.device";
                let prvkey = await TLS.privateKey(keyfile);
                let details = TLS.keyDetails(prvkey);
                if (details) {
                    try {
                        let modulo = details.modulus;
                        tls.dhm = crypto.createDiffieHellman(modulo);
                        let pubkey = tls.dhm.generateKeys();
                        if ((pubkey.length & 1) == 1) {
                            pubkey = Buffer.from(pubkey.slice(1));
                        }
                        modulo = TLS.xored(modulo, pubkey);
                        //
                        let rsp = new RawBuffer();
                        rsp.put08(PACK_TYPE.CLIENT_HELLO);
                        rsp.putSize(6
                            + tls.peerName.length
                            + pubkey.length
                            + modulo.length);
                        rsp.putString(tls.peerName);
                        rsp.putData(pubkey);
                        rsp.putData(modulo);
                        return tls.parent.send(rsp);

                    } catch (err) { tls.parent.onError(err); }
                }
                setTimeout(() => { tls.parent.connect(); });
            };
            setImmediate(() => { fasync(); });
            return null;
        }
        //------------------------------------------------
        // NO security active for Client
        setTimeout(() => { tls.parent.connect(); });
        return null;
    }
    /** **Server Hello**.
     * 
     * 2nd step for secure key exchange.
     * 
     * From Server to Client
     * 
     * ***Actions***:
     *   - Set timeout to connect
     *   - Connect dont see if key exchange was sucess or not.
     * 
     * @param {RawBuffer} raw
     * @returns {Array<Number>} */
    serverHello(raw) {
        let tls = this;
        if (raw instanceof RawBuffer) {
            if (raw.rewind()) {
                let peerkey = Buffer.from(raw.getData());
                let pattern = Buffer.from(raw.getData());
                let secret = tls.dhm.computeSecret(peerkey);
                if (tls.setSecret(secret)) {
                    pattern = tls.decrypt(pattern);
                    let txt = Fn.asString(pattern);
                    tls.secured = txt === IOSecure.pattern;
                }
                let rsp = new RawBuffer();
                rsp.put08(PACK_TYPE.EXCHANGE_DONE);
                rsp.put08(1);
                rsp.put08(tls.secured ? 0 : 1);
                setTimeout(() => {
                    tls.parent.OnExchange();
                    tls.parent.connect();
                });
                return tls.parent.send(rsp);
            }
        }
        return null;
    }
    /** **Exchange Keys is Complete**.
     * 
     * Last step into secure key exchange.
     * 
     * Two case 
     *   - ***Server receives***:
     *     - Client indicate that key exchanges was sucefull or not.
     *     - Server launch exchange event 
     *  - ***Client receives***: 
     *     - Some error into cipher data
     *     - Set timeout to connect later.
     * 
     * @param {RawBuffer} raw 
     * @returns {Boolean}   */
    exchangeDone(raw) {
        let tls = this;
        if (raw instanceof RawBuffer) {
            if (raw.rewind() && raw.bytes.length === 3) {
                tls.secured = raw.get08() === 0;
            }
            tls.parent.OnExchange();
            let uname = Fn.getString(tls.parent.options, [
                "username", "name"]);
            if (uname) setTimeout(() => {
                tls.parent.connect();
            });
            return true;
        }
        return false;
    }
    /** From cipher text to plain text.
     * 
     * Used in reception.
     * 
     * @param {Buffer} data 
     * @returns {Buffer}                */
    decrypt(data) {
        let tls = this;
        data = Fn.asBuffer(data);
        data = TLS.padding(data, 16);
        let out = data;
        try {
            let cipher = crypto.createDecipheriv(
                TLS_AES_CIPHER,
                tls.privatekey,
                tls.rxvector);
            cipher.setAutoPadding(false);
            let out1 = cipher.update(data);
            let out2 = cipher.final();
            out = Buffer.concat([out1, out2]);
            tls.rxvector = Buffer.from(data.slice(out.length - 16));
        } catch (err) { }
        //---------------------------------------------------------
        return out;
    }
    /** From plain text to cipher text.
     * 
     * Used in transmission.
     * 
     * @param {Buffer} data 
     * @returns {Buffer}                */
    encrypt(data) {
        let tls = this;
        data = Fn.asBuffer(data);
        data = TLS.padding(data, 16);
        let out = data;
        try {
            let cipher = crypto.createCipheriv(
                TLS_AES_CIPHER,
                tls.privatekey,
                tls.txvector);
            cipher.setAutoPadding(false);
            let out1 = cipher.update(data);
            let out2 = cipher.final();
            out = Buffer.concat([out1, out2]);
            tls.txvector = Buffer.from(out.slice(out.length - 16));
        } catch (err) { }
        //----------------------
        return out;
    }
}
/** Drives a MQTT Packet Reception   */
class MQTTReceptor extends IOReceptor {
    constructor(stream) {
        super(stream);
        /** Reception buffer
         * @type {Array<Number>} */
        this.rxbuffer = [];
        /** Reception string
         * @type {Array<Number>} */
        this.rxstring = [];
        /** Reception packet size
         * @type {Number} */
        this.packsize = 0;
        /** Reception brackets
         * @type {Number} */
        this.brackets = 0;
        /** Reception no ascii
         * @type {Boolean} */
        this.noascii = false;
        /** Reception utf8 flag
         * @type {Boolean} */
        this.onutf8 = false;
        /** Reception utf8 flag
         * @type {Boolean} */
        this.onframe = false;
        /** @type {Number} */
        this.tstamp = Fn.millis();
        /** Frame inter-character timeout
         * 
         * Timeout in milliseconds,
         * @type {Number}   */
        this.timeout = 100;
    }
    //
    checkTimeout() {
        let rcv = this;
        if (rcv.onframe) {
            let tm = Fn.millis();
            let t0 = tm - rcv.tstamp;
            if (t0 > rcv.timeout) {
                rcv.onframe = false;
                rcv.tstamp = tm;
                if (!rcv.noascii) {
                    let txt = Fn.asString(rcv.rxstring);
                    rcv.clear();
                    rcv.parent.frameComplete(txt, false);

                } else {
                    rcv.clear();
                    rcv.parent.onError("frame timeout");
                }
            }
        }
    }
    /** Clears the reception buffer
     * @returns {PacketReceptor} */
    clear() {
        super.clear();
        this.rxbuffer = [];
        this.rxstring = [];
        this.packsize = 0;
        this.brackets = 0;
        this.noascii = false;
        this.onutf8 = false;
    }
    /** Check if the character code meets utf8 sequence
     * @param {Number} c0 
     * @returns {Boolean}   */
    checksNoAscii(c0) {
        let rcv = this;
        if (rcv.noascii) return true;
        if (rcv.onutf8) {
            rcv.onutf8 = false;
            rcv.noascii = ((c0 & 0xc0) !== 0x80)
            return rcv.noascii;
        }
        if (c0 < 32) {
            rcv.noascii = ![
                0x07,
                0x0a,
                0x0d].includes(c0);
            return rcv.noascii;
        }
        if (c0 > 127) {
            if ((c0 & 0xf8) !== 0xc0) {
                rcv.noascii = true;
            } else rcv.onutf8 = true;
        }
        return rcv.noascii;
    }
    /** Receives data from stream
     * @param {...Array<Number>} data 
     * @returns {PacketReceptor} */
    receive(data) {
        let rcv = this;
        rcv.tstamp = Fn.millis();
        let bff = Fn.asBytes(data);
        rcv.tstamp = Fn.millis();
        for (let x0 = 0; x0 < bff.length; x0++) {
            let c0 = bff[x0] & 255;
            rcv.checksNoAscii(c0);
            rcv.rxbuffer.push(c0);
            rcv.onframe = true;
            //
            if (rcv.packsize == 0) {
                let off = 1, sze = 0;
                while (off < rcv.rxbuffer.length) {
                    let c1 = rcv.rxbuffer[off++];
                    sze |= (c1 & 0x7f) << (7 * (off - 2));
                    if ((c1 & 0x80) == 0) {
                        rcv.packsize = off + sze;
                        break;
                    }
                }
            }
            if (rcv.packsize == rcv.rxbuffer.length) {
                if (rcv.noascii) {
                    let dat = [...rcv.rxbuffer];
                    rcv.clear();
                    rcv.parent.frameComplete(dat, false);
                    continue;
                }
            }
            if (!rcv.noascii) {
                if (rcv.rxstring.length == 0) {
                    if (c0 <= 32) continue;
                }
                rcv.rxstring.push(c0);
                let dat;
                switch (c0) {
                    case 123:
                        if (rcv.rxstring[0] == 123) {
                            rcv.brackets += 1;
                        }
                        break;
                    case 125:
                        if (rcv.brackets > 0) {
                            rcv.brackets -= 1;
                            if (rcv.brackets == 0) {
                                let txt = Fn.asString(rcv.rxstring);
                                let map = Fn.asMap(txt);
                                dat = map ? map : txt;
                            }
                        }
                        break;
                    case 0x0a:
                        if (rcv.brackets == 0) {
                            dat = Fn.asString(rcv.rxstring);
                        }
                        break;
                }
                if (dat) {
                    rcv.clear();
                    rcv.stream.frameComplete(dat, false);
                }
            }
        }
    }
}
/** **User/Main Client Workspace**.             */
class MQTTWorkspace {
    constructor(name) {
        /** @type {String}                      */
        this.name = name;
        /** @type {Record<String,MQTTTopic>}    */
        this.topics = {};
        /** @type {Record<String,MQTTStream>}   */
        this.clients = {};
    }
    /** Get the Client Address
     * 
     * @param {MQTTStream|String} client 
     * @returns {String}        */
    getAddress(client) {
        if (typeof client === "string") {
            return client;
        }
        if (client instanceof MQTTStream) {
            return client.address;
        }
        return "";
    }
    /** **Adds a new Client to the Workspace**.
     * 
     * @param {MQTTStream} client 
     * @returns {MQTTStream}    */
    addClient(client) {
        let ws = this;
        let addr = client.address;
        if (addr) {
            if (!(addr in ws.clients)) {
                ws.clients[addr] = client;
                client.wspace = ws;
            }
            ws.toMonitor(client, {
                action: "client.attach"
            });
            return ws.clients[addr];
        }
        return null;
    }
    /** **Get a Client from the Workspace**.
     * 
     * @param {*} client 
     * @returns {MQTTStream}    */
    getClient(client) {
        let ws = this;
        let addr = ws.getAddress(client);
        return (addr && (addr in ws.clients))
            ? ws.clients[addr]
            : null;
    }
    /** **Remove a Client from the Workspace**.
     * 
     * @param {String} client 
     * @returns {Boolean}       */
    removeClient(client) {
        let ws = this;
        let con = ws.getClient(client);
        if (con) {
            let keys = Object.keys(ws.topics);
            keys.map((key) => {
                let tp = ws.topics[key];
                tp.removeClient(client);
            });
            //--------------------------------
            let nme = con.address;
            delete (ws.clients[nme]);
            ws.toMonitor(client, {
                action: "client.closed"
            });
            return true;
        }
        return false;
    }
    /** **Adds a new Topic to the Workspace**.
     * 
     * @param {import("./iot.defines").IOT.TopicBasicType} tdata 
     * @returns {MQTTTopic}     */
    addTopic(tdata) {
        let ws = this;
        let tname = tdata.name;
        if (tname) {
            if (!(tname in ws.topics)) {
                ws.topics[tname] = new MQTTTopic(
                    tdata.fullname, 0, tdata);
            }
            return ws.topics[tname];
        }
        return null;
    }
    /** **Get a Topic from the Workspace**.
     * 
     * @param {String} name 
     * @returns {MQTTTopic} */
    getTopic(name) {
        let ws = this;
        if (typeof name === "number") {
            let /** @type {Number} */ pid = name;
            if (pid > 0) {
                for (let k0 in ws.topics) {
                    let tp = ws.topics[k0];
                    if (tp.queue === pid) {
                        return tp;
                    }
                }
            }
            return null;
        }
        let tname = MQTT.getTopicName(name).name;
        return ws.topics[tname];
    }
    /** **Remove a Topic from the Workspace**.
     * 
     * @param {String} name 
     * @returns {Boolean}       */
    removeTopic(name) {
        let ws = this;
        let tp = ws.getTopic(name);
        if (tp) {
            let tname = tp.name;
            delete (ws.topics[tname]);
            return true;
        }
        return false;
    }
    /** **Connection Request**.
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg  */
    connect(client, msg) { }
    /** Publish message received
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg  */
    publish(client, msg) { }
    /** Subscribe to specified topic
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg  
     * @param {Boolean} noack 
     * */
    subscribe(client, msg, noack) { }
    /** Remove from specified topics
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg  */
    unsubscribe(client, msg) { }
    /** **Acknowledge Packet was received**.
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg  */
    acknowledge(client, msg) { }
    /** **Send to Dashboards**.
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg      */
    toDash(client, msg) { }
    /** **Send To Monitors**.
     * 
     * @param {MQTTStream} client 
     * @param {MQTTMessage} msg 
     */
    toMonitor(client, msg) { }
}
/** **MQTT Stream**.
 * 
 * Base Class that drives MQTT Protocol
 * 
 * ***Must be extended to get functionality***  */
class MQTTStream extends IOStream {
    constructor(parent) {
        super(parent);
        /** @type {Number}                      */
        this.version = 3;
        /** @type {Record<String, MQTTTopic>}   */
        this.topics = {};
        /** @type {MQTTWorkspace}               */
        this.wspace = null;
    }
    /** Adds a topic to this Client
     * 
     * @param {String} name 
     * @param {Number} qos 
     * @param {import("./iot.defines").IOT.TopicBasicType} tdata 
     * @returns {MQTTTopic} */
    addTopic(name, qos, tdata) {
        let stream = this;
        let /** @type {MQTTTopic} */ rsp;
        if (!tdata) tdata = MQTT.getTopicName(name);
        if (tdata.name) {
            if (!(tdata.name in stream.topics)) {
                stream.topics[tdata.name] = new MQTTTopic(
                    tdata.fullname,
                    qos,
                    tdata);
            }
            rsp = stream.topics[tdata.name];
        }
        return rsp;
    }
    /** Get Topic from this Client
     * 
     * @param {String} name 
     * @returns {MQTTTopic} */
    getTopic(name) {
        let /** @type {MQTTTopic} */ topic;
        let stream = this;
        if (typeof name === "number") {
            let /** @type {Number} */ pid = name;
            if (pid) {
                for (let k0 in stream.topics) {
                    let tp = stream.topics[k0];
                    if (tp.queue === pid) {
                        topic = tp;
                        break;
                    }
                }
            }
            return topic;
        }
        name = MQTT.getTopicName(name).name;
        if (name && (name in stream.topics)) {
            topic = stream.topics[name];
        }
        return topic;
    }
    /** Remove a topic from this Client
     * 
     * @param {String} name 
     * @returns {Boolean} */
    removeTopic(name) {
        let stream = this;
        let topic = stream.getTopic(name);
        if (topic) {
            name = topic.name;
            delete (stream.topics[name]);
            return true;
        }
        return false;
    }
    /** Sets a new Stream State.
     * 
     * @param {import("./iot.defines").IOT.ConnectStateEnum} state */
    setState(state) {
        let io = this;
        if (io.state !== state) {
            let old = io.state;
            io.state = state;
            let tm = Fn.millis();
            io.procTm = tm;
            io.emit("change", io, state, old);
            switch (state) {
                case "connected":
                    io.lastRx = tm;
                    io.lastTx = tm;
                    break;
                case "attached":
                    io.onConnect();
                    break;
                case "closed":
                    io.onClose();
                    break;
                default: break;
            }
        }
        return io;
    }
    /** Sends a ping request to remote peer.
     * 
     * As part to check connection alive        */
    ping() {
        let raw = MQTT.encode(new MQTTMessage("ping.request"));
        return this.send(raw);
    }
    /** Response to ping request from remote peer.
     * 
     * As part to check connection alive        */
    pong() {
        let raw = MQTT.encode(new MQTTMessage("ping.response"));
        return this.send(raw);
    }
    /** Message received event.
     * 
     * @param {MQTTMessage} msg     */
    onMessage(msg) {
        this.emit("message", msg, this);
    }
    /** Topic Subscription accepted
     * 
     * @param {MQTTTopic} topic     */
    onSubscribe(topic) {
        this.emit("subscribed", topic, this);
    }
    /** Topic Subscription was removed
     * 
     * @param {MQTTTopic} topic     */
    onRemoved(topic) {
        this.emit("removed", topic, this);
    }
    /** Message was acknowledge.
     * 
     * @param {MQTTMessage} msg 
     * @param {MQTTTopic} topic     */
    onAcknowledge(msg, topic) { this.emit("acnowledge", msg, topic, this); }
    /** Ping response was received  
     * 
     * Still alive event            */
    onAlive() { this.emit("alive", this); }
    /** **MQTT**: Connect to remote server.
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType} opts */
    connect(opts) {
        let io = this;
        if (io.state === "closed") {
            return io.open(opts);
        }
        if (io.state === "connected") {
            Fn.update(io.options, opts);
            let msg = new MQTTMessage("connect", io.version);
            opts = io.options;
            msg.protocol =   /**/ Fn.getString(opts, ["protocol"], "MQTT");
            msg.version =    /**/ Fn.getNumber(opts, ["version"], 3);
            msg.keepAlive =  /**/ Fn.getNumber(opts, ["keepalive", "timeout"], 30);
            msg.userName =   /**/ Fn.getString(opts, ["username", "user"]);
            msg.password =   /**/ Fn.getString(opts, ["passwd", "password"]);
            msg.clientId =   /**/ Fn.getString(opts, ["clientid", "deviceid"]);
            if (!msg.clientId) {
                msg.clientId = Fn.encodeHex(TLS.seed(8));
            } else if (!msg.clientId.includes(":")) {
                msg.clientId += `:${Fn.encodeHex(TLS.seed(4))}`;
            }
            if (msg.version < 3 || msg.version > 5) msg.version = 3;
            if (msg.keepAlive < 1 || msg.keepAlive > 300) msg.keepAlive = 300;
            io.version = msg.version;
            io.options["keepalive"] = msg.keepAlive;
            //----------------------------------------
            let bff = MQTT.encode(msg, msg.version);
            return io.send(bff);
        }
    }
    /** Publish a Message
     * 
     * @param {MQTTMessage|String} topic    Topic or message
     * @param {*} payload                   The message payload
     * @returns {MQTTStream}            */
    publish(topic, payload) {
        let stream = this;
        if (stream.isAttached()) {
            let msg = new MQTTMessage("publish", stream.version);
            if (Fn.isMap(topic)) {
                Fn.update(msg, topic);
                msg.payload = Fn.asBytes(msg.payload);

            } else if (typeof topic === "string") {
                msg.topic = topic;
                msg.payload = Fn.asBytes(payload);
            } else return stream;
            //---------------------------------------
            if (msg.qos !== null) {
                if (msg.pid === null) msg.pid = 0;
                if ((msg.qos < 0) || (msg.qos > 2)) msg.qos = 0;
                if (msg.qos > 0 && msg.pid < 1) msg.pid = MQTT.nextPacketId();
                if (msg.pid > 1 && msg.qos < 1) msg.qos = 1;
            }
            //---------------------------------------
            let bff = MQTT.encode(msg, stream.version);
            return stream.send(bff);
        }
        return stream;
    }
    /** Subscribe to specified topic with Quality Of Service.
     * @param {String} topicname 
     * @param {Number} qos 
     * @returns {MQTTStream}    */
    subscribe(topicname, qos) {
        let stream = this;
        topicname = Fn.asString(topicname).trim();
        if (topicname && stream.isAttached()) {
            let msg = new MQTTMessage("subscribe", stream.version);
            msg.topics = [{
                name: topicname,
                qos: qos
            }];
            msg.pid = MQTT.nextPacketId();
            let topic = stream.getTopic(topicname);
            if (topic) {
                topic.tstamp = Fn.millis();
                topic.queue = msg.pid;
            }
            let raw = MQTT.encode(msg, stream.version);
            return stream.send(raw);
        }
        return stream;
    }
    /** Unsubscribe from specified topic.
     * @param {String} topicname 
     * @returns {MQTTStream}    */
    unsubscribe(topicname) {
        let stream = this;
        topicname = Fn.asString(topicname).trim();
        if (topicname && stream.isAttached()) {
            let msg = new MQTTMessage("unsubscribe", stream.version);
            msg.topics = [topicname];
            msg.pid = MQTT.nextPacketId();
            let topic = stream.getTopic(topicname);
            if (topic) {
                topic.tstamp = Fn.millis();
                topic.queue = msg.pid;
            }
            let raw = MQTT.encode(msg, stream.version);
            return stream.send(raw);
        }
        return stream;
    }
    //
    disconnect(reason) {
        let stream = this;
        if (stream.state !== "closed") {
            let msg = new MQTTMessage("disconnect", stream.version);
            msg.reason = Fn.asNumber(reason);
            let bff = MQTT.encode(msg, stream.version);
            setTimeout(() => { stream.close(reason); });
            return stream.send(bff);
        }
        return stream;
    }
    /** Subscribe to the next Topic.
     * 
     * @returns {Boolean}       */
    nextTopic() {
        let stream = this;
        for (let k0 in stream.topics) {
            let topic = stream.topics[k0];
            if (topic
                && !topic.subscribed
                && topic.queue === 0) {
                topic.queue = 1;
                stream.subscribe(topic.fullname, topic.qos);
                return true;
            }
        }
        return false;
    }
    /** Clear the topic state
     * @returns {MQTTStream}    */
    clearTopics() {
        let stream = this;
        let tme = Fn.millis();
        for (let k0 in stream.topics) {
            let topic = stream.topics[k0];
            topic.subscribed = false;
            topic.queue = 0;
            topic.tstamp = tme
        }
        return stream;
    }
    /** **Decrypt** 
     * 
     * From cipher to plain data.
     * 
     * Only if this stream has security active.
     * And checks protocol. 
     * 
     * @param {Array<Number>} data 
     * @returns {Array<Number>}         */
    decrypt(data) {
        let io = this;
        if (io.isSecured()) {
            let raw = new RawBuffer(data);
            let tpe = raw.bytes[0];
            if (raw.rewind()
                && tpe === PACK_TYPE.CIPHER_PACKET) {
                let tls = io.tls;
                let pad = raw.get08();
                let crc = raw.get16();
                let bff = raw.getData();
                bff = tls.decrypt(bff);
                if (pad) {
                    pad = bff.length - pad;
                    bff = Buffer.from(bff.slice(0, pad));
                }
                let chk = CRC16.calculate(bff);
                if (chk === crc) {
                    return bff;
                }
            }
        }
        return data;
    }
    /** **Encrypt** 
     * 
     * From plain to cipher data.
     * 
     * Only if this stream has security active.
     * And checks protocol. 
     * 
     * @param {Array<Number>} data 
     * @returns {Array<Number>}         */
    encrypt(data) {
        let io = this;
        if (io.isSecured()) {
            let bff = Fn.asBytes(data);
            let pad = bff.length & 15;
            if (pad > 0) pad = 16 - pad;
            let crc = CRC16.calculate(bff);
            bff = io.tls.encrypt(bff);
            let raw = new RawBuffer();
            raw.put08(PACK_TYPE.CIPHER_PACKET);
            raw.putSize(3 + bff.length);
            raw.put08(pad);
            raw.put16(crc);
            raw.write(bff);
            return raw;
        }
        return data;
    }
    /** MQTT Packet received Event
     * @param {MQTTMessage} msg     */
    mqttComplete(msg) {
        let stream = this;
        let /** @type {MQTTTopic} */ topic;
        switch (msg.packetType) {
            case "conack":
                stream.clearTopics();
                stream.setState("attached");
                stream.nextTopic();
                break;

            case "publish":
                stream.onMessage(msg);
                break;

            case "pub.ack":
            case "pub.receive":
            case "pub.release":
            case "pub.complete":
                topic = stream.getTopic(msg.pid);
                stream.onAcknowledge(msg, topic);
                break;

            case "suback":
                topic = stream.getTopic(msg.pid);
                if (topic) {
                    topic.subscribed = true;
                    stream.onSubscribe(topic);
                }
                stream.nextTopic();
                break;

            case "unsuback":
                topic = stream.getTopic(msg.pid);
                if (topic) {
                    topic.subscribed = false;
                    stream.onRemoved(topic);
                }
                break;

            case "ping.request":
                return stream.pong();

            case "ping.response":
                return stream.onAlive();

            case "disconnect":
                return stream.disconnect(msg.reason | 0x100);

            default: break;
        }
    }
    /** Packet Reception
     * 
     * @param {Array<Number>|Buffer} data 
     * @param {Boolean} secured             */
    frameComplete(data, secured) {
        let stream = this;
        if (Array.isArray(data)
            || Buffer.isBuffer(data)) {
            //-------------------------------------------------
            let raw = new RawBuffer(data);
            if (raw.rewind()) {
                let tpe = raw.bytes[0];
                if (tpe === PACK_TYPE.CLIENT_HELLO) {
                    if (!stream.tls) {
                        stream.tls = new MQTTSecure(stream);
                    }
                }
                let tls = stream.tls;
                if (tls) {
                    switch (tpe) {
                        case PACK_TYPE.CLIENT_HELLO:  /**/ return tls.clientHello(raw);
                        case PACK_TYPE.SERVER_HELLO:  /**/ return tls.serverHello(raw);
                        case PACK_TYPE.EXCHANGE_DONE: /**/ return tls.exchangeDone(raw);
                    }
                    if (tpe === PACK_TYPE.CIPHER_PACKET) {
                        let dne = false;
                        let pad = raw.get08();
                        let crc = raw.get16();
                        let bff = raw.read();
                        if ((bff.length & 15) === 0) {
                            bff = tls.decrypt(bff);
                            if (pad) {
                                pad = bff.length - pad;
                                bff = Buffer.from(bff.slice(0, pad));
                            }
                            let chk = CRC16.calculate(bff);
                            dne = chk === crc;
                        }
                        raw = new RawBuffer(bff);
                        if (!raw.rewind() || !dne) {
                            stream.disconnect(IOREASON.TLS_ERROR);
                            return;
                        }
                        tpe = raw.bytes[0];
                        secured = true;
                    }
                }
                //-------------------------------
                // Child Close
                if (tpe === PACK_TYPE.BAG_CLOSE) {
                    if (stream instanceof MQTTSocket) {
                        let addr = raw.getString();
                        let child = stream.getBag(addr);
                        if (child) child.close();
                    }
                    return;
                }
                //-------------------------------
                // Child Data
                if (tpe === PACK_TYPE.BAG_PACKET) {
                    if (stream instanceof MQTTSocket) {
                        let addr = raw.getString();
                        let child = stream.addBag(addr);
                        if (child) {
                            let bff = raw.read();
                            child.frameComplete(bff, secured);
                        }
                    }
                    return;
                }
                //-------------------------------
                // Normal MQTT Packet
                let msg = MQTT.decode(raw, stream.version);
                if (msg) {
                    if (secured) msg.secured = true;
                    return stream.mqttComplete(msg);
                }
            }
            return stream.onData(data);
        }
        if (typeof data === "string") {
            let txt = data.trim();
            if (txt === "getdate") {
                txt = Fn.dateString("dd/MM/yyyy HH:mm:ss");
                txt = `DATE=${txt}\r\n`;
                return stream.send(txt);
            }
        }
        return stream.onData(data);
    }
}
/** **MQTT Bag Type Connection**.
 * 
 * Allow multiple connection using only one socket. */
class MQTTBag extends MQTTStream {
    /** **MQTT Child**.
     * 
     * Allow multiple connection using only one socket.
     * 
     * @param {MQTTSocket} parent 
     * @param {String} address  */
    constructor(parent, address) {
        super(parent);
        /** @type {String}      */
        this.address = address;
    }
    /** ***Ping not allowed here***. */
    ping() { }
    /** ***Pong not allowed here***. */
    pong() { }
    /** **Disconnect**.
     * 
     * Sends disconnect packet and close resources later.
     * 
     * @param {Number} reason       */
    disconnect(reason) {
        let io = this;
        if (io.isConnected()) {
            if (!io.reason) io.reason = reason;
            switch (io.state) {
                case "attached":
                case "connected":
                    io.setState("closing");
                    break;
                default: break;
            }
            let /** @type {MQTTSocket} */ parent;
            parent = io.parent;
            if (parent && parent.isOpen()) {
                let sze = 2 + io.address.length;
                let raw = new RawBuffer();
                raw.put08(PACK_TYPE.BAG_CLOSE);
                raw.putSize(sze);
                raw.putString(io.address);
                parent.send(raw);
            }
            setImmediate(() => { io.close(); });
        }
        return io;
    }
    //
    close(reason) {
        let io = this;
        if (io.state !== "closed") {
            if (!io.reason) io.reason = reason;
            io.setState("closed");
            //        
            let /** @type {MQTTSocket} */ parent;
            parent = io.parent;
            if (parent instanceof MQTTSocket) {
                setImmediate(() => {
                    let addr = io.address;
                    parent.removeBag(addr);
                });
            }
        }
    }
    //
    open(opts) {
        let io = this;
        if (io.state === "closed") {
            Fn.update(io.options, opts);
            io.setState("connected");
        }
    }
    //
    send(data) {
        let io = this;
        let /** @type {MQTTSocket} */ parent;
        parent = io.parent;
        if (parent && parent.isOpen()) {
            let push = true;
            if (data instanceof RawBuffer) {
                let tpe = data.bytes[0] & 0xf0;
                switch (tpe) {
                    case PACK_TYPE.CONNECT:
                    case PACK_TYPE.PUBLISH:
                    case PACK_TYPE.SUBSCRIBE:
                    case PACK_TYPE.UNSUBSCRIBE:
                        push = false;
                        break;
                    default: break;
                }
            }
            data = Fn.asBytes(data);
            let sze = 2 + io.address.length + data.length;
            let raw = new RawBuffer();
            raw.put08(PACK_TYPE.BAG_PACKET);
            raw.putSize(sze);
            raw.putString(io.address);
            raw.write(data);
            if (push) {
                parent.pushTX(raw);
            } else parent.send(raw);
        }
        return io;
    }
}
/** **Drives a TCP Socket**. 
 * 
 * That be used as MQTT Connection          */
class MQTTSocket extends MQTTStream {
    /** MQTT TCP Connection
     * 
     * @param {IOServer} parent 
     * @param {net.Socket} sock             */
    constructor(parent, sock) {
        super(parent);
        /** @type {net.Socket}              */
        this._socket = sock;
        /** @type {Array<IOTxBuffer>}       */
        this._txbuffer = [];
        /** TX Flag @type {Boolean}         */
        this._txflag = false;
        /** close request @type {Boolean}   */
        this._closeflag = false;
        /** close request @type {Boolean}   */
        this._closebags = false;
        /** close flag @type {Boolean}      */
        this._hwclosed = false;
        /** alive thread                    */
        this._tmalive = null;
        /** @type {Record<String, MQTTBag>} */
        this.bags = {};
    }
    /** Adds a new Child Connection
     * 
     * @param {String} address 
     * @returns {MQTTBag}       */
    addBag(address) {
        let io = this;
        let /** @type {MQTTBag} */ child = null;
        address = Fn.asString(address).trim();
        if (address) {
            if (!(address in io.bags)) {
                io.bags[address] = new MQTTBag(
                    io, address);
                child = io.bags[address];
                child.open();
            }
            child = io.bags[address];
        }
        return child;
    }
    /** Gets a Child Connection from this Stream
     * 
     * @param {String} address 
     * @returns {MQTTBag}   */
    getBag(address) {
        let io = this;
        let /** @type {MQTTBag} */ child = null;
        address = Fn.asString(address).trim();
        if (address && (address in io.bags)) {
            child = io.bags[address];
        }
        return child;
    }
    /** Remove a Child Connection from this Stream
     * 
     * @param {String} address 
     * @returns {Boolean}           */
    removeBag(address) {
        let io = this;
        let child = io.getBag(address);
        if (child) {
            if (io.wspace) {
                io.wspace.removeClient(child);
            }
            let addr = child.address;
            delete (io.bags[addr]);
            if (io._closebags) {
                let keys = Object.keys(io.bags);
                if (keys.length === 0) {
                    setImmediate(() => {
                        io._closebags = false;
                        io.close();
                    });
                }
            }
            return true;
        }
        return false;
    }
    //
    _HwClose() {
        let io = this;
        if (io._socket && !io._hwclosed) {
            io._hwclosed = true;
            try {
                io._socket.destroy();
            } catch (err) { }
        }
    }
    //
    close(reason) {
        let io = this;
        if (io.state !== "closed") {
            if (!io.reason) io.reason = reason;
            switch (io.state) {
                case "attached":
                case "connected":
                    io.setState("closing");
                    break;
            }
            if (io._socket) {
                let bags = Object.keys(io.bags);
                if (bags.length > 0) {
                    io._closebags = true;
                    bags.map((addr) => {
                        let bag = io.bags[addr];
                        bag.disconnect(IOREASON.SOCKET_CLOSED);
                    });
                    return io;
                }
                if (io._txflag) {
                    io._closeflag = true;
                    return io;
                }
                if (!io._hwclosed) {
                    return io._HwClose();
                }
            }
            io._socket = null;
            io.setState("closed");
            //-----------------------------------------------
            if (io.wspace) {
                io.wspace.removeClient(io);
            }
            if (io.parent instanceof IOServer) {
                let server = io.parent;
                let addr = io.address;
                server.removeClient(addr);
                return io;
            }
            setTimeout(() => { io.reconnect(); });
        }
        return io;
    }
    /** **MQTT Stream**: Open/Starts this MQTT Connection.
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType} opts 
     * @returns {MQTTStream}    */
    open(opts) {
        let io = this;
        if (io.state === "closed") {
            Fn.update(io.options, opts);
            io.options = Fn.update({
                keepalive: 10
            }, io.options);
            io.setState("connecting");
            //-------------------------------------
            if (io.tls) io.tls.clear();
            io.receptor = new MQTTReceptor(io);
            io._txbuffer =  /**/[];
            io._hwclosed =  /**/ false;
            io._txflag =    /**/ false;
            io._closeflag = /**/ false;
            io._closebags = /**/ false;
            io.rcnxflag =   /**/ false;
            //-------------------------------------
            let created = false;
            if (!io._socket) {
                io._socket = new net.Socket({
                    allowHalfOpen: true
                });
                created = true;
            }
            if (io._socket) {
                io._socket.on("data", (data) => {
                    io.emit("rx", data, io);
                    io.receive(data);
                });
                io._socket.on("error", (err) => {
                    io.onError(err);
                    if (io.state === "connecting") {
                        io._socket = null;
                        io.close();
                    }
                });
                io._socket.on("close", () => {
                    io._socket = null;
                    io.close();
                });
                io._socket.on("end", () => {
                    io._socket = null;
                    io.close();
                });
                if (created) {
                    let host = Fn.getString(io.options, ["host", "url"]);
                    let port = Fn.getNumber(io.options, ["port"]);
                    io._socket.connect({
                        host: host,
                        port: port,
                    }, () => {
                        io.address = IOStream.getAddress(io._socket);
                        io.setState("connected");
                        //----------------------------------
                        io._tmalive = setInterval(() => {
                            if (io.isOpen()) {
                                return io.checkAlive();
                            }
                            clearInterval(io._tmalive);
                            io._tmalive = null;
                        }, 100);
                        //----------------------------------
                        // Checks if have security
                        let tls = io.tls;
                        if (tls) {
                            return tls.clientHello();
                        }
                        io.connect();
                    });
                    return io;
                }
                io.address = IOStream.getAddress(io._socket);
                io.setState("connected");
                return io;
            }
            io.setState("closed");
        }
        return io;
    }
    /** Transmit using fixed sized packages */
    _HwTxLoop() {
        let io = this;
        if (!io._socket || io._hwclosed) {
            io._txbuffer = [];
            io._txflag = false;
            io._closeflag = false;
            return;
        }
        if (io._txbuffer.length > 0) {
            let tx = io._txbuffer[0];
            if (tx.offset < tx.data.length) {
                let off = tx.offset;
                let sze = tx.data.length - off;
                if (sze > PACKET_SIZE) sze = PACKET_SIZE;
                tx.offset += sze;
                //
                let bff = tx.data.slice(off, tx.offset);
                bff = Buffer.from(bff);
                try {
                    if (!io._socket || io._hwclosed) {
                        io._txbuffer = [];
                        io._txflag = false;
                        io._closeflag = false;
                        return;
                    }
                    io.emit("tx", bff, io);
                    io._socket.write(bff, (err) => {
                        if (err) {
                            io._txbuffer = [];
                            io._txflag = false;
                            io._closeflag = false;
                            io.parent.reason = IOREASON.SOCKET_ERROR;
                            return io._HwClose();
                        }
                        setImmediate(() => { io._HwTxLoop(); });
                    });
                } catch (err) { console.error(err); }
                return setImmediate(() => { io._HwTxLoop(); });
            }
            io._txbuffer = io._txbuffer.slice(1);
            return setImmediate(() => { io._HwTxLoop(); });
        }
        io._txflag = false;
        if (io._closeflag) {
            io._closeflag = false;
            io._HwClose();
        }
    }
    /** Adds to transmission Buffer */
    pushTX(data) {
        let io = this;
        if (io._socket && !io._hwclosed) {
            io._txbuffer.push(new IOTxBuffer(data));
            if (!io._txflag) {
                io._txflag = true;
                setImmediate(() => { io._HwTxLoop(); });
            }
        }
        return io;
    }
    //
    send(data) {
        let io = this;
        io.lastTx = Fn.millis();
        if (io._socket && !io._hwclosed) {
            if (data instanceof RawBuffer) {
                let secured = true;
                let tpe = data.bytes[0] & 0xf0;
                switch (tpe) {
                    case 0: // Bag packets
                    case PACK_TYPE.CONNECT:
                    case PACK_TYPE.PUBLISH:
                    case PACK_TYPE.SUBSCRIBE:
                    case PACK_TYPE.UNSUBSCRIBE:
                        break;
                    default:
                        secured = false;
                        break;
                }
                if (secured) {
                    data = io.encrypt(data.bytes);
                }
                return io.pushTX(data);
            }
        }
        return io;
    }
}
/** Drives a MQTT Client Connection */
class MQTTClient extends MQTTSocket {
    constructor(parent, sock) {
        super(parent, sock);
    }
    /** **MQTT Client**: Checks connection 
         * still alive.                         */
    checkAlive() {
        let io = this;
        if (io.isOpen()) {
            if (io.receptor) {
                io.receptor.checkTimeout();
            }
            let ta = Fn.getNumber(io.options, [
                "keepalive",
                "timeout"]);
            if (ta > 0) {
                let tm = Fn.millis();
                let tc = ta * 450;
                let t0 = tm - io.lastRx;
                let t1 = tm - io.lastTx;
                if ((t0 > tc) || (t1 > tc)) {
                    t1 = tm - io.procTm;
                    if (t1 > tc) {
                        io.procTm = tm;
                        io.ping();
                    }
                }
                tc = ta * 1100;
                if (t0 > tc) {
                    io.onError("timeout");
                    io.disconnect(IOREASON.TIMEOUT);
                }
            }
        }
    }
    //
    reconnect() {
        let io = this;
        io._socket = null;
        io._txbuffer = [];
        io._txflag = false;
        io._hwclosed = false;
        io._closeflag = false;
        io._closebags = false;
        if (!io.rcnxflag) {
            let tout = Fn.getNumber(
                io.options,
                ["reconnect"]);
            if (tout > 1) {
                io.rcnxflag = true;
                setTimeout(() => {
                    io.rcnxflag = false;
                    io.open();
                }, tout);
            }
        }
        return io;
    }
}
//
export {
    IOREASON, PACK_TYPE,
    MQTTTopic,
    MQTTMessage,
    MQTTSecure,
    MQTTWorkspace,
    MQTTStream,
    MQTTBag,
    MQTTSocket,
    MQTTClient,
    MQTT,
};
