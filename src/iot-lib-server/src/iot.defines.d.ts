import http from "http";

export declare namespace IOT {
    /** Function Type definition    */
    type FunctionType = (...args: any[]) => void;
    /** Connection State Enumeration            */
    type ConnectStateEnum = "closed"
        | "connected"
        | "attached"
        | "closing"
        | "connecting"
        | "idle"
    /** Connection Options      
     * 
     * Contains general connection arguments    */
    type ConnectOptionsType = {
        host?: string;
        port?: number;
        url?: string;
        clientId?: string;
        userName?: string;
        password?: string;
        passwd?: string;
        keepAlive?: number;
        timeout?: number;
        reconnect?: number;
        protocol?: string;
        version?: string;
        secure?: any;
        keyFile?: string;
        keyUser?: string;
        connectAt?: number;
        authMinTime?: number;
        authMaxTime?: number;
        jwtMinTime?: number;
        jwtMaxTime?: number;
        sessionMaxTime?: number;
        allowedPaths?: string[];
        location?: string;
        socketTimeout?: number;
    }
    /** Event names Enumeration     */
    type IOEventsType = "change"
        | "close"
        | "connect"
        | "data"
        | "error"
        | "message"
        | "acknowledge"
        | "subscribed"
        | "removed"
        | "alive"
        | "ready"
    /** Packet Names Enumertion     */
    type PacketNamesEnum = "connect"
        | "conack"
        | "publish"
        | "pub.ack"
        | "pub.receive"
        | "pub.release"
        | "pub.complete"
        | "subscribe"
        | "suback"
        | "unsubscribe"
        | "unsuback"
        | "ping.request"
        | "ping.response"
        | "disconnect"
        | "auth"
    /** Date fields enumeration */
    type DateFieldType = "seconds"
        | "minutes"
        | "hours"
        | "days"
        | "month"
        | "year"

    type MapCaseNameEnum = "camel"
        | "pascal"
        | "snake"

    /** Mqtt Topic Data Type
     * 
     * Used to parse a Topic path               */
    type TopicBasicType = {
        fullname: string;
        name: string;
        dash: boolean;
    }
    /** Header Names Enumeration                */
    type HeaderNamesEnum = "accept-language"
        | "accept-patch"
        | "accept-ranges"
        | "access-control-allow-credentials"
        | "access-control-allow-headers"
        | "access-control-allow-methods"
        | "access-control-allow-origin"
        | "access-control-expose-headers"
        | "access-control-max-age"
        | "access-control-request-headers"
        | "access-control-request-method"
        | "age"
        | "alt-svc"
        | "authorization"
        | "cache-control"
        | "content-disposition"
        | "content-encoding"
        | "content-language"
        | "content-length"
        | "content-location"
        | "content-range"
        | "content-type"
        | "cookie"
        | "date"
        | "etag"
        | "expires"
        | "forwarded"
        | "from"
        | "host"
        | "if-match"
        | "if-modified-since"
        | "if-none-match"
        | "if-unmodified-since"
        | "last-modified"
        | "location"
        | "origin"
        | "proxy-authenticate"
        | "proxy-authorization"
        | "public-key-pins"
        | "retry-after"
        | "sec-websocket-accept"
        | "sec-websocket-extensions"
        | "sec-websocket-key"
        | "sec-websocket-protocol"
        | "sec-websocket-version"
        | "strict-transport-security"
        | "transfer-encoding"
        | "user-agent"
        | "warning"
        | "x-forwarded-for"
        | "x-issuer"
        | "x-timestamp"
        | "x-sessionid"
        | "x-localtime"
        | "x-authorization"
        | "y-authorization"
        | "www-authenticate"
        | "content-secure";
    /** A Header Map Data Type                  */
    type HTTPHeadersType = Record<HeaderNamesEnum, string>;
    /** Used to define the record as Header */
    type HeaderDataType = Record<HeaderNamesEnum, string>;
    /** JWT Header Data Type    */
    type JwtHeaderClaims = {
        /** media type    */
        typ?: string;
        /** Content type  */
        cty?: string;
        /** algorithme    */
        alg?: string;
    }
    /** JWT Payload Data Type   */
    type JwtPayloadClaims = {
        /** issuer. Uniquely identifies the party that issued th JWT    */
        iss?: string;
        /** subjet. The party that this JWT carries information about   */
        sub?: string;
        /** audience.       */
        aud?: string;
        /** expiration time */
        exp?: number;
        /** not before time */
        nbf?: number;
        /** issued time     */
        iat?: number;
        /** uniquely identifies this JWT    */
        jti?: string;
        /** JWT session     */
        session?: string;
    }
    /** JWT field associtted to date        */
    type JwtDateClaims = "iat" | "nbf" | "exp";
    /** Database Connection arguments       */
    type DBConnectOptionsType = ConnectOptionsType;
    /** Http Response Object                */
    type HttpResponseType = {
        statusCode: number;
        statusMessage: string;
        headers: Record<HeaderNamesEnum, string>;
        body: Record<string, any>;
    }
    /** Secure Issuer 
     * ***TLS*** Configuration fields       */
    type IssuerTLSFieldDataType = {
        /** Private Key file path           */
        keyPath: string;
        /** Private key password            */
        keyPasswd: string;
        /** Owner of Private password       */
        userName: string;
        /** Refers to login `code` field    */
        nameType: string;
        /** Refers to login `type` field    */
        memberType: string;
        /** security paraphrase             */
        passwd: string;
    }
    /** Secure Issuer
     * ***User Data*** fields               */
    type IssuerUserDataType = {
        name: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        phoneCode: string | number;
        phoneCodeName: string;
        phoneCodeNick: string;
        documentNumber: string;
        documentType: string | number;
        documentTypeName: string;
        documentTypeNick: string;
        memberType: string | number;
        memberTypeName: string;
        memberTypeNick: string;
        memberData: string | Record<string, any>;
        dbUser: string;
        userType: string | number;
        userData: string | Record<string, any>;
        walletData: {
            accountName: string;
            groupId: string;
        }
    }
    /** Secure Issuer Properties        */
    type IssuerOptionsType = {
        /** path for login              */
        loginPath: string;
        /** path for queries            */
        queryPath: string;
        /** path for sessions           */
        sessionPath: string;
        /** Automatic parse response body to:
         * 
         * Cases:
         *  - "camel",
         *  - "pascal",
         *  - "snake",  
         */
        parseCase: string;
        /** The listener host for this page services.   */
        host: string;
        /** The host to use for specific path.
         * 
         * Example:
         * ```json
         * {
         *      "/api/services/comm":    "https://domain1.com/comm/services",
         *      "/api/services/queries": "https://domain2.com/queries",
         * }
         * ```
         */
        paths: Record<string, string>;
        /** TLS parameters                      */
        tlsData: IssuerTLSFieldDataType;
        /** User parameters                     */
        usrData: IssuerUserDataType;
        /** Default database to be used         */
        dbname: string;
        /** Default user fro database           */
        dbuser: string;
    }
    /** Issuer Connection                       */
    class HTTPIssuer {
        sessionId: string;
        /** Member/User parameters              */
        userData: IssuerUserDataType;
        /** TLS parameters                      */
        tlsData: IssuerTLSFieldDataType;
        /** Configuration/Options               */
        options: IssuerOptionsType;
        secured: boolean;
        /** Access type:
         *    - Basic
         *    - Bearer
         *    - Application             */
        ctype: string;
        /** Set algoritm keys           */
        setKeys(key: Buffer): void;
        /** **Decrypt**
         * 
         * From cipher to plain text.   */
        decrypt(data: any): Promise<Buffer>;
        /** **Encrypt**
         * 
         * From plain to cipher text.   */
        encrypt(data: any): Promise<Buffer>;
    }
    /** Container for a Http Request
     * 
     * Extends the Http Request as a ***Session***.
     * 
     * Each session contains parameters as:
     *  - Cipher keys
     *  - User information. 
     *  - IDs
     *       
     * It includes:
     *  - ***request***:   The original Http request.
     *  - ***response***:  The response object. The Stream for the request responses.
     *  - ***body***:      The Request's body.
     *  - ***issuer***:    Who sends this request.
     *     - ***sessionId***:  Identifies the session  
     */
    class HTTPSession {
        request: http.IncomingMessage;
        response: http.ServerResponse;
        body: Record<string, any>;
        issuer: HTTPIssuer;
        /** Gets the request path           */
        getPath(): string;
        /** Gets a Header from this request */
        getHeader(name: HeaderNamesEnum, headers?: HeaderDataType): string;
        /** **Sends response and close the Http request**.  */
        close(body: any, code: number, headers: Record<HeaderNamesEnum, string>, compress?: boolean): boolean;
        close(body: any, headers: Record<HeaderNamesEnum, string>, compress?: boolean): boolean;
        close(body: any, code: number): boolean;
        close(body: any): boolean;
        /** **Sends response and close the Http request**   */
        error(err: any, code?: number): boolean;
    }
    /** Defines parameters for a request and its response.  */
    type ServerApiCallbackType = (session: HTTPSession, next: () => void) => void;
    /** Minimal options to create a Http Server             */
    type ServerOptionsType = {
        host: string;
        port: number;
        authMaxTime: number;
        authMinTime: number;
        jwtMaxTime: number;
        jwtMinTime: number;
        sessionMaxTime: number;
        mqttBridge: boolean;
        allowedPaths: string[];
        logFile: string;
        unsecure: boolean;
    }
    /** Database User Credentials Data Type         */
    type UserConnectionOptions = {
        /** The database user to authenticate as    */
        user: string;
        /** The password of dabase user             */
        password: string;
    }
    /** Database User List Data Type    */
    type DBUserListType = Record<string, UserConnectionOptions>;
    /** Describe the Database Connection Options.
     * 
     * Used into Database driver to know it resources.      */
    type DBLocationOptions = {
        /** Name of the database to use for this connection */
        database?: string;
        /** The charset for the connection. This is called "collation" in the SQL-level of MySQL (like utf8_general_ci).
         * If a SQL-level charset is specified (like utf8mb4) then the default collation for that charset is used.
         * (Default: 'UTF8_GENERAL_CI')                     */
        charset?: string;
        /** Number of milliseconds                          */
        timeout?: number;
        /** The hostname of the database you are connecting to. (Default: localhost)     */
        host?: string;
        /** The port number to connect to. (Default: 3306)  */
        port?: number;
    }
    /** Describe the Database Connection Options.
     * 
     * Used into Database driver to know it resources.      */
    type DBLocationListType = Record<string, DBLocationOptions>;
    /** Describe databases and users to be used             */
    type DBConfigurationType = {
        databases: Record<string, DBLocationOptions>;
        users: Record<string, UserConnectionOptions>;
    }
    /** SQL required arguments Data Type    */
    type SQLStatementType = {
        sql: string;
        values: string[];
    }
    /** Object's Options Data Type          */
    type ObjectOptionsType = Record<string, any>;
    /** Define html style attribute         */
    type HtmlStyleDataType = Record<string, any>;
    /** Database Column Descriptor          */
    type ColumnDescriptorType = {
        Field: string;
        Type: string;
        Null: string;
        Key: string;
        Default: string;
        Extra: string;
        alias: string;
        bool: boolean;
        timestamp: boolean;
        options: Record<string, string>;
        className: string;
        style: HtmlStyleDataType;
    }
    /** A Columns Array                     */
    type TableColDescriptorType = Record<string, ColumnDescriptorType>;
    /** Object Options Data Type            */
    type TableOptionsType = ObjectOptionsType;
    /** Database Table Descriptor           */
    type TableDescriptorType = {
        alias: string;
        name: string;
        cols: TableColDescriptorType;
        options: TableOptionsType;
    }
    /** Database Tables Data Type           */
    type TableCollectionType = Record<string, TableDescriptorType>
    /** Database Descriptor Data Type       */
    type DBDescriptorType = {
        alias: string;
        name: string;
        tables: TableCollectionType;
        options: ObjectOptionsType;
    }

    type SQLInsertDataType = {
        database: string;
        table: string;
        values: Record<string, any>;
    }

    type SQLUpdateDataType = {
        database: string;
        table: string;
        values: Record<string, any>;
        where: Record<string, any>;
    }
    /** Http Request Data Type          */
    type HTTPRequestType = {
        method?: string;
        url?: string;
        host?: string;
        port?: number;
        path?: string;
        headers: Record<HeaderNamesEnum, string>;
        body: any;
    }
    /** **Drives a IOT Device**.
     * 
     * Base Class to drive a IOT Device using Http Request  */
    class HTTPDevicesDriver {
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
        doActivate(_data: Record<string, any>): Record<string, any>;
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
        doState(_data: Record<string, any>): Record<string, any>;
        /** Returns information about the Machine
         * 
         * Parameters:
         *  - ***qr***: Machine Identity
         */
        doInfo(_data: Record<string, any>): Record<string, any>;
    }

    type IOTDeviceStateEnum = "none"
        | "disconnect"
        | "ready"
        | "active"
        | "busy"
        | "dispensing"
        | "vending"
        | "connecting"

    type FlowmeterDataType = {
        hwid?: string;
        amount?: number;
        dispensed?: number;
        unitPrice?: number;
        action?: string;
    }

    type IOTDeviceOptsDataType = {
        name?: string;
        deviceId?: string;
        deviceType?: string;
        deviceVersion?: string;
        ip?: string;
        id?: string;
        flowmeter?: FlowmeterDataType;
        settings?: Record<string, any>;
    }

    type VendStateEnum = "busy"
        | "vending"
        | "complete"
        | "error"
        | "none"

    /** Define the Member Data  */
    type MemberDataType = {
        documentNumber?: string;
        documentType?: string;
        documentTypeName?: string;
        documentTypeNick?: string;
        phoneNumber?: string;
        phoneCode?: string;
        phoneCodeName?: string;
        phoneCodeNick?: string;
        memberId?: string | number;
        memberType?: string | number;
        memberTypeName?: string;
        memberTypeNick?: string;
        accountName?: string;
        accountType?: string;
        groupId?: string | number;
        balance?: number;
    }

    type StoreDataType = {
        ownerId?: string | number;
        ownerName?: string;
        ownerNick?: string;
        storeId?: string | number;
        name?: string;
        nickName?: string;
        storeType?: string;
        storeTypeName?: string;
        storeTypeNick?: string;
        zoneId?: string | number;
        zoneName?: string;
        zoneNick?: string;
        tableId?: string | number;
        workingHours?: string;
        metaData?: string | Record<string, any>;
        accountName?: string;
    }

    type LaneDataType = {
        ownerId?: string | number;
        ownerName?: string;
        ownerNick?: string;
        laneId?: string;
        storeId?: string | number;
        name?: string | number;
        nickName?: string;
        productId?: string;
        productName?: string;
        productNick?: string;
        laneType?: string | number;
        laneTypeName?: string;
        laneTypeNick?: string;
        capacity?: number;
        workingHours?: string;
        metaData?: string | Record<string, any>;
        imageFile?: string;
        currentProduct?: ProductDataType,
        currentPrice?: PriceDataType,
        currentStorage?: StorageDataType,
    }

    type ProductDataType = {
        productId?: string | number;
        name?: string;
        nickName?: string;
        productType: string | number;
        productTypeName?: string;
        productTypeNick?: string;
        ownerId?: string | number;
        ownerName?: string;
        ownerNick?: string;
        unitId?: string | number;
        unitName?: string;
        unitNick?: string;
        upcCode?: string;
        packageId?: string | number;
        packageName?: string;
        packageNick?: string;
        packageUnits?: number;
        metaData?: string | Record<string, any>;
        productData?: string | Record<string, any>;
        supplierData?: string | Record<string, any>;
        imageFile?: string;
    }

    type PriceDataType = {
        ownerId?: string | number;
        ownerName?: string;
        ownerNick?: string;
        zoneId?: string | number;
        zoneName?: string;
        zoneNick?: string;
        storeId?: string | number;
        storeName?: string;
        storeNick?: string;
        laneId?: string | number;
        laneName?: string;
        laneNick?: string;
        priceId?: string | number;
        priceType?: string | number;
        priceTypeName?: string;
        priceTypeNick?: string;
        unitPrice?: number;
        unitPriceRaw?: number;
        taxesId?: string | number;
        taxesName?: string;
        taxesNick?: string;
        discountAmount?: string | number;
        discountData?: string | Record<string, any>;
        moneyId?: string | number;
        moneyName?: string;
        moneyNick?: string;
        priority?: number;
        priceData?: string | Record<string, any>;
        metaData?: string | Record<string, any>;
        saleType?: string;
        saleTypeName?: string;
        saleTypeNick?: string;
    }

    type StorageDataType = {
        quantity: number;
        storageId: string | number;
        storeId: string;
        storeName: string;
        storeNick: string;
        laneId: string;
        laneName: string;
        laneNick: string;
        productId: string | number;
        productName: string;
        productNick: string;
        storageType: string | number;
        storageTypeName: string;
        storageTypeNick: string;
    }

    type VendRequestItemDataType = {
        laneId: string | null;
        quantity: number;
    }

    type VendRequestDataType = {
        qr?: string;
        token?: string;
        items?: VendRequestItemDataType[];
        member?: MemberDataType;
        ownerId?: string;
        storeId?: string;
        storeType?: string;
        initialBalance?: number;
        store?: StoreDataType;
    }
}