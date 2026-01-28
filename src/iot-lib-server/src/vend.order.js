/**
 * Vend Order Module
 */

import { Fn } from "./utilities.js";

/** **Vend Item**.
 * 
 * Contains the vend data for a single lane.
 * 
 *  Arguments from request
 *  - ***lane***: The Lane Data
 *  - ***quantity***: How many products
 * 
 * Arguments added:
 *  - ***unit_price***: Product unit price full, include taxes.
 *  - ***dispensed***:  How many products has been dispensed. 
 *                      It can be used as index until complete the quantity.
 *  - ***amount***:     The product cost, for this item.
 */
class VendItem {
    /** **Vend Item**.
     * 
     * ***The item is active until complete the request quantity***.
     * 
     * 
     * @param {VendOrder} order 
     * @param {import("./iot.defines").IOT.LaneDataType}     lane 
     * @param {import("./iot.defines").IOT.ProductDataType}  product 
     * @param {import("./iot.defines").IOT.PriceDataType}    price 
     * @param {Number} quantity 
     * @param {Number} unit_price */
    constructor(order, lane, product, price, quantity, unit_price) {
        /** @type {VendOrder} */
        this.order = order;
        /** @type {import("./iot.defines").IOT.LaneDataType}     */
        this.lane = Fn.update({}, lane);
        /** @type {import("./iot.defines").IOT.ProductDataType}  */
        this.product = Fn.update({}, product);
        /** @type {import("./iot.defines").IOT.PriceDataType}    */
        this.priceData = Fn.update({}, price);
        /** @type {Number}  */
        this.quantity = quantity;
        /** @type {Number}  */
        this.unitPrice = unit_price;
        /** @type {Number}  */
        this.dispensed = 0;
        /** @type {Number}  */
        this.amount = 0;
    }
}
/** **Vend Order**.
 * 
 * Contains all necesary to execute a vend. */
class VendOrder {
    constructor(uuid, data) {
        /** @type {String}          */
        this.uuid = uuid;
        /** @type {Array<VendItem>} */
        this.items = [];
        /** @type {import("./iot.defines").IOT.StoreDataType}    */
        this.store = {};
        /** @type {import("./iot.defines").IOT.MemberDataType}   */
        this.member = {};
        /** @type {import("./iot.defines").IOT.ProductDataType}  */
        this.product = {};
        /** The store identity
         * @type {String}           */
        this.storeId = "";
        /** @type {Number}          */
        this.initialBalance = 0;
        /** The ***total*** vend cost.
         * @type {Number}           */
        this.amount = 0;
        /** Used as counter before next item
         * @type {Number}           */
        this.currentOffset = 0;
        /** Indicate the current vend index offset 
         * @type {Number}           */
        this.currentItem = 0;
        /** Indicate the vend state. 
         * @type {import("./iot.defines").IOT.VendStateEnum} */
        this.state = "none";
        /** Indicate some vend error. 
         * @type {String}           */
        this.error = "";
        /** Store and lane identifier
         * @type {String}           */
        this.qr = "";
        /** @type {IOTDispenser}    */
        this.proctime = Fn.millis();
        /** How is the vender.
         * 
         * Refers to IOT device that dispense products.
         * @type {Object}           */
        this.vender = null;
        Fn.update(this, data);
    }
    /** Get the current vend Item
     * 
     * @returns {VendItem}          */
    getCurrentItem() {
        let vend = this;
        return vend.items[vend.currentItem];
    }
    /** Returns the Response Map for this Vend Order.
     * 
     * Returns:
     *   - Vend Order data
     *   - Each Order Item information
     *   - Calculate amounts here.
     * @returns {Record<String,Object>} */
    getResponse() {
        const order = this;
        let items = [];
        let amount = 0;
        order.items.map((v) => {
            let a0 = v.dispensed * v.unitPrice;
            amount += a0;
            items.push({
                laneId:         /**/ v.lane.nickName,
                quantity:       /**/ v.quantity,
                dispensed:      /**/ v.dispensed,
                unitPrice:      /**/ v.unitPrice,
                amount:         /**/ a0,
                product: {
                    productId:  /**/ `${v.product.productId}`,
                    name:       /**/ `${v.product.name}`,
                    nickName:   /**/ `${v.product.nickName}`,
                    imageFile:  /**/ `${v.product.imageFile}`,
                    metaData:   /**/ `${v.product.metaData}`,
                }
            });
        });
        let resp = {
            qr:             /**/ order.qr,
            token:          /**/ order.uuid,
            state:          /**/ order.state,
            items:          /**/ items,
            store: {
                storeId:    /**/ `${order.store.storeId}`,
                name:       /**/ `${order.store.name}`,
                nickName:   /**/ `${order.store.nickName}`,
                zoneId:     /**/ `${order.store.zoneId}`,
                zoneName:   /**/ `${order.store.zoneName}`,
                zoneNick:   /**/ `${order.store.zoneNick}`,
            },
            member: {
                phoneNumber:/**/ `${order.member.phoneNumber}`,
                phoneCode:  /**/ `${order.member.phoneCode}`,
                memberType: /**/ `${order.member.memberType}`,
                name:       /**/ `${order.member.name}`,
                lastName:   /**/ `${order.member.lastName}`,
                email:      /**/ `${order.member.email}`,
            },
            amount:         /**/ amount,
            initialBalance: /**/ order.initialBalance,
            currentItem:    /**/ order.currentItem,
        };
        if (order.error) resp.error = order.error;
        return resp;
    }
}
export { VendItem, VendOrder, }; 