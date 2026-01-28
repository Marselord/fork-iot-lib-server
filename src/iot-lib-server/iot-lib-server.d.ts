
import net from "net";
import http from "http";
import crypto from "crypto";
import { IOT } from "./src/iot.defines";

export declare type DataMap = Record<string, any>;
export declare type FunctionType = (...args: any[]) => void;
export declare type ConnectStateEnum = IOT.ConnectStateEnum;
export declare type ConnectOptionsType = IOT.ConnectOptionsType;
export declare type IOEventsType = IOT.IOEventsType;
export declare type PacketNamesEnum = IOT.PacketNamesEnum;
export declare type JwtHeaderClaims = IOT.JwtHeaderClaims;
export declare type JwtPayloadClaims = IOT.JwtPayloadClaims;
export declare type JwtDateClaims = IOT.JwtDateClaims;
/** Event Listener Object
 * 
 * Adds event listen and emit functionality */
export declare class EventListener {
    /** Adds a evnt map to the object       */
    addEvent(map: Record<IOEventsType, FunctionType>): EventListener;
    /** Emit/launch the specified event fom the object */
    emit(name: IOEventsType, ...args: any[]): EventListener;
    /** Adds/Register a new event listener to the object */
    on(name: IOEventsType, cb: FunctionType): EventListener;
    /** Adds/Register a new event listener to the object */
    on(map: Record<IOEventsType, FunctionType>): EventListener;
    /** Checks if object has at least one event with given name */
    hasEvent(name: IOEventsType): boolean;
}
/** Byte Array Driver.
 * 
 * To drive byte arrays and protocols       */
export declare class RawBuffer {
    constructor(bff?: number[]);
    /** How many bytes waiting to be read.  */
    available(): number;
    /** Clears this Buffer                  */
    clear(): void;
    /** Read array.
     * 
     * Reads an array with specified length.    */
    read(sze: number): number[];
    /** Write/Adds an array to this buffer      */
    write(bff: number[]): void;
    /** Gets/Read a numeric value from this buffer */
    getvalue(width: number): number;
    /** Gets/Read a numeric value given the byte width  */
    get08(): number;
    /** Gets/Read a numeric value given the byte width  */
    get16(): number;
    /** Gets/Read a numeric value given the byte width  */
    get24(): number;
    /** Gets/Read a numeric value given the byte width  */
    get32(): number;
    /** Gets/Read a numeric value given the byte width  */
    get64(): number;
    /** Adds/Put/Write a numric value with specified byte width */
    putvalue(val: number, width: number): void;
    /** Adds/Put/Write a numeric value with specified byte width */
    put08(val: number): void;
    /** Adds/Put/Write a numeric value with specified byte width */
    put16(val: number): void;
    /** Adds/Put/Write a numeric value with specified byte width */
    put24(val: number): void;
    /** Adds/Put/Write a numeric value with specified byte width */
    put32(val: number): void;
    /** Adds/Put/Write a numeric value with specified byte width */
    put64(val: number): void;
    /** Gets next field as string*/
    getString(): string;
    /** Gets next field as array */
    getData(): number[];
    /** Puts as next field the specified array */
    putData(bff: number[]): void;
    /** Puts as next field the specified string */
    putString(txt: string): void;
    /** Gets a no width byte. Used as field length */
    getSize(): number;
    /** Puts a no width byte as next field */
    putSize(val: number): void;
    /** Checks frame and prepare for new read.
     * 
     * Checks frame size and returns `true` if frame.length is OK*/
    rewind(): boolean;
    /** Gets the size for specified value.
     * 
     * Used to calculate specified value byte width.     */
    sizeFor(value: number): number;
}
/** Calculate CRC16 */
export declare class CRC16Module {
    /** Calculate CRC16
     * 
     *  - ***src***:    Source Buffer
     *  - ***off***:    Data Offset
     *  - ***len***:    Data Length
     */
    calculate(src: Buffer, off?: number, len?: number): number;
}
/** Utilities Functions                     */
export declare class FnModule {
    debugLevel: number;
    constructor();
    /** Read JSon Map from 
     * pecified File Path                   */
    readMap(fname: string): DataMap;
    /** Gets current time stamp 
     * in milliseconds                      */
    millis(): number;
    /** Gets current time stamp 
     * in seconds                           */
    seconds(): number;
    /** Checks if specified object has value.
     * 
     * return `true` if object has 
     * a not nullable value.            */
    hasValue(obj: any): boolean;
    /** Update destiny Map 
     * with source values.              */
    update(dst: any, src: any, keys?: string[]): any;
    /** Makes a Map copy                */
    copyMap(obj: any): any;
    /** Checks if object 
     * is instance of Data Type         */
    isMap(obj: any): boolean;
    /** Check if specified object 
     * is null                          */
    isNull(obj: any): boolean;
    /** Parse to specified Data Type    */
    asBool(obj: any): boolean;
    /** Parse to specified Data Type    */
    asBigInt(value: any): bigint;
    /** Parse to specified Data Type    */
    asBuffer(obj: any): Buffer;
    /** Parse to specified Data Type    */
    asBytes(obj: any): number[];
    /** Parse to specified Data Type
     * 
     * ***`mapcase`***: defined for special map key case.
     *  - "camel
     *  - "pascal"
     *  - "snake"
     *                                  */
    asMap(obj: any, mapcase?: IOT.MapCaseNameEnum): DataMap;
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {Number}               */
    asNumber(obj: any): number;
    /** Parse to JSon notation text
     * 
     * @param {*} obj 
     * @returns {String}                */
    stringify(obj: any): string;
    /** Parse to specified Data Type
     * @param {Object} obj 
     * @returns {String}               */
    asString(obj: any, ...args: any[]): string;
    /** Checks if data 
     * is in ascii format               */
    isAscii(data: any): boolean;
    /** Gets the keys 
     * from specified Map               */
    keySet(map: any): string[];
    /** Normalized key 
     * to avoid camel and case          */
    keyNormal(key: any): string;
    /** Gets the key-value pair 
     * given a path into the map.       */
    getPath(map: any, keypath: string): any;
    /** Get the Key:Value pair 
     * from specified Map               */
    getKey(map: any, keys: string[]): any;
    /** Get from Map 
     * as specified Data Type           */
    getBool(map: any, keys: string[]): boolean;
    /** Get from Map 
     * as specified Data Type           */
    getNumber(map: any, keys: string[], dfault?: number): number;
    /** Get from Map 
     * as specified Data Type           */
    getString(map: any, keys: string[], dfault?: string): string;
    /** Split by spaces                 */
    splitSpaces(text: any): string[];
    /** Split by lines                  */
    splitByLines(lines: any): string[];
    /** Decode from string in base64 
     * to byte array                    */
    decodeBase64(text: string): Buffer;
    /** Encode to base64 string         */
    encodeBase64(obj: any, encoding?: string): string;
    /** Decode from Hexagesimal String
     * @param {String} obj 
     * @returns {Array<Number>}         */
    decodeHex(obj: any): Buffer;
    /** Encode to Hexagesimal String
     * @param {*} obj 
     * @returns {String}                */
    encodeHex(obj: any): string;
    /** **Returns a random Buffer**.    */
    random(sze: number): Buffer;
    /** Decode text.
     * 
     * From escaped to normal text      */
    decodeText(obj: any): string;
    /** Encode Text
     * From normal text to escaped      */
    encodeText(obj: any): string;
    /** Gets string with fixed length.  */
    fixLength(obj: any, len: number, prefix: string): string;
    /** Date to string (Basic format)   */
    dateString(date: any, format: string): string;
    dateString(format: string): string;
    /** Read String arguments as Map
     * @param {Array<String>} argv 
     * @returns {Object}                */
    readArguments(argv?: string[]): DataMap;
    /** Adds Buffer to Array            */
    addToArray(dst: any, src: any): any;
    /** Prints log accord previous 
     * programed debug level            */
    log(level: number, ...args: any[]): void;
    /** Prints log accord previous 
     * programed debug level            */
    error(level: number, ...args: any[]): void;
    /** Gets the byte array representation by
     * fixed length lines.              */
    printBytes(obj: any, width?: number): string;
    /** Remove bad characters 
     * from password.                   */
    encodePassword(passwd: string): string;
    /** Get a Header from specified map.*/
    getHeader(name: HeaderNamesEnum, headers?: Record<HeaderNamesEnum, string>): string;
    /** Sort JSon Map                   */
    sortJSon(map: DataMap): DataMap;
    /** Gets the Date as 0 Hour         */
    date1Hour(): Date;
    /** Adds Field to Date              */
    dateAdd(date: Date | any, field: IOT.DateFieldType, value: number): Date;
    /** Camelize The given name         */
    camelCase(text: string): string;
    /** Pascalize The given name        */
    pascalCase(text: string): string;
    /** Snake Case The given name       */
    snakeCase(text: string): string;
    /** Parse all Map to camelCase.     */
    toCamelCase(obj: any): DataMap;
    /** Parse all Map to PascalCase.    */
    toPascalCase(obj: any): DataMap;
    /** Parse all Map to snake_case.    */
    toSnakeCase(obj: any): DataMap;
    /** Compare two expressions
     * 
     * Returns 
     *  - 0 if equals
     *  - negative if a < b
     *  - positive if a > b
     *                                  */
    compare(a: any, b: any, desc?: boolean): number;
    /** Sort a Object Array 
     * using given key                  */
    sortArray(array: any, key: string, desc?: boolean): any;
    /** Gets the unique values from specified Array */
    uniqueValues(array: any, key: string): any;
    /** Filter the item equals 
     * as specified value               */
    filterMatch(array: any, key: string, value: any): any;
    /** Filter The items that contains 
     * the specified text               */
    filterPattern(array: any, key: string, text: string): any;
    /** Filter by the last row with specified key
     * 
     * @param {Array} list 
     * @param {String} key 
     * @returns {Array}                 */
    filterList(list: any, key: string): any;
    /** Sets Date as MariaDB wants.
     * 
     * @param {Date} date 
     * @returns {String}                */
    asDateString(date: any): string;
    /** Checks if Working Hour given the shedule and date.
     * 
     * The format: **HH:mm-HH:mm** 
     * 
     * The working hour has the seven days shedule separated by '|'
     * and each shedule range for day separated by colon ','    */
    isWorkingHour(work_hours: string, date: Date): boolean;
    /** **Descompress/Inflate function**.   */
    gunzip(data: any): Promise<Buffer>;
    /** **Descompress/Inflate function**.
     * 
     * ***Blocking Mode***                  */
    gunzipSync(data: any): Buffer;
    /** **Compress/Deflate the 
     * specified Data**.                    */
    gzip(data: any): Promise<Buffer>;
    /** **Compress/Deflate the specified Data**.
     *
     * ***Blocking mode***.                 */
    gzipSync(data: any): Buffer;
    /** **Clean null values from 
     * specified map**.                     */
    cleanMap(obj: any): any;
    /** **Remove specified keys from Map**  */
    removeKeys(obj: any, keys: string[]): any;
    /** **Convert incoming to Map type**
     * 
     * Use to pass reception and prefer JSon Notation   */
    toMapObject(obj: any): DataMap;
    /** **Lock Thread**.                    */
    waitLock(): Promise<Boolean>;
    /** Create a buffer with random bytes   */
    randomBytes(sze: number): Buffer;
    /** **Get the current time 
     * in nanoseconds**.                    */
    nanos(): bigint;
    /** Create a new UUID
     * 
     * Use v4 variation 10.
     * 
     * The prefix is used to identifiy the source.
     * Empty to create a random one.        */
    createUUID(prefix?: string): string;
    /** Set a date how database expects.    */
    toSQLDate(value: any): string;
}
/** Filesystem Module           */
export declare class FsModule {
    pathname: string;
    constructor();
    /** Checks if absolute path is absolute */
    isAbsolute(fname: string): boolean;
    /** Gets archive name           */
    basename(fname: string): string;
    /** Gets directory name         */
    dirname(fname: string): string;
    /** Join paths                  */
    join(...args: string[]): string;
    /** Checks if path is Archive   */
    isFile(fname: string): boolean;
    /** Checks if path is directory */
    isDirectory(fname: string): boolean;
    /** Checks if File exist        */
    exist(fname: string): boolean;
    /** Create Directory. If needed */
    makeDir(fname: string): boolean;
    /** Gets absolute Path
     * 
     * - basename:  The application path
     * - dirname:   File name
     *                              */
    getAbsolute(fname: string, dname: string): string;
    /** Reads the specified File    */
    fileRead(fname: string, opts?: any): Buffer;
    /** Writes the specified File   */
    fileWrite(fname: string, fdata: any, opts?: any): boolean;
    /** Appends, write to end.              */
    fileAppend(fname: string, fdata: any, opts?: any): boolean;
    /** Reads JSon Map  */
    readJSon(fname: string): DataMap;
    /** Write JSon Map  */
    writeJSon(fname: string, fmap: any, opts?: any): boolean;
}
/** Input/Output Stream Protocol Receptor   */
export declare class IOReceptor {
    parent: IOStream;
    /** Protocol Receptor                   */
    constructor(parent: IOStream);
    /** Checks for inter-character timeout  */
    checkTimeout(): void;
    /** Prepare for a new Secure Connection */
    clear(): void;
    /** Protocol Reception                  */
    receive(data: Buffer): void;
}
/** Defines a Secure Device     */
export declare class IOSecure {
    parent: IOStream;
    /** @type {Boolean}         */
    secured: boolean;
    /** Prepare for a new Secure Connection */
    clear(): void;
    /** **Key Exchange**.
     * 
     * First step using Diffie-Hellman exchange.
     * 
     * From Client to Server.               */
    clientHello(raw: Buffer): void;
    /** **Key Exchange**.
     * 
     * Second step using Diffie-Hellman exchange.
     * 
     * From Server to Client.               */
    serverHello(): void;
    /** **Key Exchange**.
     * 
     * Last step using Diffie-Hellman exchange.
     * 
     * From Client to Server.               */
    exchangeDone(): void;
    /** **Decrypt specified data**.
     * 
     * From cipher to plain text.
     * 
     * Process after reception.             */
    decrypt(bff: Buffer): Buffer;
    /** **Encrypt specified data**.
     * 
     * From plain to cipher text.
     * 
     * Process before transmission.        */
    encrypt(bff: Buffer): Buffer;
}
/** Input/Output Buffer for Transmission*/
export declare class IOTxBuffer {
    data: Buffer;
    offset: number;
    constructor(data: string | Buffer);
}
/** Input/Output Stream Object          */
export declare class IOStream extends EventListener {
    /** Object Owner @type {IOStream}       */
    parent: IOStream;
    /** **IO Stream**: Asigned Name*/
    name: string;
    /** **IO Stream**: Asigned Address*/
    address: string;
    /** **IO Stream**: Protocol Receptor */
    receptor: IOReceptor;
    /** Transport Layer Secure Object. */
    tls: IOSecure;
    /** **IO Stream**: Connection State   */
    state: ConnectStateEnum;
    /** **IO Stream**: Connection Options  */
    options: ConnectOptionsType;
    /** Why the stream was closed. */
    reason: number;
    /** Last Reception time stamp */
    lastRx: number;
    /** Last Transmission time stamp */
    lastTx: number;
    /** Process time stamp */
    procTm: number;
    /** Reconnection Flag */
    rcnxflag: number;
    constructor(parent?: IOStream);
    /** Gets the client,stream or socket address.   */
    static getAddress(client: net.Socket | IOStream | string): string;
    /** Get the Object Owner            */
    getParent(): any;
    /** Checks Stream Connection State  */
    isAttached(): boolean;
    /** Checks Stream Connection State  */
    isClosed(): boolean;
    /** Checks Stream Connection State  */
    isConnected(): boolean;
    /** Checks Stream Connection State  */
    isOpen(): boolean;
    /** Sets a new Stream State. */
    setState(state: ConnectStateEnum): this;
    /** **IO Stream**: Close the Stream Connection  */
    close(reason?: number): this;
    /** **IO Stream**: Connect this Stream. */
    connect(opts: ConnectOptionsType): this;
    /** **IO Stream**: Disconnect this Stream. */
    disconnect(reason: number): this;
    /** **IO Stream**: Open/Starts this Stream Connection. */
    open(opts: ConnectOptionsType): this;
    /** Sends Data using this Stream resources. */
    send(data: any): this;
    /** Sends a ping request to remote peer. */
    ping(): this;
    /** Response to ping request from remote peer. */
    pong(): this;
    /** **IO Stream**: Reconnect */
    reconnect(): this;
    /** **IO Stream**: Checks connection still alive. */
    checkAlive(): void;
    /** Receive Data from Stream resources. */
    receive(data: Buffer): void;
    /** Protocol reception complete */
    frameComplete(data: any): void;
    /** Checks if this Stream has Security active */
    isSecured(): boolean;
    /** **IO Stream**: Connection Event Listener */
    onClose(): void;
    /** **IO Stream**: Connection Event Listener */
    onConnect(): void;
    /** **IO Stream**: Receive Data Event Listener */
    onData(data: any): void;
    /** **IO Stream**: Error Detection Event Listener */
    onError(err: any): void;
    /** Key Exchange was Complete */
    OnExchange(): void;
    /** Checks if this Stream has Security active */
    isSecured(): boolean;
    /** **IO Stream**: Connection Event Listener        */
    onClose(): void;
    /** **IO Stream**: Connection Event Listener        */
    onConnect(): void;
    /** **IO Stream**: Receive Data Event Listener      */
    onData(data: any): void;
    /** **IO Stream**: Error Detection Event Listener   */
    onError(err: any): void;
    /** Key Exchange was Complete                       */
    OnExchange(): void;
}
/** Drives a Stream Listener                            */
export declare class IOServer extends EventListener {
    /** **IO Stream**: Asigned Name
     * @type {String}                       */
    name: string;
    /** **IO Stream**: Asigned Address
     * @type {String}                       */
    address: string;
    /** @type {import("./iot.defines").IOT.ConnectStateEnum}    */
    state: ConnectStateEnum;
    /** @type {import("./iot.defines").IOT.ConnectOptionsType}  */
    options: ConnectOptionsType;
    /** @type {Record<String, IOStream>} */
    clients: Record<string, IOStream>;
    constructor();
    /** Adds a new Connection to this server */
    addClient(client: IOStream): IOStream;
    /** Gets a Client given its address. */
    getClient(address: string): IOStream;
    /** Removes a Client Connection from this Server */
    removeClient(address: string): boolean;
    /** Checks Stream Connection State */
    isClosed(): boolean;
    /** Checks Stream Connection State */
    isConnected(): boolean;
    /** Checks Stream Connection State */
    isOpen(): boolean;
    /** Sets a new Stream State. */
    setState(state: ConnectStateEnum): this;
    /** Accepts the incoming Connection */
    accept(...args: any[]): any;
    /** Close the Server */
    close(): this;
    /** Listen for incoming connections. */
    listen(opts: ConnectOptionsType): this;
    /** **IO Server**: Close Connection Event Listener */
    onClose(): this;
    /** **IO Server**: Gets Connection Event Listener */
    onConnect(): this;
    /** **IO Server**: Error Detection Event Listener */
    onError(err: any): this;
}
/** Drives a TCP Socket Connection          */
export declare class TCPStream extends IOStream {
    constructor(parent: IOStream, sock: net.Socket);
    /** **TCP Stream**: Close the Stream Connection.        */
    close(reason?: number): this;
    /** **TCP Stream**: Open/Starts this Stream Connection. */
    open(opts: ConnectOptionsType): this;
    /** **TCP Stream**: Sends Data using this Stream resources. */
    send(data: any): this;
}
/** Drives a Listen Server over TCP */
export declare class TCPServer extends IOServer { }
/** MQTT V5 Properties */
export declare class MQTTV5 {
    assigned_client_identifier?: any;
    authentication_data?: any;
    authentication_method?: any;
    content_type?: any;
    correlation_data?: any;
    maximum_packet_size?: any;
    maximum_qos?: any;
    message_expiry_interval?: any;
    payload_format_indicator?: any;
    reason_string?: any;
    receive_maximum?: any;
    request_problem_information?: any;
    request_response_information?: any;
    response_information?: any;
    response_topic?: any;
    retain_available?: any;
    server_keep_alive?: any;
    server_reference?: any;
    session_expiry_interval?: any;
    shared_subscription_available?: any;
    subscription_identifier?: any;
    subscription_identifiers_available?: any;
    topic_alias?: any;
    topic_alias_maximum?: any;
    user_property?: any;
    wildcard_subscription_available?: any;
    will_delay_interval?: any;
    /** Decodes V5 from specified array.    */
    decode(bff: Buffer | number[]): void;
    /** Encodes V5 to array to be added to the MQTT packet. */
    encode(): number[];
}
/** **MQTT Topic**
 * 
 * The meeting place.       */
export declare class MQTTTopic {
    /** **MQTT Topic**: Full name*/
    fullname: string;
    /** **MQTT Topic**: Short name*/
    name: string;
    /** **MQTT Topic**: Dashboard enabled*/
    dash: boolean;
    /** **MQTT Topic**: Quality Of Service*/
    qos: number;
    /** **MQTT Topic**: Subscribe status*/
    subscribed: boolean;
    /** **MQTT Topic**: Queue, wait for acknowledge*/
    queue: number;
    /** **MQTT Topic**: Process timestamp*/
    tstamp: number;
    /** Topic Client List*/
    clients: Record<string, MQTTStream>;
    /** Last Message sender*/
    sender: MQTTStream;
    /** Last Message received*/
    value: number[];
    /** **MQTT Topic** */
    constructor(topicname: string, qos: number);
    /** Adds a new subscriber to this topic*/
    addClient(client: MQTTStream): MQTTStream;
    /** Gets a subscriber from this Topic*/
    getClient(address: string): MQTTStream;
    /** Removes a subscriber from this Topic*/
    removeClient(address: string): boolean;
    /** Checks if this Topic has a subscriber*/
    hasClient(address: string): boolean;
    /** Checks if this Topic has any subscriber*/
    hasClients(): boolean;
    /** Checks if this Topic is subscribed*/
    isSubscribed(): boolean;
    /** Checks if this Topic is empty*/
    isEmpty(): boolean;
}
/** Mqtt Message Object         */
export declare class MQTTMessage {
    /** The packet type code*/
    packetType: PacketNamesEnum;
    /** The packet control flags*/
    flags: number;
    /** The MQTT Protocol*/
    protocol: string;
    /** The MQTT Version*/
    version: number;
    /** The Connection Identity*/
    clientId: string;
    /** The User/Workspace that connection belong*/
    userName: string;
    /** The Connection Security string*/
    password: string;
    /** The Connection Keep Alive time in seconds*/
    keepAlive: number;
    /** The Message Topic destiny*/
    topic: string;
    /** The Message Payload/Data*/
    payload: number[];
    /** The Message Quality of service*/
    qos: number;
    /** The Message Identity*/
    pid: number;
    /** `true` If message was duplicated*/
    dup: boolean;
    /** `true` If message must be retained*/
    ret: boolean;
    /** Message session flag*/
    session: boolean;
    /** Message response code*/
    reason: number;
    /** Clean Session Control Flag
     * 
     * Used at connection time
     */
    cleanSession: boolean;
    /** Subscrition/Unsubscription Topic List*/
    topics: string[];
    /** Will Topic Name
     * 
     * Used at connection time*/
    willTopic: string;
    /** Will Payload/Data Message
     * 
     * Used at connection time*/
    willPayload: number[];
    /** Will Quality of Message
     * 
     * Used at connection time*/
    willQos: number;
    /** Will Retain Flag
     * 
     * Used at connection time*/
    willRet: boolean;
    /** Will Version 5 properties
     * 
     * Used at connection time*/
    willV5: MQTTV5;
    /** Version 5 properties*/
    v5: MQTTV5;
    /** Message was received by secured channel */
    secured: boolean;
    /** MQTT Message    */
    constructor(mtype: PacketNamesEnum, version: number);
    /** Gets teh Message payload accord its data type.  */
    getPayload(): any;
}
/** **MQTT Stream**.
 * 
 * Base Class that drives MQTT Protocol
 * 
 * ***Must be extended to get functionality***  */
export declare class MQTTStream extends IOStream {
    version: number;
    /** @type {Record<String, MQTTTopic>}   */
    topics: Record<string, MQTTTopic>;
    constructor(parent: IOStream);
    /** Adds a topic to this Client         */
    addTopic(name: string, qos: number): MQTTTopic;
    /** Get Topic from this Client          */
    getTopic(name: string): MQTTTopic;
    /** Remove a topic from this Client     */
    removeTopic(name: string): boolean;
    /** Message received event.             */
    onMessage(msg: MQTTMessage): void;
    /** Topic Subscription accepted         */
    onSubscribe(topic: MQTTTopic): void;
    /** Topic Subscription was removed      */
    onRemoved(topic: MQTTTopic): void;
    /** Message was acknowledge.            */
    onAcknowledge(msg: MQTTMessage, topic: MQTTTopic): void;
    /** Ping response was received          
     * 
     * Still alive event                   */
    onAlive(): void;
    /** Publish a Message                  */
    publish(topic: string, payload: any, qos?: number, pid?: number, dup?: boolean, ret?: boolean): this;
    /** Subscribe to specified topic with Quality Of Service. */
    subscribe(topicname: string, qos?: number): this;
    /** Unsubscribe from specified topic.  */
    unsubscribe(topicname: string): this;
    /** MQTT Packet received Event         */
    mqttComplete(msg: MQTTMessage): this;
    /** Packet Reception                   */
    frameComplete(data: Array<number> | Buffer, secured?: boolean): void;
}
/** **MQTT Bag Type Connection**.
 * 
 * Allow multiple connection using only one socket. */
export declare class MQTTBag extends MQTTStream { }
/** **Drives a TCP Socket**. 
 * 
 * That be used as MQTT Connection          */
export declare class MQTTSocket extends MQTTStream {
    bags: Record<string, MQTTBag>;
    /** MQTT TCP Connection
     * 
     * ***Client Side***                    */
    constructor(parent: IOServer, sock: net.Socket);
    /** Adds a new Child Connection         */
    addBag(address: string): MQTTBag;
    /** Gets a Child Connection from this Stream */
    getBag(address: string): MQTTBag;
}
/** Drives a MQTT Client Connection         */
export declare class MQTTClient extends MQTTSocket { }

/** Header Names Enumeration                */
export declare type HeaderNamesEnum = IOT.HeaderNamesEnum;
/** A Header Map Data Type                      */
export declare type HTTPHeadersType = Record<HeaderNamesEnum, string>;
/** **Advanced use of Http Request**.       */
export declare class HTTPSession {
    request: http.IncomingMessage;
    response: http.ServerResponse;
    headers: Record<HeaderNamesEnum, string>;
    body: Record<string, any>;
    issuer: HTTPIssuer;
    constructor(server: HTTPServer, req: http.IncomingMessage, rsp: http.ServerResponse);
    /** Gets the request path               */
    getPath(): string;
    /** Gets a Header from this request     */
    getHeader(name: HeaderNamesEnum, headers?: any): string;
    /** Get the IP Address from this session*/
    getAddress(): string;
    /** Append header to response           */
    addHeader(name: HeaderNamesEnum, value: string): void;
    /** Starts Request Reception            */
    receive(): void;
    /** **Http Request Close Event**.                   */
    onClose(body: DataMap, code: number): void;
    /** **Http Request Incoming data request**.         */
    onData(body: DataMap): void;
    /** **Http Request Error Detection Event**.         */
    onError(err: Error | string | number): void;
    /** **Http Request Connection was rejected**.       */
    onReject(reason: string | number): void;
    /** **Sends response and close the Http request**.  */
    close(body: any, code: number, headers: Record<HeaderNamesEnum, string>): boolean;
    close(body: any, headers: Record<HeaderNamesEnum, string>): boolean;
    close(body: any, code: number): boolean;
    close(body: any): boolean;
    close(code: number): boolean;
    close(): boolean;
    /** **Sends response and close the Http request** */
    error(err: any): boolean;
    error(code: number): boolean;
    error(err: any, code: number): boolean;
}
/** **HTTP Server Listener Driver**     */
export declare class HTTPServer extends EventListener {
    address: string;
    state: ConnectStateEnum;
    issuers: Record<string, HTTPIssuer>;
    pool: DatabasePool;
    options: IOT.ServerOptionsType;
    /** **HTTP Server**: Accept incoming connection */
    accept(req: http.IncomingMessage, rsp: http.ServerResponse): HTTPSession;
    /** **Close the Listen process**.       */
    close(): void;
    /** **Starts Listen function**.         */
    listen(opts: ConnectOptionsType, cb?: (err: any) => void): void;
    listen(port: number, cb?: (err: any) => void): void;
    /** **Event**: Server Closed            */
    onClose(): void;
    /** **Event**: Server Connected         */
    onConnect(): void;
    /** **Event**: Error Found              */
    onError(err: any): void;
    /** Checks if allow the specified path  */
    allowPath(path: string): boolean;

    /** **HTTP Server**: Receive Request Attention
     * 
     * ***Application dependend***          */
    receiveRequest(session: HTTPSession): void;
    /** **Register response with** ***ANY*** **method**.
     * 
     * Usage:
     *  - `.use(paths: string(), callback: function)`;
     *  - `.use(path: string, callback: function)`;
     *  - `.use(callback: function)`;
     * 
     * Where callback function has:
     *  - ***session***: HTTPSession The Request data container. 
     *  - ***next***:    Indicate that continue with ***next*** registered request. 
     */
    use(paths: string[], cb: (session: HTTPSession, next: () => void) => void): void;
    use(path: string, cb: (session: HTTPSession, next: () => void) => void): void;
    use(cb: (session: HTTPSession, next: () => void) => void): void;
    /** **Register response with "GET" method**
     * 
     * Usage:
     *  - `.get(paths: string(), callback: function)`;
     *  - `.get(path: string, callback: function)`;
     *  - `.get(callback: function)`;
     * 
     * Where callback function has:
     *  - ***session***: HTTPSession The Request data container. 
     *  - ***next***:    Indicate that continue with ***next*** registered request. 
     */
    get(paths: string[], cb: (session: HTTPSession, next: () => void) => void): void;
    get(path: string, cb: (session: HTTPSession, next: () => void) => void): void;
    get(cb: (session: HTTPSession, next: () => void) => void): void;
    /** **Register response with "POST" method**
     * 
     * Usage:
     *  - `.post(paths: string(), callback: function)`;
     *  - `.post(path: string, callback: function)`;
     *  - `.post(callback: function)`;
     * 
     * Where callback function has:
     *  - ***session***: HTTPSession The Request data container. 
     *  - ***next***:    Indicate that continue with ***next*** registered request. 
     */
    post(paths: string[], cb: (session: HTTPSession, next: () => void) => void): void;
    post(path: string, cb: (session: HTTPSession, next: () => void) => void): void;
    post(cb: (session: HTTPSession, next: () => void) => void): void;
}
/** SQL Query Results       */
export declare class QueryResults {
    error: Error | any;
    results: Record<string, any>[];
    fields: Record<string, any>[];
    constructor(err: any, results?: any, fields?: any);
    /** Checks if results has data.
     * 
     * Returns `true` if has one or more rows as results    */
    hasData(): boolean;
}
/** **Database Connector**.         */
export declare class DatabaseConnection {
    parent: any;
    options: ConnectOptionsType;
    constructor(parent: any, opts: ConnectOptionsType);
    /** Disconnect from Database    */
    close(): Promise<boolean>;
    /** Connect to Database         */
    connect(): boolean;
    /** **Read the secure password for specified plain password**.  */
    readPassword(passwd: string): Promise<string>;
    /** **Given a SQL sentence returns the table to be used**.      */
    getTableFromSentence(sql: string): string;
    /** Do a SQL Statement  */
    query(sql: string, values?: string[], database?: string): Promise<QueryResults>;
}
/** **Table Descriptor**.
 * 
 * Drives a database table columns use. */
export declare class TableDescriptor {
    parent: DatabasePool;
    name: string;
    title: string;
    options: IOT.TableOptionsType;
    cols: IOT.TableColDescriptorType;
    constructor(pool: DatabasePool, name: string, ...more: any);
    /** Checks if Table has a Column with given name        */
    hasColumn(name: string): boolean;
    /** Get the Column names for this table.
     * 
     * If defines exclude, 'exclude' this from result.
     * 
     * Return table columns ready to use in SQL statement.  */
    getColumnNames(exclude?: string[]): string;
}
/** Drives a Database Connection Pool       */
export declare class DatabasePool {
    parent: any;
    tables: Record<string, TableDescriptor>;
    dbname: string;
    dbuser: string;
    constructor(parent?: any);
    /** Gets/Create a Database connector.   */
    getConnection(database?: string, username?: string): DatabaseConnection;
    /** Sets Pool configurations.
     * 
     * Returns `true` if was configured OK. */
    setConnections(map: Record<string, any> | string): boolean;
    /** **Given a SQL sentence returns the table to be used**.*/
    getTableFromSentence(sql: string): string;
    /** Gets a Table Descriptor */
    getTable(name: string): TableDescriptor;
    /** Get a Date that Database wants      */
    toSQLDate(date: any): string;
}
/** **Key Details**
 * 
 * Container for Key details    */
export declare interface KeyDetails {
    modulus: Buffer;
    exponent: Buffer;
}
/** Secure Utilities                */
export declare class TLSModule {
    /** **Gets a Seed from Random**
     * 
     * Return a random seed to be used 
     * in cryptography operations   */
    seed(sze: number): Buffer;
    /** **Reads Private Key from file or string**.
     * 
     * Arguments:
     *  - ***keyfile***: the key path or text 
     *  - ***passwd***: Key file password   
     */
    privateKey(keyfile: string, passwd?: string): Promise<crypto.KeyObject>;
    /** **Read Private Key in Synchronic Mode**.
     * 
     * Arguments:
     *  - ***keyfile***: the key path or text 
     *  - ***passwd***: Key file password   
     */
    privateKeySync(keyfile: string, passwd: string): crypto.KeyObject;
    /** **Reads Public Key from File**.
     * 
     * Arguments:
     *  - ***keyfile***: the key path or text 
     */
    publicKey(keyfile: string): Promise<crypto.KeyObject>;
    /** **Reads Public Key in Synchronic Mode**
     * 
     * Arguments:
     *  - ***keyfile***: the key path or text 
     */
    publicKeySync(keyfile: string): crypto.KeyObject;
    /** **Sign the message using private key**.
     */
    sign(privatekey: crypto.KeyObject | string, message: string | Buffer, keypasswd?: string): Promise<Buffer>;
    /** **Sign Message in synchronic mode**.
      */
    signSync(privatekey: crypto.KeyObject | string, message: string | Buffer, keypasswd?: string): Buffer;
    /** Verify the message signature
     */
    verify(publickey: crypto.KeyObject | string, signature: Buffer, message: Buffer | string): Promise<boolean>;
    /** Verify the message signature in synchronic mode.
     */
    verifySync(publickey: crypto.KeyObject | string, signature: Buffer, message: Buffer | string): boolean;
    /** Gets the modulus from specified key.
     * 
     * @param {crypto.KeyObject} publickey 
     * @returns {KeyDetails}    */
    keyDetails(publickey: crypto.KeyObject): KeyDetails;
    /** XOR Operation           */
    xored(b1: Buffer, b2: Buffer): Buffer;
    /** Buffer Left Rotation    */
    left(b0: Buffer): Buffer;
    /** Buffer Right Rotation   */
    right(b0: Buffer): Buffer;
    /** Padding to packet size. */
    padding(bff: Buffer, len: number): Buffer;
}
/** **JSon Web Token**                      
 * 
 * Drives a JSon Web Token accords 
 * its standard             */
export declare class JWT {
    /** JWT: Header         */
    header: JwtHeaderClaims;
    /** JWT: Payload        */
    payload: JwtPayloadClaims;
    /** JWT: signature      */
    signature: Buffer;
    constructor(text?: string);
    /** JWT: Sign the token.
     * 
     * Returns string with JWT signed or empty if error.
     */
    sign(key: crypto.KeyObject | string, issuer: string, expire_at?: number, keypasswd?: string): Promise<string>;
    /** **JWT**: Sign the token ***synchronized mode***.
     * 
     * Returns string with JWT signed or empty if error.
     */
    signSync(key: crypto.KeyObject | string, issuer: string, expire_at?: number, keypasswd?: string): string;
    /** Verify the Token sign
     * 
     * @param {crypto.KeyObject} key 
     * @returns {Promise<Boolean>}      */
    verify(key: crypto.KeyObject | string): Promise<boolean>;
    /** Verify the Token sign ***synchronized mode***.
     * 
     * @param {crypto.KeyObject} key 
     * @returns {Boolean}      */
    verifySync(key: crypto.KeyObject | string): boolean;
    /** Checks if Token was exprired.   */
    isExpired(): boolean;
    /** Gets a specific date from any date claim normalized.
     * 
     * Returns the date as its representation in UNIX timestamp ***seconds***
     */
    getDate(claim: JwtDateClaims): number;
    /** Checks Dates in the range given maximum time in seconds.    */
    checkDates(maxtime: number): boolean;
    /** Gets the Issuer of this Token.
     * 
     * Refers to who create the token       */
    getIssuer(): string;
    /** Get how many seconds remains accord given date.
     * 
     * arguments:
     *  - claim = "iat"
     *      - How many seconds from "iat" to now.
     *  - claim = "exp"
     *      - How many seconds from now to expire.
     *      - Negative if was expired
     */
    remainTime(claim: JwtDateClaims): number;
}
/** **Key exchange algorithm**      */
export declare class DiffieHellman {
    constructor(p: bigint, g?: bigint);
    /** **Gets cipher Key Pattern** */
    getPattern(k?: bigint | Buffer): Buffer;
    /** **Gets public Key**         */
    getPublic(): bigint;
    /** **Calculate Shared Key**.   */
    getShared(key: bigint | Buffer): bigint;
}
/** **Drives Cipher Process**       */
export declare class AESAlgorithm {
    constructor(key?: Buffer);
    /** **Set the algoritm keys**.  */
    setKeys(key: Buffer): boolean;
    /** **Decrypt**
     * 
     * From cipher to plain text.   */
    decrypt(data: Buffer | any): Buffer;
    /** **Encrypt**
     * 
     * From plain to cipher text.   */
    encrypt(data: Buffer | any): Buffer;
}
/** **Request Owner**.
 * 
 * Container for the issuer data.
 * 
 * Refers to issuer who sends the Http Request.     */
export declare class HTTPIssuer {
    sessionId: string;
    userData: IOT.IssuerUserDataType;
    aes: AESAlgorithm;
    dfm: DiffieHellman;
    ctype: string;
    secured: boolean;
    /** Sets Algorithm Keys.                        */
    setKeys(key: string | Buffer): void;
    /** **Get the secure headers**.
     * 
     * Action before sends request.                 */
    authRequest(): Record<HeaderNamesEnum, string>;
    /** **Action after response is coming**.
     * 
     * Checks peer key exchange and data security   */
    authResponse(): void;
    /** **Decrypt**
     * 
     * From cipher to plain text.   */
    decrypt(data: any): Promise<Buffer>;
    /** **Encrypt**
     * 
     * From plain to cipher text.   */
    encrypt(data: any): Promise<Buffer>;
}
/** Http Request Arguments          */
export declare type HTTPRequestOptsType = http.ClientRequestArgs & {
    body?: string | Record<string, any>;
}
/** Http Response Object.           */
export declare class HTTPResponse {
    error?: Error | string;
    status: number;
    statusText: string;
    headers: Record<HeaderNamesEnum, string>;
    body: string | Record<string, any> | any;
    /** Get Header from this Response   */
    getHeader(name: HeaderNamesEnum): string;
    /** Get the body as JSon Map        */
    json(): Promise<Record<string, any>>;
}
/** Secure Connection.
 * 
 * Used for server to server request.               */
export declare class HTTPSecureIssuer {
    sessionId: string;
    userData: IOT.IssuerUserDataType;
    options: IOT.IssuerOptionsType;
    ctype: string;
    secured: boolean;
    logged: boolean;
    /** **Http Request Using secure layer**.
     * 
     * A Client used for Server to Server request.  */
    constructor(parent: any, opts?: IOT.IssuerOptionsType);
    /** Close the Connection.
     * 
     * Dispose resources into the remote server.    */
    close(): Promise<Boolean>;
    /** Send a Http Request to Remote Server.
     * 
     *  - ***path***:   The API Service Path. 
     *  - ***req***:    The Http Request to be send. It must to have minimum a "body". 
     */
    doRequest(path: string, req: HTTPRequestOptsType): Promise<HTTPResponse>;
    /** Execute a SQL statement over a database.
     * 
     *  - ***sql***:      The SQL statement
     *  - ***values***:   The values used for the SQL statement
     *  - ***database***: The database to be used.     
     */
    doQuery(sql: string, values?: string[], database?: string): Promise<QueryResults>;
    /** **Log to remote server**            */
    login(): Promise<boolean>;
    /** Returns the Header "authorization". */
    getAutorization(): Promise<string>;
    /** Do a request that response with 
     * database results.                    */
    doAPIQuery(path: string, body?: any): Promise<QueryResults>;
    /** Do a request that response with 
     * database results and header "authorization"  */
    secureAPIQuery(path: string, body?: any): Promise<QueryResults>;
    /** Do a request withheader "authorization"     */
    secureRequest(path: string, body?: any): Promise<HTTPResponse>;
}
/** **Drives a IOT Device**.
 * 
 * Base Class to drive a IOT Device using Http Request  */
export declare class HTTPDevicesDriver {
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
     */
    doActivate(data: Record<string, any>, ...more: any[]): Promise<DataMap>;
    /** Returns the current state of the Machine.
     * 
     * Parameters:
     *  - Get only machine information.
     *    - ***qr***: Machine Identity
     * 
     *  - Get the vend state
     *    - ***qr***: Machine Identity
     *    - ***token***: Vend Identity  
     */
    doState(data: Record<string, any>, ...more: any[]): Promise<DataMap>;
    /** Returns information about the Machine
     * 
     * Parameters:
     *  - ***qr***: Machine Identity
     */
    doInfo(data: Record<string, any>, ...more: any[]): Promise<DataMap>;
}

/** States Enumeration for IOT Device   */
export declare type IOTDeviceStateEnum = IOT.IOTDeviceStateEnum;

/** IOT Device settings data type       */
export declare type IOTDeviceOptsDataType = IOT.IOTDeviceOptsDataType;
export declare type VendStateEnum = IOT.VendStateEnum;
export declare type MemberDataType = IOT.MemberDataType;
export declare type StoreDataType = IOT.StoreDataType;
export declare type LaneDataType = IOT.LaneDataType;
export declare type ProductDataType = IOT.ProductDataType;
export declare type PriceDataType = IOT.PriceDataType;
export declare type StorageDataType = IOT.StoreDataType;

export declare class VendItem {
    order: VendOrder;
    lane: LaneDataType;
    product: ProductDataType;
    priceData: PriceDataType;
    quantity: number;
    unitPrice: number;
    dispensed: number;
    amount: number;
    constructor(
        order: VendOrder,
        lane: LaneDataType,
        product: ProductDataType,
        price: PriceDataType,
        quantity: number,
        unit_price: number);
}

export declare class VendOrder {
    uuid: string;
    items: VendItem[];
    store: StoreDataType;
    member: MemberDataType;
    product: ProductDataType;
    storeId: string;
    initialBalance: number;
    amount: number;
    currentOffset: number;
    currentItem: number;
    state: VendStateEnum;
    error: string;
    qr: string;
    proctime: number;
    vender: any;
    constructor(uuid: string, data?: any);
    /** Get the current vend Item   */
    getCurrentItem(): VendItem;
    /** Returns the Response Map for this Vend Order.
     * 
     * Returns:
     *   - Vend Order data
     *   - Each Order Item information
     *   - Calculate amounts here.  */
    getResponse(): DataMap;
}

/** IOT Device Base Object      */
export declare class IOTDeviceClass extends EventListener {
    /** Its Driver                      */
    parent: IOTMachineDriver;
    /** Where device listen and publish */
    topic: string;
    /** Unique device Identity          */
    deviceId: string;
    /** Current operating state         */
    state: IOTDeviceStateEnum;
    /** Associated to the device        */
    deviceData: IOTDeviceOptsDataType;
    /** Process Timestamp               */
    proctime: number;
    /** Device Specific Options         */
    options: DataMap;
    constructor(parent: any, topic: string, ...args: any[]);
    /** Returns the Object Options      */
    getOptions(): DataMap;
    /** Returns Object Owner            */
    getParent(): IOTMachineDriver;
    /** Sets properties accord given state data.
     * 
     * Attention for "device.status.response"   */
    setStateData(data: any): DataMap;
    /** Message incoming attention.             */
    mqttIncoming(message: any): void;
    /** Publish/Send message to this device.    */
    publish(...a: any[]): void;
}

/** IOT Device Driver Object            */
export declare class IOTMachineClass extends IOTDeviceClass {
    /** Object Owner                    */
    parent: IOTMachineDriver;
    /** Store that the device belongs   */
    store: StoreDataType;
    /** Lane that the device belongs    */
    lane: LaneDataType;
    /** Lane's product data             */
    product: ProductDataType;
    /** Container for error 
     * 
     * Used to show the last error.
     * 
     * It will be deleted after use.    */
    error?: string;
    /** Device current Vend Order       */
    order?: VendOrder;
    constructor(parent: any, topic: string, ...args: any[]);
    /** Returns the IOT Device information.
     * 
     * Adds the specified QR to device information. */
    getDeviceInfo(qr?: string): DataMap;
    /** Ends Vend Order.
     * 
     * Send request to create invoice.              */
    vendComplete(order: VendOrder): void;
}
/** Mqtt Client Module Specific                     */
export declare class MachineClient extends MQTTClient {
    _wasconnected: boolean;
    constructor(parent: any, ...args: any[]);
}
/** Drives a Specific Machines Type.    */
export declare class IOTMachineDriver extends HTTPDevicesDriver {
    /** Object Owner                    */
    parent: IOTMachinePool;
    /** Object Name                     */
    name: string;
    /** Device Collection               */
    devices: Record<string, IOTMachineClass>;
    /** MQTT Client Connection          */
    client: MachineClient;
    /** MQTT Topic to be used as pattern*/
    topicPattern: string;
    /** Device Specific Options         */
    options: DataMap;
    _init(args?: any): void;
    constructor(parent: any, name?: string, args?: any);
    /** Starts Driver Execution.
     * 
     *  - Connect to Mqtt
     *  - Do a broadcast device status request
     *  - Register responses                */
    start(...args: any[]): void;
    /** Gets Mqtt Client Connection         */
    getClient(): MachineClient;
    /** Return IOT Device given its name    */
    getDevice(name: string): IOTMachineClass;
    /** Returns the Object Options          */
    getOptions(): DataMap;
    /** Gets the Object Owner.
     * @returns {IOTMachinePool}            */
    getParent(): IOTMachinePool;
    /** Create a New Vend order with specified parameters
     * @param {Record<String,Object>} params
     * @returns {VendOrder}                 */
    createNewOrder(params: any): VendOrder;
    /** Gets a Vend order given its UUID    */
    getVendOrder(uuid: string): VendOrder;
    /** Removes a previously created Vend Order.
     * 
     * @param {String} uuid 
     * @returns {Boolean}                               */
    removeVendOrder(uuid: string): boolean;
    /** Returns IOT Machine that match 
     * with specified arguments.                        */
    findDeviceByID(...args: any[]): IOTMachineClass;
    /** Returns the IOT Machine accord QR Code text.    */
    findDeviceByQR(qr: string): IOTMachineClass;
    /** Returns the IOT Machine accord topic path.      */
    findDeviceByTopic(topic: string): IOTMachineClass;
    /** Reception from Mqtt Server.
     * 
     * Each driver listen its owm topics.   */
    mqttIncoming(msg: MQTTMessage): void;
    /** Subscription was accepted           */
    mqttSubscribed(topic: MQTTTopic): void;
    /** Ends Vend Order.
     * 
     * Send request to create invoice.      */
    vendComplete(order: VendOrder): Promise<boolean>;
}
/** IOT Machine Pool Base Class           
 * 
 * A Collection of Machine Drivers.         */
export declare class IOTMachinePool extends HTTPDevicesDriver {
    /** Object Owner                        */
    parent: HTTPServer;
    /** Device Drivers Collection           */
    drivers: Record<string, IOTMachineDriver>;
    /** Vend Order Collection               */
    vendOrders: Record<string, VendOrder>;
    /** Device Pool Specific Options        */
    options: DataMap;
    /** Initialize the Object               */
    _init(args?: any): void;
    constructor(parent: HTTPServer, args?: any);
    /** Returns the Device Driver 
     * given its name                       */
    getDriver(): IOTMachineDriver;
    /** Returns the Object Options          */
    getOptions(): DataMap;
    /** Returns Object Owner                */
    getParent(): HTTPServer;
    /** Adds a new Machine Driver Class     */
    addDriver(name: string, driver: IOTMachineDriver): IOTMachineDriver;
    /** Create a New Vend order with specified parameters*/
    createNewOrder(params: any): VendOrder;
    /** Gets a Vend order given its UUID        */
    getVendOrder(uuid: string): VendOrder;
    /** Removes a previously created Vend Order.*/
    removeVendOrder(uuid: string): boolean;
    /** Gets the driver from request
      * 
      * @param {Record<String,Object>} body 
      * @returns {Promise<IOTMachineDriver>}    */
    getDriverFromRequest(body: any): Promise<IOTMachineDriver>;
}

/** Utilities Container.
 * 
 * Contains some ussefully functions                */
export declare const Fn: FnModule;
/** File System quick driver.
 * 
 * Contains some ussefully file system functions    */
export declare const Fs: FsModule;
/** CRC16 Calculator                                */
export declare const CRC16: CRC16Module;
/** TLS Utilities.
 * 
 * ***Transport Layer Secure*** Utilities.          */
export declare const TLS: TLSModule;

type ErrorTableDataType = {
    secureError:        /**/ string;
    unspecifiedError:   /**/ string;
    loginError:         /**/ string;
    restrictedAccess:   /**/ string;
    badParameters:      /**/ string;
    atItemError:        /**/ string;
    storeNotFound:      /**/ string;
    storeMemberError:   /**/ string;
    storeWalletError:   /**/ string;
    clientNotFound:     /**/ string;
    clientWalletError:  /**/ string;
    laneNotFound:       /**/ string;
    saleTypeError:      /**/ string;
    productNotFound:    /**/ string;
    productQtyError:    /**/ string;
    productNotMatch:    /**/ string;
    unitPriceError:     /**/ string;
    taxesNotFound:      /**/ string;
    amountError:        /**/ string;
    itemsError:         /**/ string;
    machineNotFound:    /**/ string;
    machineBusy:        /**/ string;
    machineError:       /**/ string;
    uuidNotFound:       /**/ string;
    uuidAlreadyExists:  /**/ string;
    invoiceError:       /**/ string;
    paymentError:       /**/ string;
    insufficientFunds:  /**/ string;
    qrNotSpecified:     /**/ string;
    registerError:      /**/ string;
};
/** Error Enumeration       */
export declare const ERROR_TABLE: ErrorTableDataType;

/** Container for QR field  */
export declare class QRObject {
    storeId: string;
    laneId: string;
    code: string;
    constructor(qr: any);
}
