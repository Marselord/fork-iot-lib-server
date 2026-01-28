/**
 * HTTP REQUEST 
 */
//
import http from "http";
import https from "https";
import { Fn } from "./utilities.js";
import { AESAlgorithm, Se } from "./tls.module.js";
//
/** Container for a Http Request*/
class HTTPRequest {
    constructor(opts, body) {
        /** @type {String}      */
        this.method = "";
        /** @type {String}      */
        this.host = "";
        /** @type {String}      */
        this.url = "";
        /** @type {String}      */
        this.path = "";
        /** @type {import("./iot.defines").IOT.HeaderDataType} */
        this.headers = {};
        /** @type {Record<String,Object>}   */
        this.body = null;
        //--------------------------------- */
        Fn.update(this, opts);
        if (typeof body === "object") {
            this.body = Fn.update({}, body);
        } else if (!Fn.isNull(body)) {
            this.body = Fn.asString(body);
        }
    }
}
/** **Response from Http Request**      */
class HTTPResponse {
    /** **Response from Http Request**.
     * 
     * @param {Error|String} err 
     * @param {Number} status 
     * @param {String} statusText 
     * @param {Record} headers 
     * @param {*} body  */
    constructor(err, status, statusText, headers, body) {
        /** @type {Error|String}            */
        this.error = err;
        /** @type {Number}                  */
        this.status = Fn.asNumber(status);
        /** @type {String}                  */
        this.statusText = Fn.asString(statusText);
        /** @type {Headers}                 */
        this.headers = Fn.update({}, headers);
        /** @type {Record<String,Object>}   */
        this.body = Fn.toMapObject(body);
        /** Indicate that body was processed.
         * @type {Boolean}                  */
        this._processed = false;
        /** Inidicate that body was previously unziped.
         * 
         * Use when action is from native function `fetch`
         * @type {Boolean}                  */
        this._unzipped = false;
    }
    /** **Get Header from this Response**.
     * @param {import("./iot.defines").IOT.HeaderNamesEnum} name 
     * @returns {String}    */
    getHeader(name) {
        return Fn.getHeader(name, this.headers);
    }
    /** **Get response body**.
     * 
     * @returns {Promise<Record<String,Object>>} */
    json() {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let resp = this;
                let body = resp.body;
                if (typeof body === "string") {
                    let /** @type {String} */ t0 = resp.body;
                    if (t0.startsWith("base64:")) {
                        let b0 = Se.decodeBase64(t0.substring(7));
                        body = Se.asString(b0);
                    }
                }
                body = Se.asString(body);
                try {
                    let map = JSON.parse(body);
                    body = map;
                } catch (e) { }
                resp.body = body;
                resolve(body);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
}
/** **Http Request**.
 * 
 * Sends a Http Request accord arguments.
 * 
 * ***Server Side***
 * 
 * @param {import("./iot.defines").IOT.HTTPRequestType} req 
 * @param {Record<String,Object>} data 
 * @return {Promise<HTTPResponse>}  */
function doHttpRequest(req, data) {
    const fpromise = new Promise((resolve) => {
        //-----------------------------------------------
        // Adjust arguments
        if (!Fn.isNull(data)) req.body = Fn.update({}, data);
        //-----------------------------------------------
        const fasync = () => {
            let /** @type {http.ClientRequest}  */ client;
            let rxbuffer = Buffer.from([]);
            //-------------------------------------------
            let ishttp = false;
            let host = req.host || req.url;
            if (host.startsWith("https://")) {
                host = host.substring(8);
            } else if (host.startsWith("http://")) {
                ishttp = true;
                host = host.substring(7);
            }
            if (host.includes(":")) {
                let port = 0;
                let pos1 = host.indexOf(":");
                let pos2 = host.indexOf("/");
                if (pos2 > pos1) {
                    port = parseInt(host.substring(pos1 + 1, pos2));
                    req.path = host.substring(pos2);
                } else port = parseInt(host.substring(pos1 + 1));
                host = host.substring(0, pos1);
                if (!isNaN(port)) req.port = port;
            } else {
                let pos1 = host.indexOf(".");
                let pos2 = host.indexOf("/");
                if (pos2 > pos1) {
                    if (!req.path) req.path = "";
                    req.path = `${host.substring(pos2)}${req.path}`;
                    host = host.substring(0, pos2);
                }
            }
            req.host = host;
            if (req.port) req.port = Fn.asNumber(req.port);
            delete (req.url);
            //-------------------------------------------
            if (!req.path)    /**/ req.path = "/";
            if (!req.headers) /**/ req.headers = {};
            if (!req.method)  /**/ req.method = req.body ? "POST" : "GET";
            //-------------------------------------------
            const geterror = (err) => {
                if (typeof err === "string") return err;
                if (typeof err === "number") return err.toString();
                let t0 = err.message || err.code;
                if (!t0) t0 = "UNKNOWN";
                //------------------------------------
                let t1 = ishttp ? "https://" : "http://";
                t1 += req.host;
                if (req.port) t1 += `:${req.port}`;
                t1 += req.path;
                //------------------------------------
                t0 = `${t0} from '${t1}'`;
                return t0;
            };
            //----------------------------------------
            /**
             * @param {Error|String} err 
             * @param {http.IncomingMessage} incoming */
            const lauchresp = (err, incoming) => {
                if (err) err = geterror(err);
                let headers = {};
                Object.entries(incoming.headers).map((v) => {
                    headers[v[0]] = v[1];
                });
                let body = "";
                if (rxbuffer.byteLength > 0) {
                    let t1 = Se.asString(rxbuffer);
                    if (t1.startsWith("base64:")) {
                        body = t1;
                    } else {
                        body = `base64:${Se.encodeBase64(rxbuffer)}`;
                    }
                }
                resolve(new HTTPResponse(
                    err,
                    incoming.statusCode,
                    incoming.statusMessage,
                    headers,
                    body));
            }
            //------------------------------------------------
            /** @param {http.IncomingMessage} incoming */
            const receive = (incoming) => {
                incoming.on("data", (chunk) => {
                    rxbuffer = Buffer.concat([rxbuffer, chunk]);
                });
                incoming.on("error", (err) => {
                    lauchresp(err, incoming);
                });
                incoming.on("end", () => {
                    lauchresp(null, incoming);
                });
            };
            client = ishttp
                ? http.request(req, (res) => { receive(res); })
                : https.request(req, (res) => { receive(res); });
            client.on("error", (err) => {
                let txt = geterror(err);
                resolve(new HTTPResponse(txt));
            });
            let bff = Fn.asBuffer(req.body);
            client.write(bff);
            client.end();
        };
        setImmediate(() => { fasync(); });
    });
    return fpromise;
}
export { doHttpRequest, HTTPRequest, HTTPResponse };
