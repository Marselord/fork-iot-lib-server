//
// XML Object
//
import { Fn } from "./utilities.js";

/** Find nodes by tag name.
 * @param tag   The tag name
 * @param node  Wher find
 * @param list  The result */
function findnode(tag, node, list) {
    if (node.key == tag) list.push(node);
    if (Array.isArray(node)) {
        for (let x0 = 0; x0 < node.length; x0++) {
            let child = node[x0];
            findnode(tag, child, list);
        }
        return;
    }
    if (node.childNodes && typeof node.childNodes == "object") {
        for (let k0 in node.childNodes) {
            let child = node.childNodes[k0];
            findnode(tag, child, list);
        }
    }
}
/** Parse to Node data type.
* @param {XMLNode} node to evaluate
* @returns node as its data type. */
function parsenode(node) {
    //________________________________________________
    if (node.childNodes && typeof node.childNodes == "object") {
        let map = {};
        for (let k0 in node.childNodes) {
            let child = node.childNodes[k0];
            let value;
            if (Array.isArray(child)) {
                let array = [];
                for (let x0 = 0; x0 < child.length; x0++) {
                    let /** @type {XMLNode} */ item = child[x0];
                    item = parsenode(item);
                    array.push(item);
                }
                value = array;
            } else value = parsenode(child);
            map[k0] = value;
        }
        return map;
    }
    //________________________________________________
    let s0 = node.val.trim();
    let c0 = s0 ? s0.charAt(0) : "";
    if ((c0 >= '0' && c0 <= '9') || (c0 == '-')) {
        let pos = s0.lastIndexOf("-");
        if (pos > 0) return s0;
        pos = s0.indexOf("/");
        if (pos > 0) return s0;
        pos = s0.indexOf(".");
        if (pos > 0) {
            let f0 = parseFloat(s0);
            if (!isNaN(f0)) return f0;
        }
        let base = 10;
        if (s0.startsWith("0x")) {
            s0 = s0.substring(2);
            base = 16;
        }
        let n0 = parseInt(node.val, base);
        if (!isNaN(n0)) return n0;
    }
    if (s0.startsWith("#")) {
        s0 = s0.substring(1);
        let n0 = parseInt(s0, 16);
        if (!isNaN(n0)) return n0;
    }
    if (s0 == "true") return true;
    if (s0 == "false") return false;
    return node.val;
}
/** stringfy Node
 * @param {XMLNode} node 
 * @returns {String} */
function parsexml(node) {
    let text = "";
    if (node.childNodes && typeof node.childNodes == "object") {
        text = `<${node.key}`;
        let attr = node.getAttributes();
        if (attr.length > 0) {
            for (let x0 = 0; x0 < attr.length; x0++) {
                let att = attr[x0];
                text += ` ${att.key}="${att.val}"`;
            }
        }
        text += `>`;
        let nodes = node.getNodes();
        for (let x0 = 0; x0 < nodes.length; x0++) {
            let child = nodes[x0];
            if (Array.isArray(child)) {
                for (let x1 = 0; x1 < child.length; x1++) {
                    text += parsexml(child[x1]);
                }
            } else text += parsexml(child);
        }
        let xval = node.val.trim();
        text += xval;
        text += `</${node.key}>`;
        return text;
    }
    let val = node.val.trim();
    text = `<${node.key}>${val}</${node.key}>`;
    return text;
}
/** Adds align
 * @param {Number} proof 
 * @param {String} cr 
 * @returns {String} */
function __htmlalign(proof, cr) {
    let txt = `<span class="xml_tag_align">`;
    for (let x0 = 0; x0 < proof; x0++) {
        txt += "&nbsp;&nbsp;";
    }
    txt += `</span>`;
    return txt;
}
/** Parse Node to HTML
 * @param {XMLNode} node 
 * @param {Number} proof 
 * @param {String} cr */
function parsehtml(node, proof, cr) {
    let text = "";
    if (node.childNodes && typeof node.childNodes == "object") {
        let count = 0;
        text += `<span class="xml_tag">&lt;${node.key}`;
        let attr = node.getAttributes();
        while (count < attr.length) {
            if (count == 0) {
                text += `&nbsp;</span>`;
            } else {
                text += cr + __htmlalign(proof + 2, cr);
            }
            let att = attr[count];
            text += `<span class="xml_att_name">${att.key}</span>`;
            text += `<span class="xml_att_sep">=</span>`;
            text += `<span class="xml_att_val">"${att.val}"</span>`;
            count += 1;
        }
        if (count == 0) {
            text += `&gt;</span>`
        } else {
            text += `<span class="xml_tag">&gt;</span>`;
        }
        //________________________________________________________
        let nodes = node.getNodes();
        count = 0;
        while (count < nodes.length) {
            let child = nodes[count];
            if (Array.isArray(child)) {
                for (let x0 = 0; x0 < child.length; x0++) {
                    text += cr + __htmlalign(proof + 1, cr);
                    text += parsehtml(child[x0], proof + 1, cr);
                }
            } else {
                text += cr + __htmlalign(proof + 1, cr);
                text += parsehtml(child, proof + 1, cr);
            }
            count += 1;
        }
        let val = node.val.trim();
        if (count > 0) {
            if (val.length > 0) {
                text += cr + __htmlalign(proof + 1, cr);
                text += `<span class="xml_val">${val}</span>`;
            }
            text += cr + __htmlalign(proof, cr);
        } else {
            if (!val) val = "&nbsp;&nbsp;";
            text += `<span class="xml_val">${val}</span>`;
        }
        text += `<span class="xml_tag">&lt;/${node.key}&gt;</span>`;
        return text;
    }
    let val = node.val.trim();
    if (!val) val = "&nbsp;&nbsp;";
    text += `<span class="xml_tag">&lt;${node.key}&gt;</span>`;
    text += `<span class="xml_val">${val}</span>`;
    text += `<span class="xml_tag">&lt;/${node.key}&gt;</span>`;
    return text;
}
/** Pair key-value container.
*
* Used to store data as a Map tree.  */
/** Pair key-value container.
*
* Used to store data as a Map tree.  */
class XMLNode {
    constructor(key, ...args) {
        /** Pair: Key
         * @type {String}   */
        this.key = typeof key == "string" ? key : "";
        /** Pair: Value
         * @type {String}   */
        this.val = typeof args[0] == "string" ? args[0] : "";
        /** Where this node belongs
         * @type {XMLNode}    */
        this.parent = args[1];
        /** Child List
         * @type {XMLNode}    */
        this.childNodes;
        /** ` true ` if node define attribute */
        this.isAtribute = false;
    }
    /** Puts/Append a new child from this node.
     * @param key child's key
     * @param val initial value */
    put(key, val) {
        let node = this;
        let child;
        key = key.trim();
        if (key) {
            if (!node.childNodes) node.childNodes = {};
            child = node.childNodes[key];
            if (!child) {
                node.childNodes[key] = new XMLNode(key, val, node);
                child = node.childNodes[key];
                return child;
            }
            if (!Array.isArray(child)) {
                node.childNodes[key] = [child];
                child = node.childNodes[key];
            }
            if (Array.isArray(child)) {
                let inx = node.childNodes[key].length;
                node.childNodes[key].push(new XMLNode(key, val, node));
                child = node.childNodes[key][inx];
            }
        }
        return child;
    }
    getAttributes() {
        let node = this;
        let atts = [];
        if (node.childNodes && typeof node.childNodes == "object") {
            for (let k0 in node.childNodes) {
                let child = node.childNodes[k0];
                if (child && child.isAtribute) {
                    atts.push(child);
                }
            }
        }
        return atts;
    }
    getNodes() {
        let node = this;
        let nodes = [];
        if (node.childNodes && typeof node.childNodes == "object") {
            for (let k0 in node.childNodes) {
                let child = node.childNodes[k0];
                if (child && !child.isAtribute) {
                    nodes.push(child);
                }
            }
        }
        return nodes;
    }
    /** Puts an attribute
     * @param key attribute name
     * @param val attribute data */
    putAttribute(key, val) {
        let node = this;
        let attr;
        key = key.trim();
        if (key) {
            if (!node.childNodes) node.childNodes = {};
            attr = node.childNodes[key];
            if (!attr) {
                node.childNodes[key] = new XMLNode(key, val, node);
                attr = node.childNodes[key];
            }
            if (attr) {
                attr.val = val;
                attr.isAtribute = true;
            }
        }
        return attr;
    }
    /** Gets a child from this node
     * @param key child's key or path tree. */
    get(key) {
        let node = this;
        let nod1, nod0 = node;
        let dne = false;
        let paths = key.split("/");
        for (let k0 in paths) {
            dne = false;
            if (nod0 instanceof XMLNode) {
                nod0 = nod0.childNodes[paths[k0]];
                dne = true;
            } else break;
        }
        if (dne) nod1 = nod0;
        return nod1;
    }
    /** Sets the specified key with given value */
    set(key, val) {
        let node = this;
        let nod0 = node.get(key);
        if (nod0 instanceof XMLNode) {
            if (val == undefined || val == null) {
                val = "";
            }
            if (typeof val != "string") {
                val = typeof val.toString == "function"
                    ? val.toString() : "" + val;
            }
            nod0.val = val;
            return true;
        }
        return false;
    }
    /** Checks if Node is leaf
     * @returns {Boolean} */
    isLeaf() {
        let x = this;
        return (!x.childNodes);
    }
    /** Checks if node is root */
    isRoot() {
        let x = this;
        return x.parent == undefined;
    }
    /** Gets this Node root object
     * @returns {XMLNode} */
    getRoot() {
        let x = this;
        let n = x;
        while (n.parent) {
            n = n.parent;
        }
        return n;
    }
    /** Finds nodes with specified key */
    find(key) {
        let x = this;
        let list = [];
        findnode(key, x, list);
        return list;
    }
    /** Get the object that represent this Node */
    getMap() {
        let x = this;
        return parsenode(x);
    }
    encode(encoding, pretty) {
        let node = this;
        let val = "";
        let nodo;
        switch (encoding) {
            case "json":
                val = parsenode(node);
                val = Fn.jsonToString(val, pretty);
                break;

            case "xml":
                if (!node.key) {
                    let keys = Fn.keySet(node.childNodes);
                    if (keys.length > 0) {
                        nodo = node.childNodes[keys[0]];
                    }
                } else nodo = node;
                if (nodo) {
                    val = parsexml(nodo);
                }
                break;
            case "html":
                if (!node.key) {
                    let keys = Fn.keySet(node.childNodes);
                    if (keys.length > 0) {
                        nodo = node.childNodes[keys[0]];
                    }
                } else nodo = node;
                if (nodo) {
                    let htm = `<div class="xml_doc">`;
                    htm += parsehtml(nodo, 0, "<br>");
                    htm += "</div>";
                    val = htm;
                }
                break;
        }
        return val;
    }
}
class XMLParser {
    constructor() {
        this.xmltext = "";
        this.offset = 0;
        this.onesc = true;
        this.onatt = false;
        this.ontxt = false;
        this.onval = false;
        this.ontag = false;
        this.onclose = false;
        this.onparam = false;
        this.clast = "";
        this.dlast = "";
        this.tagtext = "";
        this.tagname = "";
        this.root = new XMLNode("", "");
        this.current = this.root;
        return this;
    }
    //
    readnext() {
        let x = this;
        if (x.offset < x.xmltext.length) {
            let c0 = x.xmltext.charAt(x.offset++);
            x.dlast = x.clast;
            x.clast = c0;
            return c0;
        }
        return "";
    }
    //
    clearflags() {
        let x = this;
        x.ontag = false;
        x.onatt = false;
        x.ontxt = false;
        x.onclose = false;
        x.onparam = false;
        x.oncomment = false;
    }
    //
    clearall() {
        let x = this;
        x.ontag = false;
        x.onatt = false;
        x.ontxt = false;
        x.onclose = false;
        x.onparam = false;
        x.oncomment = false;
        x.tagname = "";
        x.tagtext = "";
    }
    //
    isvalidchar(c0) {
        return (c0 > ' ' &&
            c0 != '=' &&
            c0 != '/' &&
            c0 != '?');
    }
    //
    readchar() {
        let x = this;
        while (x.offset < x.xmltext.length) {
            let c0 = x.readnext();
            //______________________________________
            if (x.onesc) {
                if (c0 > ' ') {
                    x.onesc = false;
                } else continue;
            }
            if (c0 < ' ') {
                x.onesc = true;
                if (x.ontag) {
                    if (!x.onatt) {
                        x.current = x.current.putAttribute(x.tagname, "");
                        x.tagname = "";
                        x.tagtext = "";
                        x.onatt = true;
                    }
                }
                continue;
            }
            //______________________________________
            if (x.ontxt) {
                if (c0 == '\"' && x.dlast != '\\') {
                    x.ontxt = false;
                    x.current.putAttribute(x.tagname, x.tagtext);
                    x.tagname = "";
                    x.tagtext = "";
                    continue;
                }
                x.tagtext += c0;
                continue;
            }
            //______________________________________
            if (x.ontag) {
                if (c0 == '>') {
                    if (!x.onatt) {
                        x.current = x.current.put(x.tagname, "");
                    }
                    if (x.dlast == '/') {
                        x.current = x.current.parent;
                        if (!x.current) {
                            let t0 = x.xmltext.substring(x.offset);
                            console.log("next xml text=", t0);
                            throw ("Not complete");
                        }
                    }
                    x.clearall();
                    continue;
                }
                if (x.onatt) {
                    if (c0 == '\"') {
                        x.ontxt = true;
                        continue;
                    }
                    if (x.isvalidchar(c0)) {
                        x.tagname += c0;
                    }
                    continue;
                }
                if (c0 == ' ') {
                    x.current = x.current.put(x.tagname, "");
                    x.onatt = true;
                    x.tagname = "";
                    x.tagtext = "";
                    continue;
                }
                if (x.isvalidchar(c0)) {
                    x.tagname += c0;
                }
                continue;
            }
            //_____________________________________________
            if (x.onclose) {
                if (c0 == '>') {
                    x.current = x.current.parent;
                    if (!x.current) {
                        let t0 = x.xmltext.substring(x.offset);
                        console.log("next xml text=", t0);
                        throw ("Not complete");
                    }
                    x.clearall();
                }
                continue;
            }
            //_____________________________________________
            if (x.onparam) {
                if (c0 == '>') {
                    x.clearall();
                }
                continue;
            }
            //_____________________________________________
            if (x.oncomment) {
                if (c0 == '>' && x.dlast == "-") {
                    x.clearall();
                }
                continue;
            }
            //_____________________________________________
            if (c0 == '<') {
                if (!x.current) {
                    x.current = x.root;
                }
                x.current.val += x.tagtext;
                x.clearall();
                let c1 = x.readnext();
                if (c1 == '/') {
                    x.onclose = true;
                    continue;
                }
                if (c1 == '?') {
                    x.onparam = true;
                    continue;
                }
                if (c1 == '!') {
                    c1 = x.readnext();
                    if (c1 == '-') {
                        x.oncomment = true;
                        continue;
                    }
                    x.onparam = true;
                    continue;
                }
                x.ontag = true;
                x.tagname += c1;
                continue;
            }
            x.tagtext += c0;
        }
    }
    /** Parse from XML string.
     * @param {String} text XML string
     * @returns {XMLNode}  */
    parse(text) {
        let x = this;
        x.xmltext = typeof text == "string"
            ? text.trim() : "";
        try {
            x.readchar();
        }
        catch (err) {
            console.error("Parsing XML", err);
        }
        return x.root;
    }
}
/** Parse the xml text to a Node XML
 * @param {String} xmltext 
 * @returns {XMLNode} */
function parseToxml(xmltext) {
    let /** @type {XMLNode} */ node;
    try {
        let parser = new XMLParser();
        node = parser.parse(xmltext);
    } catch (err) { }
    return node;
}
/** XML Module */
class XMLObject {
    constructor() {
        /** XML Node Object
         * @type {XMLNode}      */
        this.Node;
        /** XML Parser.
         * @type {XMLParser}    */
        this.Parser;
        /** Parse to XML        */
        this.parse = parseToxml;
        return this;
    }
}
/** XML Module
 * @type {XMLObject} */
var XML = new XMLObject();
//
export {
    XMLParser,
    XMLNode,
    XML
};
