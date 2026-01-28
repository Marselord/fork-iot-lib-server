/**
 * Http request using secure layer
 * 
 */

import crypto from "crypto";
import { HTTPIssuer, HTTPResponse } from "./http.server.js";
import { QueryResults } from "./db.driver.js";
import { AESAlgorithm, DiffieHellman, JWT, Se } from "./tls.module.js";
import { Fn } from "./utilities.js";
import { doHttpRequest } from "./http.request.js";

/** **Http Request Using secure layer**.
 * 
 * A Client used for Server to Server request.  */
class HTTPSecureIssuer extends HTTPIssuer {
    /** **Http Request Using secure layer**.
     * 
     * A Client used for Server to Server request.
     * @param {Object} parent 
     * @param {import("./iot.defines").IOT.IssuerOptionsType} opts  */
    constructor(parent, opts) {
        super(parent, "");
        /** @type {import("./iot.defines").IOT.IssuerOptionsType}   */
        this.options = {};
        /** Logged/Unlogged state @type {Boolean}                       */
        this.logged = false;
        /** Request semaphore
         * @type {Boolean}  */
        this._onrequest = false;
        this._init(opts);
    }
    _init(opts) {
        let map = Fn.update({
            host: "http://localhost:3000",
            login_path: "/login",
            query_path: "/dbquery/request",
            proxy_path: "/proxy/request",
            session_path: "/session/secure",
            tls_data: {
                key_path: "",
                key_passed: null,
                user_name: "",
                name_type: "CITIZEN",
                member_type: "MEMBER",
            },
        }, opts);
        this.options = Fn.toCamelCase(map);
    }
    /** **Close the session for this Issuer**
     * 
     * @returns {Promise<Boolean>}  */
    close() {
        const fpromise = new Promise((resolve) => {
            let issuer = this;
            if (issuer.secured) {
                issuer.logged = false;
                let opts = issuer.options;
                issuer.doRequest(opts.loginPath, {
                    host: opts.host,
                    headers: { "authorization": "Basic 0", },
                    body: null,
                }).then(() => {
                    resolve(true);
                });
            } else resolve(true);
        });
        return fpromise;
    }
    /** Get Public Key
     * @param {Buffer} key 
     * @returns {Buffer}    */
    getPublic(key) {
        let issuer = this;
        issuer.dfm = new DiffieHellman(key);
        return issuer.dfm.getPublic();
    }
    /** Get Secret Key
     * @param {Buffer} key 
     * @returns {Buffer}    */
    getShared(key) {
        let issuer = this;
        return issuer.dfm.getShared(key);
    }
    /** Get Pattern Key
     * @param {Buffer} key 
     * @returns {Buffer}    */
    getPattern(key) {
        let b0 = Se.asBuffer(this.dfm.p);
        return Se.xor(b0, key);
    }
    /** Set the Security Headers into the Request
     * 
     * @param {import("./iot.defines").IOT.HTTPRequestType} req 
     * @returns {Promise<Boolean>}     */
    setRequestHeaders(req) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let issuer = this;
                if (issuer.secured) {
                    let b0 = await issuer.aes.encrypt(issuer.sessionId);
                    req.headers["x-authorization"] = Se.encodeBase64(b0);
                    req.headers["x-sessionid"] = issuer.sessionId;
                    if (req.body) {
                        let b2 = await Se.gzip(req.body);
                        let b3 = await issuer.aes.encrypt(b2);
                        req.body = `base64:${Se.encodeBase64(b3)}`;
                    }
                    return resolve(true);
                }
                let b0 = issuer.getPublic();
                let b1 = issuer.getPattern(b0);
                let aes = new AESAlgorithm(b0);
                let b2 = await aes.encrypt(Date.now().toString());
                let t0 = [
                    Se.encodeBase64(b0),
                    Se.encodeBase64(b1),
                    Se.encodeBase64(b2),
                ].join(".");
                req.headers["x-timestamp"] = t0;
                return resolve(true);
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** Get the Security Headers from Response
     * 
     * @param {HTTPResponse} resp
     * @returns {Promise<Boolean>}     */
    getResponseHeaders(resp) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let issuer = this;
                issuer.secured = false;
                let sid = resp.getHeader("x-sessionid");
                let tms = resp.getHeader("x-timestamp");
                if (sid && tms) {
                    let b0 = Se.decodeBase64(tms);
                    b0 = issuer.getShared(b0);
                    issuer.setKeys(b0);
                }
                let auth = resp.getHeader("x-authorization");
                if (sid && auth) {
                    let b0 = Se.decodeBase64(auth);
                    let b1 = await issuer.decrypt(b0);
                    let t1 = Se.asString(b1);
                    if (t1 === sid) {
                        issuer.sessionId = sid;
                        if ((typeof resp.body === "string") &&
                            (resp.body.startsWith("base64:"))) {
                            //---------------------------------------
                            t1 = resp.body;
                            b0 = Se.decodeBase64(t1.substring(7));
                            let t2 = Se.asString(b0);
                            if (t2.startsWith("base64:")) {
                                b0 = Se.decodeBase64(t2.substring(7));
                            }
                            b1 = await issuer.aes.decrypt(b0);
                            if (b1) {
                                let b2 = await Se.gunzip(b1);
                                resp.body = Se.asString(b2);
                                try {
                                    let map = JSON.parse(resp.body);
                                    switch (issuer.options.parseCase) {
                                        case "camel":  /**/ map = Fn.toCamelCase(map); break;
                                        case "pascal": /**/ map = Fn.toPascalCase(map); break;
                                        case "snake":  /**/ map = Fn.toSnakeCase(map); break;
                                        default: break;
                                    }
                                    resp.body = map;
                                } catch (e) { };
                                issuer.secured = true;
                                return resolve(true)
                            }
                        }
                    }
                    resp.error = "Security Authorization Error";
                    resp.body = "";
                }
                return resolve(issuer.secured);
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** **Execute the Http Request**.
     * 
     * @param {String} path
     * @param {import("./iot.defines").IOT.HTTPRequestType } req 
     * @param {Recod<String,Object>} data 
     * @returns {Promise<HTTPResponse>}     */
    _doRequest(path, req, data) {
        const fpromise = new Promise((resolve) => {
            let issuer = this;
            let opts = issuer.options;
            if (!Fn.isMap(req))   /**/ req = {};
            if (!Fn.isNull(data)) /**/ req.body = Fn.update({}, data);
            if (!req.host)        /**/ req.host = opts.host;
            if (!req.headers)     /**/ req.headers = {};
            req.path = path;
            //--------------------------------------------------
            const fasync = async () => {
                await issuer.setRequestHeaders(req);
                let resp = await doHttpRequest(req);
                await issuer.getResponseHeaders(resp);
                resolve(resp);
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** **Do a Http Request**.
     * 
     * @param {String} url
     * @param {import("./iot.defines").IOT.HTTPRequestType } req 
     * @param {Recod<String,Object>} data 
     * @returns {Promise<HTTPResponse>}     */
    doRequest(url, req, data) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let /** @type {HTTPResponse} */ resp;
                let issuer = this;
                while (issuer._onrequest) {
                    await Fn.waitLock();
                }
                issuer._onrequest = true;
                let opts = issuer.options;
                for (let retries = 0; retries < 3; retries++) {
                    if (!issuer.secured) {
                        resp = await issuer._doRequest(
                            opts.sessionPath);
                        if (resp.error) {
                            issuer.logged = false;
                            issuer._onrequest = false;
                            return resolve(resp);
                        }
                    }
                    resp = await issuer._doRequest(
                        url, req, data);
                    if (resp.status !== 401) {
                        issuer._onrequest = false;
                        return resolve(resp);
                    }
                }
                issuer.logged = false;
                issuer._onrequest = false;
                return resolve(new HTTPResponse(
                    "Security server unavailable"
                ));
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** Returns the Header "authorization".
     * 
     * @returns {Promise<String>}   */
    getAutorization() {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const issuer = this;
                let tls = issuer.options.tlsData;
                if (tls.keyPath) {
                    let jwt = new JWT();
                    let txt = await jwt.sign(
                        tls.keyPath,
                        tls.userName,
                        60,
                        tls.keyPasswd);
                    if (txt) {
                        txt = `Application ${txt}`;
                        return resolve(txt);
                    }
                }
                if (tls.passwd) {
                    let key = crypto.randomBytes(64);
                    let aes = new AESAlgorithm(key);
                    let prms = [
                        tls.userName,
                        tls.passwd,
                        tls.nameType,
                        tls.memberType,
                        Date.now().toString(16),
                    ];
                    prms.map((v, k) => prms[k] = `${v}`.replace(/[\s\-"'`:]+/g, '_'));
                    let t0 = prms.join(":");
                    let b0 = await aes.encrypt(t0);
                    t0 = [Se.encodeBase64(b0), Se.encodeBase64(key)].join(".");
                    t0 = `Basic ${t0}`;
                    return resolve(t0);
                }
                return resolve("");
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** **Log to remote server**
     * 
     * First step to do.
     * @returns {Promise<HTTPResponse>} */
    login() {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const issuer = this;
                let auth = await issuer.getAutorization();
                let opts = issuer.options;
                if (auth) {
                    let resp = await issuer.doRequest(opts.loginPath, {
                        headers: { "authorization": auth, },
                    });
                    if (resp.body && resp.body.memberId) {
                        issuer.userData = Fn.toCamelCase(resp.body);
                        issuer.logged = true;
                        return resolve(true);
                    }
                }
                return resolve(false);
            }
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** Sends request with "authorization" header.
     * @param {String} path 
     * @param {*} body 
     * @returns {Promise<HTTPResponse>} */
    secureRequest(path, body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const issuer = this;
                let auth = await issuer.getAutorization();
                if (auth) {
                    let resp = await issuer.doRequest(path, {
                        headers: { "authorization": auth, },
                        body: body,
                    });
                    return resolve(resp);
                }
                return resolve(new HTTPResponse(
                    "NO secure scheme for this application",
                    401,
                    "unauthorized",
                    {},
                    null));
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** Sends api query with "authorization" header.
     * @param {String} path 
     * @param {*} body 
     * @returns {Promise<QueryResults>} */
    secureAPIQuery(path, body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const issuer = this;
                let auth = await issuer.getAutorization();
                if (auth) {
                    let resp = await issuer.doRequest(path, {
                        headers: { "authorization": auth, },
                        body: body,
                    });
                    if (resp.body) {
                        return resolve(new QueryResults(
                            resp.body.error,
                            resp.body.results,
                        ));
                    }
                    return resolve(new QueryResults(
                        resp.error,
                    ));
                }
                return resolve(new QueryResults(
                    "NO secure scheme for this application"));
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** Do a request that response with database results.
     * 
     * @param {String} path 
     * @param {*} body 
     * @returns {Promise<QueryResults>}     */
    doAPIQuery(path, body) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                const issuer = this;
                let resp = await issuer.doRequest(path, {
                    body: body,
                });
                if (resp.body) {
                    return resolve(new QueryResults(
                        resp.body.error,
                        resp.body.results,
                    ));
                }
                return resolve(new QueryResults(
                    resp.error,
                ));
            };
            setImmediate(() => fasync());
        });
        return fpromise;
    }
    /** **Do a SQL query request**.
      * 
      * @param {String} sql 
      * @param {Array<String>} values 
      * @param {String} database 
      * @returns {Promise<QueryResults>} */
    doQuery(sql, values, database) {
        const fpromise = new Promise((resolve) => {
            let issuer = this;
            let props = issuer.options;
            if (!database) database = props.dbname;

            issuer.doRequest(props.queryPath, {
                host: props.host,
                headers: { "content-type": "application/json" }
            }, {
                sql: sql,
                values: values,
                database: database,
                user: "",
            }).then((v) => {
                let bdy = v.body || {};
                resolve(new QueryResults(
                    bdy.error || v.error,
                    bdy.results));
            });
        });
        return fpromise;
    }
}
export { HTTPSecureIssuer, HTTPIssuer, HTTPResponse, QueryResults, };
