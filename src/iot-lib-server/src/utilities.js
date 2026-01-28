/**
 * DHP LIBRARY
 * Utilities Module Container
 * @author Henry Penuela
 */
//
import crypto from "crypto";
import zlib from "zlib";
import { isAbsolute as _isAbsolute, basename as _basename, dirname as _dirname, join as _join } from "path";
import { readFileSync, statSync, mkdirSync, writeFileSync, appendFileSync } from "fs";
import { load } from "js-yaml";

const _millsTime0 = BigInt(Date.now()) * 1000000n; //   milliseconds relative
const _nanosTime0 = process.hrtime.bigint(); //         nanoseconds relative

//
/** Event Listener Object
 * 
 * Adds event listen and emit functionality */
class EventListener {
    constructor() {
        /** Events Container
         * @type {Object}  */
        this.eventMap = {};
        return this;
    }
    /** Adds a evnt map to the object
     * @param {Object} map 
     * @returns {EventListener}   */
    addEvent(map) {
        let w = this;
        for (let k0 in map) {
            w.on(k0, map[k0]);
        }
        return w;
    }
    /** Emit/launch the specified event fom the object
     * @param {import("./iot.defines").IOT.IOEventsType} name 
     * @param  {...any} args 
     * @returns {EventListener}   */
    emit(name, ...args) {
        let w = this;
        name = typeof name === "string" ? name : "";
        name = name.trim().toLowerCase();
        if (name && (name in w.eventMap)) {
            for (let k0 in w.eventMap[name]) {
                let fn = w.eventMap[name][k0];
                if (typeof fn === "function") {
                    try {
                        fn(...args);
                    } catch (err) {
                        console.error("Event Emitter Error:", err);
                    }
                }
            }
        }
        return w;
    }
    /** Adds/Register a new event listener to the object
     * @param {import("./iot.defines").IOT.IOEventsType} name 
     * @param {Function} cb 
     * @returns {EventListener}   */
    on(name, cb) {
        let w = this;
        if (name
            && !Array.isArray(name)
            && typeof name === "object") {
            // Multiple Listeners
            let map = name;
            for (let k0 in map) {
                w.on(k0, map[k0]);
            }
            return w;
        }
        name = typeof name === "string" ? name : "";
        name = name.trim().toLowerCase();
        if (name && typeof cb === "function") {
            if (!(name in w.eventMap)) {
                w.eventMap[name] = [];
            }
            let /** @type {Array} */ list;
            list = w.eventMap[name];
            if (list.indexOf(cb) === -1) {
                list.push(cb);
            }
        }
        return w;
    }
    /** Checks if object has at least one event with given name
     * @param {String} name 
     * @returns {Boolean}  */
    hasEvent(name) {
        let w = this;
        name = typeof name === "string" ? name : "";
        name = name.trim().toLowerCase();
        return (name in w.eventMap);
    }
}
/** Byte Array Driver.
 * 
 * To drive byte arrays and protocols   */
class RawBuffer {
    constructor(bff) {
        this.bytes = Fn.asBytes(bff);
        this.offset = 0;
    }
    /** How many bytes waiting to be read.
     * @returns {Number}                    */
    available() {
        let raw = this;
        return raw.bytes.length - raw.offset;
    }
    /** Clears this Buffer                  */
    clear() {
        let raw = this;
        raw.bytes = [];
        raw.offset = 0;
    }
    /** Read array.
     * 
     * Reads an array with specified length.
     * 
     * @param {Number} sze 
     * @returns {Array<Number>}             */
    read(sze) {
        let raw = this;
        if (sze === undefined) sze = raw.available();
        let resp = [];
        if ((typeof sze === "number") && sze > 0) {
            let len = raw.available();
            if (sze > len) sze = len;
            resp = raw.bytes.slice(raw.offset, raw.offset + sze);
            raw.offset += sze;
        }
        return resp;
    }
    /** Write/Adds an array to this buffer
     * 
     * @param {Array<Number>} bff   */
    write(bff) {
        let raw = this;
        bff = Fn.asBytes(bff);
        raw.bytes = raw.bytes.concat(bff);
    }
    /** Gets/Read a numeric value from this buffer
     * 
     * @param {*} width 
     * @returns {Number}                    */
    getvalue(width) {
        let raw = this;
        if (width < 1) width = 1;
        if (width > 8) width = 8;
        let val = 0;
        while ((raw.offset < raw.bytes.length) && (width > 0)) {
            let d0 = raw.bytes[raw.offset++] & 255;
            val = (val << 8) | d0;
            width -= 1;
        }
        return val;
    }
    /** Gets/Read a numeric value given the byte width  */
    get08() { return this.getvalue(1); }
    /** Gets/Read a numeric value given the byte width  */
    get16() { return this.getvalue(2); }
    /** Gets/Read a numeric value given the byte width  */
    get24() { return this.getvalue(3); }
    /** Gets/Read a numeric value given the byte width  */
    get32() { return this.getvalue(4); }
    /** Gets/Read a numeric value given the byte width  */
    get64() { return this.getvalue(8); }
    /** Adds/Put/Write a numric value with specified byte width
     * 
     * @param {Number} val    The Value
     * @param {Number} width  The byte width (1-8)      */
    putvalue(val, width) {
        let raw = this;
        if (width < 1) width = 1;
        if (width > 8) width = 8;
        while (width > 0) {
            width -= 1;
            raw.bytes.push((val >> (width * 8)) & 255);
        }
    }
    /** Adds/Put/Write a numeric value with specified byte width */
    put08(val) { return this.putvalue(val, 1); }
    /** Adds/Put/Write a numeric value with specified byte width */
    put16(val) { return this.putvalue(val, 2); }
    /** Adds/Put/Write a numeric value with specified byte width */
    put24(val) { return this.putvalue(val, 3); }
    /** Adds/Put/Write a numeric value with specified byte width */
    put32(val) { return this.putvalue(val, 4); }
    /** Adds/Put/Write a numeric value with specified byte width */
    put64(val) { return this.putvalue(val, 8); }
    /** Gets next field as string
     * 
     * @returns {String}                    */
    getString() {
        let raw = this;
        let sze = raw.get16();
        let bff = raw.read(sze);
        return Fn.asString(bff);
    }
    /** Gets next field as array
     * 
     * @returns {Array<Number>}             */
    getData() {
        let raw = this;
        let sze = raw.get16();
        let bff = raw.read(sze);
        return bff;
    }
    /** Puts as next field the specified array
     * 
     * @param {Array<Number>} bff           */
    putData(bff) {
        let raw = this;
        bff = Fn.asBytes(bff);
        raw.put16(bff.length);
        raw.write(bff);
    }
    /** Puts as next field the specified string
     * 
     * @param {String} txt              */
    putString(txt) {
        let raw = this;
        let bff = Fn.asBytes(txt);
        raw.put16(bff.length);
        raw.write(bff);
    }
    /** Gets a no width byte.
     * 
     * Used as field length 
     * 
     * @returns {Number}                */
    getSize() {
        let raw = this;
        let val = 0;
        let off = 0;
        while ((raw.offset < raw.bytes.length) && (off < 4)) {
            let d0 = raw.bytes[raw.offset++] & 255;
            val |= ((d0 & 0x7f) << (off++ * 7));
            if ((d0 & 0x80) === 0) break;
        }
        return val;
    }
    /** Puts a no width byte as next field
     * 
     * @param {Number} val              */
    putSize(val) {
        let raw = this;
        val = Fn.asNumber(val);
        val &= 0x7fffffff;
        do {
            let d0 = val & 0x7f;
            val >>= 7;
            if (val > 0) d0 |= 0x80;
            raw.bytes.push(d0);
        } while (val > 0);
    }
    /** Checks frame and prepare for new read.
     * 
     * Checks frame size and returns `true` 
     * if frame.length is OK
     * @returns {Boolean}               */
    rewind() {
        let raw = this;
        if (raw.bytes.length > 1) {
            raw.offset = 1;
            let val = raw.getSize();
            return (val + raw.offset) === raw.bytes.length;
        }
        return false;
    }
    /** Gets the size for specified value.
     * 
     * Used to calculate spece.
     * 
     * @param {Number} value 
     * @returns {Number}                */
    sizeFor(value) {
        let sze = 0;
        value = Fn.asNumber(value);
        value &= 0x7fffffff;
        do {
            sze += 1;
            value >>= 7;
        } while (value > 0);
        return sze;
    }
    /** **Create Packet**
     * 
     * Used to assure correct packet size.
     *  - 1. Load the data
     *  - 2. Adds header, size and data *(this step)* 
     * 
     * 
     * @param {Number} head 
     * @returns {RawBuffer}     */
    packet(head) {
        let raw = this;
        let rsp = new RawBuffer();
        rsp.put08(head);
        rsp.putSize(raw.bytes.length);
        raw.bytes = rsp.bytes.concat(raw.bytes);
        return raw;
    }
}
//
const CRC16_TABLE = [
    0x0000, 0x1189, 0x2312, 0x329B, 0x4624, 0x57AD, 0x6536, 0x74BF,
    0x8C48, 0x9DC1, 0xAF5A, 0xBED3, 0xCA6C, 0xDBE5, 0xE97E, 0xF8F7,
    0x0919, 0x1890, 0x2A0B, 0x3B82, 0x4F3D, 0x5EB4, 0x6C2F, 0x7DA6,
    0x8551, 0x94D8, 0xA643, 0xB7CA, 0xC375, 0xD2FC, 0xE067, 0xF1EE,
    0x1232, 0x03BB, 0x3120, 0x20A9, 0x5416, 0x459F, 0x7704, 0x668D,
    0x9E7A, 0x8FF3, 0xBD68, 0xACE1, 0xD85E, 0xC9D7, 0xFB4C, 0xEAC5,
    0x1B2B, 0x0AA2, 0x3839, 0x29B0, 0x5D0F, 0x4C86, 0x7E1D, 0x6F94,
    0x9763, 0x86EA, 0xB471, 0xA5F8, 0xD147, 0xC0CE, 0xF255, 0xE3DC,
    0x2464, 0x35ED, 0x0776, 0x16FF, 0x6240, 0x73C9, 0x4152, 0x50DB,
    0xA82C, 0xB9A5, 0x8B3E, 0x9AB7, 0xEE08, 0xFF81, 0xCD1A, 0xDC93,
    0x2D7D, 0x3CF4, 0x0E6F, 0x1FE6, 0x6B59, 0x7AD0, 0x484B, 0x59C2,
    0xA135, 0xB0BC, 0x8227, 0x93AE, 0xE711, 0xF698, 0xC403, 0xD58A,
    0x3656, 0x27DF, 0x1544, 0x04CD, 0x7072, 0x61FB, 0x5360, 0x42E9,
    0xBA1E, 0xAB97, 0x990C, 0x8885, 0xFC3A, 0xEDB3, 0xDF28, 0xCEA1,
    0x3F4F, 0x2EC6, 0x1C5D, 0x0DD4, 0x796B, 0x68E2, 0x5A79, 0x4BF0,
    0xB307, 0xA28E, 0x9015, 0x819C, 0xF523, 0xE4AA, 0xD631, 0xC7B8,
    0x48C8, 0x5941, 0x6BDA, 0x7A53, 0x0EEC, 0x1F65, 0x2DFE, 0x3C77,
    0xC480, 0xD509, 0xE792, 0xF61B, 0x82A4, 0x932D, 0xA1B6, 0xB03F,
    0x41D1, 0x5058, 0x62C3, 0x734A, 0x07F5, 0x167C, 0x24E7, 0x356E,
    0xCD99, 0xDC10, 0xEE8B, 0xFF02, 0x8BBD, 0x9A34, 0xA8AF, 0xB926,
    0x5AFA, 0x4B73, 0x79E8, 0x6861, 0x1CDE, 0x0D57, 0x3FCC, 0x2E45,
    0xD6B2, 0xC73B, 0xF5A0, 0xE429, 0x9096, 0x811F, 0xB384, 0xA20D,
    0x53E3, 0x426A, 0x70F1, 0x6178, 0x15C7, 0x044E, 0x36D5, 0x275C,
    0xDFAB, 0xCE22, 0xFCB9, 0xED30, 0x998F, 0x8806, 0xBA9D, 0xAB14,
    0x6CAC, 0x7D25, 0x4FBE, 0x5E37, 0x2A88, 0x3B01, 0x099A, 0x1813,
    0xE0E4, 0xF16D, 0xC3F6, 0xD27F, 0xA6C0, 0xB749, 0x85D2, 0x945B,
    0x65B5, 0x743C, 0x46A7, 0x572E, 0x2391, 0x3218, 0x0083, 0x110A,
    0xE9FD, 0xF874, 0xCAEF, 0xDB66, 0xAFD9, 0xBE50, 0x8CCB, 0x9D42,
    0x7E9E, 0x6F17, 0x5D8C, 0x4C05, 0x38BA, 0x2933, 0x1BA8, 0x0A21,
    0xF2D6, 0xE35F, 0xD1C4, 0xC04D, 0xB4F2, 0xA57B, 0x97E0, 0x8669,
    0x7787, 0x660E, 0x5495, 0x451C, 0x31A3, 0x202A, 0x12B1, 0x0338,
    0xFBCF, 0xEA46, 0xD8DD, 0xC954, 0xBDEB, 0xAC62, 0x9EF9, 0x8F70
];
//
class CRC16Module {
    constructor() {
        return this;
    }
    /**
     * 
     * @param {Array<Number>} src 
     * @param {Number} off 
     * @param {Number} len 
     * @returns 
     */
    calculate(src, off, len) {
        let alg = this;
        src = Fn.asBytes(src);
        if (typeof off !== "number") off = 0;
        if (typeof len !== "number") len = src.length;
        //
        let crc = 0xffff;
        for (let x0 = 0; x0 < len; x0++) {
            let c0 = src[off++] & 255;
            c0 = ((crc >> 8) ^ c0) & 255;
            c0 = CRC16_TABLE[c0];
            crc = ((crc << 8) ^ c0) & 0xffff;
        }
        return crc;
    }
}
/** CRC16 Algorithm.
 * @type {CRC16Module}      */
const CRC16 = new CRC16Module();
/** Utilities Functions     */
class FnModule {
    constructor() {
        /** Debug level
         * @type {Number}   */
        this.debugLevel = 0;
        return this;
    }
    /** Read JSon Map from specified Fila Path
     * 
     * @param {String} fname 
     * @returns {Object}        */
    readMap(fname) {
        let map = null;
        try {
            let fdata = readFileSync(fname);
            if ((fname.endsWith("yaml")) || (fname.endsWith("yml"))) {
                map = load(fdata);
            } else {
                map = this.asMap(this.asString(fdata));
            }
        } catch (err) { }
        return map;
    }
    /** Gets current time stamp in milliseconds
     * @returns {Number}                    */
    millis() { return Date.now(); }
    /** Gets current time stamp in seconds
     * @returns {Number}                    */
    seconds() { return Math.floor(Date.now() / 1000); }
    /** Checks if specified object has value.
     * 
     * return `true` if object has a not nullable value.
     * @param {*} obj 
     * @returns {Boolean}  */
    hasValue(obj) {
        if ([0, false, "", undefined, null].indexOf(obj) !== -1) {
            return false;
        }
        if (typeof obj === "function") {
            return false;
        }
        if (Array.isArray(obj.bytes)) {
            return obj.bytes.length > 0;
        }
        if (typeof obj.isEmpty === "function") {
            return !obj.isEmpty();
        }
        if (typeof obj.length === "number") {
            return obj.length > 0;
        }
        return true;
    }
    /** Update destiny Map with source values.
     * 
     * @param {Object} dst 
     * @param {Object} src 
     * @param {Array<String>} keys 
     * @returns {Object}     */
    update(dst, src, keys) {
        let fn = this;
        if (fn.isMap(dst) && fn.isMap(src)) {
            if (Array.isArray(keys)) {
                for (let k0 in keys) {
                    let v0 = keys[k0];
                    if (fn.hasValue(v0)) {
                        dst[k0] = val;
                    }
                }
                return dst;
            }
            for (let k0 in src) {
                let v2 = src[k0];
                if (typeof v2 === "function") {
                    continue;
                }
                if (fn.isMap(v2)) {
                    let v1 = dst[k0];
                    if (fn.isMap(v1)) {
                        v2 = fn.update(v1, v2);
                    }
                }
                if (Array.isArray(v2)) {
                    dst[k0] = v2.slice();
                } else dst[k0] = v2;
            }
        }
        return dst;
    }
    /** Makes a Map copy        */
    copyMap(obj) {
        if (obj && !Array.isArray(obj) && typeof obj === "object") {
            let txt = JSON.stringify(obj);
            try {
                let map = JSON.parse(txt);
                return map;
            } catch (err) { }
            return txt;

        } else if (Buffer.isBuffer(obj)) {
            return Buffer.from(obj);
        } else if (Array.isArray(obj)) {
            return obj.slice();
        }
        return obj;
    }
    /** Checks if object is instance of Data Type
      * @param {Object} obj 
      * @returns {Boolean}              */
    isMap(obj) {
        return obj
            && !Array.isArray(obj)
            && !Buffer.isBuffer(obj)
            && !(obj instanceof Date)
            && !(obj instanceof RawBuffer)
            && (typeof obj.byteLength === "undefined")
            && typeof obj === "object";
    }
    /** Check if specified object is null
     * @param {*} obj 
     * @returns {Boolean}           */
    isNull(obj) {
        return obj === undefined || obj === null;
    }
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {Boolean}           */
    asBool(obj) {
        let fn = this;
        if (obj === null || obj === undefined)  /**/ return false;
        if (typeof obj === "boolean")           /**/ return obj;
        let txt = fn.asString(obj).trim().toLowerCase();
        return ["true", "yes", "1", "si"].includes(txt);
    }
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {BigInt}            */
    asBigInt(value) {
        let fn = this;
        if (obj === null || obj === undefined)  /**/ return 0n;
        let tpe = typeof (value);
        try {
            switch (tpe) {
                case "bigint":
                case "string":
                case "number":
                case "boolean":
                    return BigInt(value);
                default:
                    let txt = fn.encodeHex(value);
                    txt = `0x${txt}`;
                    return BigInt(txt);
            }
        } catch (err) { }
        return 0n;
    }
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {Buffer}                */
    asBuffer(obj) {
        let fn = this;
        if (obj === null || obj === undefined)  /**/ return Buffer.from([]);
        if (Buffer.isBuffer(obj))               /**/ return obj;
        if (Array.isArray(obj))                 /**/ return Buffer.from(obj);
        if (obj instanceof RawBuffer)           /**/ return Buffer.from(obj.bytes);
        if (typeof obj === "bigint") {
            let txt = obj.toString(16);
            if ((txt.length & 1) === 1) txt = "0" + txt;
            return Buffer.from(txt, "hex");
        }
        let txt = fn.asString(obj);
        return Buffer.from(txt, "utf-8");
    }
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {Array<Number>}        */
    asBytes(obj) {
        let fn = this;
        if (obj === null || obj === undefined)  /**/ return [];
        if (Array.isArray(obj))                 /**/ return obj.slice();
        if (obj instanceof RawBuffer)           /**/ return obj.bytes.slice();
        if (Buffer.isBuffer(obj))               /**/ return [...obj];
        let txt = fn.asString(obj);
        let bff = Buffer.from(txt, "utf-8");
        return [...bff];
    }
    /** Parse to specified Data Type
     * 
     * ***`mapcase`***: defined for special map key case.
     *  - "camel
     *  - "pascal"
     *  - "snake"
     * 
     * @param {Object} obj 
     * @param {String} mapcase 
     * @returns {Object}               */
    asMap(obj, mapcase) {
        let fn = this;
        if (obj === null || obj === undefined) {
            return undefined;
        }
        if (fn.isMap(obj)) {
            switch (mapcase) {
                case "camel":   /**/ return fn.toCamelCase(obj);
                case "pascal":  /**/ return fn.toPascalCase(obj);
                case "snake":   /**/ return fn.toSnakeCase(obj);
                default:        /**/ return obj;
            }
        }
        if (Array.isArray(obj) && fn.isMap(obj[0])) {
            if (mapcase) {
                obj.map((v, k) => {
                    switch (mapcase) {
                        case "camel":   /**/ obj[k] = fn.toCamelCase(v);
                        case "pascal":  /**/ obj[k] = fn.toPascalCase(v);
                        case "snake":   /**/ obj[k] = fn.toSnakeCase(v);
                        default:        /**/ break;
                    }
                });
            }
            return obj;
        }
        try {
            let txt = fn.asString(obj).trim();
            let map = JSON.parse(txt);
            switch (mapcase) {
                case "camel":   /**/ return fn.toCamelCase(map);
                case "pascal":  /**/ return fn.toPascalCase(map);
                case "snake":   /**/ return fn.toSnakeCase(map);
                default:        /**/ return map;
            }
        } catch (err) { }
        return null;
    }
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {Number}               */
    asNumber(obj) {
        if (obj === null || obj === undefined) /**/ return 0;
        if (typeof obj === "number")           /**/ return obj;
        let val = 0;
        if (typeof obj === "string") {
            let /** @type {String} */ txt = obj.trim();
            if (txt.startsWith("0x") || txt.startsWith("0X")) {
                txt = txt.substring(2);
                val = parseInt(txt, 16);
                if (isNaN(val)) val = 0;
                return val;
            }
            if (txt.startsWith("#")) {
                txt = txt.substring(1);
                val = parseInt(txt, 16);
                if (isNaN(val)) val = 0;
                return val;
            }
        }
        val = parseFloat(obj);
        if (isNaN(val)) val = 0;
        return val;
    }
    /** Parse to JSon notation text
     * 
     * @param {*} obj 
     * @returns {String}        */
    stringify(obj) {
        let fn = this;
        if (obj === null)       /**/ return "null";
        if (obj === undefined)  /**/ return "";
        if (obj instanceof Date) {
            let txt = obj.toISOString();
            return JSON.stringify(txt);
        }
        if (obj instanceof Uint8Array) {
            let txt = fn.encodeBase64(obj);
            txt = `"base64:${txt}"`;
            return txt;
        }
        if (obj instanceof RawBuffer) {
            let txt = fn.encodeBase64(obj.bytes);
            txt = `"base64:${txt}"`;
            return txt;
        }
        if (Buffer.isBuffer(obj)) {
            let txt = fn.encodeBase64(obj);
            txt = `"base64:${txt}"`;
            return txt;
        }
        if (Array.isArray(obj)) {
            let count = 0;
            let txt = "[";
            for (let k0 in obj) {
                if (count > 0) txt += ",";
                let val = obj[k0];
                switch (typeof val) {
                    case "bigint":
                    case "boolean":
                    case "number":
                    case "object":
                    case "string":
                    case "symbol":
                        txt += fn.stringify(val);
                        break;
                    default: break;
                }
                count += 1;
            }
            txt += "]";
            return txt;
        }
        if (typeof obj === "object") {
            let txt = "{";
            let count = 0;
            for (let k0 in obj) {
                let val = obj[k0];
                if (val !== undefined && val !== null) {
                    switch (typeof val) {
                        case "bigint":
                        case "boolean":
                        case "number":
                        case "object":
                        case "string":
                        case "symbol":
                            if (count > 0) txt += ",";
                            txt += `${JSON.stringify(k0)}:`;
                            txt += fn.stringify(val);
                            count += 1;
                            break;
                        default: break;
                    }
                }
            }
            txt += "}";
            return txt;
        }
        let tpe = typeof obj;
        switch (tpe) {
            case "string":
            case "number":
            case "boolean":
            case "symbol":
                return JSON.stringify(obj);
            case "bigint":
                let txt = obj.toString(16);
                if ((txt.length & 1) === 1) txt = "0" + txt;
                txt = `"base64:${Buffer.from(txt, "hex").toString("base64url")}"`;
                return txt;
            default: break;
        }
        return "";
    }
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {String}               */
    asString(obj, ...args) {
        let fn = this;
        if (obj === null || obj === undefined) /**/ return "";
        if (typeof obj === "string")           /**/ return obj;
        if (Array.isArray(obj)) {
            if (obj.length === 0) return "";
            if (typeof obj[0] === "number") {
                return Buffer.from(obj).toString("utf-8");
            }
            return JSON.stringify(obj);
        }
        if (obj instanceof RawBuffer) {
            return Buffer.from(obj.bytes).toString("utf-8");
        }
        if (Buffer.isBuffer(obj)) {
            return obj.toString("utf-8");
        }
        let txt = "";
        if (fn.isMap(obj)) {
            txt = fn.stringify(obj);
            if (args[0]) {
                try {
                    let map = JSON.parse(txt);
                    return JSON.stringify(map, 0, "    ");
                } catch (err) { }
            }
        } else txt = JSON.stringify(obj);
        return txt;
    }
    /** Checks if data is in ascii format
     * @param {Array<Number>} data 
     * @returns {Boolean}           */
    isAscii(data) {
        let bff = this.asBuffer(data);
        let decoder = new TextDecoder("utf-8", { fatal: true });
        let t0 = "";
        try {
            t0 = decoder.decode(bff);
            for (let byte in bff) {
                byte = bff[byte];
                if (byte < 0x20
                    && byte !== 0x09
                    && byte !== 0x0a
                    && byte !== 0x0d) {
                    return false;
                }
            }
        } catch (err) {
            dne = false;
        }
        return true;
    }
    /** Gets the keys from specified Map
     * @param {Object} map 
     * @returns {Array<String>}     */
    keySet(map) {
        let fn = this;
        let rsp = [];
        if (fn.isMap(map)) {
            rsp = Object.keys(map);
        }
        return rsp;
    }
    /** Normalized key to avoid camel and case
     * @param {String} key 
     * @returns {String}            */
    keyNormal(key) {
        let rsp = "";
        const toreplace = "\"'`-_.";
        let txt = key.trim().toLowerCase();
        [...txt].map((c0) => {
            if (!toreplace.includes(c0) && c0 > " ") rsp += c0;
        });
        return rsp;
        //let txt = key.replace(/[\\'"`:-_. ]/g, '');
        //return txt.toLowerCase();
    }
    /** Gets the key-value pair given a path into the map.
     * @param {Object} map 
     * @param {String} keypath 
     * @returns {Object}                */
    getPath(map, keypath) {
        let fn = this;
        let paths = keypath.split("/");
        let dne = false
        for (let k0 in paths) {
            dne = false;
            let npath = paths[k0];
            if (fn.isMap(map)) {
                let keys = [];
                let keyz = npath.split(",");
                keyz.map((k0) => {
                    let k1 = fn.keyNormal(k0);
                    if (k1) keys.push(k1);
                });
                for (let k1 in map) {
                    let k2 = fn.keyNormal(k1);
                    if (keys.includes(k2)) {
                        map = map[k1];
                        dne = true;
                        break;
                    }
                }
            } else break;
        }
        let rsp = dne ? map : undefined;
        return rsp;
    }
    /** Get the Key:Value pair from specified Map
     * @param {Object} map          Data source
     * @param {Array<String>} keys  Key multiple 
     * @returns {Object}            */
    getKey(map, keys) {
        let val = null;
        let fn = this;
        if (!fn.isMap(map)) return val;
        if (typeof keys === "string") {
            return fn.getPath(map, keys);
        }
        if (Array.isArray(keys)) {
            for (let k0 in map) {
                let k1 = fn.keyNormal(k0);
                if (keys.includes(k1)) {
                    val = map[k0];
                    break;
                }
            }
        }
        return val;
    }
    /** Get from Map as specified Data Type
     * @param {Object} map 
     * @param {Array<String>} keys 
     * @returns {Number}                */
    getBool(map, keys) {
        let fn = this;
        let val = fn.getKey(map, keys);
        return fn.asBool(val);
    }
    /** Get from Map as specified Data Type
     * @param {Object} map 
     * @param {Array<String>} keys 
     * @param {Number} dfault 
     * @returns {Number}                */
    getNumber(map, keys, dfault) {
        let fn = this;
        if (typeof dfault !== "number") {
            dfault = 0;
        }
        let val = fn.getKey(map, keys);
        return !fn.isNull(val)
            ? fn.asNumber(val)
            : dfault;
    }
    /** Get from Map as specified Data Type
     * @param {Object} map 
     * @param {Array<String>} keys 
     * @param {String} dfault 
     * @returns {String}                */
    getString(map, keys, dfault) {
        let fn = this;
        if (typeof dfault !== "string") {
            dfault = "";
        }
        let val = fn.getKey(map, keys);
        return !fn.isNull(val)
            ? fn.asString(val)
            : dfault;
    }
    /** Split by spaces
     * @param {String} text 
     * @returns {Array<String>}         */
    splitSpaces(text) {
        let fn = this;
        text = fn.asString(text);
        let list = [];
        let item = "";
        let ontxt = "";
        let inx = 0;
        while (inx < text.length) {
            let c0 = text.charAt(inx++);
            if (c0 <= " ") {
                if (ontxt && c0 === " ") {
                    item += c0;
                    continue;
                }
                ontxt = false;
                if (item) {
                    list.push(item);
                    item = "";
                }
                continue;
            }
            if (ontxt) {
                if (c0 === ontxt) {
                    ontxt = "";
                } else item += c0;
                continue;
            }
            if (c0 === "\"" || c0 === "'") {
                ontxt = c0;
                item = "";
                continue;
            }
            item += c0;
        }
        if (item) list.push(item);
        return list;
    }
    /** Split by lines
     * @param {String} lines 
     * @returns {Array<String>}         */
    splitByLines(lines) {
        let list = [];
        let item = "";
        let line = 0;
        while (line < lines.length) {
            let c0 = lines.charAt(line++);
            if ((c0 < " ") && c0 !== "\t") {
                item = item.trim();
                if (item) {
                    list.push(item);
                    item = "";
                }
                continue;
            }
            item += c0;
        }
        item = item.trim();
        if (item) list.push(item);
        return list;
    }
    /** Decode from string in base64 to byte array
     * @param {String} text 
     * @returns {Array<Number>} */
    decodeBase64(text) {
        let fn = this;
        text = fn.asString(text).trim();
        let bff = Buffer.from(text, "base64");
        return [...bff];
    }
    /** Encode to base64 string
     * @param {Array<Number>} obj 
     * @param {String} encoding
     * @returns {String}         */
    encodeBase64(obj, encoding) {
        let fn = this;
        let bff = fn.asBuffer(obj);
        let enc = encoding === "base64"
            ? "base64"
            : "base64url";
        let txt = bff.toString(enc);
        while (txt.length & 3) {
            txt += "=";
        }
        return txt;
    }
    /** Decode from Hexagesimal String
     * @param {String} obj 
     * @returns {Array<Number>}         */
    decodeHex(obj) {
        let fn = this;
        let txt = fn.asString(obj);
        let bff = Buffer.from(txt, "hex");
        return [...bff];
    }
    /** Encode to Hexagesimal String
     * @param {*} obj 
     * @returns {String}                */
    encodeHex(obj) {
        let fn = this;
        let bff = fn.asBuffer(obj);
        let txt = bff.toString("hex");
        if ((txt.length & 1) === 1) txt = "0" + txt;
        return txt;
    }
    /** **Returns a random Buffer**.
     * 
     * @param {Number} sze 
     * @returns {Buffer}        */
    random(sze) { return crypto.randomBytes(sze); }
    /** Decode text.
     * From escaped to normal text
     * @param {String} obj 
     * @returns {String}        */
    decodeText(obj) {
        let fn = this;
        let rsp = "";
        let txt = fn.asString(obj);
        let inx = 0;
        while (inx < txt.length) {
            let c0 = txt.charAt(inx++);
            if (c0 === "\\") {
                let c1 = txt.charAt(inx++);
                switch (c1) {
                    case "n": rsp += "\n"; break;
                    case "r": rsp += "\r"; break;
                    case "t": rsp += "\t"; break;
                    case "\\":
                    case "\"":
                    case "\'":
                        rsp += c0;
                        break;
                    case "x":
                        let s0 = txt.substring(inx, inx + 2);
                        let c2 = parseInt(s0, 16);
                        inx += 2;
                        rsp += String.fromCharCode(c2);
                        break;
                    default:
                        rsp += c0;
                        rsp += c1;
                        break;
                }
                continue;
            }
            rsp += c0;
        }
        return rsp;
    }
    /** Encode Text
     * From normal text to escaped
     * @param {*} obj 
     * @returns {String}        */
    encodeText(obj) {
        let fn = this;
        if (fn.isMap(obj)) {
            return JSON.stringify(obj);
        }
        let rsp = "";
        let txt = fn.asString(obj);
        for (let x0 in txt) {
            let c0 = txt.charAt(x0);
            if (c0 === "\r") { rsp += "\\" + "r"; continue; }
            if (c0 === "\n") { rsp += "\\" + "n"; continue; }
            if (c0 === "\t") { rsp += "\\" + "t"; continue; }
            if (c0 === "\\") { rsp += "\\" + "\\"; continue; }
            if (c0 < " ") {
                let s0 = (c0.charCodeAt(0)).toString(16);
                if (s0.length < 2) s0 = "0" + s0;
                rsp += "\\" + "x" + s0;
                continue;
            }
            rsp += c0;
        }
        return rsp;
    }
    /** Gets string with fixed length.
     * @param {Object} obj 
     * @param {Number} len 
     * @param {String} prefix 
     * @returns {String}   */
    fixLength(obj, len, prefix) {
        let fn = this;
        let s = fn.asString(obj);
        if (typeof len !== 'number') len = 1;
        if (typeof prefix !== 'string') prefix = " ";
        while (s.length < len) {
            s = prefix + s;
        }
        return s;
    }
    /** Date to string (Basic format)
     * @param {Date} date 
     * @param {String} format 
     * @returns {String}  */
    dateString(date, format) {
        let fn = this;
        let /** @type {Date} */ dt = date;
        if (!format) {
            if (typeof dt === "string") {
                format = dt;
                dt = new Date();
            } else format = "yyyy-MM-dd HH:mm:ss.SSS";
        }
        if (dt && typeof dt === "string") {
            if (dt.charAt(0) === "\"") dt = dt.substring(1);
            if (dt.endsWith("\"")) dt = dt.substring(0, dt.length - 1);
        }
        dt = (fn.isNull(dt)) ? new Date() : new Date(dt);
        if (typeof dt.getTime !== "function") {
            dt = new Date("2000-01-01T00:00:00.000Z");
        }
        let rsp = "";
        let inx = 0, sze = format.length;
        while (inx < sze) {
            let c0 = format.charAt(inx++);
            let d0 = -1, z0 = 2;
            switch (c0) {
                case 'S': d0 = dt.getMilliseconds(); z0 = 3; break;
                case 's': d0 = dt.getSeconds(); break;
                case 'm': d0 = dt.getMinutes(); break;
                case 'H': d0 = dt.getHours(); break;
                case 'd': d0 = dt.getDate(); break;
                case 'M': d0 = dt.getMonth() + 1; break;
                case 'y': d0 = dt.getFullYear(); break;
            }
            if (d0 !== -1) {
                rsp += fn.fixLength(d0, z0, "0");
                while (format.charAt(inx) === c0) { inx++; }
                continue;
            }
            rsp += c0;
        }
        return rsp;
    }
    /** Read String arguments as Map
     * @param {Array<String>} argv 
     * @returns {Object}            */
    readArguments(argv) {
        let fn = this;
        if (!argv) argv = process.argv;
        let args = { argv: [] }
        let txt, key;
        for (let x0 = 0; x0 < argv.length; x0++) {
            txt = argv[x0];
            if (txt.startsWith("-")) {
                if (key) args[key] = true;
                key = "";
                while (txt.startsWith("-")) {
                    txt = txt.substring(1);
                }
                let pos = txt.indexOf("=");
                if (pos > 0) {
                    key = txt.substring(0, pos);
                    txt = txt.substring(pos + 1);
                    if (["true", "false"].indexOf(txt) !== -1) {
                        txt = fn.asBool(txt);
                    }
                    args[key] = txt;
                    key = "";
                    continue;
                }
                key = txt;
                continue;
            }
            if (key) {
                if (["true", "false"].indexOf(txt) !== -1) {
                    txt = fn.asBool(txt);
                }
                args[key] = txt;
                key = "";
            } else args.argv.push(txt);
        }
        if (key) args[key] = true;
        // :::::::::::::::::::::::::::::::::::::::::::::::
        if (("debug" in args) || ("dbg" in args)) {
            let dlevel = fn.getNumber(args, ["debug", "dbg"]);
            fn.debugLevel = dlevel;
            delete (args["debug"]);
            delete (args["dbg"]);
        }
        // :::::::::::::::::::::::::::::::::::::::::::::::
        for (let k0 in args.argv) {
            k0 = args.argv[k0];
            if (k0.endsWith(".json") ||
                k0.endsWith(".yaml")) {
                let map1 = fn.readMap(k0);
                if (map1) {
                    args = fn.update(map1, args);
                }
            }
        }
        // :::::::::::::::::::::::::::::::::::::::::::::::
        let cfile = fn.getString(args, ["conf", "config", "cfg", "c"]);
        if (cfile) {
            let map1 = fn.readMap(k0);
            if (map1) {
                args = fn.update(map1, args);
            }
        }
        // :::::::::::::::::::::::::::::::::::::::::::::::
        let deviceid = fn.getString(args, ["deviceid"]);
        if (!deviceid) {
            try {
                deviceid = fn.asString(
                    readFileSync("/usr/local/device/device.id"));
                deviceid = deviceid.trim();
                args["deviceId"] = deviceid;
            } catch (err) { }
        }
        return args;
    }
    /** Adds Buffer to Array
     * @param {Array} dst  
     * @param {Buffer} src 
     * @returns {Array}     */
    addToArray(dst, src) {
        if ((Buffer.isBuffer(src) ||
            Array.isArray(src)) &&
            (Array.isArray(dst))) {
            for (let x0 = 0; x0 < src.length; x0++) {
                dst.push(src[x0] & 255);
            }
        }
        return dst;
    }
    /** Prints log accord previous programed debug level
     * @param {Number} level 
     * @param  {...any} args    */
    log(level, ...args) {
        let fn = this;
        if (typeof level === "number"
            && level <= fn.debugLevel) {
            //-----------------------------------
            let tm = fn.dateString("[H:m:s.S]");
            args.unshift(tm);
            console.log(...args);
        }
    }
    /** Prints log accord previous programed debug level
     * @param {Number} level 
     * @param  {...any} args    */
    error(level, ...args) {
        let fn = this;
        if (typeof level === "number"
            && level <= fn.debugLevel) {
            //-----------------------------------
            let tm = fn.dateString("[H:m:s.S]");
            args.unshift(tm);
            console.warn(...args);
        }
    }
    /** Gets the byte array representation by
     * fixed length lines.
     * 
     * @param {Array<Number>} obj 
     * @param {Number} width 
     * @returns {String}     */
    printBytes(obj, width) {
        let fn = this;
        if (typeof width !== "number") width = 16;
        let bff = fn.asBytes(obj);
        let rsp = ` ${bff.length} bytes`;
        let inx = 0;
        while (inx < bff.length) {
            let off = inx;
            let sze = bff.length - off;
            if (sze > width) sze = width;
            inx += sze;

            let btes = bff.slice(off, inx);
            let s1 = Fn.encodeHex(btes);
            let s2 = "";
            let x0 = 0;
            while (x0 < sze) {
                let c0 = btes[x0++] & 255;
                if (c0 > 32 && c0 < 127) {
                    s2 += String.fromCharCode(c0);
                } else s2 += ".";
            }
            while (x0 < width) {
                s1 += "..";
                s2 += ".";
                x0 += 1;
            }
            if (rsp) rsp += "\n";
            rsp += `${s1}\t${s2}`;
        }
        return rsp;
    }
    /** Remove bad characters from password.
     * 
     * 
     * @param {String} passwd 
     * @returns {String}    */
    encodePassword(passwd) {
        return passwd.replace(/[\\"'`:]/g, '.');
    }
    /** Get a Header from specified map.
     * 
     * @param {import("./iot.defines").IOT.HeaderNamesEnum} name 
     * @param {import("http").IncomingMessage} headers 
     * @returns {String}        */
    getHeader(name, headers) {
        let fn = this;
        name = fn.keyNormal(name)
        return fn.getString(headers, [name]);
    }
    /** Sort JSon Map
     * @param {Object} map 
     * @returns {Object}    */
    sortJSon(map) {
        let fn = this;
        let resp = {};
        const getmapattr = (map) => {
            let mlist = [];
            for (let k0 in map) {
                let v0 = map[k0];
                if (!fn.isMap(v0)) {
                    mlist.push(k0);
                }
            }
            return mlist.sort();
        };
        const getmapobjs = (map) => {
            let mlist = [];
            for (let k0 in map) {
                let v0 = map[k0];
                if (fn.isMap(v0)) {
                    mlist.push(k0);
                }
            }
            return mlist.sort();
        };
        let attr = getmapattr(map);
        let objs = getmapobjs(map);
        for (let k0 in attr) {
            k0 = attr[k0];
            resp[k0] = map[k0];
        }
        for (let k0 in objs) {
            k0 = objs[k0];
            let m0 = fn.sortJSon(map[k0]);
            resp[k0] = m0;
        }
        return resp;
    }
    /** Gets the Date as 0 Hour
     * 
     * @returns {Date}      */
    date1Hour() {
        let fn = this;
        let dtxt = fn.dateString(new Date(), "y-M-d");
        dtxt = `${dtxt} 00:00:00.000`;
        return new Date(dtxt);
    }
    /** Adds Field to Date 
     * 
     * @param {Date} dt 
     * @param {import("./iot.defines").IOT.DateFieldType} field 
     * @param {Number} value 
     * @returns {Date}     */
    dateAdd(dt, field, value) {
        let d0 = new Date(dt);
        if (field) {
            value = Fn.asNumber(value);
            switch (field) {
                case "seconds": /**/ d0.setSeconds(d0.getSeconds() + value); break;
                case "minutes": /**/ d0.setMinutes(d0.getMinutes() + value); break;
                case "hours":   /**/ d0.setHours(d0.getHours() + value); break;
                case "days":    /**/ d0.setDate(d0.getDate() + value); break;
                case "month":   /**/ d0.setMonth(d0.getMonth() + value); break;
                case "year":    /**/ d0.setFullYear(d0.getFullYear() + value); break;
            }
        }
        return d0;
    }
    /** Camelize The Name
     * 
     * @param {String} text 
     * @returns {String}            */
    camelCase(text) {
        if (text.startsWith("@")) return text;
        text = this.snakeCase(text);
        return text
            .toLowerCase()
            .replace(/[-_.:;\s]+(.)?/g, (_, letter) => letter ? letter.toUpperCase() : '')
            .replace(/^[A-Z]/, letter => letter.toLowerCase());
    }
    /** Pascalize The Name
     * 
     * @param {String} text 
     * @returns {String}            */
    pascalCase(text) {
        if (text.startsWith("@")) return text;
        text = this.snakeCase(text);
        return text
            .toLowerCase()
            .replace(/[-_.:;\s]+(.)?/g, (_, letter) => letter ? letter.toUpperCase() : '')
            .replace(/^\w/, letter => letter.toUpperCase());
    }
    /** Snake Case The Name
     * 
     * @param {String} text 
     * @returns {String}            */
    snakeCase(text) {
        if (text.startsWith("@")) return text;
        text = this.asString(text).trim();
        return text
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s\-.,:;]+/g, '_')
            .toLowerCase()
            .replace(/^_+|_+$/g, '');
    }
    /** Parse all Map to camelCase.
     * 
     * @param {*} obj 
     * @returns {Record<String,Object>}     */
    toCamelCase(obj) {
        let fn = this;
        if (Array.isArray(obj)) {
            let list = [];
            obj.map((v, k) => {
                list[k] = fn.toCamelCase(v);
            });
            return list;
        }
        if (fn.isMap(obj)) {
            let rsp = {};
            Object.entries(obj).map((m) => {
                let v = fn.toCamelCase(m[1]);
                let n = fn.camelCase(m[0]);
                rsp[n] = v;
            });
            return rsp;
        }
        return obj;
    }
    /** Parse all Map to PascalCase.
     * 
     * @param {*} obj 
     * @returns {Record<String,Object>}     */
    toPascalCase(obj) {
        let fn = this;
        if (Array.isArray(obj)) {
            let list = [];
            obj.map((v, k) => {
                list[k] = fn.toPascalCase(v);
            });
            return list;
        }
        if (fn.isMap(obj)) {
            let rsp = {};
            Object.entries(obj).map((m) => {
                let v = fn.toPascalCase(m[1]);
                let n = fn.pascalCase(m[0]);
                rsp[n] = v;
            });
            return rsp;
        }
        return obj;
    }
    /** Parse all Map to snake_case.
     * 
     * @param {*} obj 
     * @returns {Record<String,Object>}     */
    toSnakeCase(obj) {
        let fn = this;
        if (Array.isArray(obj)) {
            let list = [];
            obj.map((v, k) => {
                list[k] = fn.toSnakeCase(v);
            });
            return list;
        }
        if (fn.isMap(obj)) {
            let rsp = {};
            Object.entries(obj).map((m) => {
                let v = fn.toSnakeCase(m[1]);
                let n = fn.snakeCase(m[0]);
                rsp[n] = v;
            });
            return rsp;
        }
        return obj;
    }
    /** Compare two expressions
     * 
     * Returns 0 if equals
     * 
     * @param {*} a 
     * @param {*} b 
     * @param {boolean} desc 
     * @returns {Number}        */
    compare(a, b, desc) {
        let fn = this;
        let val = -1;
        if (!desc) {
            val = (typeof a === "string")
                ? a.localeCompare(b)
                : (typeof a === "number")
                    ? a - b
                    : fn.asString(a).localeCompare(fn.asString(b));
        } else {
            val = (typeof b === "string")
                ? b.localeCompare(a)
                : (typeof b === "number")
                    ? b - a
                    : fn.asString(b).localeCompare(fn.asString(a));
        }
        return val;
    }
    /** Sort a Object Array using given key
     * 
     * @param {Array} array
     * @param {String} key 
     * @param {Boolean} desc 
     * @returns {Array} */
    sortArray(array, key, desc) {
        let fn = this;
        if (Array.isArray(array)
            && array.length > 0
            && key
            && typeof key === "string") {
            if (fn.isMap(array[0]) && (key in array[0])) {
                let resp = array.slice();
                try {
                    if (!desc) {
                        resp.sort((a, b) => {
                            return (typeof a[key] === "string")
                                ? a[key].localeCompare(b[key])
                                : (typeof a[key] === "number")
                                    ? a[key] - b[key]
                                    : fn.asString(a[key]).localeCompare(fn.asString(b[key]));
                        });
                    } else {
                        resp.sort((a, b) => {
                            return (typeof b[key] === "string")
                                ? b[key].localeCompare(a[key])
                                : (typeof b[key] === "number")
                                    ? b[key] - a[key]
                                    : fn.asString(b[key]).localeCompare(fn.asString(a[key]));
                        });
                    }
                } catch (err) { }
                return resp;
            }
        }
        return array;
    }
    /** Gets the unique values from specified Array
     * 
     * @param {Array} array 
     * @param {String} key 
     * @returns {Array}     */
    uniqueValues(array, key) {
        return [...new Set(array.map(p => p[key]))].filter(Boolean);//.sort();
    }
    /** Filter the item equals as specified value
     * 
     * @param {Array} array 
     * @param {String} key 
     * @param {String} value 
     * @returns {Array}         */
    filterMatch(array, key, value) {
        let fn = this;
        let resp = [];
        value = fn.asString(value).trim().toLowerCase();
        if (Array.isArray(array) && value) {
            array.map((item) => {
                let comp = fn.asString(item[key]).toLowerCase();
                if (comp === value) resp.push(item);
            });
            return resp;
        }
        return array;
    }
    /** Filter The items that contains the specified text
     * @param {Array} array 
     * @param {String} key 
     * @param {String} text 
     * @returns {Array}         */
    filterPattern(array, key, text) {
        let fn = this;
        text = fn.asString(text).toLowerCase();
        if (text) {
            let resp = array.filter(p =>
                fn.asString(p[key]).toLowerCase().indexOf(text) !== -1);
            return resp;
        }
        return array;
    }
    /** Filter by the last row with specified key
     * 
     * @param {Array} list 
     * @param {String} key 
     * @returns {Array}         */
    filterList(list, key) {
        let resp = [];
        let nlist = {};
        for (let k0 in list) {
            let nme = list[k0][key];
            nlist[nme] = k0;
        }
        for (let k0 in nlist) {
            let n0 = nlist[k0];
            resp.push(list[n0]);
        }
        return resp;
    }
    /** Sets Date as MariaDB wants.
     * 
     * @param {Date} date 
     * @returns {String}    */
    asDateString(date) {
        date = date ? new Date(date) : new Date();
        if (isNaN(date.getTime())) {
            date = new Date("2000-01-01T12:00:00.000Z");
        }
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    /** Checks if Working Hour given the shedule and date.
     * 
     * The format: **HH:mm-HH:mm** 
     * 
     * The working hour has the seven days shedule separated by '|'
     * and each shedule range for day separated by colon ','
     * 
     * @param {String} work_hours 
     * @param {Date} date 
     * @returns {Boolean}   */
    isWorkingHour(work_hours, date) {
        work_hours = this.asString(work_hours);
        if (!work_hours) return false;
        date = date ? new Date(date) : new Date();
        let fields = work_hours.split("|");
        if (fields.length >= 7) {
            let day = date.getDay();
            if (!isNaN(day)) {
                let minutes = date.getHours() * 60 + date.getMinutes();
                let hour_ranges = fields[day].split(',');
                for (let hour_range of hour_ranges) {
                    let [field0, field1] = hour_range.split('-');
                    if (!field0 || !field1) return false;
                    //
                    let [hour0, min0] = field0.split(':').map(Number);
                    let [hour1, min1] = field1.split(':').map(Number);
                    if (isNaN(hour0) || isNaN(min0) || isNaN(hour1) || isNaN(min1)) {
                        return false;
                    }
                    min0 = hour0 * 60 + min0;
                    min1 = hour1 * 60 + min1;
                    if (minutes >= min0 && minutes <= min1) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /** **Descompress/Inflate function**.
     * 
     * @param {*} data
     * @returns {Promise<Buffer>}   */
    gunzip(data) {
        const fpromise = new Promise((resolve) => {
            let bff = Fn.asBuffer(data);
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
    }
    /** **Descompress/Inflate function**.
     * 
     * ***Blocking Mode***
     * 
     * @param {*} data
     * @returns {Buffer}   */
    gunzipSync(data) {
        let bff = this.asBuffer(data);
        try {
            let unzipped = zlib.gunzipSync(bff, {
                windowBits: zlib.constants.Z_MAX_WINDOWBITS
            });
            return unzipped;
        } catch (e) { }
        return bff;
    }
    /** **Compress/Deflate the specified Data**.
     * 
     * @param {Buffer} data
     * @returns {Promise<Buffer>}       */
    gzip(data) {
        const fpromise = new Promise((resolve) => {
            try {
                let bff = Fn.asBuffer(data);
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
    }
    /** **Compress/Deflate the specified Data**.
     *
     * ***Blocking mode***.
     *  
     * @param {Buffer} bff 
     * @returns {Buffer}       */
    gzipSync(data) {
        let bff = this.asBuffer(data);
        try {
            let zipped = zlib.gzipSync(bff, {
                level: zlib.constants.Z_BEST_SPEED,
            });
            return zipped;
        } catch (e) { }
        return bff;
    }
    /** **Clean null values from specified map**.
     * 
     * @param {Object} obj 
     * @returns {Object}        */
    cleanMap(obj) {
        let fn = this;
        if (fn.isMap(obj)) {
            let keys0 = [];
            let keys1 = Object.keys(obj);
            keys1.map((k0) => {
                let v0 = obj[k0];
                if (v0 === undefined || v0 === null) {
                    keys0.push(k0)
                } else if (fn.isMap(v0)) {
                    obj[k0] = fn.cleanMap(v0);
                } else if (Array.isArray(v0)) {
                    v0.map((v1, k1) => {
                        v0[k1] = fn.cleanMap(v1)
                    });
                }
            });
            keys0.map((k) => delete (obj[k]));
        }
        return obj;
    }
    /** **Remove specified keys from Map**.
     * 
     * @param {Object} obj 
     * @param {Array<String>} keys 
     * @returns {Object}        */
    removeKeys(obj, keys) {
        let fn = this;
        if (fn.isMap(obj)) {
            let keys1 = Object.keys(obj);
            keys1.map((k0) => {
                let v0 = obj[k0];
                if (fn.isMap(v0)) {
                    obj[k0] = fn.removeKeys(v0);
                } else if (Array.isArray(v0)) {
                    v0.map((v1, k1) => {
                        v0[k1] = fn.removeKeys(v1)
                    });
                }
            });
            keys.map((k) => { if (k in obj) { delete (obj[k]) } });
        }
        return obj;
    }
    /** **Convert incoming to Map type**
     * 
     * Use to pass reception and prefer JSon Notation
     * 
     * @param {*} obj 
     * @returns {Record<String,Object>|String}  */
    toMapObject(obj) {
        let fn = this;
        let map;
        let txt = fn.asString(obj);
        try { map = JSON.parse(txt); } catch (e) { }
        return map ? map : txt;
    }
    /** **Lock Thread**.
     * 
     * @returns {Promise<Boolean>}  */
    waitLock() {
        const fpromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1);
        });
        return fpromise;
    }
    /** Create a buffer with random bytes
     * 
     * @param {Number} sze 
     * @returns {Buffer}    */
    randomBytes(sze) { return Buffer.from(crypto.randomBytes(sze)); }
    /** **Get the current time in nanoseconds**.
     * 
     * returns a BigInt with 8 bytes.
     * 
     * @returns {BigInt}    */
    nanos() {
        let d0 = process.hrtime.bigint() - _nanosTime0;
        return _millsTime0 + d0;
    }
    /** Create a new UUID
     * 
     * Use v4 variation 10.
     * 
     * The prefix is used to identifiy the source.
     * Empty to create a random one.
     * 
     * @param {String} prefix 
     * @returns {String}        */
    createUUID(prefix) {
        let m0 = crypto.randomBytes(8).toString("hex").padStart(16, "a");
        m0 += this.nanos().toString(16).padStart(16, "0");
        let m1 = `${m0.substring(8, 12)}` + `-${m0.substring(12, 16)}` + `-${m0.substring(16)}`
        if (typeof prefix === "string" && prefix) {
            prefix = prefix.trim().replace(/[\s\-_.,:;]+/g, '-').toLowerCase();
            m1 = `${prefix}-${m1}`;
            return m1;
        }
        if (typeof prefix === "number") {
            m1 = `x${prefix.toString(16).padStart(4, "0")}-${m1}`;
            return m1;
        }
        m1 = `${m0.substring(0, 8)}-${m1}`;
        return m1;
    }
    /** Set a date how database expects.
     * 
     * @param {Date|String} value 
     * @returns {String}    */
    toSQLDate(value) {
        let date = new Date(value);
        if (isNaN(date.getTime())) {
            date = new Date("2020-01-01 12:00:00");
        }
        let txt = date.toISOString();
        txt = txt.substring(0, 19).replace("T", " ");
        return txt;
    }
}
/** Utilities Functions
 * @type {FnModule}             */
const Fn = new FnModule();
/** Filesystem Module           */
class FsModule {
    constructor() {
        /** Asigned Path
         * @type {String}       */
        this.pathname = "";
        return this;
    }
    /** Checks if absolute path is absolute
     * @param {String} fname 
     * @returns {Boolean}       */
    isAbsolute(fname) { return _isAbsolute(fname); }
    /** Gets archive name
     * @param {String} fname 
     * @returns {String}        */
    basename(fname) { return _basename(fname); }
    /** Gets directory name
     * @param {String} fname 
     * @returns {String}        */
    dirname(fname) { return _dirname(fname); }
    /** Join paths
     * @param  {...any} args 
     * @returns {String}        */
    join(...args) { return _join(...args); }
    /** Checks if path is Archive
     * @param {String} fname 
     * @returns {Boolean}       */
    isFile(fname) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        try {
            let stat = statSync(fname);
            return stat.isFile();
        } catch (err) { }
        return false;
    }
    /** Checks if path is directory
     * @param {String} fname 
     * @returns {Boolean}       */
    isDirectory(fname) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        try {
            let stat = statSync(fname);
            return stat.isDirectory();
        } catch (err) { }
        return false;
    }
    /** Checks if File exist
     * @param {String} fname 
     * @returns {Boolean}       */
    exist(fname) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        try {
            let stat = statSync(fname);
            return stat.isDirectory()
                || stat.isFile();
        } catch (err) { }
        return false;
    }
    /** Create Directory. If needed
     * @param {String} fname 
     * @returns {Boolean}           */
    makeDir(fname) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        let /** @type {import("fs").Stats} */ stat;
        try {
            stat = statSync(fname);
        } catch (err) { }
        if (!stat) {
            try {
                mkdirSync(fname, { recursive: true });
                stat = statSync(fname);
            } catch (err) { }
        }
        return stat ? stat.isDirectory() : false;
    }
    /** Gets absolute Path
     * @param {String} fname  File basename
     * @param {String} dname  (Optional) File dirname
     * @returns {String}            */
    getAbsolute(fname, dname) {
        let fn = this;
        if (!_isAbsolute(fname)) {
            if (typeof dname !== "string") {
                dname = fn.pathname;
            }
            fname = _join(dname, fname);
        }
        return fname;
    }
    /** Reads the specified File */
    fileRead(fname, opts) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        let rsp;
        try {
            rsp = readFileSync(fname, opts);
        } catch (err) { }
        return rsp;
    }
    /** Writes the specified File */
    fileWrite(fname, fdata, opts) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        fdata = Fn.asBuffer(fdata);
        try {
            writeFileSync(fname, fdata, opts);
            return true;
        } catch (err) { }
        return false;
    }
    /** Appends, write to end.
     * 
     * @param {String} fname 
     * @param {String|Buffer} fdata 
     * @param {*} opts 
     * @returns {Boolean}           */
    fileAppend(fname, fdata, opts) {
        let fn = this;
        fname = fn.getAbsolute(fname);
        fdata = Fn.asBuffer(fdata);
        try {
            appendFileSync(fname, fdata, opts);
            return true;
        } catch (err) { }
        return false;
    }
    /** Reads JSon Map  */
    readJSon(fname) {
        let fn = this;
        let txt = fn.fileRead(fname, { encoding: "utf-8" });
        return Fn.asMap(txt);
    }
    /** Write JSon Map  */
    writeJSon(fname, fmap, opts) {
        let fn = this;
        let txt = JSON.stringify(fmap, 0, "    ");
        return fn.fileWrite(fname, txt, opts);
    }
}
/** Filesystem Utilities
 * @type {FsModule}             */
const Fs = new FsModule();
//
export { EventListener, RawBuffer, CRC16, Fn, Fs };
