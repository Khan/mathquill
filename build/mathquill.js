/**
 * @license
 * MathQuill v0.10.1, by Han, Jeanine, and Mary
 * http://mathquill.com | maintainers@mathquill.com
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 */

var _a, _b;
const L = -1;
const R = 1;
var min = Math.min;
var max = Math.max;
function noop() { }
function walkUpAsFarAsPossible(node) {
    while (node) {
        if (!node.parent) {
            return node;
        }
        node = node.parent;
    }
    return undefined;
}
/**
 * a development-only debug method.  This definition and all
 * calls to `pray` will be stripped from the minified
 * build of mathquill.
 *
 * This function must be called by name to be removed
 * at compile time.  Do not define another function
 * with the same name, and only call this function by
 * name.
 */
function pray(message, cond, optionalContextNodes) {
    if (!cond) {
        const error = new Error('prayer failed: ' + message);
        // optionally add more context to this prayer failure. We will
        // trace up as far as possible to get all latex we can find as well
        // as output the latex down at the direct parent of the prayer failure
        if (optionalContextNodes) {
            const jsonData = {};
            // this data is attached to the error. The app that controls the mathquill
            // can optionally pull it off when it catches the error and send the extra
            // info with the error.
            error.dcgExtraErrorMetaData = jsonData;
            for (let contextName in optionalContextNodes) {
                const localNode = optionalContextNodes[contextName];
                const data = (jsonData[contextName] = {});
                if (localNode) {
                    data.localLatex = localNode.latex();
                    const root = walkUpAsFarAsPossible(localNode);
                    if (root) {
                        data.rootLatex = root.latex();
                    }
                }
                else {
                    data.emptyNode = true;
                }
            }
        }
        throw error;
    }
}
function prayDirection(dir) {
    pray('a direction was passed', dir === L || dir === R);
}
function parseHTML(s) {
    // https://youmightnotneedjquery.com/#parse_html
    const tmp = document.implementation.createHTMLDocument('');
    tmp.body.innerHTML = s;
    if (tmp.body.children.length === 1)
        return tmp.body.children[0];
    const frag = document.createDocumentFragment();
    while (tmp.body.firstChild) {
        frag.appendChild(tmp.body.firstChild);
    }
    return frag;
}
const h = function h(type, attributes, children) {
    let el;
    switch (type) {
        case 'svg':
        case 'path':
            el = document.createElementNS('http://www.w3.org/2000/svg', type);
            break;
        default:
            el = document.createElement(type);
    }
    for (const key in attributes) {
        const value = attributes[key];
        if (value === undefined)
            continue;
        el.setAttribute(key, typeof value === 'string' ? value : String(value));
    }
    if (children) {
        for (let i = 0; i < children.length; i++) {
            el.appendChild(children[i]);
        }
    }
    return el;
};
h.text = (s) => document.createTextNode(s);
h.block = (type, attributes, block) => {
    const out = h(type, attributes, [block.html()]);
    block.setDOM(out);
    NodeBase.linkElementByBlockNode(out, block);
    return out;
};
h.entityText = (s) => {
    // TODO: replace with h.text(U_BLAHBLAH) or maybe a named entity->unicode lookup
    const val = parseHTML(s);
    pray('entity parses to a single text node', val instanceof DocumentFragment &&
        val.childNodes.length === 1 &&
        val.childNodes[0] instanceof Text);
    return val.childNodes[0];
};
function closest(el, s) {
    var _c, _d, _e;
    if (typeof ((_c = el) === null || _c === void 0 ? void 0 : _c.closest) === 'function') {
        return el.closest(s);
    }
    if (!(el instanceof HTMLElement))
        return null;
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#polyfill
    const matches = Element.prototype.matches ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
    var match = el;
    do {
        if (matches.call(match, s))
            return match;
        match = (_e = (_d = match === null || match === void 0 ? void 0 : match.parentElement) !== null && _d !== void 0 ? _d : match === null || match === void 0 ? void 0 : match.parentNode) !== null && _e !== void 0 ? _e : null;
    } while (match !== null && match.nodeType === 1);
    return null;
}
const U_NO_BREAK_SPACE = '\u00A0';
const U_ZERO_WIDTH_SPACE = '\u200B';
const U_DOT_ABOVE = '\u02D9';
const U_NARY_SUMMATION = '\u2211';
const U_NARY_PRODUCT = '\u220F';
const U_NARY_COPRODUCT = '\u2210';
const U_INTEGRAL = '\u222B';
/**
 * Like `el.getBoundingClientRect()` but avoids throwing for
 * disconnected and hidden elements in IE <= 11.
 * */
function getBoundingClientRect(el) {
    // Return zeros for disconnected and hidden (display: none) elements
    // Running getBoundingClientRect on a disconnected node in IE <=11 throws an error
    // https://github.com/jquery/jquery/blob/a684e6ba836f7c553968d7d026ed7941e1a612d8/src/offset.js#L83-L86
    if (!el.getClientRects().length) {
        return {
            top: 0,
            left: 0,
            height: 0,
            width: 0,
            x: 0,
            y: 0,
            bottom: 0,
            right: 0,
        };
    }
    return el.getBoundingClientRect();
}
/**
 * Returns the number of pixels that the document is currently scrolled
 * horizontally -- `window.scrollX` in modern browsers.
 * */
function getScrollX() {
    // In IE9, scrollX was called pageXOffset
    // Previous versions of IE had neither property and use scrollLeft instead
    //
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX#notes
    return window.pageXOffset !== undefined
        ? window.pageXOffset
        : (document.documentElement || document.body.parentNode || document.body)
            .scrollLeft;
}
/**
 * Returns the number of pixels that the document is currently scrolled
 * vertically -- `window.scrollY` in modern browsers.
 * */
function getScrollY() {
    // In IE9, scrollY was called pageYOffset
    // Previous versions of IE had neither property and use scrollTop instead
    //
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX#notes
    return window.pageYOffset !== undefined
        ? window.pageYOffset
        : (document.documentElement || document.body.parentNode || document.body)
            .scrollTop;
}
/**
 * Given `duration` in ms and callback `cb`, immediately calls `cb(progress, scheduleNext, cancel)` with:
 * - `progress` set to `0` if duration > 0, or 1 if duration <= 0
 * - `scheduleNext` a function that schedules a future call to `cb`
 * - `cancel` a function that cancels any pending `scheduleNext` call.
 *
 * `scheduleNext` schedules a call to `cb` with `progress` set to the
 * ratio of currently elapsed time and `duration`.
 *
 * To continue running the animation, `cb` should call `scheduleNext`.
 *
 * To stop the animation, it is the responsibility of `cb` to check
 * whether progress is greater than or equal to 1, in which case `cb`
 * should not call `scheduleNext`.
 *
 * `scheduleNext` uses `requestAnimationFrame` if available and falls
 * back to `setTimeout(..., 13)` otherwise. Times are always based on
 * `Date.now()` for compatibility between `requestAnimationFrame` and
 * the `setTimeout` fallback. `cb` will only be called with strictly
 * monotonic `progress` values.
 *
 * Note: `animate` purposely puts a lot of responsibility on the caller
 * to keep its implementation simple because it isn't used very widely
 * in the project.
 */
const animate = (function () {
    // IIFE exists just to hang on to configured rafShim and cancelShim
    // functions
    let rafShim, cancelShim;
    if (typeof requestAnimationFrame === 'function' &&
        typeof cancelAnimationFrame === 'function') {
        rafShim = requestAnimationFrame;
        cancelShim = cancelAnimationFrame;
    }
    else {
        rafShim = (cb) => setTimeout(cb, 13);
        cancelShim = clearTimeout;
    }
    return function (duration, cb) {
        let start = Date.now();
        let cancelToken;
        let progress = 0;
        function step() {
            const proposedProgress = (Date.now() - start) / duration;
            // Enforce that progress is strictly monotonic
            if (proposedProgress <= progress) {
                scheduleNext();
            }
            else {
                progress = proposedProgress;
            }
            cb(progress, scheduleNext, cancel);
        }
        function cancel() {
            if (cancelToken !== undefined)
                cancelShim(cancelToken);
            cancelToken = undefined;
        }
        function scheduleNext() {
            // Calling cancel here ensures that there are never multiple
            // concurrent callbacks scheduled for a single animation, even if
            // the caller calls `scheduleNext` multiple times in a single
            // event loop (which is always a mistake)
            cancel();
            cancelToken = rafShim(step);
        }
        cb(duration <= 0 ? 1 : 0, scheduleNext, cancel);
    };
})();
class Aria {
    constructor(controller) {
        this.span = h('span', {
            class: 'mq-aria-alert',
            'aria-live': 'assertive',
            'aria-atomic': 'true',
        });
        this.msg = '';
        this.items = [];
        this.controller = controller;
    }
    attach() {
        const container = this.controller.container;
        if (this.span.parentNode !== container) {
            domFrag(container).prepend(domFrag(this.span));
        }
    }
    queue(item, shouldDescribe = false) {
        var output = '';
        if (item instanceof MQNode) {
            // Some constructs include verbal shorthand (such as simple fractions and exponents).
            // Since ARIA alerts relate to moving through interactive content, we don't want to use that shorthand if it exists
            // since doing so may be ambiguous or confusing.
            var itemMathspeak = item.mathspeak({ ignoreShorthand: true });
            if (shouldDescribe) {
                // used to ensure item is described when cursor reaches block boundaries
                if (item.parent &&
                    item.parent.ariaLabel &&
                    item.ariaLabel === 'block') {
                    output = item.parent.ariaLabel + ' ' + itemMathspeak;
                }
                else if (item.ariaLabel) {
                    output = item.ariaLabel + ' ' + itemMathspeak;
                }
            }
            if (output === '') {
                output = itemMathspeak;
            }
        }
        else {
            output = item || '';
        }
        this.items.push(output);
        return this;
    }
    queueDirOf(dir) {
        prayDirection(dir);
        return this.queue(dir === L ? 'before' : 'after');
    }
    queueDirEndOf(dir) {
        prayDirection(dir);
        return this.queue(dir === L ? 'beginning of' : 'end of');
    }
    alert(t) {
        this.attach();
        if (t)
            this.queue(t);
        if (this.items.length) {
            // To cut down on potential verbiage from multiple Mathquills firing near-simultaneous ARIA alerts,
            // update the text of this instance if its container also has keyboard focus.
            // If it does not, leave the DOM unchanged but flush the queue regardless.
            // Note: updating the msg variable regardless of focus for unit tests.
            this.msg = this.items
                .join(' ')
                .replace(/ +(?= )/g, '')
                .trim();
            if (this.controller.containerHasFocus()) {
                if (this.controller.options.logAriaAlerts && this.msg) {
                    console.log(this.msg);
                }
                this.span.textContent = this.msg;
            }
        }
        return this.clear();
    }
    clear() {
        this.items.length = 0;
        return this;
    }
}
/**
 * A `DOMFragment` represents a contiguous span of sibling DOM Nodes,
 * which may include both Element nodes and other nodes like Text and
 * Comment nodes. A `DOMFragment` may represent zero or more nodes.
 *
 * `DOMFragments` are created using the `DOMFragment.create` factory
 * function, which is also aliased as `domFrag` for convenience.
 *
 * A `DOMFragment` simply holds references to nodes. It doesn't move or
 * mutate them in the way that the native `DocumentFragment` does.
 *
 * `DOMFragment` implements many of the same methods for manipulating a
 * collection of DOM elements that jQuery does, but it has some notable
 * differences:
 *
 * 1.  A jQuery collection can hold an arbitrary ordered set of DOM
 *     elements, but a `DOMFragment` can only hold a contiguous span of
 *     sibling nodes.
 * 2.  Some jQuery DOM manipulation methods like `insert{Before,After}`,
 *     `append`, `prepend`, `appendTo`, `prependTo`, etc. may insert
 *     several clones of a collection into different places in the DOM.
 *     `DOMFragment` never makes clones of DOM nodes--instead, when
 *     targeting multi-element fragments, it moves source nodes before
 *     or after the targeted fragment as appropriate without ever making
 *     more copies.
 * 3.  For methods like `.children()`, where it's likely to be a mistake
 *     to call the method on a fragment that doesn't contain exactly one
 *     node or element, `DOMFragment` will throw whereas jQuery will
 *     silently do something possibly unintended. Methods that assert
 *     are commented with the properties that they assert.
 *
 * Internally, `DOMFragment` holds immutable references to the left and
 * right end nodes (if the fragment is not empty). The other nodes are
 * represented implicitly through the sibling pointers of the DOM nodes
 * themselves. This means that it is possible to invalidate a
 * `DOMFragment` by moving one of its ends without moving the other in
 * such a way that they are no longer siblings. It is also possible to
 * change the contents of a `DOMFragment` by adding or removing DOM
 * nodes between its ends.
 */
class DOMFragment {
    /**
     * Constructor is private to enforce that the invariant checks in
     * `create` are applied to outside callers. Internal methods are
     * allowed to use this constructor when they can guarantee they're
     * passing sibling nodes (such as children of a parent node).
     */
    constructor(first, last) {
        if (arguments.length === 1)
            last = first;
        if (!first || !last)
            return;
        this.ends = { [L]: first, [R]: last };
    }
    /**
     * Returns a `DOMFragment` representing the contiguous span of sibling
     * DOM nodes betewen `first` and `last`. If only one element is
     * passed, creates a `DOMFragment` representing that single element.
     * If no elements are passed, creates and empty `DOMFragment`.
     *
     * If two elements are passed, asserts that the second element is a
     * forward sibling of the first element. Checking this invariant is
     * O(n) in the total number of nodes in the fragment
     */
    static create(first, last) {
        if (arguments.length === 1)
            last = first;
        pray('No half-empty DOMFragments', !!first === !!last);
        const out = new DOMFragment(first, last);
        pray('last is a forward sibling of first', out.isValid());
        return out;
    }
    isEmpty() {
        return this.ends === undefined;
    }
    isOneNode() {
        return !!(this.ends && this.ends[L] === this.ends[R]);
    }
    /**
     * Returns true if the fragment is empty or if its last node is equal
     * to its first node or is a forward sibling of its first node.
     *
     * DOMFragments may be invalidated if any of the nodes they contain
     * are moved or removed independently of the other nodes they contain.
     *
     * Note that this check visits each node in the fragment, so it is
     * O(n).
     */
    isValid() {
        if (!this.ends)
            return true;
        if (this.ends[L] === this.ends[R])
            return true;
        let maybeLast;
        this.eachNode((el) => (maybeLast = el));
        return maybeLast === this.ends[R];
    }
    /**
     * Return the first Node of this fragment. May be a a Node that is not
     * an Element such as a Text or Comment node.
     *
     * Asserts fragment is not empty.
     */
    firstNode() {
        pray('Fragment is not empty', this.ends);
        return this.ends[L];
    }
    /**
     * Return the last Node of this fragment. May be a a Node that is not
     * an Element such as a Text or Comment node.
     *
     * Asserts fragment is not empty.
     */
    lastNode() {
        pray('Fragment is not empty', this.ends);
        return this.ends[R];
    }
    /**
     * Return a fragment representing the children (including Text and
     * Comment nodes) of the node represented by this fragment.
     *
     * Asserts that this fragment contains exactly one Node.
     *
     * Note, because this includes text and comment nodes, this is more
     * like jQuery's .contents() than jQuery's .children()
     */
    children() {
        const el = this.oneNode();
        const first = el.firstChild;
        const last = el.lastChild;
        return first && last ? new DOMFragment(first, last) : new DOMFragment();
    }
    /**
     * Return a new `DOMFragment` spanning this fragment and `sibling`
     * fragment. Does not perform any DOM operations.
     *
     * Asserts that `sibling` is either empty or a forward sibling of
     * this fragment that may share its first node with the last node of
     * this fragment
     */
    join(sibling) {
        if (!this.ends)
            return sibling;
        if (!sibling.ends)
            return this;
        // Check if sibling is actually a sibling of this span
        let found = false;
        let current = this.ends[R].nextSibling;
        while (current) {
            if (current === sibling.ends[L]) {
                found = true;
                break;
            }
            current = current.nextSibling;
        }
        pray('sibling must be a forward DOM sibling of this fragment', found);
        return new DOMFragment(this.ends[L], sibling.ends[R]);
    }
    /**
     * Return the single DOM Node represented by this fragment.
     *
     * Asserts that this fragment contains exactly one Node.
     */
    oneNode() {
        pray('Fragment has a single node', this.ends && this.ends[L] === this.ends[R]);
        return this.ends[L];
    }
    /**
     * Return the single DOM Element represented by this fragment.
     *
     * Asserts that this fragment contains exactly one Node, and that node
     * is an Element node.
     */
    oneElement() {
        const el = this.oneNode();
        pray('Node is an Element', el.nodeType === Node.ELEMENT_NODE);
        return el;
    }
    /**
     * Return the single DOM Text node represented by this fragment.
     *
     * Asserts that this fragment contains exactly one Node, and that node
     * is a Text node.
     */
    oneText() {
        const el = this.oneNode();
        pray('Node is Text', el.nodeType === Node.TEXT_NODE);
        return el;
    }
    /**
     * Calls callback sequentially with each node in this fragment.
     * Includes nodes that are not Elements, such as Text and Comment
     * nodes.
     */
    eachNode(cb) {
        if (!this.ends)
            return this;
        const stop = this.ends[R];
        for (let node = this.ends[L], next; node; node = next) {
            // Note, this loop is organized in a slightly tricky way in order
            // cache "next" before calling the callback. This is done because
            // the callback could mutate node.nextSibling (e.g. by moving the
            // node to a documentFragment, like toDocumentFragment does).
            //
            // It's still possible to break this iteration by messing with
            // forward siblings of node in the callback, although it's
            // probably rare to want to do that. Perhaps this means "each" is
            // too dangerous to have as a public method.
            next = node.nextSibling;
            cb(node);
            if (node === stop)
                break;
        }
        return this;
    }
    /**
     * Calls callback sequentially with each Element node in this
     * fragment. Skips nodes that are not Elements, such as Text and
     * Comment nodes.
     */
    eachElement(cb) {
        this.eachNode((el) => {
            if (el.nodeType === Node.ELEMENT_NODE)
                cb(el);
        });
        return this;
    }
    /**
     * Returns the concatenated text content of all of the nodes in the
     * fragment.
     */
    text() {
        let accum = '';
        this.eachNode((node) => {
            accum += node.textContent || '';
        });
        return accum;
    }
    /**
     * Returns an array of all the Nodes in this fragment, including nodes
     * that are not Element nodes such as Text and Comment nodes;
     */
    toNodeArray() {
        const accum = [];
        this.eachNode((el) => accum.push(el));
        return accum;
    }
    /**
     * Returns an array of all the Element nodes in this fragment. The
     * result does not include nodes that are not Elements, such as Text
     * and Comment nodes.
     */
    toElementArray() {
        const accum = [];
        this.eachElement((el) => accum.push(el));
        return accum;
    }
    /**
     * Moves all of the nodes in this fragment into a new DocumentFragment
     * and returns it. This includes Nodes that are not Elements such as
     * Text and Comment nodes.
     */
    toDocumentFragment() {
        const frag = document.createDocumentFragment();
        this.eachNode((el) => frag.appendChild(el));
        return frag;
    }
    /**
     * Insert all the nodes in this fragment into the DOM directly before
     * the first node of `sibling` fragment. If `sibling` is empty or does
     * not have a parent node, detaches this fragment from the document.
     *
     * Note that this behavior differs from jQuery if `sibling` is a
     * collection with multiple nodes. In that case, jQuery inserts this
     * collection before the first node in `sibling`, and then inserts a
     * clone of this collection before each additional node in the
     * `sibling` collection. DOMFragment only ever inserts this collection
     * before the first node of the sibling fragment, and never inserts
     * additional clones.
     */
    insertBefore(sibling) {
        return this.insDirOf(L, sibling);
    }
    /**
     * Insert all the nodes in this fragment into the DOM directly after
     * the last node of `sibling` fragment. If `sibling` is empty or does
     * not have a parent node, detaches this fragment from the document.
     *
     * Note that this behavior differs from jQuery if `sibling` is a
     * collection with multiple nodes. In that case, jQuery inserts this
     * collection before the first node in `sibling`, and then inserts a
     * clone of this collection before each additional node in the
     * `sibling` collection. DOMFragment only ever inserts this collection
     * before the first node of the sibling fragment, and never inserts
     * additional clones.
     */
    insertAfter(sibling) {
        return this.insDirOf(R, sibling);
    }
    /**
     * Append children to the node represented by this fragment.
     *
     * Asserts that this fragment contains exactly one Element.
     */
    append(children) {
        children.appendTo(this.oneElement());
        return this;
    }
    /**
     * Prepend children to the node represented by this fragment.
     *
     * Asserts that this fragment contains exactly one Element.
     */
    prepend(children) {
        children.prependTo(this.oneElement());
        return this;
    }
    /**
     * Append all the nodes in this fragment to the children of `el`.
     */
    appendTo(el) {
        return this.insAtDirEnd(R, el);
    }
    /**
     * Prepend all the nodes in this fragment to the children of `el`.
     */
    prependTo(el) {
        return this.insAtDirEnd(L, el);
    }
    /**
     * Return a fragment containing the parent node of the nodes in this
     * fragment. Returns an empty fragment if this fragment is empty or
     * does not have a parent node.
     */
    parent() {
        if (!this.ends)
            return this;
        const parent = this.ends[L].parentNode;
        if (!parent)
            return new DOMFragment();
        return new DOMFragment(parent);
    }
    /**
     * Replace the children of `el` with the contents of this fragment,
     * and place `el` into the DOM at the previous location of this
     * fragment.
     */
    wrapAll(el) {
        el.textContent = ''; // First empty the wrapping element
        if (!this.ends)
            return this;
        const parent = this.ends[L].parentNode;
        const next = this.ends[R].nextSibling;
        this.appendTo(el);
        if (parent) {
            parent.insertBefore(el, next);
        }
        return this;
    }
    /**
     * Replace this fragment with the fragment given by `children`. If
     * this fragment is empty or does not have a parent node, detaches
     * `children` from the document.
     *
     * Note that this behavior differs from jQuery if this is a collection
     * with multiple nodes. In that case, jQuery replaces the first
     * element of this collection with `children`, and then replaces each
     * additional element in this collection with a clone of `children`.
     * DOMFragment replaces this entire fragment with `children` and never
     * makes additional clones of `children`.
     */
    replaceWith(children) {
        var _c;
        const rightEnd = (_c = this.ends) === null || _c === void 0 ? void 0 : _c[R];
        // Note: important to cache parent and nextSibling (if they exist)
        // before detaching this fragment from the document (which will
        // mutate its parent and sibling references)
        const parent = rightEnd === null || rightEnd === void 0 ? void 0 : rightEnd.parentNode;
        const nextSibling = rightEnd === null || rightEnd === void 0 ? void 0 : rightEnd.nextSibling;
        this.detach();
        // Note, this purposely detaches children from the document, even if
        // they can't be reinserted because this fragment is empty or has no
        // parent
        const childDocumentFragment = children.toDocumentFragment();
        if (!rightEnd || !parent)
            return this;
        parent.insertBefore(childDocumentFragment, nextSibling || null);
        return this;
    }
    /**
     * Return the nth Element node of this collection, or undefined if
     * there is no nth Element. Skips Nodes that are not Elements (e.g.
     * Text and Comment nodes).
     *
     * Analogous to jQuery's array indexing syntax, or jQuery's .get()
     * with positive arguments.
     */
    nthElement(n) {
        if (!this.ends)
            return undefined;
        if (n < 0 || n !== Math.floor(n))
            return undefined;
        let current = this.ends[L];
        while (current) {
            // Only count element nodes
            if (current.nodeType === Node.ELEMENT_NODE) {
                if (n <= 0)
                    return current;
                n -= 1;
            }
            if (current === this.ends[R])
                return undefined;
            current = current.nextSibling;
        }
        return undefined;
    }
    /**
     * Return the first Element node of this fragment, or undefined if
     * the fragment is empty. Skips Nodes that are not Elements (e.g.
     * Text and Comment nodes).
     */
    firstElement() {
        return this.nthElement(0);
    }
    /**
     * Return the last Element node of this fragment, or undefined if
     * the fragment is empty. Skips Nodes that are not Elements (e.g.
     * Text and Comment nodes).
     */
    lastElement() {
        if (!this.ends)
            return undefined;
        let current = this.ends[R];
        while (current) {
            // Only count element nodes
            if (current.nodeType === Node.ELEMENT_NODE) {
                return current;
            }
            if (current === this.ends[L])
                return undefined;
            current = current.previousSibling;
        }
        return undefined;
    }
    /**
     * Return a new fragment holding the first Element node of this
     * fragment, or an empty fragment if this fragment is empty. Skips
     * Nodes that are not Elements (e.g. Text and Comment nodes).
     */
    first() {
        return new DOMFragment(this.firstElement());
    }
    /**
     * Return a new fragment holding the last Element node of this
     * fragment, or an empty fragment if this fragment is empty. Skips
     * Nodes that are not Elements (e.g. Text and Comment nodes).
     */
    last() {
        return new DOMFragment(this.lastElement());
    }
    /**
     * Return a new fragment holding the nth Element node of this
     * fragment, or an empty fragment if there is no nth node of this
     * fragment. Skips Nodes that are not Elements (e.g. Text and Comment
     * nodes).
     */
    eq(n) {
        return new DOMFragment(this.nthElement(n));
    }
    /**
     * Return a new fragment beginning with the nth Element node of this
     * fragment, and ending with the same end as this fragment, or an
     * empty fragment if there is no nth node in this fragment. Skips
     * Nodes that are not Elements (e.g. Text and Comment nodes).
     */
    slice(n) {
        // Note, would be reasonable to extend this to take a second
        // argument if we ever find we need this
        if (!this.ends)
            return this;
        const el = this.nthElement(n);
        if (!el)
            return new DOMFragment();
        return new DOMFragment(el, this.ends[R]);
    }
    /**
     * Return a new fragment containing the next Element after the Node
     * represented by this fragment, or an empty fragment if there is no
     * next Element. Skips Nodes that are not Elements (e.g. Text and
     * Comment nodes).
     *
     * Asserts that this fragment contains exactly one Node.
     */
    next() {
        let current = this.oneNode();
        while (current) {
            current = current.nextSibling;
            if (current && current.nodeType === Node.ELEMENT_NODE)
                return new DOMFragment(current);
        }
        return new DOMFragment();
    }
    /**
     * Return a new fragment containing the previousElement after the Node
     * represented by this fragment, or an empty fragment if there is no
     * previous Element. Skips Nodes that are not Elements (e.g. Text and
     * Comment nodes).
     *
     * Asserts that this fragment contains exactly one Node.
     */
    prev() {
        let current = this.oneNode();
        while (current) {
            current = current.previousSibling;
            if (current && current.nodeType === Node.ELEMENT_NODE)
                return new DOMFragment(current);
        }
        return new DOMFragment();
    }
    /**
     * Remove all children of every Element Node in the fragment. Skips
     * Nodes that are not Elements (e.g. Text and Comment nodes).
     */
    empty() {
        // TODO the corresponding jQuery methods clean up some internal
        // references before removing elements from the DOM. That won't
        // matter once jQuery is totally gone, but until then, this may
        // introduce memory leaks
        this.eachElement((el) => {
            el.textContent = '';
        });
        return this;
    }
    /**
     * Remove every node in the fragment from the DOM.
     *
     * Implemented by moving every node in the fragment into a new
     * document fragment in order to preserve the sibling relationships
     * of the removed element. If you want to get access to this document
     * fragment, use `.toDocumentFragment()` instead.
     */
    remove() {
        // TODO the corresponding jQuery methods clean up some internal
        // references before removing elements from the DOM. That won't
        // matter once jQuery is totally gone, but until then, this may
        // introduce memory leaks
        // Note, removing the elements by moving them to a document fragment
        // because this way their sibling references stay intact. This is
        // important if we want to reattach them somewhere else later
        this.toDocumentFragment();
        return this;
    }
    /**
     * Remove every node in the fragment from the DOM. Alias of remove.
     *
     * Implemented by moving every node in the fragment into a new
     * document fragment in order to preserve the sibling relationships
     * of the removed element. If you want to get access to this document
     * fragment, use `.toDocumentFragment()` instead.
     *
     * Note: jQuery makes a distinction between detach() and remove().
     * remove() cleans up internal references, and detach() does not.
     */
    detach() {
        // In jQuery, detach() is similar to remove() but it does not clean
        // up internal references. Here they're aliases, but I'm leaving
        // this as a separate method for the moment to keep track of where
        // mathquill did one vs the other.
        return this.remove();
    }
    /**
     * Insert this fragment either just before or just after `sibling`
     * fragment according to the direction specified by `dir`. If
     * `sibling` is empty or does not have a parent node, detaches this
     * fragment from the document.
     */
    insDirOf(dir, sibling) {
        var _c;
        if (!this.ends)
            return this;
        const el = (_c = sibling.ends) === null || _c === void 0 ? void 0 : _c[dir];
        if (!el || !el.parentNode)
            return this.detach();
        _insDirOf(dir, el.parentNode, this.toDocumentFragment(), el);
        return this;
    }
    /**
     * Insert this fragment into `el` either at the beginning or end of
     * its children, according to the direction specified by `dir`.
     */
    insAtDirEnd(dir, el) {
        if (!this.ends)
            return this;
        _insAtDirEnd(dir, this.toDocumentFragment(), el);
        return this;
    }
    /**
     * Return true if any element in this fragment has class `className`
     * and false otherwise.
     */
    hasClass(className) {
        let out = false;
        this.eachElement((el) => {
            if (el.classList.contains(className))
                out = true;
        });
        return out;
    }
    /**
     * Add each class in space separated list of classes given by
     * `classNames` to each element in this fragment.
     */
    addClass(classNames) {
        for (const className of classNames.split(/\s+/)) {
            if (!className)
                continue;
            this.eachElement((el) => {
                el.classList.add(className);
            });
        }
        return this;
    }
    /**
     * Remove each class in space separated list of classes given by
     * `classNames` from each element in this fragment.
     */
    removeClass(classNames) {
        for (const className of classNames.split(/\s+/)) {
            if (!className)
                continue;
            this.eachElement((el) => {
                el.classList.remove(className);
            });
        }
        return this;
    }
    /**
     * Toggle each class in space separated list of classes given by
     * `classNames` on each element in this fragment.
     *
     * If second arg `on` is given as `true`, always toggle classes on.
     * If second arg `on` is passed as `false`, always toggle classes off.
     */
    toggleClass(classNames, on) {
        if (on === true)
            return this.addClass(classNames);
        if (on === false)
            return this.removeClass(classNames);
        for (const className of classNames.split(/\s+/)) {
            if (!className)
                continue;
            this.eachElement((el) => {
                el.classList.toggle(className);
            });
        }
        return this;
    }
}
const domFrag = DOMFragment.create;
/**
 * Insert `source` before or after `target` child of `parent` denending
 * on `dir`. Only intended to be used internally as a helper in this module
 */
function _insDirOf(dir, parent, source, target) {
    parent.insertBefore(source, dir === L ? target : target.nextSibling);
}
/**
 * Insert `source` before or after `target` child of `parent` denending
 * on `dir`. Only intended to be used internally as a helper in this module
 */
function _insAtDirEnd(dir, source, parent) {
    if (dir === L) {
        parent.insertBefore(source, parent.firstChild);
    }
    else {
        parent.appendChild(source);
    }
}
/*************************************************
 * Base classes of edit tree-related objects
 *
 * Only doing tree node manipulation via these
 * adopt/ disown methods guarantees well-formedness
 * of the tree.
 ************************************************/
/** A cursor-like location in an mq node tree. */
class Point {
    constructor(parent, leftward, rightward) {
        this.init(parent, leftward, rightward);
    }
    // keeping init around only for tests
    init(parent, leftward, rightward) {
        this.parent = parent;
        this[L] = leftward;
        this[R] = rightward;
    }
    static copy(pt) {
        return new Point(pt.parent, pt[L], pt[R]);
    }
}
function eachNode(ends, yield_) {
    var el = ends[L];
    if (!el)
        return;
    var stop = ends[R];
    if (!stop)
        return; //shouldn't happen because ends[L] is defined;
    stop = stop[R];
    // TODO - this cast as MQNode is actually important to keep tests passing. I went to
    // fix this code to gracefully handle an undefined el and there are tests that actually
    // verify that this will throw an error. So I'm keeping the behavior but ignoring the
    // type error.
    for (; el !== stop; el = el[R]) {
        var result = yield_(el); // TODO - might be passing in 0 intead of a MQNode, but tests want this
        if (result === false)
            break;
    }
}
function foldNodes(ends, fold, yield_) {
    var el = ends[L];
    if (!el)
        return fold;
    var stop = ends[R];
    if (!stop)
        return fold; //shouldn't happen because ends[L] is defined;
    stop = stop[R];
    // TODO - this cast as MQNode is actually important to keep tests passing. I went to
    // fix this code to gracefully handle an undefined el and there are tests that actually
    // verify that this will throw an error. So I'm keeping the behavior but ignoring the
    // type error.
    for (; el !== stop; el = el[R]) {
        fold = yield_(fold, el); // TODO - might be passing in 0 intead of a MQNode, but tests want this
    }
    return fold;
}
class NodeBase {
    constructor() {
        // TODO - life would be so much better in typescript of these were undefined instead of
        // 0. The ! would save us in cases where we know a node is defined.
        this[_a] = 0;
        this[_b] = 0;
        // TODO - can this ever actually stay 0? if so we need to add null checks
        this.parent = 0;
        /**
         * The (doubly-linked) list of this node's children.
         *
         * NOTE child classes may specify a narrower type for ends e.g. to
         * enforce that children are not empty, or that they have a certain
         * type. In those cases, this initializer may still run at
         * construction time, but this is expected to be followed by a call
         * to adopt that sets non-empty ends of the necessary types.
         *
         * Similarly, `Fragment::disown` may temporarily break non-empty
         * invariants, which are expected to be restored by a subsequent call
         * to `Fragment::adopt`.
         * */
        this.ends = { [L]: 0, [R]: 0 };
        this.id = NodeBase.uniqueNodeId();
    }
    static uniqueNodeId() {
        return (NodeBase.idCounter += 1);
    }
    // The mqBlockNode and mqCmdNode custom properties link back from the
    // DOM nodes generated by MathQuill to the MQNodes that generated
    // them. This is useful for looking up MQNodes in event handlers and
    // in the mq(elt) public API method
    static getNodeOfElement(el) {
        if (!el)
            return;
        if (!el.nodeType)
            throw new Error('must pass an Element to NodeBase.getNodeOfElement');
        var elTrackingNode = el;
        return elTrackingNode.mqBlockNode || elTrackingNode.mqCmdNode;
    }
    static linkElementByBlockNode(elm, blockNode) {
        elm.mqBlockNode = blockNode;
    }
    static linkElementByCmdNode(elm, cmdNode) {
        elm.mqCmdNode = cmdNode;
    }
    setEnds(ends) {
        this.ends = ends;
        pray('No half-empty node ends', !!this.ends[L] === !!this.ends[R]);
    }
    getEnd(dir) {
        return this.ends[dir];
    }
    toString() {
        return '{{ MathQuill Node #' + this.id + ' }}';
    }
    setDOM(el) {
        if (el) {
            pray('DOM is an element or a text node', el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE);
        }
        this._el = el;
        return this;
    }
    domFrag() {
        return domFrag(this._el);
    }
    createDir(dir, cursor) {
        prayDirection(dir);
        var node = this;
        node.html();
        node.domFrag().insDirOf(dir, cursor.domFrag());
        cursor[dir] = node.adopt(cursor.parent, cursor[L], cursor[R]); // TODO - assuming not undefined, could be 0
        return node;
    }
    createLeftOf(cursor) {
        this.createDir(L, cursor);
    }
    selectChildren(leftEnd, rightEnd) {
        return new MQSelection(leftEnd, rightEnd);
    }
    bubble(yield_) {
        var self = this.getSelfNode();
        for (var ancestor = self; ancestor; ancestor = ancestor.parent) {
            var result = yield_(ancestor);
            if (result === false)
                break;
        }
        return this;
    }
    postOrder(yield_) {
        var self = this.getSelfNode();
        (function recurse(descendant) {
            if (!descendant)
                return false;
            descendant.eachChild(recurse);
            yield_(descendant);
            return true;
        })(self);
        return self;
    }
    isEmpty() {
        return this.ends[L] === 0 && this.ends[R] === 0;
    }
    isQuietEmptyDelimiter(dlms) {
        if (!this.isEmpty())
            return false;
        if (!dlms)
            return false;
        if (!this.parent || this.parent.ctrlSeq === undefined)
            return false;
        // Remove any leading \left or \right from the ctrl sequence before looking it up.
        var key = this.parent.ctrlSeq.replace(/^\\(left|right)?/, '');
        return dlms.hasOwnProperty(key);
    }
    isStyleBlock() {
        return false;
    }
    isTextBlock() {
        return false;
    }
    children() {
        return new Fragment(this.getEnd(L), this.getEnd(R));
    }
    eachChild(yield_) {
        eachNode(this.ends, yield_);
        return this;
    }
    foldChildren(fold, yield_) {
        return foldNodes(this.ends, fold, yield_);
    }
    withDirAdopt(dir, parent, withDir, oppDir) {
        const self = this.getSelfNode();
        new Fragment(self, self).withDirAdopt(dir, parent, withDir, oppDir);
        return this;
    }
    /**
     * Add this node to the given parent node's children, at the position between the adjacent
     * children `leftward` (or the beginning if omitted) and `rightward` (or the end if omitted).
     * See `Fragment#adopt()`
     */
    adopt(parent, leftward, rightward) {
        var self = this.getSelfNode();
        new Fragment(self, self).adopt(parent, leftward, rightward);
        return this.getSelfNode();
    }
    disown() {
        var self = this.getSelfNode();
        new Fragment(self, self).disown();
        return this;
    }
    remove() {
        this.domFrag().remove();
        return this.disown();
    }
    shouldIgnoreSubstitutionInSimpleSubscript(options) {
        if (!options.disableAutoSubstitutionInSubscripts)
            return false;
        if (!this.parent)
            return false;
        if (!(this.parent.parent instanceof SupSub))
            return false;
        // Mathquill is gross. There are many different paths that
        // create subscripts and sometimes we don't even construct
        // true instances of `LatexCmds._`. Another problem is that
        // the relationship between the sub and the SupSub isn't
        // completely setup during a paste at the time we check
        // this. I wanted to use: `this.parent.parent.sub !== this.parent`
        // but that check doesn't always work. This seems to be the only
        // check that always works. I'd rather live with this than try
        // to change the init order of things.
        if (!this.parent.domFrag().hasClass('mq-sub'))
            return false;
        return true;
    }
    getSelfNode() {
        // dumb dance to tell typescript that we eventually become a MQNode
        return this;
    }
    // Overridden by child classes
    parser() {
        pray('Abstract parser() method is never called', false);
    }
    /** Render this node to DOM */
    html() {
        throw new Error('html() unimplemented in NodeBase');
    }
    text() {
        return '';
    }
    latex() {
        let ctx = { latex: '', startIndex: -1, endIndex: -1 };
        this.latexRecursive(ctx);
        return ctx.latex;
    }
    latexRecursive(_ctx) { }
    checkCursorContextOpen(ctx) {
        if (ctx.startSelectionBefore === this) {
            ctx.startIndex = ctx.latex.length;
        }
        if (ctx.endSelectionBefore === this) {
            ctx.endIndex = ctx.latex.length;
        }
    }
    checkCursorContextClose(ctx) {
        if (ctx.startSelectionAfter === this) {
            ctx.startIndex = ctx.latex.length;
        }
        if (ctx.endSelectionAfter === this) {
            ctx.endIndex = ctx.latex.length;
        }
    }
    finalizeTree(_options, _dir) { }
    contactWeld(_cursor, _dir) { }
    blur(_cursor) { }
    focus() { }
    intentionalBlur() { }
    reflow() { }
    registerInnerField(_innerFields, _mathField) { }
    chToCmd(_ch, _options) {
        pray('Abstract chToCmd() method is never called', false);
    }
    mathspeak(_options) {
        return '';
    }
    seek(_clientX, _cursor) { }
    siblingDeleted(_options, _dir) { }
    siblingCreated(_options, _dir) { }
    finalizeInsert(_options, _cursor) { }
    fixDigitGrouping(_opts) { }
    writeLatex(_cursor, _latex) { }
    write(_cursor, _ch) { }
}
_a = L, _b = R;
NodeBase.idCounter = 0;
function prayWellFormed(parent, leftward, rightward) {
    pray('a parent is always present', parent);
    pray('leftward is properly set up', (function () {
        // either it's empty and `rightward` is the left end child (possibly empty)
        if (!leftward)
            return parent.getEnd(L) === rightward;
        // or it's there and its [R] and .parent are properly set up
        return leftward[R] === rightward && leftward.parent === parent;
    })(), {
        parent: parent,
        leftward: leftward,
        leftwardL: leftward && leftward[L],
        leftwardR: leftward && leftward[R],
        rightwardL: rightward && rightward[L],
        rightwardR: rightward && rightward[R],
    });
    pray('rightward is properly set up', (function () {
        // either it's empty and `leftward` is the right end child (possibly empty)
        if (!rightward)
            return parent.getEnd(R) === leftward;
        // or it's there and its [L] and .parent are properly set up
        return rightward[L] === leftward && rightward.parent === parent;
    })(), {
        parent: parent,
        rightward: rightward,
        leftwardL: leftward && leftward[L],
        leftwardR: leftward && leftward[R],
        rightwardL: rightward && rightward[L],
        rightwardR: rightward && rightward[R],
        rightwardParent: rightward && rightward.parent,
    });
}
/**
 * An entity outside the virtual tree with one-way pointers (so it's only a
 * "view" of part of the tree, not an actual node/entity in the tree) that
 * delimits a doubly-linked list of sibling nodes.
 * It's like a fanfic love-child between HTML DOM DocumentFragment and the Range
 * classes: like DocumentFragment, its contents must be sibling nodes
 * (unlike Range, whose contents are arbitrary contiguous pieces of subtrees),
 * but like Range, it has only one-way pointers to its contents, its contents
 * have no reference to it and in fact may still be in the visible tree (unlike
 * DocumentFragment, whose contents must be detached from the visible tree
 * and have their 'parent' pointers set to the DocumentFragment).
 */
class Fragment {
    constructor(withDir, oppDir, dir) {
        this.disowned = false;
        if (dir === undefined)
            dir = L;
        prayDirection(dir);
        pray('no half-empty fragments', !withDir === !oppDir, {
            withDir,
            oppDir,
        });
        if (!withDir || !oppDir) {
            this.setEnds({ [L]: 0, [R]: 0 });
            return;
        }
        pray('withDir is passed to Fragment', withDir instanceof MQNode);
        pray('oppDir is passed to Fragment', oppDir instanceof MQNode);
        pray('withDir and oppDir have the same parent', withDir.parent === oppDir.parent);
        const ends = {
            [dir]: withDir,
            [-dir]: oppDir,
        };
        this.setEnds(ends);
        let maybeRightEnd = 0;
        this.each((el) => {
            maybeRightEnd = el;
        });
        pray('following direction siblings from start reaches end', maybeRightEnd === ends[R]);
    }
    getDOMFragFromEnds() {
        const left = this.ends[L];
        const right = this.ends[R];
        if (left === 0 || right === 0) {
            return domFrag();
        }
        else if (left === right) {
            // Note, joining a DOMFragment to itself is not allowed, so
            // don't attempt to join the end fragments if the ends are equal
            return left.domFrag();
        }
        else {
            return left.domFrag().join(right.domFrag());
        }
    }
    /**
     * Note, children may override this to enforce extra invariants,
     * (e.g. that ends are always defined). Ends should only be set
     * through this function.
     */
    setEnds(ends) {
        this.ends = ends;
    }
    getEnd(dir) {
        return this.ends ? this.ends[dir] : 0;
    }
    domFrag() {
        return this.getDOMFragFromEnds();
    }
    // like Cursor::withDirInsertAt(dir, parent, withDir, oppDir)
    withDirAdopt(dir, parent, withDir, oppDir) {
        return dir === L
            ? this.adopt(parent, withDir, oppDir)
            : this.adopt(parent, oppDir, withDir);
    }
    /**
     * Splice this fragment into the given parent node's children, at the position between the adjacent
     * children `leftward` (or the beginning if omitted) and `rightward` (or the end if omitted).
     *
     * TODO: why do we need both leftward and rightward? It seems to me that `rightward` is always expected to be `leftward ? leftward[R] : parent.ends[L]`.
     */
    adopt(parent, leftward, rightward) {
        prayWellFormed(parent, leftward, rightward);
        var self = this;
        this.disowned = false;
        var leftEnd = self.ends[L];
        if (!leftEnd)
            return this;
        var rightEnd = self.ends[R];
        if (!rightEnd)
            return this;
        var ends = { [L]: parent.getEnd(L), [R]: parent.getEnd(R) };
        if (leftward) {
            // NB: this is handled in the ::each() block
            // leftward[R] = leftEnd
        }
        else {
            ends[L] = leftEnd;
        }
        if (rightward) {
            rightward[L] = rightEnd;
        }
        else {
            ends[R] = rightEnd;
        }
        parent.setEnds(ends);
        rightEnd[R] = rightward;
        self.each(function (el) {
            el[L] = leftward;
            el.parent = parent;
            if (leftward)
                leftward[R] = el;
            leftward = el;
            return true;
        });
        return self;
    }
    /**
     * Remove the nodes in this fragment from their parent.
     */
    disown() {
        var self = this;
        var leftEnd = self.ends[L];
        // guard for empty and already-disowned fragments
        if (!leftEnd || self.disowned)
            return self;
        this.disowned = true;
        var rightEnd = self.ends[R];
        if (!rightEnd)
            return self;
        var parent = leftEnd.parent;
        prayWellFormed(parent, leftEnd[L], leftEnd);
        prayWellFormed(parent, rightEnd, rightEnd[R]);
        var ends = { [L]: parent.getEnd(L), [R]: parent.getEnd(R) };
        if (leftEnd[L]) {
            var leftLeftEnd = leftEnd[L];
            leftLeftEnd[R] = rightEnd[R];
        }
        else {
            ends[L] = rightEnd[R];
        }
        if (rightEnd[R]) {
            var rightRightEnd = rightEnd[R];
            rightRightEnd[L] = leftEnd[L];
        }
        else {
            ends[R] = leftEnd[L];
        }
        if (ends[L] && ends[R]) {
            parent.setEnds(ends);
        }
        else {
            // some child classes of MQNode try to enforce that their ends
            // are never empty through the type system. However, disown may
            // temporarily break this invariant in which case it's expected
            // that adopt will later be called to fix the invariant.
            //
            // Cast away the protected status of the ends property and write
            // to it directly to get around runtime assertions in setEnds that
            // enforce non-emptyness.
            parent.ends = ends;
        }
        return self;
    }
    remove() {
        this.domFrag().remove();
        return this.disown();
    }
    each(yield_) {
        eachNode(this.ends, yield_);
        return this;
    }
    fold(fold, yield_) {
        return foldNodes(this.ends, fold, yield_);
    }
}
/**
 * Registry of LaTeX commands and commands created when typing
 * a single character.
 *
 * (Commands are all subclasses of Node.)
 */
var LatexCmds = {};
var CharCmds = {};
function isMQNodeClass(cmd) {
    return cmd && cmd.prototype instanceof MQNode;
}
/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/
/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */
/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */
//A fake cursor in the fake textbox that the math is rendered in.
class Anticursor extends Point {
    constructor(parent, leftward, rightward) {
        super(parent, leftward, rightward);
        this.ancestors = {};
    }
    static fromCursor(cursor) {
        return new Anticursor(cursor.parent, cursor[L], cursor[R]);
    }
}
class Cursor extends Point {
    constructor(initParent, options, controller) {
        super(initParent, 0, 0);
        /** Slightly more than just a "cache", this remembers the cursor's position in each block node, so that we can return to the right
         * point in that node when moving up and down among blocks.
         */
        this.upDownCache = {};
        this.cursorElement = h('span', { class: 'mq-cursor' }, [h.text(U_ZERO_WIDTH_SPACE)]);
        this._domFrag = domFrag();
        this.controller = controller;
        this.options = options;
        this.setDOMFrag(domFrag(this.cursorElement));
        //closured for setInterval
        this.blink = () => {
            domFrag(this.cursorElement).toggleClass('mq-blink');
        };
    }
    setDOMFrag(frag) {
        this._domFrag = frag;
        return this;
    }
    domFrag() {
        return this._domFrag;
    }
    show() {
        domFrag(this.cursorElement).removeClass('mq-blink');
        this.setDOMFrag(domFrag(this.cursorElement));
        if (this.intervalId)
            //already was shown, just restart interval
            clearInterval(this.intervalId);
        else {
            //was hidden and detached, insert this.jQ back into HTML DOM
            const right = this[R];
            if (right) {
                var selection = this.selection;
                if (selection && selection.getEnd(L)[L] === this[L])
                    this.domFrag().insertBefore(selection.domFrag());
                else
                    this.domFrag().insertBefore(right.domFrag());
            }
            else
                this.domFrag().appendTo(this.parent.domFrag().oneElement());
            this.parent.focus();
        }
        this.intervalId = setInterval(this.blink, 500);
        return this;
    }
    hide() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = 0;
        this.domFrag().detach();
        this.setDOMFrag(domFrag());
        return this;
    }
    withDirInsertAt(dir, parent, withDir, oppDir) {
        var oldParent = this.parent;
        this.parent = parent;
        this[dir] = withDir;
        this[-dir] = oppDir;
        // by contract, .blur() is called after all has been said and done
        // and the cursor has actually been moved
        // FIXME pass cursor to .blur() so text can fix cursor pointers when removing itself
        if (oldParent !== parent && oldParent.blur)
            oldParent.blur(this);
    }
    /** Place the cursor before or after `el`, according the side specified by `dir`. */
    insDirOf(dir, el) {
        prayDirection(dir);
        this.domFrag().insDirOf(dir, el.domFrag());
        this.withDirInsertAt(dir, el.parent, el[dir], el);
        this.parent.domFrag().addClass('mq-hasCursor');
        return this;
    }
    insLeftOf(el) {
        return this.insDirOf(L, el);
    }
    insRightOf(el) {
        return this.insDirOf(R, el);
    }
    /** Place the cursor inside `el` at either the left or right end, according the side specified by `dir`. */
    insAtDirEnd(dir, el) {
        prayDirection(dir);
        this.domFrag().insAtDirEnd(dir, el.domFrag().oneElement());
        this.withDirInsertAt(dir, el, 0, el.getEnd(dir));
        el.focus();
        return this;
    }
    insAtLeftEnd(el) {
        return this.insAtDirEnd(L, el);
    }
    insAtRightEnd(el) {
        return this.insAtDirEnd(R, el);
    }
    /**
     * jump up or down from one block Node to another:
     * - cache the current Point in the node we're jumping from
     * - check if there's a Point in it cached for the node we're jumping to
     *   + if so put the cursor there,
     *   + if not seek a position in the node that is horizontally closest to
     *     the cursor's current position
     */
    jumpUpDown(from, to) {
        var self = this;
        self.upDownCache[from.id] = Point.copy(self);
        var cached = self.upDownCache[to.id];
        if (cached) {
            var cachedR = cached[R];
            if (cachedR) {
                self.insLeftOf(cachedR);
            }
            else {
                self.insAtRightEnd(cached.parent);
            }
        }
        else {
            var clientX = self.getBoundingClientRectWithoutMargin().left;
            to.seek(clientX, self);
        }
        self.controller.aria.queue(to, true);
    }
    getBoundingClientRectWithoutMargin() {
        //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
        //returns all 0's on inline elements with negative margin-right (like
        //the cursor) at the end of their parent, so temporarily remove the
        //negative margin-right when calling jQuery::offset()
        //Opera bug DSK-360043
        //http://bugs.jquery.com/ticket/11523
        //https://github.com/jquery/jquery/pull/717
        const frag = this.domFrag();
        frag.removeClass('mq-cursor');
        const { left, right } = getBoundingClientRect(frag.oneElement());
        frag.addClass('mq-cursor');
        return {
            left,
            right,
        };
    }
    unwrapGramp() {
        var gramp = this.parent.parent;
        var greatgramp = gramp.parent;
        var rightward = gramp[R];
        var cursor = this;
        var leftward = gramp[L];
        gramp.disown().eachChild(function (uncle) {
            if (uncle.isEmpty())
                return true;
            uncle
                .children()
                .adopt(greatgramp, leftward, rightward)
                .each(function (cousin) {
                cousin.domFrag().insertBefore(gramp.domFrag());
                return true;
            });
            leftward = uncle.getEnd(R);
            return true;
        });
        if (!this[R]) {
            //then find something to be rightward to insLeftOf
            var thisL = this[L];
            if (thisL)
                this[R] = thisL[R];
            else {
                while (!this[R]) {
                    var newParent = this.parent[R];
                    if (newParent) {
                        this.parent = newParent;
                        this[R] = newParent.getEnd(L);
                    }
                    else {
                        this[R] = gramp[R];
                        this.parent = greatgramp;
                        break;
                    }
                }
            }
        }
        var thisR = this[R];
        if (thisR)
            this.insLeftOf(thisR);
        else
            this.insAtRightEnd(greatgramp);
        gramp.domFrag().remove();
        var grampL = gramp[L];
        var grampR = gramp[R];
        if (grampL)
            grampL.siblingDeleted(cursor.options, R);
        if (grampR)
            grampR.siblingDeleted(cursor.options, L);
    }
    startSelection() {
        var anticursor = (this.anticursor = Anticursor.fromCursor(this));
        var ancestors = anticursor.ancestors;
        for (var ancestor = anticursor; ancestor.parent; ancestor = ancestor.parent) {
            ancestors[ancestor.parent.id] = ancestor;
        }
    }
    endSelection() {
        delete this.anticursor;
    }
    select() {
        var _lca;
        var anticursor = this.anticursor;
        if (this[L] === anticursor[L] && this.parent === anticursor.parent)
            return false;
        // Find the lowest common ancestor (`lca`), and the ancestor of the cursor
        // whose parent is the LCA (which'll be an end of the selection fragment).
        for (var ancestor = this; ancestor.parent; ancestor = ancestor.parent) {
            if (ancestor.parent.id in anticursor.ancestors) {
                _lca = ancestor.parent;
                break;
            }
        }
        pray('cursor and anticursor in the same tree', _lca);
        var lca = _lca;
        // The cursor and the anticursor should be in the same tree, because the
        // mousemove handler attached to the document, unlike the one attached to
        // the root HTML DOM element, doesn't try to get the math tree node of the
        // mousemove target, and Cursor::seek() based solely on coordinates stays
        // within the tree of `this` cursor's root.
        // The other end of the selection fragment, the ancestor of the anticursor
        // whose parent is the LCA.
        var antiAncestor = anticursor.ancestors[lca.id];
        // Now we have two either Nodes or Points, guaranteed to have a common
        // parent and guaranteed that if both are Points, they are not the same,
        // and we have to figure out which is the left end and which the right end
        // of the selection.
        var leftEnd, rightEnd, dir = R;
        // This is an extremely subtle algorithm.
        // As a special case, `ancestor` could be a Point and `antiAncestor` a Node
        // immediately to `ancestor`'s left.
        // In all other cases,
        // - both Nodes
        // - `ancestor` a Point and `antiAncestor` a Node
        // - `ancestor` a Node and `antiAncestor` a Point
        // `antiAncestor[R] === rightward[R]` for some `rightward` that is
        // `ancestor` or to its right, if and only if `antiAncestor` is to
        // the right of `ancestor`.
        if (ancestor[L] !== antiAncestor) {
            for (var rightward = ancestor; rightward; rightward = rightward[R]) {
                if (rightward[R] === antiAncestor[R]) {
                    dir = L;
                    leftEnd = ancestor;
                    rightEnd = antiAncestor;
                    break;
                }
            }
        }
        if (dir === R) {
            leftEnd = antiAncestor;
            rightEnd = ancestor;
        }
        // only want to select Nodes up to Points, can't select Points themselves
        if (leftEnd instanceof Point)
            leftEnd = leftEnd[R];
        if (rightEnd instanceof Point)
            rightEnd = rightEnd[L];
        this.hide().selection = lca.selectChildren(leftEnd, rightEnd);
        var insEl = this.selection.getEnd(dir);
        this.insDirOf(dir, insEl);
        this.selectionChanged();
        return true;
    }
    resetToEnd(controller) {
        this.clearSelection();
        var root = controller.root;
        this[R] = 0;
        this[L] = root.getEnd(R);
        this.parent = root;
    }
    clearSelection() {
        if (this.selection) {
            this.selection.clear();
            delete this.selection;
            this.selectionChanged();
        }
        return this;
    }
    deleteSelection() {
        var selection = this.selection;
        if (!selection)
            return;
        this[L] = selection.getEnd(L)[L];
        this[R] = selection.getEnd(R)[R];
        selection.remove();
        this.selectionChanged();
        delete this.selection;
    }
    replaceSelection() {
        var seln = this.selection;
        if (seln) {
            this[L] = seln.getEnd(L)[L];
            this[R] = seln.getEnd(R)[R];
            delete this.selection;
        }
        return seln;
    }
    depth() {
        var node = this;
        var depth = 0;
        while ((node = node.parent)) {
            depth += node instanceof MathBlock ? 1 : 0;
        }
        return depth;
    }
    isTooDeep(offset) {
        if (this.options.maxDepth !== undefined) {
            return this.depth() + (offset || 0) > this.options.maxDepth;
        }
        else {
            return false;
        }
    }
    // can be overridden
    selectionChanged() { }
}
class MQSelection extends Fragment {
    constructor(withDir, oppDir, dir) {
        super(withDir, oppDir, dir);
        this._el = h('span', { class: 'mq-selection' });
        this.getDOMFragFromEnds().wrapAll(this._el);
    }
    isCleared() {
        return this._el === undefined;
    }
    domFrag() {
        return this.isCleared() ? this.getDOMFragFromEnds() : domFrag(this._el);
    }
    setEnds(ends) {
        pray('Selection ends are never empty', ends[L] && ends[R]);
        this.ends = ends;
    }
    getEnd(dir) {
        return this.ends[dir];
    }
    adopt(parent, leftward, rightward) {
        this.clear();
        return super.adopt(parent, leftward, rightward);
    }
    clear() {
        // NOTE it's important here that DOMFragment::children includes all
        // child nodes (including Text nodes), and not just Element nodes.
        // This makes it more similar to the native DOM childNodes property
        // and jQuery's .collection() method than jQuery's .children() method
        const childFrag = this.getDOMFragFromEnds();
        this.domFrag().replaceWith(childFrag);
        this._el = undefined;
        return this;
    }
    join(methodName, separator = '') {
        return this.fold('', function (fold, child) {
            return fold + separator + child[methodName]();
        });
    }
}
class ControllerBase {
    constructor(root, container, options) {
        this.textareaEventListeners = {};
        this.id = root.id;
        this.data = {};
        this.root = root;
        this.container = container;
        this.options = options;
        this.aria = new Aria(this.getControllerSelf());
        this.ariaLabel = 'Math Input';
        this.ariaPostLabel = '';
        root.controller = this.getControllerSelf();
        this.cursor = root.cursor = new Cursor(root, options, this.getControllerSelf());
        // TODO: stop depending on root.cursor, and rm it
    }
    getControllerSelf() {
        // dance we have to do to tell this thing it's a full controller
        return this;
    }
    handle(name, dir) {
        var _c;
        var handlers = this.options.handlers;
        const handler = (_c = this.options.handlers) === null || _c === void 0 ? void 0 : _c.fns[name];
        if (handler) {
            const APIClass = handlers === null || handlers === void 0 ? void 0 : handlers.APIClasses[this.KIND_OF_MQ];
            pray('APIClass is defined', APIClass);
            var mq = new APIClass(this); // cast to any bedcause APIClass needs the final Controller subclass.
            if (dir === L || dir === R)
                handler(dir, mq);
            else
                handler(mq);
        }
    }
    static onNotify(f) {
        ControllerBase.notifyees.push(f);
    }
    notify(e) {
        for (var i = 0; i < ControllerBase.notifyees.length; i += 1) {
            ControllerBase.notifyees[i](this.cursor, e);
        }
        return this;
    }
    setAriaLabel(ariaLabel) {
        var oldAriaLabel = this.getAriaLabel();
        if (ariaLabel && typeof ariaLabel === 'string' && ariaLabel !== '') {
            this.ariaLabel = ariaLabel;
        }
        else if (this.editable) {
            this.ariaLabel = 'Math Input';
        }
        else {
            this.ariaLabel = '';
        }
        // If this field doesn't have focus, update its computed mathspeak value.
        // We check for focus because updating the aria-label attribute of a focused element will cause most screen readers to announce the new value (in our case, label along with the expression's mathspeak).
        // If the field does have focus at the time, it will be updated once a blur event occurs.
        // Unless we stop using fake text inputs and emulating screen reader behavior, this is going to remain a problem.
        if (this.ariaLabel !== oldAriaLabel && !this.containerHasFocus()) {
            this.updateMathspeak();
        }
        return this;
    }
    getAriaLabel() {
        if (this.ariaLabel !== 'Math Input') {
            return this.ariaLabel;
        }
        else if (this.editable) {
            return 'Math Input';
        }
        else {
            return '';
        }
    }
    setAriaPostLabel(ariaPostLabel, timeout) {
        if (ariaPostLabel &&
            typeof ariaPostLabel === 'string' &&
            ariaPostLabel !== '') {
            if (ariaPostLabel !== this.ariaPostLabel && typeof timeout === 'number') {
                if (this._ariaAlertTimeout)
                    clearTimeout(this._ariaAlertTimeout);
                this._ariaAlertTimeout = setTimeout(() => {
                    if (this.containerHasFocus()) {
                        // Voice the new label, but do not update content mathspeak to prevent double-speech.
                        this.aria.alert(this.root.mathspeak().trim() + ' ' + ariaPostLabel.trim());
                    }
                    else {
                        // This mathquill does not have focus, so update its mathspeak.
                        this.updateMathspeak();
                    }
                }, timeout);
            }
            this.ariaPostLabel = ariaPostLabel;
        }
        else {
            if (this._ariaAlertTimeout)
                clearTimeout(this._ariaAlertTimeout);
            this.ariaPostLabel = '';
        }
        return this;
    }
    getAriaPostLabel() {
        return this.ariaPostLabel || '';
    }
    containerHasFocus() {
        return (document.activeElement && this.container.contains(document.activeElement));
    }
    getTextareaOrThrow() {
        var textarea = this.textarea;
        if (!textarea)
            throw new Error('expected a textarea');
        return textarea;
    }
    getTextareaSpanOrThrow() {
        var textareaSpan = this.textareaSpan;
        if (!textareaSpan)
            throw new Error('expected a textareaSpan');
        return textareaSpan;
    }
    /** Add the given event listeners on this.textarea, replacing the existing listener for that event if it exists. */
    addTextareaEventListeners(listeners) {
        if (!this.textarea)
            return;
        for (const key in listeners) {
            const event = key;
            this.removeTextareaEventListener(event);
            this.textarea.addEventListener(event, listeners[event]);
        }
    }
    removeTextareaEventListener(event) {
        if (!this.textarea)
            return;
        const listener = this.textareaEventListeners[event];
        if (!listener)
            return;
        this.textarea.removeEventListener(event, listener);
    }
    // based on http://www.gh-mathspeak.com/examples/quick-tutorial/
    // and http://www.gh-mathspeak.com/examples/grammar-rules/
    exportMathSpeak() {
        return this.root.mathspeak();
    }
    // overridden
    updateMathspeak() { }
    scrollHoriz() { }
    selectionChanged() { }
    setOverflowClasses() { }
}
ControllerBase.notifyees = [];
var API = {};
var EMBEDS = {};
const processedOptions = {
    handlers: true,
    autoCommands: true,
    quietEmptyDelimiters: true,
    autoParenthesizedFunctions: true,
    autoOperatorNames: true,
    leftRightIntoCmdGoes: true,
    maxDepth: true,
    interpretTildeAsSim: true,
};
const baseOptionProcessors = {};
class Options {
    constructor(version) {
        this.version = version;
    }
    assertJquery() {
        pray('Interface versions > 2 do not depend on JQuery', this.version <= 2);
        pray('JQuery is set for interface v < 3', this.jQuery);
        return this.jQuery;
    }
}
class Progenote {
}
/**
 * Interface Versioning (#459, #495) to allow us to virtually guarantee
 * backcompat. v0.10.x introduces it, so for now, don't completely break the
 * API for people who don't know about it, just complain with console.warn().
 *
 * The methods are shimmed in outro.js so that MQ.MathField.prototype etc can
 * be accessed.
 */
var insistOnInterVer = function () {
    if (window.console)
        console.warn('You are using the MathQuill API without specifying an interface version, ' +
            'which will fail in v1.0.0. Easiest fix is to do the following before ' +
            'doing anything else:\n' +
            '\n' +
            '    MathQuill = MathQuill.getInterface(1);\n' +
            '    // now MathQuill.MathField() works like it used to\n' +
            '\n' +
            'See also the "`dev` branch (2014\u20132015) \u2192 v0.10.0 Migration Guide" at\n' +
            '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide');
};
// globally exported API object
let MQ1;
function MathQuill(el) {
    insistOnInterVer();
    if (!MQ1) {
        MQ1 = getInterface(1);
    }
    return MQ1(el);
}
MathQuill.prototype = Progenote.prototype;
MathQuill.VERSION = 'v0.10.1';
MathQuill.interfaceVersion = function (v) {
    // shim for #459-era interface versioning (ended with #495)
    if (v !== 1)
        throw 'Only interface version 1 supported. You specified: ' + v;
    insistOnInterVer = function () {
        if (window.console)
            console.warn('You called MathQuill.interfaceVersion(1); to specify the interface ' +
                'version, which will fail in v1.0.0. You can fix this easily by doing ' +
                'this before doing anything else:\n' +
                '\n' +
                '    MathQuill = MathQuill.getInterface(1);\n' +
                '    // now MathQuill.MathField() works like it used to\n' +
                '\n' +
                'See also the "`dev` branch (2014\u20132015) \u2192 v0.10.0 Migration Guide" at\n' +
                '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide');
    };
    insistOnInterVer();
    return MathQuill;
};
MathQuill.getInterface = getInterface;
var MIN = (getInterface.MIN = 1), MAX = (getInterface.MAX = 3);
function getInterface(v) {
    if (v !== 1 && v !== 2 && v !== 3)
        throw ('Only interface versions between ' +
            MIN +
            ' and ' +
            MAX +
            ' supported. You specified: ' +
            v);
    const version = v;
    if (version < 3) {
        const jQuery = window.jQuery;
        if (!jQuery)
            throw `MathQuill interface version ${version} requires jQuery 1.5.2+ to be loaded first`;
        Options.prototype.jQuery = jQuery;
    }
    const optionProcessors = Object.assign(Object.assign({}, baseOptionProcessors), { handlers: (handlers) => ({
            // casting to the v3 version of this type
            fns: handlers || {},
            APIClasses,
        }) });
    function config(currentOptions, newOptions) {
        for (const name in newOptions) {
            if (newOptions.hasOwnProperty(name)) {
                if (name === 'substituteKeyboardEvents' && version >= 3) {
                    throw new Error([
                        "As of interface version 3, the 'substituteKeyboardEvents'",
                        "option is no longer supported. Use 'overrideTypedText' and",
                        "'overrideKeystroke' instead.",
                    ].join(' '));
                }
                var value = newOptions[name]; // TODO - think about typing this better
                var processor = optionProcessors[name]; // TODO - validate option processors better
                currentOptions[name] = processor ? processor(value) : value; // TODO - think about typing better
            }
        }
    }
    const BaseOptions = version < 3 ? Options : class BaseOptions extends Options {
    };
    class AbstractMathQuill extends Progenote {
        constructor(ctrlr) {
            super();
            this.__controller = ctrlr;
            this.__options = ctrlr.options;
            this.id = ctrlr.id;
            this.data = ctrlr.data;
        }
        mathquillify(classNames) {
            var ctrlr = this.__controller, root = ctrlr.root, el = ctrlr.container;
            ctrlr.createTextarea();
            var contents = domFrag(el).addClass(classNames).children().detach();
            root.setDOM(domFrag(h('span', { class: 'mq-root-block', 'aria-hidden': true }))
                .appendTo(el)
                .oneElement());
            NodeBase.linkElementByBlockNode(root.domFrag().oneElement(), root);
            this.latex(contents.text());
            this.revert = function () {
                ctrlr.removeMouseEventListener();
                domFrag(el)
                    .removeClass('mq-editable-field mq-math-mode mq-text-mode')
                    .empty()
                    .append(contents);
                return version < 3 ? this.__options.assertJquery()(el) : el;
            };
        }
        setAriaLabel(ariaLabel) {
            this.__controller.setAriaLabel(ariaLabel);
            return this;
        }
        getAriaLabel() {
            return this.__controller.getAriaLabel();
        }
        config(opts) {
            config(this.__options, opts);
            return this;
        }
        el() {
            return this.__controller.container;
        }
        text() {
            return this.__controller.exportText();
        }
        mathspeak() {
            return this.__controller.exportMathSpeak();
        }
        latex(latex) {
            if (arguments.length > 0) {
                this.__controller.renderLatexMath(latex);
                const cursor = this.__controller.cursor;
                if (this.__controller.blurred)
                    cursor.hide().parent.blur(cursor);
                return this;
            }
            return this.__controller.exportLatex();
        }
        selection() {
            return this.__controller.exportLatexSelection();
        }
        html() {
            return this.__controller.root
                .domFrag()
                .oneElement()
                .innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g, '') // TODO remove when jQuery is completely gone
                .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
                .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
                .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
                .replace(/ class=(""|(?= |>))/g, '');
        }
        reflow() {
            this.__controller.root.postOrder(function (node) {
                node.reflow();
            });
            return this;
        }
        cursor() {
            return this.__controller.cursor;
        }
        controller() {
            return this.__controller;
        }
    }
    class EditableField extends AbstractMathQuill {
        mathquillify(classNames) {
            super.mathquillify(classNames);
            this.__controller.editable = true;
            this.__controller.addMouseEventListener();
            this.__controller.editablesTextareaEvents();
            return this;
        }
        focus() {
            this.__controller.getTextareaOrThrow().focus();
            this.__controller.scrollHoriz();
            return this;
        }
        blur() {
            this.__controller.getTextareaOrThrow().blur();
            return this;
        }
        write(latex) {
            this.__controller.writeLatex(latex);
            this.__controller.scrollHoriz();
            const cursor = this.__controller.cursor;
            if (this.__controller.blurred)
                cursor.hide().parent.blur(cursor);
            return this;
        }
        empty() {
            var root = this.__controller.root, cursor = this.__controller.cursor;
            root.setEnds({ [L]: 0, [R]: 0 });
            root.domFrag().empty();
            delete cursor.selection;
            cursor.insAtRightEnd(root);
            return this;
        }
        cmd(cmd) {
            var ctrlr = this.__controller.notify(undefined), cursor = ctrlr.cursor;
            if (/^\\[a-z]+$/i.test(cmd) && !cursor.isTooDeep()) {
                cmd = cmd.slice(1);
                var klass = LatexCmds[cmd];
                var node;
                if (klass) {
                    if (klass.constructor) {
                        node = new klass(cmd);
                    }
                    else {
                        node = klass(cmd);
                    }
                    if (cursor.selection)
                        node.replaces(cursor.replaceSelection());
                    node.createLeftOf(cursor.show());
                } /* TODO: API needs better error reporting */
                else
                    ;
            }
            else
                cursor.parent.write(cursor, cmd);
            ctrlr.scrollHoriz();
            if (ctrlr.blurred)
                cursor.hide().parent.blur(cursor);
            return this;
        }
        select() {
            this.__controller.selectAll();
            return this;
        }
        clearSelection() {
            this.__controller.cursor.clearSelection();
            return this;
        }
        moveToDirEnd(dir) {
            this.__controller
                .notify('move')
                .cursor.insAtDirEnd(dir, this.__controller.root);
            return this;
        }
        moveToLeftEnd() {
            return this.moveToDirEnd(L);
        }
        moveToRightEnd() {
            return this.moveToDirEnd(R);
        }
        keystroke(keysString, evt) {
            var keys = keysString.replace(/^\s+|\s+$/g, '').split(/\s+/);
            for (var i = 0; i < keys.length; i += 1) {
                this.__controller.keystroke(keys[i], evt);
            }
            return this;
        }
        typedText(text) {
            for (var i = 0; i < text.length; i += 1)
                this.__controller.typedText(text.charAt(i));
            return this;
        }
        dropEmbedded(pageX, pageY, options) {
            var clientX = pageX - getScrollX();
            var clientY = pageY - getScrollY();
            var el = document.elementFromPoint(clientX, clientY);
            this.__controller.seek(el, clientX, clientY);
            var cmd = new EmbedNode().setOptions(options);
            cmd.createLeftOf(this.__controller.cursor);
        }
        setAriaPostLabel(ariaPostLabel, timeout) {
            this.__controller.setAriaPostLabel(ariaPostLabel, timeout);
            return this;
        }
        getAriaPostLabel() {
            return this.__controller.getAriaPostLabel();
        }
        clickAt(clientX, clientY, target) {
            target = target || document.elementFromPoint(clientX, clientY);
            var ctrlr = this.__controller, root = ctrlr.root;
            const rootElement = root.domFrag().oneElement();
            if (!rootElement.contains(target))
                target = rootElement;
            ctrlr.seek(target, clientX, clientY);
            if (ctrlr.blurred)
                this.focus();
            return this;
        }
        ignoreNextMousedown(fn) {
            this.__controller.cursor.options.ignoreNextMousedown = fn;
            return this;
        }
    }
    var APIClasses = {
        AbstractMathQuill,
        EditableField,
    };
    pray('API.StaticMath defined', API.StaticMath);
    APIClasses.StaticMath = API.StaticMath(APIClasses);
    pray('API.MathField defined', API.MathField);
    APIClasses.MathField = API.MathField(APIClasses);
    pray('API.InnerMathField defined', API.InnerMathField);
    APIClasses.InnerMathField = API.InnerMathField(APIClasses);
    if (API.TextField) {
        APIClasses.TextField = API.TextField(APIClasses);
    }
    /**
     * Function that takes an HTML element and, if it's the root HTML element of a
     * static math or math or text field, returns an API object for it (else, null).
     *
     *   var mathfield = MQ.MathField(mathFieldSpan);
     *   assert(MQ(mathFieldSpan).id === mathfield.id);
     *   assert(MQ(mathFieldSpan).id === MQ(mathFieldSpan).id);
     *
     */
    const MQ = function (el) {
        if (!el || !el.nodeType)
            return null; // check that `el` is a HTML element, using the
        // same technique as jQuery: https://github.com/jquery/jquery/blob/679536ee4b7a92ae64a5f58d90e9cc38c001e807/src/core/init.js#L92
        let blockElement;
        const childArray = domFrag(el).children().toElementArray();
        for (const child of childArray) {
            if (child.classList.contains('mq-root-block')) {
                blockElement = child;
                break;
            }
        }
        var blockNode = NodeBase.getNodeOfElement(blockElement); // TODO - assumng it's a MathBlock
        var ctrlr = blockNode && blockNode.controller;
        const APIClass = ctrlr && APIClasses[ctrlr.KIND_OF_MQ];
        return ctrlr && APIClass ? new APIClass(ctrlr) : null;
    };
    MQ.L = L;
    MQ.R = R;
    MQ.config = function (opts) {
        config(BaseOptions.prototype, opts);
        return this;
    };
    MQ.registerEmbed = function (name, options) {
        if (!/^[a-z][a-z0-9]*$/i.test(name)) {
            throw 'Embed name must start with letter and be only letters and digits';
        }
        EMBEDS[name] = options;
    };
    /*
     * Export the API functions that MathQuill-ify an HTML element into API objects
     * of each class. If the element had already been MathQuill-ified but into a
     * different kind (or it's not an HTML element), return null.
     */
    MQ.StaticMath = createEntrypoint('StaticMath', APIClasses.StaticMath);
    MQ.MathField = createEntrypoint('MathField', APIClasses.MathField);
    MQ.InnerMathField = createEntrypoint('InnerMathField', APIClasses.InnerMathField);
    if (APIClasses.TextField) {
        MQ.TextField = createEntrypoint('TextField', APIClasses.TextField);
    }
    MQ.prototype = AbstractMathQuill.prototype;
    MQ.EditableField = function () {
        throw "wtf don't call me, I'm 'abstract'";
    };
    MQ.EditableField.prototype = EditableField.prototype;
    if (version < 3) {
        MQ.saneKeyboardEvents = defaultSubstituteKeyboardEvents;
    }
    function createEntrypoint(kind, APIClass) {
        pray(kind + ' is defined', APIClass);
        function mqEntrypoint(el, opts) {
            if (!el || !el.nodeType)
                return null;
            var mq = MQ(el);
            if (mq instanceof APIClass)
                return mq;
            var ctrlr = new Controller(new APIClass.RootBlock(), el, new BaseOptions(version));
            ctrlr.KIND_OF_MQ = kind;
            return new APIClass(ctrlr).__mathquillify(opts || {}, version);
        }
        mqEntrypoint.prototype = APIClass.prototype;
        return mqEntrypoint;
    }
    return MQ;
}
function RootBlockMixin(_) {
    _.moveOutOf = function (dir) {
        pray('controller is defined', this.controller);
        this.controller.handle('moveOutOf', dir);
    };
    _.deleteOutOf = function (dir) {
        pray('controller is defined', this.controller);
        this.controller.handle('deleteOutOf', dir);
    };
    _.selectOutOf = function (dir) {
        pray('controller is defined', this.controller);
        this.controller.handle('selectOutOf', dir);
    };
    _.upOutOf = function () {
        pray('controller is defined', this.controller);
        this.controller.handle('upOutOf');
        return undefined;
    };
    _.downOutOf = function () {
        pray('controller is defined', this.controller);
        this.controller.handle('downOutOf');
        return undefined;
    };
    _.reflow = function () {
        pray('controller is defined', this.controller);
        this.controller.handle('reflow');
        this.controller.handle('edited');
        this.controller.handle('edit');
    };
}
function parseError(stream, message) {
    if (stream) {
        stream = "'" + stream + "'";
    }
    else {
        stream = 'EOF';
    }
    throw 'Parse Error: ' + message + ' at ' + stream;
}
class Parser {
    // The Parser object is a wrapper for a parser function.
    // Externally, you use one to parse a string by calling
    //   var result = SomeParser.parse('Me Me Me! Parse Me!');
    // You should never call the constructor, rather you should
    // construct your Parser from the base parsers and the
    // parser combinator methods.
    constructor(body) {
        this._ = body;
    }
    parse(stream) {
        return this.skip(Parser.eof)._('' + stream, success, parseError);
        function success(_stream, result) {
            return result;
        }
    }
    // -*- primitive combinators -*- //
    or(alternative) {
        pray('or is passed a parser', alternative instanceof Parser);
        var self = this;
        return new Parser(function (stream, onSuccess, onFailure) {
            return self._(stream, onSuccess, failure);
            function failure(_newStream) {
                return alternative._(stream, onSuccess, onFailure);
            }
        });
    }
    then(next) {
        var self = this;
        return new Parser(function (stream, onSuccess, onFailure) {
            return self._(stream, success, onFailure);
            function success(newStream, result) {
                var nextParser = next instanceof Parser ? next : next(result);
                pray('a parser is returned', nextParser instanceof Parser);
                return nextParser._(newStream, onSuccess, onFailure);
            }
        });
    }
    // -*- optimized iterative combinators -*- //
    many() {
        var self = this;
        return new Parser(function (stream, onSuccess, _onFailure) {
            var xs = [];
            while (self._(stream, success, failure))
                ;
            return onSuccess(stream, xs);
            function success(newStream, x) {
                stream = newStream;
                xs.push(x);
                return true;
            }
            function failure() {
                return false;
            }
        });
    }
    times(min, max) {
        if (arguments.length < 2)
            max = min;
        var self = this;
        return new Parser(function (stream, onSuccess, onFailure) {
            var xs = [];
            var result = true;
            var failure;
            for (var i = 0; i < min; i += 1) {
                // TODO, this may be incorrect for parsers that return boolean
                // (or generally, falsey) values
                result = !!self._(stream, success, firstFailure);
                if (!result)
                    return onFailure(stream, failure);
            }
            for (; i < max && result; i += 1) {
                self._(stream, success, secondFailure);
            }
            return onSuccess(stream, xs);
            function success(newStream, x) {
                xs.push(x);
                stream = newStream;
                return true;
            }
            function firstFailure(newStream, msg) {
                failure = msg;
                stream = newStream;
                return false;
            }
            function secondFailure(_newStream, _msg) {
                return false;
            }
        });
    }
    // -*- higher-level combinators -*- //
    result(res) {
        return this.then(Parser.succeed(res));
    }
    atMost(n) {
        return this.times(0, n);
    }
    atLeast(n) {
        var self = this;
        return self.times(n).then(function (start) {
            return self.many().map(function (end) {
                return start.concat(end);
            });
        });
    }
    map(fn) {
        return this.then(function (result) {
            return Parser.succeed(fn(result));
        });
    }
    skip(two) {
        return this.then(function (result) {
            return two.result(result);
        });
    }
    // -*- primitive parsers -*- //
    static string(str) {
        var len = str.length;
        var expected = "expected '" + str + "'";
        return new Parser(function (stream, onSuccess, onFailure) {
            var head = stream.slice(0, len);
            if (head === str) {
                return onSuccess(stream.slice(len), head);
            }
            else {
                return onFailure(stream, expected);
            }
        });
    }
    static regex(re) {
        pray('regexp parser is anchored', re.toString().charAt(1) === '^');
        var expected = 'expected ' + re;
        return new Parser(function (stream, onSuccess, onFailure) {
            var match = re.exec(stream);
            if (match) {
                var result = match[0];
                return onSuccess(stream.slice(result.length), result);
            }
            else {
                return onFailure(stream, expected);
            }
        });
    }
    static succeed(result) {
        return new Parser(function (stream, onSuccess) {
            return onSuccess(stream, result);
        });
    }
    static fail(msg) {
        return new Parser(function (stream, _, onFailure) {
            return onFailure(stream, msg);
        });
    }
}
Parser.letter = Parser.regex(/^[a-z]/i);
Parser.letters = Parser.regex(/^[a-z]*/i);
Parser.digit = Parser.regex(/^[0-9]/);
Parser.digits = Parser.regex(/^[0-9]*/);
Parser.whitespace = Parser.regex(/^\s+/);
Parser.optWhitespace = Parser.regex(/^\s*/);
Parser.any = new Parser(function (stream, onSuccess, onFailure) {
    if (!stream)
        return onFailure(stream, 'expected any character');
    return onSuccess(stream.slice(1), stream.charAt(0));
});
Parser.all = new Parser(function (stream, onSuccess, _onFailure) {
    return onSuccess('', stream);
});
Parser.eof = new Parser(function (stream, onSuccess, onFailure) {
    if (stream)
        return onFailure(stream, 'expected EOF');
    return onSuccess(stream, stream);
});
/** Poller that fires once every tick. */
class EveryTick {
    constructor() {
        this.fn = noop;
    }
    listen(fn) {
        this.fn = fn;
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.fn);
    }
    listenOnce(fn) {
        this.listen((...args) => {
            this.clearListener();
            fn(...args);
        });
    }
    clearListener() {
        this.fn = noop;
        clearTimeout(this.timeoutId);
    }
    trigger(...args) {
        this.fn(...args);
    }
}
/*************************************************
 * Sane Keyboard Events Shim
 *
 * An abstraction layer over the raw browser browser events
 * on the textarea that hides all the nasty cross-
 * browser incompatibilities behind a uniform API.
 *
 * Design goal: This is a *HARD* internal
 * abstraction barrier. Cross-browser
 * inconsistencies are not allowed to leak through
 * and be dealt with by event handlers. All future
 * cross-browser issues that arise must be dealt
 * with here, and if necessary, the API updated.
 ************************************************/
var saneKeyboardEvents = (function () {
    // The following [key values][1] map was compiled from the
    // [DOM3 Events appendix section on key codes][2] and
    // [a widely cited report on cross-browser tests of key codes][3],
    // except for 10: 'Enter', which I've empirically observed in Safari on iOS
    // and doesn't appear to conflict with any other known key codes.
    //
    // [1]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#keys-keyvalues
    // [2]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
    // [3]: http://unixpapa.com/js/key.html
    const WHICH_TO_MQ_KEY_STEM = {
        8: 'Backspace',
        9: 'Tab',
        10: 'Enter',
        13: 'Enter',
        16: 'Shift',
        17: 'Control',
        18: 'Alt',
        20: 'CapsLock',
        27: 'Esc',
        32: 'Spacebar',
        33: 'PageUp',
        34: 'PageDown',
        35: 'End',
        36: 'Home',
        37: 'Left',
        38: 'Up',
        39: 'Right',
        40: 'Down',
        45: 'Insert',
        46: 'Del',
        144: 'NumLock',
    };
    const KEY_TO_MQ_KEY_STEM = {
        ArrowRight: 'Right',
        ArrowLeft: 'Left',
        ArrowDown: 'Down',
        ArrowUp: 'Up',
        Delete: 'Del',
        Escape: 'Esc',
        ' ': 'Spacebar',
    };
    function isArrowKey(e) {
        // The keyPress event in FF reports which=0 for some reason. The new
        // .key property seems to report reasonable results, so we're using that
        switch (getMQKeyStem(e)) {
            case 'Right':
            case 'Left':
            case 'Down':
            case 'Up':
                return true;
        }
        return false;
    }
    function isLowercaseAlphaCharacter(s) {
        return s.length === 1 && s >= 'a' && s <= 'z';
    }
    function getMQKeyStem(evt) {
        var _c;
        // Translate browser key names to MQ's internal naming system
        //
        // Ref: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        if (evt.key === undefined) {
            const which = evt.which || evt.keyCode;
            return WHICH_TO_MQ_KEY_STEM[which] || String.fromCharCode(which);
        }
        if (isLowercaseAlphaCharacter(evt.key))
            return evt.key.toUpperCase();
        return (_c = KEY_TO_MQ_KEY_STEM[evt.key]) !== null && _c !== void 0 ? _c : evt.key;
    }
    /** To the extent possible, create a normalized string representation
     * of the key combo (i.e., key code and modifier keys). */
    function getMQKeyName(evt) {
        const key = getMQKeyStem(evt);
        var modifiers = [];
        if (evt.ctrlKey)
            modifiers.push('Ctrl');
        if (evt.metaKey)
            modifiers.push('Meta');
        if (evt.altKey)
            modifiers.push('Alt');
        if (evt.shiftKey)
            modifiers.push('Shift');
        if (!modifiers.length)
            return key;
        // Don't append the key name if it already exists as a modifier, e.g. Ctrl-Control and Shift-Shift is nonsensical.
        if (key !== 'Alt' && key !== 'Control' && key !== 'Meta' && key !== 'Shift')
            modifiers.push(key);
        return modifiers.join('-');
    }
    return function saneKeyboardEvents(
    /** Usually the textarea associated with a MQ instance, but can be another kind of element if `substituteTextarea` was used to replace it with something else. */
    textarea, controller) {
        var keydown = null;
        var keypress = null;
        // everyTick.listen() is called after key or clipboard events to
        // say "Hey, I think something was just typed" or "pasted" etc,
        // so that at all subsequent opportune times (next event or timeout),
        // will check for expected typed or pasted text.
        // Need to check repeatedly because #135: in Safari 5.1 (at least),
        // after selecting something and then typing, the textarea is
        // incorrectly reported as selected during the input event (but not
        // subsequently).
        const everyTick = new EveryTick();
        function guardedTextareaSelect() {
            try {
                // IE can throw an 'Incorrect Function' error if you
                // try to select a textarea that is hidden. It seems
                // likely that we don't really care if the selection
                // fails to happen in this case. Why would the textarea
                // be hidden? And who would even be able to tell?
                if (textarea instanceof HTMLTextAreaElement)
                    textarea.select();
            }
            catch (e) { }
        }
        // -*- public methods -*- //
        function select(text) {
            // check textarea at least once/one last time before munging (so
            // no race condition if selection happens after keypress/paste but
            // before checkTextarea), then never again ('cos it's been munged)
            everyTick.trigger();
            everyTick.clearListener();
            if (textarea instanceof HTMLTextAreaElement)
                textarea.value = text;
            if (text)
                guardedTextareaSelect();
            shouldBeSelected = !!text;
        }
        var shouldBeSelected = false;
        // -*- helper subroutines -*- //
        // Determine whether there's a selection in the textarea.
        // This will always return false in IE < 9, which don't support
        // HTMLTextareaElement::selection{Start,End}.
        function hasSelection() {
            if (!('selectionStart' in textarea))
                return false;
            if (!(textarea instanceof HTMLTextAreaElement))
                return false;
            return textarea.selectionStart !== textarea.selectionEnd;
        }
        function handleKey() {
            if (controller.options && controller.options.overrideKeystroke) {
                controller.options.overrideKeystroke(getMQKeyName(keydown), keydown);
            }
            else {
                controller.keystroke(getMQKeyName(keydown), keydown);
            }
        }
        // -*- event handlers -*- //
        function onKeydown(e) {
            everyTick.trigger(e);
            if (e.target !== textarea)
                return;
            keydown = e;
            keypress = null;
            if (shouldBeSelected)
                everyTick.listenOnce(function (e) {
                    if (!(e && e.type === 'focusout')) {
                        // re-select textarea in case it's an unrecognized key that clears
                        // the selection, then never again, 'cos next thing might be blur
                        guardedTextareaSelect();
                    }
                });
            handleKey();
        }
        function onKeypress(e) {
            everyTick.trigger(e);
            if (e.target !== textarea)
                return;
            // call the key handler for repeated keypresses.
            // This excludes keypresses that happen directly
            // after keydown.  In that case, there will be
            // no previous keypress, so we skip it here
            if (keydown && keypress)
                handleKey();
            keypress = e;
            // only check for typed text if this key can type text. Otherwise
            // you can end up with mathquill thinking text was typed if you
            // use the mq.keystroke('Right') command while a single character
            // is selected. Only detected in FF.
            if (!isArrowKey(e)) {
                everyTick.listen(typedText);
            }
            else {
                everyTick.listenOnce(maybeReselect);
            }
        }
        function onKeyup(e) {
            everyTick.trigger(e);
            if (e.target !== textarea)
                return;
            // Handle case of no keypress event being sent
            if (!!keydown && !keypress) {
                // only check for typed text if this key can type text. Otherwise
                // you can end up with mathquill thinking text was typed if you
                // use the mq.keystroke('Right') command while a single character
                // is selected. Only detected in FF.
                if (!isArrowKey(e)) {
                    everyTick.listen(typedText);
                }
                else {
                    everyTick.listenOnce(maybeReselect);
                }
            }
        }
        function typedText() {
            // If there is a selection, the contents of the textarea couldn't
            // possibly have just been typed in.
            // This happens in browsers like Firefox and Opera that fire
            // keypress for keystrokes that are not text entry and leave the
            // selection in the textarea alone, such as Ctrl-C.
            // Note: we assume that browsers that don't support hasSelection()
            // also never fire keypress on keystrokes that are not text entry.
            // This seems reasonably safe because:
            // - all modern browsers including IE 9+ support hasSelection(),
            //   making it extremely unlikely any browser besides IE < 9 won't
            // - as far as we know IE < 9 never fires keypress on keystrokes
            //   that aren't text entry, which is only as reliable as our
            //   tests are comprehensive, but the IE < 9 way to do
            //   hasSelection() is poorly documented and is also only as
            //   reliable as our tests are comprehensive
            // If anything like #40 or #71 is reported in IE < 9, see
            // b1318e5349160b665003e36d4eedd64101ceacd8
            if (hasSelection())
                return;
            if (!(textarea instanceof HTMLTextAreaElement))
                return;
            var text = textarea.value;
            // In Linux and Chrome or Chrome OS, users may issue the Ctrl-Shift-U command to input a Unicode character.
            // Unfortunately, when the system is in this state, Chrome sends a keydown of "Ctrl-Shift-Unidentified" in Linux, "Ctrl-Shift-U" on Windows/Mac, or "Ctrl-Shift-Process" in the latest Chrome OS.
            // Equally vexing is that the keyup correctly comes back as Ctrl-Shift-U.
            // Furthermore, an input event with the value "u" is still processed in Linux and Chrome OS due to the down/up mismatch.
            // The end result is that a spurious "u" is sent followed by the intended character.
            // Due to how this feature works, it's vital to completely ignore Ctrl-Shift-U no matter how the input event appears to Mathquill as clearing the textarea by mistake breaks the expected input flow.
            if (keydown &&
                !keydown.altKey &&
                keydown.ctrlKey &&
                !keydown.metaKey &&
                keydown.shiftKey &&
                (keydown.key === 'U' ||
                    keydown.key === 'Unidentified' ||
                    keydown.key === 'Process'))
                return;
            if (text.length === 1) {
                textarea.value = '';
                if (controller.options && controller.options.overrideTypedText) {
                    controller.options.overrideTypedText(text);
                }
                else {
                    controller.typedText(text);
                }
            } // in Firefox, keys that don't type text, just clear seln, fire keypress
            // https://github.com/mathquill/mathquill/issues/293#issuecomment-40997668
            else
                maybeReselect(); // re-select if that's why we're here
        }
        function maybeReselect() {
            if (!(textarea instanceof HTMLTextAreaElement))
                return;
            if (textarea.value.length > 1) {
                guardedTextareaSelect();
            }
        }
        function onBlur() {
            keydown = null;
            keypress = null;
            everyTick.clearListener();
            if (textarea instanceof HTMLTextAreaElement)
                textarea.value = '';
        }
        function onPaste(e) {
            everyTick.trigger();
            if (e.target !== textarea)
                return;
            // browsers are dumb.
            //
            // In Linux, middle-click pasting causes onPaste to be called,
            // when the textarea is not necessarily focused.  We focus it
            // here to ensure that the pasted text actually ends up in the
            // textarea.
            //
            // It's pretty nifty that by changing focus in this handler,
            // we can change the target of the default action.  (This works
            // on keydown too, FWIW).
            //
            // And by nifty, we mean dumb (but useful sometimes).
            if (document.activeElement !== textarea) {
                textarea.focus();
            }
            everyTick.listen(function pastedText() {
                if (!(textarea instanceof HTMLTextAreaElement))
                    return;
                var text = textarea.value;
                textarea.value = '';
                if (text)
                    controller.paste(text);
            });
        }
        function onInput(e) {
            everyTick.trigger(e);
        }
        if (controller.options && controller.options.disableCopyPaste) {
            controller.addTextareaEventListeners({
                keydown: onKeydown,
                keypress: onKeypress,
                keyup: onKeyup,
                focusout: onBlur,
                copy: function (e) {
                    e.preventDefault();
                },
                cut: function (e) {
                    e.preventDefault();
                },
                paste: function (e) {
                    everyTick.trigger();
                    e.preventDefault();
                },
                input: onInput,
            });
        }
        else {
            controller.addTextareaEventListeners({
                keydown: onKeydown,
                keypress: onKeypress,
                keyup: onKeyup,
                focusout: onBlur,
                cut: function () {
                    everyTick.listenOnce(function () {
                        controller.cut();
                    });
                },
                copy: function () {
                    everyTick.listenOnce(function () {
                        controller.copy();
                    });
                },
                paste: onPaste,
                input: onInput,
            });
        }
        // -*- export public methods -*- //
        return { select };
    };
})();
/***********************************************
 * Export math in a human-readable text format
 * As you can see, only half-baked so far.
 **********************************************/
class Controller_exportText extends ControllerBase {
    exportText() {
        return this.root.foldChildren('', function (text, child) {
            return text + child.text();
        });
    }
}
ControllerBase.onNotify(function (cursor, e) {
    // these try to cover all ways that mathquill can be modified
    if (e === 'edit' || e === 'replace' || e === undefined) {
        var controller = cursor.controller;
        if (!controller)
            return;
        if (!controller.options.enableDigitGrouping)
            return;
        // TODO - maybe reconsider these 3 states and drop down to only 2
        //
        // blurred === false means we are focused. blurred === true or
        // blurred === undefined means we are not focused.
        if (controller.blurred !== false)
            return;
        controller.disableGroupingForSeconds(1);
    }
});
class Controller_focusBlur extends Controller_exportText {
    constructor() {
        super(...arguments);
        this.handleTextareaFocusEditable = () => {
            const cursor = this.cursor;
            this.updateMathspeak();
            this.blurred = false;
            clearTimeout(this.blurTimeout);
            domFrag(this.container).addClass('mq-focused');
            if (!cursor.parent)
                cursor.insAtRightEnd(this.root);
            if (cursor.selection) {
                cursor.selection.domFrag().removeClass('mq-blur');
                this.selectionChanged(); //re-select textarea contents after tabbing away and back
            }
            else {
                cursor.show();
            }
            this.setOverflowClasses();
        };
        this.handleTextareaBlurEditable = () => {
            if (this.textareaSelectionTimeout) {
                clearTimeout(this.textareaSelectionTimeout);
                this.textareaSelectionTimeout = 0;
            }
            this.disableGroupingForSeconds(0);
            this.blurred = true;
            this.blurTimeout = setTimeout(() => {
                // wait for blur on window; if
                this.root.postOrder(function (node) {
                    node.intentionalBlur();
                }); // none, intentional blur: #264
                this.cursor.clearSelection().endSelection();
                this.blur();
                this.updateMathspeak();
                this.scrollHoriz();
            });
            window.addEventListener('blur', this.handleWindowBlur);
        };
        this.handleTextareaFocusStatic = () => {
            this.blurred = false;
        };
        this.handleTextareaBlurStatic = () => {
            if (this.cursor.selection) {
                this.cursor.selection.clear();
            }
            //detaching during blur explodes in WebKit
            setTimeout(() => {
                domFrag(this.getTextareaSpanOrThrow()).detach();
                this.blurred = true;
            });
        };
        this.handleWindowBlur = () => {
            // blur event also fired on window, just switching
            clearTimeout(this.blurTimeout); // tabs/windows, not intentional blur
            if (this.cursor.selection)
                this.cursor.selection.domFrag().addClass('mq-blur');
            this.blur();
            this.updateMathspeak();
        };
    }
    disableGroupingForSeconds(seconds) {
        clearTimeout(this.__disableGroupingTimeout);
        if (seconds === 0) {
            this.root.domFrag().removeClass('mq-suppress-grouping');
        }
        else {
            this.root.domFrag().addClass('mq-suppress-grouping');
            this.__disableGroupingTimeout = setTimeout(() => {
                this.root.domFrag().removeClass('mq-suppress-grouping');
            }, seconds * 1000);
        }
    }
    blur() {
        // not directly in the textarea blur handler so as to be
        this.cursor.hide().parent.blur(this.cursor); // synchronous with/in the same frame as
        domFrag(this.container).removeClass('mq-focused'); // clearing/blurring selection
        window.removeEventListener('blur', this.handleWindowBlur);
        if (this.options && this.options.resetCursorOnBlur) {
            this.cursor.resetToEnd(this);
        }
    }
    addEditableFocusBlurListeners() {
        var ctrlr = this, cursor = ctrlr.cursor;
        this.addTextareaEventListeners({
            focus: this.handleTextareaFocusEditable,
            blur: this.handleTextareaBlurEditable,
        });
        ctrlr.blurred = true;
        cursor.hide().parent.blur(cursor);
    }
    addStaticFocusBlurListeners() {
        this.addTextareaEventListeners({
            focus: this.handleTextareaFocusStatic,
            blur: this.handleTextareaBlurStatic,
        });
    }
}
/**
 * TODO: I wanted to move MathBlock::focus and blur here, it would clean
 * up lots of stuff like, TextBlock::focus is set to MathBlock::focus
 * and TextBlock::blur calls MathBlock::blur, when instead they could
 * use inheritance and super_.
 *
 * Problem is, there's lots of calls to .focus()/.blur() on nodes
 * outside Controller::focusBlurEvents(), such as .postOrder('blur') on
 * insertion, which if MathBlock::blur becomes MQNode::blur, would add the
 * 'blur' CSS class to all MQSymbol's (because .isEmpty() is true for all
 * of them).
 *
 * I'm not even sure there aren't other troublesome calls to .focus() or
 * .blur(), so this is TODO for now.
 */
/*****************************************
 * Deals with the browser DOM events from
 * interaction with the typist.
 ****************************************/
/**
 * Only one incremental selection may be open at a time. Track whether
 * an incremental selection is open to help enforce this invariant.
 */
var INCREMENTAL_SELECTION_OPEN = false;
class MQNode extends NodeBase {
    keystroke(key, e, ctrlr) {
        var cursor = ctrlr.cursor;
        switch (key) {
            case 'Ctrl-Shift-Backspace':
            case 'Ctrl-Backspace':
                ctrlr.ctrlDeleteDir(L);
                break;
            case 'Shift-Backspace':
            case 'Backspace':
                ctrlr.backspace();
                break;
            // Tab or Esc -> go one block right if it exists, else escape right.
            case 'Esc':
            case 'Tab':
                ctrlr.escapeDir(R, key, e);
                return;
            // Shift-Tab -> go one block left if it exists, else escape left.
            case 'Shift-Tab':
            case 'Shift-Esc':
                ctrlr.escapeDir(L, key, e);
                return;
            // End -> move to the end of the current block.
            case 'End':
                ctrlr.notify('move').cursor.insAtRightEnd(cursor.parent);
                ctrlr.aria.queue('end of').queue(cursor.parent, true);
                break;
            // Ctrl-End -> move all the way to the end of the root block.
            case 'Ctrl-End':
                ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
                ctrlr.aria
                    .queue('end of')
                    .queue(ctrlr.ariaLabel)
                    .queue(ctrlr.root)
                    .queue(ctrlr.ariaPostLabel);
                break;
            // Shift-End -> select to the end of the current block.
            case 'Shift-End':
                ctrlr.selectToBlockEndInDir(R);
                break;
            // Ctrl-Shift-End -> select all the way to the end of the root block.
            case 'Ctrl-Shift-End':
                ctrlr.selectToRootEndInDir(R);
                break;
            // Home -> move to the start of the current block.
            case 'Home':
                ctrlr.notify('move').cursor.insAtLeftEnd(cursor.parent);
                ctrlr.aria.queue('beginning of').queue(cursor.parent, true);
                break;
            // Ctrl-Home -> move all the way to the start of the root block.
            case 'Ctrl-Home':
                ctrlr.notify('move').cursor.insAtLeftEnd(ctrlr.root);
                ctrlr.aria
                    .queue('beginning of')
                    .queue(ctrlr.ariaLabel)
                    .queue(ctrlr.root)
                    .queue(ctrlr.ariaPostLabel);
                break;
            // Shift-Home -> select to the start of the current block.
            case 'Shift-Home':
                ctrlr.selectToBlockEndInDir(L);
                break;
            // Ctrl-Shift-Home -> select all the way to the start of the root block.
            case 'Ctrl-Shift-Home':
                ctrlr.selectToRootEndInDir(L);
                break;
            case 'Left':
                ctrlr.moveLeft();
                break;
            case 'Shift-Left':
                ctrlr.selectLeft();
                break;
            case 'Ctrl-Left':
                break;
            case 'Right':
                ctrlr.moveRight();
                break;
            case 'Shift-Right':
                ctrlr.selectRight();
                break;
            case 'Ctrl-Right':
                break;
            case 'Up':
                ctrlr.moveUp();
                break;
            case 'Down':
                ctrlr.moveDown();
                break;
            case 'Shift-Up':
                ctrlr.withIncrementalSelection((selectDir) => {
                    if (cursor[L]) {
                        while (cursor[L])
                            selectDir(L);
                    }
                    else {
                        selectDir(L);
                    }
                });
                break;
            case 'Shift-Down':
                ctrlr.withIncrementalSelection((selectDir) => {
                    if (cursor[R]) {
                        while (cursor[R])
                            selectDir(R);
                    }
                    else {
                        selectDir(R);
                    }
                });
                break;
            case 'Ctrl-Up':
                break;
            case 'Ctrl-Down':
                break;
            case 'Ctrl-Shift-Del':
            case 'Ctrl-Del':
                ctrlr.ctrlDeleteDir(R);
                break;
            case 'Shift-Del':
            case 'Del':
                ctrlr.deleteForward();
                break;
            case 'Meta-A':
            case 'Ctrl-A':
                ctrlr.selectAll();
                break;
            // These remaining hotkeys are only of benefit to people running screen readers.
            case 'Ctrl-Alt-Up': // speak parent block that has focus
                if (cursor.parent.parent && cursor.parent.parent instanceof MQNode)
                    ctrlr.aria.queue(cursor.parent.parent);
                else
                    ctrlr.aria.queue('nothing above');
                break;
            case 'Ctrl-Alt-Down': // speak current block that has focus
                if (cursor.parent && cursor.parent instanceof MQNode)
                    ctrlr.aria.queue(cursor.parent);
                else
                    ctrlr.aria.queue('block is empty');
                break;
            case 'Ctrl-Alt-Left': // speak left-adjacent block
                if (cursor.parent.parent && cursor.parent.parent.getEnd(L)) {
                    ctrlr.aria.queue(cursor.parent.parent.getEnd(L));
                }
                else {
                    ctrlr.aria.queue('nothing to the left');
                }
                break;
            case 'Ctrl-Alt-Right': // speak right-adjacent block
                if (cursor.parent.parent && cursor.parent.parent.getEnd(R)) {
                    ctrlr.aria.queue(cursor.parent.parent.getEnd(R));
                }
                else {
                    ctrlr.aria.queue('nothing to the right');
                }
                break;
            case 'Ctrl-Alt-Shift-Down': // speak selection
                if (cursor.selection)
                    ctrlr.aria.queue(cursor.selection.join('mathspeak', ' ').trim() + ' selected');
                else
                    ctrlr.aria.queue('nothing selected');
                break;
            case 'Ctrl-Alt-=':
            case 'Ctrl-Alt-Shift-Right': // speak ARIA post label (evaluation or error)
                if (ctrlr.ariaPostLabel.length)
                    ctrlr.aria.queue(ctrlr.ariaPostLabel);
                else
                    ctrlr.aria.queue('no answer');
                break;
            default:
                return;
        }
        ctrlr.aria.alert();
        e === null || e === void 0 ? void 0 : e.preventDefault();
        ctrlr.scrollHoriz();
    }
    moveOutOf(_dir, _cursor, _updown) {
        pray('overridden or never called on this node', false);
    } // called by Controller::escapeDir, moveDir
    moveTowards(_dir, _cursor, _updown) {
        pray('overridden or never called on this node', false);
    } // called by Controller::moveDir
    deleteOutOf(_dir, _cursor) {
        pray('overridden or never called on this node', false);
    } // called by Controller::deleteDir
    deleteTowards(_dir, _cursor) {
        pray('overridden or never called on this node', false);
    } // called by Controller::deleteDir
    unselectInto(_dir, _cursor) {
        pray('overridden or never called on this node', false);
    } // called by Controller::selectDir
    selectOutOf(_dir, _cursor) {
        pray('overridden or never called on this node', false);
    } // called by Controller::selectDir
    selectTowards(_dir, _cursor) {
        pray('overridden or never called on this node', false);
    } // called by Controller::selectDir
}
ControllerBase.onNotify(function (cursor, e) {
    if (e === 'move' || e === 'upDown')
        cursor.show().clearSelection();
});
baseOptionProcessors.leftRightIntoCmdGoes = function (updown) {
    if (updown && updown !== 'up' && updown !== 'down') {
        throw ('"up" or "down" required for leftRightIntoCmdGoes option, ' +
            'got "' +
            updown +
            '"');
    }
    return updown;
};
ControllerBase.onNotify(function (cursor, e) {
    if (e !== 'upDown')
        cursor.upDownCache = {};
});
ControllerBase.onNotify(function (cursor, e) {
    if (e === 'edit')
        cursor.show().deleteSelection();
});
ControllerBase.onNotify(function (cursor, e) {
    if (e !== 'select')
        cursor.endSelection();
});
class Controller_keystroke extends Controller_focusBlur {
    keystroke(key, evt) {
        this.cursor.parent.keystroke(key, evt, this.getControllerSelf());
    }
    escapeDir(dir, _key, e) {
        prayDirection(dir);
        var cursor = this.cursor;
        // only prevent default of Tab if not in the root editable
        if (cursor.parent !== this.root)
            e === null || e === void 0 ? void 0 : e.preventDefault();
        // want to be a noop if in the root editable (in fact, Tab has an unrelated
        // default browser action if so)
        if (cursor.parent === this.root)
            return;
        cursor.clearSelection();
        cursor.parent.moveOutOf(dir, cursor);
        cursor.controller.aria.alert();
        return this.notify('move');
    }
    moveDir(dir) {
        prayDirection(dir);
        var cursor = this.cursor, updown = cursor.options.leftRightIntoCmdGoes;
        var cursorDir = cursor[dir];
        if (cursor.selection) {
            cursor.insDirOf(dir, cursor.selection.getEnd(dir));
        }
        else if (cursorDir)
            cursorDir.moveTowards(dir, cursor, updown);
        else
            cursor.parent.moveOutOf(dir, cursor, updown);
        return this.notify('move');
    }
    moveLeft() {
        return this.moveDir(L);
    }
    moveRight() {
        return this.moveDir(R);
    }
    /**
     * moveUp and moveDown have almost identical algorithms:
     * - first check left and right, if so insAtLeft/RightEnd of them
     * - else check the parent's 'upOutOf'/'downOutOf' property:
     *   + if it's a function, call it with the cursor as the sole argument and
     *     use the return value as if it were the value of the property
     *   + if it's a Node, jump up or down into it:
     *     - if there is a cached Point in the block, insert there
     *     - else, seekHoriz within the block to the current x-coordinate (to be
     *       as close to directly above/below the current position as possible)
     *   + unless it's exactly `true`, stop bubbling
     */
    moveUp() {
        return this.moveUpDown('up');
    }
    moveDown() {
        return this.moveUpDown('down');
    }
    moveUpDown(dir) {
        var self = this;
        var cursor = self.notify('upDown').cursor;
        var dirInto;
        var dirOutOf;
        if (dir === 'up') {
            dirInto = 'upInto';
            dirOutOf = 'upOutOf';
        }
        else {
            dirInto = 'downInto';
            dirOutOf = 'downOutOf';
        }
        var cursorL = cursor[L];
        var cursorR = cursor[R];
        var cursorR_dirInto = cursorR && cursorR[dirInto];
        var cursorL_dirInto = cursorL && cursorL[dirInto];
        if (cursorR_dirInto)
            cursor.insAtLeftEnd(cursorR_dirInto);
        else if (cursorL_dirInto)
            cursor.insAtRightEnd(cursorL_dirInto);
        else {
            cursor.parent.bubble(function (ancestor) {
                // TODO - revist this
                var prop = ancestor[dirOutOf];
                if (prop) {
                    if (typeof prop === 'function')
                        prop = prop.call(ancestor, cursor); // TODO - figure out if we need to assign to prop
                    if (prop instanceof MQNode)
                        cursor.jumpUpDown(ancestor, prop);
                    if (prop !== true)
                        return false; // TODO - figure out how this can return true
                }
                return undefined;
            });
        }
        return self;
    }
    deleteDir(dir) {
        prayDirection(dir);
        var cursor = this.cursor;
        var cursorEl = cursor[dir];
        var cursorElParent = cursor.parent.parent;
        var ctrlr = cursor.controller;
        if (cursorEl && cursorEl instanceof MQNode) {
            if (cursorEl.sides) {
                ctrlr.aria.queue(cursorEl.parent
                    .chToCmd(cursorEl.sides[-dir].ch)
                    .mathspeak({ createdLeftOf: cursor }));
                // generally, speak the current element if it has no blocks,
                // but don't for text block commands as the deleteTowards method
                // in the TextCommand class is responsible for speaking the new character under the cursor.
            }
            else if (!cursorEl.blocks && cursorEl.parent.ctrlSeq !== '\\text') {
                ctrlr.aria.queue(cursorEl);
            }
        }
        else if (cursorElParent && cursorElParent instanceof MQNode) {
            if (cursorElParent.sides) {
                ctrlr.aria.queue(cursorElParent.parent
                    .chToCmd(cursorElParent.sides[dir].ch)
                    .mathspeak({ createdLeftOf: cursor }));
            }
            else if (cursorElParent.blocks && cursorElParent.mathspeakTemplate) {
                if (cursorElParent.upInto && cursorElParent.downInto) {
                    // likely a fraction, and we just backspaced over the slash
                    ctrlr.aria.queue(cursorElParent.mathspeakTemplate[1]);
                }
                else {
                    var mst = cursorElParent.mathspeakTemplate;
                    var textToQueue = dir === L ? mst[0] : mst[mst.length - 1];
                    ctrlr.aria.queue(textToQueue);
                }
            }
            else {
                ctrlr.aria.queue(cursorElParent);
            }
        }
        var hadSelection = cursor.selection;
        this.notify('edit'); // deletes selection if present
        if (!hadSelection) {
            const cursorDir = cursor[dir];
            if (cursorDir)
                cursorDir.deleteTowards(dir, cursor);
            else
                cursor.parent.deleteOutOf(dir, cursor);
        }
        const cursorL = cursor[L];
        const cursorR = cursor[R];
        if (cursorL.siblingDeleted)
            cursorL.siblingDeleted(cursor.options, R);
        if (cursorR.siblingDeleted)
            cursorR.siblingDeleted(cursor.options, L);
        cursor.parent.bubble(function (node) {
            node.reflow();
            return undefined;
        });
        return this;
    }
    ctrlDeleteDir(dir) {
        prayDirection(dir);
        var cursor = this.cursor;
        if (!cursor[dir] || cursor.selection)
            return this.deleteDir(dir);
        this.notify('edit');
        var fragRemoved;
        if (dir === L) {
            fragRemoved = new Fragment(cursor.parent.getEnd(L), cursor[L]);
        }
        else {
            fragRemoved = new Fragment(cursor[R], cursor.parent.getEnd(R));
        }
        cursor.controller.aria.queue(fragRemoved);
        fragRemoved.remove();
        cursor.insAtDirEnd(dir, cursor.parent);
        const cursorL = cursor[L];
        const cursorR = cursor[R];
        if (cursorL)
            cursorL.siblingDeleted(cursor.options, R);
        if (cursorR)
            cursorR.siblingDeleted(cursor.options, L);
        cursor.parent.bubble(function (node) {
            node.reflow();
            return undefined;
        });
        return this;
    }
    backspace() {
        return this.deleteDir(L);
    }
    deleteForward() {
        return this.deleteDir(R);
    }
    /**
     * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
     * should only be called by withIncrementalSelection because they must
     * be called in sequence.
     */
    startIncrementalSelection() {
        pray("Multiple selections can't be simultaneously open", !INCREMENTAL_SELECTION_OPEN);
        INCREMENTAL_SELECTION_OPEN = true;
        this.notify('select');
        var cursor = this.cursor;
        if (!cursor.anticursor)
            cursor.startSelection();
    }
    /**
     * Update the selection model, stored in cursor, without modifying
     * selection DOM.
     *
     * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
     * should only be called by withIncrementalSelection because they must
     * be called in sequence.
     */
    selectDirIncremental(dir) {
        pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
        INCREMENTAL_SELECTION_OPEN = true;
        var cursor = this.cursor, seln = cursor.selection;
        prayDirection(dir);
        var node = cursor[dir];
        if (node) {
            // "if node we're selecting towards is inside selection (hence retracting)
            // and is on the *far side* of the selection (hence is only node selected)
            // and the anticursor is *inside* that node, not just on the other side"
            if (seln &&
                seln.getEnd(dir) === node &&
                cursor.anticursor[-dir] !== node) {
                node.unselectInto(dir, cursor);
            }
            else
                node.selectTowards(dir, cursor);
        }
        else
            cursor.parent.selectOutOf(dir, cursor);
    }
    /**
     * Update selection DOM to match cursor model
     *
     * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
     * should only be called by withIncrementalSelection because they must
     * be called in sequence.
     */
    finishIncrementalSelection() {
        pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
        var cursor = this.cursor;
        cursor.clearSelection();
        cursor.select() || cursor.show();
        var selection = cursor.selection;
        if (selection) {
            cursor.controller.aria
                .clear()
                .queue(selection.join('mathspeak', ' ').trim() + ' selected'); // clearing first because selection fires several times, and we don't want repeated speech.
        }
        INCREMENTAL_SELECTION_OPEN = false;
    }
    /**
     * Used to build a selection incrementally in a loop. Calls the passed
     * callback with a selectDir function that may be called many times,
     * and defers updating the view until the incremental selection is
     * complete
     *
     * Wraps up calling
     *
     *     this.startSelection()
     *     this.selectDirIncremental(dir) // possibly many times
     *     this.finishSelection()
     *
     * with extra error handling and invariant enforcement
     */
    withIncrementalSelection(cb) {
        try {
            this.startIncrementalSelection();
            try {
                cb((dir) => this.selectDirIncremental(dir));
            }
            finally {
                // Since we have started a selection, attempt to finish it even
                // if the callback throws an error
                this.finishIncrementalSelection();
            }
        }
        finally {
            // Mark selection as closed even if finishSelection throws an
            // error. Makes a possible error in finishSelection more
            // recoverable
            INCREMENTAL_SELECTION_OPEN = false;
        }
    }
    /**
     * Grow selection one unit in the given direction
     *
     * Note, this should not be called in a loop. To incrementally grow a
     * selection, use withIncrementalSelection
     */
    selectDir(dir) {
        this.withIncrementalSelection((selectDir) => selectDir(dir));
    }
    selectLeft() {
        return this.selectDir(L);
    }
    selectRight() {
        return this.selectDir(R);
    }
    selectAll() {
        this.notify('move');
        const cursor = this.cursor;
        cursor.insAtRightEnd(this.root);
        this.withIncrementalSelection((selectDir) => {
            while (cursor[L])
                selectDir(L);
        });
    }
    selectToBlockEndInDir(dir) {
        const cursor = this.cursor;
        this.withIncrementalSelection((selectDir) => {
            while (cursor[dir])
                selectDir(dir);
        });
    }
    selectToRootEndInDir(dir) {
        const cursor = this.cursor;
        this.withIncrementalSelection((selectDir) => {
            while (cursor[dir] || cursor.parent !== this.root) {
                selectDir(dir);
            }
        });
    }
}
class TempSingleCharNode extends MQNode {
    constructor(_char) {
        super();
    }
}
// Parser MathBlock
var latexMathParser = (function () {
    function commandToBlock(cmd) {
        // can also take in a Fragment
        var block = new MathBlock();
        cmd.adopt(block, 0, 0);
        return block;
    }
    function joinBlocks(blocks) {
        var firstBlock = blocks[0] || new MathBlock();
        for (var i = 1; i < blocks.length; i += 1) {
            blocks[i].children().adopt(firstBlock, firstBlock.getEnd(R), 0);
        }
        return firstBlock;
    }
    var string = Parser.string;
    var regex = Parser.regex;
    var letter = Parser.letter;
    var digit = Parser.digit;
    var any = Parser.any;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var fail = Parser.fail;
    // Parsers yielding either MathCommands, or Fragments of MathCommands
    //   (either way, something that can be adopted by a MathBlock)
    var variable = letter.map(function (c) {
        return new Letter(c);
    });
    var number = digit.map(function (c) {
        return new Digit(c);
    });
    var symbol = regex(/^[^${}\\_^]/).map(function (c) {
        return new VanillaSymbol(c);
    });
    var controlSequence = regex(/^[^\\a-eg-zA-Z]/) // hotfix #164; match MathBlock::write
        .or(string('\\').then(regex(/^[a-z]+/i)
        .or(regex(/^\s+/).result(' '))
        .or(any)))
        .then(function (ctrlSeq) {
        // TODO - is Parser<MQNode> correct?
        var cmdKlass = LatexCmds[ctrlSeq];
        if (cmdKlass) {
            if (cmdKlass.constructor) {
                var actualClass = cmdKlass; // TODO - figure out how to know the difference
                return new actualClass(ctrlSeq).parser();
            }
            else {
                var builder = cmdKlass; // TODO - figure out how to know the difference
                return builder(ctrlSeq).parser();
            }
        }
        else {
            return fail('unknown command: \\' + ctrlSeq);
        }
    });
    var command = controlSequence.or(variable).or(number).or(symbol);
    // Parsers yielding MathBlocks
    var mathGroup = string('{')
        .then(function () {
        return mathSequence;
    })
        .skip(string('}'));
    var mathBlock = optWhitespace.then(mathGroup.or(command.map(commandToBlock)));
    var mathSequence = mathBlock.many().map(joinBlocks).skip(optWhitespace);
    var optMathBlock = string('[')
        .then(mathBlock
        .then(function (block) {
        return block.join('latex') !== ']' ? succeed(block) : fail('');
    })
        .many()
        .map(joinBlocks)
        .skip(optWhitespace))
        .skip(string(']'));
    var latexMath = mathSequence;
    latexMath.block = mathBlock;
    latexMath.optBlock = optMathBlock;
    return latexMath;
})();
baseOptionProcessors.maxDepth = function (depth) {
    return typeof depth === 'number' ? depth : undefined;
};
class Controller_latex extends Controller_keystroke {
    cleanLatex(latex) {
        //prune unnecessary spaces
        return latex.replace(/(\\[a-z]+) (?![a-z])/gi, '$1');
    }
    exportLatex() {
        return this.cleanLatex(this.root.latex());
    }
    writeLatex(latex) {
        var cursor = this.notify('edit').cursor;
        cursor.parent.writeLatex(cursor, latex);
        return this;
    }
    exportLatexSelection() {
        var ctx = {
            latex: '',
            startIndex: -1,
            endIndex: -1,
        };
        var selection = this.cursor.selection;
        if (selection) {
            ctx.startSelectionBefore = selection.getEnd(L);
            ctx.endSelectionAfter = selection.getEnd(R);
        }
        else {
            var cursorL = this.cursor[L];
            if (cursorL) {
                ctx.startSelectionAfter = cursorL;
            }
            else {
                ctx.startSelectionBefore = this.cursor.parent;
            }
            var cursorR = this.cursor[R];
            if (cursorR) {
                ctx.endSelectionBefore = cursorR;
            }
            else {
                ctx.endSelectionAfter = this.cursor.parent;
            }
        }
        this.root.latexRecursive(ctx);
        // need to clean the latex
        var originalLatex = ctx.latex;
        var cleanLatex = this.cleanLatex(originalLatex);
        var startIndex = ctx.startIndex;
        var endIndex = ctx.endIndex;
        // assumes that the cleaning process will only remove characters. We
        // run through the originalLatex and cleanLatex to find differences.
        // when we find differences we see how many characters are dropped until
        // we sync back up. While detecting missing characters we decrement the
        // startIndex and endIndex if appropriate.
        var j = 0;
        for (var i = 0; i < ctx.endIndex; i++) {
            if (originalLatex[i] !== cleanLatex[j]) {
                if (i < ctx.startIndex) {
                    startIndex -= 1;
                }
                endIndex -= 1;
                // do not increment j. We wan to keep looking at this same
                // cleanLatex character until we find it in the originalLatex
            }
            else {
                j += 1; //move to next cleanLatex character
            }
        }
        return {
            latex: cleanLatex,
            startIndex: startIndex,
            endIndex: endIndex,
        };
    }
    classifyLatexForEfficientUpdate(latex) {
        if (typeof latex !== 'string')
            return;
        var matches = latex.match(/-?[0-9.]+$/g);
        if (matches && matches.length === 1) {
            return {
                latex: latex,
                prefix: latex.substr(0, latex.length - matches[0].length),
                digits: matches[0],
            };
        }
        return;
    }
    updateLatexMathEfficiently(latex, oldLatex) {
        // Note, benchmark/update.html is useful for measuring the
        // performance of renderLatexMathEfficiently
        var root = this.root;
        var oldClassification;
        var classification = this.classifyLatexForEfficientUpdate(latex);
        if (classification) {
            oldClassification = this.classifyLatexForEfficientUpdate(oldLatex);
            if (!oldClassification ||
                oldClassification.prefix !== classification.prefix) {
                return false;
            }
        }
        else {
            return false;
        }
        // check if minus sign is changing
        var oldDigits = oldClassification.digits;
        var newDigits = classification.digits;
        var oldMinusSign = false;
        var newMinusSign = false;
        if (oldDigits[0] === '-') {
            oldMinusSign = true;
            oldDigits = oldDigits.substr(1);
        }
        if (newDigits[0] === '-') {
            newMinusSign = true;
            newDigits = newDigits.substr(1);
        }
        // start at the very end
        var charNode = this.root.getEnd(R);
        var oldCharNodes = [];
        for (var i = oldDigits.length - 1; i >= 0; i--) {
            // the tree does not match what we expect
            if (!charNode || charNode.ctrlSeq !== oldDigits[i]) {
                return false;
            }
            // the trailing digits are not just under the root. We require the root
            // to be the parent so that we can be sure we do not need a reflow to
            // grow parens.
            if (charNode.parent !== root) {
                return false;
            }
            // push to the start. We're traversing backwards
            oldCharNodes.unshift(charNode);
            // move left one character
            charNode = charNode[L];
        }
        // remove the minus sign
        if (oldMinusSign && !newMinusSign) {
            var oldMinusNode = charNode;
            if (!oldMinusNode)
                return false;
            if (oldMinusNode.ctrlSeq !== '-')
                return false;
            if (oldMinusNode[R] !== oldCharNodes[0])
                return false;
            if (oldMinusNode.parent !== root)
                return false;
            const oldMinusNodeL = oldMinusNode[L];
            if (oldMinusNodeL && oldMinusNodeL.parent !== root)
                return false;
            oldCharNodes[0][L] = oldMinusNode[L];
            if (root.getEnd(L) === oldMinusNode) {
                root.setEnds({ [L]: oldCharNodes[0], [R]: root.getEnd(R) });
            }
            if (oldMinusNodeL)
                oldMinusNodeL[R] = oldCharNodes[0];
            oldMinusNode.domFrag().remove();
        }
        // add a minus sign
        if (!oldMinusSign && newMinusSign) {
            var newMinusNode = new PlusMinus('-');
            var minusSpan = document.createElement('span');
            minusSpan.textContent = '-';
            newMinusNode.setDOM(minusSpan);
            var oldCharNodes0L = oldCharNodes[0][L];
            if (oldCharNodes0L)
                oldCharNodes0L[R] = newMinusNode;
            if (root.getEnd(L) === oldCharNodes[0]) {
                root.setEnds({ [L]: newMinusNode, [R]: root.getEnd(R) });
            }
            newMinusNode.parent = root;
            newMinusNode[L] = oldCharNodes[0][L];
            newMinusNode[R] = oldCharNodes[0];
            oldCharNodes[0][L] = newMinusNode;
            newMinusNode.contactWeld(this.cursor); // decide if binary operator
            newMinusNode.domFrag().insertBefore(oldCharNodes[0].domFrag());
        }
        // update the text of the current nodes
        var commonLength = Math.min(oldDigits.length, newDigits.length);
        for (i = 0; i < commonLength; i++) {
            var newText = newDigits[i];
            charNode = oldCharNodes[i];
            if (charNode.ctrlSeq !== newText) {
                charNode.ctrlSeq = newText;
                charNode.domFrag().oneElement().textContent = newText;
                charNode.mathspeakName = newText;
            }
        }
        // remove the extra digits at the end
        if (oldDigits.length > newDigits.length) {
            charNode = oldCharNodes[newDigits.length - 1];
            root.setEnds({ [L]: root.getEnd(L), [R]: charNode });
            charNode[R] = 0;
            for (i = oldDigits.length - 1; i >= commonLength; i--) {
                oldCharNodes[i].domFrag().remove();
            }
        }
        // add new digits after the existing ones
        if (newDigits.length > oldDigits.length) {
            var frag = document.createDocumentFragment();
            for (i = commonLength; i < newDigits.length; i++) {
                var span = document.createElement('span');
                span.className = 'mq-digit';
                span.textContent = newDigits[i];
                var newNode = new Digit(newDigits[i]);
                newNode.parent = root;
                newNode.setDOM(span);
                frag.appendChild(span);
                // splice this node in
                newNode[L] = root.getEnd(R);
                newNode[R] = 0;
                const newNodeL = newNode[L];
                newNodeL[R] = newNode;
                root.setEnds({ [L]: root.getEnd(L), [R]: newNode });
            }
            root.domFrag().oneElement().appendChild(frag);
        }
        var currentLatex = this.exportLatex();
        if (currentLatex !== latex) {
            console.warn('tried updating latex efficiently but did not work. Attempted: ' +
                latex +
                ' but wrote: ' +
                currentLatex);
            return false;
        }
        var rightMost = root.getEnd(R);
        if (rightMost) {
            rightMost.fixDigitGrouping(this.cursor.options);
        }
        return true;
    }
    renderLatexMathFromScratch(latex) {
        var root = this.root, cursor = this.cursor;
        var all = Parser.all;
        var eof = Parser.eof;
        var block = latexMathParser
            .skip(eof)
            .or(all.result(false))
            .parse(latex);
        root.setEnds({ [L]: 0, [R]: 0 });
        if (block) {
            block.children().adopt(root, 0, 0);
        }
        if (block) {
            const frag = root.domFrag();
            frag.children().remove();
            frag.oneElement().appendChild(block.html());
            root.finalizeInsert(cursor.options, cursor);
        }
        else {
            root.domFrag().empty();
        }
    }
    renderLatexMath(latex) {
        var cursor = this.cursor;
        var root = this.root;
        this.notify('replace');
        cursor.clearSelection();
        var oldLatex = this.exportLatex();
        if (!root.getEnd(L) || !root.getEnd(R) || oldLatex !== latex) {
            this.updateLatexMathEfficiently(latex, oldLatex) ||
                this.renderLatexMathFromScratch(latex);
            this.updateMathspeak();
        }
        cursor.insAtRightEnd(root);
    }
    renderLatexText(latex) {
        var root = this.root, cursor = this.cursor;
        root.domFrag().children().slice(1).remove();
        root.setEnds({ [L]: 0, [R]: 0 });
        delete cursor.selection;
        cursor.show().insAtRightEnd(root);
        var regex = Parser.regex;
        var string = Parser.string;
        var eof = Parser.eof;
        var all = Parser.all;
        // Parser RootMathCommand
        var mathMode = string('$')
            .then(latexMathParser)
            // because TeX is insane, math mode doesn't necessarily
            // have to end.  So we allow for the case that math mode
            // continues to the end of the stream.
            .skip(string('$').or(eof))
            .map(function (block) {
            // HACK FIXME: this shouldn't have to have access to cursor
            var rootMathCommand = new RootMathCommand(cursor);
            rootMathCommand.createBlocks();
            var rootMathBlock = rootMathCommand.getEnd(L);
            block.children().adopt(rootMathBlock, 0, 0);
            return rootMathCommand;
        });
        var escapedDollar = string('\\$').result('$');
        var textChar = escapedDollar
            .or(regex(/^[^$]/))
            .map((ch) => new VanillaSymbol(ch));
        var latexText = mathMode.or(textChar).many();
        var commands = latexText
            .skip(eof)
            .or(all.result(false))
            .parse(latex);
        if (commands) {
            for (var i = 0; i < commands.length; i += 1) {
                commands[i].adopt(root, root.getEnd(R), 0);
            }
            domFrag(root.html()).appendTo(root.domFrag().oneElement());
            root.finalizeInsert(cursor.options, cursor);
        }
    }
}
/********************************************************
 * Deals with mouse events for clicking, drag-to-select
 *******************************************************/
const ignoreNextMouseDownNoop = (_el) => {
    return false;
};
Options.prototype.ignoreNextMousedown = ignoreNextMouseDownNoop;
// Whenever edits to the tree occur, in-progress selection events
// must be invalidated and selection changes must not be applied to
// the edited tree. cancelSelectionOnEdit takes care of this.
var cancelSelectionOnEdit;
(function () {
    ControllerBase.onNotify(function (cursor, e) {
        if (e === 'edit' || e === 'replace') {
            // this will be called any time ANY mathquill is edited. We only want
            // to cancel selection if the selection is happening within the mathquill
            // that dispatched the notify. Otherwise you won't be able to select any
            // mathquills while a slider is playing.
            if (cancelSelectionOnEdit && cancelSelectionOnEdit.cursor === cursor) {
                cancelSelectionOnEdit.cb();
            }
        }
    });
})();
class Controller_mouse extends Controller_latex {
    constructor() {
        super(...arguments);
        this.handleMouseDown = (e) => {
            const rootElement = closest(e.target, '.mq-root-block');
            var root = ((rootElement && NodeBase.getNodeOfElement(rootElement)) ||
                NodeBase.getNodeOfElement(this.root.domFrag().oneElement()));
            const ownerDocument = root.domFrag().firstNode().ownerDocument;
            var ctrlr = root.controller, cursor = ctrlr.cursor, blink = cursor.blink;
            var textareaSpan = ctrlr.getTextareaSpanOrThrow();
            var textarea = ctrlr.getTextareaOrThrow();
            e.preventDefault(); // doesn't work in IE\u22648, but it's a one-line fix:
            e.target.unselectable = true; // http://jsbin.com/yagekiji/1 // TODO - no idea what this unselectable property is
            if (cursor.options.ignoreNextMousedown(e))
                return;
            // some elements should not act like internal mathquill nodes. Tokens for instance define external
            // click / hover behaviors. So we have mathquill act like the item was never clicked. This allows
            // us to click a token without putting focus in the mathquill.
            if (closest(e.target, '.mq-ignore-mousedown')) {
                return;
            }
            var lastMousemoveTarget = null;
            function mousemove(e) {
                lastMousemoveTarget = e.target;
            }
            function onDocumentMouseMove(e) {
                if (!cursor.anticursor)
                    cursor.startSelection();
                ctrlr.seek(lastMousemoveTarget, e.clientX, e.clientY).cursor.select();
                if (cursor.selection)
                    cursor.controller.aria
                        .clear()
                        .queue(cursor.selection.join('mathspeak') + ' selected')
                        .alert();
                lastMousemoveTarget = null;
            }
            // outside rootElement, the MathQuill node corresponding to the target (if any)
            // won't be inside this root, so don't mislead Controller::seek with it
            function unbindListeners() {
                // delete the mouse handlers now that we're not dragging anymore
                rootElement === null || rootElement === void 0 ? void 0 : rootElement.removeEventListener('mousemove', mousemove);
                ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.removeEventListener('mousemove', onDocumentMouseMove);
                ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.removeEventListener('mouseup', onDocumentMouseUp);
                cancelSelectionOnEdit = undefined;
            }
            function updateCursor() {
                if (ctrlr.editable) {
                    cursor.show();
                    cursor.controller.aria.queue(cursor.parent).alert();
                }
                else {
                    domFrag(textareaSpan).detach();
                }
            }
            function onDocumentMouseUp() {
                cursor.blink = blink;
                if (!cursor.selection)
                    updateCursor();
                unbindListeners();
            }
            var wasEdited;
            cancelSelectionOnEdit = {
                cursor: cursor,
                cb: function () {
                    // If an edit happens while the mouse is down, the existing
                    // selection is no longer valid. Clear it and unbind listeners,
                    // similar to what happens on mouseup.
                    wasEdited = true;
                    cursor.blink = blink;
                    cursor.clearSelection();
                    updateCursor();
                    unbindListeners();
                },
            };
            if (ctrlr.blurred) {
                if (rootElement && !ctrlr.editable) {
                    domFrag(rootElement).prepend(domFrag(textareaSpan));
                }
                textarea.focus();
                // focus call may bubble to clients, who may then write to
                // mathquill, triggering cancelSelectionOnEdit. If that happens, we
                // don't want to stop the cursor blink or bind listeners,
                // so return early.
                if (wasEdited)
                    return;
            }
            cursor.blink = noop;
            ctrlr
                .seek(e.target, e.clientX, e.clientY)
                .cursor.startSelection();
            rootElement === null || rootElement === void 0 ? void 0 : rootElement.addEventListener('mousemove', mousemove);
            ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.addEventListener('mousemove', onDocumentMouseMove);
            ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.addEventListener('mouseup', onDocumentMouseUp);
            // listen on document not just body to not only hear about mousemove and
            // mouseup on page outside field, but even outside page, except iframes: https://github.com/mathquill/mathquill/commit/8c50028afcffcace655d8ae2049f6e02482346c5#commitcomment-6175800
        };
    }
    addMouseEventListener() {
        //drag-to-select event handling
        this.container.addEventListener('mousedown', this.handleMouseDown);
    }
    removeMouseEventListener() {
        this.container.removeEventListener('mousedown', this.handleMouseDown);
    }
    seek(targetElm, clientX, _clientY) {
        var cursor = this.notify('select').cursor;
        var node;
        // we can click on an element that is deeply nested past the point
        // that mathquill knows about. We need to traverse up to the first
        // node that mathquill is aware of
        while (targetElm) {
            // try to find the MQ Node associated with the DOM Element
            node = NodeBase.getNodeOfElement(targetElm);
            if (node)
                break;
            // must be too deep, traverse up to the parent DOM Element
            targetElm = targetElm.parentElement;
        }
        // Could not find any nodes, just use the root
        if (!node) {
            node = this.root;
        }
        // don't clear selection until after getting node from target, in case
        // target was selection span, otherwise target will have no parent and will
        // seek from root, which is less accurate (e.g. fraction)
        cursor.clearSelection().show();
        node.seek(clientX, cursor);
        this.scrollHoriz(); // before .selectFrom when mouse-selecting, so
        // always hits no-selection case in scrollHoriz and scrolls slower
        return this;
    }
}
/***********************************************
 * Horizontal panning for editable fields that
 * overflow their width
 **********************************************/
class Controller_scrollHoriz extends Controller_mouse {
    setOverflowClasses() {
        var root = this.root.domFrag().oneElement();
        var shouldHaveOverflowRight = false;
        var shouldHaveOverflowLeft = false;
        if (!this.blurred) {
            var width = getBoundingClientRect(root).width;
            var scrollWidth = root.scrollWidth;
            var scroll = root.scrollLeft;
            shouldHaveOverflowRight = scrollWidth > width + scroll;
            shouldHaveOverflowLeft = scroll > 0;
        }
        if (root.classList.contains('mq-editing-overflow-right') !==
            shouldHaveOverflowRight)
            root.classList.toggle('mq-editing-overflow-right');
        if (root.classList.contains('mq-editing-overflow-left') !==
            shouldHaveOverflowLeft)
            root.classList.toggle('mq-editing-overflow-left');
    }
    scrollHoriz() {
        var cursor = this.cursor, seln = cursor.selection;
        var rootRect = getBoundingClientRect(this.root.domFrag().oneElement());
        if (cursor.domFrag().isEmpty() && !seln) {
            if (this.cancelScrollHoriz) {
                this.cancelScrollHoriz();
                this.cancelScrollHoriz = undefined;
            }
            const rootElt = this.root.domFrag().oneElement();
            const start = rootElt.scrollLeft;
            animate(this.getScrollAnimationDuration(), (progress, scheduleNext, cancel) => {
                if (progress >= 1) {
                    this.cancelScrollHoriz = undefined;
                    rootElt.scrollLeft = 0;
                    this.setOverflowClasses();
                }
                else {
                    this.cancelScrollHoriz = cancel;
                    scheduleNext();
                    rootElt.scrollLeft = Math.round((1 - progress) * start);
                }
            });
            return;
        }
        else if (!seln) {
            var x = getBoundingClientRect(cursor.domFrag().oneElement()).left;
            if (x > rootRect.right - 20)
                var scrollBy = x - (rootRect.right - 20);
            else if (x < rootRect.left + 20)
                var scrollBy = x - (rootRect.left + 20);
            else
                return;
        }
        else {
            var rect = getBoundingClientRect(seln.domFrag().oneElement());
            var overLeft = rect.left - (rootRect.left + 20);
            var overRight = rect.right - (rootRect.right - 20);
            if (seln.getEnd(L) === cursor[R]) {
                if (overLeft < 0)
                    var scrollBy = overLeft;
                else if (overRight > 0) {
                    if (rect.left - overRight < rootRect.left + 20)
                        var scrollBy = overLeft;
                    else
                        var scrollBy = overRight;
                }
                else
                    return;
            }
            else {
                if (overRight > 0)
                    var scrollBy = overRight;
                else if (overLeft < 0) {
                    if (rect.right - overLeft > rootRect.right - 20)
                        var scrollBy = overRight;
                    else
                        var scrollBy = overLeft;
                }
                else
                    return;
            }
        }
        var root = this.root.domFrag().oneElement();
        if (scrollBy < 0 && root.scrollLeft === 0)
            return;
        if (scrollBy > 0 && root.scrollWidth <= root.scrollLeft + rootRect.width)
            return;
        if (this.cancelScrollHoriz) {
            this.cancelScrollHoriz();
            this.cancelScrollHoriz = undefined;
        }
        const rootElt = this.root.domFrag().oneElement();
        const start = rootElt.scrollLeft;
        animate(this.getScrollAnimationDuration(), (progress, scheduleNext, cancel) => {
            if (progress >= 1) {
                this.cancelScrollHoriz = undefined;
                rootElt.scrollLeft = Math.round(start + scrollBy);
                this.setOverflowClasses();
            }
            else {
                this.cancelScrollHoriz = cancel;
                scheduleNext();
                rootElt.scrollLeft = Math.round(start + progress * scrollBy);
            }
        });
    }
    getScrollAnimationDuration() {
        var _c;
        return (_c = this.options.scrollAnimationDuration) !== null && _c !== void 0 ? _c : 100;
    }
}
/*********************************************
 * Manage the MathQuill instance's textarea
 * (as owned by the Controller)
 ********************************************/
Options.prototype.substituteTextarea = function () {
    return h('textarea', {
        autocapitalize: 'off',
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: false,
        'x-palm-disable-ste-all': true,
    });
};
function defaultSubstituteKeyboardEvents(jq, controller) {
    return saneKeyboardEvents(jq[0], controller);
}
Options.prototype.substituteKeyboardEvents = defaultSubstituteKeyboardEvents;
class Controller extends Controller_scrollHoriz {
    constructor() {
        super(...arguments);
        this.selectFn = noop;
    }
    createTextarea() {
        this.textareaSpan = h('span', { class: 'mq-textarea' });
        const textarea = this.options.substituteTextarea();
        if (!textarea.nodeType) {
            throw 'substituteTextarea() must return a DOM element, got ' + textarea;
        }
        this.textarea = domFrag(textarea)
            .appendTo(this.textareaSpan)
            .oneElement();
        var ctrlr = this;
        ctrlr.cursor.selectionChanged = function () {
            ctrlr.selectionChanged();
        };
    }
    selectionChanged() {
        var ctrlr = this;
        // throttle calls to setTextareaSelection(), because setting textarea.value
        // and/or calling textarea.select() can have anomalously bad performance:
        // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
        //
        // Note, this timeout may be cleared by the blur handler in focusBlur.js
        if (!ctrlr.textareaSelectionTimeout) {
            ctrlr.textareaSelectionTimeout = setTimeout(function () {
                ctrlr.setTextareaSelection();
            });
        }
    }
    setTextareaSelection() {
        this.textareaSelectionTimeout = 0;
        var latex = '';
        if (this.cursor.selection) {
            //cleanLatex prunes unnecessary spaces. defined in latex.js
            latex = this.cleanLatex(this.cursor.selection.join('latex'));
            if (this.options.statelessClipboard) {
                // FIXME: like paste, only this works for math fields; should ask parent
                latex = '$' + latex + '$';
            }
        }
        this.selectFn(latex);
    }
    staticMathTextareaEvents() {
        var ctrlr = this;
        this.removeTextareaEventListener('cut');
        this.removeTextareaEventListener('paste');
        if (ctrlr.options.disableCopyPaste) {
            this.removeTextareaEventListener('copy');
        }
        else {
            this.addTextareaEventListeners({
                copy: function () {
                    ctrlr.setTextareaSelection();
                },
            });
        }
        this.addStaticFocusBlurListeners();
        ctrlr.selectFn = function (text) {
            const textarea = ctrlr.getTextareaOrThrow();
            if (!(textarea instanceof HTMLTextAreaElement))
                return;
            textarea.value = text;
            if (text)
                textarea.select();
        };
    }
    editablesTextareaEvents() {
        var ctrlr = this;
        const textarea = ctrlr.getTextareaOrThrow();
        const textareaSpan = ctrlr.getTextareaSpanOrThrow();
        if (this.options.version < 3) {
            const $ = this.options.assertJquery();
            var keyboardEventsShim = this.options.substituteKeyboardEvents($(textarea), this);
            this.selectFn = function (text) {
                keyboardEventsShim.select(text);
            };
        }
        else {
            const { select } = saneKeyboardEvents(textarea, this);
            this.selectFn = select;
        }
        domFrag(this.container).prepend(domFrag(textareaSpan));
        this.addEditableFocusBlurListeners();
        this.updateMathspeak();
    }
    unbindEditablesEvents() {
        var ctrlr = this;
        const textarea = ctrlr.getTextareaOrThrow();
        const textareaSpan = ctrlr.getTextareaSpanOrThrow();
        this.selectFn = function (text) {
            if (!(textarea instanceof HTMLTextAreaElement))
                return;
            textarea.value = text;
            if (text)
                textarea.select();
        };
        domFrag(textareaSpan).remove();
        this.removeTextareaEventListener('focus');
        this.removeTextareaEventListener('blur');
        ctrlr.blurred = true;
        this.removeTextareaEventListener('cut');
        this.removeTextareaEventListener('paste');
    }
    typedText(ch) {
        if (ch === '\n')
            return this.handle('enter');
        var cursor = this.notify(undefined).cursor;
        cursor.parent.write(cursor, ch);
        this.scrollHoriz();
    }
    cut() {
        var ctrlr = this, cursor = ctrlr.cursor;
        if (cursor.selection) {
            setTimeout(function () {
                ctrlr.notify('edit'); // deletes selection if present
                cursor.parent.bubble(function (node) {
                    node.reflow();
                    return undefined;
                });
                if (ctrlr.options && ctrlr.options.onCut) {
                    ctrlr.options.onCut();
                }
            });
        }
    }
    copy() {
        this.setTextareaSelection();
    }
    paste(text) {
        // TODO: document `statelessClipboard` config option in README, after
        // making it work like it should, that is, in both text and math mode
        // (currently only works in math fields, so worse than pointless, it
        //  only gets in the way by \text{}-ifying pasted stuff and $-ifying
        //  cut/copied LaTeX)
        if (this.options.statelessClipboard) {
            if (text.slice(0, 1) === '$' && text.slice(-1) === '$') {
                text = text.slice(1, -1);
            }
            else {
                text = '\\text{' + text + '}';
            }
        }
        // FIXME: this always inserts math or a TextBlock, even in a RootTextBlock
        this.writeLatex(text).cursor.show();
        this.scrollHoriz();
        if (this.options && this.options.onPaste) {
            this.options.onPaste();
        }
    }
    /** Set up for a static MQ field (i.e., create and attach the mathspeak element and initialize the focus state to blurred) */
    setupStaticField() {
        this.mathspeakSpan = h('span', { class: 'mq-mathspeak' });
        domFrag(this.container).prepend(domFrag(this.mathspeakSpan));
        this.updateMathspeak();
        this.blurred = true;
        this.cursor.hide().parent.blur(this.cursor);
    }
    updateMathspeak() {
        var ctrlr = this;
        // If the controller's ARIA label doesn't end with a punctuation mark, add a colon by default to better separate it from mathspeak.
        var ariaLabel = ctrlr.getAriaLabel();
        var labelWithSuffix = /[A-Za-z0-9]$/.test(ariaLabel)
            ? ariaLabel + ':'
            : ariaLabel;
        var mathspeak = ctrlr.root.mathspeak().trim();
        this.aria.clear();
        const textarea = ctrlr.getTextareaOrThrow();
        // For static math, provide mathspeak in a visually hidden span to allow screen readers and other AT to traverse the content.
        // For editable math, assign the mathspeak to the textarea's ARIA label (AT can use text navigation to interrogate the content).
        // Be certain to include the mathspeak for only one of these, though, as we don't want to include outdated labels if a field's editable state changes.
        // By design, also take careful note that the ariaPostLabel is meant to exist only for editable math (e.g. to serve as an evaluation or error message)
        // so it is not included for static math mathspeak calculations.
        // The mathspeakSpan should exist only for static math, so we use its presence to decide which approach to take.
        if (!!ctrlr.mathspeakSpan) {
            textarea.setAttribute('aria-label', '');
            ctrlr.mathspeakSpan.textContent = (labelWithSuffix +
                ' ' +
                mathspeak).trim();
        }
        else {
            textarea.setAttribute('aria-label', (labelWithSuffix + ' ' + mathspeak + ' ' + ctrlr.ariaPostLabel).trim());
        }
    }
}
/*************************************************
 * Abstract classes of math blocks and commands.
 ************************************************/
/**
 * Math tree node base class.
 * Some math-tree-specific extensions to MQNode.
 * Both MathBlock's and MathCommand's descend from it.
 */
class MathElement extends MQNode {
    finalizeInsert(options, cursor) {
        var self = this;
        self.postOrder(function (node) {
            node.finalizeTree(options);
        });
        self.postOrder(function (node) {
            node.contactWeld(cursor);
        });
        // note: this order is important.
        // empty elements need the empty box provided by blur to
        // be present in order for their dimensions to be measured
        // correctly by 'reflow' handlers.
        self.postOrder(function (node) {
            node.blur(cursor);
        });
        self.postOrder(function (node) {
            node.reflow();
        });
        var selfR = self[R];
        var selfL = self[L];
        if (selfR)
            selfR.siblingCreated(options, L);
        if (selfL)
            selfL.siblingCreated(options, R);
        self.bubble(function (node) {
            node.reflow();
            return undefined;
        });
    }
    // If the maxDepth option is set, make sure
    // deeply nested content is truncated. Just return
    // false if the cursor is already too deep.
    prepareInsertionAt(cursor) {
        var maxDepth = cursor.options.maxDepth;
        if (maxDepth !== undefined) {
            var cursorDepth = cursor.depth();
            if (cursorDepth > maxDepth) {
                return false;
            }
            this.removeNodesDeeperThan(maxDepth - cursorDepth);
        }
        return true;
    }
    // Remove nodes that are more than `cutoff`
    // blocks deep from this node.
    removeNodesDeeperThan(cutoff) {
        var depth = 0;
        var queue = [[this, depth]];
        var current;
        // Do a breadth-first search of this node's descendants
        // down to cutoff, removing anything deeper.
        while ((current = queue.shift())) {
            var c = current;
            c[0].children().each(function (child) {
                var i = child instanceof MathBlock ? 1 : 0;
                depth = c[1] + i;
                if (depth <= cutoff) {
                    queue.push([child, depth]);
                }
                else {
                    (i ? child.children() : child).remove();
                }
                return undefined;
            });
        }
    }
}
class DOMView {
    constructor(childCount, render) {
        this.childCount = childCount;
        this.render = render;
    }
}
/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
class MathCommand extends MathElement {
    constructor(ctrlSeq, domView, textTemplate) {
        super();
        this.textTemplate = [''];
        this.mathspeakTemplate = [''];
        this.setCtrlSeqHtmlAndText(ctrlSeq, domView, textTemplate);
    }
    setEnds(ends) {
        pray('MathCommand ends are never empty', ends[L] && ends[R]);
        this.ends = ends;
    }
    getEnd(dir) {
        return this.ends[dir];
    }
    setCtrlSeqHtmlAndText(ctrlSeq, domView, textTemplate) {
        if (!this.ctrlSeq)
            this.ctrlSeq = ctrlSeq;
        if (domView)
            this.domView = domView;
        if (textTemplate)
            this.textTemplate = textTemplate;
    }
    // obvious methods
    replaces(replacedFragment) {
        replacedFragment.disown();
        this.replacedFragment = replacedFragment;
    }
    isEmpty() {
        return this.foldChildren(true, function (isEmpty, child) {
            return isEmpty && child.isEmpty();
        });
    }
    parser() {
        var block = latexMathParser.block;
        return block.times(this.numBlocks()).map((blocks) => {
            this.blocks = blocks;
            for (var i = 0; i < blocks.length; i += 1) {
                blocks[i].adopt(this, this.getEnd(R), 0);
            }
            return this;
        });
    }
    // createLeftOf(cursor) and the methods it calls
    createLeftOf(cursor) {
        var cmd = this;
        var replacedFragment = cmd.replacedFragment;
        cmd.createBlocks();
        super.createLeftOf(cursor);
        if (replacedFragment) {
            const cmdEndsL = cmd.getEnd(L);
            replacedFragment.adopt(cmdEndsL, 0, 0);
            replacedFragment.domFrag().appendTo(cmdEndsL.domFrag().oneElement());
            cmd.placeCursor(cursor);
            cmd.prepareInsertionAt(cursor);
        }
        cmd.finalizeInsert(cursor.options, cursor);
        cmd.placeCursor(cursor);
    }
    createBlocks() {
        var cmd = this, numBlocks = cmd.numBlocks(), blocks = (cmd.blocks = Array(numBlocks));
        for (var i = 0; i < numBlocks; i += 1) {
            var newBlock = (blocks[i] = new MathBlock());
            newBlock.adopt(cmd, cmd.getEnd(R), 0);
        }
    }
    placeCursor(cursor) {
        //insert the cursor at the right end of the first empty child, searching
        //left-to-right, or if none empty, the right end child
        cursor.insAtRightEnd(this.foldChildren(this.getEnd(L), function (leftward, child) {
            return leftward.isEmpty() ? leftward : child;
        }));
    }
    // editability methods: called by the cursor for editing, cursor movements,
    // and selection of the MathQuill tree, these all take in a direction and
    // the cursor
    moveTowards(dir, cursor, updown) {
        var updownInto;
        if (updown === 'up') {
            updownInto = this.upInto;
        }
        else if (updown === 'down') {
            updownInto = this.downInto;
        }
        const el = updownInto || this.getEnd(-dir);
        cursor.insAtDirEnd(-dir, el);
        cursor.controller.aria
            .queueDirEndOf(-dir)
            .queue(cursor.parent, true);
    }
    deleteTowards(dir, cursor) {
        if (this.isEmpty())
            cursor[dir] = this.remove()[dir];
        else
            this.moveTowards(dir, cursor);
    }
    selectTowards(dir, cursor) {
        cursor[-dir] = this;
        cursor[dir] = this[dir];
    }
    selectChildren() {
        return new MQSelection(this, this);
    }
    unselectInto(dir, cursor) {
        const antiCursor = cursor.anticursor;
        const ancestor = antiCursor.ancestors[this.id];
        cursor.insAtDirEnd(-dir, ancestor);
    }
    seek(clientX, cursor) {
        function getBounds(node) {
            const el = node.domFrag().oneElement();
            const l = getBoundingClientRect(el).left;
            var r = l + el.offsetWidth;
            return {
                [L]: l,
                [R]: r,
            };
        }
        var cmd = this;
        var cmdBounds = getBounds(cmd);
        if (clientX < cmdBounds[L])
            return cursor.insLeftOf(cmd);
        if (clientX > cmdBounds[R])
            return cursor.insRightOf(cmd);
        var leftLeftBound = cmdBounds[L];
        cmd.eachChild(function (block) {
            var blockBounds = getBounds(block);
            if (clientX < blockBounds[L]) {
                // closer to this block's left bound, or the bound left of that?
                if (clientX - leftLeftBound < blockBounds[L] - clientX) {
                    if (block[L])
                        cursor.insAtRightEnd(block[L]);
                    else
                        cursor.insLeftOf(cmd);
                }
                else
                    cursor.insAtLeftEnd(block);
                return false;
            }
            else if (clientX > blockBounds[R]) {
                if (block[R])
                    leftLeftBound = blockBounds[R];
                // continue to next block
                else {
                    // last (rightmost) block
                    // closer to this block's right bound, or the cmd's right bound?
                    if (cmdBounds[R] - clientX < clientX - blockBounds[R]) {
                        cursor.insRightOf(cmd);
                    }
                    else
                        cursor.insAtRightEnd(block);
                }
                return undefined;
            }
            else {
                block.seek(clientX, cursor);
                return false;
            }
        });
        return undefined;
    }
    numBlocks() {
        return this.domView.childCount;
    }
    /**
     * Render the entire math subtree rooted at this command to a DOM node. Assumes `this.domView` is defined.
     *
     * See dom.test.js for example templates and intended outputs.
     */
    html() {
        const blocks = this.blocks;
        pray('domView is defined', this.domView);
        const template = this.domView;
        const dom = template.render(blocks || []);
        this.setDOM(dom);
        NodeBase.linkElementByCmdNode(dom, this);
        return dom;
    }
    // methods to export a string representation of the math tree
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += this.ctrlSeq || '';
        this.eachChild((child) => {
            ctx.latex += '{';
            let beforeLength = ctx.latex.length;
            child.latexRecursive(ctx);
            let afterLength = ctx.latex.length;
            if (beforeLength === afterLength) {
                // nothing was written so we write a space
                ctx.latex += ' ';
            }
            ctx.latex += '}';
        });
        this.checkCursorContextClose(ctx);
    }
    text() {
        var cmd = this, i = 0;
        return cmd.foldChildren(cmd.textTemplate[i], function (text, child) {
            i += 1;
            var child_text = child.text();
            if (text &&
                cmd.textTemplate[i] === '(' &&
                child_text[0] === '(' &&
                child_text.slice(-1) === ')')
                return text + child_text.slice(1, -1) + cmd.textTemplate[i];
            return text + child_text + (cmd.textTemplate[i] || '');
        });
    }
    mathspeak() {
        var cmd = this, i = 0;
        return cmd.foldChildren(cmd.mathspeakTemplate[i] || 'Start' + cmd.ctrlSeq + ' ', function (speech, block) {
            i += 1;
            return (speech +
                ' ' +
                block.mathspeak() +
                ' ' +
                (cmd.mathspeakTemplate[i] + ' ' || 'End' + cmd.ctrlSeq + ' '));
        });
    }
}
/**
 * Lightweight command without blocks or children.
 */
class MQSymbol extends MathCommand {
    constructor(ctrlSeq, html, text, mathspeak) {
        super();
        this.setCtrlSeqHtmlTextAndMathspeak(ctrlSeq, html
            ? new DOMView(0, () => html.cloneNode(true))
            : undefined, text, mathspeak);
    }
    setCtrlSeqHtmlTextAndMathspeak(ctrlSeq, html, text, mathspeak) {
        if (!text && !!ctrlSeq) {
            text = ctrlSeq.replace(/^\\/, '');
        }
        this.mathspeakName = mathspeak || text;
        super.setCtrlSeqHtmlAndText(ctrlSeq, html, [text || '']);
    }
    parser() {
        return Parser.succeed(this);
    }
    numBlocks() {
        return 0;
    }
    replaces(replacedFragment) {
        replacedFragment.remove();
    }
    createBlocks() { }
    moveTowards(dir, cursor) {
        cursor.domFrag().insDirOf(dir, this.domFrag());
        cursor[-dir] = this;
        cursor[dir] = this[dir];
        cursor.controller.aria.queue(this);
    }
    deleteTowards(dir, cursor) {
        cursor[dir] = this.remove()[dir];
    }
    seek(clientX, cursor) {
        // insert at whichever side the click was closer to
        const el = this.domFrag().oneElement();
        const left = getBoundingClientRect(el).left;
        if (clientX - left < el.offsetWidth / 2)
            cursor.insLeftOf(this);
        else
            cursor.insRightOf(this);
        return cursor;
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += this.ctrlSeq || '';
        this.checkCursorContextClose(ctx);
    }
    text() {
        return this.textTemplate.join('');
    }
    mathspeak(_opts) {
        return this.mathspeakName || '';
    }
    placeCursor() { }
    isEmpty() {
        return true;
    }
}
class VanillaSymbol extends MQSymbol {
    constructor(ch, html, mathspeak) {
        super(ch, h('span', {}, [html || h.text(ch)]), undefined, mathspeak);
    }
}
function bindVanillaSymbol(ch, htmlEntity, mathspeak) {
    return () => new VanillaSymbol(ch, htmlEntity ? h.entityText(htmlEntity) : undefined, mathspeak);
}
class BinaryOperator extends MQSymbol {
    constructor(ctrlSeq, html, text, mathspeak, treatLikeSymbol) {
        if (treatLikeSymbol) {
            super(ctrlSeq, h('span', {}, [html || h.text(ctrlSeq || '')]), undefined, mathspeak);
        }
        else {
            super(ctrlSeq, h('span', { class: 'mq-binary-operator' }, html ? [html] : []), text, mathspeak);
        }
    }
}
function bindBinaryOperator(ctrlSeq, htmlEntity, text, mathspeak) {
    return () => new BinaryOperator(ctrlSeq, htmlEntity ? h.entityText(htmlEntity) : undefined, text, mathspeak);
}
/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
class MathBlock extends MathElement {
    constructor() {
        super(...arguments);
        this.ariaLabel = 'block';
    }
    join(methodName) {
        return this.foldChildren('', function (fold, child) {
            return fold + child[methodName]();
        });
    }
    html() {
        const fragment = document.createDocumentFragment();
        this.eachChild((el) => {
            const childHtml = el.html();
            fragment.appendChild(childHtml);
            return undefined;
        });
        return fragment;
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        this.eachChild((child) => child.latexRecursive(ctx));
        this.checkCursorContextClose(ctx);
    }
    text() {
        var endsL = this.getEnd(L);
        var endsR = this.getEnd(R);
        return endsL === endsR && endsL !== 0 ? endsL.text() : this.join('text');
    }
    mathspeak() {
        var tempOp = '';
        var autoOps = {};
        if (this.controller)
            autoOps = this.controller.options.autoOperatorNames;
        return (this.foldChildren([], function (speechArray, cmd) {
            if (cmd.isPartOfOperator) {
                tempOp += cmd.mathspeak();
            }
            else {
                if (tempOp !== '') {
                    if (autoOps._maxLength > 0) {
                        var x = autoOps[tempOp.toLowerCase()];
                        if (typeof x === 'string')
                            tempOp = x;
                    }
                    speechArray.push(tempOp + ' ');
                    tempOp = '';
                }
                var mathspeakText = cmd.mathspeak();
                var cmdText = cmd.ctrlSeq;
                if (isNaN(cmdText) && // TODO - revisit this to improve the isNumber() check
                    cmdText !== '.' &&
                    (!cmd.parent ||
                        !cmd.parent.parent ||
                        !cmd.parent.parent.isTextBlock())) {
                    mathspeakText = ' ' + mathspeakText + ' ';
                }
                speechArray.push(mathspeakText);
            }
            return speechArray;
        })
            .join('')
            .replace(/ +(?= )/g, '')
            // For Apple devices in particular, split out digits after a decimal point so they aren't read aloud as whole words.
            // Not doing so makes 123.456 potentially spoken as "one hundred twenty-three point four hundred fifty-six."
            // Instead, add spaces so it is spoken as "one hundred twenty-three point four five six."
            .replace(/(\.)([0-9]+)/g, function (_match, p1, p2) {
            return p1 + p2.split('').join(' ').trim();
        }));
    }
    keystroke(key, e, ctrlr) {
        if (ctrlr.options.spaceBehavesLikeTab &&
            (key === 'Spacebar' || key === 'Shift-Spacebar')) {
            e === null || e === void 0 ? void 0 : e.preventDefault();
            ctrlr.escapeDir(key === 'Shift-Spacebar' ? L : R, key, e);
            return;
        }
        return super.keystroke(key, e, ctrlr);
    }
    // editability methods: called by the cursor for editing, cursor movements,
    // and selection of the MathQuill tree, these all take in a direction and
    // the cursor
    moveOutOf(dir, cursor, updown) {
        var updownInto;
        if (updown === 'up') {
            updownInto = this.parent.upInto;
        }
        else if (updown === 'down') {
            updownInto = this.parent.downInto;
        }
        if (!updownInto && this[dir]) {
            const otherDir = -dir;
            cursor.insAtDirEnd(otherDir, this[dir]);
            cursor.controller.aria.queueDirEndOf(otherDir).queue(cursor.parent, true);
        }
        else {
            cursor.insDirOf(dir, this.parent);
            cursor.controller.aria.queueDirOf(dir).queue(this.parent);
        }
    }
    selectOutOf(dir, cursor) {
        cursor.insDirOf(dir, this.parent);
    }
    deleteOutOf(_dir, cursor) {
        cursor.unwrapGramp();
    }
    seek(clientX, cursor) {
        var node = this.getEnd(R);
        if (!node)
            return cursor.insAtRightEnd(this);
        const el = node.domFrag().oneElement();
        const left = getBoundingClientRect(el).left;
        if (left + el.offsetWidth < clientX) {
            return cursor.insAtRightEnd(this);
        }
        var endsL = this.getEnd(L);
        if (clientX < getBoundingClientRect(endsL.domFrag().oneElement()).left)
            return cursor.insAtLeftEnd(this);
        while (clientX < getBoundingClientRect(node.domFrag().oneElement()).left)
            node = node[L];
        return node.seek(clientX, cursor);
    }
    chToCmd(ch, options) {
        var cons;
        // exclude f because it gets a dedicated command with more spacing
        if (ch.match(/^[a-eg-zA-Z]$/))
            return new Letter(ch);
        else if (/^\d$/.test(ch))
            return new Digit(ch);
        else if (options && options.typingSlashWritesDivisionSymbol && ch === '/')
            return LatexCmds['\u00f7'](ch);
        else if (options && options.typingAsteriskWritesTimesSymbol && ch === '*')
            return LatexCmds['\u00d7'](ch);
        else if (options && options.typingPercentWritesPercentOf && ch === '%')
            return LatexCmds.percentof(ch);
        else if ((cons = CharCmds[ch] || LatexCmds[ch])) {
            if (cons.constructor) {
                return new cons(ch);
            }
            else {
                return cons(ch);
            }
        }
        else
            return new VanillaSymbol(ch);
    }
    write(cursor, ch) {
        var cmd = this.chToCmd(ch, cursor.options);
        if (cursor.selection)
            cmd.replaces(cursor.replaceSelection());
        if (!cursor.isTooDeep()) {
            cmd.createLeftOf(cursor.show());
            // special-case the slash so that fractions are voiced while typing
            if (ch === '/') {
                cursor.controller.aria.alert('over');
            }
            else {
                cursor.controller.aria.alert(cmd.mathspeak({ createdLeftOf: cursor }));
            }
        }
    }
    writeLatex(cursor, latex) {
        var all = Parser.all;
        var eof = Parser.eof;
        var block = latexMathParser
            .skip(eof)
            .or(all.result(false))
            .parse(latex);
        if (block && !block.isEmpty() && block.prepareInsertionAt(cursor)) {
            block
                .children()
                .adopt(cursor.parent, cursor[L], cursor[R]); // TODO - masking undefined. should be 0
            domFrag(block.html()).insertBefore(cursor.domFrag());
            cursor[L] = block.getEnd(R);
            block.finalizeInsert(cursor.options, cursor);
            var blockEndsR = block.getEnd(R);
            var blockEndsL = block.getEnd(L);
            var blockEndsRR = blockEndsR[R];
            var blockEndsLL = blockEndsL[L];
            if (blockEndsRR)
                blockEndsRR.siblingCreated(cursor.options, L);
            if (blockEndsLL)
                blockEndsLL.siblingCreated(cursor.options, R);
            cursor.parent.bubble(function (node) {
                node.reflow();
                return undefined;
            });
        }
    }
    focus() {
        this.domFrag().addClass('mq-hasCursor');
        this.domFrag().removeClass('mq-empty');
        return this;
    }
    blur(cursor) {
        this.domFrag().removeClass('mq-hasCursor');
        if (this.isEmpty()) {
            this.domFrag().addClass('mq-empty');
            if (cursor &&
                this.isQuietEmptyDelimiter(cursor.options.quietEmptyDelimiters)) {
                this.domFrag().addClass('mq-quiet-delimiter');
            }
        }
        return this;
    }
}
Options.prototype.mouseEvents = true;
API.StaticMath = function (APIClasses) {
    var _c;
    return _c = class StaticMath extends APIClasses.AbstractMathQuill {
            constructor(el) {
                super(el);
                var innerFields = (this.innerFields = []);
                this.__controller.root.postOrder(function (node) {
                    node.registerInnerField(innerFields, APIClasses.InnerMathField);
                });
            }
            __mathquillify(opts, _interfaceVersion) {
                this.config(opts);
                super.mathquillify('mq-math-mode');
                this.__controller.setupStaticField();
                if (this.__options.mouseEvents) {
                    this.__controller.addMouseEventListener();
                    this.__controller.staticMathTextareaEvents();
                }
                return this;
            }
            latex(_latex) {
                var returned = super.latex.apply(this, arguments);
                if (arguments.length > 0) {
                    var innerFields = (this.innerFields = []);
                    this.__controller.root.postOrder(function (node) {
                        node.registerInnerField(innerFields, APIClasses.InnerMathField);
                    });
                    // Force an ARIA label update to remain in sync with the new LaTeX value.
                    this.__controller.updateMathspeak();
                }
                return returned;
            }
            setAriaLabel(ariaLabel) {
                this.__controller.setAriaLabel(ariaLabel);
                return this;
            }
            getAriaLabel() {
                return this.__controller.getAriaLabel();
            }
        },
        _c.RootBlock = MathBlock,
        _c;
};
class RootMathBlock extends MathBlock {
}
RootBlockMixin(RootMathBlock.prototype); // adds methods to RootMathBlock
API.MathField = function (APIClasses) {
    var _c;
    return _c = class MathField extends APIClasses.EditableField {
            __mathquillify(opts, interfaceVersion) {
                this.config(opts);
                if (interfaceVersion > 1)
                    this.__controller.root.reflow = noop;
                super.mathquillify('mq-editable-field mq-math-mode');
                // TODO: Why does this need to be deleted (contrary to the type definition)? Could we set it to `noop` instead?
                delete this.__controller.root.reflow;
                return this;
            }
        },
        _c.RootBlock = RootMathBlock,
        _c;
};
API.InnerMathField = function (APIClasses) {
    pray('MathField class is defined', APIClasses.MathField);
    return class extends APIClasses.MathField {
        makeStatic() {
            this.__controller.editable = false;
            this.__controller.root.blur();
            this.__controller.unbindEditablesEvents();
            domFrag(this.__controller.container).removeClass('mq-editable-field');
        }
        makeEditable() {
            this.__controller.editable = true;
            this.__controller.editablesTextareaEvents();
            this.__controller.cursor.insAtRightEnd(this.__controller.root);
            domFrag(this.__controller.container).addClass('mq-editable-field');
        }
    };
};
/************************************
 * Symbols for Advanced Mathematics
 ***********************************/
LatexCmds.notin =
    LatexCmds.cong =
        LatexCmds.equiv =
            LatexCmds.oplus =
                LatexCmds.otimes =
                    (latex) => new BinaryOperator('\\' + latex + ' ', h.entityText('&' + latex + ';'));
LatexCmds['\u2217'] =
    LatexCmds.ast =
        LatexCmds.star =
            LatexCmds.loast =
                LatexCmds.lowast =
                    bindBinaryOperator('\\ast ', '&lowast;', 'low asterisk');
LatexCmds.therefor = LatexCmds.therefore = bindBinaryOperator('\\therefore ', '&there4;', 'therefore');
LatexCmds.cuz = LatexCmds.because = bindBinaryOperator(
// l33t
'\\because ', '&#8757;', 'because');
LatexCmds.prop = LatexCmds.propto = bindBinaryOperator('\\propto ', '&prop;', 'proportional to');
LatexCmds['\u2248'] =
    LatexCmds.asymp =
        LatexCmds.approx =
            bindBinaryOperator('\\approx ', '&asymp;', 'approximately equal to');
LatexCmds.isin = LatexCmds['in'] = bindBinaryOperator('\\in ', '&isin;', 'is in');
LatexCmds.ni = LatexCmds.contains = bindBinaryOperator('\\ni ', '&ni;', 'is not in');
LatexCmds.notni =
    LatexCmds.niton =
        LatexCmds.notcontains =
            LatexCmds.doesnotcontain =
                bindBinaryOperator('\\not\\ni ', '&#8716;', 'does not contain');
LatexCmds.sub = LatexCmds.subset = bindBinaryOperator('\\subset ', '&sub;', 'subset');
LatexCmds.sup =
    LatexCmds.supset =
        LatexCmds.superset =
            bindBinaryOperator('\\supset ', '&sup;', 'superset');
LatexCmds.nsub =
    LatexCmds.notsub =
        LatexCmds.nsubset =
            LatexCmds.notsubset =
                bindBinaryOperator('\\not\\subset ', '&#8836;', 'not a subset');
LatexCmds.nsup =
    LatexCmds.notsup =
        LatexCmds.nsupset =
            LatexCmds.notsupset =
                LatexCmds.nsuperset =
                    LatexCmds.notsuperset =
                        bindBinaryOperator('\\not\\supset ', '&#8837;', 'not a superset');
LatexCmds.sube =
    LatexCmds.subeq =
        LatexCmds.subsete =
            LatexCmds.subseteq =
                bindBinaryOperator('\\subseteq ', '&sube;', 'subset or equal to');
LatexCmds.supe =
    LatexCmds.supeq =
        LatexCmds.supsete =
            LatexCmds.supseteq =
                LatexCmds.supersete =
                    LatexCmds.superseteq =
                        bindBinaryOperator('\\supseteq ', '&supe;', 'superset or equal to');
LatexCmds.nsube =
    LatexCmds.nsubeq =
        LatexCmds.notsube =
            LatexCmds.notsubeq =
                LatexCmds.nsubsete =
                    LatexCmds.nsubseteq =
                        LatexCmds.notsubsete =
                            LatexCmds.notsubseteq =
                                bindBinaryOperator('\\not\\subseteq ', '&#8840;', 'not subset or equal to');
LatexCmds.nsupe =
    LatexCmds.nsupeq =
        LatexCmds.notsupe =
            LatexCmds.notsupeq =
                LatexCmds.nsupsete =
                    LatexCmds.nsupseteq =
                        LatexCmds.notsupsete =
                            LatexCmds.notsupseteq =
                                LatexCmds.nsupersete =
                                    LatexCmds.nsuperseteq =
                                        LatexCmds.notsupersete =
                                            LatexCmds.notsuperseteq =
                                                bindBinaryOperator('\\not\\supseteq ', '&#8841;', 'not superset or equal to');
//the canonical sets of numbers
LatexCmds.mathbb = class extends MathCommand {
    createLeftOf(_cursor) { }
    numBlocks() {
        return 1;
    }
    parser() {
        var string = Parser.string;
        var regex = Parser.regex;
        var optWhitespace = Parser.optWhitespace;
        return optWhitespace
            .then(string('{'))
            .then(optWhitespace)
            .then(regex(/^[NPZQRCH]/))
            .skip(optWhitespace)
            .skip(string('}'))
            .map(function (c) {
            // instantiate the class for the matching char
            var cmd = LatexCmds[c];
            if (isMQNodeClass(cmd)) {
                return new cmd();
            }
            else {
                return cmd();
            }
        });
    }
};
LatexCmds.N =
    LatexCmds.naturals =
        LatexCmds.Naturals =
            bindVanillaSymbol('\\mathbb{N}', '&#8469;', 'naturals');
LatexCmds.P =
    LatexCmds.primes =
        LatexCmds.Primes =
            LatexCmds.projective =
                LatexCmds.Projective =
                    LatexCmds.probability =
                        LatexCmds.Probability =
                            bindVanillaSymbol('\\mathbb{P}', '&#8473;', 'P');
LatexCmds.Z =
    LatexCmds.integers =
        LatexCmds.Integers =
            bindVanillaSymbol('\\mathbb{Z}', '&#8484;', 'integers');
LatexCmds.Q =
    LatexCmds.rationals =
        LatexCmds.Rationals =
            bindVanillaSymbol('\\mathbb{Q}', '&#8474;', 'rationals');
LatexCmds.R =
    LatexCmds.reals =
        LatexCmds.Reals =
            bindVanillaSymbol('\\mathbb{R}', '&#8477;', 'reals');
LatexCmds.C =
    LatexCmds.complex =
        LatexCmds.Complex =
            LatexCmds.complexes =
                LatexCmds.Complexes =
                    LatexCmds.complexplane =
                        LatexCmds.Complexplane =
                            LatexCmds.ComplexPlane =
                                bindVanillaSymbol('\\mathbb{C}', '&#8450;', 'complexes');
LatexCmds.H =
    LatexCmds.Hamiltonian =
        LatexCmds.quaternions =
            LatexCmds.Quaternions =
                bindVanillaSymbol('\\mathbb{H}', '&#8461;', 'quaternions');
//spacing
LatexCmds.quad = LatexCmds.emsp = bindVanillaSymbol('\\quad ', '    ', '4 spaces');
LatexCmds.qquad = bindVanillaSymbol('\\qquad ', '        ', '8 spaces');
/* spacing special characters, gonna have to implement this in LatexCommandInput::onText somehow
case ',':
  return VanillaSymbol('\\, ',' ', 'comma');
case ':':
  return VanillaSymbol('\\: ','  ', 'colon');
case ';':
  return VanillaSymbol('\\; ','   ', 'semicolon');
case '!':
  return MQSymbol('\\! ','<span style="margin-right:-.2em"></span>', 'exclamation point');
*/
//binary operators
LatexCmds.diamond = bindVanillaSymbol('\\diamond ', '&#9671;', 'diamond');
LatexCmds.bigtriangleup = bindVanillaSymbol('\\bigtriangleup ', '&#9651;', 'triangle up');
LatexCmds.ominus = bindVanillaSymbol('\\ominus ', '&#8854;', 'o minus');
LatexCmds.uplus = bindVanillaSymbol('\\uplus ', '&#8846;', 'disjoint union');
LatexCmds.bigtriangledown = bindVanillaSymbol('\\bigtriangledown ', '&#9661;', 'triangle down');
LatexCmds.sqcap = bindVanillaSymbol('\\sqcap ', '&#8851;', 'greatest lower bound');
LatexCmds.triangleleft = bindVanillaSymbol('\\triangleleft ', '&#8882;', 'triangle left');
LatexCmds.sqcup = bindVanillaSymbol('\\sqcup ', '&#8852;', 'least upper bound');
LatexCmds.triangleright = bindVanillaSymbol('\\triangleright ', '&#8883;', 'triangle right');
//circledot is not a not real LaTex command see https://github.com/mathquill/mathquill/pull/552 for more details
LatexCmds.odot = LatexCmds.circledot = bindVanillaSymbol('\\odot ', '&#8857;', 'circle dot');
LatexCmds.bigcirc = bindVanillaSymbol('\\bigcirc ', '&#9711;', 'circle');
LatexCmds.dagger = bindVanillaSymbol('\\dagger ', '&#0134;', 'dagger');
LatexCmds.ddagger = bindVanillaSymbol('\\ddagger ', '&#135;', 'big dagger');
LatexCmds.wr = bindVanillaSymbol('\\wr ', '&#8768;', 'wreath');
LatexCmds.amalg = bindVanillaSymbol('\\amalg ', '&#8720;', 'amalgam');
//relationship symbols
LatexCmds.models = bindVanillaSymbol('\\models ', '&#8872;', 'models');
LatexCmds.prec = bindVanillaSymbol('\\prec ', '&#8826;', 'precedes');
LatexCmds.succ = bindVanillaSymbol('\\succ ', '&#8827;', 'succeeds');
LatexCmds.preceq = bindVanillaSymbol('\\preceq ', '&#8828;', 'precedes or equals');
LatexCmds.succeq = bindVanillaSymbol('\\succeq ', '&#8829;', 'succeeds or equals');
LatexCmds.simeq = bindVanillaSymbol('\\simeq ', '&#8771;', 'similar or equal to');
LatexCmds.mid = bindVanillaSymbol('\\mid ', '&#8739;', 'divides');
LatexCmds.ll = bindVanillaSymbol('\\ll ', '&#8810;', 'll');
LatexCmds.gg = bindVanillaSymbol('\\gg ', '&#8811;', 'gg');
LatexCmds.parallel = bindVanillaSymbol('\\parallel ', '&#8741;', 'parallel with');
LatexCmds.nparallel = bindVanillaSymbol('\\nparallel ', '&#8742;', 'not parallel with');
LatexCmds.bowtie = bindVanillaSymbol('\\bowtie ', '&#8904;', 'bowtie');
LatexCmds.sqsubset = bindVanillaSymbol('\\sqsubset ', '&#8847;', 'square subset');
LatexCmds.sqsupset = bindVanillaSymbol('\\sqsupset ', '&#8848;', 'square superset');
LatexCmds.smile = bindVanillaSymbol('\\smile ', '&#8995;', 'smile');
LatexCmds.sqsubseteq = bindVanillaSymbol('\\sqsubseteq ', '&#8849;', 'square subset or equal to');
LatexCmds.sqsupseteq = bindVanillaSymbol('\\sqsupseteq ', '&#8850;', 'square superset or equal to');
LatexCmds.doteq = bindVanillaSymbol('\\doteq ', '&#8784;', 'dotted equals');
LatexCmds.frown = bindVanillaSymbol('\\frown ', '&#8994;', 'frown');
LatexCmds.vdash = bindVanillaSymbol('\\vdash ', '&#8870;', 'v dash');
LatexCmds.dashv = bindVanillaSymbol('\\dashv ', '&#8867;', 'dash v');
LatexCmds.nless = bindVanillaSymbol('\\nless ', '&#8814;', 'not less than');
LatexCmds.ngtr = bindVanillaSymbol('\\ngtr ', '&#8815;', 'not greater than');
//arrows
LatexCmds.longleftarrow = bindVanillaSymbol('\\longleftarrow ', '&#8592;', 'left arrow');
LatexCmds.longrightarrow = bindVanillaSymbol('\\longrightarrow ', '&#8594;', 'right arrow');
LatexCmds.Longleftarrow = bindVanillaSymbol('\\Longleftarrow ', '&#8656;', 'left arrow');
LatexCmds.Longrightarrow = bindVanillaSymbol('\\Longrightarrow ', '&#8658;', 'right arrow');
LatexCmds.longleftrightarrow = bindVanillaSymbol('\\longleftrightarrow ', '&#8596;', 'left and right arrow');
LatexCmds.updownarrow = bindVanillaSymbol('\\updownarrow ', '&#8597;', 'up and down arrow');
LatexCmds.Longleftrightarrow = bindVanillaSymbol('\\Longleftrightarrow ', '&#8660;', 'left and right arrow');
LatexCmds.Updownarrow = bindVanillaSymbol('\\Updownarrow ', '&#8661;', 'up and down arrow');
LatexCmds.mapsto = bindVanillaSymbol('\\mapsto ', '&#8614;', 'maps to');
LatexCmds.nearrow = bindVanillaSymbol('\\nearrow ', '&#8599;', 'northeast arrow');
LatexCmds.hookleftarrow = bindVanillaSymbol('\\hookleftarrow ', '&#8617;', 'hook left arrow');
LatexCmds.hookrightarrow = bindVanillaSymbol('\\hookrightarrow ', '&#8618;', 'hook right arrow');
LatexCmds.searrow = bindVanillaSymbol('\\searrow ', '&#8600;', 'southeast arrow');
LatexCmds.leftharpoonup = bindVanillaSymbol('\\leftharpoonup ', '&#8636;', 'left harpoon up');
LatexCmds.rightharpoonup = bindVanillaSymbol('\\rightharpoonup ', '&#8640;', 'right harpoon up');
LatexCmds.swarrow = bindVanillaSymbol('\\swarrow ', '&#8601;', 'southwest arrow');
LatexCmds.leftharpoondown = bindVanillaSymbol('\\leftharpoondown ', '&#8637;', 'left harpoon down');
LatexCmds.rightharpoondown = bindVanillaSymbol('\\rightharpoondown ', '&#8641;', 'right harpoon down');
LatexCmds.nwarrow = bindVanillaSymbol('\\nwarrow ', '&#8598;', 'northwest arrow');
//Misc
LatexCmds.ldots = bindVanillaSymbol('\\ldots ', '&#8230;', 'l dots');
LatexCmds.cdots = bindVanillaSymbol('\\cdots ', '&#8943;', 'c dots');
LatexCmds.vdots = bindVanillaSymbol('\\vdots ', '&#8942;', 'v dots');
LatexCmds.ddots = bindVanillaSymbol('\\ddots ', '&#8945;', 'd dots');
LatexCmds.surd = bindVanillaSymbol('\\surd ', '&#8730;', 'unresolved root');
LatexCmds.triangle = bindVanillaSymbol('\\triangle ', '&#9651;', 'triangle');
LatexCmds.ell = bindVanillaSymbol('\\ell ', '&#8467;', 'ell');
LatexCmds.top = bindVanillaSymbol('\\top ', '&#8868;', 'top');
LatexCmds.flat = bindVanillaSymbol('\\flat ', '&#9837;', 'flat');
LatexCmds.natural = bindVanillaSymbol('\\natural ', '&#9838;', 'natural');
LatexCmds.sharp = bindVanillaSymbol('\\sharp ', '&#9839;', 'sharp');
LatexCmds.wp = bindVanillaSymbol('\\wp ', '&#8472;', 'wp');
LatexCmds.bot = bindVanillaSymbol('\\bot ', '&#8869;', 'bot');
LatexCmds.clubsuit = bindVanillaSymbol('\\clubsuit ', '&#9827;', 'club suit');
LatexCmds.diamondsuit = bindVanillaSymbol('\\diamondsuit ', '&#9826;', 'diamond suit');
LatexCmds.heartsuit = bindVanillaSymbol('\\heartsuit ', '&#9825;', 'heart suit');
LatexCmds.spadesuit = bindVanillaSymbol('\\spadesuit ', '&#9824;', 'spade suit');
//not real LaTex command see https://github.com/mathquill/mathquill/pull/552 for more details
LatexCmds.parallelogram = bindVanillaSymbol('\\parallelogram ', '&#9649;', 'parallelogram');
LatexCmds.square = bindVanillaSymbol('\\square ', '&#11036;', 'square');
//variable-sized
LatexCmds.oint = bindVanillaSymbol('\\oint ', '&#8750;', 'o int');
LatexCmds.bigcap = bindVanillaSymbol('\\bigcap ', '&#8745;', 'big cap');
LatexCmds.bigcup = bindVanillaSymbol('\\bigcup ', '&#8746;', 'big cup');
LatexCmds.bigsqcup = bindVanillaSymbol('\\bigsqcup ', '&#8852;', 'big square cup');
LatexCmds.bigvee = bindVanillaSymbol('\\bigvee ', '&#8744;', 'big vee');
LatexCmds.bigwedge = bindVanillaSymbol('\\bigwedge ', '&#8743;', 'big wedge');
LatexCmds.bigodot = bindVanillaSymbol('\\bigodot ', '&#8857;', 'big o dot');
LatexCmds.bigotimes = bindVanillaSymbol('\\bigotimes ', '&#8855;', 'big o times');
LatexCmds.bigoplus = bindVanillaSymbol('\\bigoplus ', '&#8853;', 'big o plus');
LatexCmds.biguplus = bindVanillaSymbol('\\biguplus ', '&#8846;', 'big u plus');
//delimiters
LatexCmds.lfloor = bindVanillaSymbol('\\lfloor ', '&#8970;', 'left floor');
LatexCmds.rfloor = bindVanillaSymbol('\\rfloor ', '&#8971;', 'right floor');
LatexCmds.lceil = bindVanillaSymbol('\\lceil ', '&#8968;', 'left ceiling');
LatexCmds.rceil = bindVanillaSymbol('\\rceil ', '&#8969;', 'right ceiling');
LatexCmds.opencurlybrace = LatexCmds.lbrace = bindVanillaSymbol('\\lbrace ', '{', 'left brace');
LatexCmds.closecurlybrace = LatexCmds.rbrace = bindVanillaSymbol('\\rbrace ', '}', 'right brace');
LatexCmds.lbrack = bindVanillaSymbol('[', 'left bracket');
LatexCmds.rbrack = bindVanillaSymbol(']', 'right bracket');
//various symbols
LatexCmds.slash = bindVanillaSymbol('/', 'slash');
LatexCmds.vert = bindVanillaSymbol('|', 'vertical bar');
LatexCmds.perp = LatexCmds.perpendicular = bindVanillaSymbol('\\perp ', '&perp;', 'perpendicular');
LatexCmds.nabla = LatexCmds.del = bindVanillaSymbol('\\nabla ', '&nabla;');
LatexCmds.hbar = bindVanillaSymbol('\\hbar ', '&#8463;', 'horizontal bar');
LatexCmds.AA =
    LatexCmds.Angstrom =
        LatexCmds.angstrom =
            bindVanillaSymbol('\\text\\AA ', '&#8491;', 'AA');
LatexCmds.ring =
    LatexCmds.circ =
        LatexCmds.circle =
            bindVanillaSymbol('\\circ ', '&#8728;', 'circle');
LatexCmds.bull = LatexCmds.bullet = bindVanillaSymbol('\\bullet ', '&bull;', 'bullet');
LatexCmds.setminus = LatexCmds.smallsetminus = bindVanillaSymbol('\\setminus ', '&#8726;', 'set minus');
LatexCmds.not = //bind(MQSymbol,'\\not ','<span class="not">/</span>', 'not');
    LatexCmds['\u00ac'] =
        LatexCmds.neg =
            bindVanillaSymbol('\\neg ', '&not;', 'not');
LatexCmds['\u2026'] =
    LatexCmds.dots =
        LatexCmds.ellip =
            LatexCmds.hellip =
                LatexCmds.ellipsis =
                    LatexCmds.hellipsis =
                        bindVanillaSymbol('\\dots ', '&hellip;', 'ellipsis');
LatexCmds.converges =
    LatexCmds.darr =
        LatexCmds.dnarr =
            LatexCmds.dnarrow =
                LatexCmds.downarrow =
                    bindVanillaSymbol('\\downarrow ', '&darr;', 'converges with');
LatexCmds.dArr =
    LatexCmds.dnArr =
        LatexCmds.dnArrow =
            LatexCmds.Downarrow =
                bindVanillaSymbol('\\Downarrow ', '&dArr;', 'down arrow');
LatexCmds.diverges =
    LatexCmds.uarr =
        LatexCmds.uparrow =
            bindVanillaSymbol('\\uparrow ', '&uarr;', 'diverges from');
LatexCmds.uArr = LatexCmds.Uparrow = bindVanillaSymbol('\\Uparrow ', '&uArr;', 'up arrow');
LatexCmds.rarr = LatexCmds.rightarrow = bindVanillaSymbol('\\rightarrow ', '&rarr;', 'right arrow');
LatexCmds.implies = bindBinaryOperator('\\Rightarrow ', '&rArr;', 'implies');
LatexCmds.rArr = LatexCmds.Rightarrow = bindVanillaSymbol('\\Rightarrow ', '&rArr;', 'right arrow');
LatexCmds.gets = bindBinaryOperator('\\gets ', '&larr;', 'gets');
LatexCmds.larr = LatexCmds.leftarrow = bindVanillaSymbol('\\leftarrow ', '&larr;', 'left arrow');
LatexCmds.impliedby = bindBinaryOperator('\\Leftarrow ', '&lArr;', 'implied by');
LatexCmds.lArr = LatexCmds.Leftarrow = bindVanillaSymbol('\\Leftarrow ', '&lArr;', 'left arrow');
LatexCmds.harr =
    LatexCmds.lrarr =
        LatexCmds.leftrightarrow =
            bindVanillaSymbol('\\leftrightarrow ', '&harr;', 'left and right arrow');
LatexCmds.iff = bindBinaryOperator('\\Leftrightarrow ', '&hArr;', 'if and only if');
LatexCmds.hArr =
    LatexCmds.lrArr =
        LatexCmds.Leftrightarrow =
            bindVanillaSymbol('\\Leftrightarrow ', '&hArr;', 'left and right arrow');
LatexCmds.Re =
    LatexCmds.Real =
        LatexCmds.real =
            bindVanillaSymbol('\\Re ', '&real;', 'real');
LatexCmds.Im =
    LatexCmds.imag =
        LatexCmds.image =
            LatexCmds.imagin =
                LatexCmds.imaginary =
                    LatexCmds.Imaginary =
                        bindVanillaSymbol('\\Im ', '&image;', 'imaginary');
LatexCmds.part = LatexCmds.partial = bindVanillaSymbol('\\partial ', '&part;', 'partial');
LatexCmds.pounds = bindVanillaSymbol('\\pounds ', '&pound;');
LatexCmds.alef =
    LatexCmds.alefsym =
        LatexCmds.aleph =
            LatexCmds.alephsym =
                bindVanillaSymbol('\\aleph ', '&alefsym;', 'alef sym');
LatexCmds.xist = //LOL
    LatexCmds.xists =
        LatexCmds.exist =
            LatexCmds.exists =
                bindVanillaSymbol('\\exists ', '&exist;', 'there exists at least 1');
LatexCmds.nexists = LatexCmds.nexist = bindVanillaSymbol('\\nexists ', '&#8708;', 'there is no');
LatexCmds.and =
    LatexCmds.land =
        LatexCmds.wedge =
            bindBinaryOperator('\\wedge ', '&and;', 'and');
LatexCmds.or =
    LatexCmds.lor =
        LatexCmds.vee =
            bindBinaryOperator('\\vee ', '&or;', 'or');
LatexCmds.o =
    LatexCmds.O =
        LatexCmds.empty =
            LatexCmds.emptyset =
                LatexCmds.oslash =
                    LatexCmds.Oslash =
                        LatexCmds.nothing =
                            LatexCmds.varnothing =
                                bindBinaryOperator('\\varnothing ', '&empty;', 'nothing');
LatexCmds.cup = LatexCmds.union = bindBinaryOperator('\\cup ', '&cup;', 'union');
LatexCmds.cap =
    LatexCmds.intersect =
        LatexCmds.intersection =
            bindBinaryOperator('\\cap ', '&cap;', 'intersection');
// FIXME: the correct LaTeX would be ^\circ but we can't parse that
LatexCmds.deg = LatexCmds.degree = bindVanillaSymbol('\\degree ', '&deg;', 'degrees');
LatexCmds.ang = LatexCmds.angle = bindVanillaSymbol('\\angle ', '&ang;', 'angle');
LatexCmds.measuredangle = bindVanillaSymbol('\\measuredangle ', '&#8737;', 'measured angle');
/*********************************
 * Symbols for Basic Mathematics
 ********************************/
class DigitGroupingChar extends MQSymbol {
    finalizeTree(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    siblingDeleted(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    siblingCreated(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    sharedSiblingMethod(opts, dir) {
        // don't try to fix digit grouping if the sibling to my right changed (dir === R or
        // undefined) and it's now a DigitGroupingChar, it will try to fix grouping
        if (dir !== L && this[R] instanceof DigitGroupingChar)
            return;
        this.fixDigitGrouping(opts);
    }
    fixDigitGrouping(opts) {
        if (!opts.enableDigitGrouping)
            return;
        var left = this;
        var right = this;
        var spacesFound = 0;
        var dots = [];
        var SPACE = '\\ ';
        var DOT = '.';
        // traverse left as far as possible (starting at this char)
        var node = left;
        do {
            if (/^[0-9]$/.test(node.ctrlSeq)) {
                left = node;
            }
            else if (node.ctrlSeq === SPACE) {
                left = node;
                spacesFound += 1;
            }
            else if (node.ctrlSeq === DOT) {
                left = node;
                dots.push(node);
            }
            else {
                break;
            }
        } while ((node = left[L]));
        // traverse right as far as possible (starting to right of this char)
        while ((node = right[R])) {
            if (/^[0-9]$/.test(node.ctrlSeq)) {
                right = node;
            }
            else if (node.ctrlSeq === SPACE) {
                right = node;
                spacesFound += 1;
            }
            else if (node.ctrlSeq === DOT) {
                right = node;
                dots.push(node);
            }
            else {
                break;
            }
        }
        // trim the leading spaces
        while (right !== left && left && left.ctrlSeq === SPACE) {
            left = left[R];
            spacesFound -= 1;
        }
        // trim the trailing spaces
        while (right !== left && right && right.ctrlSeq === SPACE) {
            right = right[L];
            spacesFound -= 1;
        }
        // happens when you only have a space
        if (left === right && left && left.ctrlSeq === SPACE)
            return;
        var disableFormatting = spacesFound > 0 || dots.length > 1;
        if (disableFormatting) {
            this.removeGroupingBetween(left, right);
        }
        else if (dots[0]) {
            if (dots[0] !== left) {
                this.addGroupingBetween(dots[0][L], left);
            }
            if (dots[0] !== right) {
                // we do not show grouping to the right of a decimal place #yet
                this.removeGroupingBetween(dots[0][R], right);
            }
        }
        else {
            this.addGroupingBetween(right, left);
        }
    }
    removeGroupingBetween(left, right) {
        var node = left;
        do {
            if (node instanceof DigitGroupingChar) {
                node.setGroupingClass(undefined);
            }
            if (!node || node === right)
                break;
        } while ((node = node[R]));
    }
    addGroupingBetween(start, end) {
        var node = start;
        var count = 0;
        var totalDigits = 0;
        var node = start;
        while (node) {
            totalDigits += 1;
            if (node === end)
                break;
            node = node[L];
        }
        var numDigitsInFirstGroup = totalDigits % 3;
        if (numDigitsInFirstGroup === 0)
            numDigitsInFirstGroup = 3;
        var node = start;
        while (node) {
            count += 1;
            var cls = undefined;
            // only do grouping if we have at least 4 numbers
            if (totalDigits >= 4) {
                if (count === totalDigits) {
                    cls = 'mq-group-leading-' + numDigitsInFirstGroup;
                }
                else if (count % 3 === 0) {
                    if (count !== totalDigits) {
                        cls = 'mq-group-start';
                    }
                }
                if (!cls) {
                    cls = 'mq-group-other';
                }
            }
            if (node instanceof DigitGroupingChar) {
                node.setGroupingClass(cls);
            }
            if (node === end)
                break;
            node = node[L];
        }
    }
    setGroupingClass(cls) {
        // nothing changed (either class is the same or it's still undefined)
        if (this._groupingClass === cls)
            return;
        // remove existing class
        if (this._groupingClass)
            this.domFrag().removeClass(this._groupingClass);
        // add new class
        if (cls)
            this.domFrag().addClass(cls);
        // cache the groupingClass
        this._groupingClass = cls;
    }
}
class Digit extends DigitGroupingChar {
    constructor(ch, mathspeak) {
        super(ch, h('span', { class: 'mq-digit' }, [h.text(ch)]), undefined, mathspeak);
    }
    createLeftOf(cursor) {
        const cursorL = cursor[L];
        const cursorLL = cursorL && cursorL[L];
        const cursorParentParentSub = cursor.parent.parent instanceof SupSub
            ? cursor.parent.parent.sub
            : undefined;
        if (cursor.options.autoSubscriptNumerals &&
            cursor.parent !== cursorParentParentSub &&
            ((cursorL instanceof Variable && cursorL.isItalic !== false) ||
                (cursorL instanceof SupSub &&
                    cursorLL instanceof Variable &&
                    cursorLL.isItalic !== false))) {
            new SubscriptCommand().createLeftOf(cursor);
            super.createLeftOf(cursor);
            cursor.insRightOf(cursor.parent.parent);
        }
        else
            super.createLeftOf(cursor);
    }
    mathspeak(opts) {
        if (opts && opts.createdLeftOf) {
            var cursor = opts.createdLeftOf;
            var cursorL = cursor[L];
            var cursorLL = cursorL && cursorL[L];
            const cursorParentParentSub = cursor.parent.parent instanceof SupSub
                ? cursor.parent.parent.sub
                : undefined;
            if (cursor.options.autoSubscriptNumerals &&
                cursor.parent !== cursorParentParentSub &&
                ((cursorL instanceof Variable && cursorL.isItalic !== false) ||
                    (cursor[L] instanceof SupSub &&
                        cursorLL instanceof Variable &&
                        cursorLL.isItalic !== false))) {
                return 'Subscript ' + super.mathspeak() + ' Baseline';
            }
        }
        return super.mathspeak();
    }
}
class Variable extends MQSymbol {
    constructor(chOrCtrlSeq, html) {
        super(chOrCtrlSeq, h('var', {}, [html || h.text(chOrCtrlSeq)]));
    }
    text() {
        var text = this.ctrlSeq || '';
        if (this.isPartOfOperator) {
            if (text[0] == '\\') {
                text = text.slice(1, text.length);
            }
            else if (text[text.length - 1] == ' ') {
                text = text.slice(0, -1);
            }
        }
        else {
            if (this[L] &&
                !(this[L] instanceof Variable) &&
                !(this[L] instanceof BinaryOperator) &&
                this[L].ctrlSeq !== '\\ ')
                text = '*' + text;
            if (this[R] &&
                !(this[R] instanceof BinaryOperator) &&
                !(this[R] instanceof SupSub))
                text += '*';
        }
        return text;
    }
    mathspeak() {
        var text = this.ctrlSeq || '';
        if (this.isPartOfOperator ||
            text.length > 1 ||
            (this.parent && this.parent.parent && this.parent.parent.isTextBlock())) {
            return super.mathspeak();
        }
        else {
            // Apple voices in VoiceOver (such as Alex, Bruce, and Victoria) do
            // some strange pronunciation given certain expressions,
            // e.g. "y-2" is spoken as "ee minus 2" (as if the y is short).
            // Not an ideal solution, but surrounding non-numeric text blocks with quotation marks works.
            // This bug has been acknowledged by Apple.
            return '"' + text + '"';
        }
    }
}
function bindVariable(ch, htmlEntity, _unusedMathspeak) {
    return () => new Variable(ch, h.entityText(htmlEntity));
}
Options.prototype.autoCommands = {
    _maxLength: 0,
};
baseOptionProcessors.autoCommands = function (cmds) {
    if (typeof cmds !== 'string' || !/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
        throw '"' + cmds + '" not a space-delimited list of only letters';
    }
    var list = cmds.split(' ');
    var dict = {};
    var maxLength = 0;
    for (var i = 0; i < list.length; i += 1) {
        var cmd = list[i];
        if (cmd.length < 2) {
            throw 'autocommand "' + cmd + '" not minimum length of 2';
        }
        if (LatexCmds[cmd] === OperatorName) {
            throw '"' + cmd + '" is a built-in operator name';
        }
        dict[cmd] = 1;
        maxLength = max(maxLength, cmd.length);
    }
    dict._maxLength = maxLength;
    return dict;
};
Options.prototype.quietEmptyDelimiters = {};
baseOptionProcessors.quietEmptyDelimiters = function (dlms = '') {
    var list = dlms.split(' ');
    var dict = {};
    for (var i = 0; i < list.length; i += 1) {
        var dlm = list[i];
        dict[dlm] = 1;
    }
    return dict;
};
Options.prototype.autoParenthesizedFunctions = { _maxLength: 0 };
baseOptionProcessors.autoParenthesizedFunctions = function (cmds) {
    if (typeof cmds !== 'string' || !/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
        throw '"' + cmds + '" not a space-delimited list of only letters';
    }
    var list = cmds.split(' ');
    var dict = {};
    var maxLength = 0;
    for (var i = 0; i < list.length; i += 1) {
        var cmd = list[i];
        if (cmd.length < 2) {
            throw 'autocommand "' + cmd + '" not minimum length of 2';
        }
        dict[cmd] = 1;
        maxLength = max(maxLength, cmd.length);
    }
    dict._maxLength = maxLength;
    return dict;
};
class Letter extends Variable {
    constructor(ch) {
        super(ch);
        this.letter = ch;
    }
    checkAutoCmds(cursor) {
        //exit early if in simple subscript and disableAutoSubstitutionInSubscripts is set.
        if (this.shouldIgnoreSubstitutionInSimpleSubscript(cursor.options)) {
            return;
        }
        //handle autoCommands
        var autoCmds = cursor.options.autoCommands;
        var maxLength = autoCmds._maxLength || 0;
        if (maxLength > 0) {
            // want longest possible autocommand, so join together longest
            // sequence of letters
            var str = '';
            var l = this;
            var i = 0;
            // FIXME: l.ctrlSeq === l.letter checks if first or last in an operator name
            while (l instanceof Letter && l.ctrlSeq === l.letter && i < maxLength) {
                str = l.letter + str;
                l = l[L];
                i += 1;
            }
            // check for an autocommand, going thru substrings longest to shortest
            while (str.length) {
                if (autoCmds.hasOwnProperty(str)) {
                    l = this;
                    for (i = 1; l && i < str.length; i += 1, l = l[L])
                        ;
                    new Fragment(l, this).remove();
                    cursor[L] = l[L];
                    var cmd = LatexCmds[str];
                    var node;
                    if (isMQNodeClass(cmd)) {
                        node = new cmd(str); // TODO - How do we know that this class expects a single str input?
                    }
                    else {
                        node = cmd(str);
                    }
                    return node.createLeftOf(cursor);
                }
                str = str.slice(1);
            }
        }
    }
    autoParenthesize(cursor) {
        //exit early if already parenthesized
        var right = cursor.parent.getEnd(R);
        if (right && right instanceof Bracket && right.ctrlSeq === '\\left(') {
            return;
        }
        //exit early if in simple subscript and disableAutoSubstitutionInSubscripts is set.
        if (this.shouldIgnoreSubstitutionInSimpleSubscript(cursor.options)) {
            return;
        }
        //handle autoParenthesized functions
        var str = '';
        var l = this;
        var i = 0;
        var autoParenthesizedFunctions = cursor.options.autoParenthesizedFunctions;
        var maxLength = autoParenthesizedFunctions._maxLength || 0;
        var autoOperatorNames = cursor.options.autoOperatorNames;
        while (l instanceof Letter && i < maxLength) {
            (str = l.letter + str), (l = l[L]), (i += 1);
        }
        // check for an autoParenthesized functions, going thru substrings longest to shortest
        // only allow autoParenthesized functions that are also autoOperatorNames
        while (str.length) {
            if (autoParenthesizedFunctions.hasOwnProperty(str) &&
                autoOperatorNames.hasOwnProperty(str)) {
                return cursor.parent.write(cursor, '(');
            }
            str = str.slice(1);
        }
    }
    createLeftOf(cursor) {
        super.createLeftOf(cursor);
        this.checkAutoCmds(cursor);
        this.autoParenthesize(cursor);
    }
    italicize(bool) {
        this.isItalic = bool;
        this.isPartOfOperator = !bool;
        this.domFrag().toggleClass('mq-operator-name', !bool);
        return this;
    }
    finalizeTree(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    siblingDeleted(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    siblingCreated(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    sharedSiblingMethod(opts, dir) {
        // don't auto-un-italicize if the sibling to my right changed (dir === R or
        // undefined) and it's now a Letter, it will un-italicize everyone
        if (dir !== L && this[R] instanceof Letter)
            return;
        this.autoUnItalicize(opts);
    }
    autoUnItalicize(opts) {
        var autoOps = opts.autoOperatorNames;
        if (autoOps._maxLength === 0)
            return;
        //exit early if in simple subscript and disableAutoSubstitutionInSubscripts is set.
        if (this.shouldIgnoreSubstitutionInSimpleSubscript(opts)) {
            return;
        }
        // want longest possible operator names, so join together entire contiguous
        // sequence of letters
        var str = this.letter;
        for (var l = this[L]; l instanceof Letter; l = l[L])
            str = l.letter + str;
        for (var r = this[R]; r instanceof Letter; r = r[R])
            str += r.letter;
        // removeClass and delete flags from all letters before figuring out
        // which, if any, are part of an operator name
        var lR = l && l[R];
        var rL = r && r[L];
        new Fragment(lR || this.parent.getEnd(L), rL || this.parent.getEnd(R)).each(function (el) {
            if (el instanceof Letter) {
                el.italicize(true)
                    .domFrag()
                    .removeClass('mq-first mq-last mq-followed-by-supsub');
                el.ctrlSeq = el.letter;
            }
            return undefined;
        });
        let autoOpsLength = autoOps._maxLength || 0;
        // check for operator names: at each position from left to right, check
        // substrings from longest to shortest
        outer: for (var i = 0, first = l[R] || this.parent.getEnd(L); first && i < str.length; i += 1, first = first[R]) {
            for (var len = min(autoOpsLength, str.length - i); len > 0; len -= 1) {
                var word = str.slice(i, i + len);
                var last = undefined; // TODO - TS complaining that we use last before assigning to it
                if (autoOps.hasOwnProperty(word)) {
                    for (var j = 0, letter = first; j < len; j += 1, letter = letter[R]) {
                        if (letter instanceof Letter) {
                            letter.italicize(false);
                            last = letter;
                        }
                    }
                    var isBuiltIn = BuiltInOpNames.hasOwnProperty(word);
                    first.ctrlSeq =
                        (isBuiltIn ? '\\' : '\\operatorname{') + first.ctrlSeq;
                    last.ctrlSeq += isBuiltIn ? ' ' : '}';
                    if (TwoWordOpNames.hasOwnProperty(word)) {
                        const lastL = last[L];
                        const lastLL = lastL && lastL[L];
                        const lastLLL = (lastLL && lastLL[L]);
                        lastLLL.domFrag().addClass('mq-last');
                    }
                    if (!this.shouldOmitPadding(first[L]))
                        first.domFrag().addClass('mq-first');
                    if (!this.shouldOmitPadding(last[R])) {
                        if (last[R] instanceof SupSub) {
                            var supsub = last[R]; // XXX monkey-patching, but what's the right thing here?
                            // Have operatorname-specific code in SupSub? A CSS-like language to style the
                            // math tree, but which ignores cursor and selection (which CSS can't)?
                            var respace = (supsub.siblingCreated =
                                supsub.siblingDeleted =
                                    function () {
                                        supsub
                                            .domFrag()
                                            .toggleClass('mq-after-operator-name', !(supsub[R] instanceof Bracket));
                                    });
                            respace();
                        }
                        else {
                            last
                                .domFrag()
                                .toggleClass('mq-last', !(last[R] instanceof Bracket));
                        }
                    }
                    i += len - 1;
                    first = last;
                    continue outer;
                }
            }
        }
    }
    shouldOmitPadding(node) {
        // omit padding if no node
        if (!node)
            return true;
        // do not add padding between letter and '.'
        if (node.ctrlSeq === '.')
            return true;
        // do not add padding between letter and binary operator. The
        // binary operator already has padding
        if (node instanceof BinaryOperator)
            return true;
        if (node instanceof SummationNotation)
            return true;
        return false;
    }
}
var BuiltInOpNames = {}; // the set of operator names like \sin, \cos, etc that
// are built-into LaTeX, see Section 3.17 of the Short Math Guide: http://tinyurl.com/jm9okjc
// MathQuill auto-unitalicizes some operator names not in that set, like 'hcf'
// and 'arsinh', which must be exported as \operatorname{hcf} and
// \operatorname{arsinh}. Note: over/under line/arrow \lim variants like
// \varlimsup are not supported
// the set of operator names that MathQuill auto-unitalicizes by default; overridable
Options.prototype.autoOperatorNames = defaultAutoOpNames();
var TwoWordOpNames = { limsup: 1, liminf: 1, projlim: 1, injlim: 1 };
function defaultAutoOpNames() {
    const AutoOpNames = {
        _maxLength: 9,
    };
    var mostOps = ('arg deg det dim exp gcd hom inf ker lg lim ln log max min sup' +
        ' limsup liminf injlim projlim Pr').split(' ');
    for (var i = 0; i < mostOps.length; i += 1) {
        BuiltInOpNames[mostOps[i]] = AutoOpNames[mostOps[i]] = 1;
    }
    var builtInTrigs = 'sin cos tan arcsin arccos arctan sinh cosh tanh sec csc cot coth'.split(
    // why coth but not sech and csch, LaTeX?
    ' ');
    for (var i = 0; i < builtInTrigs.length; i += 1) {
        BuiltInOpNames[builtInTrigs[i]] = 1;
    }
    var autoTrigs = 'sin cos tan sec cosec csc cotan cot ctg'.split(' ');
    for (var i = 0; i < autoTrigs.length; i += 1) {
        AutoOpNames[autoTrigs[i]] =
            AutoOpNames['arc' + autoTrigs[i]] =
                AutoOpNames[autoTrigs[i] + 'h'] =
                    AutoOpNames['ar' + autoTrigs[i] + 'h'] =
                        AutoOpNames['arc' + autoTrigs[i] + 'h'] =
                            1;
    }
    // compat with some of the nonstandard LaTeX exported by MathQuill
    // before #247. None of these are real LaTeX commands so, seems safe
    var moreNonstandardOps = 'gcf hcf lcm proj span'.split(' ');
    for (var i = 0; i < moreNonstandardOps.length; i += 1) {
        AutoOpNames[moreNonstandardOps[i]] = 1;
    }
    return AutoOpNames;
}
baseOptionProcessors.autoOperatorNames = function (cmds) {
    if (typeof cmds !== 'string') {
        throw '"' + cmds + '" not a space-delimited list';
    }
    if (!/^[a-z\|\-]+(?: [a-z\|\-]+)*$/i.test(cmds)) {
        throw '"' + cmds + '" not a space-delimited list of letters or "|"';
    }
    var list = cmds.split(' ');
    var dict = {};
    var maxLength = 0;
    for (var i = 0; i < list.length; i += 1) {
        var cmd = list[i];
        if (cmd.length < 2) {
            throw '"' + cmd + '" not minimum length of 2';
        }
        if (cmd.indexOf('|') < 0) {
            // normal auto operator
            dict[cmd] = cmd;
            maxLength = max(maxLength, cmd.length);
        }
        else {
            // this item has a speech-friendly alternative
            var cmdArray = cmd.split('|');
            if (cmdArray.length > 2) {
                throw '"' + cmd + '" has more than 1 mathspeak delimiter';
            }
            if (cmdArray[0].length < 2) {
                throw '"' + cmd[0] + '" not minimum length of 2';
            }
            dict[cmdArray[0]] = cmdArray[1].replace(/-/g, ' '); // convert dashes to spaces for the sake of speech
            maxLength = max(maxLength, cmdArray[0].length);
        }
    }
    dict._maxLength = maxLength;
    return dict;
};
class OperatorName extends MQSymbol {
    constructor(fn) {
        super(fn || '');
    }
    createLeftOf(cursor) {
        var fn = this.ctrlSeq;
        for (var i = 0; i < fn.length; i += 1) {
            new Letter(fn.charAt(i)).createLeftOf(cursor);
        }
    }
    parser() {
        var fn = this.ctrlSeq;
        var block = new MathBlock();
        for (var i = 0; i < fn.length; i += 1) {
            new Letter(fn.charAt(i)).adopt(block, block.getEnd(R), 0);
        }
        return Parser.succeed(block.children());
    }
}
for (var fn in Options.prototype.autoOperatorNames)
    if (Options.prototype.autoOperatorNames.hasOwnProperty(fn)) {
        LatexCmds[fn] = OperatorName;
    }
LatexCmds.operatorname = class extends MathCommand {
    createLeftOf() { }
    numBlocks() {
        return 1;
    }
    parser() {
        return latexMathParser.block.map(function (b) {
            // Check for the special case of \operatorname{ans}, which has
            // a special html representation
            var isAllLetters = true;
            var str = '';
            var children = b.children();
            children.each(function (child) {
                if (child instanceof Letter) {
                    str += child.letter;
                }
                else {
                    isAllLetters = false;
                }
                return undefined;
            });
            if (isAllLetters && str === 'ans') {
                return AnsBuilder();
            }
            // In cases other than `ans`, just return the children directly
            return children;
        });
    }
};
LatexCmds.f = class extends Letter {
    constructor() {
        var letter = 'f';
        super(letter);
        this.letter = letter;
        this.domView = new DOMView(0, () => h('var', { class: 'mq-f' }, [h.text('f')]));
    }
    italicize(bool) {
        // Why is this necesssary? Does someone replace the `f` at some
        // point?
        this.domFrag().eachElement((el) => (el.textContent = 'f'));
        this.domFrag().toggleClass('mq-f', bool);
        return super.italicize(bool);
    }
};
// VanillaSymbol's
LatexCmds[' '] = LatexCmds.space = () => new DigitGroupingChar('\\ ', h('span', {}, [h.text(U_NO_BREAK_SPACE)]), ' ');
LatexCmds['.'] = () => new DigitGroupingChar('.', h('span', { class: 'mq-digit' }, [h.text('.')]), '.');
LatexCmds["'"] = LatexCmds.prime = bindVanillaSymbol("'", '&prime;', 'prime');
LatexCmds['\u2033'] = LatexCmds.dprime = bindVanillaSymbol('\u2033', '&Prime;', 'double prime');
LatexCmds.backslash = bindVanillaSymbol('\\backslash ', '\\', 'backslash');
if (!CharCmds['\\'])
    CharCmds['\\'] = LatexCmds.backslash;
LatexCmds.$ = bindVanillaSymbol('\\$', '$', 'dollar');
LatexCmds.square = bindVanillaSymbol('\\square ', '\u25A1', 'square');
LatexCmds.mid = bindVanillaSymbol('\\mid ', '\u2223', 'mid');
// does not use Symbola font
class NonSymbolaSymbol extends MQSymbol {
    constructor(ch, html, _unusedMathspeak) {
        super(ch, h('span', { class: 'mq-nonSymbola' }, [html || h.text(ch)]));
    }
}
LatexCmds['@'] = () => new NonSymbolaSymbol('@');
LatexCmds['&'] = () => new NonSymbolaSymbol('\\&', h.entityText('&amp;'), 'and');
LatexCmds['%'] = class extends NonSymbolaSymbol {
    constructor() {
        super('\\%', h.text('%'), 'percent');
    }
    parser() {
        var optWhitespace = Parser.optWhitespace;
        var string = Parser.string;
        // Parse `\%\operatorname{of}` as special `percentof` node so that
        // it will be serialized properly and deleted as a unit.
        return optWhitespace
            .then(string('\\operatorname{of}').map(function () {
            return PercentOfBuilder();
        }))
            .or(super.parser());
    }
};
LatexCmds['\u2225'] = LatexCmds.parallel = bindVanillaSymbol('\\parallel ', '&#x2225;', 'parallel');
LatexCmds['\u2226'] = LatexCmds.nparallel = bindVanillaSymbol('\\nparallel ', '&#x2226;', 'not parallel');
LatexCmds['\u27c2'] = LatexCmds.perp = bindVanillaSymbol('\\perp ', '&#x27C2;', 'perpendicular');
//the following are all Greek to me, but this helped a lot: http://www.ams.org/STIX/ion/stixsig03.html
//lowercase Greek letter variables
LatexCmds.alpha =
    LatexCmds.beta =
        LatexCmds.gamma =
            LatexCmds.delta =
                LatexCmds.zeta =
                    LatexCmds.eta =
                        LatexCmds.theta =
                            LatexCmds.iota =
                                LatexCmds.kappa =
                                    LatexCmds.mu =
                                        LatexCmds.nu =
                                            LatexCmds.xi =
                                                LatexCmds.rho =
                                                    LatexCmds.sigma =
                                                        LatexCmds.tau =
                                                            LatexCmds.chi =
                                                                LatexCmds.psi =
                                                                    LatexCmds.omega =
                                                                        (latex) => new Variable('\\' + latex + ' ', h.entityText('&' + latex + ';'));
//why can't anybody FUCKING agree on these
LatexCmds.phi = bindVariable('\\phi ', '&#981;', 'phi'); //W3C or Unicode?
LatexCmds.phiv = LatexCmds.varphi = bindVariable('\\varphi ', '&phi;', 'phi'); //Elsevier and 9573-13 //AMS and LaTeX
LatexCmds.epsilon = bindVariable('\\epsilon ', '&#1013;', 'epsilon'); //W3C or Unicode?
LatexCmds.epsiv = LatexCmds.varepsilon = bindVariable(
//Elsevier and 9573-13 //AMS and LaTeX
'\\varepsilon ', '&epsilon;', 'epsilon');
LatexCmds.piv = LatexCmds.varpi = bindVariable('\\varpi ', '&piv;', 'piv'); //W3C/Unicode and Elsevier and 9573-13 //AMS and LaTeX
LatexCmds.sigmaf = //W3C/Unicode
    LatexCmds.sigmav = //Elsevier
        LatexCmds.varsigma = //LaTeX
            bindVariable('\\varsigma ', '&sigmaf;', 'sigma');
LatexCmds.thetav = //Elsevier and 9573-13
    LatexCmds.vartheta = //AMS and LaTeX
        LatexCmds.thetasym = //W3C/Unicode
            bindVariable('\\vartheta ', '&thetasym;', 'theta');
LatexCmds.upsilon = LatexCmds.upsi = bindVariable(
//AMS and LaTeX and W3C/Unicode //Elsevier and 9573-13
'\\upsilon ', '&upsilon;', 'upsilon');
//these aren't even mentioned in the HTML character entity references
LatexCmds.gammad = //Elsevier
    LatexCmds.Gammad = //9573-13 -- WTF, right? I dunno if this was a typo in the reference (see above)
        LatexCmds.digamma = //LaTeX
            bindVariable('\\digamma ', '&#989;', 'gamma');
LatexCmds.kappav = LatexCmds.varkappa = bindVariable(
//Elsevier //AMS and LaTeX
'\\varkappa ', '&#1008;', 'kappa');
LatexCmds.rhov = LatexCmds.varrho = bindVariable('\\varrho ', '&#1009;', 'rho'); //Elsevier and 9573-13 //AMS and LaTeX
//Greek constants, look best in non-italicized Times New Roman
LatexCmds.pi = LatexCmds['\u03c0'] = () => new NonSymbolaSymbol('\\pi ', h.entityText('&pi;'), 'pi');
LatexCmds.lambda = () => new NonSymbolaSymbol('\\lambda ', h.entityText('&lambda;'), 'lambda');
//uppercase greek letters
LatexCmds.Upsilon = //LaTeX
    LatexCmds.Upsi = //Elsevier and 9573-13
        LatexCmds.upsih = //W3C/Unicode "upsilon with hook"
            LatexCmds.Upsih = //'cos it makes sense to me
                () => new MQSymbol('\\Upsilon ', h('var', { style: 'font-family: serif' }, [h.entityText('&upsih;')]), 'capital upsilon'); //Symbola's 'upsilon with a hook' is a capital Y without hooks :(
//other symbols with the same LaTeX command and HTML character entity reference
LatexCmds.Gamma =
    LatexCmds.Delta =
        LatexCmds.Theta =
            LatexCmds.Lambda =
                LatexCmds.Xi =
                    LatexCmds.Pi =
                        LatexCmds.Sigma =
                            LatexCmds.Phi =
                                LatexCmds.Psi =
                                    LatexCmds.Omega =
                                        LatexCmds.forall =
                                            (latex) => new VanillaSymbol('\\' + latex + ' ', h.entityText('&' + latex + ';'));
// symbols that aren't a single MathCommand, but are instead a whole
// Fragment. Creates the Fragment from a LaTeX string
class LatexFragment extends MathCommand {
    constructor(latex) {
        super();
        this.latexStr = latex;
    }
    createLeftOf(cursor) {
        var block = latexMathParser.parse(this.latexStr);
        block
            .children()
            .adopt(cursor.parent, cursor[L], cursor[R]);
        cursor[L] = block.getEnd(R);
        domFrag(block.html()).insertBefore(cursor.domFrag());
        block.finalizeInsert(cursor.options, cursor);
        var blockEndsR = block.getEnd(R);
        var blockEndsRR = blockEndsR && blockEndsR[R];
        if (blockEndsRR)
            blockEndsRR.siblingCreated(cursor.options, L);
        var blockEndsL = block.getEnd(L);
        var blockEndsLL = blockEndsL && blockEndsL[L];
        if (blockEndsLL)
            blockEndsLL.siblingCreated(cursor.options, R);
        cursor.parent.bubble(function (node) {
            node.reflow();
            return undefined;
        });
    }
    mathspeak() {
        return latexMathParser.parse(this.latexStr).mathspeak();
    }
    parser() {
        var frag = latexMathParser.parse(this.latexStr).children();
        return Parser.succeed(frag);
    }
}
// for what seems to me like [stupid reasons][1], Unicode provides
// subscripted and superscripted versions of all ten Arabic numerals,
// as well as [so-called "vulgar fractions"][2].
// Nobody really cares about most of them, but some of them actually
// predate Unicode, dating back to [ISO-8859-1][3], apparently also
// known as "Latin-1", which among other things [Windows-1252][4]
// largely coincides with, so Microsoft Word sometimes inserts them
// and they get copy-pasted into MathQuill.
//
// (Irrelevant but funny story: though not a superset of Latin-1 aka
// ISO-8859-1, Windows-1252 **is** a strict superset of the "closely
// related but distinct"[3] "ISO 8859-1" -- see the lack of a dash
// after "ISO"? Completely different character set, like elephants vs
// elephant seals, or "Zombies" vs "Zombie Redneck Torture Family".
// What kind of idiot would get them confused.
// People in fact got them confused so much, it was so common to
// mislabel Windows-1252 text as ISO-8859-1, that most modern web
// browsers and email clients treat the MIME charset of ISO-8859-1
// as actually Windows-1252, behavior now standard in the HTML5 spec.)
//
// [1]: http://en.wikipedia.org/wiki/Unicode_subscripts_andsuper_scripts
// [2]: http://en.wikipedia.org/wiki/Number_Forms
// [3]: http://en.wikipedia.org/wiki/ISO/IEC_8859-1
// [4]: http://en.wikipedia.org/wiki/Windows-1252
LatexCmds['\u2070'] = () => new LatexFragment('^0');
LatexCmds['\u00b9'] = () => new LatexFragment('^1');
LatexCmds['\u00b2'] = () => new LatexFragment('^2');
LatexCmds['\u00b3'] = () => new LatexFragment('^3');
LatexCmds['\u2074'] = () => new LatexFragment('^4');
LatexCmds['\u2075'] = () => new LatexFragment('^5');
LatexCmds['\u2076'] = () => new LatexFragment('^6');
LatexCmds['\u2077'] = () => new LatexFragment('^7');
LatexCmds['\u2078'] = () => new LatexFragment('^8');
LatexCmds['\u2079'] = () => new LatexFragment('^9');
LatexCmds['\u00bc'] = () => new LatexFragment('\\frac14');
LatexCmds['\u00bd'] = () => new LatexFragment('\\frac12');
LatexCmds['\u00be'] = () => new LatexFragment('\\frac34');
// this is a hack to make pasting the \u221a symbol
// actually insert a sqrt command. This isn't ideal,
// but it's way better than what we have now. I think
// before we invest any more time into this single character
// we should consider how to make the pipe (|) automatically
// insert absolute value. We also will want the percent (%)
// to expand to '% of'. I've always just thought mathquill's
// ability to handle pasted latex magical until I started actually
// testing it. It's a lot more buggy that I previously thought.
//
// KNOWN ISSUES:
// 1) pasting \u221a does not put focus in side the sqrt symbol
// 2) pasting \u221a2 puts the 2 outside of the sqrt symbol.
//
// The first issue seems like we could invest more time into this to
// fix it, but doesn't feel worth special casing. I think we'd want
// to address it by addressing ALL pasting issues.
//
// The second issue seems like it might go away too if you fix paste to
// act more like simply typing the characters out. I'd be scared to try
// to make that change because I'm fairly confident I'd break something
// around handling valid latex as latex rather than treating it as keystrokes.
LatexCmds['\u221a'] = () => new LatexFragment('\\sqrt{}');
// Binary operator determination is used in several contexts for PlusMinus nodes and their descendants.
// For instance, we set the item's class name based on this factor, and also assign different mathspeak values (plus vs positive, negative vs minus).
function isBinaryOperator(node) {
    if (!node)
        return false;
    const nodeL = node[L];
    if (nodeL) {
        // If the left sibling is a binary operator or a separator (comma, semicolon, colon, space)
        // or an open bracket (open parenthesis, open square bracket)
        // consider the operator to be unary
        if (nodeL instanceof BinaryOperator ||
            /^(\\ )|[,;:\(\[]$/.test(nodeL.ctrlSeq)) {
            return false;
        }
    }
    else if (node.parent &&
        node.parent.parent &&
        node.parent.parent.isStyleBlock()) {
        //if we are in a style block at the leftmost edge, determine unary/binary based on
        //the style block
        //this allows style blocks to be transparent for unary/binary purposes
        return isBinaryOperator(node.parent.parent);
    }
    else {
        return false;
    }
    return true;
}
var PlusMinus = class extends BinaryOperator {
    constructor(ch, html, mathspeak) {
        super(ch, html, undefined, mathspeak, true);
    }
    contactWeld(cursor, dir) {
        this.sharedSiblingMethod(cursor.options, dir);
    }
    siblingCreated(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    siblingDeleted(opts, dir) {
        this.sharedSiblingMethod(opts, dir);
    }
    sharedSiblingMethod(_opts, dir) {
        if (dir === R)
            return; // ignore if sibling only changed on the right
        this.domFrag().oneElement().className = isBinaryOperator(this)
            ? 'mq-binary-operator'
            : '';
        return this;
    }
};
LatexCmds['+'] = class extends PlusMinus {
    constructor() {
        super('+', h.text('+'));
    }
    mathspeak() {
        return isBinaryOperator(this) ? 'plus' : 'positive';
    }
};
//yes, these are different dashes, en-dash, em-dash, unicode minus, actual dash
class MinusNode extends PlusMinus {
    constructor() {
        super('-', h.entityText('&minus;'));
    }
    mathspeak() {
        return isBinaryOperator(this) ? 'minus' : 'negative';
    }
}
LatexCmds['\u2212'] = LatexCmds['\u2014'] = LatexCmds['\u2013'] = LatexCmds['-'] = MinusNode;
LatexCmds['\u00b1'] =
    LatexCmds.pm =
        LatexCmds.plusmn =
            LatexCmds.plusminus =
                () => new PlusMinus('\\pm ', h.entityText('&plusmn;'), 'plus-or-minus');
LatexCmds.mp =
    LatexCmds.mnplus =
        LatexCmds.minusplus =
            () => new PlusMinus('\\mp ', h.entityText('&#8723;'), 'minus-or-plus');
CharCmds['*'] =
    LatexCmds.sdot =
        LatexCmds.cdot =
            bindBinaryOperator('\\cdot ', '&middot;', '*', 'times'); //semantically should be &sdot;, but &middot; looks better
class To extends BinaryOperator {
    constructor() {
        super('\\to ', h.entityText('&rarr;'), 'to');
    }
    deleteTowards(dir, cursor) {
        if (dir === L) {
            var l = cursor[L];
            new Fragment(l, this).remove();
            cursor[L] = l[L];
            new MinusNode().createLeftOf(cursor);
            cursor[L].bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return;
        }
        super.deleteTowards(dir, cursor);
    }
}
LatexCmds['\u2192'] = LatexCmds.to = To;
class Inequality extends BinaryOperator {
    constructor(data, strict) {
        var strictness = strict ? 'Strict' : '';
        super(data[`ctrlSeq${strictness}`], h.entityText(data[`htmlEntity${strictness}`]), data[`text${strictness}`], data[`mathspeak${strictness}`]);
        this.data = data;
        this.strict = strict;
    }
    swap(strict) {
        this.strict = strict;
        var strictness = strict ? 'Strict' : '';
        this.ctrlSeq = this.data[`ctrlSeq${strictness}`];
        this.domFrag()
            .children()
            .replaceWith(domFrag(h.entityText(this.data[`htmlEntity${strictness}`])));
        this.textTemplate = [this.data[`text${strictness}`]];
        this.mathspeakName = this.data[`mathspeak${strictness}`];
    }
    deleteTowards(dir, cursor) {
        if (dir === L && !this.strict) {
            this.swap(true);
            this.bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return;
        }
        super.deleteTowards(dir, cursor);
    }
}
var less = {
    ctrlSeq: '\\le ',
    htmlEntity: '&le;',
    text: '\u2264',
    mathspeak: 'less than or equal to',
    ctrlSeqStrict: '<',
    htmlEntityStrict: '&lt;',
    textStrict: '<',
    mathspeakStrict: 'less than',
};
var greater = {
    ctrlSeq: '\\ge ',
    htmlEntity: '&ge;',
    text: '\u2265',
    mathspeak: 'greater than or equal to',
    ctrlSeqStrict: '>',
    htmlEntityStrict: '&gt;',
    textStrict: '>',
    mathspeakStrict: 'greater than',
};
class Greater extends Inequality {
    constructor() {
        super(greater, true);
    }
    createLeftOf(cursor) {
        const cursorL = cursor[L];
        if (cursorL instanceof BinaryOperator && cursorL.ctrlSeq === '-') {
            var l = cursorL;
            cursor[L] = l[L];
            l.remove();
            new To().createLeftOf(cursor);
            cursor[L].bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return;
        }
        super.createLeftOf(cursor);
    }
}
LatexCmds['<'] = LatexCmds.lt = () => new Inequality(less, true);
LatexCmds['>'] = LatexCmds.gt = Greater;
LatexCmds['\u2264'] =
    LatexCmds.le =
        LatexCmds.leq =
            () => new Inequality(less, false);
LatexCmds['\u2265'] =
    LatexCmds.ge =
        LatexCmds.geq =
            () => new Inequality(greater, false);
LatexCmds.infty =
    LatexCmds.infin =
        LatexCmds.infinity =
            bindVanillaSymbol('\\infty ', '&infin;', 'infinity');
LatexCmds['\u2260'] =
    LatexCmds.ne =
        LatexCmds.neq =
            bindBinaryOperator('\\ne ', '&ne;', 'not equal');
class Equality extends BinaryOperator {
    constructor() {
        super('=', h.text('='), '=', 'equals');
    }
    createLeftOf(cursor) {
        var cursorL = cursor[L];
        if (cursorL instanceof Inequality && cursorL.strict) {
            cursorL.swap(false);
            cursorL.bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return;
        }
        super.createLeftOf(cursor);
    }
}
LatexCmds['='] = Equality;
LatexCmds['\u00d7'] =
    LatexCmds.times =
        LatexCmds.cross =
            bindBinaryOperator('\\times ', '&times;', '[x]', 'times');
LatexCmds['\u00f7'] =
    LatexCmds.div =
        LatexCmds.divide =
            LatexCmds.divides =
                bindBinaryOperator('\\div ', '&divide;', '[/]', 'over');
class Sim extends BinaryOperator {
    constructor() {
        super('\\sim ', h.text('~'), '~', 'tilde');
    }
    createLeftOf(cursor) {
        if (cursor[L] instanceof Sim) {
            var l = cursor[L];
            cursor[L] = l[L];
            l.remove();
            new Approx().createLeftOf(cursor);
            cursor[L].bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return;
        }
        super.createLeftOf(cursor);
    }
}
class Approx extends BinaryOperator {
    constructor() {
        super('\\approx ', h.entityText('&approx;'), '\u2248', 'approximately equal');
    }
    deleteTowards(dir, cursor) {
        if (dir === L) {
            var l = cursor[L];
            new Fragment(l, this).remove();
            cursor[L] = l[L];
            new Sim().createLeftOf(cursor);
            cursor[L].bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return;
        }
        super.deleteTowards(dir, cursor);
    }
}
LatexCmds.tildeNbsp = bindVanillaSymbol('~', U_NO_BREAK_SPACE, ' ');
LatexCmds.sim = Sim;
LatexCmds['\u2248'] = LatexCmds.approx = Approx;
// When interpreting raw LaTeX, we can either evaluate the tilde as its standard nonbreaking space
// or transform it to the \sim operator depending on whether the "interpretTildeAsSim" configuration option is set.
// Tilde symbols input from a keyboard will always be transformed to \sim.
CharCmds['~'] = LatexCmds.sim;
LatexCmds['~'] = LatexCmds.tildeNbsp;
baseOptionProcessors.interpretTildeAsSim = function (val) {
    const interpretAsSim = !!val;
    if (interpretAsSim) {
        LatexCmds['~'] = LatexCmds.sim;
    }
    else {
        LatexCmds['~'] = LatexCmds.tildeNbsp;
    }
    return interpretAsSim;
};
/***************************
 * Commands and Operators.
 **************************/
var SVG_SYMBOLS = {
    sqrt: {
        width: '',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 32 54' }, [
            h('path', {
                d: 'M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33',
            }),
        ]),
    },
    '|': {
        width: '.4em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
            h('path', { d: 'M4.4 0 L4.4 54 L5.6 54 L5.6 0' }),
        ]),
    },
    '[': {
        width: '.55em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
            h('path', { d: 'M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1' }),
        ]),
    },
    ']': {
        width: '.55em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
            h('path', { d: 'M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1' }),
        ]),
    },
    '(': {
        width: '.55em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
            h('path', {
                d: 'M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0',
            }),
        ]),
    },
    ')': {
        width: '.55em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
            h('path', {
                d: 'M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0',
            }),
        ]),
    },
    '{': {
        width: '.7em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
            h('path', {
                d: 'M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0',
            }),
        ]),
    },
    '}': {
        width: '.7em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
            h('path', {
                d: 'M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0',
            }),
        ]),
    },
    '&#8741;': {
        width: '.7em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
            h('path', { d: 'M3.2 0 L3.2 54 L4 54 L4 0 M6.8 0 L6.8 54 L6 54 L6 0' }),
        ]),
    },
    '&lang;': {
        width: '.55em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
            h('path', { d: 'M6.8 0 L3.2 27 L6.8 54 L7.8 54 L4.2 27 L7.8 0' }),
        ]),
    },
    '&rang;': {
        width: '.55em',
        html: () => h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
            h('path', { d: 'M3.2 0 L6.8 27 L3.2 54 L2.2 54 L5.8 27 L2.2 0' }),
        ]),
    },
};
class Style extends MathCommand {
    constructor(ctrlSeq, tagName, attrs, ariaLabel, opts) {
        super(ctrlSeq, new DOMView(1, (blocks) => h.block(tagName, attrs, blocks[0])));
        this.ariaLabel = ariaLabel || ctrlSeq.replace(/^\\/, '');
        this.mathspeakTemplate = [
            'Start' + this.ariaLabel + ',',
            'End' + this.ariaLabel,
        ];
        // In most cases, mathspeak should announce the start and end of style blocks.
        // There is one exception currently (mathrm).
        this.shouldNotSpeakDelimiters = opts && opts.shouldNotSpeakDelimiters;
    }
    mathspeak(opts) {
        if (!this.shouldNotSpeakDelimiters || (opts && opts.ignoreShorthand)) {
            return super.mathspeak();
        }
        return this.foldChildren('', function (speech, block) {
            return speech + ' ' + block.mathspeak(opts);
        }).trim();
    }
}
//fonts
LatexCmds.mathrm = class extends Style {
    constructor() {
        super('\\mathrm', 'span', { class: 'mq-roman mq-font' }, 'Roman Font', {
            shouldNotSpeakDelimiters: true,
        });
    }
    isTextBlock() {
        return true;
    }
};
LatexCmds.mathit = () => new Style('\\mathit', 'i', { class: 'mq-font' }, 'Italic Font');
LatexCmds.mathbf = () => new Style('\\mathbf', 'b', { class: 'mq-font' }, 'Bold Font');
LatexCmds.mathsf = () => new Style('\\mathsf', 'span', { class: 'mq-sans-serif mq-font' }, 'Serif Font');
LatexCmds.mathtt = () => new Style('\\mathtt', 'span', { class: 'mq-monospace mq-font' }, 'Math Text');
//text-decoration
LatexCmds.underline = () => new Style('\\underline', 'span', { class: 'mq-non-leaf mq-underline' }, 'Underline');
LatexCmds.overline = LatexCmds.bar = () => new Style('\\overline', 'span', { class: 'mq-non-leaf mq-overline' }, 'Overline');
LatexCmds.overrightarrow = () => new Style('\\overrightarrow', 'span', { class: 'mq-non-leaf mq-overarrow mq-arrow-right' }, 'Over Right Arrow');
LatexCmds.overleftarrow = () => new Style('\\overleftarrow', 'span', { class: 'mq-non-leaf mq-overarrow mq-arrow-left' }, 'Over Left Arrow');
LatexCmds.overleftrightarrow = () => new Style('\\overleftrightarrow ', 'span', { class: 'mq-non-leaf mq-overarrow mq-arrow-leftright' }, 'Over Left and Right Arrow');
LatexCmds.overarc = () => new Style('\\overarc', 'span', { class: 'mq-non-leaf mq-overarc' }, 'Over Arc');
LatexCmds.dot = () => {
    return new MathCommand('\\dot', new DOMView(1, (blocks) => h('span', { class: 'mq-non-leaf' }, [
        h('span', { class: 'mq-dot-recurring-inner' }, [
            h('span', { class: 'mq-dot-recurring' }, [h.text(U_DOT_ABOVE)]),
            h.block('span', { class: 'mq-empty-box' }, blocks[0]),
        ]),
    ])));
};
// `\textcolor{color}{math}` will apply a color to the given math content, where
// `color` is any valid CSS Color Value (see [SitePoint docs][] (recommended),
// [Mozilla docs][], or [W3C spec][]).
//
// [SitePoint docs]: http://reference.sitepoint.com/css/colorvalues
// [Mozilla docs]: https://developer.mozilla.org/en-US/docs/CSS/color_value#Values
// [W3C spec]: http://dev.w3.org/csswg/css3-color/#colorunits
LatexCmds.textcolor = class extends MathCommand {
    setColor(color) {
        this.color = color;
        this.domView = new DOMView(1, (blocks) => h.block('span', { class: 'mq-textcolor', style: 'color:' + color }, blocks[0]));
        this.ariaLabel = color.replace(/^\\/, '');
        this.mathspeakTemplate = [
            'Start ' + this.ariaLabel + ',',
            'End ' + this.ariaLabel,
        ];
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        var blocks0 = this.blocks[0];
        ctx.latex += '\\textcolor{' + this.color + '}{';
        blocks0.latexRecursive(ctx);
        ctx.latex += '}';
        this.checkCursorContextClose(ctx);
    }
    parser() {
        var optWhitespace = Parser.optWhitespace;
        var string = Parser.string;
        var regex = Parser.regex;
        return optWhitespace
            .then(string('{'))
            .then(regex(/^[#\w\s.,()%-]*/))
            .skip(string('}'))
            .then((color) => {
            this.setColor(color);
            return super.parser();
        });
    }
    isStyleBlock() {
        return true;
    }
};
// Very similar to the \textcolor command, but will add the given CSS class.
// Usage: \class{classname}{math}
// Note regex that whitelists valid CSS classname characters:
// https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
var Class = (LatexCmds['class'] = class extends MathCommand {
    parser() {
        var string = Parser.string, regex = Parser.regex;
        return Parser.optWhitespace
            .then(string('{'))
            .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
            .skip(string('}'))
            .then((cls) => {
            this.cls = cls || '';
            this.domView = new DOMView(1, (blocks) => h.block('span', { class: `mq-class ${cls}` }, blocks[0]));
            this.ariaLabel = cls + ' class';
            this.mathspeakTemplate = [
                'Start ' + this.ariaLabel + ',',
                'End ' + this.ariaLabel,
            ];
            return super.parser();
        });
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        var blocks0 = this.blocks[0];
        ctx.latex += '\\class{' + this.cls + '}{';
        blocks0.latexRecursive(ctx);
        ctx.latex += '}';
        this.checkCursorContextClose(ctx);
    }
    isStyleBlock() {
        return true;
    }
});
// This test is used to determine whether an item may be treated as a whole number
// for shortening the verbalized (mathspeak) forms of some fractions and superscripts.
var intRgx = /^[\+\-]?[\d]+$/;
// Traverses the top level of the passed block's children and returns the concatenation of their ctrlSeq properties.
// Used in shortened mathspeak computations as a block's .text() method can be potentially expensive.
//
function getCtrlSeqsFromBlock(block) {
    if (!block)
        return '';
    let chars = '';
    block.eachChild((child) => {
        if (child.ctrlSeq !== undefined)
            chars += child.ctrlSeq;
    });
    return chars;
}
Options.prototype.charsThatBreakOutOfSupSub = '';
class SupSub extends MathCommand {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '_{...}^{...}';
    }
    setEnds(ends) {
        pray('SupSub ends must be MathBlocks', ends[L] instanceof MathBlock && ends[R] instanceof MathBlock);
        this.ends = ends;
    }
    getEnd(dir) {
        return this.ends[dir];
    }
    createLeftOf(cursor) {
        if (!this.replacedFragment &&
            !cursor[L] &&
            cursor.options.supSubsRequireOperand)
            return;
        return super.createLeftOf(cursor);
    }
    contactWeld(cursor) {
        // Look on either side for a SupSub, if one is found compare my
        // .sub, .sup with its .sub, .sup. If I have one that it doesn't,
        // then call .addBlock() on it with my block; if I have one that
        // it also has, then insert my block's children into its block,
        // unless my block has none, in which case insert the cursor into
        // its block (and not mine, I'm about to remove myself) in the case
        // I was just typed.
        // TODO: simplify
        // equiv. to [L, R].forEach(function(dir) { ... });
        for (var dir = L; dir; dir = dir === L ? R : false) {
            const thisDir = this[dir];
            let pt;
            if (thisDir instanceof SupSub) {
                // equiv. to 'sub sup'.split(' ').forEach(function(supsub) { ... });
                for (var supsub = 'sub'; supsub; supsub = supsub === 'sub' ? 'sup' : false) {
                    var src = this[supsub], dest = thisDir[supsub];
                    if (!src)
                        continue;
                    if (!dest)
                        thisDir.addBlock(src.disown());
                    else if (!src.isEmpty()) {
                        // ins src children at -dir end of dest
                        src
                            .domFrag()
                            .children()
                            .insAtDirEnd(-dir, dest.domFrag().oneElement());
                        var children = src.children().disown();
                        pt = new Point(dest, children.getEnd(R), dest.getEnd(L));
                        if (dir === L)
                            children.adopt(dest, dest.getEnd(R), 0);
                        else
                            children.adopt(dest, 0, dest.getEnd(L));
                    }
                    else {
                        pt = new Point(dest, 0, dest.getEnd(L));
                    }
                    this.placeCursor = (function (dest, src) {
                        // TODO: don't monkey-patch
                        return function (cursor) {
                            cursor.insAtDirEnd(-dir, dest || src);
                        };
                    })(dest, src);
                }
                this.remove();
                if (cursor && cursor[L] === this) {
                    if (dir === R && pt) {
                        if (pt[L]) {
                            cursor.insRightOf(pt[L]);
                        }
                        else {
                            cursor.insAtLeftEnd(pt.parent);
                        }
                    }
                    else
                        cursor.insRightOf(thisDir);
                }
                break;
            }
        }
    }
    finalizeTree() {
        var endsL = this.getEnd(L);
        endsL.write = function (cursor, ch) {
            if (cursor.options.autoSubscriptNumerals &&
                this === this.parent.sub &&
                '0123456789'.indexOf(ch) >= 0) {
                var cmd = this.chToCmd(ch, cursor.options);
                if (cmd instanceof MQSymbol)
                    cursor.deleteSelection();
                else
                    cursor.clearSelection().insRightOf(this.parent);
                cmd.createLeftOf(cursor.show());
                cursor.controller.aria
                    .queue('Baseline')
                    .alert(cmd.mathspeak({ createdLeftOf: cursor }));
                return;
            }
            if (cursor[L] &&
                !cursor[R] &&
                !cursor.selection &&
                cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1) {
                cursor.insRightOf(this.parent);
                cursor.controller.aria.queue('Baseline');
            }
            MathBlock.prototype.write.call(this, cursor, ch);
        };
    }
    moveTowards(dir, cursor, updown) {
        if (cursor.options.autoSubscriptNumerals && !this.sup) {
            cursor.insDirOf(dir, this);
        }
        else
            super.moveTowards(dir, cursor, updown);
    }
    deleteTowards(dir, cursor) {
        if (cursor.options.autoSubscriptNumerals && this.sub) {
            var cmd = this.sub.getEnd(-dir);
            if (cmd instanceof MQSymbol)
                cmd.remove();
            else if (cmd)
                cmd.deleteTowards(dir, cursor.insAtDirEnd(-dir, this.sub));
            // TODO: factor out a .removeBlock() or something
            if (this.sub.isEmpty()) {
                this.sub.deleteOutOf(L, cursor.insAtLeftEnd(this.sub));
                if (this.sup)
                    cursor.insDirOf(-dir, this);
                // Note `-dir` because in e.g. x_1^2| want backspacing (leftward)
                // to delete the 1 but to end up rightward of x^2; with non-negated
                // `dir` (try it), the cursor appears to have gone "through" the ^2.
            }
        }
        else
            super.deleteTowards(dir, cursor);
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        if (this.sub) {
            ctx.latex += '_{';
            const beforeLength = ctx.latex.length;
            this.sub.latexRecursive(ctx);
            const afterLength = ctx.latex.length;
            if (beforeLength === afterLength) {
                // nothing was written. so we write a space
                ctx.latex += ' ';
            }
            ctx.latex += '}';
        }
        if (this.sup) {
            ctx.latex += '^{';
            const beforeLength = ctx.latex.length;
            this.sup.latexRecursive(ctx);
            const afterLength = ctx.latex.length;
            if (beforeLength === afterLength) {
                // nothing was written. so we write a space
                ctx.latex += ' ';
            }
            ctx.latex += '}';
        }
        this.checkCursorContextClose(ctx);
    }
    text() {
        function text(prefix, block) {
            var l = (block && block.text()) || '';
            return block
                ? prefix + (l.length === 1 ? l : '(' + (l || ' ') + ')')
                : '';
        }
        return text('_', this.sub) + text('^', this.sup);
    }
    addBlock(block) {
        if (this.supsub === 'sub') {
            this.sup = this.upInto = this.sub.upOutOf = block;
            block.adopt(this, this.sub, 0).downOutOf = this.sub;
            block.setDOM(domFrag(h('span', { class: 'mq-sup' }))
                .append(block.domFrag().children())
                .prependTo(this.domFrag().oneElement())
                .oneElement());
            NodeBase.linkElementByBlockNode(block.domFrag().oneElement(), block);
        }
        else {
            this.sub = this.downInto = this.sup.downOutOf = block;
            block.adopt(this, 0, this.sup).upOutOf = this.sup;
            this.domFrag().removeClass('mq-sup-only');
            block.setDOM(domFrag(h('span', { class: 'mq-sub' }))
                .append(block.domFrag().children())
                .appendTo(this.domFrag().oneElement())
                .oneElement());
            NodeBase.linkElementByBlockNode(block.domFrag().oneElement(), block);
            this.domFrag().append(domFrag(h('span', { style: 'display:inline-block;width:0' }, [
                h.text(U_ZERO_WIDTH_SPACE),
            ])));
        }
        // like 'sub sup'.split(' ').forEach(function(supsub) { ... });
        for (var i = 0; i < 2; i += 1)
            (function (cmd, supsub, oppositeSupsub, updown) {
                const cmdSubSub = cmd[supsub];
                cmdSubSub.deleteOutOf = function (dir, cursor) {
                    cursor.insDirOf(this[dir] ? -dir : dir, this.parent);
                    if (!this.isEmpty()) {
                        var end = this.getEnd(dir);
                        this.children()
                            .disown()
                            .withDirAdopt(dir, cursor.parent, cursor[dir], cursor[-dir])
                            .domFrag()
                            .insDirOf(-dir, cursor.domFrag());
                        cursor[-dir] = end;
                    }
                    cmd.supsub = oppositeSupsub;
                    delete cmd[supsub];
                    delete cmd[`${updown}Into`];
                    const cmdOppositeSupsub = cmd[oppositeSupsub];
                    cmdOppositeSupsub[`${updown}OutOf`] = insLeftOfMeUnlessAtEnd;
                    delete cmdOppositeSupsub.deleteOutOf; // TODO - refactor so this method can be optional
                    if (supsub === 'sub') {
                        cmd.domFrag().addClass('mq-sup-only').children().last().remove();
                    }
                    this.remove();
                };
            })(this, 'sub sup'.split(' ')[i], 'sup sub'.split(' ')[i], 'down up'.split(' ')[i]);
    }
}
function insLeftOfMeUnlessAtEnd(cursor) {
    // cursor.insLeftOf(cmd), unless cursor at the end of block, and every
    // ancestor cmd is at the end of every ancestor block
    var cmd = this.parent;
    var ancestorCmd = cursor;
    do {
        if (ancestorCmd[R])
            return cursor.insLeftOf(cmd);
        ancestorCmd = ancestorCmd.parent.parent;
    } while (ancestorCmd !== cmd);
    cursor.insRightOf(cmd);
    return undefined;
}
class SubscriptCommand extends SupSub {
    constructor() {
        super(...arguments);
        this.supsub = 'sub';
        this.domView = new DOMView(1, (blocks) => h('span', { class: 'mq-supsub mq-non-leaf' }, [
            h.block('span', { class: 'mq-sub' }, blocks[0]),
            h('span', { style: 'display:inline-block;width:0' }, [
                h.text(U_ZERO_WIDTH_SPACE),
            ]),
        ]));
        this.textTemplate = ['_'];
        this.mathspeakTemplate = ['Subscript,', ', Baseline'];
        this.ariaLabel = 'subscript';
    }
    finalizeTree() {
        this.downInto = this.sub = this.getEnd(L);
        this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
        super.finalizeTree();
    }
}
LatexCmds.subscript = LatexCmds._ = SubscriptCommand;
LatexCmds.superscript =
    LatexCmds.supscript =
        LatexCmds['^'] =
            class SuperscriptCommand extends SupSub {
                constructor() {
                    super(...arguments);
                    this.supsub = 'sup';
                    this.domView = new DOMView(1, (blocks) => h('span', { class: 'mq-supsub mq-non-leaf mq-sup-only' }, [
                        h.block('span', { class: 'mq-sup' }, blocks[0]),
                    ]));
                    this.textTemplate = ['^(', ')'];
                    this.ariaLabel = 'superscript';
                    this.mathspeakTemplate = ['Superscript,', ', Baseline'];
                }
                mathspeak(opts) {
                    // Simplify basic exponent speech for common whole numbers.
                    var child = this.upInto;
                    if (child !== undefined) {
                        // Calculate this item's inner text to determine whether to shorten the returned speech.
                        // Do not calculate its inner mathspeak now until we know that the speech is to be truncated.
                        // Since the mathspeak computation is recursive, we want to call it only once in this function to avoid performance bottlenecks.
                        var innerText = getCtrlSeqsFromBlock(child);
                        // If the superscript is a whole number, shorten the speech that is returned.
                        if ((!opts || !opts.ignoreShorthand) && intRgx.test(innerText)) {
                            // Simple cases
                            if (innerText === '0') {
                                return 'to the 0 power';
                            }
                            else if (innerText === '2') {
                                return 'squared';
                            }
                            else if (innerText === '3') {
                                return 'cubed';
                            }
                            // More complex cases.
                            var suffix = '';
                            // Limit suffix addition to exponents < 1000.
                            if (/^[+-]?\d{1,3}$/.test(innerText)) {
                                if (/(11|12|13|4|5|6|7|8|9|0)$/.test(innerText)) {
                                    suffix = 'th';
                                }
                                else if (/1$/.test(innerText)) {
                                    suffix = 'st';
                                }
                                else if (/2$/.test(innerText)) {
                                    suffix = 'nd';
                                }
                                else if (/3$/.test(innerText)) {
                                    suffix = 'rd';
                                }
                            }
                            var innerMathspeak = typeof child === 'object' ? child.mathspeak() : innerText;
                            return 'to the ' + innerMathspeak + suffix + ' power';
                        }
                    }
                    return super.mathspeak();
                }
                finalizeTree() {
                    this.upInto = this.sup = this.getEnd(R);
                    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
                    super.finalizeTree();
                }
            };
class SummationNotation extends MathCommand {
    constructor(ch, symbol, ariaLabel) {
        super();
        this.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
        var domView = new DOMView(2, (blocks) => h('span', { class: 'mq-large-operator mq-non-leaf' }, [
            h('span', { class: 'mq-to' }, [h.block('span', {}, blocks[1])]),
            h('big', {}, [h.text(symbol)]),
            h('span', { class: 'mq-from' }, [h.block('span', {}, blocks[0])]),
        ]));
        MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(this, ch, domView);
    }
    createLeftOf(cursor) {
        super.createLeftOf(cursor);
        if (cursor.options.sumStartsWithNEquals) {
            new Letter('n').createLeftOf(cursor);
            new Equality().createLeftOf(cursor);
        }
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += this.ctrlSeq + '_{';
        let beforeLength = ctx.latex.length;
        this.getEnd(L).latexRecursive(ctx);
        let afterLength = ctx.latex.length;
        if (afterLength === beforeLength) {
            // nothing was written so we write a space
            ctx.latex += ' ';
        }
        ctx.latex += '}^{';
        beforeLength = ctx.latex.length;
        this.getEnd(R).latexRecursive(ctx);
        afterLength = ctx.latex.length;
        if (beforeLength === afterLength) {
            // nothing was written so we write a space
            ctx.latex += ' ';
        }
        ctx.latex += '}';
        this.checkCursorContextClose(ctx);
    }
    mathspeak() {
        return ('Start ' +
            this.ariaLabel +
            ' from ' +
            this.getEnd(L).mathspeak() +
            ' to ' +
            this.getEnd(R).mathspeak() +
            ', end ' +
            this.ariaLabel +
            ', ');
    }
    parser() {
        var string = Parser.string;
        var optWhitespace = Parser.optWhitespace;
        var succeed = Parser.succeed;
        var block = latexMathParser.block;
        var self = this;
        var blocks = (self.blocks = [new MathBlock(), new MathBlock()]);
        for (var i = 0; i < blocks.length; i += 1) {
            blocks[i].adopt(self, self.getEnd(R), 0);
        }
        return optWhitespace
            .then(string('_').or(string('^')))
            .then(function (supOrSub) {
            var child = blocks[supOrSub === '_' ? 0 : 1];
            return block.then(function (block) {
                block.children().adopt(child, child.getEnd(R), 0);
                return succeed(self);
            });
        })
            .many()
            .result(self);
    }
    finalizeTree() {
        var endsL = this.getEnd(L);
        var endsR = this.getEnd(R);
        endsL.ariaLabel = 'lower bound';
        endsR.ariaLabel = 'upper bound';
        this.downInto = endsL;
        this.upInto = endsR;
        endsL.upOutOf = endsR;
        endsR.downOutOf = endsL;
    }
}
LatexCmds['\u2211'] =
    LatexCmds.sum =
        LatexCmds.summation =
            () => new SummationNotation('\\sum ', U_NARY_SUMMATION, 'sum');
LatexCmds['\u220f'] =
    LatexCmds.prod =
        LatexCmds.product =
            () => new SummationNotation('\\prod ', U_NARY_PRODUCT, 'product');
LatexCmds.coprod = LatexCmds.coproduct = () => new SummationNotation('\\coprod ', U_NARY_COPRODUCT, 'co product');
LatexCmds['\u222b'] =
    LatexCmds['int'] =
        LatexCmds.integral =
            class extends SummationNotation {
                constructor() {
                    super('\\int ', '', 'integral');
                    this.ariaLabel = 'integral';
                    this.domView = new DOMView(2, (blocks) => h('span', { class: 'mq-int mq-non-leaf' }, [
                        h('big', {}, [h.text(U_INTEGRAL)]),
                        h('span', { class: 'mq-supsub mq-non-leaf' }, [
                            h('span', { class: 'mq-sup' }, [
                                h.block('span', { class: 'mq-sup-inner' }, blocks[1]),
                            ]),
                            h.block('span', { class: 'mq-sub' }, blocks[0]),
                            h('span', { style: 'display:inline-block;width:0' }, [
                                h.text(U_ZERO_WIDTH_SPACE),
                            ]),
                        ]),
                    ]));
                }
                createLeftOf(cursor) {
                    // FIXME: refactor rather than overriding
                    MathCommand.prototype.createLeftOf.call(this, cursor);
                }
            };
var Fraction = (LatexCmds.frac =
    LatexCmds.dfrac =
        LatexCmds.cfrac =
            LatexCmds.fraction =
                class FracNode extends MathCommand {
                    constructor() {
                        super(...arguments);
                        this.ctrlSeq = '\\frac';
                        this.domView = new DOMView(2, (blocks) => h('span', { class: 'mq-fraction mq-non-leaf' }, [
                            h.block('span', { class: 'mq-numerator' }, blocks[0]),
                            h.block('span', { class: 'mq-denominator' }, blocks[1]),
                            h('span', { style: 'display:inline-block;width:0' }, [
                                h.text(U_ZERO_WIDTH_SPACE),
                            ]),
                        ]));
                        this.textTemplate = ['(', ')/(', ')'];
                    }
                    finalizeTree() {
                        const endsL = this.getEnd(L);
                        const endsR = this.getEnd(R);
                        this.upInto = endsR.upOutOf = endsL;
                        this.downInto = endsL.downOutOf = endsR;
                        endsL.ariaLabel = 'numerator';
                        endsR.ariaLabel = 'denominator';
                        if (this.getFracDepth() > 1) {
                            this.mathspeakTemplate = [
                                'StartNestedFraction,',
                                'NestedOver',
                                ', EndNestedFraction',
                            ];
                        }
                        else {
                            this.mathspeakTemplate = ['StartFraction,', 'Over', ', EndFraction'];
                        }
                    }
                    mathspeak(opts) {
                        if (opts && opts.createdLeftOf) {
                            var cursor = opts.createdLeftOf;
                            return cursor.parent.mathspeak();
                        }
                        var numText = getCtrlSeqsFromBlock(this.getEnd(L));
                        var denText = getCtrlSeqsFromBlock(this.getEnd(R));
                        // Shorten mathspeak value for whole number fractions whose denominator is less than 10.
                        if ((!opts || !opts.ignoreShorthand) &&
                            intRgx.test(numText) &&
                            intRgx.test(denText)) {
                            var isSingular = numText === '1' || numText === '-1';
                            var newDenSpeech = '';
                            if (denText === '2') {
                                newDenSpeech = isSingular ? 'half' : 'halves';
                            }
                            else if (denText === '3') {
                                newDenSpeech = isSingular ? 'third' : 'thirds';
                            }
                            else if (denText === '4') {
                                newDenSpeech = isSingular ? 'quarter' : 'quarters';
                            }
                            else if (denText === '5') {
                                newDenSpeech = isSingular ? 'fifth' : 'fifths';
                            }
                            else if (denText === '6') {
                                newDenSpeech = isSingular ? 'sixth' : 'sixths';
                            }
                            else if (denText === '7') {
                                newDenSpeech = isSingular ? 'seventh' : 'sevenths';
                            }
                            else if (denText === '8') {
                                newDenSpeech = isSingular ? 'eighth' : 'eighths';
                            }
                            else if (denText === '9') {
                                newDenSpeech = isSingular ? 'ninth' : 'ninths';
                            }
                            if (newDenSpeech !== '') {
                                var output = '';
                                // Handle the case of an integer followed by a simplified fraction such as 1\frac{1}{2}.
                                // Such combinations should be spoken aloud as "1 and 1 half."
                                // Start at the left sibling of the fraction and continue leftward until something other than a digit or whitespace is found.
                                var precededByInteger = false;
                                for (var sibling = this[L]; sibling && sibling[L] !== undefined; sibling = sibling[L]) {
                                    // Ignore whitespace
                                    if (sibling.ctrlSeq === '\\ ') {
                                        continue;
                                    }
                                    else if (intRgx.test(sibling.ctrlSeq || '')) {
                                        precededByInteger = true;
                                    }
                                    else {
                                        precededByInteger = false;
                                        break;
                                    }
                                }
                                if (precededByInteger) {
                                    output += 'and ';
                                }
                                output += this.getEnd(L).mathspeak() + ' ' + newDenSpeech;
                                return output;
                            }
                        }
                        return super.mathspeak();
                    }
                    getFracDepth() {
                        var level = 0;
                        var walkUp = function (item, level) {
                            if (item instanceof MQNode &&
                                item.ctrlSeq &&
                                item.ctrlSeq.toLowerCase().search('frac') >= 0)
                                level += 1;
                            if (item && item.parent)
                                return walkUp(item.parent, level);
                            else
                                return level;
                        };
                        return walkUp(this, level);
                    }
                });
var LiveFraction = (LatexCmds.over =
    CharCmds['/'] =
        class extends Fraction {
            createLeftOf(cursor) {
                if (!this.replacedFragment) {
                    var leftward = cursor[L];
                    if (!cursor.options.typingSlashCreatesNewFraction) {
                        while (leftward &&
                            !(leftward instanceof BinaryOperator ||
                                leftward instanceof (LatexCmds.text || noop) ||
                                leftward instanceof SummationNotation ||
                                leftward.ctrlSeq === '\\ ' ||
                                /^[,;:]$/.test(leftward.ctrlSeq)) //lookbehind for operator
                        )
                            leftward = leftward[L];
                    }
                    if (leftward instanceof SummationNotation &&
                        leftward[R] instanceof SupSub) {
                        leftward = leftward[R];
                        let leftwardR = leftward[R];
                        if (leftwardR instanceof SupSub &&
                            leftwardR.ctrlSeq != leftward.ctrlSeq)
                            leftward = leftward[R];
                    }
                    if (leftward !== cursor[L] && !cursor.isTooDeep(1)) {
                        let leftwardR = leftward[R];
                        let cursorL = cursor[L];
                        this.replaces(new Fragment(leftwardR || cursor.parent.getEnd(L), cursorL));
                        cursor[L] = leftward;
                    }
                }
                super.createLeftOf(cursor);
            }
        });
const AnsBuilder = () => new MQSymbol('\\operatorname{ans}', h('span', { class: 'mq-ans' }, [h.text('ans')]), 'ans');
LatexCmds.ans = AnsBuilder;
const PercentOfBuilder = () => new MQSymbol('\\%\\operatorname{of}', h('span', { class: 'mq-nonSymbola mq-operator-name' }, [h.text('% of ')]), 'percent of');
LatexCmds.percent = LatexCmds.percentof = PercentOfBuilder;
/** A Token represents a region in typeset math that is designed to be
 * externally styled and which delegates mousedown events to external
 * handlers.
 *
 * LaTeX syntax: `\token{id}`.
 *
 * Token is designed for similar use cases as EmbedNode. Differences:
 *     * Mousedown events on a Token are not handled by MathQuill (they
 *       are expected to be handled externally).
 *     * The API for Tokens is simpler: they don't require registering
 *       handlers with MathQuill.
 *     * The current syntax for embed (`\embed{name}[id]`) gets the order
 *       of optional and required arguments backwards compared to normal
 *       LaTeX syntax. The syntax of Token is simpler and more in line
 *       with LaTeX
 */
class Token extends MQSymbol {
    constructor() {
        super(...arguments);
        this.tokenId = '';
        this.ctrlSeq = '\\token';
        this.textTemplate = ['token(', ')'];
        this.mathspeakTemplate = ['StartToken,', ', EndToken'];
        this.ariaLabel = 'token';
    }
    html() {
        const out = h('span', {
            class: 'mq-token mq-ignore-mousedown',
            'data-mq-token': this.tokenId,
        });
        this.setDOM(out);
        NodeBase.linkElementByCmdNode(out, this);
        return out;
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += '\\token{' + this.tokenId + '}';
        this.checkCursorContextClose(ctx);
    }
    mathspeak() {
        // If the caller responsible for creating this token has set an aria-label attribute for the inner children, use them in the mathspeak calculation.
        let ariaLabelArray = [];
        this.domFrag()
            .children()
            .eachElement((el) => {
            const label = el.getAttribute('aria-label');
            if (typeof label === 'string' && label !== '')
                ariaLabelArray.push(label);
        });
        return ariaLabelArray.length > 0
            ? ariaLabelArray.join(' ').trim()
            : 'token ' + this.tokenId;
    }
    parser() {
        var self = this;
        return latexMathParser.block.map(function (block) {
            var digit = block.getEnd(L);
            if (digit) {
                self.tokenId += digit.ctrlSeq;
                while ((digit = digit[R])) {
                    self.tokenId += digit.ctrlSeq;
                }
            }
            return self;
        });
    }
}
LatexCmds.token = Token;
class SquareRoot extends MathCommand {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '\\sqrt';
        this.domView = new DOMView(1, (blocks) => h('span', { class: 'mq-non-leaf mq-sqrt-container' }, [
            h('span', { class: 'mq-scaled mq-sqrt-prefix' }, [
                SVG_SYMBOLS.sqrt.html(),
            ]),
            h.block('span', { class: 'mq-non-leaf mq-sqrt-stem' }, blocks[0]),
        ]));
        this.textTemplate = ['sqrt(', ')'];
        this.mathspeakTemplate = ['StartRoot,', ', EndRoot'];
        this.ariaLabel = 'root';
    }
    parser() {
        return latexMathParser.optBlock
            .then(function (optBlock) {
            return latexMathParser.block.map(function (block) {
                var nthroot = new NthRoot();
                nthroot.blocks = [optBlock, block];
                optBlock.adopt(nthroot, 0, 0);
                block.adopt(nthroot, optBlock, 0);
                return nthroot;
            });
        })
            .or(super.parser());
    }
}
LatexCmds.sqrt = SquareRoot;
LatexCmds.hat = class Hat extends MathCommand {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '\\hat';
        this.domView = new DOMView(1, (blocks) => h('span', { class: 'mq-non-leaf' }, [
            h('span', { class: 'mq-hat-prefix' }, [h.text('^')]),
            h.block('span', { class: 'mq-hat-stem' }, blocks[0]),
        ]));
        this.textTemplate = ['hat(', ')'];
    }
};
class NthRoot extends SquareRoot {
    constructor() {
        super(...arguments);
        this.domView = new DOMView(2, (blocks) => h('span', { class: 'mq-nthroot-container mq-non-leaf' }, [
            h.block('sup', { class: 'mq-nthroot mq-non-leaf' }, blocks[0]),
            h('span', { class: 'mq-scaled mq-sqrt-container' }, [
                h('span', { class: 'mq-sqrt-prefix mq-scaled' }, [
                    SVG_SYMBOLS.sqrt.html(),
                ]),
                h.block('span', { class: 'mq-sqrt-stem mq-non-leaf' }, blocks[1]),
            ]),
        ]));
        this.textTemplate = ['sqrt[', '](', ')'];
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += '\\sqrt[';
        this.getEnd(L).latexRecursive(ctx);
        ctx.latex += ']{';
        this.getEnd(R).latexRecursive(ctx);
        ctx.latex += '}';
        this.checkCursorContextClose(ctx);
    }
    mathspeak() {
        var indexMathspeak = this.getEnd(L).mathspeak();
        var radicandMathspeak = this.getEnd(R).mathspeak();
        this.getEnd(L).ariaLabel = 'Index';
        this.getEnd(R).ariaLabel = 'Radicand';
        if (indexMathspeak === '3') {
            // cube root
            return 'Start Cube Root, ' + radicandMathspeak + ', End Cube Root';
        }
        else {
            return ('Root Index ' +
                indexMathspeak +
                ', Start Root, ' +
                radicandMathspeak +
                ', End Root');
        }
    }
}
LatexCmds.nthroot = NthRoot;
LatexCmds.cbrt = class extends NthRoot {
    createLeftOf(cursor) {
        super.createLeftOf(cursor);
        new Digit('3').createLeftOf(cursor);
        cursor.controller.moveRight();
    }
};
class DiacriticAbove extends MathCommand {
    constructor(ctrlSeq, html, textTemplate) {
        var domView = new DOMView(1, (blocks) => h('span', { class: 'mq-non-leaf' }, [
            h('span', { class: 'mq-diacritic-above' }, [html]),
            h.block('span', { class: 'mq-diacritic-stem' }, blocks[0]),
        ]));
        super(ctrlSeq, domView, textTemplate);
    }
}
LatexCmds.vec = () => new DiacriticAbove('\\vec', h.entityText('&rarr;'), ['vec(', ')']);
LatexCmds.tilde = () => new DiacriticAbove('\\tilde', h.text('~'), ['tilde(', ')']);
class DelimsNode extends MathCommand {
    setDOM(el) {
        super.setDOM(el);
        const children = this.domFrag().children();
        if (!children.isEmpty()) {
            this.delimFrags = {
                [L]: children.first(),
                [R]: children.last(),
            };
        }
        return this;
    }
}
// Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
//   first typed as one-sided bracket with matching "ghost" bracket at
//   far end of current block, until you type an opposing one
class Bracket extends DelimsNode {
    constructor(side, open, close, ctrlSeq, end) {
        super('\\left' + ctrlSeq, undefined, [open, close]);
        this.side = side;
        this.sides = {
            [L]: { ch: open, ctrlSeq: ctrlSeq },
            [R]: { ch: close, ctrlSeq: end },
        };
    }
    numBlocks() {
        return 1;
    }
    html() {
        var leftSymbol = this.getSymbol(L);
        var rightSymbol = this.getSymbol(R);
        // wait until now so that .side may
        this.domView = new DOMView(1, (blocks) => h(
        // be set by createLeftOf or parser
        'span', { class: 'mq-non-leaf mq-bracket-container' }, [
            h('span', {
                style: 'width:' + leftSymbol.width,
                class: 'mq-scaled mq-bracket-l mq-paren' +
                    (this.side === R ? ' mq-ghost' : ''),
            }, [leftSymbol.html()]),
            h.block('span', {
                style: 'margin-left:' +
                    leftSymbol.width +
                    ';margin-right:' +
                    rightSymbol.width,
                class: 'mq-bracket-middle mq-non-leaf',
            }, blocks[0]),
            h('span', {
                style: 'width:' + rightSymbol.width,
                class: 'mq-scaled mq-bracket-r mq-paren' +
                    (this.side === L ? ' mq-ghost' : ''),
            }, [rightSymbol.html()]),
        ]));
        return super.html();
    }
    getSymbol(side) {
        var ch = this.sides[side || R].ch;
        return SVG_SYMBOLS[ch] || { width: '0', html: '' };
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += '\\left' + this.sides[L].ctrlSeq;
        this.getEnd(L).latexRecursive(ctx);
        ctx.latex += '\\right' + this.sides[R].ctrlSeq;
        this.checkCursorContextClose(ctx);
    }
    mathspeak(opts) {
        var open = this.sides[L].ch, close = this.sides[R].ch;
        if (open === '|' && close === '|') {
            this.mathspeakTemplate = ['StartAbsoluteValue,', ', EndAbsoluteValue'];
            this.ariaLabel = 'absolute value';
        }
        else if (opts && opts.createdLeftOf && this.side) {
            var ch = '';
            if (this.side === L)
                ch = this.textTemplate[0];
            else if (this.side === R)
                ch = this.textTemplate[1];
            return ((this.side === L ? 'left ' : 'right ') +
                BRACKET_NAMES[ch]);
        }
        else {
            this.mathspeakTemplate = [
                'left ' + BRACKET_NAMES[open] + ',',
                ', right ' + BRACKET_NAMES[close],
            ];
            this.ariaLabel =
                BRACKET_NAMES[open] + ' block';
        }
        return super.mathspeak();
    }
    matchBrack(opts, expectedSide, node) {
        // return node iff it's a matching 1-sided bracket of expected side (if any)
        return (node instanceof Bracket &&
            node.side &&
            node.side !== -expectedSide &&
            (!opts.restrictMismatchedBrackets ||
                OPP_BRACKS[this.sides[this.side].ch] === node.sides[node.side].ch ||
                { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) &&
            node);
    }
    closeOpposing(brack) {
        brack.side = 0;
        brack.sides[this.side] = this.sides[this.side]; // copy over my info (may be
        const brackFrag = brack.delimFrags[this.side === L ? L : R] // mismatched, like [a, b))
            .removeClass('mq-ghost');
        this.replaceBracket(brackFrag, this.side);
    }
    createLeftOf(cursor) {
        var brack;
        if (!this.replacedFragment) {
            // unless wrapping seln in brackets,
            // check if next to or inside an opposing one-sided bracket
            var opts = cursor.options;
            if (this.sides[L].ch === '|') {
                // check both sides if I'm a pipe
                brack =
                    this.matchBrack(opts, R, cursor[R]) ||
                        this.matchBrack(opts, L, cursor[L]) ||
                        this.matchBrack(opts, 0, cursor.parent.parent);
            }
            else {
                brack =
                    this.matchBrack(opts, -this.side, cursor[-this.side]) ||
                        this.matchBrack(opts, -this.side, cursor.parent.parent);
            }
        }
        if (brack) {
            var side = (this.side = -brack.side); // may be pipe with .side not yet set
            this.closeOpposing(brack);
            if (brack === cursor.parent.parent && cursor[side]) {
                // move the stuff between
                new Fragment(cursor[side], cursor.parent.getEnd(side), -side) // me and ghost outside
                    .disown()
                    .withDirAdopt(-side, brack.parent, brack, brack[side])
                    .domFrag()
                    .insDirOf(side, brack.domFrag());
            }
            brack.bubble(function (node) {
                node.reflow();
                return undefined;
            });
        }
        else {
            (brack = this), (side = brack.side);
            if (brack.replacedFragment)
                brack.side = 0;
            // wrapping seln, don't be one-sided
            else if (cursor[-side]) {
                // elsewise, auto-expand so ghost is at far end
                brack.replaces(new Fragment(cursor[-side], cursor.parent.getEnd(-side), side));
                cursor[-side] = 0;
            }
            super.createLeftOf(cursor);
        }
        if (side === L)
            cursor.insAtLeftEnd(brack.getEnd(L));
        else
            cursor.insRightOf(brack);
    }
    placeCursor() { }
    unwrap() {
        this.getEnd(L)
            .children()
            .disown()
            .adopt(this.parent, this, this[R])
            .domFrag()
            .insertAfter(this.domFrag());
        this.remove();
    }
    deleteSide(side, outward, cursor) {
        var parent = this.parent, sib = this[side], farEnd = parent.getEnd(side);
        if (side === this.side) {
            // deleting non-ghost of one-sided bracket, unwrap
            this.unwrap();
            sib
                ? cursor.insDirOf(-side, sib)
                : cursor.insAtDirEnd(side, parent);
            return;
        }
        var opts = cursor.options, wasSolid = !this.side;
        this.side = -side;
        // if deleting like, outer close-brace of [(1+2)+3} where inner open-paren
        if (this.matchBrack(opts, side, this.getEnd(L).getEnd(this.side))) {
            // is ghost,
            this.closeOpposing(this.getEnd(L).getEnd(this.side)); // then become [1+2)+3
            var origEnd = this.getEnd(L).getEnd(side);
            this.unwrap();
            if (origEnd)
                origEnd.siblingCreated(cursor.options, side);
            if (sib) {
                cursor.insDirOf(-side, sib);
            }
            else {
                cursor.insAtDirEnd(side, parent);
            }
        }
        else {
            // if deleting like, inner close-brace of ([1+2}+3) where outer
            if (this.matchBrack(opts, side, this.parent.parent)) {
                // open-paren is
                this.parent.parent.closeOpposing(this); // ghost, then become [1+2+3)
                this.parent.parent.unwrap();
            } // else if deleting outward from a solid pair, unwrap
            else if (outward && wasSolid) {
                this.unwrap();
                sib
                    ? cursor.insDirOf(-side, sib)
                    : cursor.insAtDirEnd(side, parent);
                return;
            }
            else {
                // else deleting just one of a pair of brackets, become one-sided
                this.sides[side] = getOppBracketSide(this);
                this.delimFrags[L].removeClass('mq-ghost');
                this.delimFrags[R].removeClass('mq-ghost');
                const brackFrag = this.delimFrags[side].addClass('mq-ghost');
                this.replaceBracket(brackFrag, side);
            }
            if (sib) {
                // auto-expand so ghost is at far end
                const leftEnd = this.getEnd(L);
                var origEnd = leftEnd.getEnd(side);
                leftEnd.domFrag().removeClass('mq-empty');
                new Fragment(sib, farEnd, -side)
                    .disown()
                    .withDirAdopt(-side, leftEnd, origEnd, 0)
                    .domFrag()
                    .insAtDirEnd(side, leftEnd.domFrag().oneElement());
                if (origEnd)
                    origEnd.siblingCreated(cursor.options, side);
                cursor.insDirOf(-side, sib);
            } // didn't auto-expand, cursor goes just outside or just inside parens
            else
                outward
                    ? cursor.insDirOf(side, this)
                    : cursor.insAtDirEnd(side, this.getEnd(L));
        }
    }
    replaceBracket(brackFrag, side) {
        var symbol = this.getSymbol(side);
        brackFrag.children().replaceWith(domFrag(symbol.html()));
        brackFrag.oneElement().style.width = symbol.width;
        if (side === L) {
            const next = brackFrag.next();
            if (!next.isEmpty()) {
                next.oneElement().style.marginLeft = symbol.width;
            }
        }
        else {
            const prev = brackFrag.prev();
            if (!prev.isEmpty()) {
                prev.oneElement().style.marginRight = symbol.width;
            }
        }
    }
    deleteTowards(dir, cursor) {
        this.deleteSide(-dir, false, cursor);
    }
    finalizeTree() {
        this.getEnd(L).deleteOutOf = function (dir, cursor) {
            this.parent.deleteSide(dir, true, cursor);
        };
        // FIXME HACK: after initial creation/insertion, finalizeTree would only be
        // called if the paren is selected and replaced, e.g. by LiveFraction
        this.finalizeTree = this.intentionalBlur = function () {
            this.delimFrags[this.side === L ? R : L].removeClass('mq-ghost');
            this.side = 0;
        };
    }
    siblingCreated(_opts, dir) {
        // if something typed between ghost and far
        if (dir === -this.side)
            this.finalizeTree(); // end of its block, solidify
    }
}
function getOppBracketSide(bracket) {
    var side = bracket.side;
    var data = bracket.sides[side];
    return {
        ch: OPP_BRACKS[data.ch],
        ctrlSeq: OPP_BRACKS[data.ctrlSeq],
    };
}
var OPP_BRACKS = {
    '(': ')',
    ')': '(',
    '[': ']',
    ']': '[',
    '{': '}',
    '}': '{',
    '\\{': '\\}',
    '\\}': '\\{',
    '&lang;': '&rang;',
    '&rang;': '&lang;',
    '\\langle ': '\\rangle ',
    '\\rangle ': '\\langle ',
    '|': '|',
    '\\lVert ': '\\rVert ',
    '\\rVert ': '\\lVert ',
};
var BRACKET_NAMES = {
    '&lang;': 'angle-bracket',
    '&rang;': 'angle-bracket',
    '|': 'pipe',
};
function bindCharBracketPair(open, ctrlSeq, name) {
    var ctrlSeq = ctrlSeq || open;
    var close = OPP_BRACKS[open];
    var end = OPP_BRACKS[ctrlSeq];
    CharCmds[open] = () => new Bracket(L, open, close, ctrlSeq, end);
    CharCmds[close] = () => new Bracket(R, open, close, ctrlSeq, end);
    BRACKET_NAMES[open] = BRACKET_NAMES[close] = name;
}
bindCharBracketPair('(', '', 'parenthesis');
bindCharBracketPair('[', '', 'bracket');
bindCharBracketPair('{', '\\{', 'brace');
LatexCmds.langle = () => new Bracket(L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
LatexCmds.rangle = () => new Bracket(R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
CharCmds['|'] = () => new Bracket(L, '|', '|', '|', '|');
LatexCmds.lVert = () => new Bracket(L, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.rVert = () => new Bracket(R, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
LatexCmds.left = class extends MathCommand {
    parser() {
        var regex = Parser.regex;
        var string = Parser.string;
        var optWhitespace = Parser.optWhitespace;
        return optWhitespace
            .then(regex(/^(?:[([|]|\\\{|\\langle(?![a-zA-Z])|\\lVert(?![a-zA-Z]))/))
            .then(function (ctrlSeq) {
            var open = ctrlSeq.replace(/^\\/, '');
            if (ctrlSeq == '\\langle') {
                open = '&lang;';
                ctrlSeq = ctrlSeq + ' ';
            }
            if (ctrlSeq == '\\lVert') {
                open = '&#8741;';
                ctrlSeq = ctrlSeq + ' ';
            }
            return latexMathParser.then(function (block) {
                return string('\\right')
                    .skip(optWhitespace)
                    .then(regex(/^(?:[\])|]|\\\}|\\rangle(?![a-zA-Z])|\\rVert(?![a-zA-Z]))/))
                    .map(function (end) {
                    var close = end.replace(/^\\/, '');
                    if (end == '\\rangle') {
                        close = '&rang;';
                        end = end + ' ';
                    }
                    if (end == '\\rVert') {
                        close = '&#8741;';
                        end = end + ' ';
                    }
                    var cmd = new Bracket(0, open, close, ctrlSeq, end);
                    cmd.blocks = [block];
                    block.adopt(cmd, 0, 0);
                    return cmd;
                });
            });
        });
    }
};
LatexCmds.right = class extends MathCommand {
    parser() {
        return Parser.fail('unmatched \\right');
    }
};
var leftBinomialSymbol = SVG_SYMBOLS['('];
var rightBinomialSymbol = SVG_SYMBOLS[')'];
class Binomial extends DelimsNode {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '\\binom';
        this.domView = new DOMView(2, (blocks) => h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
            h('span', {
                style: 'width:' + leftBinomialSymbol.width,
                class: 'mq-paren mq-bracket-l mq-scaled',
            }, [leftBinomialSymbol.html()]),
            h('span', {
                style: 'margin-left:' +
                    leftBinomialSymbol.width +
                    '; margin-right:' +
                    rightBinomialSymbol.width,
                class: 'mq-non-leaf mq-bracket-middle',
            }, [
                h('span', { class: 'mq-array mq-non-leaf' }, [
                    h.block('span', {}, blocks[0]),
                    h.block('span', {}, blocks[1]),
                ]),
            ]),
            h('span', {
                style: 'width:' + rightBinomialSymbol.width,
                class: 'mq-paren mq-bracket-r mq-scaled',
            }, [rightBinomialSymbol.html()]),
        ]));
        this.textTemplate = ['choose(', ',', ')'];
        this.mathspeakTemplate = ['StartBinomial,', 'Choose', ', EndBinomial'];
        this.ariaLabel = 'binomial';
    }
}
LatexCmds.binom = LatexCmds.binomial = Binomial;
LatexCmds.choose = class extends Binomial {
    createLeftOf(cursor) {
        LiveFraction.prototype.createLeftOf(cursor);
    }
};
class MathFieldNode extends MathCommand {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '\\MathQuillMathField';
        this.domView = new DOMView(1, (blocks) => {
            return h('span', { class: 'mq-editable-field' }, [
                h.block('span', { class: 'mq-root-block', 'aria-hidden': 'true' }, blocks[0]),
            ]);
        });
    }
    parser() {
        var self = this, string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
        return string('[')
            .then(regex(/^[a-z][a-z0-9]*/i))
            .skip(string(']'))
            .map(function (name) {
            self.name = name;
        })
            .or(succeed(undefined))
            .then(super.parser());
    }
    finalizeTree(options) {
        var ctrlr = new Controller(this.getEnd(L), this.domFrag().oneElement(), options);
        ctrlr.KIND_OF_MQ = 'MathField';
        ctrlr.editable = true;
        ctrlr.createTextarea();
        ctrlr.editablesTextareaEvents();
        ctrlr.cursor.insAtRightEnd(ctrlr.root);
        RootBlockMixin(ctrlr.root);
        // MathQuill applies aria-hidden to .mq-root-block containers
        // because these contain math notation that screen readers can't
        // interpret directly. MathQuill use an aria-live region as a
        // sibling of these block containers to provide an alternative
        // representation for screen readers
        //
        // MathFieldNodes have their own focusable text aria and aria live
        // region, so it is incorrect for any parent of the editable field
        // to have an aria-hidden property
        //
        // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden
        //
        // Handle this by recursively walking the parents of this element
        // until we hit a root block, and if we hit any parent with
        // aria-hidden="true", removing the property from the parent and
        // pushing it down to each of the parents children. This should
        // result in no parent of this node having aria-hidden="true", but
        // should keep as much of what was previously hidden hidden as
        // possible while obeying this constraint
        function pushDownAriaHidden(node) {
            if (node.parentNode && !domFrag(node).hasClass('mq-root-block')) {
                pushDownAriaHidden(node.parentNode);
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                if (element.getAttribute('aria-hidden') === 'true') {
                    element.removeAttribute('aria-hidden');
                    domFrag(node)
                        .children()
                        .eachElement((child) => {
                        child.setAttribute('aria-hidden', 'true');
                    });
                }
            }
        }
        pushDownAriaHidden(this.domFrag().parent().oneElement());
        this.domFrag().oneElement().removeAttribute('aria-hidden');
    }
    registerInnerField(innerFields, MathField) {
        const controller = this.getEnd(L).controller;
        const newField = new MathField(controller);
        innerFields[this.name] = newField;
        innerFields.push(newField);
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        this.getEnd(L).latexRecursive(ctx);
        this.checkCursorContextClose(ctx);
    }
    text() {
        return this.getEnd(L).text();
    }
}
LatexCmds.editable = LatexCmds.MathQuillMathField = MathFieldNode; // backcompat with before cfd3620 on #233
// Embed arbitrary things
// Probably the closest DOM analogue would be an iframe?
// From MathQuill's perspective, it's a MQSymbol, it can be
// anywhere and the cursor can go around it but never in it.
// Create by calling public API method .dropEmbedded(),
// or by calling the global public API method .registerEmbed()
// and rendering LaTeX like \embed{registeredName} (see test).
class EmbedNode extends MQSymbol {
    setOptions(options) {
        function noop() {
            return '';
        }
        this.text = options.text || noop;
        this.domView = new DOMView(0, () => h('span', {}, [parseHTML(options.htmlString || '')]));
        this.latex = options.latex || noop;
        return this;
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += this.latex();
        this.checkCursorContextClose(ctx);
    }
    parser() {
        var self = this, string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
        return string('{')
            .then(regex(/^[a-z][a-z0-9]*/i))
            .skip(string('}'))
            .then(function (name) {
            // the chars allowed in the optional data block are arbitrary other than
            // excluding curly braces and square brackets (which'd be too confusing)
            return string('[')
                .then(regex(/^[-\w\s]*/))
                .skip(string(']'))
                .or(succeed(undefined))
                .map(function (data) {
                return self.setOptions(EMBEDS[name](data));
            });
        });
    }
}
LatexCmds.embed = EmbedNode;
/*************************************************
 * Abstract classes of text blocks
 ************************************************/
/**
 * Blocks of plain text, with one or two TextPiece's as children.
 * Represents flat strings of typically serif-font Roman characters, as
 * opposed to hierchical, nested, tree-structured math.
 * Wraps a single HTMLSpanElement.
 */
class TextBlock extends MQNode {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '\\text';
        this.ariaLabel = 'Text';
        this.mathspeakTemplate = ['StartText', 'EndText'];
    }
    replaces(replacedText) {
        if (replacedText instanceof Fragment) {
            this.replacedText = replacedText.remove().domFrag().text();
        }
        else if (typeof replacedText === 'string')
            this.replacedText = replacedText;
    }
    setDOMFrag(el) {
        super.setDOM(el);
        const endsL = this.getEnd(L);
        if (endsL) {
            const children = this.domFrag().children();
            if (!children.isEmpty()) {
                endsL.setDOM(children.oneText());
            }
        }
        return this;
    }
    createLeftOf(cursor) {
        var textBlock = this;
        super.createLeftOf(cursor);
        cursor.insAtRightEnd(textBlock);
        if (textBlock.replacedText)
            for (var i = 0; i < textBlock.replacedText.length; i += 1)
                textBlock.write(cursor, textBlock.replacedText.charAt(i));
        const textBlockR = textBlock[R];
        if (textBlockR)
            textBlockR.siblingCreated(cursor.options, L);
        const textBlockL = textBlock[L];
        if (textBlockL)
            textBlockL.siblingCreated(cursor.options, R);
        textBlock.bubble(function (node) {
            node.reflow();
            return undefined;
        });
    }
    parser() {
        var textBlock = this;
        // TODO: correctly parse text mode
        var string = Parser.string;
        var regex = Parser.regex;
        var optWhitespace = Parser.optWhitespace;
        return optWhitespace
            .then(string('{'))
            .then(regex(/^[^}]*/))
            .skip(string('}'))
            .map(function (text) {
            if (text.length === 0)
                return new Fragment(0, 0);
            new TextPiece(text).adopt(textBlock, 0, 0);
            return textBlock;
        });
    }
    textContents() {
        return this.foldChildren('', function (text, child) {
            return text + child.textStr;
        });
    }
    text() {
        return '"' + this.textContents() + '"';
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        var contents = this.textContents();
        if (contents.length > 0) {
            ctx.latex += this.ctrlSeq + '{';
            ctx.latex += contents
                .replace(/\\/g, '\\backslash ')
                .replace(/[{}]/g, '\\$&');
            ctx.latex += '}';
        }
        this.checkCursorContextClose(ctx);
    }
    html() {
        const out = h('span', { class: 'mq-text-mode' }, [
            h.text(this.textContents()),
        ]);
        this.setDOM(out);
        NodeBase.linkElementByCmdNode(out, this);
        return out;
    }
    mathspeak(opts) {
        if (opts && opts.ignoreShorthand) {
            return (this.mathspeakTemplate[0] +
                ', ' +
                this.textContents() +
                ', ' +
                this.mathspeakTemplate[1]);
        }
        else {
            return this.textContents();
        }
    }
    isTextBlock() {
        return true;
    }
    // editability methods: called by the cursor for editing, cursor movements,
    // and selection of the MathQuill tree, these all take in a direction and
    // the cursor
    moveTowards(dir, cursor) {
        cursor.insAtDirEnd(-dir, this);
        cursor.controller.aria
            .queueDirEndOf(-dir)
            .queue(cursor.parent, true);
    }
    moveOutOf(dir, cursor) {
        cursor.insDirOf(dir, this);
        cursor.controller.aria.queueDirOf(dir).queue(this);
    }
    unselectInto(dir, cursor) {
        this.moveTowards(dir, cursor);
    }
    // TODO: make these methods part of a shared mixin or something.
    selectTowards(dir, cursor) {
        MathCommand.prototype.selectTowards.call(this, dir, cursor);
    }
    deleteTowards(dir, cursor) {
        MathCommand.prototype.deleteTowards.call(this, dir, cursor);
    }
    selectOutOf(dir, cursor) {
        cursor.insDirOf(dir, this);
    }
    deleteOutOf(_dir, cursor) {
        // backspace and delete at ends of block don't unwrap
        if (this.isEmpty())
            cursor.insRightOf(this);
    }
    write(cursor, ch) {
        cursor.show().deleteSelection();
        if (ch !== '$') {
            let cursorL = cursor[L];
            if (!cursorL)
                new TextPiece(ch).createLeftOf(cursor);
            else if (cursorL instanceof TextPiece)
                cursorL.appendText(ch);
        }
        else if (this.isEmpty()) {
            cursor.insRightOf(this);
            new VanillaSymbol('\\$', h.text('$')).createLeftOf(cursor);
        }
        else if (!cursor[R])
            cursor.insRightOf(this);
        else if (!cursor[L])
            cursor.insLeftOf(this);
        else {
            // split apart
            var leftBlock = new TextBlock();
            var leftPc = this.getEnd(L);
            if (leftPc) {
                leftPc.disown().domFrag().detach();
                leftPc.adopt(leftBlock, 0, 0);
            }
            cursor.insLeftOf(this);
            super.createLeftOf.call(leftBlock, cursor); // micro-optimization, not for correctness
        }
        this.bubble(function (node) {
            node.reflow();
            return undefined;
        });
        // TODO needs tests
        cursor.controller.aria.alert(ch);
    }
    writeLatex(cursor, latex) {
        const cursorL = cursor[L];
        if (!cursorL)
            new TextPiece(latex).createLeftOf(cursor);
        else if (cursorL instanceof TextPiece)
            cursorL.appendText(latex);
        this.bubble(function (node) {
            node.reflow();
            return undefined;
        });
    }
    seek(clientX, cursor) {
        cursor.hide();
        var textPc = TextBlockFuseChildren(this);
        if (!textPc)
            return;
        // insert cursor at approx position in DOMTextNode
        const textNode = this.domFrag().children().oneText();
        const range = document.createRange();
        range.selectNodeContents(textNode);
        var rects = range.getClientRects();
        if (rects.length === 1) {
            const { width, left } = rects[0];
            var avgChWidth = width / this.textContents().length;
            var approxPosition = Math.round((clientX - left) / avgChWidth);
            if (approxPosition <= 0) {
                cursor.insAtLeftEnd(this);
            }
            else if (approxPosition >= textPc.textStr.length) {
                cursor.insAtRightEnd(this);
            }
            else {
                cursor.insLeftOf(textPc.splitRight(approxPosition));
            }
        }
        else {
            cursor.insAtLeftEnd(this);
        }
        // move towards mousedown (clientX)
        var displ = clientX - cursor.show().getBoundingClientRectWithoutMargin().left; // displacement
        var dir = displ && displ < 0 ? L : R;
        var prevDispl = dir;
        // displ * prevDispl > 0 iff displacement direction === previous direction
        while (cursor[dir] && displ * prevDispl > 0) {
            cursor[dir].moveTowards(dir, cursor);
            prevDispl = displ;
            displ = clientX - cursor.getBoundingClientRectWithoutMargin().left;
        }
        if (dir * displ < -dir * prevDispl)
            cursor[-dir].moveTowards(-dir, cursor);
        if (!cursor.anticursor) {
            // about to start mouse-selecting, the anticursor is gonna get put here
            const cursorL = cursor[L];
            this.anticursorPosition =
                cursorL && cursorL.textStr.length;
            // ^ get it? 'cos if there's no cursor[L], it's 0... I'm a terrible person.
        }
        else if (cursor.anticursor.parent === this) {
            // mouse-selecting within this TextBlock, re-insert the anticursor
            const cursorL = cursor[L];
            var cursorPosition = cursorL && cursorL.textStr.length;
            if (this.anticursorPosition === cursorPosition) {
                cursor.anticursor = Anticursor.fromCursor(cursor);
            }
            else {
                if (this.anticursorPosition < cursorPosition) {
                    var newTextPc = cursorL.splitRight(this.anticursorPosition);
                    cursor[L] = newTextPc;
                }
                else {
                    const cursorR = cursor[R];
                    var newTextPc = cursorR.splitRight(this.anticursorPosition - cursorPosition);
                }
                cursor.anticursor = new Anticursor(this, newTextPc[L], newTextPc);
            }
        }
    }
    blur(cursor) {
        MathBlock.prototype.blur.call(this, cursor);
        if (!cursor)
            return;
        if (this.textContents() === '') {
            this.remove();
            if (cursor[L] === this)
                cursor[L] = this[L];
            else if (cursor[R] === this)
                cursor[R] = this[R];
        }
        else
            TextBlockFuseChildren(this);
    }
    focus() {
        MathBlock.prototype.focus.call(this);
    }
}
function TextBlockFuseChildren(self) {
    self.domFrag().oneElement().normalize();
    const children = self.domFrag().children();
    if (children.isEmpty())
        return;
    const textPcDom = children.oneText();
    pray('only node in TextBlock span is Text node', textPcDom.nodeType === 3);
    // nodeType === 3 has meant a Text node since ancient times:
    //   http://reference.sitepoint.com/javascript/Node/nodeType
    var textPc = new TextPiece(textPcDom.data);
    textPc.setDOM(textPcDom);
    self.children().disown();
    textPc.adopt(self, 0, 0);
    return textPc;
}
/**
 * Piece of plain text, with a TextBlock as a parent and no children.
 * Wraps a single DOMTextNode.
 * For convenience, has a .textStr property that's just a JavaScript string
 * mirroring the text contents of the DOMTextNode.
 * Text contents must always be nonempty.
 */
class TextPiece extends MQNode {
    constructor(text) {
        super();
        this.textStr = text;
    }
    html() {
        const out = h.text(this.textStr);
        this.setDOM(out);
        return out;
    }
    appendText(text) {
        this.textStr += text;
        this.domFrag().oneText().appendData(text);
    }
    prependText(text) {
        this.textStr = text + this.textStr;
        this.domFrag().oneText().insertData(0, text);
    }
    insTextAtDirEnd(text, dir) {
        prayDirection(dir);
        if (dir === R)
            this.appendText(text);
        else
            this.prependText(text);
    }
    splitRight(i) {
        var newPc = new TextPiece(this.textStr.slice(i)).adopt(this.parent, this, this[R]);
        newPc.setDOM(this.domFrag().oneText().splitText(i));
        this.textStr = this.textStr.slice(0, i);
        return newPc;
    }
    endChar(dir, text) {
        return text.charAt(dir === L ? 0 : -1 + text.length);
    }
    moveTowards(dir, cursor) {
        prayDirection(dir);
        var ch = this.endChar(-dir, this.textStr);
        var from = this[-dir];
        if (from instanceof TextPiece)
            from.insTextAtDirEnd(ch, dir);
        else
            new TextPiece(ch).createDir(-dir, cursor);
        return this.deleteTowards(dir, cursor);
    }
    mathspeak() {
        return this.textStr;
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += this.textStr;
        this.checkCursorContextClose(ctx);
    }
    deleteTowards(dir, cursor) {
        if (this.textStr.length > 1) {
            var deletedChar;
            if (dir === R) {
                this.domFrag().oneText().deleteData(0, 1);
                deletedChar = this.textStr[0];
                this.textStr = this.textStr.slice(1);
            }
            else {
                // note that the order of these 2 lines is annoyingly important
                // (the second line mutates this.textStr.length)
                this.domFrag()
                    .oneText()
                    .deleteData(-1 + this.textStr.length, 1);
                deletedChar = this.textStr[this.textStr.length - 1];
                this.textStr = this.textStr.slice(0, -1);
            }
            cursor.controller.aria.queue(deletedChar);
        }
        else {
            this.remove();
            cursor[dir] = this[dir];
            cursor.controller.aria.queue(this.textStr);
        }
    }
    selectTowards(dir, cursor) {
        prayDirection(dir);
        var anticursor = cursor.anticursor;
        if (!anticursor)
            return;
        var ch = this.endChar(-dir, this.textStr);
        if (anticursor[dir] === this) {
            var newPc = new TextPiece(ch).createDir(dir, cursor);
            anticursor[dir] = newPc;
            cursor.insDirOf(dir, newPc);
        }
        else {
            var from = this[-dir];
            if (from instanceof TextPiece)
                from.insTextAtDirEnd(ch, dir);
            else {
                var newPc = new TextPiece(ch).createDir(-dir, cursor);
                var selection = cursor.selection;
                if (selection) {
                    newPc.domFrag().insDirOf(-dir, selection.domFrag());
                }
            }
            if (this.textStr.length === 1 && anticursor[-dir] === this) {
                anticursor[-dir] = this[-dir]; // `this` will be removed in deleteTowards
            }
        }
        return this.deleteTowards(dir, cursor);
    }
}
LatexCmds.text =
    LatexCmds.textnormal =
        LatexCmds.textrm =
            LatexCmds.textup =
                LatexCmds.textmd =
                    TextBlock;
function makeTextBlock(latex, ariaLabel, tagName, attrs) {
    return class extends TextBlock {
        constructor() {
            super(...arguments);
            this.ctrlSeq = latex;
            this.mathspeakTemplate = ['Start' + ariaLabel, 'End' + ariaLabel];
            this.ariaLabel = ariaLabel;
        }
        html() {
            const out = h(tagName, attrs, [h.text(this.textContents())]);
            this.setDOM(out);
            NodeBase.linkElementByCmdNode(out, this);
            return out;
        }
    };
}
LatexCmds.em =
    LatexCmds.italic =
        LatexCmds.italics =
            LatexCmds.emph =
                LatexCmds.textit =
                    LatexCmds.textsl =
                        makeTextBlock('\\textit', 'Italic', 'i', { class: 'mq-text-mode' });
LatexCmds.strong =
    LatexCmds.bold =
        LatexCmds.textbf =
            makeTextBlock('\\textbf', 'Bold', 'b', { class: 'mq-text-mode' });
LatexCmds.sf = LatexCmds.textsf = makeTextBlock('\\textsf', 'Sans serif font', 'span', { class: 'mq-sans-serif mq-text-mode' });
LatexCmds.tt = LatexCmds.texttt = makeTextBlock('\\texttt', 'Mono space font', 'span', { class: 'mq-monospace mq-text-mode' });
LatexCmds.textsc = makeTextBlock('\\textsc', 'Variable font', 'span', {
    style: 'font-variant:small-caps',
    class: 'mq-text-mode',
});
LatexCmds.uppercase = makeTextBlock('\\uppercase', 'Uppercase', 'span', {
    style: 'text-transform:uppercase',
    class: 'mq-text-mode',
});
LatexCmds.lowercase = makeTextBlock('\\lowercase', 'Lowercase', 'span', {
    style: 'text-transform:lowercase',
    class: 'mq-text-mode',
});
class RootMathCommand extends MathCommand {
    constructor(cursor) {
        super('$');
        this.domView = new DOMView(1, (blocks) => h.block('span', { class: 'mq-math-mode' }, blocks[0]));
        this.cursor = cursor;
    }
    createBlocks() {
        super.createBlocks();
        const endsL = this.getEnd(L); // TODO - how do we know this is a RootMathCommand?
        endsL.cursor = this.cursor;
        endsL.write = function (cursor, ch) {
            if (ch !== '$')
                MathBlock.prototype.write.call(this, cursor, ch);
            else if (this.isEmpty()) {
                cursor.insRightOf(this.parent);
                this.parent.deleteTowards(undefined, cursor);
                new VanillaSymbol('\\$', h.text('$')).createLeftOf(cursor.show());
            }
            else if (!cursor[R])
                cursor.insRightOf(this.parent);
            else if (!cursor[L])
                cursor.insLeftOf(this.parent);
            else
                MathBlock.prototype.write.call(this, cursor, ch);
        };
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += '$';
        this.getEnd(L).latexRecursive(ctx);
        ctx.latex += '$';
        this.checkCursorContextClose(ctx);
    }
}
class RootTextBlock extends RootMathBlock {
    keystroke(key, e, ctrlr) {
        if (key === 'Spacebar' || key === 'Shift-Spacebar')
            return;
        return super.keystroke(key, e, ctrlr);
    }
    write(cursor, ch) {
        cursor.show().deleteSelection();
        if (ch === '$')
            new RootMathCommand(cursor).createLeftOf(cursor);
        else {
            var html;
            if (ch === '<')
                html = h.entityText('&lt;');
            else if (ch === '>')
                html = h.entityText('&gt;');
            new VanillaSymbol(ch, html).createLeftOf(cursor);
        }
    }
}
API.TextField = function (APIClasses) {
    var _c;
    return _c = class TextField extends APIClasses.EditableField {
            __mathquillify() {
                super.mathquillify('mq-editable-field mq-text-mode');
                return this;
            }
            latex(latex) {
                if (latex) {
                    this.__controller.renderLatexText(latex);
                    if (this.__controller.blurred)
                        this.__controller.cursor.hide().parent.blur();
                    const _this = this; // just to help help TS out
                    return _this;
                }
                return this.__controller.exportLatex();
            }
        },
        _c.RootBlock = RootTextBlock,
        _c;
};
/****************************************
 * Input box to type backslash commands
 ***************************************/
CharCmds['\\'] = class LatexCommandInput extends MathCommand {
    constructor() {
        super(...arguments);
        this.ctrlSeq = '\\';
        this.domView = new DOMView(1, (blocks) => h('span', { class: 'mq-latex-command-input-wrapper mq-non-leaf' }, [
            h('span', { class: 'mq-latex-command-input mq-non-leaf' }, [
                h.text('\\'),
                h.block('span', {}, blocks[0]),
            ]),
        ]));
        this.textTemplate = ['\\'];
    }
    replaces(replacedFragment) {
        this._replacedFragment = replacedFragment.disown();
        this.isEmpty = function () {
            return false;
        };
    }
    createBlocks() {
        super.createBlocks();
        const endsL = this.getEnd(L);
        endsL.focus = function () {
            this.parent.domFrag().addClass('mq-hasCursor');
            if (this.isEmpty())
                this.parent.domFrag().removeClass('mq-empty');
            return this;
        };
        endsL.blur = function () {
            this.parent.domFrag().removeClass('mq-hasCursor');
            if (this.isEmpty())
                this.parent.domFrag().addClass('mq-empty');
            return this;
        };
        endsL.write = function (cursor, ch) {
            cursor.show().deleteSelection();
            if (ch.match(/[a-z]/i)) {
                new VanillaSymbol(ch).createLeftOf(cursor);
                // TODO needs tests
                cursor.controller.aria.alert(ch);
            }
            else {
                var cmd = this.parent.renderCommand(cursor);
                // TODO needs tests
                cursor.controller.aria.queue(cmd.mathspeak({ createdLeftOf: cursor }));
                if (ch !== '\\' || !this.isEmpty())
                    cursor.parent.write(cursor, ch);
                else
                    cursor.controller.aria.alert();
            }
        };
        var originalKeystroke = endsL.keystroke;
        endsL.keystroke = function (key, e, ctrlr) {
            if (key === 'Tab' || key === 'Enter' || key === 'Spacebar') {
                var cmd = this.parent.renderCommand(ctrlr.cursor);
                // TODO needs tests
                ctrlr.aria.alert(cmd.mathspeak({ createdLeftOf: ctrlr.cursor }));
                e === null || e === void 0 ? void 0 : e.preventDefault();
                return;
            }
            return originalKeystroke.call(this, key, e, ctrlr);
        };
    }
    createLeftOf(cursor) {
        super.createLeftOf(cursor);
        if (this._replacedFragment) {
            const frag = this.domFrag();
            const el = frag.oneElement();
            this._replacedFragment.domFrag().addClass('mq-blur');
            //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
            const rewriteMousedownEventTarget = (e) => {
                {
                    // TODO - overwritting e.target
                    e.target = el;
                    el.dispatchEvent(e);
                    return false;
                }
            };
            el.addEventListener('mousedown', rewriteMousedownEventTarget);
            el.addEventListener('mouseup', rewriteMousedownEventTarget);
            this._replacedFragment.domFrag().insertBefore(frag.children().first());
        }
    }
    latexRecursive(ctx) {
        this.checkCursorContextOpen(ctx);
        ctx.latex += '\\';
        this.getEnd(L).latexRecursive(ctx);
        ctx.latex += ' ';
        this.checkCursorContextClose(ctx);
    }
    renderCommand(cursor) {
        this.setDOM(this.domFrag().children().lastElement());
        this.remove();
        if (this[R]) {
            cursor.insLeftOf(this[R]);
        }
        else {
            cursor.insAtRightEnd(this.parent);
        }
        var latex = this.getEnd(L).latex();
        if (!latex)
            latex = ' ';
        var cmd = LatexCmds[latex];
        if (cmd) {
            let node;
            if (isMQNodeClass(cmd)) {
                node = new cmd(latex);
            }
            else {
                node = cmd(latex);
            }
            if (this._replacedFragment)
                node.replaces(this._replacedFragment);
            node.createLeftOf(cursor);
            return node;
        }
        else {
            const node = new TextBlock();
            node.replaces(latex);
            node.createLeftOf(cursor);
            cursor.insRightOf(node);
            if (this._replacedFragment) {
                this._replacedFragment.remove();
            }
            return node;
        }
    }
};

