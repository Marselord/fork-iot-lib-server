/**
 * Data base Generic Driver
 */
//

import crypto from "crypto";
import { Fn } from "./utilities.js";
//
/** SQL Query Results       */
class QueryResults {
    /** SQL Query Results
     * 
     * @param {Record<String,Object>} err 
     * @param {Record<String,Object>} results 
     * @param {Record<String,Object>} fields    */
    constructor(err, results, fields) {
        /** @type {Error}                       */
        this.error = err;
        /** @type {Record<String,Object>[]}     */
        this.results = results;
        /** @type {Record<String,Object>[]}     */
        this.fields = fields;
    }
    /** Checks if results has data.
     * 
     * Returns `true` if has one or more rows as results
     * @returns {Boolean}   */
    hasData() {
        return Array.isArray(this.results)
            && this.results.length > 0
    }
}
/** Drives a Database Connection    */
class DatabaseConnection {

    constructor(parent, opts) {
        /** @type {DatabasePool}    */
        this.parent = parent;
        /** @type {import("./iot.defines").IOT.DBConnectOptionsType} */
        this.options = Fn.update({}, opts);
    }
    /** Disconnect from Database 
     * @returns {Promise<Boolean>}  */
    close() {
        const fpromise = new Promise((resolve) => {
            resolve(true);
        });
        return fpromise;
    }
    /** Connect to Database */
    connect() { return null; }
    /** **Read the secure password for specified plain password**.
     * 
     * @param {String} passwd 
     * @returns {Promise<String>}   */
    readPassword(passwd) {
        const fpromise = new Promise((resolve) => {
            resolve("");
        });
        return fpromise;
    }
    /** **Given a SQL sentence returns the table to be used**.
     * 
     * @param {String} sql 
     * @returns {String}
     */
    getTableFromSentence(sql) {
        let txt = sql.trim().toUpperCase();
        let match;
        if (txt.startsWith("SELECT")) {
            match = sql.match(/FROM\s+([`"]?[\w.]+[`"]?)/i);
        } else if (txt.startsWith("INSERT")) {
            match = sql.match(/INTO\s+([`"]?[\w.]+[`"]?)/i);
        } else if (txt.startsWith("UPDATE")) {
            match = sql.match(/UPDATE\s+([`"]?[\w.]+[`"]?)/i);
        } else {
            return ""; // unsupported sentence.
        }
        return match ? match[1].replace(/[`"]/g, "") : null;
    }
    /** Do a SQL Statement
     * 
     * @param {String} sql 
     * @param {Array<String>} values 
     * @returns {Promise<QueryResults>} */
    query(sql, values) {
        return new Promise((resolve) => {
            let resp = new QueryResults(
                new Error("Not implemented yet"),
                null,
                null);
            resolve(resp);
        });
    }
}
/** Drives a database table */
class TableDescriptor {
    constructor(pool, name, tble) {
        /** @type {String}          */
        this.name = name
        /** @type {DatabasePool}    */
        this.parent = pool;
        /** @type {String}          */
        this.title = "";
        /** @type {import("./iot.defines").IOT.TableOptionsType}  */
        this.options = {};
        /** @type {import("./iot.defines").IOT.TableColDescriptorType}  */
        this.cols = {};
        Fn.update(this, tble);
    }

    /** Checks if Table has a Column with given name
     * @param {String} name 
     * @returns {Boolean}           */
    hasColumn(name) {
        let table = this;
        return (name in table.cols);
    }
    /** Get the Column names for this table.
     * 
     * If defines exclude, 'exclude' this from result.
     * 
     * @param {Array} exclude 
     * @returns {String}    */
    getColumnNames(exclude) {
        let table = this;
        let cnames = Object.keys(table.cols);
        if (Array.isArray(exclude)) {
            let dnames = [];
            cnames.map((key) => {
                if (!exclude.includes(key)) {
                    dnames.push(key);
                }
            });
            cnames = dnames;
        }
        return cnames.join(",");
    }
}
/** Drives a Database Connection Pool */
class DatabasePool {
    constructor(parent) {
        /** @type {Object} */
        this.parent = parent;
        /** @type {import("./iot.defines").IOT.TableCollectionType} */
        this.tables = {};
        /** @type {import("./iot.defines").IOT.DBDescriptorType}    */
        this.descriptor = {};
        /** @type {import("./iot.defines").IOT.DBConfigurationType} */
        this.config = {
            databases: {},
            users: {},
        };
        /** Database to be used
         * 
         *  ***Application depended***
         * 
         * @type {String}                   */
        this.dbname = "";
        /** Database User to be used
         * 
         * ***Application depended***
         * 
         * @type {String}                   */
        this.dbuser = ""
    }
    /** **Get a Database Connection**
     * 
     * @param {String} database 
     * @param {String} username 
     * @returns {DatabaseConnection}    */
    getConnection(database, username) {
        let pool = this;
        let conf = pool.config;
        if (!database) database = pool.dbname;
        if (database in conf.databases) {
            if (!username) username = pool.dbuser;
            if (username in conf.users) {
                let opts = Fn.update({}, conf[database]);
                opts = Fn.update(opts, conf[username]);
                return new DatabaseConnection(
                    pool, opts
                );
            }
        }
        return null;
    }
    // /** Sets Pool configurations.
    //  * 
    //  * Returns `true` if was configured OK.
    //  * 
    //  * @param {*} map 
    //  * @returns {Boolean}       */
    // setConnections(map) {
    //     let pool = this;
    //     if (!map) map = Fn.readArguments();
    //     if (typeof map === "string") {
    //         map = Fn.readMap(map);
    //     }
    //     let obj = Fn.getKey(map, ["databasepool", "dbpool", "pool"]);
    //     if (obj) map = obj;
    //     let dne = false;
    //     if (Fn.isMap(map)) {
    //         let flag = 0;
    //         if ("databases" in map) {
    //             pool.config.databases = { ...map["databases"] };
    //             flag = 1;
    //         };
    //         if ("users" in map) {
    //             pool.config.users = { ...map["users"] };
    //             flag |= 2;
    //         };
    //         if (map.descriptor) {
    //             let desc = Fn.readMap(map.descriptor);
    //             if (desc && desc.tables) {
    //                 pool.descriptor = { ...desc };
    //                 pool.tables = pool.descriptor.tables;
    //                 flag |= 4;
    //             }
    //         }
    //         pool.dbname = Fn.getString(map, ["databasename", "dbname"]);
    //         pool.dbuser = Fn.getString(map, ["databaseuser", "dbuser"]);
    //         if (!pool.dbuser) pool.dbuser = "default_user";
    //         dne = flag === 7;
    //     }
    //     return dne;
    // }
    /** **Given a SQL sentence returns the table to be used**.
     * 
     * @param {String} sql 
     * @returns {String}        */
    getTableFromSentence(sql) {
        let txt = sql.trim().toUpperCase();
        let match;
        if (txt.startsWith("SELECT")) {
            match = sql.match(/FROM\s+([`"]?[\w.]+[`"]?)/i);
        } else if (txt.startsWith("INSERT")) {
            match = sql.match(/INTO\s+([`"]?[\w.]+[`"]?)/i);
        } else if (txt.startsWith("UPDATE")) {
            match = sql.match(/UPDATE\s+([`"]?[\w.]+[`"]?)/i);
        } else {
            return ""; // unsupported sentence.
        }
        return match ? match[1].replace(/[`"]/g, "") : "";
    }
    // /** **Read the secure password for specified plain password**.
    //  * 
    //  * @param {String} passwd 
    //  * @returns {Promise<String>}   */
    // securePassword(passwd) {
    //     const fpromise = new Promise((resolve) => {
    //         const fasync = async () => {
    //             let pool = this;
    //             let resp = "";
    //             let dbo = pool.getConnection();
    //             if (dbo) {
    //                 let sql = `select password(${passwd}) as passwd`;
    //                 let qry = await dbo.query(sql, []);
    //                 await dbo.close();
    //                 if (qry.hasData()) {
    //                     resp = qry.results[0]["passwd"];
    //                 }
    //             }
    //             resolve(resp);
    //         };
    //         setImmediate(() => { fasync(); });
    //     });
    //     return fpromise;
    // }
    // /** Encode a Password.
    //  * 
    //  * Convert the password to hash.
    //  * 
    //  * @param {String} passwd 
    //  * @returns {Promise<String>}   */
    // encodePassword(passwd) {
    //     const fpromise = new Promise((resolve) => {
    //         const fasync = async () => {
    //             let text = passwd.replace(/[\\'"`]/g, '');
    //             let hash = crypto.createHash('sha256')
    //                 .update(text)
    //                 .digest('hex');
    //             resolve(hash);
    //         };
    //         setImmediate(() => { fasync(); });
    //     });
    //     return fpromise;
    // }
    /** Gets a Table Descriptor
     * 
     * @param {String} name 
     * @returns {TableDescriptor} */
    getTable(name) {
        let pool = this;
        return (name in pool.tables)
            ? pool.tables[name]
            : null;
    }
    /** **Get a Date as Database wants**.
     * 
     * @param {Date} date 
     * @returns {String}        */
    toSQLDate(date) {
        date = (!date) ? new Date(date) : new Date();
        if (isNaN(date.getTime())) {
            date = new Date("2020-01-01 12:00:00");
        }
        let txt = date.toISOString()
            .substring(0, 19)
            .replaceAll("T", " ");
        return txt;
    }
}
//
export { QueryResults, DatabaseConnection, DatabasePool, TableDescriptor }; 
