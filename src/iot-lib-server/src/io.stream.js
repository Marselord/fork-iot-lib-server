/**
 * Input/Output Module
 */

import net from "net";
import { EventListener, Fn, RawBuffer } from "./utilities.js";
import { IOREASON } from "./constants.js";

/** Input/Output Stream Protocol Receptor   */
class IOReceptor {
    /** Protocol Receptor
     * 
     * @param {IOStream} parent     */
    constructor(parent) {
        /** @type {IOStream}        */
        this.parent = parent;
    }

    checkTimeout() { }

    clear() { }

    receive(data) { }
}
/** Defines a Secure Device         */
class IOSecure {
    constructor(parent) {
        /** @type {IOStream}        */
        this.parent = parent;
        /** @type {Boolean}         */
        this.secured = false;
    }
    /** Pattern to validate integrity
     * @type {String}               */
    static pattern = "!!!ValidateOK!!!";
    /** Prepare for a new Secure Connection */
    clear() {
        this.secured = false;
        return this;
    }
    /** **Key Exchange**.
     * 
     * First step using Diffie-Hellman exchange.
     * 
     * From Client to Server.
     * @param {RawBuffer} _            
     * @returns {Promise<Boolean>}      */
    clientHello(_) {
        const fpromise = new Promise((resolve) => {
            resolve(false);
        });
        return fpromise;
    }
    /** **Key Exchange**.
     * 
     * Second step using Diffie-Hellman exchange.
     * 
     * From Server to Client.
     * @param {RawBuffer} _            
     * @return {Promise<Boolean>}       */
    serverHello(_) {
        const fpromise = new Promise((resolve) => {
            resolve(false);
        });
        return fpromise;
    }
    /** **Key Exchange**.
     * 
     * Last step using Diffie-Hellman exchange.
     * 
     * From Client to Server.
     * @param {RawBuffer} _            
     * @returns {Promise<Boolean>}  */
    exchangeDone(_) {
        const fpromise = new Promise((resolve) => {
            resolve(false);
        });
        return fpromise;
    }
    /** **Decrypt specified data**.
     * 
     * From cipher to plain text.
     * 
     * Process after reception.
     * 
     * @param {*} bff 
     * @returns {Promise<Array<Number>|Buffer>  */
    decrypt(bff) {
        const fpromise = new Promise((resolve) => {
            resolve(bff);
        });
        return fpromise;
    }
    /** **Encrypt specified data**.
     * 
     * From plain to cipher text.
     * 
     * Process before transmission.
     * 
     * @param {*} bff 
     * @returns {Promise<Array<Number>|Buffer>} */
    encrypt(bff) {
        const fpromise = new Promise((resolve) => {
            resolve(bff);
        });
        return fpromise;
    }
    /** **Get the server that create this connection//
     * 
     * @returns {IOServer}  */
    getServer() { return this.parent.parent; }
}
/** Input/Output Buffer for Transmission*/
class IOTxBuffer {
    constructor(data) {
        /** @type {Array<Number>} */
        this.data = [...Fn.asBytes(data)];
        /** @type {Number} */
        this.offset = 0;
    }
}
/** Input/Output Stream Object                  */
class IOStream extends EventListener {
    constructor(parent) {
        super();
        /** Object Owner @type {IOStream|Object}*/
        this.parent = parent;
        /** **IO Stream**: Asigned Name
         * @type {String}                       */
        this.name = "";
        /** **IO Stream**: Asigned Address
         * @type {String}                       */
        this.address = "";
        /** **IO Stream**: Protocol Receptor 
         * @type {IOReceptor}                   */
        this.receptor = null;
        /** Transport Layer Secure Object.
         * @type {IOSecure}                     */
        this.tls = null;
        /** @type {import("./iot.defines").IOT.ConnectStateEnum}    */
        this.state = "closed";
        /** @type {import("./iot.defines").IOT.ConnectOptionsType}  */
        this.options = {};
        /** Why the stream was closed.
         * @type {Number}                       */
        this.reason = 0;
        let tm = Fn.millis();
        /** Last Reception time stamp 
         * @type {Number}                       */
        this.lastRx = tm;
        /** Last Transmission time stamp 
         * @type {Number}                       */
        this.lastTx = tm;
        /** Process time stamp 
         * @type {Number}                       */
        this.procTm = tm;
        /** Reconnection Flag
         * @type {Number}                       */
        this.rcnxflag = false;
    }
    /** Get the Object Owner
     * @returns {IOStream}                      */
    getParent() { return this.parent; }
    /** Gets the client,stream or socket address
     * 
     * 
     * @param {net.Socket|IOStream|String} client 
     * @returns {String}        */
    static getAddress(client) {
        let stream = this;
        let addr = "";
        if (client instanceof net.Socket) {
            let ipa = client.remoteAddress;
            let ipo = client.remotePort;
            addr = `${ipa}:${ipo}`;

        } else if (client instanceof IOStream) {
            addr = client.address;

        } else if (typeof client === "string") {
            addr = client;

        } else addr = stream.address;
        addr = addr.trim().toLowerCase();
        return addr;
    }
    /** Checks if it is equal to argument.
     * 
     * @param {*} obj 
     * @returns {Boolean}               */
    equals(obj) {
        if (obj instanceof IOStream) {
            return obj.address === this.address;
        }
        return false;
    }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isAttached() { return this.state === "attached"; }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isClosed() { return this.state === "closed"; }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isConnected() { return (this.state === "connected" || this.state === "attached"); }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isOpen() { return (this.state === "connected" || this.state === "attached"); }
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
    /** **IO Stream**: Close the Stream Connection
     * 
     * @param {Number} reason 
     */
    close(reason) {
        let io = this;
        if (io.state !== "closed") {
            if (!io.reason) {
                io.reason = reason;
            }
            io.setState("closed");
        }
        return io;
    }
    /** **IO Stream**: Connect this Stream.
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType} opts 
     */
    connect(opts) { return this.open(opts); }
    /** **IO Stream**: Disconnect this Stream.
     * 
     * @param {Number} reason 
     */
    disconnect(reason) { return this.close(reason); }
    /** **IO Stream**: Open/Starts this Stream Connection.
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType} opts 
     */
    open(opts) {
        let io = this;
        if (io.state !== "closed") {
            io.options = Fn.update(io.options, opts);
            io.setState("connected");
        }
        return io;
    }
    /** Sends Data using this Stream resources.
     * 
     * @param {*} data 
     *                                      */
    send(data) { return this; }
    /** Sends a ping request to remote peer.
     * 
     * As part to check connection alive    */
    ping() { return this; }
    /** Response to ping request from remote peer.
     * 
     * As part to check connection alive        */
    pong() { return this; }
    /** **IO Stream**: Reconnect
     * 
     * Given the reconnect time in nilliseconds */
    reconnect() { }
    /** **IO Stream**: Checks connection 
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
                let tc = ta * 1100;
                let t0 = tm - io.lastRx;
                if (t0 > tc) {
                    io.onError("timeout");
                    io.disconnect(IOREASON.TIMEOUT);
                }
            }
        }
    }
    /** Receive Data from Stream resources.
     * 
     * @param {Buffer} data                 */
    receive(data) {
        let io = this;
        io.lastRx = Fn.millis();
        if (io.receptor) {
            return io.receptor.receive(data);
        }
        return io.onData(data);
    }
    /** Protocol reception complete
     * 
     * @param {*} data                      */
    frameComplete(data) { return this.onData(data); }
    /** Checks if this Stream has Security active
     * @returns {Boolean}                               */
    isSecured() {
        return this.tls ? this.tls.secured : false;
    }
    /** **IO Stream**: Connection Event Listener        */
    onClose() { this.emit("close", this); }
    /** **IO Stream**: Connection Event Listener        */
    onConnect() { this.emit("connect", this); }
    /** **IO Stream**: Receive Data Event Listener      */
    onData(data) { this.emit("data", data, this); }
    /** **IO Stream**: Error Detection Event Listener   */
    onError(err) { this.emit("error", err, this); }
    /** Key Exchange was Complete                       */
    onExchange() { this.emit("exchange", this); }
    /** **IO Stream**: Still Alive Event                */
    onAlive() { this.emit("alive", this); }
}
/** Drives a Stream Listener                            */
class IOServer extends EventListener {
    constructor() {
        super();
        /** **IO Stream**: Asigned Name
         * @type {String}                       */
        this.name = "";
        /** **IO Stream**: Asigned Address
         * @type {String}                       */
        this.address = "";
        /** @type {import("./iot.defines").IOT.ConnectStateEnum}    */
        this.state = "closed";
        /** @type {import("./iot.defines").IOT.ConnectOptionsType}  */
        this.options = {};
        /** @type {Record<String, IOStream>} */
        this.clients = {};
        /** Client Name/Identity Counter
         * 
         * Set the client connection identity   
         * @type {Number}       */
        this._idcounter = Math.floor(Math.random() * 0xffffffff);
        /** Check connection alive thread @type {Object}    */
        this._thalive = null;
    }
    /** **IO Server**: Get the Client Identity.
     * 
     * Based in increment counter.
     * @returns {String}        */
    nextIdentity() {
        let server = this;
        let pid = server._idcounter;
        pid = (pid + 1) & 0xffffffff;
        if (pid < 4 || pid > 0xfffffffb) pid = 4;
        server._idcounter = pid;
        return pid.toString(16).padStart(8, "0");
    }
    /** Adds a new Connection to this server
     * 
     * @param {IOStream} client 
     * @returns {IOStream}          */
    addClient(client) { return client; }
    /** Gets a Client given its address.
     * 
     * @param {String} address 
     * @returns {IOStream}          */
    getClient(address) {
        let server = this;
        address = Fn.asString(address).trim();
        if (address && (address in server.clients)) {
            return server.clients[address];
        }
        return null;
    }
    /** Removes a Client Connection from this Server
     * 
     * @param {String} address 
     * @returns {Boolean}           */
    removeClient(address) {
        let server = this;
        let client = server.getClient(address);
        if (client) {
            let addr = client.address;
            delete (server.clients[addr]);
            return true;
        }
        return false;
    }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isClosed() { return this.state === "closed"; }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isConnected() { return (this.state === "connected" || this.state === "attached"); }
    /** Checks Stream Connection State
     * 
     * @returns {Boolean}   */
    isOpen() { return (this.state === "connected" || this.state === "attached"); }
    /** Sets a new Stream State.
     * 
     * @param {import("./iot.defines").IOT.ConnectStateEnum} state */
    setState(state) {
        let server = this;
        if (server.state !== state) {
            let old = server.state;
            server.state = state;
            server.emit("change", server, state, old);
            switch (state) {
                case "connected":
                    server.onConnect();
                    break;
                case "closed":
                    server.onClose();
                    break;
                default: break;
            }
        }
        return server;
    }
    /** Accepts the incoming Connection */
    accept(sock) { }
    /** Close the Server                */
    close() { }
    /** Listen for incoming connections.
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType} opts 
     */
    listen(opts) { }
    /** Checks for client connection still Alive    */
    checkTimeout() {
        let server = this;
        if (server.isConnected()) {
            let tm0 = Fn.millis();
            Object.entries(server.clients).map((item) => {
                let io = item[1];
                if (io.receptor) io.receptor.checkTimeout();
                let tma = Fn.getNumber(io.options, ["timeout", "keepalive"]);
                if (tma > 0) {
                    let tmc = tma * 1100;
                    let tm1 = tm0 - io.lastRx;
                    if (tm1 > tmc) {
                        io.lastRx = tm0;
                        io.onError("timeout");
                        io.disconnect(IOREASON.TIMEOUT);
                    }
                }
            });
        } else {
            if (server._thalive) {
                clearTimeout(server._thalive);
                server._thalive = null;
            }
        }
    }
    /** **IO Server**: Close Connection Event Listener  */
    onClose() { this.emit("close", this); }
    /** **IO Server**: Gets Connection Event Listener   */
    onConnect() { this.emit("connect", this); }
    /** **IO Server**: Error Detection Event Listener   */
    onError(err) { this.emit("error", err, this); }
}
/** Drives a TCP Socket Connection          */
class TCPStream extends IOStream {
    /**
     * 
     * @param {*} parent 
     * @param {net.Socket} sock 
     */
    constructor(parent, sock) {
        super(parent);
        /** @type {net.Socket}              */
        this._socket = sock;
        /** @type {Array<IOTxBuffer>}       */
        this._txbuffer = [];
        /** TX Flag @type {Boolean}         */
        this._txflag = false;
        /** close request @type {Boolean}   */
        this._closereq = false;
        /** close flag @type {Boolean}      */
        this._hwclose = false;
        /** alive thread                    */
        this._tmalive = null;
    }
    //
    _hwclose() {
        let io = this;
        if (io._socket && !io._hwclose) {
            io._hwclose = true;
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
                if (io._txflag) {
                    io._closereq = true;
                    return io;
                }
                if (!io._hwclose) {
                    return io._hwclose();
                }
            }
            io._socket = null;
            io.setState("closed");
            if (io.parent instanceof IOServer) {
                let server = io.parent;
                let addr = io.address;
                server.removeClient(addr);
            }
        }
        return io;
    }
    /** **IO Stream**: Open/Starts this Stream Connection.
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType} opts */
    open(opts) {
        let io = this;
        if (io.state === "closed") {
            Fn.update(io.options, opts);
            io.setState("connecting");
            //---------------------------------
            io.tls = null;
            if (io.receptor) io.receptor.clear();
            //---------------------------------
            let created = false;
            if (!io._socket) {
                io._socket = net.createConnection({
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
                        let ipa = io._socket.address();
                        io.address = `${ipa.address}:${ipa.port}`;
                        io.setState("connected");
                        io._tmalive = setInterval(() => {
                            if (io.isOpen()) {
                                return io.checkAlive();
                            }
                            clearInterval(io._tmalive);
                            io._tmalive = null;
                        }, 100);
                        //----------------------------------
                        // Checks if have security
                        let opts = Fn.getKey(io.options, [
                            "secure", "tls", "security"]);
                        if (Fn.isMap(opts)) {
                            let issuer = Fn.getString(opts, [
                                "iss", "issuer", "user", "username"]);
                            let keyfile = Fn.getString(opts, [
                                "privatekey", "keyfile", "key"]);
                            if (issuer && keyfile) {
                                io.tls = new MQTTSecure(io);
                                io.tls.peerName = issuer;
                                return io.tls.clientHello(keyfile);
                            }
                        }
                        //----------------------------------
                        io.connect();
                    });
                    return io;
                }
                io.address = io.getAddress(io._socket);
                io.setState("connected");
                return io;
            }
            io.setState("closed");
        }
        return io;
    }
    /** Transmit using fixed sized packages */
    _hwtxloop() {
        let io = this;
        if (io._txbuffer.length > 0) {
            let tx = io._txbuffer[0];
            if (tx.offset < tx.data.length) {
                let off = tx.offset;
                let sze = tx.data.length - off;
                if (sze > 4096) sze = 4096;
                tx.offset += sze;

                let bff = tx.data.slice(off, tx.offset);
                bff = Buffer.from(bff);
                io._socket.write(bff, (err) => {
                    if (err) {
                        io._txflag = false;
                        return io._hwclose();
                    }
                    setImmediate(() => { io._hwtxloop(); });
                });
                return;
            }
            io._txbuffer = io._txbuffer.slice(1);
            setImmediate(() => { io._hwtxloop(); });
            return;
        }
        io._txflag = false;
        if (io._closereq) {
            io._closereq = false;
            io._hwclose();
        }
    }
    //
    send(data) {
        let io = this;
        if (io._socket && !io._hwclose) {
            io._txbuffer.push(new IOTxBuffer(data));
            if (!io._txflag) {
                io._txflag = true;
                setImmediate(() => {
                    io._hwtxloop();
                });
            }
        }
        return io;
    }
}
/** Drives a Listen Server over TCP */
class TCPServer extends IOServer {
    constructor() {
        super();
        /** @type {net.Server}  */
        this._server = null;
        /** checks interval     */
        this._thloop = null;
    }
    /** Accepts the incoming connection
     * @param {net.Socket} sock     */
    accept(sock) {
        let server = this;
        let stream = new TCPStream(server, sock);
        stream.open({ keepalive: 10 });
        let addr = stream.address;
        server.clients[addr] = stream;
        return stream;
    }
    //
    close() {
        let server = this;
        if (server.state !== "closed") {
            server.setState("closing");
            if (server._server) {
                server._server.close();
                return server;
            }
            server.setState("closed");
        }
    }
    /** **Listen for Incoming Connections**.
     * 
     * Using TCP Socket
     * 
     * @param {import("./iot.defines").IOT.ConnectOptionsType|Number} opts 
     * @param {Function} cb 
     * @returns {TCPServer} */
    listen(opts, cb) {
        let server = this;
        if (server.state === "closed") {
            if (typeof opts === "number") {
                server.options.port = opts;
            } else {
                Fn.update(server.options, opts);
            }
            server.setState("connecting");
            if (server._thloop) {
                clearInterval(server._thloop);
                server._thloop = null;
            }
            //
            server._server = net.createServer((sock) => {
                sock.allowHalfOpen = true;
                server.accept(sock);
                if (!server._thloop) {
                    server._thloop = setInterval(() => {
                        server.checkAlive();
                    }, 100);
                }
            });
            server._server.on("error", (err) => {
                server.onError(err);
                if (server.state === "connecting") {
                    server._server = null;
                    server.close();
                    //--------------------------------------------
                    if (typeof cb === "function") {
                        try {
                            cb(err, server);
                        } catch (err) { }
                    }
                }
            });
            server._server.on("close", () => {
                server._server = null;
                server.close();
            });
            let host = Fn.getString(server.options, ["host"], "0.0.0.0");
            let port = Fn.getNumber(server.options, ["port"]);
            server._server.listen(port, host, () => {
                let ipa = server._server.address();
                server.address = `${ipa.address}:${ipa.port}`;
                server.setState("connected");
                //--------------------------------------------
                if (typeof cb === "function") {
                    try {
                        cb(undefined, server);
                    } catch (err) { }
                }
            });
        }
        return server;
    }
    /** Checks for Client Connection still alive    */
    checkAlive() {
        let server = this;
        if (server.isConnected()) {
            let tm = Fn.millis();
            for (let k0 in server.clients) {
                let client = server.clients[k0];
                let ta = Fn.getNumber(client.options, [
                    "keepalive",
                    "timeout"]);
                if (ta > 0) {
                    let tc = ta * 1100;
                    let t0 = tm - client.lastRx;
                    if (t0 > tc) {
                        client.lastRx = tm;
                        client.onError("timeout");
                        client.disconnect(IOREASON.TIMEOUT);
                    }
                }
            }
        } else {
            clearInterval(server._thloop);
            server._thloop = null;
        }
    }
}
//
export {
    IOREASON,
    IOReceptor, IOTxBuffer, IOSecure,
    IOStream, IOServer,
    TCPStream, TCPServer
};
