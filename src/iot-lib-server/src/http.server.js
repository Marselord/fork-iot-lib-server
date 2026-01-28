/**
 * Drives a HTTP Server.
 * 
 * Each incoming connection as HTTP Session.
 * 
 * Each session contains request and response objects.
 * Adds a issuer control and provies security layer.
 * 
 * @author Henry Penuela
 * @date   2025-06-26
 * 
 */

import crypto from "crypto";
import http from "http";
import { EventListener, Fn } from "./utilities.js";
import { AESAlgorithm, DiffieHellman, Se } from "./tls.module.js";
import { HTTPResponse } from "./http.request.js";
import { DatabasePool } from "./db.driver.js";

/** Http Issuer
 * 
 * Refer to secure requests                 */
class HTTPIssuer {
    /** Http Issuer
     * 
     * Container for secure layer.
     * @param {HTTPServer} parent 
     * @param {String} sessionid            */
    constructor(parent, sessionid) {
        /** @type {HTTPServer}              */
        this.parent = parent;
        /** @type {String}                  */
        this.sessionId = "" + sessionid;
        /** @type {import("./iot.defines").IOT.IssuerUserDataType } */
        this.userData = {};
        /** @type {AESAlgorithm}            */
        this.aes = null;
        /** @type {DiffieHellman}           */
        this.dfm = null;
        /** @type {Number}                  */
        this.proctime = Fn.millis();
        /** Current State @type {Boolean}   */
        this.secured = false;
        /** Refers to security type.
         * 
         * Options:
         *  - "basic",
         *  - "bearer",
         *  - "application"
         * 
         * @type {String}                   */
        this.ctype = "";
        /** Process Flag @type {Boolean}    */
        this.procflag = false;
    }
    /** Sets Algorithm Keys.
     * @param {Buffer} key                  */
    setKeys(key) {
        let issuer = this;
        issuer.aes = new AESAlgorithm(key);
    }
    /** From cipher to plain text.
     * 
     * @param {Object} data 
     * @returns {Promise<Buffer>}           */
    decrypt(data) {
        let issuer = this;
        if (!issuer.aes) {
            const fpromise = new Promise((resolve) => {
                resolve(null);
            });
            return fpromise;
        }
        return issuer.aes.decrypt(data);
    }
    /** From plain to cipher text.
     * 
     * @param {Object} data 
     * @returns {Promise<Buffer>}           */
    encrypt(data) {
        let issuer = this;
        if (!issuer.aes) {
            const fpromise = new Promise((resolve) => {
                resolve(null);
            });
            return fpromise;
        }
        return issuer.aes.encrypt(data);
    }
}
/** Store for used keys.
 * 
 * Avoid duplicate secure key use   */
class HTTPUsedKey {
    constructor(key) {
        /** @type {String}          */
        this.key = key;
        /** @type {Number}          */
        this.proctime = Fn.millis();
    }
}
/** **Http Session**.
 * 
 * Container for Http Request.      */
class HTTPSession {
    constructor(server, req, rsp) {
        /** @type {HTTPServer}              */
        this.server = server;
        /** @type {http.IncomingMessage}    */
        this.request = req;
        /** @type {http.ServerResponse<http.IncomingMessage>}  */
        this.response = rsp;
        /** @type {Record<String,Object>}   */
        this.body = {};
        /** @type {HTTPIssuer}              */
        this.issuer = null;
        /** @type {Buffer}                  */
        this._indata = Buffer.from([]);
        /** Request Identity @type {String} */
        this._mid = "";
        /** Process Flag @type {Boolean}    */
        this._flagclose = false;
    }
    /** **Close the HTTP Request**.
     * 
     * @param {Object} body 
     * @param {Number} code 
     * @returns {Boolean}       */
    close(body, code) {
        if (this._flagclose) return false;
        if (typeof body === "number") {
            code = body;
            body = null;
        }
        if (typeof code !== "number") code = 200;
        this._flagclose = true;
        //-------------------------------------------------
        const fnclose = async () => {
            let session = this;
            let response = session.response;
            let ctype = "application/json";
            //---------------------------------------------
            // Adds security Headers
            let issuer = session.issuer;
            if (issuer) {
                let s0 = issuer.sessionId;
                let b0 = await issuer.encrypt(s0);
                let s1 = Se.encodeBase64(b0);
                response.setHeader("x-sessionid", s0);
                response.setHeader("x-authorization", s1);
            }
            //---------------------------------------------
            // Encrypt Response Body
            let rdata = Fn.isMap(body)
                ? Fn.update({}, body)
                : !Buffer.isBuffer(body)
                    ? Fn.asString(body)
                    : body;
            if (!Buffer.isBuffer(body)) {
                if (body) {
                    if (Fn.isMap(body) && session._mid) {
                        body["@:mid"] = session._mid;
                    }
                    if (issuer) {
                        let b0 = await Se.gzip(body);
                        let b1 = await issuer.encrypt(b0);
                        body = b1;// `base64:${Se.encodeBase64(b1)}`;
                        ctype = "application/octet-stream";

                    } else {
                        if (typeof body === "string") {
                            ctype = "text/html;charset=utf-8";
                        }
                        body = await Fn.gzip(body);
                        response.setHeader("content-encoding", "gzip");
                    }
                }
                let dtype = response.getHeader("content-type");
                if (!dtype) {
                    response.setHeader("content-type", ctype);
                }
            }
            //---------------------------------------------
            // Send Response and close request.
            let data = Se.asBuffer(body);
            response.writeHead(code);
            response.write(data);
            response.end(() => {
                session.onClose(rdata, code);
            });
        };
        setImmediate(() => fnclose());
        return true;
    }
    /** **Send Error and close the request**.
     * 
     * @param {Error|String} err 
     * @param {Number} code 
     * @returns {Boolean}       */
    error(err, code) {
        if (this._flagclose) return false;
        if (typeof err === "number") {
            code = err;
            err = "";
        }
        if (err && err.code)    /**/ err = err.code;
        if (err && err.message) /**/ err = err.message;
        if (!Fn.isMap(err)) {
            let txt = Fn.asString(err);
            if (txt) err = { error: txt };
        }
        if (typeof code !== "number") code = 400;
        return this.close(err, code);
    }
    /** Check security timestamp
     * @param {*} b0 
     * @returns {Boolean}           */
    _checkTimestamp(b0) {
        let t0 = Fn.asString(b0);
        if (t0) {
            let n0 = Fn.asNumber(t0);
            let n1 = Date.now();
            let n2 = Math.abs(n1 - n0);
            return n2 < 60000;
        }
        return false;
    }
    /** Parse the request body      */
    async _parseBody(unsec) {
        let session = this;
        let txt = "";
        if (session._indata.length > 0) {
            let zipped = session.getHeader("content-encoding") === "gzip";
            let b0 = Buffer.from(session._indata);
            if (zipped) {
                b0 = await Fn.gunzip(b0);
                let t0 = b0.toString("utf-8");
                if (t0.startsWith("base64:")) {
                    t0 = t0.substring(7);
                    b0 = Fn.decodeBase64(t0);
                }
            }
            if (session.issuer && !unsec) {
                let issuer = session.issuer;
                let t0 = b0.toString("utf-8");
                if (t0.startsWith("base64:")) {
                    t0 = t0.substring(7);
                    b0 = Fn.decodeBase64(t0);
                    b0 = await issuer.decrypt(b0);
                    b0 = await Fn.gunzip(b0);
                    t0 = b0.toString("utf-8");
                }
                txt = t0;

            } else {
                let t0 = b0.toString("utf-8");
                if (t0.startsWith("base64:")) {
                    t0 = t0.substring(7);
                    b0 = Fn.decodeBase64(t0);
                    t0 = b0.toString("utf-8");
                }
                txt = t0;
            }
        }
        if (txt) {
            try {
                let map = JSON.parse(txt);
                if ("@:mid" in map) {
                    session._mid = map["@:mid"];
                    delete (map["@:mid"]);
                }
                return map;
            } catch (e) { }
        }
        return txt;
    }
    /** Reject the Request */
    _validError(err) {
        this.onReject(err);
        return false;
    }
    /** Request has security
     * @param {HTTPIssuer} issuer   
     * @param {Boolean} unsec  `true` if cipher disabled. */
    async _validOk(issuer, unsec) {
        let session = this;
        session.issuer = issuer;
        session.body = await session._parseBody(unsec);
        if (issuer) {
            issuer.secured = true;
            issuer.proctime = Fn.millis();
        }
        return true;
    }
    /** Set request security    */
    async _validRequest() {
        let /** @type {HTTPIssuer} */ issuer;
        let session = this;
        let server = session.server;
        //
        let sessionid = session.getHeader("x-sessionid");
        let xtimestamp = session.getHeader("x-timestamp");
        if (xtimestamp) {
            let /** @type {Array<Buffer>} */ fields;
            fields = xtimestamp.split(".");
            fields.map((v, k) => fields[k] = Fn.decodeBase64(v));
            if ((fields.length > 2)
                && (fields[0].length === fields[1].length)
                && (fields[0].length >= 64)) {
                //-----------------------------------------------------
                // Assure not previous key usage.
                let kid = fields[0].toString("hex");
                if (kid in server.usedkeys) {
                    return session._validError("Keys already used");
                }
                server.usedkeys[kid] = new HTTPUsedKey(kid);
                //-----------------------------------------------------
                // Check for timestamp
                let aes = new AESAlgorithm(fields[0]);
                let b0 = await aes.decrypt(fields[2]);
                if (session._checkTimestamp(b0)) {
                    //-------------------------------------------------
                    // Create a new issuer
                    if (sessionid) {
                        issuer = server.issuers[sessionid];
                        //if (issuer) issuer.userData = {};
                    }
                    if (!issuer) {
                        sessionid = server.nextSessionID();
                        server.issuers[sessionid] = new HTTPIssuer(
                            session.server,
                            sessionid
                        );
                        issuer = server.issuers[sessionid];
                    }
                    let b1 = Se.xor(fields[0], fields[1]);
                    let dfm = new DiffieHellman(b1);
                    let b2 = dfm.getPublic();
                    let b3 = dfm.getShared(fields[0]);
                    issuer.setKeys(b3);
                    session.addHeader("x-timestamp", b2.toString("base64url"));
                    return session._validOk(issuer, true);
                }
            }
            return session._validError("bad x-timestamp header");
        }
        if (sessionid) {
            issuer = server.issuers[sessionid];
            let auth = session.getHeader("x-authorization");
            if (issuer && auth) {
                let b1 = Fn.decodeBase64(auth);
                let b2 = (await issuer.decrypt(b1)).toString("utf-8");
                if (b2 === sessionid) {
                    return session._validOk(issuer, false);
                }
                return session._validError("bad x-authorization header");
            }
            return session._validError("session id not found");
        }
        //-----------------------------------------------------------------
        // Request no secure ...
        let auth = session.getHeader("authorization");
        if (auth) {
            let chk = await server.validAuth(auth);
            if (chk) {
                return session._validOk(null, true);
            }
        }
        let unsec = Fn.asBool(server.options.unsecure);
        if (unsec) {
            return session._validOk(null, true);
        }
        if (Array.isArray(server.options.allowedPaths)) {
            let path = session.getPath();
            if (server.options.allowedPaths.includes(path)) {
                return session._validOk(null, true);
            }
        }
        return session._validError("unsecure request");
    }
    /** Receive Request Body data
     * 
     * @returns {Boolean}       */
    receive() {
        let session = this;
        let request = session.request;
        request.on("data", (chunk) => {
            session._indata = Buffer.concat(
                [session._indata, chunk]);
        });
        request.on("error", (err) => {
            session.onError(err);
            session.error(err, 402);
        });
        request.on("end", () => {
            if (!session._flagclose) {
                const session_complete = async () => {
                    let chk = await session._validRequest();
                    if (chk) {
                        session.onData();
                        session.server.doSession(session);
                    } else session.close("", 401);
                };
                session_complete();
            }
        });
        return true;
    }
    /** Gets the remote address
     * 
     * @returns {String}        */
    getAddress() {
        let session = this;
        let addr = "";
        let request = session.request;
        if (request) {
            let ipa = session.getHeader("x-forwarded-for");
            if (!ipa) {
                let sock = request.socket;
                if (sock) {
                    addr = `${sock.remoteAddress}`
                        + `:${sock.remotePort}`;
                }
            } else addr = ipa;
        }
        return addr;
    }
    /** Append header to request response
     * 
     * @param {import("../src/iot.defines").IOT.HeaderNamesEnum} name 
     * @param {String} value            */
    addHeader(name, value) {
        let response = this.response;
        response.setHeader(name, value);
    }
    /** Get a Header from this Request
     * 
     * @param {import("../src/iot.defines").IOT.HeaderNamesEnum} name 
     * @param {import("../src/iot.defines").IOT.HeaderDataType} headers 
     * @returns {String}                */
    getHeader(name, headers) {
        let session = this;
        if (!headers) headers = session.request.headers;
        return Fn.getHeader(name, headers);
    }
    /** **HTTP Session**: Gets request path
     * 
     * @returns {String}        */
    getPath() {
        let session = this;
        let url = session.request.url.trim();
        let pos = url.indexOf("?");
        if (pos > 0) {
            url = url.substring(0, pos);
        }
        if (url.endsWith("/")) {
            url = url.substring(0, url.length - 1);
        }
        if (!url) url = "/";
        return url;
    }
    /** **Http Request Close Event**.
     * 
     * @param {Record<String,Object>} body 
     * @param {Number} code                 */
    onClose(body, code) { }
    /** **Http Request Incoming data request**.
     * 
     * The request body was received.
     * @param {Record<String,Object>} body  */
    onData(body) { }
    /** **Http Request Error Detection Event**.
     * 
     * @param {Error|String} err    */
    onError(err) { }
    /** **Http Request Connection was rejected**.
     * 
     * @param {String} reason       */
    onReject(reason) { }
}
/** Container for HTTP Request Attention Function   */
class HTTPAttentionItem {
    constructor(method, paths, cb) {
        this.method = method;
        /** @type {Array<String>}   */
        this.paths = [];
        /** @type {Function}        */
        this.cb = cb;
        if (Array.isArray(paths)) {
            this.paths = paths.slice();
        }
    }
}
/** HTTP Request Attention Function         */
class HTTPAttentionFunc {
    /**
     * @param {HTTPServer} server 
     * @param {HTTPSession} session         */
    constructor(server, session) {
        /** @type {HTTPServer}              */
        this.server = server;
        /** @type {HTTPSession}             */
        this.session = session;
        /** @type {Array<HTTPAttentionItem>} */
        this.delegates = [];
        /** @type {Number}                  */
        this.findex = 0;
        if (server && Array.isArray(server.delegates)) {
            this.delegates = server.delegates.slice();
        }
    }
    /** Verifify the array contains the given path
     * 
     * @param {String} path 
     * @param {Array<String>} paths 
     * @returns {Boolean}                   */
    containsPath(path, paths) {
        path = path.trim().toLowerCase();
        if (!path) path = "/";
        return paths.length > 0
            ? paths.includes(path)
            : true;
    }
    /** Find from registered delegates      */
    launch() {
        let drv = this;
        const fnext = () => {
            drv.findex += 1;
            return setImmediate(() => {
                drv.launch();
            });
        };
        let session = drv.session;
        if (session._flagclose) return;
        while (drv.findex < drv.delegates.length) {
            try {
                let item = drv.delegates[drv.findex];
                let ispath = drv.containsPath(
                    session.getPath(),
                    item.paths);
                let method = session.request.method.toUpperCase();
                if (ispath && ((item.method === "ANY") || (item.method === method))) {
                    return item.cb(session, fnext);
                }
                drv.findex += 1;
            } catch (e) {
                console.error("ERROR", e);
                return session.error(e, 200);
            }
        }
        return session.close({}, 200);
    }
}
/** **Listen for Incoming HTTP Request**.                       */
class HTTPServer extends EventListener {
    constructor() {
        super();
        /** @type {import("../src/iot.defines").IOT.ConnectStateEnum}   */
        this.state = "closed";
        /** @type {import("../src/iot.defines").IOT.ServerOptionsType}  */
        this.options;
        /** @type {http.Server}                                 */
        this.stream;
        /** @type {Record<String, HTTPIssuer>}                  */
        this.issuers = {};
        /** @type {Record<String, HTTPUsedKey}                  */
        this.usedkeys = {};
        /** @type {Array<HTTPAttentionItem>}                    */
        this.delegates = [];
        /** @type {String}                                      */
        this.address = "";
        /** @type {DatabasePool}                                */
        this.pool = null;
        /** Timeouts thread                                     */
        this._thread = null;
    }
    /** **Returns a** ***unique*** **session ID**.
     * 
     * @returns {String}    */
    nextSessionID() {
        let sid = Buffer.from(crypto.randomBytes(16)).toString("hex");
        while (sid in this.issuers) {
            sid = Buffer.from(crypto.randomBytes(16)).toString("hex");
        }
        return sid;
    }
    /** Checks for Current Connection State.
     * @returns {Boolean}                       */
    isClosed() { return this.state === "closed"; }
    /** Checks for Current Connection State.
     * @returns {Boolean}                       */
    isConnected() { return this.state === "connected"; }
    /** Sets a new Connection State
     * @param {import("../src/iot.defines").IOT.ConnectStateEnum} state     
     * @returns {HTTPServer}                    */
    setState(state) {
        let server = this;
        if (server.state !== state) {
            server.state = state;
            switch (state) {
                case "connected":
                    let tma = Fn.asNumber(server.options.sessionTimeout);
                    if (tma < 1) {
                        server.options.sessionTimeout = 180000;
                    }
                    if (!server._thread) {
                        server._thread = setInterval(() => {
                            server._looper();
                        }, 250);
                    }
                    server.onConnect();
                    break;
                case "closed":
                    if (server._thread) {
                        clearInterval(server, this._thread);
                        server._thread = null;
                    }
                    server.onClose;
                    break;
                default: break;
            }
        }
        return server;
    }
    /** Accepts new Incoming Request
     * 
     * @param {http.IncomingMessage} req 
     * @param {http.ServerResponse<http.IncomingMessage>} rsp 
     * @returns {HTTPSession}           */
    accept(req, rsp) {
        let server = this;
        let session = new HTTPSession(server, req, rsp);
        setImmediate(() => {
            session.receive();
        });
        return session;
    }
    /** Validate from JWT
     * 
     * @param {String} auth 
     * @returns {Promise<Boolean>}  */
    validAuth(auth) {
        const fpromise = new Promise((resolve) => {
            resolve(false);
        });
        return fpromise;
    }
    /** **Http Request Attention**.
     * 
     * Http request has body and is complete.
     * 
     * Starts request execution.
     * @param {HTTPSession} session     
     * @returns {Boolean}               */
    doSession(session) {
        let server = this;
        new HTTPAttentionFunc(server, session).launch();
    }
    /** **Start a server listening for connections**. 
     * 
     * A `net.Server` can be a TCP or an `IPC` server 
     * depending on what it listens to.
     * 
     * @param {import("../src/iot.defines").IOT.ConnectOptionsType|Number} opts 
     * @param {Function} cb                         */
    listen(opts, cb) {
        let server = this;
        if (server.state === "closed") {
            if (typeof opts === "number") {
                server.options.port = opts;
            } else if (typeof opts === "object") {
                server.options = Fn.update(server.options, opts);
            }
            server.setState("connecting");
            //-------------------------------------------------
            //
            server.stream = http.createServer((req, rsp) => {
                server.accept(req, rsp);
            });
            //-------------------------------------------------
            server.stream.on("close", () => {
                server.stream = null;
                server.setState("closed");
            });
            //-------------------------------------------------
            server.stream.on("error", (err) => {
                server.onError(err);
                if (server.state === "connecting") {
                    server.stream = null;
                    server.setState("closed");
                    if (typeof cb === "function") {
                        cb(err);
                    }
                }
            });
            //-------------------------------------------------
            server.stream.listen(
                server.options.port, "0.0.0.0", 10, () => {
                    let addr = server.stream.address();
                    server.address = `${addr.address}:${addr.port}`;
                    server.setState("connected");
                    if (typeof cb === "function") {
                        cb();
                    }
                });
            return true;
        }
        return false;
    }
    /** check timeouts  */
    _looper() {
        let server = this;
        let tme = Fn.millis();
        let names = Object.keys(server.usedkeys);
        names.map((k) => {
            let item = server.usedkeys[k];
            if (item) {
                let tm0 = tme - item.proctime;
                if (tm0 > 120000) {
                    delete (server.usedkeys[k]);
                }
            }
        });
        let tma = server.options.sessionTimeout;
        names = Object.keys(server.issuers);
        names.map((k) => {
            let issuer = server.issuers[k];
            if (issuer) {
                let tm0 = tme - issuer.proctime;
                if (tm0 > tma) {
                    delete (server.issuers[k]);
                }
            }
        });
    }
    /** Checks if allow no secure request
     * 
     * @param {String} path 
     * @returns {Boolean}           */
    allowPath(path) {
        let server = this;
        if (Array.isArray(server.options.allowedPaths)) {
            return server.options.allowedPaths.includes(path);
        }
        return false;
    }
    /** **Server Close Event**      */
    onClose() { this.emit("close", this); }
    /** **Server Connect Event**.   */
    onConnect() { this.emit("connect", this); }
    /** **Server Error Event**.
     * @param {Error|String} err    */
    onError(err) { this.emit("error", err, this); }
    /** Adds a new Delegate
     * 
     * @param {String} method 
     * @param {String|Array<String>|import("../src/iot.defines").IOT.ServerApiCallbackType} paths 
     * @param {import("../src/iot.defines").IOT.ServerApiCallbackType} cb  */
    _addAttentionItem(method, paths, cb) {
        if (typeof paths === "function") {
            cb = paths;
            paths = [];
        }
        if (typeof paths === "string") {
            paths = paths.split(",");
        }
        if (Array.isArray(paths) && typeof cb === "function") {
            let xpaths = [];
            paths.map((v) => {
                let s = v.trim().toLowerCase();
                if (s) xpaths.push(s);
            });
            this.delegates.push(new HTTPAttentionItem(method, xpaths, cb));
        }
    }
    /** Receive Request from ***ANY*** method
     * 
     * @param {String|Array<String>|import("../src/iot.defines").IOT.ServerApiCallbackType} paths 
     * @param {import("../src/iot.defines").IOT.ServerApiCallbackType} cb  */
    use(paths, cb) { return this._addAttentionItem("ANY", paths, cb); }
    /** Receive Request from ***GET*** method
     * 
     * @param {String|Array<String>|import("../src/iot.defines").IOT.ServerApiCallbackType} paths 
     * @param {import("../src/iot.defines").IOT.ServerApiCallbackType} cb  */
    get(paths, cb) { return this._addAttentionItem("GET", paths, cb); }
    /** Receive Request from ***POST*** method
     * 
     * @param {String|Array<String>|import("../src/iot.defines").IOT.ServerApiCallbackType} paths 
     * @param {import("../src/iot.defines").IOT.ServerApiCallbackType} cb  */
    post(paths, cb) { return this._addAttentionItem("POST", paths, cb); }
    /** Receive Request from ***PUT*** method
     * 
     * @param {String|Array<String>|import("../src/iot.defines").IOT.ServerApiCallbackType} paths 
     * @param {import("../src/iot.defines").IOT.ServerApiCallbackType} cb  */
    put(paths, cb) { return this._addAttentionItem("PUT", paths, cb); }
}
//
export { HTTPIssuer, HTTPSession, HTTPServer, HTTPResponse };