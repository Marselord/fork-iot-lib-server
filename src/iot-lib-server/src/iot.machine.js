import { EventListener, Fn } from "./utilities.js";
import { ERROR_TABLE } from "./constants.js";
import { MQTTMessage, MQTTTopic, MQTTClient } from "../iot-lib-server.js";
import { VendOrder } from "./vend.order.js";

/** Get the Parameters from given QR
 * 
 * @param {String} qr 
 * @returns {Record<String,String>} */
function getQRParameters(qr) {
    let map = {};
    qr = qr.substring(qr.lastIndexOf("?") + 1).trim();
    let args = qr.split("&");
    args.map((v) => {
        let pos = v.indexOf("=");
        if (pos > 0) {
            let key = v.substring(0, pos);
            let val = v.substring(pos + 1);
            map[key] = val;
        } else map[v] = "true";
    });
    return map;
}
/** QR Object
 * 
 * Container for QR field   */
class QRObject {
    constructor(data) {
        /** @type {String}  */
        this.storeId = "";
        /** @type {String}  */
        this.laneId = "";
        /** @type {String}  */
        this.code = "";
        this.__init(data);
    }
    __init(data) {
        let qr = "";
        if (Fn.isMap(data)) {
            qr = Fn.getString(data, ["qr", "qrcode", "code", "dispenserqr"]);
        } else if (typeof data === "string") {
            qr = data;
        }
        qr = qr.trim();
        if (qr) {
            let map = getQRParameters(qr);
            this.storeId = Fn.getString(map, ["s", "sto", "store"]);
            this.laneId = Fn.getString(map, ["l", "d", "lane"]);
        }
        this.code = qr;
    }
}
/** **Drives a IOT Device**.
 * 
 * Base Class to drive a IOT Device using Http Request  */
class HTTPDevicesDriver {
    constructor(parent) {
        this.parent = parent;
    }
    _init(_args) { }
    /** Machine Activate Request
     * 
     * Used to starts the vend.
     * 
     * Parameters:
     *  - ***qr***: Identifies the machine
     *  - ***items*** Array that Describe the vend
     *    - ***lane_id***: Lane Identity
     *    - ***quantity***: How many products 
     *  - ***member***: Member Data
     *    - ***member_id*** OR
     *    - ***phone_number*** and ***phone_code*** and ***member_type*** OR
     *    - ***document_number*** and ***document_type*** and ***member_type***.
     * 
     *  Example:
     * ```json
     * {
     *     "qr": "http://dominio/?S=1&L=1",
     *     "items": [
     *          {
     *              "laneId": "25",
     *              "quantity": 1
     *          }
     *     ],
     *     "member": {
     *       "memberId": 2345
     *     }
      * }
     * ```
     *     
     * @param {Record<String,Object>} _data 
     * @returns {Promise<String,Object>}    */
    doActivate(_data) {
        const fpromise = new Promise((resolve) => {
            resolve({ error: "Not implemented yet", });
        });
        return fpromise;
    }
    /** Returns the current state of the Machine.
     * 
     * Parameters:
     *  - Get only machine information.
     *    - ***qr***: Machine Identity
     * 
     *  - Get the vend state
     *    - ***qr***: Machine Identity
     *    - ***token***: Vend Identity  
     * 
     * @param {Record<String,Object>} _data 
     * @returns {Promise<String,Object>}    */
    doState(_data) {
        const fpromise = new Promise((resolve) => {
            resolve({ error: "Not implemented yet", });
        });
        return fpromise;
    }
    /** Returns information about the Machine
     * 
     * Parameters:
     *  - ***qr***: Machine Identity
     * 
     * @param {Record<String,Object>} _data 
     * @returns {Promise<String,Object>}    */
    doInfo(_data) {
        const fpromise = new Promise((resolve) => {
            resolve({ error: "Not implemented yet", });
        });
        return fpromise;
    }
}
/** IOT Device Base Object      */
class IOTDeviceClass extends EventListener {
    /** **IOT Device Base Object**
     * 
     * Container for a IOT Device
     * 
     * @param {Object} parent 
     * @param {String} topic    
     * @param {Record<String,*>} args */
    constructor(parent, topic, args) {
        super();
        /** @type {Object}      */
        this.parent = parent;
        /** @type {String}      */
        this.topic = "";
        /** @type {String}      */
        this.deviceId = "";
        /** @type {import("./iot.defines").IOT.IOTDeviceStateEnum}*/
        this.state = "none";
        /** The device data.
         * 
         * Contains the data for "device.status.response"
         * @type {import("./iot.defines").IOT.IOTDeviceOptsDataType}*/
        this.deviceData = {};
        /** Process Timestamp @type {Number}*/
        this.proctime = Fn.millis();
        /** Device specific options         */
        this.options = Fn.update({}, args);
        this._init(topic);
    }
    /** Initialize Device.
     * 
     * @param {String} topic    */
    _init(topic) {
        topic = Fn.asString(topic).trim().toLowerCase();
        if (topic) {
            this.topic = topic;
            let pos = topic.lastIndexOf("/");
            this.deviceId = topic.substring(pos + 1);
        }
    }
    /** Returns the Object Options
     * @returns {Record<String.*>}          */
    getOptions() { return this.options; }
    /** Returns Object Owner
     * @returns {IOTMachineDriver}          */
    getParent() { return this.parent; }
    /** Sets properties accord given state data.
     * 
     * Attention for "device.status.response"
     * 
     * @param {Record<String,Object>} data              */
    setStateData(data) {
        if (Fn.isMap(data)) {
            this.deviceData = Fn.update({}, data);
            this.state = "ready";
        }
    }
    /** Message incoming attention.
     * 
     * @param {String|Record<String,Object>} _message   */
    mqttIncoming(_message) { }
    /** Publish/Send message to this device.
     * 
     * @param  {...any} a       */
    publish(...a) { }
}

class IOTMachineClass extends IOTDeviceClass {

    constructor(parent, topic) {
        super(parent, topic);
        /** @type {import("./iot.defines").IOT.StoreDataType}     */
        this.store = {};
        /** @type {import("./iot.defines").IOT.LaneDataType}      */
        this.lane = {};
        /** @type {import("./iot.defines").IOT.ProductDataType}   */
        this.product = {};
        /** @type {String}      */
        this.error = "";
        /** @type {VendOrder}   */
        this.order = null;
    }
    /** Returns the IOT Device information.
     * 
     * Adds the specified QR to device information.
     * 
     * @param {String} qr 
     * @returns {Promise<Record<String,Object>>}    */
    getDeviceInfo(qr) {
        const fpromise = new Promise((resolve) => {
            const device = this;
            let resp = {
                state:      /**/ device.state,
                deviceId:   /**/ device.deviceId,
                topic:      /**/ device.topic,
            };
            if (device.deviceData && device.deviceData.deviceType) {
                resp.deviceType = device.deviceData.deviceType;
            }
            if (device.lane && device.lane.nickName) {
                resp.lane = {
                    laneId:     /**/ device.lane.nickName,
                    laneType:   /**/ device.lane.laneTypeNick,
                };
                if (device.product && device.product.productId) {
                    resp.lane.product = {
                        productId:  /**/ `${device.product.productId}`,
                        name:       /**/ `${device.product.name}`,
                        nickName:   /**/ `${device.product.nickName}`,
                        metaData:   /**/ `${device.product.metaData}`,
                        imageFile:  /**/ `${device.product.imageFile}`,
                        productType:/**/ `${device.product.productTypeNick}`,
                    };
                }
            }
            if (device.store && device.store.storeId) {
                resp.store = {
                    storeId:        /**/ `${device.store.storeId}`,
                    name:           /**/ `${device.store.name}`,
                    nickName:       /**/ `${device.store.nickName}`,
                    storeType:      /**/ `${device.store.storeTypeNick}`,
                    zoneId:         /**/ `${device.store.zoneId}`,
                    zoneName:       /**/ `${device.store.zoneName}`,
                    zoneNick:       /**/ `${device.store.zoneNick}`,
                }
            }
            if (qr) resp.qr = qr;
            resolve(resp);
        });
        return fpromise;
    }
    /** Publish message with machine destiny
     * 
     * @param {*} data  */
    publish(data) {
        let device = this;
        let parent = device.getParent();
        if (parent && parent.client) {
            parent.client.publish(
                device.topic,
                data
            );
        }
    }
    /** The Vend is Complete.
     * @param {VendOrder} order     */
    vendComplete(order) {
        const device = this;
        if (!order) order = device.order;
        if (order instanceof VendOrder) {
            const driver = device.getParent();
            driver.vendComplete(order).then(() => {
                device.order = null;
                order.vender = null;
                device.state = "ready";
            });
        }
    }
}
/** Mqtt Client Module Specific     */
class MachineClient extends MQTTClient {
    constructor(parent) {
        super(parent);
        /** Process flag @type {Boolean} */
        this._wasconnected = false;
    }
    /** Close connection event       */
    onClose() {
        if (this._wasconnected) {
            this._wasconnected = false;
            Fn.error(0, `${this.name} Client Closed`);
        }
        return super.onClose();
    }
    /** Connection Event            */
    onConnect() {
        this._wasconnected = true;
        Fn.error(1, `${this.name} Client Connected`);
        return super.onConnect();
    }
    /** Error detetected
     * 
     * @param {*} err               */
    onError(err) {
        Fn.error(1,
            `${this.name} Client Error`,
            JSON.stringify(err, null, "   "));
        return super.onError(err);
    }
    /** Subscription Event
     * 
     * @param {MQTTTopic} topic     */
    onSubscribe(topic) {
        Fn.log(1,
            `${this.name} Susbcribed to`,
            topic.fullname);
        //--------------------------------------    
        /** @type {IOTMachineDriver} */
        let parent = this.parent;
        parent.mqttSubscribed(topic);

        const conn = this;
        setTimeout(() => {
            conn.publish("device/dispenser/@control", {
                action: "device.status",
            });
        });
        return super.onSubscribe(topic);
    }
    /** Publish Event
     * 
     * @param {MQTTMessage} msg     */
    onMessage(msg) {
        let payload = msg.getPayload();
        Fn.log(1,
            `${this.name} Message from`,
            msg.topic,
            JSON.stringify(payload, null, "   "));

        /** @type {IOTMachineDriver} */
        let parent = this.parent;
        parent.mqttIncoming(msg);
        return super.onMessage(msg);
    }
}
/** Drives a Specific Machines Type.        */
class IOTMachineDriver extends HTTPDevicesDriver {
    /** Driver for a specific Machine Type
     * 
     * @param {Object} parent 
     * @param {Record<String,Object>} args  */
    constructor(parent, name, args) {
        super(parent, args);
        /** The name for this driver    
         * @type {String}               */
        this.name = name;
        /** @type {Record<String,IOTMachineClass>}*/
        this.devices = {};
        /** @type {MachineClient}       */
        this.client = null;
        /** Specific Machine Type Topic Pattern. 
         * @type {String}               */
        this.topicPattern = "";
        /** Driver specific options     */
        this.options = Fn.update({}, args);
    }
    /** Starts Driver Execution.
     * 
     *  - Connect to Mqtt
     *  - Do a broadcast device status request
     *  - Register responses-
     * 
     * @param {Record<String,Object>} _args */
    start(_args) { }
    /** Gets Mqtt Client Connection
     * @returns {MachineClient}             */
    getClient() { return this.client; }
    /** Return IOT Device given its name
     * 
     * @param {String} name 
     * @returns {IOTMachineClass}           */
    getDevice(name) {
        name = Fn.asString(name).trim().toLowerCase();
        return (name && (name in this.devices))
            ? this.devices[name]
            : null;
    }
    /** Return Device Pool specific options
     * @returns {Record<String,*>}  */
    getOptions() { return this.options; }
    /** Gets the Object Owner.
     * @returns {IOTMachinePool}        */
    getParent() { return this.parent; }
    /** Create a New Vend order with specified parameters
     * @param {Record<String,Object>} params
     * @returns {VendOrder}    */
    createNewOrder(params) {
        const parent = this.getParent();
        return parent.createNewOrder(params);
    }
    /** Gets a Vend order given its UUID
     * @param {String} uuid 
     * @returns {VendOrder}             */
    getVendOrder(uuid) {
        let parent = this.getParent();
        return parent.getVendOrder(uuid);
    }
    /** Removes a previously created Vend Order.
     * 
     * @param {String} uuid 
     * @returns {Boolean}           */
    removeVendOrder(uuid) {
        let parent = this.getParent();
        return parent.removeVendOrder(uuid);
    }
    /** Returns IOT Machine that match with specified arguments.
     * 
     * @param  {...any} _args 
     * @returns {IOTMachineClass}   */
    findDeviceByID(..._args) { return null; }
    /** Returns the IOT Machine accord QR Code text.
     * 
     * @param {String} topic 
     * @returns {IOTMachineClass}   */
    findDeviceByQR(qr) {
        let prms = new QRObject(qr);
        return this.findDeviceByID(
            prms.storeId,
            prms.laneId);
    }
    /** Returns the IOT Machine accord topic path.
     * 
     * @param {String} topic 
     * @returns {IOTMachineClass}   */
    findDeviceByTopic(topic) {
        topic = Fn.asString(topic).trim().toLowerCase();
        let pos = topic.lastIndexOf("/");
        topic = topic.substring(pos + 1);
        return this.findDeviceByID(topic);
    }
    /** Reception from Mqtt Server.
     * 
     * Each driver listen its owm topics.
     * @param {MQTTMessage} _msg        */
    mqttIncoming(_msg) { }
    /** Subscription was accepted
     * @param {MQTTTopic} topic         */
    mqttSubscribed(topic) {
        const drv = this;
        setTimeout(() => {
            drv.client.publish(
                `${drv.topicPattern}/@control`,
                { action: "device.status", });
        });
    }
    /** Ends Vend Order.
     * 
     * Send request to create invoice.
     * @param {VendOrder} _order             
     * @return {Promise<Boolean>}   */
    vendComplete(_order) {
        const fpromise = new Promise((resolve) => {
            resolve(false);
        });
        return fpromise;
    }
    //
    // Attention for doInfo Request
    //
    doInfo(body) { return this.doState(body); }
    //
    // Attention for doState Request
    //
    doState(body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const driver = this;
                /** @type {import("./iot.defines").IOT.VendRequestDataType}*/
                const data = Fn.toCamelCase(body);
                const qr = new QRObject(body);
                if (!qr.storeId) {
                    return resolve({
                        state: "error",
                        error: ERROR_TABLE.qrNotSpecified,
                    });
                }
                if (data.token) {
                    let order = driver.getVendOrder(data.token);
                    if (order) {
                        let resp = order.getResponse();
                        if (order.state === "complete") {
                            driver.removeVendOrder(order.uuid);
                        }
                        return resolve(resp);
                    }
                    return resolve({
                        qr: qr.code,
                        state: "complete",
                        token: data.token,
                    });
                }
                let device = driver.findDeviceByID(
                    qr.storeId,
                    qr.laneId);
                if (device) {
                    let resp = await device.getDeviceInfo(data.qr);
                    return resolve(resp);
                }
                return resolve({
                    qr: qr.code,
                    state: "error",
                    error: ERROR_TABLE.machineError,
                });
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
}
/** IOT Machine Pool Base Class           
 * 
 * A Collection of Machine Drivers.         */
class IOTMachinePool extends HTTPDevicesDriver {
    /** **Machine Pool** Base Class.
     * 
     * A Collection of Machine Drivers.
     * 
     * @param {Object} parent 
     * @param {Record<String,Object>} args          */
    constructor(parent, args) {
        super(parent, args);
        /** Drivers Collection 
         * 
         * @type {Record<String,IOTMachineDriver> } */
        this.drivers = {};
        /** Orders in progress.
         * @type {Record<String, VendOrder>}        */
        this.vendOrders = {};
        /** Object Options 
         * @type {Record<String,*>}                 */
        this.options = Fn.update({}, args);
    }
    /** Initialize this object              */
    _init(_args) { }
    /** Returns the Device Driver given its name
     * @param {String} name 
     * @returns {IOTMachineDriver}          */
    getDriver(name) {
        name = Fn.asString(name).trim().toLowerCase();
        return (name && (name in this.drivers))
            ? this.drivers[name]
            : null;
    }
    /** Returns the Object Options
     * @returns {Record<String.*>}          */
    getOptions() { return this.options; }
    /** Returns Object Owner
     * @returns {HTTPServer}                */
    getParent() { return this.parent; }
    /** Adds a new Machine Driver Class
     * 
     * @param {String} name 
     * @param {IOTMachineDriver} driver     
     * @returns {IOTMachineDriver}  */
    addDriver(name, driver) {
        name = Fn.asString(name).trim().toLowerCase();
        if (name && (driver instanceof IOTMachineDriver)) {
            this.drivers[name] = driver;
            return this.drivers[name];
        }
        return null;
    }
    /** Gets the Device Driver given its name
     * 
     * @param {String} name 
     * @returns {IOTMachineDriver}  */
    getDriver(name) {
        name = Fn.asString(name).trim().toLowerCase();
        return (name && (name in this.drivers))
            ? this.drivers[name]
            : null;
    }
    /** Create a New Vend order with specified parameters
     * 
     * @param {Record<String,Object>} params
     * @returns {VendOrder}         */
    createNewOrder(params) {
        const pool = this;
        let uuid = Fn.createUUID();
        while (uuid in pool.vendOrders) {
            uuid = Fn.createUUID();
        }
        pool.vendOrders[uuid] = new VendOrder(uuid, params);
        return pool.vendOrders[uuid];
    }
    /** Gets a Vend order given its UUID
     * 
     * @param {String} uuid 
     * @returns {VendOrder}         */
    getVendOrder(uuid) {
        const pool = this;
        uuid = Fn.asString(uuid).trim();
        return uuid in pool.vendOrders
            ? pool.vendOrders[uuid]
            : null;
    }
    /** Removes a previously created Vend Order.
     * 
     * @param {String} uuid 
     * @returns {Boolean}           */
    removeVendOrder(uuid) {
        const pool = this;
        let order = pool.getVendOrder(uuid);
        if (order) {
            uuid = order.uuid;
            delete (pool.vendOrders[uuid]);
            return true;
        }
        return false;
    }
    /** Gets the driver from request
      * 
      * @param {Record<String,Object>} _body 
      * @returns {Promise<IOTMachineDriver>} */
    getDriverFromRequest(_body) {
        const fpromise = new Promise((resolve) => {
            return resolve(null);
        });
        return fpromise;
    }
    //
    doActivate(body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const drv = await this.getDriverFromRequest(body);
                if (drv) {
                    let resp = await drv.doActivate(body);
                    return resolve(resp);
                }
                return resolve({ error: ERROR_TABLE.machineError, });
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    //
    doInfo(body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const drv = await this.getDriverFromRequest(body);
                if (drv) {
                    let resp = await drv.doInfo(body);
                    return resolve(resp);
                }
                return resolve({ error: ERROR_TABLE.machineError, });
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    //
    doState(body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const drv = await this.getDriverFromRequest(body);
                if (drv) {
                    let resp = await drv.doInfo(body);
                    return resolve(resp);
                }
                return resolve({ error: ERROR_TABLE.machineError, });
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
}
export { HTTPDevicesDriver, IOTDeviceClass, IOTMachineClass, IOTMachineDriver, IOTMachinePool, getQRParameters, QRObject, MachineClient };