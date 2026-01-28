/**
 * Security Utilities.
 */

import crypto from "crypto";
import zlib from "zlib";
import { Writable } from "stream";
import { readFileSync } from "fs";
import { Fn } from "./utilities.js";
import { IOSecure, IOServer } from "./io.stream.js";

/** **Assure key has line ends**
* @param {String} text 
* @returns {String}  */
function keyTrim(text) {
    let prefix = "";
    let suffix = "";
    text = text.trim();
    if (text.startsWith("-----BEGIN PRIVATE KEY-----")) {
        prefix = "-----BEGIN PRIVATE KEY-----";
        suffix = "-----END PRIVATE KEY-----";

    } else if (text.startsWith("-----BEGIN PUBLIC KEY-----")) {
        prefix = "-----BEGIN PUBLIC KEY-----";
        suffix = "-----END PUBLIC KEY-----";
    }
    if (prefix && suffix) {
        text = text.replace(prefix, "");
        text = text.replace(suffix, "").trim();
        let m0 = text.split(" ");
        if (m0.length > 1) {
            text = m0.join("\n");
        }
        text = `${prefix}\n${text}\n${suffix}`;
    }
    return text;
}
/** **Key Details**
 * 
 * Container for Key details    */
class KeyDetails {
    constructor(modulus, exponent) {
        /** Key: modulus
         * @type {Buffer}   */
        this.modulus = modulus;
        /** Key: exponent
         * @type {Buffer}   */
        this.exponent = exponent;
        return this;
    }
}
/** Secure Utilities            */
class TLSModule {
    /** **Gets a Seed from Random**
     * 
     * Return a random seed to be used 
     * in cryptography operations
     * 
     * @param {Number} sze 
     * @returns {Buffer}        */
    seed(sze) { return crypto.randomBytes(sze); }
    /** **Reads Private Key from file or string**.
     * 
     * @param {String} keyfile 
     * @param {String} passwd 
     * @returns {Promise<crypto.KeyObject>}         */
    privateKey(keyfile, passwd) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let /** @type {crypto.KeyObject}    */ key = null;
                let /** @type {Buffer}              */ bff = null;
                if (typeof keyfile == "string") {
                    keyfile = keyfile.trim();
                    if (keyfile.startsWith("-")) {
                        keyfile = keyTrim(keyfile);
                        bff = Buffer.from(keyfile, "utf-8");
                    } else {
                        try {
                            bff = readFileSync(keyfile);
                        } catch (err) { }
                    }
                    if (Buffer.isBuffer(bff)) {
                        try {
                            key = crypto.createPrivateKey({
                                key: bff,
                                format: "pem",
                                passphrase: passwd
                            });
                        } catch (err) { }
                    }
                    return resolve(key);
                }
                if (keyfile instanceof crypto.KeyObject) {
                    key = keyfile;
                }
                resolve(key);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
    /** **Read Private Key in Synchronic Mode**
     * 
     * @param {String} keyfile 
     * @param {String} passwd 
     * @returns {crypto.KeyObject}          */
    privateKeySync(keyfile, passwd) {
        let /** @type {crypto.KeyObject}    */ key = null;
        let /** @type {Buffer}              */ bff = null;
        if (typeof keyfile == "string") {
            keyfile = keyfile.trim();
            if (keyfile.startsWith("-")) {
                keyfile = keyTrim(keyfile);
                bff = Buffer.from(keyfile, "utf-8");
            } else {
                try {
                    bff = readFileSync(keyfile);
                } catch (err) { }
            }
            if (Buffer.isBuffer(bff)) {
                try {
                    key = crypto.createPrivateKey({
                        key: bff,
                        format: "pem",
                        passphrase: passwd
                    });
                } catch (err) { }
            }
            return key;
        }
        if (keyfile instanceof crypto.KeyObject) {
            key = keyfile;
        }
        return key;
    }
    /** Reads Public Key from File
     * 
     * @param {String} keyfile 
     * @returns {Promise<crypto.KeyObject>} */
    publicKey(keyfile) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let /** @type {crypto.KeyObject}    */ key = null;
                let /** @type {Buffer}              */ bff = null;
                if (typeof keyfile == "string") {
                    keyfile = keyfile.trim();
                    if (keyfile.startsWith("-")) {
                        keyfile = keyTrim(keyfile);
                        bff = Buffer.from(keyfile, "utf-8");
                    } else {
                        try {
                            bff = readFileSync(keyfile);
                        } catch (err) { }
                    }
                    if (Buffer.isBuffer(bff)) {
                        try {
                            key = crypto.createPublicKey({
                                key: bff,
                                format: "pem"
                            });
                        } catch (err) { }
                    }
                    return resolve(key);
                }
                if (keyfile instanceof crypto.KeyObject) {
                    key = keyfile;
                }
                resolve(key);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
    /** **Reads Public Key in Synchronic Mode**
     * 
     * @param {String} keyfile 
     * @returns {crypto.KeyObject} */
    publicKeySync(keyfile) {
        let /** @type {crypto.KeyObject}    */ key = null;
        let /** @type {Buffer}              */ bff = null;
        if (typeof keyfile == "string") {
            keyfile = keyfile.trim();
            if (keyfile.startsWith("-")) {
                keyfile = keyTrim(keyfile);
                bff = Buffer.from(keyfile, "utf-8");
            } else {
                try {
                    bff = readFileSync(keyfile);
                } catch (err) { }
            }
            if (Buffer.isBuffer(bff)) {
                try {
                    key = crypto.createPublicKey({
                        key: bff,
                        format: "pem"
                    });
                } catch (err) { }
            }
            return key;
        }
        if (keyfile instanceof crypto.KeyObject) {
            key = keyfile;
        }
        return key;
    }
    /** Sign the message using private key.
     * 
     * @param {crypto.KeyObject} privatekey     The private key
     * @param {String} message                  To sign
     * @param {String} keypasswd                key password
     * @returns {Promise<Buffer>}       */
    sign(privatekey, message, keypasswd) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let tls = this;
                let /** @type {Buffer}  */ signature = null;
                let key = await tls.privateKey(privatekey, keypasswd);
                if (key) {
                    try {
                        let bff = Fn.asBuffer(message);
                        crypto.sign('sha256', bff, {
                            key: key,
                            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                            saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN
                        }, (_, resp) => {
                            return resolve(resp);
                        });
                    } catch (err) { resolve(null); }
                } else resolve(null);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
    /** **Sign Message in synchronic mode**.
     * 
     * @param {crypto.KeyObject|String} privatekey 
     * @param {*} message 
     * @param {String} keypasswd 
     * @returns {Buffer}        */
    signSync(privatekey, message, keypasswd) {
        let tls = this;
        let /** @type {Buffer}  */ signature = null;
        let key = tls.privateKeySync(privatekey, keypasswd);
        if (key) {
            try {
                let bff = Fn.asBuffer(message);
                let rsp = crypto.sign('sha256', bff, {
                    key: privatekey,
                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                    saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN
                });
                return rsp;
            } catch (err) { }
        }
        return null;
    }
    /** Verify the message signature
     * 
     * @param {crypto.KeyObject} publickey      Public Key
     * @param {Buffer} signature                Signature Data
     * @param {String} message                  Message to validate
     * @param {Function} cb callback            Callback attention
     * @returns {Promise<Boolean>}       */
    verify(publickey, signature, message) {
        const fpromise = new Promise((resolve) => {
            let tls = this;
            const fasync = async () => {
                let chk = false;
                let key = await tls.publicKey(publickey);
                if (key) {
                    signature = Fn.asBuffer(signature);
                    message = Fn.asBuffer(message);
                    const zverify = (padding) => {
                        const zpromise = new Promise((zresolve) => {
                            crypto.verify('sha256', message, {
                                key: key,
                                padding: padding,
                                saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN
                            }, signature, (_, result) => {
                                zresolve(result);
                            });
                        });
                        return zpromise;
                    };
                    chk = await zverify(crypto.constants.RSA_PKCS1_PSS_PADDING);
                    if (!chk) {
                        chk = await zverify(crypto.constants.RSA_PKCS1_PADDING);
                    }
                }
                resolve(chk);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
    /** Verify the message signature in synchronic mode.
     * 
     * @param {crypto.KeyObject} publickey      Public Key
     * @param {Buffer} signature                Signature Data
     * @param {String} message                  Message to validate
     * @param {Function} cb callback            Callback attention
     * @returns {Boolean}       */
    verifySync(publickey, signature, message) {
        let tls = this;
        let chk = false;
        let key = tls.publicKeySync(publickey);
        if (key) {
            signature = Fn.asBuffer(signature);
            message = Fn.asBuffer(message);
            const zverify = (padding) => {
                let rsp = false;
                try {
                    rsp = crypto.verify('sha256', message, {
                        key: key,
                        padding: padding,
                        saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN
                    }, signature);
                } catch (err) { };
                return rsp;
            };
            chk = zverify(crypto.constants.RSA_PKCS1_PSS_PADDING);
            if (!chk) {
                chk = zverify(crypto.constants.RSA_PKCS1_PADDING);
            }
        }
        return chk;
    }
    /** Gets the modulus from specified key.
     * 
     * @param {crypto.KeyObject} publickey 
     * @returns {KeyDetails}   */
    keyDetails(publickey) {
        let /** @type {KeyDetails} */ details;
        if (publickey && typeof publickey.export == "function") {
            try {
                let jwk = publickey.export({ format: "jwk" });
                if (jwk && jwk.n && jwk.e) {
                    details = new KeyDetails(
                        Buffer.from(jwk.n, "base64"),
                        Buffer.from(jwk.e, "base64"),
                    );
                }
            } catch (err) { Fn.error(5, "Getting Key Details", err); }
        }
        return details;
    }
    /** XOR Operation
     * 
     * @param {Buffer} b1 
     * @param {Buffer} b2 
     * @returns {Buffer}        */
    xored(b1, b2) {
        let z1 = b1.length < b2.length ? b1.length : b2.length;
        let b0 = Buffer.alloc(z1, 0);
        b0.map((_, index) => { b0[index] = b1[index] ^ b2[index]; });
        return b0;
    }
    /** Buffer Left Rotation
     * 
     * @param {Buffer} b0 
     * @returns {Buffer}        */
    left(b0) {
        let b1 = Buffer.from(Fn.asBuffer(b0));
        let z0 = b1.length - 1;
        let n0 = b1[0];
        while (z0 >= 0) {
            let n1 = (b1[z0] << 1) | ((n0 >> 7) & 1);
            n0 = b1[z0];
            b1[z0] = n1 & 255;
            z0 -= 1;
        }
        return b1;
    }
    /** Buffer Right Rotation
     * 
     * @param {Buffer} b0   
     * @returns {Buffer}        */
    right(b0) {
        let b1 = Buffer.from(Fn.asBuffer(b0));
        let n0 = b1[b1.length - 1];
        b1.map((val, index) => {
            let n1 = ((val >> 1) & 0x7f)
                | ((n0 << 7) & 0x80);
            n0 = val;
            b1[index] = n1;
        });
        return b1;
    }
    /** Padding to packet size.
     * 
     * @param {Buffer} bff 
     * @param {Number} len 
     * @returns {Buffer}        */
    padding(bff, len) {
        let b1 = Buffer.from(Fn.asBuffer(bff));
        let pad = b1.length & (len - 1);
        if (pad) {
            pad = len - pad;
            let b0 = Buffer.alloc(pad, 0x20);
            b1 = Buffer.concat([b1, b0]);
        }
        return b1;
    }
    /** **Calculate Hash SHS-256**.
     * 
     * @param {*} data 
     * @returns {Buffer}    */
    sha256(data) {
        let bff = Se.asBuffer(data);
        try {
            let resp = crypto.createHash('sha256')
                .update(bff)
                .digest();
            return resp;
        } catch (e) { }
        return bff;
    }
}
/** **JSon Web Token**                      
 * 
 * Drives a JSon Web Token accords 
 * its standard                             */
class JWT {
    /** JWT: JSon Web Token
     * 
     * @param {String} text                 */
    constructor(text) {
        /** JWT: Header
         * @type {import("./iot.defines").IOT.JwtHeaderClaims}    */
        this.header;
        /** JWT: Payload
         * @type {import("./iot.defines").IOT.JwtPayloadClaims}   */
        this.payload;
        /** JWT: signature
         * @type {Buffer}                   */
        this.signature;
        /** JWT: Token text
         * @type {String}                   */
        this.text = "";
        /** JWT: Response callback
         * @type {Function}                 */
        this.callback;
        //
        if (typeof text == "string") {
            if (text.startsWith("Bearer ")) {
                text = text.substring(7);
            }
            this.text = text;
            let maps = text.split(".");
            if (maps.length > 1) {
                this.header = Fn.asMap(Fn.decodeBase64(maps[0]));
                this.payload = Fn.asMap(Fn.decodeBase64(maps[1]));
                if (maps.length > 2) {
                    this.signature = Buffer.from(maps[2], "base64");
                    this.text = `${maps[0]}.${maps[1]}`;
                }
            }
        }
        //
        if (!this.header) {
            this.header = { alg: "RS256", typ: "JWT" };
        }
        if (!this.payload) {
            this.payload = { iat: Fn.seconds() };
        }
        return this;
    }
    /** JWT: Sign the token.
     * 
     * Returns string with JWT signed or empty if error.
     * 
     * @param {crypto.KeyObject} key  Private key
     * @param {String} issuer         Who sends 
     * @param {Number} expire_at      Time in seconds
     * @param {String} keypasswd      Key Password
     * 
     * @returns {Promise<String>}     */
    sign(key, issuer, expire_at, keypasswd) {
        const fpromise = new Promise((resolve) => {
            const fasync = async () => {
                let jwt = this;
                let privatekey = await TLS.privateKey(key, keypasswd);
                if (!privatekey) return "";

                let tme = Fn.seconds();
                jwt.payload.iss = issuer;
                jwt.payload.iat = tme;
                if (typeof expire_at == "number" && expire_at > 1) {
                    jwt.payload.exp = tme + expire_at;
                } else { delete (jwt.payload.exp); }

                jwt.text = ``
                    + `${Buffer.from(JSON.stringify(jwt.header), "utf-8").toString("base64url")}.`
                    + `${Buffer.from(JSON.stringify(jwt.payload), "utf-8").toString("base64url")}`;

                jwt.signature = await TLS.sign(key, jwt.text, keypasswd);
                let txt = jwt.signature ?
                    jwt.signature.toString("base64url")
                    : "";
                if (txt) jwt.text = `${jwt.text}.${txt}`;
                resolve(jwt.text);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
    /** **JWT**: Sign the token ***synchronized mode***.
     * 
     * Returns string with JWT signed or empty if error.
     * 
     * @param {crypto.KeyObject} key  Private key
     * @param {String} issuer         Who sends 
     * @param {Number} expire_at      Time in seconds
     * @param {String} keypasswd      Key Password
     * 
     * @returns {String}     */
    signSync(key, issuer, expire_at, keypasswd) {
        let jwt = this;
        let privatekey = TLS.privateKeySync(key, keypasswd);
        if (!privatekey) return "";

        let tme = Fn.seconds();
        jwt.payload.iss = issuer;
        jwt.payload.iat = tme;
        if (typeof expire_at == "number" && expire_at > 1) {
            jwt.payload.exp = tme + expire_at;
        } else { delete (jwt.payload.exp); }

        jwt.text = ``
            + `${Buffer.from(JSON.stringify(jwt.header), "utf-8").toString("base64url")}.`
            + `${Buffer.from(JSON.stringify(jwt.payload), "utf-8").toString("base64url")}`;

        jwt.signature = TLS.signSync(key, jwt.text, keypasswd);
        let txt = jwt.signature ?
            jwt.signature.toString("base64url")
            : "";
        if (txt) jwt.text = `${jwt.text}.${txt}`;
        return jwt.text;
    }
    /** Verify the Token sign
     * 
     * @param {crypto.KeyObject} key 
     * @returns {Promise<Boolean>}      */
    verify(key) {
        const fpromise = new Promise((resolve) => {
            let jwt = this;
            const fasync = async () => {
                let rsp = false;
                if (Buffer.isBuffer(jwt.signature) && jwt.text) {
                    rsp = await TLS.verify(key, jwt.signature, jwt.text);
                }
                resolve(rsp);
            };
            setImmediate(() => { fasync(); });
        });
        return fpromise;
    }
    /** Verify the Token sign ***synchronized mode***.
     * 
     * @param {crypto.KeyObject} key 
     * @returns {Boolean}      */
    verifySync(key) {
        let jwt = this;
        let chk = false;
        if (Buffer.isBuffer(jwt.signature) && jwt.text) {
            chk = TLS.verifySync(key, jwt.signature, jwt.text);
        }
        return chk;
    }
    /** Checks if Token was exprired.
     * 
     * returns `true` if token was expired.
     * @returns {Boolean}           */
    isExpired() {
        let jwt = this;
        let tme = Fn.seconds();
        let exp = Fn.getNumber(jwt.payload, ["exp"]);
        if (exp > 1) {
            if (exp < tme) return true;
        }
        let nbf = Fn.getNumber(jwt.payload, ["nbf"]);
        if (nbf > 1) {
            if (nbf > tme) return true;
        }
        return false;
    }
    /** Gets a specific date from any date claim normalized.
     * 
     * Returns the date as its representation in UNIX timestamp ***seconds***
     * 
     * @param {import("./iot.defines").IOT.JwtDateClaims} claim 
     * @returns {Number}                      */
    getDate(claim) {
        let jwt = this;
        let tme = jwt.payload[claim];
        tme = Fn.asNumber(tme);
        return tme;
    }
    /** Checks Dates in the range given maximum time in seconds.
     * 
     * @param {Number} maxtime 
     * @returns {Boolean}       */
    checkDates(maxtime) {
        let jwt = this;
        let tme = Fn.seconds();
        let nbf = jwt.getDate("nbf");
        if (nbf > 1) {
            if (nbf < tme) return false;
        }
        let exp = jwt.getDate("exp");
        if (exp > 1) {
            if (exp < tme) return false;
        }
        let iat = jwt.getDate("iat");
        if (iat < 1) return false;
        if (maxtime > 1) {
            let t0 = tme - iat;
            if (t0 > maxtime) {
                return false;
            }
        }
        return true;
    }
    /** Gets the Issuer of this Token.
     * 
     * Refers to who create the token
     * 
     * @returns {String}        */
    getIssuer() {
        let jwt = this;
        return Fn.getString(jwt.payload, ["iss", "issuer"]);
    }
    /** Get how many seconds remains accord given date.
     * 
     * arguments:
     *  - claim = "iat"
     *      - How many seconds from "iat" to now.
     *  - claim = "exp"
     *      - How many seconds from now to expire.
     *      - Negative if was expired
     * 
     * @param {import("./iot.defines").IOT.JwtDateClaims} claim 
     * @returns {Number}
     */
    remainTime(claim) {
        let jwt = this;
        let tme = Fn.seconds();
        let tm0 = 0;
        switch (claim) {
            case "iat":
                tm0 = Fn.asNumber(jwt.payload.iat);
                if (tm0 > 1) tm0 = tme - tm0;
                break;

            case "exp":
                tm0 = Fn.asNumber(jwt.payload.exp);
                if (tm0 > 1) tm0 = tm0 - tme;
                break;
        }
        return tm0;
    }
}
/** Security Utilities.
 * @type {TLSModule}        */
const TLS = new TLSModule();
/** 
 * **Secure Utilities** 
 */
const Se = {
    /** **Calculate Modulus**.
     * @param {BigInt} base 
     * @param {BigInt} exp 
     * @param {BigInt} mod 
     * @returns {BigInt}        */
    modPow: (base, exp, mod) => {
        let result = 1n;
        base = base % mod;
        while (exp > 0) {
            if (exp % 2n === 1n) result = (result * base) % mod;
            exp = exp / 2n;
            base = (base * base) % mod;
        }
        return result;
    },
    /** **XOR Operation**
     * 
     * @param {Buffer} b1 
     * @param {Buffer} b2 
     * @returns {Buffer}        */
    xor: (b1, b2) => {
        let m1 = Buffer.alloc(b1.length);
        m1.map((_, x0) => { m1[x0] = b1[x0] ^ b2[x0]; });
        return m1;
    },
    /** **Gets a Random number with specified bytes width**.
     * 
     * @param {Number} width 
     * @returns {BigInt}        */
    random: (width) => {
        let n0 = crypto.randomBytes(width);
        let t0 = Se.encodeHex(n0);
        return BigInt(`0x${t0}`);
    },
    /** **Parse object to ArrayBuffer**.
     * @param {*} obj 
     * @returns {Buffer}        */
    asBuffer: (obj) => {
        if (obj === null || obj === undefined) /**/ return Buffer.from([]);
        if (Buffer.isBuffer(obj))              /**/ return obj;
        if (typeof obj === "string")           /**/ return Buffer.from(obj, "utf-8");
        if (typeof obj === "bigint") {
            let txt = obj.toString(16);
            if ((txt.length & 1) == 1) txt = "0" + txt;
            let bff = Buffer.alloc(txt.length >> 1);
            bff.map((_, x0) => {
                bff[x0] = parseInt(txt.substring((x0 * 2), (x0 * 2) + 2), 16) & 255;
            });
            return bff;
        }
        if (Array.isArray(obj)) {
            if (obj.length < 1)             /**/ return Buffer.from([]);
            if (typeof obj[0] === "number") /**/ return Buffer.from(obj);
        }
        let txt = JSON.stringify(obj);
        return Buffer.from(new TextEncoder().encode(txt));
    },
    /** **Parse Object to BigInt**.
     * @param {*} obj 
     * @returns {BigInt}        */
    asInteger: (obj) => {
        if (obj === null || obj === undefined) /**/ return BigInt(0);
        if (typeof obj === "bigint")           /**/ return obj;
        if (typeof obj === "string") {
            try { return BigInt(`0x${obj}`); } catch (e) { }
            try { return BigInt(`${obj}`); } catch (e) { }
        }
        let txt = Se.encodeHex(obj);
        try { return BigInt(`0x${txt}`); } catch (e) { }
        return BigInt(0);
    },
    /** **Parse Object as String**.
     * @param {*} obj 
     * @returns {String}        */
    asString: (obj) => {
        if (obj === null || obj === undefined) /**/ return "";
        if (typeof obj === "string")           /**/ return obj;
        if (Buffer.isBuffer(obj))              /**/ return obj.toString("utf-8");

        if (obj instanceof Uint8Array) {
            return new TextDecoder("utf-8").decode(obj);
        }
        if (Array.isArray(obj)) {
            if (obj.length < 1)                /**/ return "";
            if (typeof obj[0] === "number") {
                let a0 = new Uint8Array(obj);
                return new TextDecoder("utf-8").decode(a0);
            }
        }
        return JSON.stringify(obj);
    },
    /** **Parse from hex string to ArrayBuffer**.
     * 
     * @param {String} txt 
     * @returns {Buffer}        */
    decodeHex: (txt) => {
        if ((txt.length & 1) === 1) txt = "0" + txt;
        let dne = true;
        let bff = Buffer.alloc(txt.length >> 1);
        bff.map((_, x0) => {
            bff[x0] = parseInt(txt.substring((x0 * 2), (x0 * 2) + 2), 16);
            if (isNaN(bff[x0])) dne = false;
        });
        return dne ? bff : Buffer.alloc(0);
    },
    /** **Parse Object to hex string**.
     * 
     * @param {*} obj 
     * @returns {String}        */
    encodeHex: (obj) => {
        let bff = Se.asBuffer(obj);
        let txt = "";
        bff.map((val) => { txt += val.toString(16).padStart(2, "0"); });
        return txt;
    },
    /** **Parse from base64 string to ArrayBuffer**.
     * 
     * @param {String} obj 
     * @returns {Buffer}        */
    decodeBase64: (obj) => {
        const gcode = (a) => {
            if ((a >= 65) && (a <= 90))   /**/ return (a - 65) + 0;
            if ((a >= 97) && (a <= 122))  /**/ return (a - 97) + 26;
            if ((a >= 48) && (a <= 57))   /**/ return (a - 48) + 52;
            if ((a === 43) || (a === 45)) /**/ return 62;
            if ((a === 47) || (a === 95)) /**/ return 63;
            return -1;
        };
        let a0 = [];
        let a1 = Se.asString(obj);
        let a2 = 0;
        while (a2 < a1.length) {
            let a3 = 0;
            let a4 = 0;
            while ((a2 < a1.length) && (a4 < 4)) {
                let c0 = a1.charCodeAt(a2++);
                if (c0 > 32) {
                    c0 = gcode(c0);
                    if (c0 === -1) {
                        a2 = a1.length;
                        break;
                    }
                    a3 = (a3 << 6) | c0;
                    a4 += 1;
                }
            }
            let a5 = a4 - 1;
            while (a4 < 4) {
                a3 = (a3 << 6);
                a4 += 1;
            }
            a4 = 0;
            while (a4 < a5) {
                let c0 = (a3 >> (8 * (2 - a4))) & 255;
                a0.push(c0);
                a4 += 1;
            }
            if (a5 !== 3) break;
        }
        return Buffer.from(a0);
    },
    /** **Encode Object to a base64 string**.
     * 
     * @param {*} obj 
     * @returns {String}        */
    encodeBase64: (obj) => {
        let a0 = Se.asBuffer(obj);
        const a1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "abcdefghijklmnopqrstuvwxyz"
            + "0123456789-_";
        let a2 = "";
        let a3 = 0;
        while (a3 < a0.length) {
            let a4, a5, a6, a7;
            a7 = a0.length - a3;
            if (a7 > 3) a7 = 3;
            a6 = 0;
            a5 = 0;
            while (a5 < a7) {
                a6 = (a6 << 8) | (a0[a3++] & 255);
                a5 += 1;
            }
            while (a5 < 3) {
                a6 = (a6 << 8);
                a5 += 1;
            }
            a5 = 0;
            while (a5 <= a7) {
                a4 = (a6 >> (6 * (3 - a5))) & 63;
                a2 += a1.charAt(a4);
                a5 += 1;
            }
        }
        return a2;
    },
    /** **Set fixed array lenght**.
     * @param {*} data 
     * @returns {Buffer}        */
    padding: (data) => {
        let bff = Se.asBuffer(data);
        if ((bff.length & 15) !== 0) {
            let z0 = 16 - (bff.length & 15);
            bff = Buffer.concat([
                bff, Buffer.alloc(z0, 0x20),]);
        }
        return bff;
    },
    /** **Compare two ArrayBuffer or BigInt**
     * 
     * @param {*} m1 
     * @param {*} m2 
     * @returns {Boolean}       */
    equals: (m1, m2) => {
        let t0 = Se.encodeHex(m1);
        let t1 = Se.encodeHex(m2);
        return t0 === t1;
    },
    /** **Checks if timestamp into configured time window**.
     * 
     * @param {IOSecure} client 
     * @param {Number} tm0 
     * @returns {Boolean}       */
    isTimestamp: (client, tm0) => {
        if (!isNaN(tm0)) {
            let tmin = -120;
            let tmax = 120;
            let server = client.getServer();
            if (server instanceof IOServer) {
                let opts = server.options;
                tmin = opts.authMinTime || tmin;
                tmax = opts.authMaxTime || tmax;
            }
            let tm1 = Fn.seconds() - tm0;
            return ((tm1 > tmin) && (tm1 < tmax));
        }
        return false;
    },
    /** **Descompress/Inflate function**.
     * 
     * @param {*} data
     * @returns {Promise<Buffer>}   */
    gunzip: (data) => {
        const fpromise = new Promise((resolve) => {
            let bff = Se.asBuffer(data);
            try {
                zlib.gunzip(bff, {
                    windowBits: zlib.constants.Z_MAX_WINDOWBITS
                }, (err, unzipped) => {
                    let resp = (!err && unzipped) ? unzipped : bff;
                    resolve(resp);
                });
            } catch (err) { resolve(bff); }
        });
        return fpromise;
    },
    /** **Descompress/Inflate function**.
     * 
     * ***Blocking Mode***
     * 
     * @param {*} data
     * @returns {Buffer}   */
    gunzipSync: (data) => {
        let bff = Se.asBuffer(data);
        try {
            let unzipped = zlib.gunzipSync(bff, {
                windowBits: zlib.constants.Z_MAX_WINDOWBITS
            });
            return unzipped;
        } catch (e) { }
        return bff;
    },
    /** **Compress/Deflate the specified Data**.
     * 
     * @param {Buffer} data
     * @returns {Promise<Buffer>}       */
    gzip: (data) => {
        const fpromise = new Promise((resolve) => {
            let bff = Se.asBuffer(data);
            try {
                zlib.gzip(bff, {
                    level: zlib.constants.Z_BEST_SPEED,
                }, (err, zipped) => {
                    let rsp = (!err && zipped) ? zipped : bff;
                    resolve(rsp);
                });
            } catch (err) {
                resolve(bff);
            }
        });
        return fpromise;
    },
    /** **Compress/Deflate the specified Data**.
     *
     * ***Blocking mode***.
     *  
     * @param {Buffer} bff 
     * @returns {Buffer}       */
    gzipSync: (data) => {
        let bff = Se.asBuffer(data);
        try {
            let zipped = zlib.gzipSync(bff, {
                level: zlib.constants.Z_BEST_SPEED,
            });
            return zipped;
        } catch (e) { }
        return bff;
    }
}
/** **Key exchange algoritm**  */
class DiffieHellman {
    constructor(p, g) {
        this.p = p ? Se.asInteger(p) : Se.random(64);
        this.g = g ? Se.asInteger(g) : BigInt(3);
        this.a = Se.random(64);
    }
    /** **Gets public Key **.
     * @returns {Buffer}        */
    getPublic() { return Se.asBuffer(Se.modPow(this.g, this.a, this.p)); }
    /** **Calculate Shared Key**.
     * @param {BigInt} key 
     * @returns {Buffer}        */
    getShared(key) { return Se.asBuffer(Se.modPow(Se.asInteger(key), this.a, this.p)); }
    /** Get the Key patterm
     * 
     * @param {*} key 
     * @returns {Buffer}        */
    getPattern(key) {
        let n0 = Se.asBuffer(key);
        let n1 = Se.asBuffer(this.p);
        return Se.xor(n0, n1);
    }
}
/** **Drives Cipher Process**  */
class AESAlgorithm {
    constructor(key) {
        /** @type {Uint8Array}  */
        this.pk = new Uint8Array();
        /** @type {Uint8Array}  */
        this.rx = new Uint8Array();
        /** @type {Uint8Array}  */
        this.tx = new Uint8Array();
        if (key) this._setKeys(key);
    }
    /** set the keys ... */
    _setKeys(keys) {
        let aes = this;
        keys = Se.asBuffer(keys);
        if (keys.length >= 48) {
            let pos = keys.length - 48;
            aes.pk = Buffer.from(keys.slice(pos, pos + 32));
            aes.rx = Buffer.from(keys.slice(pos + 32));
            aes.tx = Buffer.from(keys.slice(pos + 32));
        }
    }
    /** **Set the algoritm keys**.
     * 
     * @param {Uint8Array} keys 
     * @returns {Promise<Boolean>}  */
    setKeys(keys) {
        const fpromise = new Promise((resolve) => {
            this._setKeys(keys);
            resolve(true);
        });
        return fpromise;
    }
    /** **Decrypt**
     * 
     * From cipher to plain text.
     * @param {*} data 
     * @returns {Promise<Buffer>} */
    decrypt(data) {
        const fpromise = new Promise((resolve) => {
            try {
                let aes = this;
                const bff = Fn.asBuffer(data);
                const cipher = crypto.createDecipheriv(
                    'aes-256-cbc', aes.pk, aes.rx);
                const out = [];
                const writable = new Writable({
                    write(chunk, _, cb) {
                        out.push(chunk);
                        cb();
                    }
                });
                cipher.on('error', (e) => {
                    Fn.error(1, "Decrypt error:", e.code || e.message);
                    return resolve(null);
                });
                writable.on('finish', () => {
                    const resp = Buffer.concat(out);
                    aes.rx = Buffer.from(bff.slice(bff.length - 16));
                    return resolve(resp);
                });
                cipher.pipe(writable);
                cipher.write(bff);
                cipher.end();
            } catch (e) {
                Fn.error(1, "Decrypt error:", e.code || e.message);
                resolve(null);
            }
        });
        return fpromise;
    }
    /** **Encrypt**
     * 
     * From plain to cipher text.
     * @param {*} data 
     * @returns {Promise<Buffer>} */
    encrypt(data) {
        const fpromise = new Promise((resolve, reject) => {
            let aes = this;
            const bff = Fn.asBuffer(data);
            const cipher = crypto.createCipheriv(
                'aes-256-cbc', aes.pk, aes.tx);
            let out = Buffer.from([]);
            const writable = new Writable({
                write(chunk, _, cb) {
                    out = Buffer.concat([out, chunk]);
                    cb();
                }
            });
            cipher.on('error', (e) => {
                Fn.error(1, "Encrypt error:", e);
                resolve(null);
            });
            writable.on('finish', () => {
                const resp = Buffer.from(out);// Buffer.concat(out);
                aes.tx = Buffer.from(resp.slice(resp.length - 16));
                resolve(resp);
            });
            cipher.pipe(writable);
            cipher.write(bff);
            cipher.end();
        });
        return fpromise;
    }
}
//
export { KeyDetails, TLSModule, JWT, TLS, Se, DiffieHellman, AESAlgorithm };
