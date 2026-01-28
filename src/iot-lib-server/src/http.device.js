/** **Drives a IOT Device**.
 * 
 * Base Class to drive a IOT Device using Http Request  */
class HTTPDevicesDriver {
    constructor(parent, args) {
        this.parent = parent;
        this._init(args);
    }
    _init(_args) { }
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
     *     
     * @param {Record<String,Object>} _data 
     * @returns {Promise<String,Object>}    */
    doActivate(_data) {
        const fpromise = new Promise((resolve) => {
            resolve({ error: "Not implemented yet", });
        });
        return fpromise;
    }
    /** Returns the current state of the Machine.
     * 
     * Parameters:
     *  - Get only machine information.
     *    - ***qr***: Machine Identity
     * 
     *  - Get the vend state
     *    - ***qr***: Machine Identity
     *    - ***token***: Vend Identity  
     * 
     * @param {Record<String,Object>} _data 
     * @returns {Promise<String,Object>}    */
    doState(_data) {
        const fpromise = new Promise((resolve) => {
            resolve({ error: "Not implemented yet", });
        });
        return fpromise;
    }
    /** Returns information about the Machine
     * 
     * Parameters:
     *  - ***qr***: Machine Identity
     * 
     * @param {Record<String,Object>} _data 
     * @returns {Promise<String,Object>}    */
    doInfo(_data) {
        const fpromise = new Promise((resolve) => {
            resolve({ error: "Not implemented yet", });
        });
        return fpromise;
    }

    

}
export { HTTPDevicesDriver };
