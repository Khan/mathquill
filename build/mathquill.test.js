/**
 * MathQuill v0.10.1, by Han, Jeanine, and Mary
 * http://mathquill.com | maintainers@mathquill.com
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function () {
    var L = -1;
    var R = 1;
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
            var error = new Error('prayer failed: ' + message);
            // optionally add more context to this prayer failure. We will
            // trace up as far as possible to get all latex we can find as well
            // as output the latex down at the direct parent of the prayer failure
            if (optionalContextNodes) {
                var jsonData = {};
                // this data is attached to the error. The app that controls the mathquill
                // can optionally pull it off when it catches the error and send the extra
                // info with the error.
                error.dcgExtraErrorMetaData = jsonData;
                for (var contextName in optionalContextNodes) {
                    var localNode = optionalContextNodes[contextName];
                    var data = (jsonData[contextName] = {});
                    if (localNode) {
                        data.localLatex = localNode.latex();
                        var root = walkUpAsFarAsPossible(localNode);
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
        var tmp = document.implementation.createHTMLDocument('');
        tmp.body.innerHTML = s;
        if (tmp.body.children.length === 1)
            return tmp.body.children[0];
        var frag = document.createDocumentFragment();
        while (tmp.body.firstChild) {
            frag.appendChild(tmp.body.firstChild);
        }
        return frag;
    }
    var h = function h(type, attributes, children) {
        var el;
        switch (type) {
            case 'svg':
            case 'path':
                el = document.createElementNS('http://www.w3.org/2000/svg', type);
                break;
            default:
                el = document.createElement(type);
        }
        for (var key_1 in attributes) {
            var value = attributes[key_1];
            if (value === undefined)
                continue;
            el.setAttribute(key_1, typeof value === 'string' ? value : String(value));
        }
        if (children) {
            for (var i = 0; i < children.length; i++) {
                el.appendChild(children[i]);
            }
        }
        return el;
    };
    h.text = function (s) { return document.createTextNode(s); };
    h.block = function (type, attributes, block) {
        var out = h(type, attributes, [block.html()]);
        block.setDOM(out);
        NodeBase.linkElementByBlockNode(out, block);
        return out;
    };
    h.entityText = function (s) {
        // TODO: replace with h.text(U_BLAHBLAH) or maybe a named entity->unicode lookup
        var val = parseHTML(s);
        pray('entity parses to a single text node', val instanceof DocumentFragment &&
            val.childNodes.length === 1 &&
            val.childNodes[0] instanceof Text);
        return val.childNodes[0];
    };
    function closest(el, s) {
        var _a, _b, _c;
        if (typeof ((_a = el) === null || _a === void 0 ? void 0 : _a.closest) === 'function') {
            return el.closest(s);
        }
        if (!(el instanceof HTMLElement))
            return null;
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#polyfill
        var matches = Element.prototype.matches ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;
        var match = el;
        do {
            if (matches.call(match, s))
                return match;
            match = (_c = (_b = match === null || match === void 0 ? void 0 : match.parentElement) !== null && _b !== void 0 ? _b : match === null || match === void 0 ? void 0 : match.parentNode) !== null && _c !== void 0 ? _c : null;
        } while (match !== null && match.nodeType === 1);
        return null;
    }
    var U_NO_BREAK_SPACE = '\u00A0';
    var U_ZERO_WIDTH_SPACE = '\u200B';
    var U_DOT_ABOVE = '\u02D9';
    var U_NARY_SUMMATION = '\u2211';
    var U_NARY_PRODUCT = '\u220F';
    var U_NARY_COPRODUCT = '\u2210';
    var U_INTEGRAL = '\u222B';
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
    var animate = (function () {
        // IIFE exists just to hang on to configured rafShim and cancelShim
        // functions
        var rafShim, cancelShim;
        if (typeof requestAnimationFrame === 'function' &&
            typeof cancelAnimationFrame === 'function') {
            rafShim = requestAnimationFrame;
            cancelShim = cancelAnimationFrame;
        }
        else {
            rafShim = function (cb) { return window.setTimeout(cb, 13); };
            cancelShim = clearTimeout;
        }
        return function (duration, cb) {
            var start = Date.now();
            var cancelToken;
            var progress = 0;
            function step() {
                var proposedProgress = (Date.now() - start) / duration;
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
    var Aria = /** @class */ (function () {
        function Aria(controller) {
            this.span = h('span', {
                class: 'mq-aria-alert',
                'aria-live': 'assertive',
                'aria-atomic': 'true',
            });
            this.msg = '';
            this.items = [];
            this.controller = controller;
        }
        Aria.prototype.attach = function () {
            var container = this.controller.container;
            if (this.span.parentNode !== container) {
                domFrag(container).prepend(domFrag(this.span));
            }
        };
        Aria.prototype.queue = function (item, shouldDescribe) {
            if (shouldDescribe === void 0) { shouldDescribe = false; }
            this.items.push(this.processQueueItems(item, shouldDescribe));
            return this;
        };
        Aria.prototype.processQueueItems = function (item, shouldDescribe) {
            if (shouldDescribe === void 0) { shouldDescribe = false; }
            var items = Array.isArray(item) ? item : [item];
            var processedItems = items.map(function (item) {
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
                            return item.parent.ariaLabel + ' ' + itemMathspeak;
                        }
                        else if (item.ariaLabel) {
                            return item.ariaLabel + ' ' + itemMathspeak;
                        }
                    }
                    return itemMathspeak;
                }
                return item || '';
            });
            return processedItems.join(' ');
        };
        Aria.prototype.queueDirOf = function (dir, items, shouldDescribe) {
            if (shouldDescribe === void 0) { shouldDescribe = false; }
            prayDirection(dir);
            var str = dir === L ? 'before' : 'after';
            return this.queueDir(str, items, shouldDescribe);
        };
        Aria.prototype.queueDirEndOf = function (dir, items, shouldDescribe) {
            if (shouldDescribe === void 0) { shouldDescribe = false; }
            prayDirection(dir);
            var str = dir === L ? 'beginning of' : 'end of';
            return this.queueDir(str, items, shouldDescribe);
        };
        Aria.prototype.queueDir = function (dirStr, items, shouldDescribe) {
            var _a;
            if (shouldDescribe === void 0) { shouldDescribe = false; }
            if ((_a = this.controller.ariaStringsOverrideMap) === null || _a === void 0 ? void 0 : _a[dirStr]) {
                return this.queue(this.controller.ariaStringsOverrideMap[dirStr](this.processQueueItems(items, shouldDescribe)));
            }
            return this.queue(dirStr).queue(items, shouldDescribe);
        };
        Aria.prototype.queueSelected = function (items, shouldDescribe) {
            if (shouldDescribe === void 0) { shouldDescribe = false; }
            if (this.controller.ariaStringsOverrideMap &&
                this.controller.ariaStringsOverrideMap.selected) {
                return this.queue(this.controller.ariaStringsOverrideMap.selected(this.processQueueItems(items, shouldDescribe)), shouldDescribe);
            }
            return this.queue(items, shouldDescribe).queue(' selected');
        };
        Aria.prototype.queueTranslatableString = function (item) {
            var _a;
            var itemOverride = (_a = this.controller.ariaStringsOverrideMap) === null || _a === void 0 ? void 0 : _a[item];
            if (itemOverride && typeof itemOverride === 'string') {
                return this.queue(itemOverride);
            }
            return this.queue(item);
        };
        Aria.prototype.alert = function (t) {
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
        };
        Aria.prototype.clear = function () {
            this.items.length = 0;
            return this;
        };
        return Aria;
    }());
    // rm_below_makefile
    // We need to add these delimiters to delete the tests in MakeFile because we
    //   don't bundle and tree shake out unused code.
    // To run any in-source tests, uncomment the "if" block and run the command
    //   `npm run test`.
    // if (import.meta?.vitest) {
    //   const { it, expect, vi } = import.meta.vitest;
    //   const ctrlrStub = {
    //     container: document.createElement('div'),
    //     containerHasFocus: () => true,
    //     options: {
    //       logAriaAlerts: true,
    //     },
    //   } as unknown as Controller;
    //   const hMock = (tag: string) => {
    //     const el = document.createElement(tag);
    //     return el;
    //   };
    //   vi.stubGlobal('prayDirection', () => {});
    //   vi.stubGlobal('h', hMock);
    //   vi.stubGlobal('domFrag', (el: HTMLElement) => el);
    //   vi.stubGlobal(
    //     'MQNode',
    //     class MQNode {
    //       mathspeak() {
    //         return 'hello';
    //       }
    //       parent = null;
    //     }
    //   );
    //   vi.stubGlobal('L', -1);
    //   vi.stubGlobal('R', 1);
    //   it('should queue and alert', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queue('hello').queue('world').alert();
    //     expect(aria.msg).toBe('hello world');
    //     expect(aria.span.textContent).toBe(aria.msg);
    //   });
    //   it('should clear', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queue('hello').queue('world').clear();
    //     expect(aria.items).toEqual([]);
    //   });
    //   it('should queueDirOf', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queueDirOf(R, 'the rise').queueDirOf(L, 'the fall').alert();
    //     expect(aria.msg).toEqual('after the rise before the fall');
    //     expect(aria.span.textContent).toEqual(aria.msg);
    //   });
    //   it('should queueDirEndOf', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queueDirEndOf(R, 'the rise').queueDirEndOf(L, 'the fall').alert();
    //     expect(aria.msg).toEqual('end of the rise beginning of the fall');
    //     expect(aria.span.textContent).toEqual(aria.msg);
    //   });
    //   it('should queue with MQNode item without parent or ariaLabel', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queue(new MQNode());
    //     expect(aria.items).toEqual(['hello']);
    //   });
    //   it('should queue with MQNode item with parent and ariaLabel', () => {
    //     const aria = new Aria(ctrlrStub);
    //     const parent = new MQNode();
    //     parent.ariaLabel = 'i am a parent';
    //     const node = new MQNode();
    //     node.parent = parent;
    //     node.ariaLabel = 'block';
    //     aria.queue(node, true);
    //     expect(aria.items).toEqual(['i am a parent hello']);
    //   });
    //   it('should queue with MQNode item with ariaLabel and no parent', () => {
    //     const aria = new Aria(ctrlrStub);
    //     const node = new MQNode();
    //     node.ariaLabel = 'goodbye';
    //     aria.queue(node, true);
    //     expect(aria.items).toEqual(['goodbye hello']);
    //   });
    //   it('should queueSelected', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queueSelected('hello').alert();
    //     expect(aria.msg).toEqual('hello selected');
    //     expect(aria.span.textContent).toEqual(aria.msg);
    //   });
    //   it('should queueTranslatableString and return same string is no override', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.queueTranslatableString('nothing selected').alert();
    //     expect(aria.msg).toEqual('nothing selected');
    //     expect(aria.span.textContent).toEqual(aria.msg);
    //   });
    //   it('should queueTranslatableString and return override', () => {
    //     const aria = new Aria(ctrlrStub);
    //     aria.controller.ariaStringsOverrideMap = {
    //       'nothing selected': 'ns',
    //       before: (s) => `b ${s}`,
    //       after: (s) => `a ${s}`,
    //       'beginning of': (s) => `bo ${s}`,
    //       'end of': (s) => `eo ${s}`,
    //       selected: (s) => `s ${s}`,
    //       'no answer': 'nan',
    //       'nothing to the right': 'ntr',
    //       'nothing to the left': 'ntl',
    //       'block is empty': 'bie',
    //       'nothing above': 'nab',
    //       labelValue: (label, value) => `${label}! ${value}?`,
    //       Baseline: 'bl',
    //       Superscript: 'ss',
    //     };
    //     const keys = Object.keys(aria.controller.ariaStringsOverrideMap) as Array<
    //       keyof AriaStaticStringsMap
    //     >;
    //     for (const key of keys) {
    //       const override = aria.controller.ariaStringsOverrideMap[key];
    //       if (typeof override === 'string') {
    //         aria.queueTranslatableString(key).alert();
    //         expect(aria.msg).toEqual(override);
    //         aria.clear();
    //       } else {
    //         aria.queue(override('test', 'also test')).alert();
    //         expect(aria.msg).toContain('test');
    //         aria.clear();
    //       }
    //     }
    //   });
    // }
    // rm_above_makefile
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
    var DOMFragment = /** @class */ (function () {
        /**
         * Constructor is private to enforce that the invariant checks in
         * `create` are applied to outside callers. Internal methods are
         * allowed to use this constructor when they can guarantee they're
         * passing sibling nodes (such as children of a parent node).
         */
        function DOMFragment(first, last) {
            var _a;
            if (arguments.length === 1)
                last = first;
            if (!first || !last)
                return;
            this.ends = (_a = {}, _a[L] = first, _a[R] = last, _a);
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
        DOMFragment.create = function (first, last) {
            if (arguments.length === 1)
                last = first;
            pray('No half-empty DOMFragments', !!first === !!last);
            var out = new DOMFragment(first, last);
            pray('last is a forward sibling of first', out.isValid());
            return out;
        };
        DOMFragment.prototype.isEmpty = function () {
            return this.ends === undefined;
        };
        DOMFragment.prototype.isOneNode = function () {
            return !!(this.ends && this.ends[L] === this.ends[R]);
        };
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
        DOMFragment.prototype.isValid = function () {
            if (!this.ends)
                return true;
            if (this.ends[L] === this.ends[R])
                return true;
            var maybeLast;
            this.eachNode(function (el) { return (maybeLast = el); });
            return maybeLast === this.ends[R];
        };
        /**
         * Return the first Node of this fragment. May be a a Node that is not
         * an Element such as a Text or Comment node.
         *
         * Asserts fragment is not empty.
         */
        DOMFragment.prototype.firstNode = function () {
            pray('Fragment is not empty', this.ends);
            return this.ends[L];
        };
        /**
         * Return the last Node of this fragment. May be a a Node that is not
         * an Element such as a Text or Comment node.
         *
         * Asserts fragment is not empty.
         */
        DOMFragment.prototype.lastNode = function () {
            pray('Fragment is not empty', this.ends);
            return this.ends[R];
        };
        /**
         * Return a fragment representing the children (including Text and
         * Comment nodes) of the node represented by this fragment.
         *
         * Asserts that this fragment contains exactly one Node.
         *
         * Note, because this includes text and comment nodes, this is more
         * like jQuery's .contents() than jQuery's .children()
         */
        DOMFragment.prototype.children = function () {
            var el = this.oneNode();
            var first = el.firstChild;
            var last = el.lastChild;
            return first && last ? new DOMFragment(first, last) : new DOMFragment();
        };
        /**
         * Return a new `DOMFragment` spanning this fragment and `sibling`
         * fragment. Does not perform any DOM operations.
         *
         * Asserts that `sibling` is either empty or a forward sibling of
         * this fragment that may share its first node with the last node of
         * this fragment
         */
        DOMFragment.prototype.join = function (sibling) {
            if (!this.ends)
                return sibling;
            if (!sibling.ends)
                return this;
            // Check if sibling is actually a sibling of this span
            var found = false;
            var current = this.ends[R].nextSibling;
            while (current) {
                if (current === sibling.ends[L]) {
                    found = true;
                    break;
                }
                current = current.nextSibling;
            }
            pray('sibling must be a forward DOM sibling of this fragment', found);
            return new DOMFragment(this.ends[L], sibling.ends[R]);
        };
        /**
         * Return the single DOM Node represented by this fragment.
         *
         * Asserts that this fragment contains exactly one Node.
         */
        DOMFragment.prototype.oneNode = function () {
            pray('Fragment has a single node', this.ends && this.ends[L] === this.ends[R]);
            return this.ends[L];
        };
        /**
         * Return the single DOM Element represented by this fragment.
         *
         * Asserts that this fragment contains exactly one Node, and that node
         * is an Element node.
         */
        DOMFragment.prototype.oneElement = function () {
            var el = this.oneNode();
            pray('Node is an Element', el.nodeType === Node.ELEMENT_NODE);
            return el;
        };
        /**
         * Return the single DOM Text node represented by this fragment.
         *
         * Asserts that this fragment contains exactly one Node, and that node
         * is a Text node.
         */
        DOMFragment.prototype.oneText = function () {
            var el = this.oneNode();
            pray('Node is Text', el.nodeType === Node.TEXT_NODE);
            return el;
        };
        /**
         * Calls callback sequentially with each node in this fragment.
         * Includes nodes that are not Elements, such as Text and Comment
         * nodes.
         */
        DOMFragment.prototype.eachNode = function (cb) {
            if (!this.ends)
                return this;
            var stop = this.ends[R];
            for (var node = this.ends[L], next = void 0; node; node = next) {
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
        };
        /**
         * Calls callback sequentially with each Element node in this
         * fragment. Skips nodes that are not Elements, such as Text and
         * Comment nodes.
         */
        DOMFragment.prototype.eachElement = function (cb) {
            this.eachNode(function (el) {
                if (el.nodeType === Node.ELEMENT_NODE)
                    cb(el);
            });
            return this;
        };
        /**
         * Returns the concatenated text content of all of the nodes in the
         * fragment.
         */
        DOMFragment.prototype.text = function () {
            var accum = '';
            this.eachNode(function (node) {
                accum += node.textContent || '';
            });
            return accum;
        };
        /**
         * Returns an array of all the Nodes in this fragment, including nodes
         * that are not Element nodes such as Text and Comment nodes;
         */
        DOMFragment.prototype.toNodeArray = function () {
            var accum = [];
            this.eachNode(function (el) { return accum.push(el); });
            return accum;
        };
        /**
         * Returns an array of all the Element nodes in this fragment. The
         * result does not include nodes that are not Elements, such as Text
         * and Comment nodes.
         */
        DOMFragment.prototype.toElementArray = function () {
            var accum = [];
            this.eachElement(function (el) { return accum.push(el); });
            return accum;
        };
        /**
         * Moves all of the nodes in this fragment into a new DocumentFragment
         * and returns it. This includes Nodes that are not Elements such as
         * Text and Comment nodes.
         */
        DOMFragment.prototype.toDocumentFragment = function () {
            var frag = document.createDocumentFragment();
            this.eachNode(function (el) { return frag.appendChild(el); });
            return frag;
        };
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
        DOMFragment.prototype.insertBefore = function (sibling) {
            return this.insDirOf(L, sibling);
        };
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
        DOMFragment.prototype.insertAfter = function (sibling) {
            return this.insDirOf(R, sibling);
        };
        /**
         * Append children to the node represented by this fragment.
         *
         * Asserts that this fragment contains exactly one Element.
         */
        DOMFragment.prototype.append = function (children) {
            children.appendTo(this.oneElement());
            return this;
        };
        /**
         * Prepend children to the node represented by this fragment.
         *
         * Asserts that this fragment contains exactly one Element.
         */
        DOMFragment.prototype.prepend = function (children) {
            children.prependTo(this.oneElement());
            return this;
        };
        /**
         * Append all the nodes in this fragment to the children of `el`.
         */
        DOMFragment.prototype.appendTo = function (el) {
            return this.insAtDirEnd(R, el);
        };
        /**
         * Prepend all the nodes in this fragment to the children of `el`.
         */
        DOMFragment.prototype.prependTo = function (el) {
            return this.insAtDirEnd(L, el);
        };
        /**
         * Return a fragment containing the parent node of the nodes in this
         * fragment. Returns an empty fragment if this fragment is empty or
         * does not have a parent node.
         */
        DOMFragment.prototype.parent = function () {
            if (!this.ends)
                return this;
            var parent = this.ends[L].parentNode;
            if (!parent)
                return new DOMFragment();
            return new DOMFragment(parent);
        };
        /**
         * Replace the children of `el` with the contents of this fragment,
         * and place `el` into the DOM at the previous location of this
         * fragment.
         */
        DOMFragment.prototype.wrapAll = function (el) {
            el.textContent = ''; // First empty the wrapping element
            if (!this.ends)
                return this;
            var parent = this.ends[L].parentNode;
            var next = this.ends[R].nextSibling;
            this.appendTo(el);
            if (parent) {
                parent.insertBefore(el, next);
            }
            return this;
        };
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
        DOMFragment.prototype.replaceWith = function (children) {
            var _a;
            var rightEnd = (_a = this.ends) === null || _a === void 0 ? void 0 : _a[R];
            // Note: important to cache parent and nextSibling (if they exist)
            // before detaching this fragment from the document (which will
            // mutate its parent and sibling references)
            var parent = rightEnd === null || rightEnd === void 0 ? void 0 : rightEnd.parentNode;
            var nextSibling = rightEnd === null || rightEnd === void 0 ? void 0 : rightEnd.nextSibling;
            this.detach();
            // Note, this purposely detaches children from the document, even if
            // they can't be reinserted because this fragment is empty or has no
            // parent
            var childDocumentFragment = children.toDocumentFragment();
            if (!rightEnd || !parent)
                return this;
            parent.insertBefore(childDocumentFragment, nextSibling || null);
            return this;
        };
        /**
         * Return the nth Element node of this collection, or undefined if
         * there is no nth Element. Skips Nodes that are not Elements (e.g.
         * Text and Comment nodes).
         *
         * Analogous to jQuery's array indexing syntax, or jQuery's .get()
         * with positive arguments.
         */
        DOMFragment.prototype.nthElement = function (n) {
            if (!this.ends)
                return undefined;
            if (n < 0 || n !== Math.floor(n))
                return undefined;
            var current = this.ends[L];
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
        };
        /**
         * Return the first Element node of this fragment, or undefined if
         * the fragment is empty. Skips Nodes that are not Elements (e.g.
         * Text and Comment nodes).
         */
        DOMFragment.prototype.firstElement = function () {
            return this.nthElement(0);
        };
        /**
         * Return the last Element node of this fragment, or undefined if
         * the fragment is empty. Skips Nodes that are not Elements (e.g.
         * Text and Comment nodes).
         */
        DOMFragment.prototype.lastElement = function () {
            if (!this.ends)
                return undefined;
            var current = this.ends[R];
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
        };
        /**
         * Return a new fragment holding the first Element node of this
         * fragment, or an empty fragment if this fragment is empty. Skips
         * Nodes that are not Elements (e.g. Text and Comment nodes).
         */
        DOMFragment.prototype.first = function () {
            return new DOMFragment(this.firstElement());
        };
        /**
         * Return a new fragment holding the last Element node of this
         * fragment, or an empty fragment if this fragment is empty. Skips
         * Nodes that are not Elements (e.g. Text and Comment nodes).
         */
        DOMFragment.prototype.last = function () {
            return new DOMFragment(this.lastElement());
        };
        /**
         * Return a new fragment holding the nth Element node of this
         * fragment, or an empty fragment if there is no nth node of this
         * fragment. Skips Nodes that are not Elements (e.g. Text and Comment
         * nodes).
         */
        DOMFragment.prototype.eq = function (n) {
            return new DOMFragment(this.nthElement(n));
        };
        /**
         * Return a new fragment beginning with the nth Element node of this
         * fragment, and ending with the same end as this fragment, or an
         * empty fragment if there is no nth node in this fragment. Skips
         * Nodes that are not Elements (e.g. Text and Comment nodes).
         */
        DOMFragment.prototype.slice = function (n) {
            // Note, would be reasonable to extend this to take a second
            // argument if we ever find we need this
            if (!this.ends)
                return this;
            var el = this.nthElement(n);
            if (!el)
                return new DOMFragment();
            return new DOMFragment(el, this.ends[R]);
        };
        /**
         * Return a new fragment containing the next Element after the Node
         * represented by this fragment, or an empty fragment if there is no
         * next Element. Skips Nodes that are not Elements (e.g. Text and
         * Comment nodes).
         *
         * Asserts that this fragment contains exactly one Node.
         */
        DOMFragment.prototype.next = function () {
            var current = this.oneNode();
            while (current) {
                current = current.nextSibling;
                if (current && current.nodeType === Node.ELEMENT_NODE)
                    return new DOMFragment(current);
            }
            return new DOMFragment();
        };
        /**
         * Return a new fragment containing the previousElement after the Node
         * represented by this fragment, or an empty fragment if there is no
         * previous Element. Skips Nodes that are not Elements (e.g. Text and
         * Comment nodes).
         *
         * Asserts that this fragment contains exactly one Node.
         */
        DOMFragment.prototype.prev = function () {
            var current = this.oneNode();
            while (current) {
                current = current.previousSibling;
                if (current && current.nodeType === Node.ELEMENT_NODE)
                    return new DOMFragment(current);
            }
            return new DOMFragment();
        };
        /**
         * Remove all children of every Element Node in the fragment. Skips
         * Nodes that are not Elements (e.g. Text and Comment nodes).
         */
        DOMFragment.prototype.empty = function () {
            // TODO the corresponding jQuery methods clean up some internal
            // references before removing elements from the DOM. That won't
            // matter once jQuery is totally gone, but until then, this may
            // introduce memory leaks
            this.eachElement(function (el) {
                el.textContent = '';
            });
            return this;
        };
        /**
         * Remove every node in the fragment from the DOM.
         *
         * Implemented by moving every node in the fragment into a new
         * document fragment in order to preserve the sibling relationships
         * of the removed element. If you want to get access to this document
         * fragment, use `.toDocumentFragment()` instead.
         */
        DOMFragment.prototype.remove = function () {
            // TODO the corresponding jQuery methods clean up some internal
            // references before removing elements from the DOM. That won't
            // matter once jQuery is totally gone, but until then, this may
            // introduce memory leaks
            // Note, removing the elements by moving them to a document fragment
            // because this way their sibling references stay intact. This is
            // important if we want to reattach them somewhere else later
            this.toDocumentFragment();
            return this;
        };
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
        DOMFragment.prototype.detach = function () {
            // In jQuery, detach() is similar to remove() but it does not clean
            // up internal references. Here they're aliases, but I'm leaving
            // this as a separate method for the moment to keep track of where
            // mathquill did one vs the other.
            return this.remove();
        };
        /**
         * Insert this fragment either just before or just after `sibling`
         * fragment according to the direction specified by `dir`. If
         * `sibling` is empty or does not have a parent node, detaches this
         * fragment from the document.
         */
        DOMFragment.prototype.insDirOf = function (dir, sibling) {
            var _a;
            if (!this.ends)
                return this;
            var el = (_a = sibling.ends) === null || _a === void 0 ? void 0 : _a[dir];
            if (!el || !el.parentNode)
                return this.detach();
            _insDirOf(dir, el.parentNode, this.toDocumentFragment(), el);
            return this;
        };
        /**
         * Insert this fragment into `el` either at the beginning or end of
         * its children, according to the direction specified by `dir`.
         */
        DOMFragment.prototype.insAtDirEnd = function (dir, el) {
            if (!this.ends)
                return this;
            _insAtDirEnd(dir, this.toDocumentFragment(), el);
            return this;
        };
        /**
         * Return true if any element in this fragment has class `className`
         * and false otherwise.
         */
        DOMFragment.prototype.hasClass = function (className) {
            var out = false;
            this.eachElement(function (el) {
                if (el.classList.contains(className))
                    out = true;
            });
            return out;
        };
        /**
         * Add each class in space separated list of classes given by
         * `classNames` to each element in this fragment.
         */
        DOMFragment.prototype.addClass = function (classNames) {
            var _loop_1 = function (className) {
                if (!className)
                    return "continue";
                this_1.eachElement(function (el) {
                    el.classList.add(className);
                });
            };
            var this_1 = this;
            for (var _a = 0, _b = classNames.split(/\s+/); _a < _b.length; _a++) {
                var className = _b[_a];
                _loop_1(className);
            }
            return this;
        };
        /**
         * Remove each class in space separated list of classes given by
         * `classNames` from each element in this fragment.
         */
        DOMFragment.prototype.removeClass = function (classNames) {
            var _loop_2 = function (className) {
                if (!className)
                    return "continue";
                this_2.eachElement(function (el) {
                    el.classList.remove(className);
                });
            };
            var this_2 = this;
            for (var _a = 0, _b = classNames.split(/\s+/); _a < _b.length; _a++) {
                var className = _b[_a];
                _loop_2(className);
            }
            return this;
        };
        /**
         * Toggle each class in space separated list of classes given by
         * `classNames` on each element in this fragment.
         *
         * If second arg `on` is given as `true`, always toggle classes on.
         * If second arg `on` is passed as `false`, always toggle classes off.
         */
        DOMFragment.prototype.toggleClass = function (classNames, on) {
            if (on === true)
                return this.addClass(classNames);
            if (on === false)
                return this.removeClass(classNames);
            var _loop_3 = function (className) {
                if (!className)
                    return "continue";
                this_3.eachElement(function (el) {
                    el.classList.toggle(className);
                });
            };
            var this_3 = this;
            for (var _a = 0, _b = classNames.split(/\s+/); _a < _b.length; _a++) {
                var className = _b[_a];
                _loop_3(className);
            }
            return this;
        };
        return DOMFragment;
    }());
    var domFrag = DOMFragment.create;
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
    var Point = /** @class */ (function () {
        function Point(parent, leftward, rightward) {
            this.init(parent, leftward, rightward);
        }
        // keeping init around only for tests
        Point.prototype.init = function (parent, leftward, rightward) {
            this.parent = parent;
            this[L] = leftward;
            this[R] = rightward;
        };
        Point.copy = function (pt) {
            return new Point(pt.parent, pt[L], pt[R]);
        };
        return Point;
    }());
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
    var NodeBase = /** @class */ (function () {
        function NodeBase() {
            var _c;
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
            this.ends = (_c = {}, _c[L] = 0, _c[R] = 0, _c);
            this.id = NodeBase.uniqueNodeId();
        }
        NodeBase.uniqueNodeId = function () {
            return (NodeBase.idCounter += 1);
        };
        // The mqBlockNode and mqCmdNode custom properties link back from the
        // DOM nodes generated by MathQuill to the MQNodes that generated
        // them. This is useful for looking up MQNodes in event handlers and
        // in the mq(elt) public API method
        NodeBase.getNodeOfElement = function (el) {
            if (!el)
                return;
            if (!el.nodeType)
                throw new Error('must pass an Element to NodeBase.getNodeOfElement');
            var elTrackingNode = el;
            return elTrackingNode.mqBlockNode || elTrackingNode.mqCmdNode;
        };
        NodeBase.linkElementByBlockNode = function (elm, blockNode) {
            elm.mqBlockNode = blockNode;
        };
        NodeBase.linkElementByCmdNode = function (elm, cmdNode) {
            elm.mqCmdNode = cmdNode;
        };
        NodeBase.prototype.setEnds = function (ends) {
            this.ends = ends;
            pray('No half-empty node ends', !!this.ends[L] === !!this.ends[R]);
        };
        NodeBase.prototype.getEnd = function (dir) {
            return this.ends[dir];
        };
        NodeBase.prototype.toString = function () {
            return '{{ MathQuill Node #' + this.id + ' }}';
        };
        NodeBase.prototype.setDOM = function (el) {
            if (el) {
                pray('DOM is an element or a text node', el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE);
            }
            this._el = el;
            return this;
        };
        NodeBase.prototype.domFrag = function () {
            return domFrag(this._el);
        };
        NodeBase.prototype.createDir = function (dir, cursor) {
            prayDirection(dir);
            var node = this;
            node.html();
            node.domFrag().insDirOf(dir, cursor.domFrag());
            cursor[dir] = node.adopt(cursor.parent, cursor[L], cursor[R]); // TODO - assuming not undefined, could be 0
            return node;
        };
        NodeBase.prototype.createLeftOf = function (cursor) {
            this.createDir(L, cursor);
        };
        NodeBase.prototype.selectChildren = function (leftEnd, rightEnd) {
            return new MQSelection(leftEnd, rightEnd);
        };
        NodeBase.prototype.bubble = function (yield_) {
            var self = this.getSelfNode();
            for (var ancestor = self; ancestor; ancestor = ancestor.parent) {
                var result = yield_(ancestor);
                if (result === false)
                    break;
            }
            return this;
        };
        NodeBase.prototype.postOrder = function (yield_) {
            var self = this.getSelfNode();
            (function recurse(descendant) {
                if (!descendant)
                    return false;
                descendant.eachChild(recurse);
                yield_(descendant);
                return true;
            })(self);
            return self;
        };
        NodeBase.prototype.isEmpty = function () {
            return this.ends[L] === 0 && this.ends[R] === 0;
        };
        NodeBase.prototype.isQuietEmptyDelimiter = function (dlms) {
            if (!this.isEmpty())
                return false;
            if (!dlms)
                return false;
            if (!this.parent || this.parent.ctrlSeq === undefined)
                return false;
            // Remove any leading \left or \right from the ctrl sequence before looking it up.
            var key = this.parent.ctrlSeq.replace(/^\\(left|right)?/, '');
            return dlms.hasOwnProperty(key);
        };
        NodeBase.prototype.isStyleBlock = function () {
            return false;
        };
        NodeBase.prototype.isTextBlock = function () {
            return false;
        };
        NodeBase.prototype.children = function () {
            return new Fragment(this.getEnd(L), this.getEnd(R));
        };
        NodeBase.prototype.eachChild = function (yield_) {
            eachNode(this.ends, yield_);
            return this;
        };
        NodeBase.prototype.foldChildren = function (fold, yield_) {
            return foldNodes(this.ends, fold, yield_);
        };
        NodeBase.prototype.withDirAdopt = function (dir, parent, withDir, oppDir) {
            var self = this.getSelfNode();
            new Fragment(self, self).withDirAdopt(dir, parent, withDir, oppDir);
            return this;
        };
        /**
         * Add this node to the given parent node's children, at the position between the adjacent
         * children `leftward` (or the beginning if omitted) and `rightward` (or the end if omitted).
         * See `Fragment#adopt()`
         */
        NodeBase.prototype.adopt = function (parent, leftward, rightward) {
            var self = this.getSelfNode();
            new Fragment(self, self).adopt(parent, leftward, rightward);
            return this.getSelfNode();
        };
        NodeBase.prototype.disown = function () {
            var self = this.getSelfNode();
            new Fragment(self, self).disown();
            return this;
        };
        NodeBase.prototype.remove = function () {
            this.domFrag().remove();
            return this.disown();
        };
        NodeBase.prototype.shouldIgnoreSubstitutionInSimpleSubscript = function (options) {
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
        };
        NodeBase.prototype.getSelfNode = function () {
            // dumb dance to tell typescript that we eventually become a MQNode
            return this;
        };
        // Overridden by child classes
        NodeBase.prototype.parser = function () {
            pray('Abstract parser() method is never called', false);
        };
        /** Render this node to DOM */
        NodeBase.prototype.html = function () {
            throw new Error('html() unimplemented in NodeBase');
        };
        NodeBase.prototype.text = function () {
            return '';
        };
        NodeBase.prototype.latex = function () {
            var ctx = { latex: '', startIndex: -1, endIndex: -1 };
            this.latexRecursive(ctx);
            return ctx.latex;
        };
        NodeBase.prototype.latexRecursive = function (_ctx) { };
        NodeBase.prototype.checkCursorContextOpen = function (ctx) {
            if (ctx.startSelectionBefore === this) {
                ctx.startIndex = ctx.latex.length;
            }
            if (ctx.endSelectionBefore === this) {
                ctx.endIndex = ctx.latex.length;
            }
        };
        NodeBase.prototype.checkCursorContextClose = function (ctx) {
            if (ctx.startSelectionAfter === this) {
                ctx.startIndex = ctx.latex.length;
            }
            if (ctx.endSelectionAfter === this) {
                ctx.endIndex = ctx.latex.length;
            }
        };
        NodeBase.prototype.finalizeTree = function (_options, _dir) { };
        NodeBase.prototype.contactWeld = function (_cursor, _dir) { };
        NodeBase.prototype.blur = function (_cursor) { };
        NodeBase.prototype.focus = function () { };
        NodeBase.prototype.intentionalBlur = function () { };
        NodeBase.prototype.reflow = function () { };
        NodeBase.prototype.registerInnerField = function (_innerFields, _mathField) { };
        NodeBase.prototype.chToCmd = function (_ch, _options) {
            pray('Abstract chToCmd() method is never called', false);
        };
        NodeBase.prototype.mathspeak = function (_options) {
            if (this.mathspeakOverride) {
                return this.mathspeakOverride(this.latex());
            }
            return '';
        };
        NodeBase.prototype.seek = function (_clientX, _cursor) { };
        NodeBase.prototype.siblingDeleted = function (_options, _dir) { };
        NodeBase.prototype.siblingCreated = function (_options, _dir) { };
        NodeBase.prototype.finalizeInsert = function (_options, _cursor) { };
        NodeBase.prototype.fixDigitGrouping = function (_opts) { };
        NodeBase.prototype.writeLatex = function (_cursor, _latex) { };
        NodeBase.prototype.write = function (_cursor, _ch) { };
        var _a, _b;
        _a = L, _b = R;
        NodeBase.idCounter = 0;
        return NodeBase;
    }());
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
    var Fragment = /** @class */ (function () {
        function Fragment(withDir, oppDir, dir) {
            var _c, _d;
            this.disowned = false;
            if (dir === undefined)
                dir = L;
            prayDirection(dir);
            pray('no half-empty fragments', !withDir === !oppDir, {
                withDir: withDir,
                oppDir: oppDir,
            });
            if (!withDir || !oppDir) {
                this.setEnds((_c = {}, _c[L] = 0, _c[R] = 0, _c));
                return;
            }
            pray('withDir is passed to Fragment', withDir instanceof MQNode);
            pray('oppDir is passed to Fragment', oppDir instanceof MQNode);
            pray('withDir and oppDir have the same parent', withDir.parent === oppDir.parent);
            var ends = (_d = {},
                _d[dir] = withDir,
                _d[-dir] = oppDir,
                _d);
            this.setEnds(ends);
            var maybeRightEnd = 0;
            this.each(function (el) {
                maybeRightEnd = el;
            });
            pray('following direction siblings from start reaches end', maybeRightEnd === ends[R]);
        }
        Fragment.prototype.getDOMFragFromEnds = function () {
            var left = this.ends[L];
            var right = this.ends[R];
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
        };
        /**
         * Note, children may override this to enforce extra invariants,
         * (e.g. that ends are always defined). Ends should only be set
         * through this function.
         */
        Fragment.prototype.setEnds = function (ends) {
            this.ends = ends;
        };
        Fragment.prototype.getEnd = function (dir) {
            return this.ends ? this.ends[dir] : 0;
        };
        Fragment.prototype.domFrag = function () {
            return this.getDOMFragFromEnds();
        };
        // like Cursor::withDirInsertAt(dir, parent, withDir, oppDir)
        Fragment.prototype.withDirAdopt = function (dir, parent, withDir, oppDir) {
            return dir === L
                ? this.adopt(parent, withDir, oppDir)
                : this.adopt(parent, oppDir, withDir);
        };
        /**
         * Splice this fragment into the given parent node's children, at the position between the adjacent
         * children `leftward` (or the beginning if omitted) and `rightward` (or the end if omitted).
         *
         * TODO: why do we need both leftward and rightward? It seems to me that `rightward` is always expected to be `leftward ? leftward[R] : parent.ends[L]`.
         */
        Fragment.prototype.adopt = function (parent, leftward, rightward) {
            var _c;
            prayWellFormed(parent, leftward, rightward);
            var self = this;
            this.disowned = false;
            var leftEnd = self.ends[L];
            if (!leftEnd)
                return this;
            var rightEnd = self.ends[R];
            if (!rightEnd)
                return this;
            var ends = (_c = {}, _c[L] = parent.getEnd(L), _c[R] = parent.getEnd(R), _c);
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
        };
        /**
         * Remove the nodes in this fragment from their parent.
         */
        Fragment.prototype.disown = function () {
            var _c;
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
            var ends = (_c = {}, _c[L] = parent.getEnd(L), _c[R] = parent.getEnd(R), _c);
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
        };
        Fragment.prototype.remove = function () {
            this.domFrag().remove();
            return this.disown();
        };
        Fragment.prototype.each = function (yield_) {
            eachNode(this.ends, yield_);
            return this;
        };
        Fragment.prototype.fold = function (fold, yield_) {
            return foldNodes(this.ends, fold, yield_);
        };
        return Fragment;
    }());
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
    var Anticursor = /** @class */ (function (_super) {
        __extends(Anticursor, _super);
        function Anticursor(parent, leftward, rightward) {
            var _this_1 = _super.call(this, parent, leftward, rightward) || this;
            _this_1.ancestors = {};
            return _this_1;
        }
        Anticursor.fromCursor = function (cursor) {
            return new Anticursor(cursor.parent, cursor[L], cursor[R]);
        };
        return Anticursor;
    }(Point));
    var Cursor = /** @class */ (function (_super) {
        __extends(Cursor, _super);
        function Cursor(initParent, options, controller) {
            var _this_1 = _super.call(this, initParent, 0, 0) || this;
            /** Slightly more than just a "cache", this remembers the cursor's position in each block node, so that we can return to the right
             * point in that node when moving up and down among blocks.
             */
            _this_1.upDownCache = {};
            _this_1.cursorElement = h('span', { class: 'mq-cursor' }, [h.text(U_ZERO_WIDTH_SPACE)]);
            _this_1._domFrag = domFrag();
            _this_1.controller = controller;
            _this_1.options = options;
            _this_1.setDOMFrag(domFrag(_this_1.cursorElement));
            //closured for setInterval
            _this_1.blink = function () {
                domFrag(_this_1.cursorElement).toggleClass('mq-blink');
            };
            return _this_1;
        }
        Cursor.prototype.setDOMFrag = function (frag) {
            this._domFrag = frag;
            return this;
        };
        Cursor.prototype.domFrag = function () {
            return this._domFrag;
        };
        Cursor.prototype.show = function () {
            domFrag(this.cursorElement).removeClass('mq-blink');
            this.setDOMFrag(domFrag(this.cursorElement));
            if (this.intervalId)
                //already was shown, just restart interval
                clearInterval(this.intervalId);
            else {
                //was hidden and detached, insert this.jQ back into HTML DOM
                var right = this[R];
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
        };
        Cursor.prototype.hide = function () {
            if (this.intervalId)
                clearInterval(this.intervalId);
            this.intervalId = 0;
            this.domFrag().detach();
            this.setDOMFrag(domFrag());
            return this;
        };
        Cursor.prototype.withDirInsertAt = function (dir, parent, withDir, oppDir) {
            var oldParent = this.parent;
            this.parent = parent;
            this[dir] = withDir;
            this[-dir] = oppDir;
            // by contract, .blur() is called after all has been said and done
            // and the cursor has actually been moved
            // FIXME pass cursor to .blur() so text can fix cursor pointers when removing itself
            if (oldParent !== parent && oldParent.blur)
                oldParent.blur(this);
        };
        /** Place the cursor before or after `el`, according the side specified by `dir`. */
        Cursor.prototype.insDirOf = function (dir, el) {
            prayDirection(dir);
            this.domFrag().insDirOf(dir, el.domFrag());
            this.withDirInsertAt(dir, el.parent, el[dir], el);
            this.parent.domFrag().addClass('mq-hasCursor');
            return this;
        };
        Cursor.prototype.insLeftOf = function (el) {
            return this.insDirOf(L, el);
        };
        Cursor.prototype.insRightOf = function (el) {
            return this.insDirOf(R, el);
        };
        /** Place the cursor inside `el` at either the left or right end, according the side specified by `dir`. */
        Cursor.prototype.insAtDirEnd = function (dir, el) {
            prayDirection(dir);
            this.domFrag().insAtDirEnd(dir, el.domFrag().oneElement());
            this.withDirInsertAt(dir, el, 0, el.getEnd(dir));
            el.focus();
            return this;
        };
        Cursor.prototype.insAtLeftEnd = function (el) {
            return this.insAtDirEnd(L, el);
        };
        Cursor.prototype.insAtRightEnd = function (el) {
            return this.insAtDirEnd(R, el);
        };
        /**
         * jump up or down from one block Node to another:
         * - cache the current Point in the node we're jumping from
         * - check if there's a Point in it cached for the node we're jumping to
         *   + if so put the cursor there,
         *   + if not seek a position in the node that is horizontally closest to
         *     the cursor's current position
         */
        Cursor.prototype.jumpUpDown = function (from, to) {
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
        };
        Cursor.prototype.getBoundingClientRectWithoutMargin = function () {
            //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
            //returns all 0's on inline elements with negative margin-right (like
            //the cursor) at the end of their parent, so temporarily remove the
            //negative margin-right when calling jQuery::offset()
            //Opera bug DSK-360043
            //http://bugs.jquery.com/ticket/11523
            //https://github.com/jquery/jquery/pull/717
            var frag = this.domFrag();
            frag.removeClass('mq-cursor');
            var _c = getBoundingClientRect(frag.oneElement()), left = _c.left, right = _c.right;
            frag.addClass('mq-cursor');
            return {
                left: left,
                right: right,
            };
        };
        Cursor.prototype.unwrapGramp = function () {
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
        };
        Cursor.prototype.startSelection = function () {
            var anticursor = (this.anticursor = Anticursor.fromCursor(this));
            var ancestors = anticursor.ancestors;
            for (var ancestor = anticursor; ancestor.parent; ancestor = ancestor.parent) {
                ancestors[ancestor.parent.id] = ancestor;
            }
        };
        Cursor.prototype.endSelection = function () {
            delete this.anticursor;
        };
        Cursor.prototype.select = function () {
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
        };
        Cursor.prototype.resetToEnd = function (controller) {
            this.clearSelection();
            var root = controller.root;
            this[R] = 0;
            this[L] = root.getEnd(R);
            this.parent = root;
        };
        Cursor.prototype.clearSelection = function () {
            if (this.selection) {
                this.selection.clear();
                delete this.selection;
                this.selectionChanged();
            }
            return this;
        };
        Cursor.prototype.deleteSelection = function () {
            var selection = this.selection;
            if (!selection)
                return;
            this[L] = selection.getEnd(L)[L];
            this[R] = selection.getEnd(R)[R];
            selection.remove();
            this.selectionChanged();
            delete this.selection;
        };
        Cursor.prototype.replaceSelection = function () {
            var seln = this.selection;
            if (seln) {
                this[L] = seln.getEnd(L)[L];
                this[R] = seln.getEnd(R)[R];
                delete this.selection;
            }
            return seln;
        };
        Cursor.prototype.depth = function () {
            var node = this;
            var depth = 0;
            while ((node = node.parent)) {
                depth += node instanceof MathBlock ? 1 : 0;
            }
            return depth;
        };
        Cursor.prototype.isTooDeep = function (offset) {
            if (this.options.maxDepth !== undefined) {
                return this.depth() + (offset || 0) > this.options.maxDepth;
            }
            else {
                return false;
            }
        };
        // can be overridden
        Cursor.prototype.selectionChanged = function () { };
        return Cursor;
    }(Point));
    var MQSelection = /** @class */ (function (_super) {
        __extends(MQSelection, _super);
        function MQSelection(withDir, oppDir, dir) {
            var _this_1 = _super.call(this, withDir, oppDir, dir) || this;
            _this_1._el = h('span', { class: 'mq-selection' });
            _this_1.getDOMFragFromEnds().wrapAll(_this_1._el);
            return _this_1;
        }
        MQSelection.prototype.isCleared = function () {
            return this._el === undefined;
        };
        MQSelection.prototype.domFrag = function () {
            return this.isCleared() ? this.getDOMFragFromEnds() : domFrag(this._el);
        };
        MQSelection.prototype.setEnds = function (ends) {
            pray('Selection ends are never empty', ends[L] && ends[R]);
            this.ends = ends;
        };
        MQSelection.prototype.getEnd = function (dir) {
            return this.ends[dir];
        };
        MQSelection.prototype.adopt = function (parent, leftward, rightward) {
            this.clear();
            return _super.prototype.adopt.call(this, parent, leftward, rightward);
        };
        MQSelection.prototype.clear = function () {
            // NOTE it's important here that DOMFragment::children includes all
            // child nodes (including Text nodes), and not just Element nodes.
            // This makes it more similar to the native DOM childNodes property
            // and jQuery's .collection() method than jQuery's .children() method
            var childFrag = this.getDOMFragFromEnds();
            this.domFrag().replaceWith(childFrag);
            this._el = undefined;
            return this;
        };
        MQSelection.prototype.join = function (methodName, separator) {
            if (separator === void 0) { separator = ''; }
            return this.fold('', function (fold, child) {
                return fold + separator + child[methodName]();
            });
        };
        return MQSelection;
    }(Fragment));
    var ControllerBase = /** @class */ (function () {
        function ControllerBase(root, container, options) {
            this.textareaEventListeners = {};
            this.id = root.id;
            this.data = {};
            this.root = root;
            this.container = container;
            this.options = options;
            this.aria = new Aria(this.getControllerSelf());
            this.ariaLabel = 'Math Input';
            this.ariaPostLabel = '';
            this.mathSpeakCallback = undefined;
            root.controller = this.getControllerSelf();
            this.cursor = root.cursor = new Cursor(root, options, this.getControllerSelf());
            // TODO: stop depending on root.cursor, and rm it
        }
        ControllerBase.prototype.getControllerSelf = function () {
            // dance we have to do to tell this thing it's a full controller
            return this;
        };
        ControllerBase.prototype.handle = function (name, dir) {
            var _c;
            var handlers = this.options.handlers;
            var handler = (_c = this.options.handlers) === null || _c === void 0 ? void 0 : _c.fns[name];
            if (handler) {
                var APIClass = handlers === null || handlers === void 0 ? void 0 : handlers.APIClasses[this.KIND_OF_MQ];
                pray('APIClass is defined', APIClass);
                var mq = new APIClass(this); // cast to any bedcause APIClass needs the final Controller subclass.
                if (dir === L || dir === R)
                    handler(dir, mq);
                else
                    handler(mq);
            }
        };
        ControllerBase.onNotify = function (f) {
            ControllerBase.notifyees.push(f);
        };
        ControllerBase.prototype.notify = function (e) {
            for (var i = 0; i < ControllerBase.notifyees.length; i += 1) {
                ControllerBase.notifyees[i](this.cursor, e);
            }
            return this;
        };
        ControllerBase.prototype.setAriaLabel = function (ariaLabel) {
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
        };
        ControllerBase.prototype.getAriaLabel = function () {
            if (this.ariaLabel !== 'Math Input') {
                return this.ariaLabel;
            }
            else if (this.editable) {
                return 'Math Input';
            }
            else {
                return '';
            }
        };
        ControllerBase.prototype.setAriaPostLabel = function (ariaPostLabel, timeout) {
            var _this_1 = this;
            if (ariaPostLabel &&
                typeof ariaPostLabel === 'string' &&
                ariaPostLabel !== '') {
                if (ariaPostLabel !== this.ariaPostLabel && typeof timeout === 'number') {
                    if (this._ariaAlertTimeout)
                        clearTimeout(this._ariaAlertTimeout);
                    this._ariaAlertTimeout = window.setTimeout(function () {
                        if (_this_1.containerHasFocus()) {
                            // Voice the new label, but do not update content mathspeak to prevent double-speech.
                            _this_1.aria.alert(_this_1.root.mathspeak().trim() + ' ' + ariaPostLabel.trim());
                        }
                        else {
                            // This mathquill does not have focus, so update its mathspeak.
                            _this_1.updateMathspeak();
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
        };
        ControllerBase.prototype.getAriaPostLabel = function () {
            return this.ariaPostLabel || '';
        };
        ControllerBase.prototype.containerHasFocus = function () {
            return (document.activeElement && this.container.contains(document.activeElement));
        };
        ControllerBase.prototype.getTextareaOrThrow = function () {
            var textarea = this.textarea;
            if (!textarea)
                throw new Error('expected a textarea');
            return textarea;
        };
        ControllerBase.prototype.getTextareaSpanOrThrow = function () {
            var textareaSpan = this.textareaSpan;
            if (!textareaSpan)
                throw new Error('expected a textareaSpan');
            return textareaSpan;
        };
        /** Add the given event listeners on this.textarea, replacing the existing listener for that event if it exists. */
        ControllerBase.prototype.addTextareaEventListeners = function (listeners) {
            if (!this.textarea)
                return;
            for (var key_2 in listeners) {
                var event = key_2;
                this.removeTextareaEventListener(event);
                this.textarea.addEventListener(event, listeners[event]);
            }
        };
        ControllerBase.prototype.removeTextareaEventListener = function (event) {
            if (!this.textarea)
                return;
            var listener = this.textareaEventListeners[event];
            if (!listener)
                return;
            this.textarea.removeEventListener(event, listener);
        };
        // based on http://www.gh-mathspeak.com/examples/quick-tutorial/
        // and http://www.gh-mathspeak.com/examples/grammar-rules/
        ControllerBase.prototype.exportMathSpeak = function () {
            return this.root.mathspeak();
        };
        ControllerBase.prototype.setAriaStringsOverrideMap = function (ariaStringsOverrideMap) {
            this.ariaStringsOverrideMap = ariaStringsOverrideMap;
            return this;
        };
        // overridden
        ControllerBase.prototype.updateMathspeak = function () { };
        ControllerBase.prototype.scrollHoriz = function () { };
        ControllerBase.prototype.selectionChanged = function () { };
        ControllerBase.prototype.setOverflowClasses = function () { };
        ControllerBase.notifyees = [];
        return ControllerBase;
    }());
    var API = {};
    var EMBEDS = {};
    var processedOptions = {
        handlers: true,
        autoCommands: true,
        quietEmptyDelimiters: true,
        autoParenthesizedFunctions: true,
        autoOperatorNames: true,
        leftRightIntoCmdGoes: true,
        maxDepth: true,
        interpretTildeAsSim: true,
    };
    var baseOptionProcessors = {};
    var Options = /** @class */ (function () {
        function Options(version) {
            this.version = version;
        }
        Options.prototype.assertJquery = function () {
            pray('Interface versions > 2 do not depend on JQuery', this.version <= 2);
            pray('JQuery is set for interface v < 3', this.jQuery);
            return this.jQuery;
        };
        return Options;
    }());
    var Progenote = /** @class */ (function () {
        function Progenote() {
        }
        return Progenote;
    }());
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
                'See also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n' +
                '  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide');
    };
    // globally exported API object
    var MQ1;
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
                    'See also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n' +
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
        var version = v;
        if (version < 3) {
            var jQuery = window.jQuery;
            if (!jQuery)
                throw "MathQuill interface version ".concat(version, " requires jQuery 1.5.2+ to be loaded first");
            Options.prototype.jQuery = jQuery;
        }
        var optionProcessors = __assign(__assign({}, baseOptionProcessors), { handlers: function (handlers) { return ({
                // casting to the v3 version of this type
                fns: handlers || {},
                APIClasses: APIClasses,
            }); } });
        function config(currentOptions, newOptions) {
            for (var name in newOptions) {
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
        var BaseOptions = version < 3 ? Options : /** @class */ (function (_super) {
            __extends(BaseOptions, _super);
            function BaseOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return BaseOptions;
        }(Options));
        var AbstractMathQuill = /** @class */ (function (_super) {
            __extends(AbstractMathQuill, _super);
            function AbstractMathQuill(ctrlr) {
                var _this_1 = _super.call(this) || this;
                _this_1.__controller = ctrlr;
                _this_1.__options = ctrlr.options;
                _this_1.id = ctrlr.id;
                _this_1.data = ctrlr.data;
                return _this_1;
            }
            AbstractMathQuill.prototype.mathquillify = function (classNames) {
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
            };
            AbstractMathQuill.prototype.setAriaLabel = function (ariaLabel) {
                this.__controller.setAriaLabel(ariaLabel);
                return this;
            };
            AbstractMathQuill.prototype.getAriaLabel = function () {
                return this.__controller.getAriaLabel();
            };
            AbstractMathQuill.prototype.config = function (opts) {
                config(this.__options, opts);
                return this;
            };
            AbstractMathQuill.prototype.el = function () {
                return this.__controller.container;
            };
            AbstractMathQuill.prototype.text = function () {
                return this.__controller.exportText();
            };
            AbstractMathQuill.prototype.mathspeak = function () {
                return this.__controller.exportMathSpeak();
            };
            AbstractMathQuill.prototype.latex = function (latex) {
                if (arguments.length > 0) {
                    this.__controller.renderLatexMath(latex);
                    var cursor = this.__controller.cursor;
                    if (this.__controller.blurred)
                        cursor.hide().parent.blur(cursor);
                    return this;
                }
                return this.__controller.exportLatex();
            };
            AbstractMathQuill.prototype.selection = function () {
                return this.__controller.exportLatexSelection();
            };
            AbstractMathQuill.prototype.html = function () {
                return this.__controller.root
                    .domFrag()
                    .oneElement()
                    .innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g, '') // TODO remove when jQuery is completely gone
                    .replace(/ mathquill-(?:command|block)-id="?\d+"?/g, '')
                    .replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i, '')
                    .replace(/ mq-hasCursor|mq-hasCursor ?/, '')
                    .replace(/ class=(""|(?= |>))/g, '');
            };
            AbstractMathQuill.prototype.reflow = function () {
                this.__controller.root.postOrder(function (node) {
                    node.reflow();
                });
                return this;
            };
            AbstractMathQuill.prototype.cursor = function () {
                return this.__controller.cursor;
            };
            AbstractMathQuill.prototype.controller = function () {
                return this.__controller;
            };
            AbstractMathQuill.prototype.setAriaStringsOverrideMap = function (map) {
                this.__controller.setAriaStringsOverrideMap(map);
                return this;
            };
            return AbstractMathQuill;
        }(Progenote));
        var EditableField = /** @class */ (function (_super) {
            __extends(EditableField, _super);
            function EditableField() {
                var _this_1 = _super !== null && _super.apply(this, arguments) || this;
                /**
                 * Provide a function to replace the default mathspeak generation with one that
                 * translates TeX to a readable string.
                 * @param callback - A function that takes TeX and returns a readable string.
                 */
                _this_1.setMathspeakOverride = function (fn) {
                    // override function on node class
                    NodeBase.prototype.mathspeakOverride = fn;
                    return _this_1;
                };
                return _this_1;
            }
            EditableField.prototype.mathquillify = function (classNames) {
                _super.prototype.mathquillify.call(this, classNames);
                this.__controller.editable = true;
                this.__controller.addMouseEventListener();
                this.__controller.editablesTextareaEvents();
                return this;
            };
            EditableField.prototype.focus = function () {
                this.__controller.getTextareaOrThrow().focus();
                this.__controller.scrollHoriz();
                return this;
            };
            EditableField.prototype.blur = function () {
                this.__controller.getTextareaOrThrow().blur();
                return this;
            };
            EditableField.prototype.write = function (latex) {
                this.__controller.writeLatex(latex);
                this.__controller.scrollHoriz();
                var cursor = this.__controller.cursor;
                if (this.__controller.blurred)
                    cursor.hide().parent.blur(cursor);
                return this;
            };
            EditableField.prototype.empty = function () {
                var _c;
                var root = this.__controller.root, cursor = this.__controller.cursor;
                root.setEnds((_c = {}, _c[L] = 0, _c[R] = 0, _c));
                root.domFrag().empty();
                delete cursor.selection;
                cursor.insAtRightEnd(root);
                return this;
            };
            EditableField.prototype.cmd = function (cmd) {
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
            };
            EditableField.prototype.select = function () {
                this.__controller.selectAll();
                return this;
            };
            EditableField.prototype.clearSelection = function () {
                this.__controller.cursor.clearSelection();
                return this;
            };
            EditableField.prototype.moveToDirEnd = function (dir) {
                this.__controller
                    .notify('move')
                    .cursor.insAtDirEnd(dir, this.__controller.root);
                return this;
            };
            EditableField.prototype.moveToLeftEnd = function () {
                return this.moveToDirEnd(L);
            };
            EditableField.prototype.moveToRightEnd = function () {
                return this.moveToDirEnd(R);
            };
            EditableField.prototype.keystroke = function (keysString, evt) {
                var keys = keysString.replace(/^\s+|\s+$/g, '').split(/\s+/);
                for (var i = 0; i < keys.length; i += 1) {
                    this.__controller.keystroke(keys[i], evt);
                }
                return this;
            };
            EditableField.prototype.typedText = function (text) {
                for (var i = 0; i < text.length; i += 1)
                    this.__controller.typedText(text.charAt(i));
                return this;
            };
            EditableField.prototype.dropEmbedded = function (pageX, pageY, options) {
                var clientX = pageX - getScrollX();
                var clientY = pageY - getScrollY();
                var el = document.elementFromPoint(clientX, clientY);
                this.__controller.seek(el, clientX, clientY);
                var cmd = new EmbedNode().setOptions(options);
                cmd.createLeftOf(this.__controller.cursor);
            };
            EditableField.prototype.setAriaPostLabel = function (ariaPostLabel, timeout) {
                this.__controller.setAriaPostLabel(ariaPostLabel, timeout);
                return this;
            };
            EditableField.prototype.getAriaPostLabel = function () {
                return this.__controller.getAriaPostLabel();
            };
            EditableField.prototype.clickAt = function (clientX, clientY, target) {
                target = target || document.elementFromPoint(clientX, clientY);
                var ctrlr = this.__controller, root = ctrlr.root;
                var rootElement = root.domFrag().oneElement();
                if (!rootElement.contains(target))
                    target = rootElement;
                ctrlr.seek(target, clientX, clientY);
                if (ctrlr.blurred)
                    this.focus();
                return this;
            };
            EditableField.prototype.ignoreNextMousedown = function (fn) {
                this.__controller.cursor.options.ignoreNextMousedown = fn;
                return this;
            };
            return EditableField;
        }(AbstractMathQuill));
        var APIClasses = {
            AbstractMathQuill: AbstractMathQuill,
            EditableField: EditableField,
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
        var MQ = function (el) {
            if (!el || !el.nodeType)
                return null; // check that `el` is a HTML element, using the
            // same technique as jQuery: https://github.com/jquery/jquery/blob/679536ee4b7a92ae64a5f58d90e9cc38c001e807/src/core/init.js#L92
            var blockElement;
            var childArray = domFrag(el).children().toElementArray();
            for (var _c = 0, childArray_1 = childArray; _c < childArray_1.length; _c++) {
                var child = childArray_1[_c];
                if (child.classList.contains('mq-root-block')) {
                    blockElement = child;
                    break;
                }
            }
            var blockNode = NodeBase.getNodeOfElement(blockElement); // TODO - assumng it's a MathBlock
            var ctrlr = blockNode && blockNode.controller;
            var APIClass = ctrlr && APIClasses[ctrlr.KIND_OF_MQ];
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
    // rm_below_makefile
    // These are only here for the test build
    MathQuill.noConflict = function () {
        window.MathQuill = origMathQuill;
        return MathQuill;
    };
    var origMathQuill = window.MathQuill;
    window.MathQuill = MathQuill;
    // rm_above_makefile
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
    var Parser = /** @class */ (function () {
        // The Parser object is a wrapper for a parser function.
        // Externally, you use one to parse a string by calling
        //   var result = SomeParser.parse('Me Me Me! Parse Me!');
        // You should never call the constructor, rather you should
        // construct your Parser from the base parsers and the
        // parser combinator methods.
        function Parser(body) {
            this._ = body;
        }
        Parser.prototype.parse = function (stream) {
            return this.skip(Parser.eof)._('' + stream, success, parseError);
            function success(_stream, result) {
                return result;
            }
        };
        // -*- primitive combinators -*- //
        Parser.prototype.or = function (alternative) {
            pray('or is passed a parser', alternative instanceof Parser);
            var self = this;
            return new Parser(function (stream, onSuccess, onFailure) {
                return self._(stream, onSuccess, failure);
                function failure(_newStream) {
                    return alternative._(stream, onSuccess, onFailure);
                }
            });
        };
        Parser.prototype.then = function (next) {
            var self = this;
            return new Parser(function (stream, onSuccess, onFailure) {
                return self._(stream, success, onFailure);
                function success(newStream, result) {
                    var nextParser = next instanceof Parser ? next : next(result);
                    pray('a parser is returned', nextParser instanceof Parser);
                    return nextParser._(newStream, onSuccess, onFailure);
                }
            });
        };
        // -*- optimized iterative combinators -*- //
        Parser.prototype.many = function () {
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
        };
        Parser.prototype.times = function (min, max) {
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
        };
        // -*- higher-level combinators -*- //
        Parser.prototype.result = function (res) {
            return this.then(Parser.succeed(res));
        };
        Parser.prototype.atMost = function (n) {
            return this.times(0, n);
        };
        Parser.prototype.atLeast = function (n) {
            var self = this;
            return self.times(n).then(function (start) {
                return self.many().map(function (end) {
                    return start.concat(end);
                });
            });
        };
        Parser.prototype.map = function (fn) {
            return this.then(function (result) {
                return Parser.succeed(fn(result));
            });
        };
        Parser.prototype.skip = function (two) {
            return this.then(function (result) {
                return two.result(result);
            });
        };
        // -*- primitive parsers -*- //
        Parser.string = function (str) {
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
        };
        Parser.regex = function (re) {
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
        };
        Parser.succeed = function (result) {
            return new Parser(function (stream, onSuccess) {
                return onSuccess(stream, result);
            });
        };
        Parser.fail = function (msg) {
            return new Parser(function (stream, _, onFailure) {
                return onFailure(stream, msg);
            });
        };
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
        return Parser;
    }());
    /** Poller that fires once every tick. */
    var EveryTick = /** @class */ (function () {
        function EveryTick() {
            this.fn = noop;
        }
        EveryTick.prototype.listen = function (fn) {
            this.fn = fn;
            clearTimeout(this.timeoutId);
            this.timeoutId = window.setTimeout(this.fn);
        };
        EveryTick.prototype.listenOnce = function (fn) {
            var _this_1 = this;
            this.listen(function () {
                var args = [];
                for (var _c = 0; _c < arguments.length; _c++) {
                    args[_c] = arguments[_c];
                }
                _this_1.clearListener();
                fn.apply(void 0, args);
            });
        };
        EveryTick.prototype.clearListener = function () {
            this.fn = noop;
            clearTimeout(this.timeoutId);
        };
        EveryTick.prototype.trigger = function () {
            var args = [];
            for (var _c = 0; _c < arguments.length; _c++) {
                args[_c] = arguments[_c];
            }
            this.fn.apply(this, args);
        };
        return EveryTick;
    }());
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
        var WHICH_TO_MQ_KEY_STEM = {
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
        var KEY_TO_MQ_KEY_STEM = {
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
                var which = evt.which || evt.keyCode;
                return WHICH_TO_MQ_KEY_STEM[which] || String.fromCharCode(which);
            }
            if (isLowercaseAlphaCharacter(evt.key))
                return evt.key.toUpperCase();
            return (_c = KEY_TO_MQ_KEY_STEM[evt.key]) !== null && _c !== void 0 ? _c : evt.key;
        }
        /** To the extent possible, create a normalized string representation
         * of the key combo (i.e., key code and modifier keys). */
        function getMQKeyName(evt) {
            var key = getMQKeyStem(evt);
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
            var everyTick = new EveryTick();
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
            return { select: select };
        };
    })();
    /***********************************************
     * Export math in a human-readable text format
     * As you can see, only half-baked so far.
     **********************************************/
    var Controller_exportText = /** @class */ (function (_super) {
        __extends(Controller_exportText, _super);
        function Controller_exportText() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Controller_exportText.prototype.exportText = function () {
            return this.root.foldChildren('', function (text, child) {
                return text + child.text();
            });
        };
        return Controller_exportText;
    }(ControllerBase));
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
    var Controller_focusBlur = /** @class */ (function (_super) {
        __extends(Controller_focusBlur, _super);
        function Controller_focusBlur() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.handleTextareaFocusEditable = function () {
                var cursor = _this_1.cursor;
                _this_1.updateMathspeak();
                _this_1.blurred = false;
                clearTimeout(_this_1.blurTimeout);
                domFrag(_this_1.container).addClass('mq-focused');
                if (!cursor.parent)
                    cursor.insAtRightEnd(_this_1.root);
                if (cursor.selection) {
                    cursor.selection.domFrag().removeClass('mq-blur');
                    _this_1.selectionChanged(); //re-select textarea contents after tabbing away and back
                }
                else {
                    cursor.show();
                }
                _this_1.setOverflowClasses();
            };
            _this_1.handleTextareaBlurEditable = function () {
                if (_this_1.textareaSelectionTimeout) {
                    clearTimeout(_this_1.textareaSelectionTimeout);
                    _this_1.textareaSelectionTimeout = 0;
                }
                _this_1.disableGroupingForSeconds(0);
                _this_1.blurred = true;
                _this_1.blurTimeout = window.setTimeout(function () {
                    // wait for blur on window; if
                    _this_1.root.postOrder(function (node) {
                        node.intentionalBlur();
                    }); // none, intentional blur: #264
                    _this_1.cursor.clearSelection().endSelection();
                    _this_1.blur();
                    _this_1.updateMathspeak();
                    _this_1.scrollHoriz();
                });
                window.addEventListener('blur', _this_1.handleWindowBlur);
            };
            _this_1.handleTextareaFocusStatic = function () {
                _this_1.blurred = false;
            };
            _this_1.handleTextareaBlurStatic = function () {
                if (_this_1.cursor.selection) {
                    _this_1.cursor.selection.clear();
                }
                //detaching during blur explodes in WebKit
                window.setTimeout(function () {
                    domFrag(_this_1.getTextareaSpanOrThrow()).detach();
                    _this_1.blurred = true;
                });
            };
            _this_1.handleWindowBlur = function () {
                // blur event also fired on window, just switching
                clearTimeout(_this_1.blurTimeout); // tabs/windows, not intentional blur
                if (_this_1.cursor.selection)
                    _this_1.cursor.selection.domFrag().addClass('mq-blur');
                _this_1.blur();
                _this_1.updateMathspeak();
            };
            return _this_1;
        }
        Controller_focusBlur.prototype.disableGroupingForSeconds = function (seconds) {
            var _this_1 = this;
            clearTimeout(this.__disableGroupingTimeout);
            if (seconds === 0) {
                this.root.domFrag().removeClass('mq-suppress-grouping');
            }
            else {
                this.root.domFrag().addClass('mq-suppress-grouping');
                this.__disableGroupingTimeout = window.setTimeout(function () {
                    _this_1.root.domFrag().removeClass('mq-suppress-grouping');
                }, seconds * 1000);
            }
        };
        Controller_focusBlur.prototype.blur = function () {
            // not directly in the textarea blur handler so as to be
            this.cursor.hide().parent.blur(this.cursor); // synchronous with/in the same frame as
            domFrag(this.container).removeClass('mq-focused'); // clearing/blurring selection
            window.removeEventListener('blur', this.handleWindowBlur);
            if (this.options && this.options.resetCursorOnBlur) {
                this.cursor.resetToEnd(this);
            }
        };
        Controller_focusBlur.prototype.addEditableFocusBlurListeners = function () {
            var ctrlr = this, cursor = ctrlr.cursor;
            this.addTextareaEventListeners({
                focus: this.handleTextareaFocusEditable,
                blur: this.handleTextareaBlurEditable,
            });
            ctrlr.blurred = true;
            cursor.hide().parent.blur(cursor);
        };
        Controller_focusBlur.prototype.addStaticFocusBlurListeners = function () {
            this.addTextareaEventListeners({
                focus: this.handleTextareaFocusStatic,
                blur: this.handleTextareaBlurStatic,
            });
        };
        return Controller_focusBlur;
    }(Controller_exportText));
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
    var MQNode = /** @class */ (function (_super) {
        __extends(MQNode, _super);
        function MQNode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MQNode.prototype.keystroke = function (key, e, ctrlr) {
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
                    ctrlr.aria.queueDirEndOf(R, cursor.parent, true);
                    break;
                // Ctrl-End -> move all the way to the end of the root block.
                case 'Ctrl-End':
                    ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
                    ctrlr.aria.queueDirEndOf(R, [
                        ctrlr.ariaLabel,
                        ctrlr.root,
                        ctrlr.ariaPostLabel,
                    ]);
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
                    ctrlr.aria.queueDirEndOf(L, cursor.parent, true);
                    break;
                // Ctrl-Home -> move all the way to the start of the root block.
                case 'Ctrl-Home':
                    ctrlr.notify('move').cursor.insAtLeftEnd(ctrlr.root);
                    ctrlr.aria.queueDirEndOf(L, [
                        ctrlr.ariaLabel,
                        ctrlr.root,
                        ctrlr.ariaPostLabel,
                    ]);
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
                    ctrlr.withIncrementalSelection(function (selectDir) {
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
                    ctrlr.withIncrementalSelection(function (selectDir) {
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
                    else {
                        ctrlr.aria.queueTranslatableString('nothing above');
                    }
                    break;
                case 'Ctrl-Alt-Down': // speak current block that has focus
                    if (cursor.parent && cursor.parent instanceof MQNode)
                        ctrlr.aria.queue(cursor.parent);
                    else {
                        ctrlr.aria.queueTranslatableString('block is empty');
                    }
                    break;
                case 'Ctrl-Alt-Left': // speak left-adjacent block
                    if (cursor.parent.parent && cursor.parent.parent.getEnd(L)) {
                        ctrlr.aria.queue(cursor.parent.parent.getEnd(L));
                    }
                    else {
                        ctrlr.aria.queueTranslatableString('nothing to the left');
                    }
                    break;
                case 'Ctrl-Alt-Right': // speak right-adjacent block
                    if (cursor.parent.parent && cursor.parent.parent.getEnd(R)) {
                        ctrlr.aria.queue(cursor.parent.parent.getEnd(R));
                    }
                    else {
                        ctrlr.aria.queueTranslatableString('nothing to the right');
                    }
                    break;
                case 'Ctrl-Alt-Shift-Down': // speak selection
                    if (cursor.selection)
                        ctrlr.aria.queueSelected(cursor.selection.join('mathspeak', ' ').trim());
                    else {
                        ctrlr.aria.queueTranslatableString('nothing selected');
                    }
                    break;
                case 'Ctrl-Alt-=':
                case 'Ctrl-Alt-Shift-Right': // speak ARIA post label (evaluation or error)
                    if (ctrlr.ariaPostLabel.length)
                        ctrlr.aria.queue(ctrlr.ariaPostLabel);
                    else {
                        ctrlr.aria.queueTranslatableString('no answer');
                    }
                    break;
                default:
                    return;
            }
            ctrlr.aria.alert();
            e === null || e === void 0 ? void 0 : e.preventDefault();
            ctrlr.scrollHoriz();
        };
        MQNode.prototype.moveOutOf = function (_dir, _cursor, _updown) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::escapeDir, moveDir
        MQNode.prototype.moveTowards = function (_dir, _cursor, _updown) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::moveDir
        MQNode.prototype.deleteOutOf = function (_dir, _cursor) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::deleteDir
        MQNode.prototype.deleteTowards = function (_dir, _cursor) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::deleteDir
        MQNode.prototype.unselectInto = function (_dir, _cursor) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::selectDir
        MQNode.prototype.selectOutOf = function (_dir, _cursor) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::selectDir
        MQNode.prototype.selectTowards = function (_dir, _cursor) {
            pray('overridden or never called on this node', false);
        }; // called by Controller::selectDir
        return MQNode;
    }(NodeBase));
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
    var Controller_keystroke = /** @class */ (function (_super) {
        __extends(Controller_keystroke, _super);
        function Controller_keystroke() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Controller_keystroke.prototype.keystroke = function (key, evt) {
            this.cursor.parent.keystroke(key, evt, this.getControllerSelf());
        };
        Controller_keystroke.prototype.escapeDir = function (dir, _key, e) {
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
        };
        Controller_keystroke.prototype.moveDir = function (dir) {
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
        };
        Controller_keystroke.prototype.moveLeft = function () {
            return this.moveDir(L);
        };
        Controller_keystroke.prototype.moveRight = function () {
            return this.moveDir(R);
        };
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
        Controller_keystroke.prototype.moveUp = function () {
            return this.moveUpDown('up');
        };
        Controller_keystroke.prototype.moveDown = function () {
            return this.moveUpDown('down');
        };
        Controller_keystroke.prototype.moveUpDown = function (dir) {
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
        };
        Controller_keystroke.prototype.deleteDir = function (dir) {
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
                var cursorDir = cursor[dir];
                if (cursorDir)
                    cursorDir.deleteTowards(dir, cursor);
                else
                    cursor.parent.deleteOutOf(dir, cursor);
            }
            var cursorL = cursor[L];
            var cursorR = cursor[R];
            if (cursorL.siblingDeleted)
                cursorL.siblingDeleted(cursor.options, R);
            if (cursorR.siblingDeleted)
                cursorR.siblingDeleted(cursor.options, L);
            cursor.parent.bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return this;
        };
        Controller_keystroke.prototype.ctrlDeleteDir = function (dir) {
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
            var cursorL = cursor[L];
            var cursorR = cursor[R];
            if (cursorL)
                cursorL.siblingDeleted(cursor.options, R);
            if (cursorR)
                cursorR.siblingDeleted(cursor.options, L);
            cursor.parent.bubble(function (node) {
                node.reflow();
                return undefined;
            });
            return this;
        };
        Controller_keystroke.prototype.backspace = function () {
            return this.deleteDir(L);
        };
        Controller_keystroke.prototype.deleteForward = function () {
            return this.deleteDir(R);
        };
        /**
         * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
         * should only be called by withIncrementalSelection because they must
         * be called in sequence.
         */
        Controller_keystroke.prototype.startIncrementalSelection = function () {
            pray("Multiple selections can't be simultaneously open", !INCREMENTAL_SELECTION_OPEN);
            INCREMENTAL_SELECTION_OPEN = true;
            this.notify('select');
            var cursor = this.cursor;
            if (!cursor.anticursor)
                cursor.startSelection();
        };
        /**
         * Update the selection model, stored in cursor, without modifying
         * selection DOM.
         *
         * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
         * should only be called by withIncrementalSelection because they must
         * be called in sequence.
         */
        Controller_keystroke.prototype.selectDirIncremental = function (dir) {
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
        };
        /**
         * Update selection DOM to match cursor model
         *
         * startIncrementalSelection, selectDirIncremental, and finishIncrementalSelection
         * should only be called by withIncrementalSelection because they must
         * be called in sequence.
         */
        Controller_keystroke.prototype.finishIncrementalSelection = function () {
            pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
            var cursor = this.cursor;
            cursor.clearSelection();
            cursor.select() || cursor.show();
            var selection = cursor.selection;
            if (selection) {
                cursor.controller.aria
                    // clearing first because selection fires several times, and we don't want repeated speech.
                    .clear()
                    .queueSelected(selection.join('mathspeak', ' ').trim());
            }
            INCREMENTAL_SELECTION_OPEN = false;
        };
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
        Controller_keystroke.prototype.withIncrementalSelection = function (cb) {
            var _this_1 = this;
            try {
                this.startIncrementalSelection();
                try {
                    cb(function (dir) { return _this_1.selectDirIncremental(dir); });
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
        };
        /**
         * Grow selection one unit in the given direction
         *
         * Note, this should not be called in a loop. To incrementally grow a
         * selection, use withIncrementalSelection
         */
        Controller_keystroke.prototype.selectDir = function (dir) {
            this.withIncrementalSelection(function (selectDir) { return selectDir(dir); });
        };
        Controller_keystroke.prototype.selectLeft = function () {
            return this.selectDir(L);
        };
        Controller_keystroke.prototype.selectRight = function () {
            return this.selectDir(R);
        };
        Controller_keystroke.prototype.selectAll = function () {
            this.notify('move');
            var cursor = this.cursor;
            cursor.insAtRightEnd(this.root);
            this.withIncrementalSelection(function (selectDir) {
                while (cursor[L])
                    selectDir(L);
            });
        };
        Controller_keystroke.prototype.selectToBlockEndInDir = function (dir) {
            var cursor = this.cursor;
            this.withIncrementalSelection(function (selectDir) {
                while (cursor[dir])
                    selectDir(dir);
            });
        };
        Controller_keystroke.prototype.selectToRootEndInDir = function (dir) {
            var _this_1 = this;
            var cursor = this.cursor;
            this.withIncrementalSelection(function (selectDir) {
                while (cursor[dir] || cursor.parent !== _this_1.root) {
                    selectDir(dir);
                }
            });
        };
        return Controller_keystroke;
    }(Controller_focusBlur));
    var TempSingleCharNode = /** @class */ (function (_super) {
        __extends(TempSingleCharNode, _super);
        function TempSingleCharNode(_char) {
            return _super.call(this) || this;
        }
        return TempSingleCharNode;
    }(MQNode));
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
    var Controller_latex = /** @class */ (function (_super) {
        __extends(Controller_latex, _super);
        function Controller_latex() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Controller_latex.prototype.cleanLatex = function (latex) {
            //prune unnecessary spaces
            return latex.replace(/(\\[a-z]+) (?![a-z])/gi, '$1');
        };
        Controller_latex.prototype.exportLatex = function () {
            return this.cleanLatex(this.root.latex());
        };
        Controller_latex.prototype.writeLatex = function (latex) {
            var cursor = this.notify('edit').cursor;
            cursor.parent.writeLatex(cursor, latex);
            return this;
        };
        Controller_latex.prototype.exportLatexSelection = function () {
            var _c, _d;
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
            (_d = (_c = this.root).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
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
        };
        Controller_latex.prototype.classifyLatexForEfficientUpdate = function (latex) {
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
        };
        Controller_latex.prototype.updateLatexMathEfficiently = function (latex, oldLatex) {
            var _c, _d, _e, _f;
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
                var oldMinusNodeL = oldMinusNode[L];
                if (oldMinusNodeL && oldMinusNodeL.parent !== root)
                    return false;
                oldCharNodes[0][L] = oldMinusNode[L];
                if (root.getEnd(L) === oldMinusNode) {
                    root.setEnds((_c = {}, _c[L] = oldCharNodes[0], _c[R] = root.getEnd(R), _c));
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
                    root.setEnds((_d = {}, _d[L] = newMinusNode, _d[R] = root.getEnd(R), _d));
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
                root.setEnds((_e = {}, _e[L] = root.getEnd(L), _e[R] = charNode, _e));
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
                    var newNodeL = newNode[L];
                    newNodeL[R] = newNode;
                    root.setEnds((_f = {}, _f[L] = root.getEnd(L), _f[R] = newNode, _f));
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
        };
        Controller_latex.prototype.renderLatexMathFromScratch = function (latex) {
            var _c;
            var root = this.root, cursor = this.cursor;
            var all = Parser.all;
            var eof = Parser.eof;
            var block = latexMathParser
                .skip(eof)
                .or(all.result(false))
                .parse(latex);
            root.setEnds((_c = {}, _c[L] = 0, _c[R] = 0, _c));
            if (block) {
                block.children().adopt(root, 0, 0);
            }
            if (block) {
                var frag = root.domFrag();
                frag.children().remove();
                frag.oneElement().appendChild(block.html());
                root.finalizeInsert(cursor.options, cursor);
            }
            else {
                root.domFrag().empty();
            }
        };
        Controller_latex.prototype.renderLatexMath = function (latex) {
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
        };
        Controller_latex.prototype.renderLatexText = function (latex) {
            var _c;
            var root = this.root, cursor = this.cursor;
            root.domFrag().children().slice(1).remove();
            root.setEnds((_c = {}, _c[L] = 0, _c[R] = 0, _c));
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
                .map(function (ch) { return new VanillaSymbol(ch); });
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
        };
        return Controller_latex;
    }(Controller_keystroke));
    /********************************************************
     * Deals with mouse events for clicking, drag-to-select
     *******************************************************/
    var ignoreNextMouseDownNoop = function (_el) {
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
    var Controller_mouse = /** @class */ (function (_super) {
        __extends(Controller_mouse, _super);
        function Controller_mouse() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.handleMouseDown = function (e) {
                var rootElement = closest(e.target, '.mq-root-block');
                var root = ((rootElement && NodeBase.getNodeOfElement(rootElement)) ||
                    NodeBase.getNodeOfElement(_this_1.root.domFrag().oneElement()));
                var ownerDocument = root.domFrag().firstNode().ownerDocument;
                var ctrlr = root.controller, cursor = ctrlr.cursor, blink = cursor.blink;
                var textareaSpan = ctrlr.getTextareaSpanOrThrow();
                var textarea = ctrlr.getTextareaOrThrow();
                e.preventDefault(); // doesn't work in IE≤8, but it's a one-line fix:
                e.target.unselectable = true; // http://jsbin.com/yagekiji/1 // TODO - no idea what this unselectable property is
                if (cursor.options.ignoreNextMousedown(e))
                    return;
                // some elements should not act like internal mathquill nodes. Tokens for instance define external
                // click / hover behaviors. So we have mathquill act like the item was never clicked. This allows
                // us to click a token without putting focus in the mathquill.
                if (closest(e.target, '.mq-ignore-mousedown')) {
                    return;
                }
                // triple click should select all mathQuill content
                if (e.detail === 3) {
                    ctrlr.selectAll();
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
            return _this_1;
        }
        Controller_mouse.prototype.addMouseEventListener = function () {
            //drag-to-select event handling
            this.container.addEventListener('mousedown', this.handleMouseDown);
        };
        Controller_mouse.prototype.removeMouseEventListener = function () {
            this.container.removeEventListener('mousedown', this.handleMouseDown);
        };
        Controller_mouse.prototype.seek = function (targetElm, clientX, _clientY) {
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
        };
        return Controller_mouse;
    }(Controller_latex));
    /***********************************************
     * Horizontal panning for editable fields that
     * overflow their width
     **********************************************/
    var Controller_scrollHoriz = /** @class */ (function (_super) {
        __extends(Controller_scrollHoriz, _super);
        function Controller_scrollHoriz() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Controller_scrollHoriz.prototype.setOverflowClasses = function () {
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
        };
        Controller_scrollHoriz.prototype.scrollHoriz = function () {
            var _this_1 = this;
            var cursor = this.cursor, seln = cursor.selection;
            var rootRect = getBoundingClientRect(this.root.domFrag().oneElement());
            if (cursor.domFrag().isEmpty() && !seln) {
                if (this.cancelScrollHoriz) {
                    this.cancelScrollHoriz();
                    this.cancelScrollHoriz = undefined;
                }
                var rootElt_1 = this.root.domFrag().oneElement();
                var start_1 = rootElt_1.scrollLeft;
                animate(this.getScrollAnimationDuration(), function (progress, scheduleNext, cancel) {
                    if (progress >= 1) {
                        _this_1.cancelScrollHoriz = undefined;
                        rootElt_1.scrollLeft = 0;
                        _this_1.setOverflowClasses();
                    }
                    else {
                        _this_1.cancelScrollHoriz = cancel;
                        scheduleNext();
                        rootElt_1.scrollLeft = Math.round((1 - progress) * start_1);
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
            var rootElt = this.root.domFrag().oneElement();
            var start = rootElt.scrollLeft;
            animate(this.getScrollAnimationDuration(), function (progress, scheduleNext, cancel) {
                if (progress >= 1) {
                    _this_1.cancelScrollHoriz = undefined;
                    rootElt.scrollLeft = Math.round(start + scrollBy);
                    _this_1.setOverflowClasses();
                }
                else {
                    _this_1.cancelScrollHoriz = cancel;
                    scheduleNext();
                    rootElt.scrollLeft = Math.round(start + progress * scrollBy);
                }
            });
        };
        Controller_scrollHoriz.prototype.getScrollAnimationDuration = function () {
            var _c;
            return (_c = this.options.scrollAnimationDuration) !== null && _c !== void 0 ? _c : 100;
        };
        return Controller_scrollHoriz;
    }(Controller_mouse));
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
    var Controller = /** @class */ (function (_super) {
        __extends(Controller, _super);
        function Controller() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.selectFn = noop;
            return _this_1;
        }
        Controller.prototype.createTextarea = function () {
            this.textareaSpan = h('span', { class: 'mq-textarea' });
            var textarea = this.options.substituteTextarea();
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
        };
        Controller.prototype.selectionChanged = function () {
            var ctrlr = this;
            // throttle calls to setTextareaSelection(), because setting textarea.value
            // and/or calling textarea.select() can have anomalously bad performance:
            // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
            //
            // Note, this timeout may be cleared by the blur handler in focusBlur.js
            if (!ctrlr.textareaSelectionTimeout) {
                ctrlr.textareaSelectionTimeout = window.setTimeout(function () {
                    ctrlr.setTextareaSelection();
                });
            }
        };
        Controller.prototype.setTextareaSelection = function () {
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
        };
        Controller.prototype.staticMathTextareaEvents = function () {
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
                var textarea = ctrlr.getTextareaOrThrow();
                if (!(textarea instanceof HTMLTextAreaElement))
                    return;
                textarea.value = text;
                if (text)
                    textarea.select();
            };
        };
        Controller.prototype.editablesTextareaEvents = function () {
            var ctrlr = this;
            var textarea = ctrlr.getTextareaOrThrow();
            var textareaSpan = ctrlr.getTextareaSpanOrThrow();
            if (this.options.version < 3) {
                var $ = this.options.assertJquery();
                var keyboardEventsShim = this.options.substituteKeyboardEvents($(textarea), this);
                this.selectFn = function (text) {
                    keyboardEventsShim.select(text);
                };
            }
            else {
                var select = saneKeyboardEvents(textarea, this).select;
                this.selectFn = select;
            }
            domFrag(this.container).prepend(domFrag(textareaSpan));
            this.addEditableFocusBlurListeners();
            this.updateMathspeak();
        };
        Controller.prototype.unbindEditablesEvents = function () {
            var ctrlr = this;
            var textarea = ctrlr.getTextareaOrThrow();
            var textareaSpan = ctrlr.getTextareaSpanOrThrow();
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
        };
        Controller.prototype.typedText = function (ch) {
            if (ch === '\n')
                return this.handle('enter');
            var cursor = this.notify(undefined).cursor;
            cursor.parent.write(cursor, ch);
            this.scrollHoriz();
        };
        Controller.prototype.cut = function () {
            var ctrlr = this, cursor = ctrlr.cursor;
            if (cursor.selection) {
                window.setTimeout(function () {
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
        };
        Controller.prototype.copy = function () {
            this.setTextareaSelection();
        };
        Controller.prototype.paste = function (text) {
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
        };
        /** Set up for a static MQ field (i.e., create and attach the mathspeak element and initialize the focus state to blurred) */
        Controller.prototype.setupStaticField = function () {
            this.mathspeakSpan = h('span', { class: 'mq-mathspeak' });
            domFrag(this.container).prepend(domFrag(this.mathspeakSpan));
            this.updateMathspeak();
            this.blurred = true;
            this.cursor.hide().parent.blur(this.cursor);
        };
        Controller.prototype.updateMathspeak = function () {
            var _c;
            var ctrlr = this;
            // If the controller's ARIA label doesn't end with a punctuation mark, add a colon by default to better separate it from mathspeak.
            var ariaLabel = ctrlr.getAriaLabel();
            var labelWithSuffix = /[A-Za-z0-9]$/.test(ariaLabel)
                ? ariaLabel + ':'
                : ariaLabel;
            var mathspeak = ctrlr.root.mathspeak().trim();
            this.aria.clear();
            var newLabel = ((_c = ctrlr.ariaStringsOverrideMap) === null || _c === void 0 ? void 0 : _c.labelValue)
                ? ctrlr.ariaStringsOverrideMap.labelValue(ariaLabel, mathspeak)
                : labelWithSuffix + ' ' + mathspeak;
            var textarea = ctrlr.getTextareaOrThrow();
            // For static math, provide mathspeak in a visually hidden span to allow screen readers and other AT to traverse the content.
            // For editable math, assign the mathspeak to the textarea's ARIA label (AT can use text navigation to interrogate the content).
            // Be certain to include the mathspeak for only one of these, though, as we don't want to include outdated labels if a field's editable state changes.
            // By design, also take careful note that the ariaPostLabel is meant to exist only for editable math (e.g. to serve as an evaluation or error message)
            // so it is not included for static math mathspeak calculations.
            // The mathspeakSpan should exist only for static math, so we use its presence to decide which approach to take.
            if (!!ctrlr.mathspeakSpan) {
                textarea.setAttribute('aria-label', '');
                ctrlr.mathspeakSpan.textContent = newLabel.trim();
            }
            else {
                textarea.setAttribute('aria-label', [newLabel, ctrlr.ariaPostLabel].join(' ').trim());
            }
        };
        return Controller;
    }(Controller_scrollHoriz));
    /*************************************************
     * Abstract classes of math blocks and commands.
     ************************************************/
    /**
     * Math tree node base class.
     * Some math-tree-specific extensions to MQNode.
     * Both MathBlock's and MathCommand's descend from it.
     */
    var MathElement = /** @class */ (function (_super) {
        __extends(MathElement, _super);
        function MathElement() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MathElement.prototype.finalizeInsert = function (options, cursor) {
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
        };
        // If the maxDepth option is set, make sure
        // deeply nested content is truncated. Just return
        // false if the cursor is already too deep.
        MathElement.prototype.prepareInsertionAt = function (cursor) {
            var maxDepth = cursor.options.maxDepth;
            if (maxDepth !== undefined) {
                var cursorDepth = cursor.depth();
                if (cursorDepth > maxDepth) {
                    return false;
                }
                this.removeNodesDeeperThan(maxDepth - cursorDepth);
            }
            return true;
        };
        // Remove nodes that are more than `cutoff`
        // blocks deep from this node.
        MathElement.prototype.removeNodesDeeperThan = function (cutoff) {
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
        };
        return MathElement;
    }(MQNode));
    var DOMView = /** @class */ (function () {
        function DOMView(childCount, render) {
            this.childCount = childCount;
            this.render = render;
        }
        return DOMView;
    }());
    /**
     * Commands and operators, like subscripts, exponents, or fractions.
     * Descendant commands are organized into blocks.
     */
    var MathCommand = /** @class */ (function (_super) {
        __extends(MathCommand, _super);
        function MathCommand(ctrlSeq, domView, textTemplate) {
            var _this_1 = _super.call(this) || this;
            _this_1.textTemplate = [''];
            _this_1.mathspeakTemplate = [''];
            _this_1.setCtrlSeqHtmlAndText(ctrlSeq, domView, textTemplate);
            return _this_1;
        }
        MathCommand.prototype.setEnds = function (ends) {
            pray('MathCommand ends are never empty', ends[L] && ends[R]);
            this.ends = ends;
        };
        MathCommand.prototype.getEnd = function (dir) {
            return this.ends[dir];
        };
        MathCommand.prototype.setCtrlSeqHtmlAndText = function (ctrlSeq, domView, textTemplate) {
            if (!this.ctrlSeq)
                this.ctrlSeq = ctrlSeq;
            if (domView)
                this.domView = domView;
            if (textTemplate)
                this.textTemplate = textTemplate;
        };
        // obvious methods
        MathCommand.prototype.replaces = function (replacedFragment) {
            replacedFragment.disown();
            this.replacedFragment = replacedFragment;
        };
        MathCommand.prototype.isEmpty = function () {
            return this.foldChildren(true, function (isEmpty, child) {
                return isEmpty && child.isEmpty();
            });
        };
        MathCommand.prototype.parser = function () {
            var _this_1 = this;
            var block = latexMathParser.block;
            return block.times(this.numBlocks()).map(function (blocks) {
                _this_1.blocks = blocks;
                for (var i = 0; i < blocks.length; i += 1) {
                    blocks[i].adopt(_this_1, _this_1.getEnd(R), 0);
                }
                return _this_1;
            });
        };
        // createLeftOf(cursor) and the methods it calls
        MathCommand.prototype.createLeftOf = function (cursor) {
            var cmd = this;
            var replacedFragment = cmd.replacedFragment;
            cmd.createBlocks();
            _super.prototype.createLeftOf.call(this, cursor);
            if (replacedFragment) {
                var cmdEndsL = cmd.getEnd(L);
                replacedFragment.adopt(cmdEndsL, 0, 0);
                replacedFragment.domFrag().appendTo(cmdEndsL.domFrag().oneElement());
                cmd.placeCursor(cursor);
                cmd.prepareInsertionAt(cursor);
            }
            cmd.finalizeInsert(cursor.options, cursor);
            cmd.placeCursor(cursor);
        };
        MathCommand.prototype.createBlocks = function () {
            var cmd = this, numBlocks = cmd.numBlocks(), blocks = (cmd.blocks = Array(numBlocks));
            for (var i = 0; i < numBlocks; i += 1) {
                var newBlock = (blocks[i] = new MathBlock());
                newBlock.adopt(cmd, cmd.getEnd(R), 0);
            }
        };
        MathCommand.prototype.placeCursor = function (cursor) {
            //insert the cursor at the right end of the first empty child, searching
            //left-to-right, or if none empty, the right end child
            cursor.insAtRightEnd(this.foldChildren(this.getEnd(L), function (leftward, child) {
                return leftward.isEmpty() ? leftward : child;
            }));
        };
        // editability methods: called by the cursor for editing, cursor movements,
        // and selection of the MathQuill tree, these all take in a direction and
        // the cursor
        MathCommand.prototype.moveTowards = function (dir, cursor, updown) {
            var updownInto;
            if (updown === 'up') {
                updownInto = this.upInto;
            }
            else if (updown === 'down') {
                updownInto = this.downInto;
            }
            var el = updownInto || this.getEnd(-dir);
            cursor.insAtDirEnd(-dir, el);
            cursor.controller.aria.queueDirEndOf(-dir, cursor.parent, true);
        };
        MathCommand.prototype.deleteTowards = function (dir, cursor) {
            if (this.isEmpty())
                cursor[dir] = this.remove()[dir];
            else
                this.moveTowards(dir, cursor);
        };
        MathCommand.prototype.selectTowards = function (dir, cursor) {
            cursor[-dir] = this;
            cursor[dir] = this[dir];
        };
        MathCommand.prototype.selectChildren = function () {
            return new MQSelection(this, this);
        };
        MathCommand.prototype.unselectInto = function (dir, cursor) {
            var antiCursor = cursor.anticursor;
            var ancestor = antiCursor.ancestors[this.id];
            cursor.insAtDirEnd(-dir, ancestor);
        };
        MathCommand.prototype.seek = function (clientX, cursor) {
            function getBounds(node) {
                var _c;
                var el = node.domFrag().oneElement();
                var l = getBoundingClientRect(el).left;
                var r = l + el.offsetWidth;
                return _c = {},
                    _c[L] = l,
                    _c[R] = r,
                    _c;
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
        };
        MathCommand.prototype.numBlocks = function () {
            return this.domView.childCount;
        };
        /**
         * Render the entire math subtree rooted at this command to a DOM node. Assumes `this.domView` is defined.
         *
         * See dom.test.js for example templates and intended outputs.
         */
        MathCommand.prototype.html = function () {
            var blocks = this.blocks;
            pray('domView is defined', this.domView);
            var template = this.domView;
            var dom = template.render(blocks || []);
            this.setDOM(dom);
            NodeBase.linkElementByCmdNode(dom, this);
            return dom;
        };
        // methods to export a string representation of the math tree
        MathCommand.prototype.latexRecursive = function (ctx) {
            this.checkCursorContextOpen(ctx);
            ctx.latex += this.ctrlSeq || '';
            this.eachChild(function (child) {
                var _c;
                ctx.latex += '{';
                var beforeLength = ctx.latex.length;
                (_c = child.latexRecursive) === null || _c === void 0 ? void 0 : _c.call(child, ctx);
                var afterLength = ctx.latex.length;
                if (beforeLength === afterLength) {
                    // nothing was written so we write a space
                    ctx.latex += ' ';
                }
                ctx.latex += '}';
            });
            this.checkCursorContextClose(ctx);
        };
        MathCommand.prototype.text = function () {
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
        };
        MathCommand.prototype.mathspeak = function () {
            var tex = this.latex();
            console.log({ test: tex });
            if (this.mathspeakOverride) {
                // this one runs before a full latex symbol has been formed;
                //   check if there is more than backslashes in the latex
                if (!/^(\\)+$/.test(tex)) {
                    return this.mathspeakOverride(tex);
                }
            }
            var cmd = this, i = 0;
            return cmd.foldChildren(cmd.mathspeakTemplate[i] || 'Start' + cmd.ctrlSeq + ' ', function (speech, block) {
                i += 1;
                return (speech +
                    ' ' +
                    block.mathspeak() +
                    ' ' +
                    (cmd.mathspeakTemplate[i] + ' ' || 'End' + cmd.ctrlSeq + ' '));
            });
        };
        return MathCommand;
    }(MathElement));
    /**
     * Lightweight command without blocks or children.
     */
    var MQSymbol = /** @class */ (function (_super) {
        __extends(MQSymbol, _super);
        function MQSymbol(ctrlSeq, html, text, mathspeak) {
            var _this_1 = _super.call(this) || this;
            _this_1.setCtrlSeqHtmlTextAndMathspeak(ctrlSeq, html
                ? new DOMView(0, function () { return html.cloneNode(true); })
                : undefined, text, mathspeak);
            return _this_1;
        }
        MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak = function (ctrlSeq, html, text, mathspeak) {
            if (!text && !!ctrlSeq) {
                text = ctrlSeq.replace(/^\\/, '');
            }
            this.mathspeakName = mathspeak || text;
            _super.prototype.setCtrlSeqHtmlAndText.call(this, ctrlSeq, html, [text || '']);
        };
        MQSymbol.prototype.parser = function () {
            return Parser.succeed(this);
        };
        MQSymbol.prototype.numBlocks = function () {
            return 0;
        };
        MQSymbol.prototype.replaces = function (replacedFragment) {
            replacedFragment.remove();
        };
        MQSymbol.prototype.createBlocks = function () { };
        MQSymbol.prototype.moveTowards = function (dir, cursor) {
            cursor.domFrag().insDirOf(dir, this.domFrag());
            cursor[-dir] = this;
            cursor[dir] = this[dir];
            cursor.controller.aria.queue(this);
        };
        MQSymbol.prototype.deleteTowards = function (dir, cursor) {
            cursor[dir] = this.remove()[dir];
        };
        MQSymbol.prototype.seek = function (clientX, cursor) {
            // insert at whichever side the click was closer to
            var el = this.domFrag().oneElement();
            var left = getBoundingClientRect(el).left;
            if (clientX - left < el.offsetWidth / 2)
                cursor.insLeftOf(this);
            else
                cursor.insRightOf(this);
            return cursor;
        };
        MQSymbol.prototype.latexRecursive = function (ctx) {
            this.checkCursorContextOpen(ctx);
            ctx.latex += this.ctrlSeq || '';
            this.checkCursorContextClose(ctx);
        };
        MQSymbol.prototype.text = function () {
            return this.textTemplate.join('');
        };
        MQSymbol.prototype.mathspeak = function (_opts) {
            if (this.mathspeakOverride) {
                return _super.prototype.mathspeak.call(this);
            }
            return this.mathspeakName || '';
        };
        MQSymbol.prototype.placeCursor = function () { };
        MQSymbol.prototype.isEmpty = function () {
            return true;
        };
        return MQSymbol;
    }(MathCommand));
    var VanillaSymbol = /** @class */ (function (_super) {
        __extends(VanillaSymbol, _super);
        function VanillaSymbol(ch, html, mathspeak) {
            return _super.call(this, ch, h('span', {}, [html || h.text(ch)]), undefined, mathspeak) || this;
        }
        return VanillaSymbol;
    }(MQSymbol));
    function bindVanillaSymbol(ch, htmlEntity, mathspeak) {
        return function () {
            return new VanillaSymbol(ch, htmlEntity ? h.entityText(htmlEntity) : undefined, mathspeak);
        };
    }
    var BinaryOperator = /** @class */ (function (_super) {
        __extends(BinaryOperator, _super);
        function BinaryOperator(ctrlSeq, html, text, mathspeak, treatLikeSymbol) {
            var _this_1 = this;
            if (treatLikeSymbol) {
                _this_1 = _super.call(this, ctrlSeq, h('span', {}, [html || h.text(ctrlSeq || '')]), undefined, mathspeak) || this;
            }
            else {
                _this_1 = _super.call(this, ctrlSeq, h('span', { class: 'mq-binary-operator' }, html ? [html] : []), text, mathspeak) || this;
            }
            return _this_1;
        }
        return BinaryOperator;
    }(MQSymbol));
    function bindBinaryOperator(ctrlSeq, htmlEntity, text, mathspeak) {
        return function () {
            return new BinaryOperator(ctrlSeq, htmlEntity ? h.entityText(htmlEntity) : undefined, text, mathspeak);
        };
    }
    /**
     * Children and parent of MathCommand's. Basically partitions all the
     * symbols and operators that descend (in the Math DOM tree) from
     * ancestor operators.
     */
    var MathBlock = /** @class */ (function (_super) {
        __extends(MathBlock, _super);
        function MathBlock() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ariaLabel = 'block';
            return _this_1;
        }
        MathBlock.prototype.join = function (methodName) {
            return this.foldChildren('', function (fold, child) {
                return fold + child[methodName]();
            });
        };
        MathBlock.prototype.html = function () {
            var fragment = document.createDocumentFragment();
            this.eachChild(function (el) {
                var childHtml = el.html();
                fragment.appendChild(childHtml);
                return undefined;
            });
            return fragment;
        };
        MathBlock.prototype.latexRecursive = function (ctx) {
            this.checkCursorContextOpen(ctx);
            this.eachChild(function (child) { var _c; return (_c = child.latexRecursive) === null || _c === void 0 ? void 0 : _c.call(child, ctx); });
            this.checkCursorContextClose(ctx);
        };
        MathBlock.prototype.text = function () {
            var endsL = this.getEnd(L);
            var endsR = this.getEnd(R);
            return endsL === endsR && endsL !== 0 ? endsL.text() : this.join('text');
        };
        MathBlock.prototype.mathspeak = function () {
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
        };
        MathBlock.prototype.keystroke = function (key, e, ctrlr) {
            if (ctrlr.options.spaceBehavesLikeTab &&
                (key === 'Spacebar' || key === 'Shift-Spacebar')) {
                e === null || e === void 0 ? void 0 : e.preventDefault();
                ctrlr.escapeDir(key === 'Shift-Spacebar' ? L : R, key, e);
                return;
            }
            return _super.prototype.keystroke.call(this, key, e, ctrlr);
        };
        // editability methods: called by the cursor for editing, cursor movements,
        // and selection of the MathQuill tree, these all take in a direction and
        // the cursor
        MathBlock.prototype.moveOutOf = function (dir, cursor, updown) {
            var updownInto;
            if (updown === 'up') {
                updownInto = this.parent.upInto;
            }
            else if (updown === 'down') {
                updownInto = this.parent.downInto;
            }
            if (!updownInto && this[dir]) {
                var otherDir = -dir;
                cursor.insAtDirEnd(otherDir, this[dir]);
                cursor.controller.aria.queueDirEndOf(otherDir, cursor.parent, true);
            }
            else {
                cursor.insDirOf(dir, this.parent);
                cursor.controller.aria.queueDirOf(dir, this.parent);
            }
        };
        MathBlock.prototype.selectOutOf = function (dir, cursor) {
            cursor.insDirOf(dir, this.parent);
        };
        MathBlock.prototype.deleteOutOf = function (_dir, cursor) {
            cursor.unwrapGramp();
        };
        MathBlock.prototype.seek = function (clientX, cursor) {
            var node = this.getEnd(R);
            if (!node)
                return cursor.insAtRightEnd(this);
            var el = node.domFrag().oneElement();
            var left = getBoundingClientRect(el).left;
            if (left + el.offsetWidth < clientX) {
                return cursor.insAtRightEnd(this);
            }
            var endsL = this.getEnd(L);
            if (clientX < getBoundingClientRect(endsL.domFrag().oneElement()).left)
                return cursor.insAtLeftEnd(this);
            while (clientX < getBoundingClientRect(node.domFrag().oneElement()).left)
                node = node[L];
            return node.seek(clientX, cursor);
        };
        MathBlock.prototype.chToCmd = function (ch, options) {
            var cons;
            // exclude f because it gets a dedicated command with more spacing
            if (ch.match(/^[a-eg-zA-Z]$/))
                return new Letter(ch);
            else if (/^\d$/.test(ch))
                return new Digit(ch);
            else if (options && options.typingSlashWritesDivisionSymbol && ch === '/')
                return LatexCmds['÷'](ch);
            else if (options && options.typingAsteriskWritesTimesSymbol && ch === '*')
                return LatexCmds['×'](ch);
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
        };
        MathBlock.prototype.write = function (cursor, ch) {
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
        };
        MathBlock.prototype.writeLatex = function (cursor, latex) {
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
        };
        MathBlock.prototype.focus = function () {
            this.domFrag().addClass('mq-hasCursor');
            this.domFrag().removeClass('mq-empty');
            return this;
        };
        MathBlock.prototype.blur = function (cursor) {
            this.domFrag().removeClass('mq-hasCursor');
            if (this.isEmpty()) {
                this.domFrag().addClass('mq-empty');
                if (cursor &&
                    this.isQuietEmptyDelimiter(cursor.options.quietEmptyDelimiters)) {
                    this.domFrag().addClass('mq-quiet-delimiter');
                }
            }
            return this;
        };
        return MathBlock;
    }(MathElement));
    Options.prototype.mouseEvents = true;
    API.StaticMath = function (APIClasses) {
        var _c;
        return _c = /** @class */ (function (_super) {
                __extends(StaticMath, _super);
                function StaticMath(el) {
                    var _this_1 = _super.call(this, el) || this;
                    var innerFields = (_this_1.innerFields = []);
                    _this_1.__controller.root.postOrder(function (node) {
                        node.registerInnerField(innerFields, APIClasses.InnerMathField);
                    });
                    return _this_1;
                }
                StaticMath.prototype.__mathquillify = function (opts, _interfaceVersion) {
                    this.config(opts);
                    _super.prototype.mathquillify.call(this, 'mq-math-mode');
                    this.__controller.setupStaticField();
                    if (this.__options.mouseEvents) {
                        this.__controller.addMouseEventListener();
                        this.__controller.staticMathTextareaEvents();
                    }
                    return this;
                };
                StaticMath.prototype.latex = function (_latex) {
                    var returned = _super.prototype.latex.apply(this, arguments);
                    if (arguments.length > 0) {
                        var innerFields = (this.innerFields = []);
                        this.__controller.root.postOrder(function (node) {
                            node.registerInnerField(innerFields, APIClasses.InnerMathField);
                        });
                        // Force an ARIA label update to remain in sync with the new LaTeX value.
                        this.__controller.updateMathspeak();
                    }
                    return returned;
                };
                StaticMath.prototype.setAriaLabel = function (ariaLabel) {
                    this.__controller.setAriaLabel(ariaLabel);
                    return this;
                };
                StaticMath.prototype.getAriaLabel = function () {
                    return this.__controller.getAriaLabel();
                };
                return StaticMath;
            }(APIClasses.AbstractMathQuill)),
            _c.RootBlock = MathBlock,
            _c;
    };
    var RootMathBlock = /** @class */ (function (_super) {
        __extends(RootMathBlock, _super);
        function RootMathBlock() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RootMathBlock;
    }(MathBlock));
    RootBlockMixin(RootMathBlock.prototype); // adds methods to RootMathBlock
    API.MathField = function (APIClasses) {
        var _c;
        return _c = /** @class */ (function (_super) {
                __extends(MathField, _super);
                function MathField() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                MathField.prototype.__mathquillify = function (opts, interfaceVersion) {
                    this.config(opts);
                    if (interfaceVersion > 1)
                        this.__controller.root.reflow = noop;
                    _super.prototype.mathquillify.call(this, 'mq-editable-field mq-math-mode');
                    // TODO: Why does this need to be deleted (contrary to the type definition)? Could we set it to `noop` instead?
                    delete this.__controller.root.reflow;
                    return this;
                };
                return MathField;
            }(APIClasses.EditableField)),
            _c.RootBlock = RootMathBlock,
            _c;
    };
    API.InnerMathField = function (APIClasses) {
        pray('MathField class is defined', APIClasses.MathField);
        return /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.makeStatic = function () {
                this.__controller.editable = false;
                this.__controller.root.blur();
                this.__controller.unbindEditablesEvents();
                domFrag(this.__controller.container).removeClass('mq-editable-field');
            };
            class_1.prototype.makeEditable = function () {
                this.__controller.editable = true;
                this.__controller.editablesTextareaEvents();
                this.__controller.cursor.insAtRightEnd(this.__controller.root);
                domFrag(this.__controller.container).addClass('mq-editable-field');
            };
            return class_1;
        }(APIClasses.MathField));
    };
    /************************************
     * Symbols for Advanced Mathematics
     ***********************************/
    LatexCmds.notin =
        LatexCmds.cong =
            LatexCmds.equiv =
                LatexCmds.oplus =
                    LatexCmds.otimes =
                        function (latex) {
                            return new BinaryOperator('\\' + latex + ' ', h.entityText('&' + latex + ';'));
                        };
    LatexCmds['∗'] =
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
    LatexCmds['≈'] =
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
    LatexCmds.mathbb = /** @class */ (function (_super) {
        __extends(class_2, _super);
        function class_2() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_2.prototype.createLeftOf = function (_cursor) { };
        class_2.prototype.numBlocks = function () {
            return 1;
        };
        class_2.prototype.parser = function () {
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
        };
        return class_2;
    }(MathCommand));
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
        LatexCmds['¬'] =
            LatexCmds.neg =
                bindVanillaSymbol('\\neg ', '&not;', 'not');
    LatexCmds['…'] =
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
    var DigitGroupingChar = /** @class */ (function (_super) {
        __extends(DigitGroupingChar, _super);
        function DigitGroupingChar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DigitGroupingChar.prototype.finalizeTree = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        DigitGroupingChar.prototype.siblingDeleted = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        DigitGroupingChar.prototype.siblingCreated = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        DigitGroupingChar.prototype.sharedSiblingMethod = function (opts, dir) {
            // don't try to fix digit grouping if the sibling to my right changed (dir === R or
            // undefined) and it's now a DigitGroupingChar, it will try to fix grouping
            if (dir !== L && this[R] instanceof DigitGroupingChar)
                return;
            this.fixDigitGrouping(opts);
        };
        DigitGroupingChar.prototype.fixDigitGrouping = function (opts) {
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
        };
        DigitGroupingChar.prototype.removeGroupingBetween = function (left, right) {
            var node = left;
            do {
                if (node instanceof DigitGroupingChar) {
                    node.setGroupingClass(undefined);
                }
                if (!node || node === right)
                    break;
            } while ((node = node[R]));
        };
        DigitGroupingChar.prototype.addGroupingBetween = function (start, end) {
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
        };
        DigitGroupingChar.prototype.setGroupingClass = function (cls) {
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
        };
        return DigitGroupingChar;
    }(MQSymbol));
    var Digit = /** @class */ (function (_super) {
        __extends(Digit, _super);
        function Digit(ch, mathspeak) {
            return _super.call(this, ch, h('span', { class: 'mq-digit' }, [h.text(ch)]), undefined, mathspeak) || this;
        }
        Digit.prototype.createLeftOf = function (cursor) {
            var cursorL = cursor[L];
            var cursorLL = cursorL && cursorL[L];
            var cursorParentParentSub = cursor.parent.parent instanceof SupSub
                ? cursor.parent.parent.sub
                : undefined;
            if (cursor.options.autoSubscriptNumerals &&
                cursor.parent !== cursorParentParentSub &&
                ((cursorL instanceof Variable && cursorL.isItalic !== false) ||
                    (cursorL instanceof SupSub &&
                        cursorLL instanceof Variable &&
                        cursorLL.isItalic !== false))) {
                new SubscriptCommand().createLeftOf(cursor);
                _super.prototype.createLeftOf.call(this, cursor);
                cursor.insRightOf(cursor.parent.parent);
            }
            else
                _super.prototype.createLeftOf.call(this, cursor);
        };
        Digit.prototype.mathspeak = function (opts) {
            if (opts && opts.createdLeftOf) {
                var cursor = opts.createdLeftOf;
                var cursorL = cursor[L];
                var cursorLL = cursorL && cursorL[L];
                var cursorParentParentSub = cursor.parent.parent instanceof SupSub
                    ? cursor.parent.parent.sub
                    : undefined;
                if (cursor.options.autoSubscriptNumerals &&
                    cursor.parent !== cursorParentParentSub &&
                    ((cursorL instanceof Variable && cursorL.isItalic !== false) ||
                        (cursor[L] instanceof SupSub &&
                            cursorLL instanceof Variable &&
                            cursorLL.isItalic !== false))) {
                    return 'Subscript ' + _super.prototype.mathspeak.call(this) + ' Baseline';
                }
            }
            return _super.prototype.mathspeak.call(this);
        };
        return Digit;
    }(DigitGroupingChar));
    var Variable = /** @class */ (function (_super) {
        __extends(Variable, _super);
        function Variable(chOrCtrlSeq, html) {
            return _super.call(this, chOrCtrlSeq, h('var', {}, [html || h.text(chOrCtrlSeq)])) || this;
        }
        Variable.prototype.text = function () {
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
        };
        Variable.prototype.mathspeak = function () {
            var text = this.ctrlSeq || '';
            if (this.isPartOfOperator ||
                text.length > 1 ||
                (this.parent && this.parent.parent && this.parent.parent.isTextBlock())) {
                return _super.prototype.mathspeak.call(this);
            }
            else {
                // Apple voices in VoiceOver (such as Alex, Bruce, and Victoria) do
                // some strange pronunciation given certain expressions,
                // e.g. "y-2" is spoken as "ee minus 2" (as if the y is short).
                // Not an ideal solution, but surrounding non-numeric text blocks with quotation marks works.
                // This bug has been acknowledged by Apple.
                return '"' + text + '"';
            }
        };
        return Variable;
    }(MQSymbol));
    function bindVariable(ch, htmlEntity, _unusedMathspeak) {
        return function () { return new Variable(ch, h.entityText(htmlEntity)); };
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
    baseOptionProcessors.quietEmptyDelimiters = function (dlms) {
        if (dlms === void 0) { dlms = ''; }
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
    var Letter = /** @class */ (function (_super) {
        __extends(Letter, _super);
        function Letter(ch) {
            var _this_1 = _super.call(this, ch) || this;
            _this_1.letter = ch;
            return _this_1;
        }
        Letter.prototype.checkAutoCmds = function (cursor) {
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
        };
        Letter.prototype.autoParenthesize = function (cursor) {
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
        };
        Letter.prototype.createLeftOf = function (cursor) {
            _super.prototype.createLeftOf.call(this, cursor);
            this.checkAutoCmds(cursor);
            this.autoParenthesize(cursor);
        };
        Letter.prototype.italicize = function (bool) {
            this.isItalic = bool;
            this.isPartOfOperator = !bool;
            this.domFrag().toggleClass('mq-operator-name', !bool);
            return this;
        };
        Letter.prototype.finalizeTree = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        Letter.prototype.siblingDeleted = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        Letter.prototype.siblingCreated = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        Letter.prototype.sharedSiblingMethod = function (opts, dir) {
            // don't auto-un-italicize if the sibling to my right changed (dir === R or
            // undefined) and it's now a Letter, it will un-italicize everyone
            if (dir !== L && this[R] instanceof Letter)
                return;
            this.autoUnItalicize(opts);
        };
        Letter.prototype.autoUnItalicize = function (opts) {
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
            var autoOpsLength = autoOps._maxLength || 0;
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
                            var lastL = last[L];
                            var lastLL = lastL && lastL[L];
                            var lastLLL = (lastLL && lastLL[L]);
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
        };
        Letter.prototype.shouldOmitPadding = function (node) {
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
        };
        return Letter;
    }(Variable));
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
        var AutoOpNames = {
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
    var OperatorName = /** @class */ (function (_super) {
        __extends(OperatorName, _super);
        function OperatorName(fn) {
            return _super.call(this, fn || '') || this;
        }
        OperatorName.prototype.createLeftOf = function (cursor) {
            var fn = this.ctrlSeq;
            for (var i = 0; i < fn.length; i += 1) {
                new Letter(fn.charAt(i)).createLeftOf(cursor);
            }
        };
        OperatorName.prototype.parser = function () {
            var fn = this.ctrlSeq;
            var block = new MathBlock();
            for (var i = 0; i < fn.length; i += 1) {
                new Letter(fn.charAt(i)).adopt(block, block.getEnd(R), 0);
            }
            return Parser.succeed(block.children());
        };
        return OperatorName;
    }(MQSymbol));
    for (var fn in Options.prototype.autoOperatorNames)
        if (Options.prototype.autoOperatorNames.hasOwnProperty(fn)) {
            LatexCmds[fn] = OperatorName;
        }
    LatexCmds.operatorname = /** @class */ (function (_super) {
        __extends(class_3, _super);
        function class_3() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_3.prototype.createLeftOf = function () { };
        class_3.prototype.numBlocks = function () {
            return 1;
        };
        class_3.prototype.parser = function () {
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
        };
        return class_3;
    }(MathCommand));
    LatexCmds.f = /** @class */ (function (_super) {
        __extends(class_4, _super);
        function class_4() {
            var _this_1 = this;
            var letter = 'f';
            _this_1 = _super.call(this, letter) || this;
            _this_1.letter = letter;
            _this_1.domView = new DOMView(0, function () {
                return h('var', { class: 'mq-f' }, [h.text('f')]);
            });
            return _this_1;
        }
        class_4.prototype.italicize = function (bool) {
            // Why is this necesssary? Does someone replace the `f` at some
            // point?
            this.domFrag().eachElement(function (el) { return (el.textContent = 'f'); });
            this.domFrag().toggleClass('mq-f', bool);
            return _super.prototype.italicize.call(this, bool);
        };
        return class_4;
    }(Letter));
    // VanillaSymbol's
    LatexCmds[' '] = LatexCmds.space = function () {
        return new DigitGroupingChar('\\ ', h('span', {}, [h.text(U_NO_BREAK_SPACE)]), ' ');
    };
    LatexCmds['.'] = function () {
        return new DigitGroupingChar('.', h('span', { class: 'mq-digit' }, [h.text('.')]), '.');
    };
    LatexCmds["'"] = LatexCmds.prime = bindVanillaSymbol("'", '&prime;', 'prime');
    LatexCmds['″'] = LatexCmds.dprime = bindVanillaSymbol('″', '&Prime;', 'double prime');
    LatexCmds.backslash = bindVanillaSymbol('\\backslash ', '\\', 'backslash');
    if (!CharCmds['\\'])
        CharCmds['\\'] = LatexCmds.backslash;
    LatexCmds.$ = bindVanillaSymbol('\\$', '$', 'dollar');
    LatexCmds.square = bindVanillaSymbol('\\square ', '\u25A1', 'square');
    LatexCmds.mid = bindVanillaSymbol('\\mid ', '\u2223', 'mid');
    // does not use Symbola font
    var NonSymbolaSymbol = /** @class */ (function (_super) {
        __extends(NonSymbolaSymbol, _super);
        function NonSymbolaSymbol(ch, html, _unusedMathspeak) {
            return _super.call(this, ch, h('span', { class: 'mq-nonSymbola' }, [html || h.text(ch)])) || this;
        }
        return NonSymbolaSymbol;
    }(MQSymbol));
    LatexCmds['@'] = function () { return new NonSymbolaSymbol('@'); };
    LatexCmds['&'] = function () {
        return new NonSymbolaSymbol('\\&', h.entityText('&amp;'), 'and');
    };
    LatexCmds['%'] = /** @class */ (function (_super) {
        __extends(class_5, _super);
        function class_5() {
            return _super.call(this, '\\%', h.text('%'), 'percent') || this;
        }
        class_5.prototype.parser = function () {
            var optWhitespace = Parser.optWhitespace;
            var string = Parser.string;
            // Parse `\%\operatorname{of}` as special `percentof` node so that
            // it will be serialized properly and deleted as a unit.
            return optWhitespace
                .then(string('\\operatorname{of}').map(function () {
                return PercentOfBuilder();
            }))
                .or(_super.prototype.parser.call(this));
        };
        return class_5;
    }(NonSymbolaSymbol));
    LatexCmds['∥'] = LatexCmds.parallel = bindVanillaSymbol('\\parallel ', '&#x2225;', 'parallel');
    LatexCmds['∦'] = LatexCmds.nparallel = bindVanillaSymbol('\\nparallel ', '&#x2226;', 'not parallel');
    LatexCmds['⟂'] = LatexCmds.perp = bindVanillaSymbol('\\perp ', '&#x27C2;', 'perpendicular');
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
                                                                            function (latex) {
                                                                                return new Variable('\\' + latex + ' ', h.entityText('&' + latex + ';'));
                                                                            };
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
    LatexCmds.pi = LatexCmds['π'] = function () {
        return new NonSymbolaSymbol('\\pi ', h.entityText('&pi;'), 'pi');
    };
    LatexCmds.lambda = function () {
        return new NonSymbolaSymbol('\\lambda ', h.entityText('&lambda;'), 'lambda');
    };
    //uppercase greek letters
    LatexCmds.Upsilon = //LaTeX
        LatexCmds.Upsi = //Elsevier and 9573-13
            LatexCmds.upsih = //W3C/Unicode "upsilon with hook"
                LatexCmds.Upsih = //'cos it makes sense to me
                    function () {
                        return new MQSymbol('\\Upsilon ', h('var', { style: 'font-family: serif' }, [h.entityText('&upsih;')]), 'capital upsilon');
                    }; //Symbola's 'upsilon with a hook' is a capital Y without hooks :(
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
                                                function (latex) {
                                                    return new VanillaSymbol('\\' + latex + ' ', h.entityText('&' + latex + ';'));
                                                };
    // symbols that aren't a single MathCommand, but are instead a whole
    // Fragment. Creates the Fragment from a LaTeX string
    var LatexFragment = /** @class */ (function (_super) {
        __extends(LatexFragment, _super);
        function LatexFragment(latex) {
            var _this_1 = _super.call(this) || this;
            _this_1.latexStr = latex;
            return _this_1;
        }
        LatexFragment.prototype.createLeftOf = function (cursor) {
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
        };
        LatexFragment.prototype.mathspeak = function () {
            if (this.mathspeakOverride) {
                return _super.prototype.mathspeak.call(this);
            }
            return latexMathParser.parse(this.latexStr).mathspeak();
        };
        LatexFragment.prototype.parser = function () {
            var frag = latexMathParser.parse(this.latexStr).children();
            return Parser.succeed(frag);
        };
        return LatexFragment;
    }(MathCommand));
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
    LatexCmds['⁰'] = function () { return new LatexFragment('^0'); };
    LatexCmds['¹'] = function () { return new LatexFragment('^1'); };
    LatexCmds['²'] = function () { return new LatexFragment('^2'); };
    LatexCmds['³'] = function () { return new LatexFragment('^3'); };
    LatexCmds['⁴'] = function () { return new LatexFragment('^4'); };
    LatexCmds['⁵'] = function () { return new LatexFragment('^5'); };
    LatexCmds['⁶'] = function () { return new LatexFragment('^6'); };
    LatexCmds['⁷'] = function () { return new LatexFragment('^7'); };
    LatexCmds['⁸'] = function () { return new LatexFragment('^8'); };
    LatexCmds['⁹'] = function () { return new LatexFragment('^9'); };
    LatexCmds['¼'] = function () { return new LatexFragment('\\frac14'); };
    LatexCmds['½'] = function () { return new LatexFragment('\\frac12'); };
    LatexCmds['¾'] = function () { return new LatexFragment('\\frac34'); };
    // this is a hack to make pasting the √ symbol
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
    // 1) pasting √ does not put focus in side the sqrt symbol
    // 2) pasting √2 puts the 2 outside of the sqrt symbol.
    //
    // The first issue seems like we could invest more time into this to
    // fix it, but doesn't feel worth special casing. I think we'd want
    // to address it by addressing ALL pasting issues.
    //
    // The second issue seems like it might go away too if you fix paste to
    // act more like simply typing the characters out. I'd be scared to try
    // to make that change because I'm fairly confident I'd break something
    // around handling valid latex as latex rather than treating it as keystrokes.
    LatexCmds['√'] = function () { return new LatexFragment('\\sqrt{}'); };
    // Binary operator determination is used in several contexts for PlusMinus nodes and their descendants.
    // For instance, we set the item's class name based on this factor, and also assign different mathspeak values (plus vs positive, negative vs minus).
    function isBinaryOperator(node) {
        if (!node)
            return false;
        var nodeL = node[L];
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
    var PlusMinus = /** @class */ (function (_super) {
        __extends(class_6, _super);
        function class_6(ch, html, mathspeak) {
            return _super.call(this, ch, html, undefined, mathspeak, true) || this;
        }
        class_6.prototype.contactWeld = function (cursor, dir) {
            this.sharedSiblingMethod(cursor.options, dir);
        };
        class_6.prototype.siblingCreated = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        class_6.prototype.siblingDeleted = function (opts, dir) {
            this.sharedSiblingMethod(opts, dir);
        };
        class_6.prototype.sharedSiblingMethod = function (_opts, dir) {
            if (dir === R)
                return; // ignore if sibling only changed on the right
            this.domFrag().oneElement().className = isBinaryOperator(this)
                ? 'mq-binary-operator'
                : '';
            return this;
        };
        return class_6;
    }(BinaryOperator));
    LatexCmds['+'] = /** @class */ (function (_super) {
        __extends(class_7, _super);
        function class_7() {
            return _super.call(this, '+', h.text('+')) || this;
        }
        class_7.prototype.mathspeak = function () {
            return isBinaryOperator(this) ? 'plus' : 'positive';
        };
        return class_7;
    }(PlusMinus));
    //yes, these are different dashes, en-dash, em-dash, unicode minus, actual dash
    var MinusNode = /** @class */ (function (_super) {
        __extends(MinusNode, _super);
        function MinusNode() {
            return _super.call(this, '-', h.entityText('&minus;')) || this;
        }
        MinusNode.prototype.mathspeak = function () {
            return isBinaryOperator(this) ? 'minus' : 'negative';
        };
        return MinusNode;
    }(PlusMinus));
    LatexCmds['−'] = LatexCmds['—'] = LatexCmds['–'] = LatexCmds['-'] = MinusNode;
    LatexCmds['±'] =
        LatexCmds.pm =
            LatexCmds.plusmn =
                LatexCmds.plusminus =
                    function () { return new PlusMinus('\\pm ', h.entityText('&plusmn;'), 'plus-or-minus'); };
    LatexCmds.mp =
        LatexCmds.mnplus =
            LatexCmds.minusplus =
                function () { return new PlusMinus('\\mp ', h.entityText('&#8723;'), 'minus-or-plus'); };
    CharCmds['*'] =
        LatexCmds.sdot =
            LatexCmds.cdot =
                bindBinaryOperator('\\cdot ', '&middot;', '*', 'times'); //semantically should be &sdot;, but &middot; looks better
    var To = /** @class */ (function (_super) {
        __extends(To, _super);
        function To() {
            return _super.call(this, '\\to ', h.entityText('&rarr;'), 'to') || this;
        }
        To.prototype.deleteTowards = function (dir, cursor) {
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
            _super.prototype.deleteTowards.call(this, dir, cursor);
        };
        return To;
    }(BinaryOperator));
    LatexCmds['→'] = LatexCmds.to = To;
    var Inequality = /** @class */ (function (_super) {
        __extends(Inequality, _super);
        function Inequality(data, strict) {
            var _this_1 = this;
            var strictness = strict ? 'Strict' : '';
            _this_1 = _super.call(this, data["ctrlSeq".concat(strictness)], h.entityText(data["htmlEntity".concat(strictness)]), data["text".concat(strictness)], data["mathspeak".concat(strictness)]) || this;
            _this_1.data = data;
            _this_1.strict = strict;
            return _this_1;
        }
        Inequality.prototype.swap = function (strict) {
            this.strict = strict;
            var strictness = strict ? 'Strict' : '';
            this.ctrlSeq = this.data["ctrlSeq".concat(strictness)];
            this.domFrag()
                .children()
                .replaceWith(domFrag(h.entityText(this.data["htmlEntity".concat(strictness)])));
            this.textTemplate = [this.data["text".concat(strictness)]];
            this.mathspeakName = this.data["mathspeak".concat(strictness)];
        };
        Inequality.prototype.deleteTowards = function (dir, cursor) {
            if (dir === L && !this.strict) {
                this.swap(true);
                this.bubble(function (node) {
                    node.reflow();
                    return undefined;
                });
                return;
            }
            _super.prototype.deleteTowards.call(this, dir, cursor);
        };
        return Inequality;
    }(BinaryOperator));
    var less = {
        ctrlSeq: '\\le ',
        htmlEntity: '&le;',
        text: '≤',
        mathspeak: 'less than or equal to',
        ctrlSeqStrict: '<',
        htmlEntityStrict: '&lt;',
        textStrict: '<',
        mathspeakStrict: 'less than',
    };
    var greater = {
        ctrlSeq: '\\ge ',
        htmlEntity: '&ge;',
        text: '≥',
        mathspeak: 'greater than or equal to',
        ctrlSeqStrict: '>',
        htmlEntityStrict: '&gt;',
        textStrict: '>',
        mathspeakStrict: 'greater than',
    };
    var Greater = /** @class */ (function (_super) {
        __extends(Greater, _super);
        function Greater() {
            return _super.call(this, greater, true) || this;
        }
        Greater.prototype.createLeftOf = function (cursor) {
            var cursorL = cursor[L];
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
            _super.prototype.createLeftOf.call(this, cursor);
        };
        return Greater;
    }(Inequality));
    LatexCmds['<'] = LatexCmds.lt = function () { return new Inequality(less, true); };
    LatexCmds['>'] = LatexCmds.gt = Greater;
    LatexCmds['≤'] =
        LatexCmds.le =
            LatexCmds.leq =
                function () { return new Inequality(less, false); };
    LatexCmds['≥'] =
        LatexCmds.ge =
            LatexCmds.geq =
                function () { return new Inequality(greater, false); };
    LatexCmds.infty =
        LatexCmds.infin =
            LatexCmds.infinity =
                bindVanillaSymbol('\\infty ', '&infin;', 'infinity');
    LatexCmds['≠'] =
        LatexCmds.ne =
            LatexCmds.neq =
                bindBinaryOperator('\\ne ', '&ne;', 'not equal');
    var Equality = /** @class */ (function (_super) {
        __extends(Equality, _super);
        function Equality() {
            return _super.call(this, '=', h.text('='), '=', 'equals') || this;
        }
        Equality.prototype.createLeftOf = function (cursor) {
            var cursorL = cursor[L];
            if (cursorL instanceof Inequality && cursorL.strict) {
                cursorL.swap(false);
                cursorL.bubble(function (node) {
                    node.reflow();
                    return undefined;
                });
                return;
            }
            _super.prototype.createLeftOf.call(this, cursor);
        };
        return Equality;
    }(BinaryOperator));
    LatexCmds['='] = Equality;
    LatexCmds['×'] =
        LatexCmds.times =
            LatexCmds.cross =
                bindBinaryOperator('\\times ', '&times;', '[x]', 'times');
    LatexCmds['÷'] =
        LatexCmds.div =
            LatexCmds.divide =
                LatexCmds.divides =
                    bindBinaryOperator('\\div ', '&divide;', '[/]', 'over');
    var Sim = /** @class */ (function (_super) {
        __extends(Sim, _super);
        function Sim() {
            return _super.call(this, '\\sim ', h.text('~'), '~', 'tilde') || this;
        }
        Sim.prototype.createLeftOf = function (cursor) {
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
            _super.prototype.createLeftOf.call(this, cursor);
        };
        return Sim;
    }(BinaryOperator));
    var Approx = /** @class */ (function (_super) {
        __extends(Approx, _super);
        function Approx() {
            return _super.call(this, '\\approx ', h.entityText('&approx;'), '≈', 'approximately equal') || this;
        }
        Approx.prototype.deleteTowards = function (dir, cursor) {
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
            _super.prototype.deleteTowards.call(this, dir, cursor);
        };
        return Approx;
    }(BinaryOperator));
    LatexCmds.tildeNbsp = bindVanillaSymbol('~', U_NO_BREAK_SPACE, ' ');
    LatexCmds.sim = Sim;
    LatexCmds['≈'] = LatexCmds.approx = Approx;
    // When interpreting raw LaTeX, we can either evaluate the tilde as its standard nonbreaking space
    // or transform it to the \sim operator depending on whether the "interpretTildeAsSim" configuration option is set.
    // Tilde symbols input from a keyboard will always be transformed to \sim.
    CharCmds['~'] = LatexCmds.sim;
    LatexCmds['~'] = LatexCmds.tildeNbsp;
    baseOptionProcessors.interpretTildeAsSim = function (val) {
        var interpretAsSim = !!val;
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
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 32 54' }, [
                    h('path', {
                        d: 'M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33',
                    }),
                ]);
            },
        },
        '|': {
            width: '.4em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
                    h('path', { d: 'M4.4 0 L4.4 54 L5.6 54 L5.6 0' }),
                ]);
            },
        },
        '[': {
            width: '.55em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
                    h('path', { d: 'M8 0 L3 0 L3 24 L8 24 L8 23 L4 23 L4 1 L8 1' }),
                ]);
            },
        },
        ']': {
            width: '.55em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 11 24' }, [
                    h('path', { d: 'M3 0 L8 0 L8 24 L3 24 L3 23 L7 23 L7 1 L3 1' }),
                ]);
            },
        },
        '(': {
            width: '.55em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
                    h('path', {
                        d: 'M85 0 A61 101 0 0 0 85 186 L75 186 A75 101 0 0 1 75 0',
                    }),
                ]);
            },
        },
        ')': {
            width: '.55em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '3 0 106 186' }, [
                    h('path', {
                        d: 'M24 0 A61 101 0 0 1 24 186 L34 186 A75 101 0 0 0 34 0',
                    }),
                ]);
            },
        },
        '{': {
            width: '.7em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
                    h('path', {
                        d: 'M170 0 L170 6 A47 52 0 0 0 123 60 L123 127 A35 48 0 0 1 88 175 A35 48 0 0 1 123 223 L123 290 A47 52 0 0 0 170 344 L170 350 L160 350 A58 49 0 0 1 102 301 L103 220 A45 40 0 0 0 58 180 L58 170 A45 40 0 0 0 103 130 L103 49 A58 49 0 0 1 161 0',
                    }),
                ]);
            },
        },
        '}': {
            width: '.7em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '10 0 210 350' }, [
                    h('path', {
                        d: 'M60 0 L60 6 A47 52 0 0 1 107 60 L107 127 A35 48 0 0 0 142 175 A35 48 0 0 0 107 223 L107 290 A47 52 0 0 1 60 344 L60 350 L70 350 A58 49 0 0 0 128 301 L127 220 A45 40 0 0 1 172 180 L172 170 A45 40 0 0 1 127 130 L127 49 A58 49 0 0 0 70 0',
                    }),
                ]);
            },
        },
        '&#8741;': {
            width: '.7em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
                    h('path', { d: 'M3.2 0 L3.2 54 L4 54 L4 0 M6.8 0 L6.8 54 L6 54 L6 0' }),
                ]);
            },
        },
        '&lang;': {
            width: '.55em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
                    h('path', { d: 'M6.8 0 L3.2 27 L6.8 54 L7.8 54 L4.2 27 L7.8 0' }),
                ]);
            },
        },
        '&rang;': {
            width: '.55em',
            html: function () {
                return h('svg', { preserveAspectRatio: 'none', viewBox: '0 0 10 54' }, [
                    h('path', { d: 'M3.2 0 L6.8 27 L3.2 54 L2.2 54 L5.8 27 L2.2 0' }),
                ]);
            },
        },
    };
    var Style = /** @class */ (function (_super) {
        __extends(Style, _super);
        function Style(ctrlSeq, tagName, attrs, ariaLabel, opts) {
            var _this_1 = _super.call(this, ctrlSeq, new DOMView(1, function (blocks) { return h.block(tagName, attrs, blocks[0]); })) || this;
            _this_1.ariaLabel = ariaLabel || ctrlSeq.replace(/^\\/, '');
            _this_1.mathspeakTemplate = [
                'Start' + _this_1.ariaLabel + ',',
                'End' + _this_1.ariaLabel,
            ];
            // In most cases, mathspeak should announce the start and end of style blocks.
            // There is one exception currently (mathrm).
            _this_1.shouldNotSpeakDelimiters = opts && opts.shouldNotSpeakDelimiters;
            return _this_1;
        }
        Style.prototype.mathspeak = function (opts) {
            if (!this.shouldNotSpeakDelimiters || (opts && opts.ignoreShorthand)) {
                return _super.prototype.mathspeak.call(this);
            }
            return this.foldChildren('', function (speech, block) {
                return speech + ' ' + block.mathspeak(opts);
            }).trim();
        };
        return Style;
    }(MathCommand));
    //fonts
    LatexCmds.mathrm = /** @class */ (function (_super) {
        __extends(mathrm, _super);
        function mathrm() {
            return _super.call(this, '\\mathrm', 'span', { class: 'mq-roman mq-font' }, 'Roman Font', {
                shouldNotSpeakDelimiters: true,
            }) || this;
        }
        mathrm.prototype.isTextBlock = function () {
            return true;
        };
        return mathrm;
    }(Style));
    LatexCmds.mathit = function () {
        return new Style('\\mathit', 'i', { class: 'mq-font' }, 'Italic Font');
    };
    LatexCmds.mathbf = function () {
        return new Style('\\mathbf', 'b', { class: 'mq-font' }, 'Bold Font');
    };
    LatexCmds.mathsf = function () {
        return new Style('\\mathsf', 'span', { class: 'mq-sans-serif mq-font' }, 'Serif Font');
    };
    LatexCmds.mathtt = function () {
        return new Style('\\mathtt', 'span', { class: 'mq-monospace mq-font' }, 'Math Text');
    };
    //text-decoration
    LatexCmds.underline = function () {
        return new Style('\\underline', 'span', { class: 'mq-non-leaf mq-underline' }, 'Underline');
    };
    LatexCmds.overline = LatexCmds.bar = function () {
        return new Style('\\overline', 'span', { class: 'mq-non-leaf mq-overline' }, 'Overline');
    };
    LatexCmds.overrightarrow = function () {
        return new Style('\\overrightarrow', 'span', { class: 'mq-non-leaf mq-overarrow mq-arrow-right' }, 'Over Right Arrow');
    };
    LatexCmds.overleftarrow = function () {
        return new Style('\\overleftarrow', 'span', { class: 'mq-non-leaf mq-overarrow mq-arrow-left' }, 'Over Left Arrow');
    };
    LatexCmds.overleftrightarrow = function () {
        return new Style('\\overleftrightarrow ', 'span', { class: 'mq-non-leaf mq-overarrow mq-arrow-leftright' }, 'Over Left and Right Arrow');
    };
    LatexCmds.overarc = function () {
        return new Style('\\overarc', 'span', { class: 'mq-non-leaf mq-overarc' }, 'Over Arc');
    };
    LatexCmds.dot = function () {
        return new MathCommand('\\dot', new DOMView(1, function (blocks) {
            return h('span', { class: 'mq-non-leaf' }, [
                h('span', { class: 'mq-dot-recurring-inner' }, [
                    h('span', { class: 'mq-dot-recurring' }, [h.text(U_DOT_ABOVE)]),
                    h.block('span', { class: 'mq-empty-box' }, blocks[0]),
                ]),
            ]);
        }));
    };
    // `\textcolor{color}{math}` will apply a color to the given math content, where
    // `color` is any valid CSS Color Value (see [SitePoint docs][] (recommended),
    // [Mozilla docs][], or [W3C spec][]).
    //
    // [SitePoint docs]: http://reference.sitepoint.com/css/colorvalues
    // [Mozilla docs]: https://developer.mozilla.org/en-US/docs/CSS/color_value#Values
    // [W3C spec]: http://dev.w3.org/csswg/css3-color/#colorunits
    LatexCmds.textcolor = /** @class */ (function (_super) {
        __extends(class_8, _super);
        function class_8() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_8.prototype.setColor = function (color) {
            this.color = color;
            this.domView = new DOMView(1, function (blocks) {
                return h.block('span', { class: 'mq-textcolor', style: 'color:' + color }, blocks[0]);
            });
            this.ariaLabel = color.replace(/^\\/, '');
            this.mathspeakTemplate = [
                'Start ' + this.ariaLabel + ',',
                'End ' + this.ariaLabel,
            ];
        };
        class_8.prototype.latexRecursive = function (ctx) {
            var _c;
            this.checkCursorContextOpen(ctx);
            var blocks0 = this.blocks[0];
            ctx.latex += '\\textcolor{' + this.color + '}{';
            (_c = blocks0.latexRecursive) === null || _c === void 0 ? void 0 : _c.call(blocks0, ctx);
            ctx.latex += '}';
            this.checkCursorContextClose(ctx);
        };
        class_8.prototype.parser = function () {
            var _this_1 = this;
            var optWhitespace = Parser.optWhitespace;
            var string = Parser.string;
            var regex = Parser.regex;
            return optWhitespace
                .then(string('{'))
                .then(regex(/^[#\w\s.,()%-]*/))
                .skip(string('}'))
                .then(function (color) {
                _this_1.setColor(color);
                return _super.prototype.parser.call(_this_1);
            });
        };
        class_8.prototype.isStyleBlock = function () {
            return true;
        };
        return class_8;
    }(MathCommand));
    // Very similar to the \textcolor command, but will add the given CSS class.
    // Usage: \class{classname}{math}
    // Note regex that whitelists valid CSS classname characters:
    // https://github.com/mathquill/mathquill/pull/191#discussion_r4327442
    var Class = (LatexCmds['class'] = /** @class */ (function (_super) {
        __extends(class_9, _super);
        function class_9() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_9.prototype.parser = function () {
            var _this_1 = this;
            var string = Parser.string, regex = Parser.regex;
            return Parser.optWhitespace
                .then(string('{'))
                .then(regex(/^[-\w\s\\\xA0-\xFF]*/))
                .skip(string('}'))
                .then(function (cls) {
                _this_1.cls = cls || '';
                _this_1.domView = new DOMView(1, function (blocks) {
                    return h.block('span', { class: "mq-class ".concat(cls) }, blocks[0]);
                });
                _this_1.ariaLabel = cls + ' class';
                _this_1.mathspeakTemplate = [
                    'Start ' + _this_1.ariaLabel + ',',
                    'End ' + _this_1.ariaLabel,
                ];
                return _super.prototype.parser.call(_this_1);
            });
        };
        class_9.prototype.latexRecursive = function (ctx) {
            var _c;
            this.checkCursorContextOpen(ctx);
            var blocks0 = this.blocks[0];
            ctx.latex += '\\class{' + this.cls + '}{';
            (_c = blocks0.latexRecursive) === null || _c === void 0 ? void 0 : _c.call(blocks0, ctx);
            ctx.latex += '}';
            this.checkCursorContextClose(ctx);
        };
        class_9.prototype.isStyleBlock = function () {
            return true;
        };
        return class_9;
    }(MathCommand)));
    // This test is used to determine whether an item may be treated as a whole number
    // for shortening the verbalized (mathspeak) forms of some fractions and superscripts.
    var intRgx = /^[\+\-]?[\d]+$/;
    // Traverses the top level of the passed block's children and returns the concatenation of their ctrlSeq properties.
    // Used in shortened mathspeak computations as a block's .text() method can be potentially expensive.
    //
    function getCtrlSeqsFromBlock(block) {
        if (!block)
            return '';
        var chars = '';
        block.eachChild(function (child) {
            if (child.ctrlSeq !== undefined)
                chars += child.ctrlSeq;
        });
        return chars;
    }
    Options.prototype.charsThatBreakOutOfSupSub = '';
    var SupSub = /** @class */ (function (_super) {
        __extends(SupSub, _super);
        function SupSub() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '_{...}^{...}';
            return _this_1;
        }
        SupSub.prototype.setEnds = function (ends) {
            pray('SupSub ends must be MathBlocks', ends[L] instanceof MathBlock && ends[R] instanceof MathBlock);
            this.ends = ends;
        };
        SupSub.prototype.getEnd = function (dir) {
            return this.ends[dir];
        };
        SupSub.prototype.createLeftOf = function (cursor) {
            if (!this.replacedFragment &&
                !cursor[L] &&
                cursor.options.supSubsRequireOperand)
                return;
            return _super.prototype.createLeftOf.call(this, cursor);
        };
        SupSub.prototype.contactWeld = function (cursor) {
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
                var thisDir = this[dir];
                var pt = void 0;
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
        };
        SupSub.prototype.finalizeTree = function () {
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
                        .queueTranslatableString('Baseline')
                        .alert(cmd.mathspeak({ createdLeftOf: cursor }));
                    return;
                }
                if (cursor[L] &&
                    !cursor[R] &&
                    !cursor.selection &&
                    cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1) {
                    cursor.insRightOf(this.parent);
                    cursor.controller.aria.queueTranslatableString('Baseline');
                }
                MathBlock.prototype.write.call(this, cursor, ch);
            };
        };
        SupSub.prototype.moveTowards = function (dir, cursor, updown) {
            if (cursor.options.autoSubscriptNumerals && !this.sup) {
                cursor.insDirOf(dir, this);
            }
            else
                _super.prototype.moveTowards.call(this, dir, cursor, updown);
        };
        SupSub.prototype.deleteTowards = function (dir, cursor) {
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
                _super.prototype.deleteTowards.call(this, dir, cursor);
        };
        SupSub.prototype.latexRecursive = function (ctx) {
            var _c, _d, _e, _f;
            this.checkCursorContextOpen(ctx);
            if (this.sub) {
                ctx.latex += '_{';
                var beforeLength = ctx.latex.length;
                (_d = (_c = this.sub).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
                var afterLength = ctx.latex.length;
                if (beforeLength === afterLength) {
                    // nothing was written. so we write a space
                    ctx.latex += ' ';
                }
                ctx.latex += '}';
            }
            if (this.sup) {
                ctx.latex += '^{';
                var beforeLength = ctx.latex.length;
                (_f = (_e = this.sup).latexRecursive) === null || _f === void 0 ? void 0 : _f.call(_e, ctx);
                var afterLength = ctx.latex.length;
                if (beforeLength === afterLength) {
                    // nothing was written. so we write a space
                    ctx.latex += ' ';
                }
                ctx.latex += '}';
            }
            this.checkCursorContextClose(ctx);
        };
        SupSub.prototype.text = function () {
            function text(prefix, block) {
                var l = (block && block.text()) || '';
                return block
                    ? prefix + (l.length === 1 ? l : '(' + (l || ' ') + ')')
                    : '';
            }
            return text('_', this.sub) + text('^', this.sup);
        };
        SupSub.prototype.addBlock = function (block) {
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
                    var cmdSubSub = cmd[supsub];
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
                        delete cmd["".concat(updown, "Into")];
                        var cmdOppositeSupsub = cmd[oppositeSupsub];
                        cmdOppositeSupsub["".concat(updown, "OutOf")] = insLeftOfMeUnlessAtEnd;
                        delete cmdOppositeSupsub.deleteOutOf; // TODO - refactor so this method can be optional
                        if (supsub === 'sub') {
                            cmd.domFrag().addClass('mq-sup-only').children().last().remove();
                        }
                        this.remove();
                    };
                })(this, 'sub sup'.split(' ')[i], 'sup sub'.split(' ')[i], 'down up'.split(' ')[i]);
        };
        return SupSub;
    }(MathCommand));
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
    var SubscriptCommand = /** @class */ (function (_super) {
        __extends(SubscriptCommand, _super);
        function SubscriptCommand() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.supsub = 'sub';
            _this_1.domView = new DOMView(1, function (blocks) {
                return h('span', { class: 'mq-supsub mq-non-leaf' }, [
                    h.block('span', { class: 'mq-sub' }, blocks[0]),
                    h('span', { style: 'display:inline-block;width:0' }, [
                        h.text(U_ZERO_WIDTH_SPACE),
                    ]),
                ]);
            });
            _this_1.textTemplate = ['_'];
            _this_1.mathspeakTemplate = ['Subscript,', ', Baseline'];
            _this_1.ariaLabel = 'subscript';
            return _this_1;
        }
        SubscriptCommand.prototype.finalizeTree = function () {
            this.downInto = this.sub = this.getEnd(L);
            this.sub.upOutOf = insLeftOfMeUnlessAtEnd;
            _super.prototype.finalizeTree.call(this);
        };
        return SubscriptCommand;
    }(SupSub));
    LatexCmds.subscript = LatexCmds._ = SubscriptCommand;
    LatexCmds.superscript =
        LatexCmds.supscript =
            LatexCmds['^'] = /** @class */ (function (_super) {
                __extends(SuperscriptCommand, _super);
                function SuperscriptCommand() {
                    var _this_1 = _super !== null && _super.apply(this, arguments) || this;
                    _this_1.supsub = 'sup';
                    _this_1.domView = new DOMView(1, function (blocks) {
                        return h('span', { class: 'mq-supsub mq-non-leaf mq-sup-only' }, [
                            h.block('span', { class: 'mq-sup' }, blocks[0]),
                        ]);
                    });
                    _this_1.textTemplate = ['^(', ')'];
                    _this_1.ariaLabel = 'superscript';
                    _this_1.mathspeakTemplate = ['Superscript,', ', Baseline'];
                    return _this_1;
                }
                SuperscriptCommand.prototype.mathspeak = function (opts) {
                    if (this.mathspeakOverride) {
                        return _super.prototype.mathspeak.call(this);
                    }
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
                    return _super.prototype.mathspeak.call(this);
                };
                SuperscriptCommand.prototype.finalizeTree = function () {
                    this.upInto = this.sup = this.getEnd(R);
                    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
                    _super.prototype.finalizeTree.call(this);
                };
                return SuperscriptCommand;
            }(SupSub));
    var SummationNotation = /** @class */ (function (_super) {
        __extends(SummationNotation, _super);
        function SummationNotation(ch, symbol, ariaLabel) {
            var _this_1 = _super.call(this) || this;
            _this_1.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
            var domView = new DOMView(2, function (blocks) {
                return h('span', { class: 'mq-large-operator mq-non-leaf' }, [
                    h('span', { class: 'mq-to' }, [h.block('span', {}, blocks[1])]),
                    h('big', {}, [h.text(symbol)]),
                    h('span', { class: 'mq-from' }, [h.block('span', {}, blocks[0])]),
                ]);
            });
            MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(_this_1, ch, domView);
            return _this_1;
        }
        SummationNotation.prototype.createLeftOf = function (cursor) {
            _super.prototype.createLeftOf.call(this, cursor);
            if (cursor.options.sumStartsWithNEquals) {
                new Letter('n').createLeftOf(cursor);
                new Equality().createLeftOf(cursor);
            }
        };
        SummationNotation.prototype.latexRecursive = function (ctx) {
            var _c, _d, _e, _f;
            this.checkCursorContextOpen(ctx);
            ctx.latex += this.ctrlSeq + '_{';
            var beforeLength = ctx.latex.length;
            (_d = (_c = this.getEnd(L)).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
            var afterLength = ctx.latex.length;
            if (afterLength === beforeLength) {
                // nothing was written so we write a space
                ctx.latex += ' ';
            }
            ctx.latex += '}^{';
            beforeLength = ctx.latex.length;
            (_f = (_e = this.getEnd(R)).latexRecursive) === null || _f === void 0 ? void 0 : _f.call(_e, ctx);
            afterLength = ctx.latex.length;
            if (beforeLength === afterLength) {
                // nothing was written so we write a space
                ctx.latex += ' ';
            }
            ctx.latex += '}';
            this.checkCursorContextClose(ctx);
        };
        SummationNotation.prototype.mathspeak = function () {
            if (this.mathspeakOverride) {
                return _super.prototype.mathspeak.call(this);
            }
            return ('Start ' +
                this.ariaLabel +
                ' from ' +
                this.getEnd(L).mathspeak() +
                ' to ' +
                this.getEnd(R).mathspeak() +
                ', end ' +
                this.ariaLabel +
                ', ');
        };
        SummationNotation.prototype.parser = function () {
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
        };
        SummationNotation.prototype.finalizeTree = function () {
            var endsL = this.getEnd(L);
            var endsR = this.getEnd(R);
            endsL.ariaLabel = 'lower bound';
            endsR.ariaLabel = 'upper bound';
            this.downInto = endsL;
            this.upInto = endsR;
            endsL.upOutOf = endsR;
            endsR.downOutOf = endsL;
        };
        return SummationNotation;
    }(MathCommand));
    LatexCmds['∑'] =
        LatexCmds.sum =
            LatexCmds.summation =
                function () { return new SummationNotation('\\sum ', U_NARY_SUMMATION, 'sum'); };
    LatexCmds['∏'] =
        LatexCmds.prod =
            LatexCmds.product =
                function () { return new SummationNotation('\\prod ', U_NARY_PRODUCT, 'product'); };
    LatexCmds.coprod = LatexCmds.coproduct = function () {
        return new SummationNotation('\\coprod ', U_NARY_COPRODUCT, 'co product');
    };
    LatexCmds['∫'] =
        LatexCmds['int'] =
            LatexCmds.integral = /** @class */ (function (_super) {
                __extends(class_10, _super);
                function class_10() {
                    var _this_1 = _super.call(this, '\\int ', '', 'integral') || this;
                    _this_1.ariaLabel = 'integral';
                    _this_1.domView = new DOMView(2, function (blocks) {
                        return h('span', { class: 'mq-int mq-non-leaf' }, [
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
                        ]);
                    });
                    return _this_1;
                }
                class_10.prototype.createLeftOf = function (cursor) {
                    // FIXME: refactor rather than overriding
                    MathCommand.prototype.createLeftOf.call(this, cursor);
                };
                return class_10;
            }(SummationNotation));
    var Fraction = (LatexCmds.frac =
        LatexCmds.dfrac =
            LatexCmds.cfrac =
                LatexCmds.fraction = /** @class */ (function (_super) {
                    __extends(FracNode, _super);
                    function FracNode() {
                        var _this_1 = _super !== null && _super.apply(this, arguments) || this;
                        _this_1.ctrlSeq = '\\frac';
                        _this_1.domView = new DOMView(2, function (blocks) {
                            return h('span', { class: 'mq-fraction mq-non-leaf' }, [
                                h.block('span', { class: 'mq-numerator' }, blocks[0]),
                                h.block('span', { class: 'mq-denominator' }, blocks[1]),
                                h('span', { style: 'display:inline-block;width:0' }, [
                                    h.text(U_ZERO_WIDTH_SPACE),
                                ]),
                            ]);
                        });
                        _this_1.textTemplate = ['(', ')/(', ')'];
                        return _this_1;
                    }
                    FracNode.prototype.finalizeTree = function () {
                        var endsL = this.getEnd(L);
                        var endsR = this.getEnd(R);
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
                    };
                    FracNode.prototype.mathspeak = function (opts) {
                        if (opts && opts.createdLeftOf) {
                            var cursor = opts.createdLeftOf;
                            return cursor.parent.mathspeak();
                        }
                        if (this.mathspeakOverride) {
                            return _super.prototype.mathspeak.call(this);
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
                        return _super.prototype.mathspeak.call(this);
                    };
                    FracNode.prototype.getFracDepth = function () {
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
                    };
                    return FracNode;
                }(MathCommand)));
    var LiveFraction = (LatexCmds.over =
        CharCmds['/'] = /** @class */ (function (_super) {
            __extends(class_11, _super);
            function class_11() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_11.prototype.createLeftOf = function (cursor) {
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
                        var leftwardR = leftward[R];
                        if (leftwardR instanceof SupSub &&
                            leftwardR.ctrlSeq != leftward.ctrlSeq)
                            leftward = leftward[R];
                    }
                    if (leftward !== cursor[L] && !cursor.isTooDeep(1)) {
                        var leftwardR = leftward[R];
                        var cursorL = cursor[L];
                        this.replaces(new Fragment(leftwardR || cursor.parent.getEnd(L), cursorL));
                        cursor[L] = leftward;
                    }
                }
                _super.prototype.createLeftOf.call(this, cursor);
            };
            return class_11;
        }(Fraction)));
    var AnsBuilder = function () {
        return new MQSymbol('\\operatorname{ans}', h('span', { class: 'mq-ans' }, [h.text('ans')]), 'ans');
    };
    LatexCmds.ans = AnsBuilder;
    var PercentOfBuilder = function () {
        return new MQSymbol('\\%\\operatorname{of}', h('span', { class: 'mq-nonSymbola mq-operator-name' }, [h.text('% of ')]), 'percent of');
    };
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
    var Token = /** @class */ (function (_super) {
        __extends(Token, _super);
        function Token() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.tokenId = '';
            _this_1.ctrlSeq = '\\token';
            _this_1.textTemplate = ['token(', ')'];
            _this_1.mathspeakTemplate = ['StartToken,', ', EndToken'];
            _this_1.ariaLabel = 'token';
            return _this_1;
        }
        Token.prototype.html = function () {
            var out = h('span', {
                class: 'mq-token mq-ignore-mousedown',
                'data-mq-token': this.tokenId,
            });
            this.setDOM(out);
            NodeBase.linkElementByCmdNode(out, this);
            return out;
        };
        Token.prototype.latexRecursive = function (ctx) {
            this.checkCursorContextOpen(ctx);
            ctx.latex += '\\token{' + this.tokenId + '}';
            this.checkCursorContextClose(ctx);
        };
        Token.prototype.mathspeak = function () {
            if (this.mathspeakOverride) {
                return _super.prototype.mathspeak.call(this);
            }
            // If the caller responsible for creating this token has set an aria-label attribute for the inner children, use them in the mathspeak calculation.
            var ariaLabelArray = [];
            this.domFrag()
                .children()
                .eachElement(function (el) {
                var label = el.getAttribute('aria-label');
                if (typeof label === 'string' && label !== '')
                    ariaLabelArray.push(label);
            });
            return ariaLabelArray.length > 0
                ? ariaLabelArray.join(' ').trim()
                : 'token ' + this.tokenId;
        };
        Token.prototype.parser = function () {
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
        };
        return Token;
    }(MQSymbol));
    LatexCmds.token = Token;
    var SquareRoot = /** @class */ (function (_super) {
        __extends(SquareRoot, _super);
        function SquareRoot() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '\\sqrt';
            _this_1.domView = new DOMView(1, function (blocks) {
                return h('span', { class: 'mq-non-leaf mq-sqrt-container' }, [
                    h('span', { class: 'mq-scaled mq-sqrt-prefix' }, [
                        SVG_SYMBOLS.sqrt.html(),
                    ]),
                    h.block('span', { class: 'mq-non-leaf mq-sqrt-stem' }, blocks[0]),
                ]);
            });
            _this_1.textTemplate = ['sqrt(', ')'];
            _this_1.mathspeakTemplate = ['StartRoot,', ', EndRoot'];
            _this_1.ariaLabel = 'root';
            return _this_1;
        }
        SquareRoot.prototype.parser = function () {
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
                .or(_super.prototype.parser.call(this));
        };
        return SquareRoot;
    }(MathCommand));
    LatexCmds.sqrt = SquareRoot;
    LatexCmds.hat = /** @class */ (function (_super) {
        __extends(Hat, _super);
        function Hat() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '\\hat';
            _this_1.domView = new DOMView(1, function (blocks) {
                return h('span', { class: 'mq-non-leaf' }, [
                    h('span', { class: 'mq-hat-prefix' }, [h.text('^')]),
                    h.block('span', { class: 'mq-hat-stem' }, blocks[0]),
                ]);
            });
            _this_1.textTemplate = ['hat(', ')'];
            return _this_1;
        }
        return Hat;
    }(MathCommand));
    var NthRoot = /** @class */ (function (_super) {
        __extends(NthRoot, _super);
        function NthRoot() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.domView = new DOMView(2, function (blocks) {
                return h('span', { class: 'mq-nthroot-container mq-non-leaf' }, [
                    h.block('sup', { class: 'mq-nthroot mq-non-leaf' }, blocks[0]),
                    h('span', { class: 'mq-scaled mq-sqrt-container' }, [
                        h('span', { class: 'mq-sqrt-prefix mq-scaled' }, [
                            SVG_SYMBOLS.sqrt.html(),
                        ]),
                        h.block('span', { class: 'mq-sqrt-stem mq-non-leaf' }, blocks[1]),
                    ]),
                ]);
            });
            _this_1.textTemplate = ['sqrt[', '](', ')'];
            return _this_1;
        }
        NthRoot.prototype.latexRecursive = function (ctx) {
            var _c, _d, _e, _f;
            this.checkCursorContextOpen(ctx);
            ctx.latex += '\\sqrt[';
            (_d = (_c = this.getEnd(L)).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
            ctx.latex += ']{';
            (_f = (_e = this.getEnd(R)).latexRecursive) === null || _f === void 0 ? void 0 : _f.call(_e, ctx);
            ctx.latex += '}';
            this.checkCursorContextClose(ctx);
        };
        NthRoot.prototype.mathspeak = function () {
            if (this.mathspeakOverride) {
                return _super.prototype.mathspeak.call(this);
            }
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
        };
        return NthRoot;
    }(SquareRoot));
    LatexCmds.nthroot = NthRoot;
    LatexCmds.cbrt = /** @class */ (function (_super) {
        __extends(class_12, _super);
        function class_12() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_12.prototype.createLeftOf = function (cursor) {
            _super.prototype.createLeftOf.call(this, cursor);
            new Digit('3').createLeftOf(cursor);
            cursor.controller.moveRight();
        };
        return class_12;
    }(NthRoot));
    var DiacriticAbove = /** @class */ (function (_super) {
        __extends(DiacriticAbove, _super);
        function DiacriticAbove(ctrlSeq, html, textTemplate) {
            var _this_1 = this;
            var domView = new DOMView(1, function (blocks) {
                return h('span', { class: 'mq-non-leaf' }, [
                    h('span', { class: 'mq-diacritic-above' }, [html]),
                    h.block('span', { class: 'mq-diacritic-stem' }, blocks[0]),
                ]);
            });
            _this_1 = _super.call(this, ctrlSeq, domView, textTemplate) || this;
            return _this_1;
        }
        return DiacriticAbove;
    }(MathCommand));
    LatexCmds.vec = function () {
        return new DiacriticAbove('\\vec', h.entityText('&rarr;'), ['vec(', ')']);
    };
    LatexCmds.tilde = function () {
        return new DiacriticAbove('\\tilde', h.text('~'), ['tilde(', ')']);
    };
    var DelimsNode = /** @class */ (function (_super) {
        __extends(DelimsNode, _super);
        function DelimsNode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DelimsNode.prototype.setDOM = function (el) {
            var _c;
            _super.prototype.setDOM.call(this, el);
            var children = this.domFrag().children();
            if (!children.isEmpty()) {
                this.delimFrags = (_c = {},
                    _c[L] = children.first(),
                    _c[R] = children.last(),
                    _c);
            }
            return this;
        };
        return DelimsNode;
    }(MathCommand));
    // Round/Square/Curly/Angle Brackets (aka Parens/Brackets/Braces)
    //   first typed as one-sided bracket with matching "ghost" bracket at
    //   far end of current block, until you type an opposing one
    var Bracket = /** @class */ (function (_super) {
        __extends(Bracket, _super);
        function Bracket(side, open, close, ctrlSeq, end) {
            var _c;
            var _this_1 = _super.call(this, '\\left' + ctrlSeq, undefined, [open, close]) || this;
            _this_1.side = side;
            _this_1.sides = (_c = {},
                _c[L] = { ch: open, ctrlSeq: ctrlSeq },
                _c[R] = { ch: close, ctrlSeq: end },
                _c);
            return _this_1;
        }
        Bracket.prototype.numBlocks = function () {
            return 1;
        };
        Bracket.prototype.html = function () {
            var _this_1 = this;
            var leftSymbol = this.getSymbol(L);
            var rightSymbol = this.getSymbol(R);
            // wait until now so that .side may
            this.domView = new DOMView(1, function (blocks) {
                return h(
                // be set by createLeftOf or parser
                'span', { class: 'mq-non-leaf mq-bracket-container' }, [
                    h('span', {
                        style: 'width:' + leftSymbol.width,
                        class: 'mq-scaled mq-bracket-l mq-paren' +
                            (_this_1.side === R ? ' mq-ghost' : ''),
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
                            (_this_1.side === L ? ' mq-ghost' : ''),
                    }, [rightSymbol.html()]),
                ]);
            });
            return _super.prototype.html.call(this);
        };
        Bracket.prototype.getSymbol = function (side) {
            var ch = this.sides[side || R].ch;
            return SVG_SYMBOLS[ch] || { width: '0', html: '' };
        };
        Bracket.prototype.latexRecursive = function (ctx) {
            var _c, _d;
            this.checkCursorContextOpen(ctx);
            ctx.latex += '\\left' + this.sides[L].ctrlSeq;
            (_d = (_c = this.getEnd(L)).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
            ctx.latex += '\\right' + this.sides[R].ctrlSeq;
            this.checkCursorContextClose(ctx);
        };
        Bracket.prototype.mathspeak = function (opts) {
            if (this.mathspeakOverride) {
                return (opts === null || opts === void 0 ? void 0 : opts.createdLeftOf)
                    ? this.mathspeakOverride(this.sides[this.side].ch)
                    : _super.prototype.mathspeak.call(this);
            }
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
            return _super.prototype.mathspeak.call(this);
        };
        Bracket.prototype.matchBrack = function (opts, expectedSide, node) {
            // return node iff it's a matching 1-sided bracket of expected side (if any)
            return (node instanceof Bracket &&
                node.side &&
                node.side !== -expectedSide &&
                (!opts.restrictMismatchedBrackets ||
                    OPP_BRACKS[this.sides[this.side].ch] === node.sides[node.side].ch ||
                    { '(': ']', '[': ')' }[this.sides[L].ch] === node.sides[R].ch) &&
                node);
        };
        Bracket.prototype.closeOpposing = function (brack) {
            brack.side = 0;
            brack.sides[this.side] = this.sides[this.side]; // copy over my info (may be
            var brackFrag = brack.delimFrags[this.side === L ? L : R] // mismatched, like [a, b))
                .removeClass('mq-ghost');
            this.replaceBracket(brackFrag, this.side);
        };
        Bracket.prototype.createLeftOf = function (cursor) {
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
                _super.prototype.createLeftOf.call(this, cursor);
            }
            if (side === L)
                cursor.insAtLeftEnd(brack.getEnd(L));
            else
                cursor.insRightOf(brack);
        };
        Bracket.prototype.placeCursor = function () { };
        Bracket.prototype.unwrap = function () {
            this.getEnd(L)
                .children()
                .disown()
                .adopt(this.parent, this, this[R])
                .domFrag()
                .insertAfter(this.domFrag());
            this.remove();
        };
        Bracket.prototype.deleteSide = function (side, outward, cursor) {
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
                    var brackFrag = this.delimFrags[side].addClass('mq-ghost');
                    this.replaceBracket(brackFrag, side);
                }
                if (sib) {
                    // auto-expand so ghost is at far end
                    var leftEnd = this.getEnd(L);
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
        };
        Bracket.prototype.replaceBracket = function (brackFrag, side) {
            var symbol = this.getSymbol(side);
            brackFrag.children().replaceWith(domFrag(symbol.html()));
            brackFrag.oneElement().style.width = symbol.width;
            if (side === L) {
                var next = brackFrag.next();
                if (!next.isEmpty()) {
                    next.oneElement().style.marginLeft = symbol.width;
                }
            }
            else {
                var prev = brackFrag.prev();
                if (!prev.isEmpty()) {
                    prev.oneElement().style.marginRight = symbol.width;
                }
            }
        };
        Bracket.prototype.deleteTowards = function (dir, cursor) {
            this.deleteSide(-dir, false, cursor);
        };
        Bracket.prototype.finalizeTree = function () {
            this.getEnd(L).deleteOutOf = function (dir, cursor) {
                this.parent.deleteSide(dir, true, cursor);
            };
            // FIXME HACK: after initial creation/insertion, finalizeTree would only be
            // called if the paren is selected and replaced, e.g. by LiveFraction
            this.finalizeTree = this.intentionalBlur = function () {
                this.delimFrags[this.side === L ? R : L].removeClass('mq-ghost');
                this.side = 0;
            };
        };
        Bracket.prototype.siblingCreated = function (_opts, dir) {
            // if something typed between ghost and far
            if (dir === -this.side)
                this.finalizeTree(); // end of its block, solidify
        };
        return Bracket;
    }(DelimsNode));
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
        CharCmds[open] = function () { return new Bracket(L, open, close, ctrlSeq, end); };
        CharCmds[close] = function () { return new Bracket(R, open, close, ctrlSeq, end); };
        BRACKET_NAMES[open] = BRACKET_NAMES[close] = name;
    }
    bindCharBracketPair('(', '', 'parenthesis');
    bindCharBracketPair('[', '', 'bracket');
    bindCharBracketPair('{', '\\{', 'brace');
    LatexCmds.langle = function () {
        return new Bracket(L, '&lang;', '&rang;', '\\langle ', '\\rangle ');
    };
    LatexCmds.rangle = function () {
        return new Bracket(R, '&lang;', '&rang;', '\\langle ', '\\rangle ');
    };
    CharCmds['|'] = function () { return new Bracket(L, '|', '|', '|', '|'); };
    LatexCmds.lVert = function () {
        return new Bracket(L, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
    };
    LatexCmds.rVert = function () {
        return new Bracket(R, '&#8741;', '&#8741;', '\\lVert ', '\\rVert ');
    };
    LatexCmds.left = /** @class */ (function (_super) {
        __extends(left, _super);
        function left() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        left.prototype.parser = function () {
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
        };
        return left;
    }(MathCommand));
    LatexCmds.right = /** @class */ (function (_super) {
        __extends(right, _super);
        function right() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        right.prototype.parser = function () {
            return Parser.fail('unmatched \\right');
        };
        return right;
    }(MathCommand));
    var leftBinomialSymbol = SVG_SYMBOLS['('];
    var rightBinomialSymbol = SVG_SYMBOLS[')'];
    var Binomial = /** @class */ (function (_super) {
        __extends(Binomial, _super);
        function Binomial() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '\\binom';
            _this_1.domView = new DOMView(2, function (blocks) {
                return h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
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
                ]);
            });
            _this_1.textTemplate = ['choose(', ',', ')'];
            _this_1.mathspeakTemplate = ['StartBinomial,', 'Choose', ', EndBinomial'];
            _this_1.ariaLabel = 'binomial';
            return _this_1;
        }
        return Binomial;
    }(DelimsNode));
    LatexCmds.binom = LatexCmds.binomial = Binomial;
    LatexCmds.choose = /** @class */ (function (_super) {
        __extends(class_13, _super);
        function class_13() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_13.prototype.createLeftOf = function (cursor) {
            LiveFraction.prototype.createLeftOf(cursor);
        };
        return class_13;
    }(Binomial));
    var MathFieldNode = /** @class */ (function (_super) {
        __extends(MathFieldNode, _super);
        function MathFieldNode() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '\\MathQuillMathField';
            _this_1.domView = new DOMView(1, function (blocks) {
                return h('span', { class: 'mq-editable-field' }, [
                    h.block('span', { class: 'mq-root-block', 'aria-hidden': 'true' }, blocks[0]),
                ]);
            });
            return _this_1;
        }
        MathFieldNode.prototype.parser = function () {
            var self = this, string = Parser.string, regex = Parser.regex, succeed = Parser.succeed;
            return string('[')
                .then(regex(/^[a-z][a-z0-9]*/i))
                .skip(string(']'))
                .map(function (name) {
                self.name = name;
            })
                .or(succeed(undefined))
                .then(_super.prototype.parser.call(this));
        };
        MathFieldNode.prototype.finalizeTree = function (options) {
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
                    var element = node;
                    if (element.getAttribute('aria-hidden') === 'true') {
                        element.removeAttribute('aria-hidden');
                        domFrag(node)
                            .children()
                            .eachElement(function (child) {
                            child.setAttribute('aria-hidden', 'true');
                        });
                    }
                }
            }
            pushDownAriaHidden(this.domFrag().parent().oneElement());
            this.domFrag().oneElement().removeAttribute('aria-hidden');
        };
        MathFieldNode.prototype.registerInnerField = function (innerFields, MathField) {
            var controller = this.getEnd(L).controller;
            var newField = new MathField(controller);
            innerFields[this.name] = newField;
            innerFields.push(newField);
        };
        MathFieldNode.prototype.latexRecursive = function (ctx) {
            var _c, _d;
            this.checkCursorContextOpen(ctx);
            (_d = (_c = this.getEnd(L)).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
            this.checkCursorContextClose(ctx);
        };
        MathFieldNode.prototype.text = function () {
            return this.getEnd(L).text();
        };
        return MathFieldNode;
    }(MathCommand));
    LatexCmds.editable = LatexCmds.MathQuillMathField = MathFieldNode; // backcompat with before cfd3620 on #233
    // Embed arbitrary things
    // Probably the closest DOM analogue would be an iframe?
    // From MathQuill's perspective, it's a MQSymbol, it can be
    // anywhere and the cursor can go around it but never in it.
    // Create by calling public API method .dropEmbedded(),
    // or by calling the global public API method .registerEmbed()
    // and rendering LaTeX like \embed{registeredName} (see test).
    var EmbedNode = /** @class */ (function (_super) {
        __extends(EmbedNode, _super);
        function EmbedNode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmbedNode.prototype.setOptions = function (options) {
            function noop() {
                return '';
            }
            this.text = options.text || noop;
            this.domView = new DOMView(0, function () {
                return h('span', {}, [parseHTML(options.htmlString || '')]);
            });
            this.latex = options.latex || noop;
            return this;
        };
        EmbedNode.prototype.latexRecursive = function (ctx) {
            this.checkCursorContextOpen(ctx);
            ctx.latex += this.latex();
            this.checkCursorContextClose(ctx);
        };
        EmbedNode.prototype.parser = function () {
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
        };
        return EmbedNode;
    }(MQSymbol));
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
    var TextBlock = /** @class */ (function (_super) {
        __extends(TextBlock, _super);
        function TextBlock() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '\\text';
            _this_1.ariaLabel = 'Text';
            _this_1.mathspeakTemplate = ['StartText', 'EndText'];
            return _this_1;
        }
        TextBlock.prototype.replaces = function (replacedText) {
            if (replacedText instanceof Fragment) {
                this.replacedText = replacedText.remove().domFrag().text();
            }
            else if (typeof replacedText === 'string')
                this.replacedText = replacedText;
        };
        TextBlock.prototype.setDOMFrag = function (el) {
            _super.prototype.setDOM.call(this, el);
            var endsL = this.getEnd(L);
            if (endsL) {
                var children = this.domFrag().children();
                if (!children.isEmpty()) {
                    endsL.setDOM(children.oneText());
                }
            }
            return this;
        };
        TextBlock.prototype.createLeftOf = function (cursor) {
            var textBlock = this;
            _super.prototype.createLeftOf.call(this, cursor);
            cursor.insAtRightEnd(textBlock);
            if (textBlock.replacedText)
                for (var i = 0; i < textBlock.replacedText.length; i += 1)
                    textBlock.write(cursor, textBlock.replacedText.charAt(i));
            var textBlockR = textBlock[R];
            if (textBlockR)
                textBlockR.siblingCreated(cursor.options, L);
            var textBlockL = textBlock[L];
            if (textBlockL)
                textBlockL.siblingCreated(cursor.options, R);
            textBlock.bubble(function (node) {
                node.reflow();
                return undefined;
            });
        };
        TextBlock.prototype.parser = function () {
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
        };
        TextBlock.prototype.textContents = function () {
            return this.foldChildren('', function (text, child) {
                return text + child.textStr;
            });
        };
        TextBlock.prototype.text = function () {
            return '"' + this.textContents() + '"';
        };
        TextBlock.prototype.latexRecursive = function (ctx) {
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
        };
        TextBlock.prototype.html = function () {
            var out = h('span', { class: 'mq-text-mode' }, [
                h.text(this.textContents()),
            ]);
            this.setDOM(out);
            NodeBase.linkElementByCmdNode(out, this);
            return out;
        };
        TextBlock.prototype.mathspeak = function (opts) {
            if (opts && opts.ignoreShorthand) {
                if (this.mathspeakOverride) {
                    return _super.prototype.mathspeak.call(this);
                }
                return (this.mathspeakTemplate[0] +
                    ', ' +
                    this.textContents() +
                    ', ' +
                    this.mathspeakTemplate[1]);
            }
            else {
                return this.textContents();
            }
        };
        TextBlock.prototype.isTextBlock = function () {
            return true;
        };
        // editability methods: called by the cursor for editing, cursor movements,
        // and selection of the MathQuill tree, these all take in a direction and
        // the cursor
        TextBlock.prototype.moveTowards = function (dir, cursor) {
            cursor.insAtDirEnd(-dir, this);
            cursor.controller.aria.queueDirEndOf(-dir, cursor.parent, true);
        };
        TextBlock.prototype.moveOutOf = function (dir, cursor) {
            cursor.insDirOf(dir, this);
            cursor.controller.aria.queueDirOf(dir, this);
        };
        TextBlock.prototype.unselectInto = function (dir, cursor) {
            this.moveTowards(dir, cursor);
        };
        // TODO: make these methods part of a shared mixin or something.
        TextBlock.prototype.selectTowards = function (dir, cursor) {
            MathCommand.prototype.selectTowards.call(this, dir, cursor);
        };
        TextBlock.prototype.deleteTowards = function (dir, cursor) {
            MathCommand.prototype.deleteTowards.call(this, dir, cursor);
        };
        TextBlock.prototype.selectOutOf = function (dir, cursor) {
            cursor.insDirOf(dir, this);
        };
        TextBlock.prototype.deleteOutOf = function (_dir, cursor) {
            // backspace and delete at ends of block don't unwrap
            if (this.isEmpty())
                cursor.insRightOf(this);
        };
        TextBlock.prototype.write = function (cursor, ch) {
            cursor.show().deleteSelection();
            if (ch !== '$') {
                var cursorL = cursor[L];
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
                _super.prototype.createLeftOf.call(leftBlock, cursor); // micro-optimization, not for correctness
            }
            this.bubble(function (node) {
                node.reflow();
                return undefined;
            });
            // TODO needs tests
            cursor.controller.aria.alert(ch);
        };
        TextBlock.prototype.writeLatex = function (cursor, latex) {
            var cursorL = cursor[L];
            if (!cursorL)
                new TextPiece(latex).createLeftOf(cursor);
            else if (cursorL instanceof TextPiece)
                cursorL.appendText(latex);
            this.bubble(function (node) {
                node.reflow();
                return undefined;
            });
        };
        TextBlock.prototype.seek = function (clientX, cursor) {
            cursor.hide();
            var textPc = TextBlockFuseChildren(this);
            if (!textPc)
                return;
            // insert cursor at approx position in DOMTextNode
            var textNode = this.domFrag().children().oneText();
            var range = document.createRange();
            range.selectNodeContents(textNode);
            var rects = range.getClientRects();
            if (rects.length === 1) {
                var _c = rects[0], width = _c.width, left = _c.left;
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
                var cursorL = cursor[L];
                this.anticursorPosition =
                    cursorL && cursorL.textStr.length;
                // ^ get it? 'cos if there's no cursor[L], it's 0... I'm a terrible person.
            }
            else if (cursor.anticursor.parent === this) {
                // mouse-selecting within this TextBlock, re-insert the anticursor
                var cursorL = cursor[L];
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
                        var cursorR = cursor[R];
                        var newTextPc = cursorR.splitRight(this.anticursorPosition - cursorPosition);
                    }
                    cursor.anticursor = new Anticursor(this, newTextPc[L], newTextPc);
                }
            }
        };
        TextBlock.prototype.blur = function (cursor) {
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
        };
        TextBlock.prototype.focus = function () {
            MathBlock.prototype.focus.call(this);
        };
        return TextBlock;
    }(MQNode));
    function TextBlockFuseChildren(self) {
        self.domFrag().oneElement().normalize();
        var children = self.domFrag().children();
        if (children.isEmpty())
            return;
        var textPcDom = children.oneText();
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
    var TextPiece = /** @class */ (function (_super) {
        __extends(TextPiece, _super);
        function TextPiece(text) {
            var _this_1 = _super.call(this) || this;
            _this_1.textStr = text;
            return _this_1;
        }
        TextPiece.prototype.html = function () {
            var out = h.text(this.textStr);
            this.setDOM(out);
            return out;
        };
        TextPiece.prototype.appendText = function (text) {
            this.textStr += text;
            this.domFrag().oneText().appendData(text);
        };
        TextPiece.prototype.prependText = function (text) {
            this.textStr = text + this.textStr;
            this.domFrag().oneText().insertData(0, text);
        };
        TextPiece.prototype.insTextAtDirEnd = function (text, dir) {
            prayDirection(dir);
            if (dir === R)
                this.appendText(text);
            else
                this.prependText(text);
        };
        TextPiece.prototype.splitRight = function (i) {
            var newPc = new TextPiece(this.textStr.slice(i)).adopt(this.parent, this, this[R]);
            newPc.setDOM(this.domFrag().oneText().splitText(i));
            this.textStr = this.textStr.slice(0, i);
            return newPc;
        };
        TextPiece.prototype.endChar = function (dir, text) {
            return text.charAt(dir === L ? 0 : -1 + text.length);
        };
        TextPiece.prototype.moveTowards = function (dir, cursor) {
            prayDirection(dir);
            var ch = this.endChar(-dir, this.textStr);
            var from = this[-dir];
            if (from instanceof TextPiece)
                from.insTextAtDirEnd(ch, dir);
            else
                new TextPiece(ch).createDir(-dir, cursor);
            return this.deleteTowards(dir, cursor);
        };
        TextPiece.prototype.mathspeak = function () {
            return this.textStr;
        };
        TextPiece.prototype.latexRecursive = function (ctx) {
            this.checkCursorContextOpen(ctx);
            ctx.latex += this.textStr;
            this.checkCursorContextClose(ctx);
        };
        TextPiece.prototype.deleteTowards = function (dir, cursor) {
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
        };
        TextPiece.prototype.selectTowards = function (dir, cursor) {
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
        };
        return TextPiece;
    }(MQNode));
    LatexCmds.text =
        LatexCmds.textnormal =
            LatexCmds.textrm =
                LatexCmds.textup =
                    LatexCmds.textmd =
                        TextBlock;
    function makeTextBlock(latex, ariaLabel, tagName, attrs) {
        return /** @class */ (function (_super) {
            __extends(class_14, _super);
            function class_14() {
                var _this_1 = _super !== null && _super.apply(this, arguments) || this;
                _this_1.ctrlSeq = latex;
                _this_1.mathspeakTemplate = ['Start' + ariaLabel, 'End' + ariaLabel];
                _this_1.ariaLabel = ariaLabel;
                return _this_1;
            }
            class_14.prototype.html = function () {
                var out = h(tagName, attrs, [h.text(this.textContents())]);
                this.setDOM(out);
                NodeBase.linkElementByCmdNode(out, this);
                return out;
            };
            return class_14;
        }(TextBlock));
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
    var RootMathCommand = /** @class */ (function (_super) {
        __extends(RootMathCommand, _super);
        function RootMathCommand(cursor) {
            var _this_1 = _super.call(this, '$') || this;
            _this_1.domView = new DOMView(1, function (blocks) {
                return h.block('span', { class: 'mq-math-mode' }, blocks[0]);
            });
            _this_1.cursor = cursor;
            return _this_1;
        }
        RootMathCommand.prototype.createBlocks = function () {
            _super.prototype.createBlocks.call(this);
            var endsL = this.getEnd(L); // TODO - how do we know this is a RootMathCommand?
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
        };
        RootMathCommand.prototype.latexRecursive = function (ctx) {
            var _c, _d;
            this.checkCursorContextOpen(ctx);
            ctx.latex += '$';
            (_d = (_c = this.getEnd(L)).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
            ctx.latex += '$';
            this.checkCursorContextClose(ctx);
        };
        return RootMathCommand;
    }(MathCommand));
    var RootTextBlock = /** @class */ (function (_super) {
        __extends(RootTextBlock, _super);
        function RootTextBlock() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RootTextBlock.prototype.keystroke = function (key, e, ctrlr) {
            if (key === 'Spacebar' || key === 'Shift-Spacebar')
                return;
            return _super.prototype.keystroke.call(this, key, e, ctrlr);
        };
        RootTextBlock.prototype.write = function (cursor, ch) {
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
        };
        return RootTextBlock;
    }(RootMathBlock));
    API.TextField = function (APIClasses) {
        var _c;
        return _c = /** @class */ (function (_super) {
                __extends(TextField, _super);
                function TextField() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                TextField.prototype.__mathquillify = function () {
                    _super.prototype.mathquillify.call(this, 'mq-editable-field mq-text-mode');
                    return this;
                };
                TextField.prototype.latex = function (latex) {
                    if (latex) {
                        this.__controller.renderLatexText(latex);
                        if (this.__controller.blurred)
                            this.__controller.cursor.hide().parent.blur();
                        var _this = this; // just to help help TS out
                        return _this;
                    }
                    return this.__controller.exportLatex();
                };
                return TextField;
            }(APIClasses.EditableField)),
            _c.RootBlock = RootTextBlock,
            _c;
    };
    /****************************************
     * Input box to type backslash commands
     ***************************************/
    CharCmds['\\'] = /** @class */ (function (_super) {
        __extends(LatexCommandInput, _super);
        function LatexCommandInput() {
            var _this_1 = _super !== null && _super.apply(this, arguments) || this;
            _this_1.ctrlSeq = '\\';
            _this_1.domView = new DOMView(1, function (blocks) {
                return h('span', { class: 'mq-latex-command-input-wrapper mq-non-leaf' }, [
                    h('span', { class: 'mq-latex-command-input mq-non-leaf' }, [
                        h.text('\\'),
                        h.block('span', {}, blocks[0]),
                    ]),
                ]);
            });
            _this_1.textTemplate = ['\\'];
            return _this_1;
        }
        LatexCommandInput.prototype.replaces = function (replacedFragment) {
            this._replacedFragment = replacedFragment.disown();
            this.isEmpty = function () {
                return false;
            };
        };
        LatexCommandInput.prototype.createBlocks = function () {
            _super.prototype.createBlocks.call(this);
            var endsL = this.getEnd(L);
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
        };
        LatexCommandInput.prototype.createLeftOf = function (cursor) {
            _super.prototype.createLeftOf.call(this, cursor);
            if (this._replacedFragment) {
                var frag = this.domFrag();
                var el_1 = frag.oneElement();
                this._replacedFragment.domFrag().addClass('mq-blur');
                //FIXME: is monkey-patching the mousedown and mousemove handlers the right way to do this?
                var rewriteMousedownEventTarget = function (e) {
                    {
                        // TODO - overwritting e.target
                        e.target = el_1;
                        el_1.dispatchEvent(e);
                        return false;
                    }
                };
                el_1.addEventListener('mousedown', rewriteMousedownEventTarget);
                el_1.addEventListener('mouseup', rewriteMousedownEventTarget);
                this._replacedFragment.domFrag().insertBefore(frag.children().first());
            }
        };
        LatexCommandInput.prototype.latexRecursive = function (ctx) {
            var _c, _d;
            this.checkCursorContextOpen(ctx);
            ctx.latex += '\\';
            (_d = (_c = this.getEnd(L)).latexRecursive) === null || _d === void 0 ? void 0 : _d.call(_c, ctx);
            ctx.latex += ' ';
            this.checkCursorContextClose(ctx);
        };
        LatexCommandInput.prototype.renderCommand = function (cursor) {
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
                var node = void 0;
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
                var node = new TextBlock();
                node.replaces(latex);
                node.createLeftOf(cursor);
                cursor.insRightOf(node);
                if (this._replacedFragment) {
                    this._replacedFragment.remove();
                }
                return node;
            }
        };
        return LatexCommandInput;
    }(MathCommand));
    var assert = (function () {
        var AssertionError = /** @class */ (function (_super) {
            __extends(AssertionError, _super);
            function AssertionError(_c) {
                var message = _c.message, explanation = _c.explanation;
                var _this_1 = this;
                var combined = "".concat(explanation, " ").concat(message);
                _this_1 = _super.call(this, combined) || this;
                _this_1.explanation = explanation;
                _this_1.message = combined;
                return _this_1;
            }
            return AssertionError;
        }(Error));
        function fail(opts) {
            throw new AssertionError(opts);
        }
        return {
            ok: function (thing, message) {
                if (thing)
                    return;
                fail({
                    message: message,
                    explanation: 'expected ' + thing + ' to be truthy',
                });
            },
            equal: function (thing1, thing2, message) {
                if (thing1 === thing2)
                    return;
                fail({
                    message: message,
                    explanation: 'expected (' + thing1 + ') to equal (' + thing2 + ')',
                });
            },
            throws: function (fn, message) {
                var error = false;
                try {
                    fn();
                }
                catch (e) {
                    error = true;
                }
                if (error)
                    return;
                fail({
                    message: message,
                    explanation: 'expected ' + fn + ' to throw an error',
                });
            },
            fail: function (message) {
                fail({ message: message, explanation: 'generic fail' });
            },
        };
    })();
    var trigger = {
        cut: function (el) { return el.dispatchEvent(new ClipboardEvent('cut')); },
        copy: function (el) { return el.dispatchEvent(new ClipboardEvent('copy')); },
        paste: function (el) { return el.dispatchEvent(new ClipboardEvent('paste')); },
        input: function (el) { return el.dispatchEvent(new InputEvent('input')); },
        keydown: triggerKeyboardEvent.bind(null, 'keydown'),
        keyup: triggerKeyboardEvent.bind(null, 'keyup'),
        keypress: triggerKeyboardEvent.bind(null, 'keypress'),
        blur: function (el) {
            el.dispatchEvent(new FocusEvent('blur'));
            el.dispatchEvent(new FocusEvent('focusout'));
        },
        _: '',
    };
    trigger._ = 'dummy usage of "trigger" to satisfy TypeScript';
    function triggerKeyboardEvent(type, el, key, modifiers) {
        if (modifiers === void 0) { modifiers = {}; }
        el.dispatchEvent(new KeyboardEvent(type, __assign(__assign({}, modifiers), { key: key })));
    }
    function setupJqueryStub() {
        window.$ = window.jQuery = function $_stub(s) {
            if (typeof s === 'string') {
                s = document.querySelector(s);
            }
            return {
                0: s,
                html: function () { return s.innerHTML; },
            };
        };
    }
    suite('SupSub', function () {
        var $ = window.test_only_jquery;
        var mq;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
        });
        function prayWellFormedPoint(pt) {
            prayWellFormed(pt.parent, pt[L], pt[R]);
        }
        var expecteds = [
            'x_{ab} x_{ba}, x_{a}^{b} x_{a}^{b}; x_{ab} x_{ba}, x_{a}^{b} x_{a}^{b}; x_{a} x_{a}, x_{a}^{} x_{a}^{}',
            'x_{b}^{a} x_{b}^{a}, x^{ab} x^{ba}; x_{b}^{a} x_{b}^{a}, x^{ab} x^{ba}; x_{}^{a} x_{}^{a}, x^{a} x^{a}',
        ];
        var expectedsAfterC = [
            'x_{abc} x_{bca}, x_{a}^{bc} x_{a}^{bc}; x_{ab}c x_{bca}, x_{a}^{b}c x_{a}^{b}c; x_{a}c x_{ca}, x_{a}^{}c x_{a}^{}c',
            'x_{bc}^{a} x_{bc}^{a}, x^{abc} x^{bca}; x_{b}^{a}c x_{b}^{a}c, x^{ab}c x^{bca}; x_{}^{a}c x_{}^{a}c, x^{a}c x^{ca}',
        ];
        'sub super'.split(' ').forEach(function (initSupsub, i) {
            var initialLatex = 'x_{a} x^{a}'.split(' ')[i];
            'typed, wrote, wrote empty'.split(', ').forEach(function (did, j) {
                var doTo = [
                    function (mq, supsub) {
                        mq.typedText(supsub).typedText('b');
                    },
                    function (mq, supsub) {
                        mq.write(supsub + 'b');
                    },
                    function (mq, supsub) {
                        mq.write(supsub + '{}');
                    },
                ][j];
                'sub super'.split(' ').forEach(function (supsub, k) {
                    var cmd = '_^'.split('')[k];
                    'after before'.split(' ').forEach(function (side, l) {
                        var moveToSide = [
                            noop,
                            function (mq) {
                                mq.moveToLeftEnd().keystroke('Right');
                            },
                        ][l];
                        var expected = expecteds[i].split('; ')[j].split(', ')[k].split(' ')[l];
                        var expectedAfterC = expectedsAfterC[i]
                            .split('; ')[j].split(', ')[k].split(' ')[l];
                        test('initial ' +
                            initSupsub +
                            'script then ' +
                            did +
                            ' ' +
                            supsub +
                            'script ' +
                            side, function () {
                            mq.latex(initialLatex);
                            assert.equal(mq.latex(), initialLatex);
                            moveToSide(mq);
                            doTo(mq, cmd);
                            assert.equal(mq.latex().replace(/ /g, ''), expected);
                            prayWellFormedPoint(mq.__controller.cursor);
                            mq.typedText('c');
                            assert.equal(mq.latex().replace(/ /g, ''), expectedAfterC);
                        });
                    });
                });
            });
        });
        var expecteds = 'x_{a}^{3} x_{a}^{3}, x_{a}^{3} x_{a}^{3}; x^{a3} x^{3a}, x^{a3} x^{3a}';
        var expectedsAfterC = 'x_{a}^{3}c x_{a}^{3}c, x_{a}^{3}c x_{a}^{3}c; x^{a3}c x^{3ca}, x^{a3}c x^{3ca}';
        'sub super'.split(' ').forEach(function (initSupsub, i) {
            var initialLatex = 'x_{a} x^{a}'.split(' ')[i];
            'typed wrote'.split(' ').forEach(function (did, j) {
                var doTo = [
                    function (mq) {
                        mq.typedText('³');
                    },
                    function (mq) {
                        mq.write('³');
                    },
                ][j];
                'after before'.split(' ').forEach(function (side, k) {
                    var moveToSide = [
                        noop,
                        function (mq) {
                            mq.moveToLeftEnd().keystroke('Right');
                        },
                    ][k];
                    var expected = expecteds.split('; ')[i].split(', ')[j].split(' ')[k];
                    var expectedAfterC = expectedsAfterC
                        .split('; ')[i].split(', ')[j].split(' ')[k];
                    test('initial ' + initSupsub + 'script then ' + did + " '³' " + side, function () {
                        mq.latex(initialLatex);
                        assert.equal(mq.latex(), initialLatex);
                        moveToSide(mq);
                        doTo(mq);
                        assert.equal(mq.latex().replace(/ /g, ''), expected);
                        prayWellFormedPoint(mq.__controller.cursor);
                        mq.typedText('c');
                        assert.equal(mq.latex().replace(/ /g, ''), expectedAfterC);
                    });
                });
            });
        });
        test("render LaTeX with 2 SupSub's in a row", function () {
            mq.latex('x_a_b');
            assert.equal(mq.latex(), 'x_{ab}');
            mq.latex('x_a_{}');
            assert.equal(mq.latex(), 'x_{a}');
            mq.latex('x_{}_a');
            assert.equal(mq.latex(), 'x_{a}');
            mq.latex('x^a^b');
            assert.equal(mq.latex(), 'x^{ab}');
            mq.latex('x^a^{}');
            assert.equal(mq.latex(), 'x^{a}');
            mq.latex('x^{}^a');
            assert.equal(mq.latex(), 'x^{a}');
        });
        test("render LaTeX with 3 alternating SupSub's in a row", function () {
            mq.latex('x_a^b_c');
            assert.equal(mq.latex(), 'x_{ac}^{b}');
            mq.latex('x^a_b^c');
            assert.equal(mq.latex(), 'x_{b}^{ac}');
        });
        suite('deleting', function () {
            test('backspacing out of and then re-typing subscript', function () {
                mq.latex('x_a^b');
                assert.equal(mq.latex(), 'x_{a}^{b}');
                mq.keystroke('Down Backspace');
                assert.equal(mq.latex(), 'x_{ }^{b}');
                mq.keystroke('Backspace');
                assert.equal(mq.latex(), 'x^{b}');
                mq.typedText('_a');
                assert.equal(mq.latex(), 'x_{a}^{b}');
                mq.keystroke('Left Backspace');
                assert.equal(mq.latex(), 'xa^{b}');
                mq.typedText('c');
                assert.equal(mq.latex(), 'xca^{b}');
            });
            test('backspacing out of and then re-typing superscript', function () {
                mq.latex('x_a^b');
                assert.equal(mq.latex(), 'x_{a}^{b}');
                mq.keystroke('Up Backspace');
                assert.equal(mq.latex(), 'x_{a}^{ }');
                mq.keystroke('Backspace');
                assert.equal(mq.latex(), 'x_{a}');
                mq.typedText('^b');
                assert.equal(mq.latex(), 'x_{a}^{b}');
                mq.keystroke('Left Backspace');
                assert.equal(mq.latex(), 'x_{a}b');
                mq.typedText('c');
                assert.equal(mq.latex(), 'x_{a}cb');
            });
        });
        suite('Escpae', function () {
            test('from partial selection of a superscript', function () {
                mq.typedText('x^2.3');
                assert.equal(mq.latex(), 'x^{2.3}');
                mq.keystroke('Shift-Left');
                mq.keystroke('Esc');
                mq.typedText('+1');
                assert.equal(mq.latex(), 'x^{2.3}+1');
            });
            test('from partial selection of a subscript', function () {
                mq.typedText('x_2.3');
                assert.equal(mq.latex(), 'x_{2.3}');
                mq.keystroke('Shift-Left');
                mq.keystroke('Esc');
                mq.typedText('+1');
                assert.equal(mq.latex(), 'x_{2.3}+1');
            });
        });
    });
    suite('ans command', function () {
        var $ = window.test_only_jquery;
        var mq;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                autoCommands: 'ans',
            });
        });
        teardown(function () {
            $(mq.el()).remove();
        });
        test('Typing and backspacing', function () {
            mq.typedText('2+ans');
            assert.equal(mq.latex(), '2+\\operatorname{ans}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '2+');
        });
        test('Parsing', function () {
            mq.latex('\\operatorname{ans}');
            assert.equal(mq.latex(), '\\operatorname{ans}');
        });
    });
    suite('aria', function () {
        var $ = window.test_only_jquery;
        var mathField;
        var container;
        setup(function () {
            container = $('<span></span>').appendTo('#mock')[0];
            mathField = MQ.MathField(container);
        });
        function assertAriaEqual(alertText) {
            assert.equal(alertText, mathField.__controller.aria.msg);
        }
        test('mathfield has aria-hidden on mq-root-block', function () {
            mathField.latex('1+\\frac{1}{x}');
            var ariaHiddenChildren = $(container).find('[aria-hidden]="true"');
            assert.equal(ariaHiddenChildren.length, 1, '1 aria-hidden element');
            assert.ok(ariaHiddenChildren.hasClass('mq-root-block'), 'aria-hidden is set on mq-root-block');
        });
        test('Static math aria-hidden', function () {
            var staticMath = MQ.StaticMath(container);
            staticMath.latex('1+\\frac{1}{x}');
            var ariaHiddenChildren = $(container).find('[aria-hidden]="true"');
            assert.equal(ariaHiddenChildren.length, 1, '1 aria-hidden element');
            assert.ok(ariaHiddenChildren.hasClass('mq-root-block'), 'aria-hidden is set on mq-root-block');
        });
        test('MathQuillMathField aria-hidden', function () {
            var staticMath = MQ.StaticMath(container);
            staticMath.latex('1+\\sqrt{\\MathQuillMathField{x^2+y^2}}+\\frac{1}{x}');
            var textArea = $(container).find('textarea');
            assert.equal(textArea.length, 1, 'One text area for inner editable field');
            assert.equal(textArea.closest('[aria-hidden]="true"').length, 0, 'Textarea has no aria-hidden parent');
            var mathSpeak = $(container).find('.mq-mathspeak');
            assert.equal(mathSpeak.length, 1, 'One mathspeak region');
            assert.equal(mathSpeak.closest('[aria-hidden]="true"').length, 0, 'Textarea has no aria-hidden parent');
            var nHiddenTexts = 0;
            var allChildren = $(container).find('*');
            allChildren.each(function (_i, elt) {
                if (elt.textContent === '')
                    return;
                if ($(elt).has('.mq-mathspeak').length === 1 ||
                    $(elt).closest('.mq-mathspeak').length === 1)
                    return;
                if ($(elt).has('[aria-hidden]="true').length === 1 ||
                    $(elt).closest('[aria-hidden]="true').length === 1) {
                    nHiddenTexts += 1;
                    return;
                }
                assert.ok(false, 'All children with text content have an aria-hidden parent, or are part of mathspeak');
            });
            assert.ok(nHiddenTexts > 0, 'At least one element with text content is aria-hidden');
        });
        test('typing and backspacing over simple expression', function () {
            mathField.typedText('1');
            assertAriaEqual('1');
            mathField.typedText('+');
            assertAriaEqual('plus');
            mathField.typedText('1');
            assertAriaEqual('1');
            mathField.typedText('=');
            assertAriaEqual('equals');
            mathField.typedText('2');
            assertAriaEqual('2');
            mathField.keystroke('Backspace');
            assertAriaEqual('2');
            mathField.keystroke('Backspace');
            assertAriaEqual('equals');
            mathField.keystroke('Backspace');
            assertAriaEqual('1');
            mathField.keystroke('Backspace');
            assertAriaEqual('plus');
            mathField.keystroke('Backspace');
            assertAriaEqual('1');
        });
        test('typing and backspacing a fraction', function () {
            mathField.typedText('1');
            assertAriaEqual('1');
            mathField.typedText('/');
            assertAriaEqual('over');
            mathField.typedText('2');
            assertAriaEqual('2');
            // We have logic to shorten the speak we return for common numeric fractions and superscripts.
            // While editing, however, the slightly longer form (but unambiguous) form of the item should be spoken.
            // In this case, we would shorten the fraction 1/2 to "1 half" when reading,
            // but navigating around the equation should result in "StartFraction, 1 Over 2, EndFraction."
            mathField.keystroke('Tab');
            assertAriaEqual('after StartFraction, 1 Over 2 , EndFraction');
            mathField.keystroke('Backspace');
            assertAriaEqual('end of denominator 2');
            mathField.keystroke('Backspace');
            assertAriaEqual('2');
            mathField.keystroke('Backspace');
            assertAriaEqual('Over');
            mathField.keystroke('Backspace');
            assertAriaEqual('1');
        });
        test('navigating a fraction', function () {
            mathField.typedText('1');
            assertAriaEqual('1');
            mathField.typedText('/');
            assertAriaEqual('over');
            mathField.typedText('2');
            assertAriaEqual('2');
            mathField.keystroke('Up');
            assertAriaEqual('numerator 1');
            mathField.keystroke('Down');
            assertAriaEqual('denominator 2');
            mathField.latex('');
        });
        test('typing and backspacing through parenthesies', function () {
            mathField.typedText('(');
            assertAriaEqual('left parenthesis');
            mathField.typedText('1');
            assertAriaEqual('1');
            mathField.typedText('*');
            assertAriaEqual('times');
            mathField.typedText('2');
            assertAriaEqual('2');
            mathField.typedText(')');
            assertAriaEqual('right parenthesis');
            mathField.keystroke('Backspace');
            assertAriaEqual('right parenthesis');
            mathField.keystroke('Backspace');
            assertAriaEqual('2');
            mathField.keystroke('Backspace');
            assertAriaEqual('times');
            mathField.keystroke('Backspace');
            assertAriaEqual('1');
            mathField.keystroke('Backspace');
            assertAriaEqual('left parenthesis');
        });
        test('testing beginning and end alerts', function () {
            mathField.typedText('sqrt(x)');
            mathField.keystroke('Home');
            assertAriaEqual('beginning of block "s" "q" "r" "t" left parenthesis, "x" , right parenthesis');
            mathField.keystroke('End');
            assertAriaEqual('end of block "s" "q" "r" "t" left parenthesis, "x" , right parenthesis');
            mathField.keystroke('Ctrl-Home');
            assertAriaEqual('beginning of Math Input "s" "q" "r" "t" left parenthesis, "x" , right parenthesis');
            mathField.keystroke('Ctrl-End');
            assertAriaEqual('end of Math Input "s" "q" "r" "t" left parenthesis, "x" , right parenthesis');
        });
        test('testing aria-label for interactive and static math', function (done) {
            mathField.focus();
            mathField.typedText('sqrt(x)');
            mathField.blur();
            setTimeout(function () {
                assert.equal(mathField.__controller.textarea.getAttribute('aria-label'), 'Math Input: "s" "q" "r" "t" left parenthesis, "x" , right parenthesis');
                done();
            });
            var staticMath = MQ.StaticMath($('<span class="mathquill-static-math">y=\\frac{2x}{3y}</span>').appendTo('#mock')[0]);
            assert.equal('"y" equals StartFraction, 2 "x" Over 3 "y" , EndFraction', staticMath.__controller.mathspeakSpan.textContent);
            assert.equal('', staticMath.getAriaLabel());
            staticMath.setAriaLabel('Static Label');
            assert.equal('Static Label: "y" equals StartFraction, 2 "x" Over 3 "y" , EndFraction', staticMath.__controller.mathspeakSpan.textContent);
            assert.equal('Static Label', staticMath.getAriaLabel());
            staticMath.latex('2+2');
            assert.equal('Static Label: 2 plus 2', staticMath.__controller.mathspeakSpan.textContent);
        });
        test('testing aria-label for tokens', function () {
            var staticMath = MQ.StaticMath(container);
            staticMath.latex('\\token{123}');
            assert.equal('token 123', staticMath.mathspeak().trim(), 'default token mathspeak is correct');
            $('<span aria-label="point 123"></span>').appendTo($(container).find('.mq-token')[0]);
            assert.equal('point 123', staticMath.mathspeak().trim(), "token's child aria-label used for mathspeak");
        });
    });
    suite('autoOperatorNames', function () {
        var $ = window.test_only_jquery;
        var mq;
        var normalConfig = {
            autoCommands: 'sum int',
        };
        var subscriptConfig = {
            autoCommands: 'sum int',
            disableAutoSubstitutionInSubscripts: true,
        };
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            mq.config(normalConfig);
        });
        function assertLatex(input, expected) {
            var result = mq.latex();
            assert.equal(result, expected, input + ", got '" + result + "', expected '" + expected + "'");
        }
        function assertText(input, expected) {
            var result = mq.text();
            assert.equal(result, expected, input + ", got '" + result + "', expected '" + expected + "'");
        }
        test('simple LaTeX parsing, typing', function () {
            function assertAutoOperatorNamesWork(str, latex) {
                var count = 0;
                var _autoUnItalicize = Letter.prototype.autoUnItalicize;
                Letter.prototype.autoUnItalicize = function () {
                    count += 1;
                    return _autoUnItalicize.apply(this, arguments);
                };
                mq.latex(str);
                assertLatex("parsing '" + str + "'", latex);
                assert.equal(count, 1);
                // Since Latex doesn't change, count should remain at 1.
                mq.latex(latex);
                assertLatex("parsing '" + latex + "'", latex);
                assert.equal(count, 1);
                mq.latex('');
                for (var i = 0; i < str.length; i += 1)
                    mq.typedText(str.charAt(i));
                assertLatex("typing '" + str + "'", latex);
                assert.equal(count, 1 + str.length);
            }
            assertAutoOperatorNamesWork('sin', '\\sin');
            assertAutoOperatorNamesWork('inf', '\\inf');
            assertAutoOperatorNamesWork('arcosh', '\\operatorname{arcosh}');
            assertAutoOperatorNamesWork('acosh', 'a\\cosh');
            assertAutoOperatorNamesWork('cosine', '\\cos ine');
            assertAutoOperatorNamesWork('arcosecant', 'ar\\operatorname{cosec}ant');
            assertAutoOperatorNamesWork('cscscscscscsc', '\\csc s\\csc s\\csc sc');
            assertAutoOperatorNamesWork('scscscscscsc', 's\\csc s\\csc s\\csc');
        });
        test('works in \\sum', function () {
            mq.typedText('sum');
            mq.typedText('sin');
            assertLatex('sum allows operatorname', '\\sum_{\\sin}^{ }');
        });
        test('works in \\int', function () {
            mq.typedText('int');
            mq.typedText('sin');
            assertLatex('int allows operatorname', '\\int_{\\sin}^{ }');
        });
        test('no auto operator names in simple subscripts when typing', function () {
            mq.config(normalConfig);
            mq.typedText('x_');
            mq.typedText('sin');
            assertLatex('subscripts turn to operatorname', 'x_{\\sin}');
            mq.latex('');
            mq.config(subscriptConfig);
            mq.typedText('x_');
            mq.typedText('sin');
            assertLatex('subscripts do not turn to operatorname', 'x_{sin}');
            mq.config(normalConfig);
        });
        test('no auto operator names in simple subscripts when pasting', function () {
            var textarea = $(mq.el()).find('textarea');
            mq.config(normalConfig);
            trigger.paste(textarea[0]);
            textarea.val('x_{sin}');
            trigger.input(textarea[0]);
            assertLatex('subscripts turn to operatorname', 'x_{\\sin}');
            mq.latex('');
            mq.config(subscriptConfig);
            trigger.paste(textarea[0]);
            textarea.val('x_{sin}');
            trigger.input(textarea[0]);
            assertLatex('subscripts do not turn to operatorname', 'x_{sin}');
            mq.config(normalConfig);
        });
        test('text() output', function () {
            function assertTranslatedCorrectly(latexStr, text) {
                mq.latex(latexStr);
                assertText('outputting ' + latexStr, text);
            }
            assertTranslatedCorrectly('\\sin', 'sin');
            assertTranslatedCorrectly('\\sin\\left(xy\\right)', 'sin(x*y)');
        });
        test('deleting', function () {
            var count = 0;
            var _autoUnItalicize = Letter.prototype.autoUnItalicize;
            Letter.prototype.autoUnItalicize = function () {
                count += 1;
                return _autoUnItalicize.apply(this, arguments);
            };
            var str = 'cscscscscscsc';
            for (var i = 0; i < str.length; i += 1)
                mq.typedText(str.charAt(i));
            assertLatex("typing '" + str + "'", '\\csc s\\csc s\\csc sc');
            assert.equal(count, str.length);
            mq.moveToLeftEnd().keystroke('Del');
            assertLatex('deleted first char', 's\\csc s\\csc s\\csc');
            assert.equal(count, str.length + 1);
            mq.typedText('c');
            assertLatex('typed back first char', '\\csc s\\csc s\\csc sc');
            assert.equal(count, str.length + 2);
            mq.typedText('+');
            assertLatex('typed plus to interrupt sequence of letters', 'c+s\\csc s\\csc s\\csc');
            assert.equal(count, str.length + 4);
            mq.keystroke('Backspace');
            assertLatex('deleted plus', '\\csc s\\csc s\\csc sc');
            assert.equal(count, str.length + 5);
        });
        suite('override autoOperatorNames', function () {
            test('basic', function () {
                mq.config({ autoOperatorNames: 'sin lol' });
                mq.typedText('arcsintrololol');
                assert.equal(mq.latex(), 'arc\\sin tro\\operatorname{lol}ol');
            });
            test('command contains non-letters', function () {
                assert.throws(function () {
                    MQ.config({ autoOperatorNames: 'e1' });
                });
            });
            test('command length less than 2', function () {
                assert.throws(function () {
                    MQ.config({ autoOperatorNames: 'e' });
                });
            });
            suite('command list not perfectly space-delimited', function () {
                test('double space', function () {
                    assert.throws(function () {
                        MQ.config({ autoOperatorNames: 'pi  theta' });
                    });
                });
                test('leading space', function () {
                    assert.throws(function () {
                        MQ.config({ autoOperatorNames: ' pi' });
                    });
                });
                test('trailing space', function () {
                    assert.throws(function () {
                        MQ.config({ autoOperatorNames: 'pi ' });
                    });
                });
            });
        });
    });
    suite('autoSubscriptNumeralsAndCharsThatBreakOutOfSupSub', function () {
        var $ = window.test_only_jquery;
        var mq;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                charsThatBreakOutOfSupSub: '+-=<>',
                autoSubscriptNumerals: true,
            });
            rootBlock = mq.__controller.root;
            controller = mq.__controller;
            cursor = controller.cursor;
        });
        test('combined behavior works as expected', function () {
            assert.equal(mq.typedText('x_2n+y').latex(), 'x_{2n}+y');
            mq.latex('');
            // Unary operators never break out of subscript.
            assert.equal(mq.typedText('x_+2n').latex(), 'x_{+2n}');
            mq.latex('');
            assert.equal(mq.typedText('x_-2n').latex(), 'x_{-2n}');
            mq.latex('');
            assert.equal(mq.typedText('x_=2n').latex(), 'x_{=2n}');
            mq.latex('');
            // Only break out of exponents if cursor at the end, don't
            // jump from the middle of the exponent out to the right.
            assert.equal(mq.typedText('x_ab').latex(), 'x_{ab}');
            assert.equal(mq.keystroke('Left').typedText('+').latex(), 'x_{a+b}');
            mq.latex('');
        });
    });
    suite('autoSubscript', function () {
        var $ = window.test_only_jquery;
        var mq;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                autoSubscriptNumerals: true,
            });
            rootBlock = mq.__controller.root;
            controller = mq.__controller;
            cursor = controller.cursor;
        });
        test('auto subscripting variables', function () {
            mq.latex('x');
            mq.typedText('2');
            assert.equal(mq.latex(), 'x_{2}');
            mq.typedText('3');
            assert.equal(mq.latex(), 'x_{23}');
        });
        test('do not autosubscript functions', function () {
            mq.latex('sin');
            mq.typedText('2');
            assert.equal(mq.latex(), '\\sin2');
            mq.typedText('3');
            assert.equal(mq.latex(), '\\sin23');
        });
        test('autosubscript exponentiated variables', function () {
            mq.latex('x^2');
            mq.typedText('2');
            assert.equal(mq.latex(), 'x_{2}^{2}');
            mq.typedText('3');
            assert.equal(mq.latex(), 'x_{23}^{2}');
        });
        test('do not autosubscript exponentiated functions', function () {
            mq.latex('sin^{2}');
            mq.typedText('2');
            assert.equal(mq.latex(), '\\sin^{2}2');
            mq.typedText('3');
            assert.equal(mq.latex(), '\\sin^{2}23');
        });
        test('do not autosubscript subscripted functions', function () {
            mq.latex('sin_{10}');
            mq.typedText('2');
            assert.equal(mq.latex(), '\\sin_{10}2');
        });
        test('backspace through compound subscript', function () {
            mq.latex('x_{2_2}');
            //first backspace moves to cursor in subscript and peels it off
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            //second backspace clears out remaining subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{ }');
            //unpeel subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
        });
        test('backspace through simple subscript', function () {
            mq.latex('x_{2+3}');
            assert.equal(cursor.parent, rootBlock, 'start in the root block');
            //backspace peels off subscripts but stays at the root block level
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2+}');
            assert.equal(cursor.parent, rootBlock, 'backspace keeps us in the root block');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            assert.equal(cursor.parent, rootBlock, 'backspace keeps us in the root block');
            //second backspace clears out remaining subscript and unpeels
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
        });
        test('backspace through subscript & superscript with autosubscripting on', function () {
            mq.latex('x_2^{32}');
            //first backspace peels off the subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x^{32}');
            //second backspace goes into the exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x^{32}');
            //clear out exponent
            mq.keystroke('Backspace');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x^{ }');
            //unpeel exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
        });
        test('backspace through compound subscript', function () {
            mq.latex('x_{2_2}');
            //first backspace goes into the subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            //second one goes into the subscripts' subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{ }');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
        });
    });
    suite('backspace', function () {
        var $ = window.test_only_jquery;
        var mq, rootBlock, controller, cursor;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            rootBlock = mq.__controller.root;
            controller = mq.__controller;
            cursor = controller.cursor;
        });
        function prayWellFormedPoint(pt) {
            prayWellFormed(pt.parent, pt[L], pt[R]);
        }
        function assertLatex(latex) {
            prayWellFormedPoint(mq.__controller.cursor);
            assert.equal(mq.latex(), latex);
        }
        test('backspace through exponent', function () {
            controller.renderLatexMath('x^{nm}');
            var exp = rootBlock.ends[R], expBlock = exp.ends[L];
            assert.equal(exp.latex(), '^{nm}', 'right end el is exponent');
            assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
            assert.equal(cursor[L], exp, 'cursor is at the end of root block');
            mq.keystroke('Backspace');
            assert.equal(cursor.parent, expBlock, 'cursor up goes into exponent on backspace');
            assertLatex('x^{nm}');
            mq.keystroke('Backspace');
            assert.equal(cursor.parent, expBlock, 'cursor still in exponent');
            assertLatex('x^{n}');
            mq.keystroke('Backspace');
            assert.equal(cursor.parent, expBlock, 'still in exponent, but it is empty');
            assertLatex('x^{ }');
            mq.keystroke('Backspace');
            assert.equal(cursor.parent, rootBlock, 'backspace tears down exponent');
            assertLatex('x');
        });
        test('backspace through complex fraction', function () {
            controller.renderLatexMath('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');
            //first backspace moves to denominator
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');
            //first backspace moves to denominator in denominator
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');
            //finally delete a character
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{ }}');
            //destroy fraction
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{\\frac{1}{2}+2}');
            mq.keystroke('Backspace');
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{\\frac{1}{2}}');
            mq.keystroke('Backspace');
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{\\frac{1}{ }}');
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{1}');
            mq.keystroke('Backspace');
            assertLatex('1+\\frac{1}{ }');
            mq.keystroke('Backspace');
            assertLatex('1+1');
        });
        test('backspace through compound subscript', function () {
            mq.latex('x_{2_2}');
            //first backspace goes into the subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2_{2}}');
            //second one goes into the subscripts' subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2_{2}}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2_{ }}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{ }');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
        });
        test('backspace through simple subscript', function () {
            mq.latex('x_{2+3}');
            assert.equal(cursor.parent, rootBlock, 'start in the root block');
            //backspace goes down
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2+3}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2+}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{ }');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
        });
        test('backspace through subscript & superscript', function () {
            mq.latex('x_2^{32}');
            //first backspace takes us into the exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}^{32}');
            //second backspace is within the exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}^{3}');
            //clear out exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}^{ }');
            //unpeel exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            //into subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{2}');
            //clear out subscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x_{ }');
            //unpeel exponent
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'x');
            //clear out math field
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '');
        });
        test('backspace through nthroot', function () {
            mq.latex('\\sqrt[3]{x}');
            //first backspace takes us inside the nthroot
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '\\sqrt[3]{x}');
            //second backspace removes the x
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '\\sqrt[3]{}');
            //third one destroys the cube root, but leaves behind the 3
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '3');
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '');
        });
        test('backspace through large operator', function () {
            mq.latex('\\sum_{n=1}^3x');
            //first backspace takes out the argument
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '\\sum_{n=1}^{3}');
            //up into the superscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '\\sum_{n=1}^{3}');
            //up into the superscript
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), '\\sum_{n=1}^{ }');
            //destroy the sum, preserve the subscript (a little surprising)
            mq.keystroke('Backspace');
            assert.equal(mq.latex(), 'n=1');
        });
        test('backspace through text block', function () {
            mq.latex('\\text{x}');
            mq.keystroke('Backspace');
            var textBlock = rootBlock.ends[R];
            assert.equal(cursor.parent, textBlock, 'cursor is in text block');
            assert.equal(cursor[R], 0, 'cursor is at the end of text block');
            assert.equal(cursor[L].textStr, 'x', 'cursor is rightward of the x');
            assert.equal(mq.latex(), '\\text{x}', 'the x has been deleted');
            mq.keystroke('Backspace');
            assert.equal(cursor.parent, textBlock, 'cursor is still in text block');
            assert.equal(cursor[R], 0, 'cursor is at the right end of the text block');
            assert.equal(cursor[L], 0, 'cursor is at the left end of the text block');
            assert.equal(mq.latex(), '', 'the x has been deleted');
            mq.keystroke('Backspace');
            assert.equal(cursor[R], 0, 'cursor is at the right end of the root block');
            assert.equal(cursor[L], 0, 'cursor is at the left end of the root block');
            assert.equal(mq.latex(), '');
        });
        suite('empties', function () {
            test('backspace empty exponent', function () {
                mq.latex('x^{}');
                mq.keystroke('Backspace');
                assert.equal(mq.latex(), 'x');
            });
            test('backspace empty sqrt', function () {
                mq.latex('1+\\sqrt{}');
                mq.keystroke('Backspace');
                assert.equal(mq.latex(), '1+');
            });
            test('backspace empty fraction', function () {
                mq.latex('1+\\frac{}{}');
                mq.keystroke('Backspace');
                assert.equal(mq.latex(), '1+');
            });
        });
    });
    suite('charsThatBreakOutOfSupSub', function () {
        var $ = window.test_only_jquery;
        var mq;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                charsThatBreakOutOfSupSub: '+-=<>',
            });
            rootBlock = mq.__controller.root;
            controller = mq.__controller;
            cursor = controller.cursor;
        });
        test('superscript', function () {
            assert.equal(mq.typedText('x^2n+y').latex(), 'x^{2n}+y');
            mq.latex('');
            // Unary operators never break out of exponents.
            assert.equal(mq.typedText('x^+2n').latex(), 'x^{+2n}');
            mq.latex('');
            assert.equal(mq.typedText('x^-2n').latex(), 'x^{-2n}');
            mq.latex('');
            assert.equal(mq.typedText('x^=2n').latex(), 'x^{=2n}');
            mq.latex('');
            // Only break out of exponents if cursor at the end, don't
            // jump from the middle of the exponent out to the right.
            assert.equal(mq.typedText('x^ab').latex(), 'x^{ab}');
            assert.equal(mq.keystroke('Left').typedText('+').latex(), 'x^{a+b}');
            mq.latex('');
        });
        test('subscript', function () {
            assert.equal(mq.typedText('x_2n+y').latex(), 'x_{2n}+y');
            mq.latex('');
            // Unary operators never break out of subscripts.
            assert.equal(mq.typedText('x_+2n').latex(), 'x_{+2n}');
            mq.latex('');
            assert.equal(mq.typedText('x_-2n').latex(), 'x_{-2n}');
            mq.latex('');
            assert.equal(mq.typedText('x_=2n').latex(), 'x_{=2n}');
            mq.latex('');
            // Only break out of exponents if cursor at the end, don't
            // jump from the middle of the exponent out to the right.
            assert.equal(mq.typedText('x_ab').latex(), 'x_{ab}');
            assert.equal(mq.keystroke('Left').typedText('+').latex(), 'x_{a+b}');
            mq.latex('');
        });
    });
    suite('CSS', function () {
        var $ = window.test_only_jquery;
        test("math field doesn't fuck up ancestor's .scrollWidth", function () {
            var container = $('<div>')
                .css({
                fontSize: '16px',
                height: '25px',
                width: '25px',
            })
                .appendTo('#mock')[0];
            assert.equal(container.scrollHeight, 25);
            assert.equal(container.scrollWidth, 25);
            var mq = MQ.MathField($('<span style="box-sizing:border-box;height:100%;width:100%"></span>').appendTo(container)[0]);
            assert.equal(container.scrollHeight, 25);
            assert.equal(container.scrollWidth, 25);
        });
        test('empty root block does not collapse', function () {
            var testEl = $('<span></span>').appendTo('#mock');
            var mq = MQ.MathField(testEl[0]);
            var rootEl = testEl.find('.mq-root-block');
            assert.ok(rootEl.hasClass('mq-empty'), 'Empty root block should have the mq-empty class name.');
            assert.ok(rootEl.height() > 0, 'Empty root block height should be above 0.');
        });
        test('empty block does not collapse', function () {
            var testEl = $('<span>\\frac{}{}</span>').appendTo('#mock');
            var mq = MQ.MathField(testEl[0]);
            var numeratorEl = testEl.find('.mq-numerator');
            assert.ok(numeratorEl.hasClass('mq-empty'), 'Empty numerator should have the mq-empty class name.');
            assert.ok(numeratorEl.height() > 0, 'Empty numerator height should be above 0.');
        });
        test('test florin spacing', function () {
            var mq, mock = $('#mock');
            mq = MQ.MathField($('<span></span>').appendTo(mock)[0]);
            mq.typedText("f'");
            var mqF = $(mq.el()).find('.mq-f');
            var testVal = parseFloat(mqF.css('margin-right')) - parseFloat(mqF.css('margin-left'));
            assert.ok(testVal > 0, 'this should be truthy');
        });
        test('unary PlusMinus before separator', function () {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            mq.latex('(-1,-1-1)-1,(+1;+1+1)+1,(\\pm1,\\pm1\\pm1)\\pm1');
            var spans = $(mq.el()).find('.mq-root-block').find('span');
            assert.equal(spans.length, 35, 'PlusMinus expression parsed incorrectly');
            function isBinaryOperator(i) {
                return $(spans[i]).hasClass('mq-binary-operator');
            }
            function assertBinaryOperator(i, s) {
                assert.ok(isBinaryOperator(i), '"' + s + '" should be binary');
            }
            function assertUnaryOperator(i, s) {
                assert.ok(!isBinaryOperator(i), '"' + s + '" should be unary');
            }
            assertUnaryOperator(1, '(-');
            assertUnaryOperator(4, '(-1,-');
            assertBinaryOperator(6, '(-1,-1-');
            assertBinaryOperator(9, '(-1,-1-1)-');
            assertUnaryOperator(13, '(-1,-1-1)-1,(+');
            assertUnaryOperator(16, '(-1,-1-1)-1,(+1;+');
            assertBinaryOperator(18, '(-1,-1-1)-1,(+1;+1+');
            assertBinaryOperator(21, '(-1,-1-1)-1,(+1;+1+1)+');
            assertUnaryOperator(25, '(-1,-1-1)-1,(+1;+1+1)+1,(pm');
            assertUnaryOperator(28, '(-1,-1-1)-1,(+1;+1+1)+1,(pm1,pm');
            assertBinaryOperator(30, '(-1,-1-1)-1,(+1;+1+1)+1,(pm1,pm1pm');
            assertBinaryOperator(33, '(-1,-1-1)-1,(+1;+1+1)+1,(pm1,pm1pm1)pm');
        });
        test('proper unary/binary within style block', function () {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            mq.latex('\\class{dummy}{-}2\\class{dummy}{+}4');
            var spans = $(mq.el()).find('.mq-root-block').find('span');
            assert.equal(spans.length, 6, 'PlusMinus expression parsed incorrectly');
            function isBinaryOperator(i) {
                return $(spans[i]).hasClass('mq-binary-operator');
            }
            function assertBinaryOperator(i, s) {
                assert.ok(isBinaryOperator(i), '"' + s + '" should be binary');
            }
            function assertUnaryOperator(i, s) {
                assert.ok(!isBinaryOperator(i), '"' + s + '" should be unary');
            }
            assertUnaryOperator(1, '\\class{dummy}{-}');
            assertBinaryOperator(4, '\\class{dummy}{-}2\\class{dummy}{+}');
            mq.latex('\\textcolor{red}{-}2\\textcolor{green}{+}4');
            spans = $(mq.el()).find('.mq-root-block').find('span');
            assert.equal(spans.length, 6, 'PlusMinus expression parsed incorrectly');
            assertUnaryOperator(1, '\\textcolor{red}{-}');
            assertBinaryOperator(4, '\\textcolor{red}{-}2\\textcolor{green}{+}');
            //test recursive depths
            mq.latex('\\textcolor{red}{\\class{dummy}{-}}2\\textcolor{green}{\\class{dummy}{+}}4');
            spans = $(mq.el()).find('.mq-root-block').find('span');
            assert.equal(spans.length, 8, 'PlusMinus expression parsed incorrectly');
            assertUnaryOperator(2, '\\textcolor{red}{\\class{dummy}{-}}');
            assertBinaryOperator(6, '\\textcolor{red}{\\class{dummy}{-}}2\\textcolor{green}{\\class{dummy}{+}}');
        });
        test('operator name spacing e.g. sin x', function () {
            var mq = MQ.MathField($('<span></span>').appendTo(mock)[0]);
            mq.typedText('sin');
            var n = $('#mock var.mq-operator-name:last');
            assert.equal(n.text(), 'n');
            assert.ok(!n.is('.mq-last'));
            mq.typedText('x');
            assert.ok(n.is('.mq-last'));
            mq.keystroke('Left').typedText('(');
            assert.ok(!n.is('.mq-last'));
            mq.keystroke('Backspace').typedText('^');
            assert.ok(!n.is('.mq-last'));
            var supsub = $('#mock .mq-supsub');
            assert.ok(supsub.is('.mq-after-operator-name'));
            mq.typedText('2').keystroke('Tab').typedText('(');
            assert.ok(!supsub.is('.mq-after-operator-name'));
            $(mq.el()).empty();
        });
    });
    suite('Digit Grouping', function () {
        var $ = window.test_only_jquery;
        function buildTreeRecursively($el) {
            var tree = {};
            if ($el[0].className) {
                tree.classes = $el[0].className;
            }
            if ($el[0].className.indexOf('mq-cursor') !== -1) {
                tree.classes = 'mq-cursor';
            }
            else {
                var children = $el.children();
                if (children.length) {
                    tree.content = [];
                    for (var i = 0; i < children.length; i++) {
                        tree.content.push(buildTreeRecursively($(children[i])));
                    }
                }
                else {
                    tree.content = $el[0].innerHTML;
                }
            }
            return tree;
        }
        function assertClasses(mq, expected) {
            var $el = $(mq.el());
            var actual = {
                latex: mq.latex(),
                tree: buildTreeRecursively($el.find('.mq-root-block')),
            };
            window.actual = actual;
            assert.equal(JSON.stringify(actual, null, 2), JSON.stringify(expected, null, 2));
        }
        test('edge cases', function () {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                enableDigitGrouping: true,
            });
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-empty',
                    content: '',
                },
            });
            mq.latex('1\\ ');
            assertClasses(mq, {
                latex: '1\\ ',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            content: '&nbsp;',
                        },
                    ],
                },
            });
            mq.latex('\\ 1');
            assertClasses(mq, {
                latex: '\\ 1',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: '&nbsp;',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                    ],
                },
            });
            mq.latex('\\ 1\\ ');
            assertClasses(mq, {
                latex: '\\ 1\\ ',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: '&nbsp;',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            content: '&nbsp;',
                        },
                    ],
                },
            });
            mq.latex('a');
            assertClasses(mq, {
                latex: 'a',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: 'a',
                        },
                    ],
                },
            });
            mq.latex('a\\ ');
            assertClasses(mq, {
                latex: 'a\\ ',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: 'a',
                        },
                        {
                            content: '&nbsp;',
                        },
                    ],
                },
            });
            mq.latex('\\ a');
            assertClasses(mq, {
                latex: '\\ a',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: '&nbsp;',
                        },
                        {
                            content: 'a',
                        },
                    ],
                },
            });
            mq.latex('a\\ a');
            assertClasses(mq, {
                latex: 'a\\ a',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: 'a',
                        },
                        {
                            content: '&nbsp;',
                        },
                        {
                            content: 'a',
                        },
                    ],
                },
            });
            mq.latex('\\ a\\ ');
            assertClasses(mq, {
                latex: '\\ a\\ ',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: '&nbsp;',
                        },
                        {
                            content: 'a',
                        },
                        {
                            content: '&nbsp;',
                        },
                    ],
                },
            });
            mq.latex('.');
            assertClasses(mq, {
                latex: '.',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                    ],
                },
            });
            mq.latex('.\\ .');
            assertClasses(mq, {
                latex: '.\\ .',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            content: '&nbsp;',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                    ],
                },
            });
            mq.latex('..');
            assertClasses(mq, {
                latex: '..',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                    ],
                },
            });
            mq.latex('2..');
            assertClasses(mq, {
                latex: '2..',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                    ],
                },
            });
            mq.latex('..2');
            assertClasses(mq, {
                latex: '..2',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
            mq.latex('\\ \\ ');
            assertClasses(mq, {
                latex: '\\ \\ ',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: '&nbsp;',
                        },
                        {
                            content: '&nbsp;',
                        },
                    ],
                },
            });
            mq.latex('\\ \\ \\ ');
            assertClasses(mq, {
                latex: '\\ \\ \\ ',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            content: '&nbsp;',
                        },
                        {
                            content: '&nbsp;',
                        },
                        {
                            content: '&nbsp;',
                        },
                    ],
                },
            });
            mq.latex('1234');
            assertClasses(mq, {
                latex: '1234',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit mq-group-leading-1',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '4',
                        },
                    ],
                },
            });
        });
        test('efficient latex updates - grouping enabled', function () {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                enableDigitGrouping: true,
            });
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-empty',
                    content: '',
                },
            });
            mq.latex('1.2322');
            assertClasses(mq, {
                latex: '1.2322',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
            mq.latex('1231.123');
            assertClasses(mq, {
                latex: '1231.123',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit mq-group-leading-1',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                    ],
                },
            });
            mq.latex('1231.432');
            assertClasses(mq, {
                latex: '1231.432',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit mq-group-leading-1',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '4',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
            mq.latex('1231232.432');
            assertClasses(mq, {
                latex: '1231232.432',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit mq-group-leading-1',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '4',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
        });
        test('efficient latex updates - grouping disabled', function () {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-empty',
                    content: '',
                },
            });
            mq.latex('1.2322');
            assertClasses(mq, {
                latex: '1.2322',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
            mq.latex('1231.123');
            assertClasses(mq, {
                latex: '1231.123',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                    ],
                },
            });
            mq.latex('1231.432');
            assertClasses(mq, {
                latex: '1231.432',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '4',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
            mq.latex('1231232.432');
            assertClasses(mq, {
                latex: '1231232.432',
                tree: {
                    classes: 'mq-root-block',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '.',
                        },
                        {
                            classes: 'mq-digit',
                            content: '4',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                    ],
                },
            });
        });
        test('edits ignored if digit grouping disabled', function (done) {
            var mq = MQ.MathField($('<span style="width: 400px; display:inline-block"></span>').appendTo('#mock')[0]);
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-empty',
                    content: '',
                },
            });
            $(mq.el()).find('textarea').focus();
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-hasCursor',
                    content: [
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            mq.typedText('1');
            assertClasses(mq, {
                latex: '1',
                tree: {
                    classes: 'mq-root-block mq-hasCursor',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            mq.typedText('2');
            mq.typedText('3');
            mq.typedText('4');
            assertClasses(mq, {
                latex: '1234',
                tree: {
                    classes: 'mq-root-block mq-hasCursor',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '4',
                        },
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            mq.typedText('5');
            assertClasses(mq, {
                latex: '12345',
                tree: {
                    classes: 'mq-root-block mq-hasCursor',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit',
                            content: '4',
                        },
                        {
                            classes: 'mq-digit',
                            content: '5',
                        },
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            setTimeout(function () {
                assertClasses(mq, {
                    latex: '12345',
                    tree: {
                        classes: 'mq-root-block mq-hasCursor',
                        content: [
                            {
                                classes: 'mq-digit',
                                content: '1',
                            },
                            {
                                classes: 'mq-digit',
                                content: '2',
                            },
                            {
                                classes: 'mq-digit',
                                content: '3',
                            },
                            {
                                classes: 'mq-digit',
                                content: '4',
                            },
                            {
                                classes: 'mq-digit',
                                content: '5',
                            },
                            {
                                classes: 'mq-cursor',
                            },
                        ],
                    },
                });
                mq.keystroke('Left');
                assertClasses(mq, {
                    latex: '12345',
                    tree: {
                        classes: 'mq-root-block mq-hasCursor',
                        content: [
                            {
                                classes: 'mq-digit',
                                content: '1',
                            },
                            {
                                classes: 'mq-digit',
                                content: '2',
                            },
                            {
                                classes: 'mq-digit',
                                content: '3',
                            },
                            {
                                classes: 'mq-digit',
                                content: '4',
                            },
                            {
                                classes: 'mq-cursor',
                            },
                            {
                                classes: 'mq-digit',
                                content: '5',
                            },
                        ],
                    },
                });
                mq.keystroke('Backspace');
                assertClasses(mq, {
                    latex: '1235',
                    tree: {
                        classes: 'mq-root-block mq-hasCursor',
                        content: [
                            {
                                classes: 'mq-digit',
                                content: '1',
                            },
                            {
                                classes: 'mq-digit',
                                content: '2',
                            },
                            {
                                classes: 'mq-digit',
                                content: '3',
                            },
                            {
                                classes: 'mq-cursor',
                            },
                            {
                                classes: 'mq-digit',
                                content: '5',
                            },
                        ],
                    },
                });
                $(mq.el()).find('textarea').blur();
                setTimeout(function () {
                    assertClasses(mq, {
                        latex: '1235',
                        tree: {
                            classes: 'mq-root-block',
                            content: [
                                {
                                    classes: 'mq-digit',
                                    content: '1',
                                },
                                {
                                    classes: 'mq-digit',
                                    content: '2',
                                },
                                {
                                    classes: 'mq-digit',
                                    content: '3',
                                },
                                {
                                    classes: 'mq-digit',
                                    content: '5',
                                },
                            ],
                        },
                    });
                    done();
                }, 1);
            }, 1100); // should stop suppressing grouping after 1000ms
        });
        test('edits suppress digit grouping', function (done) {
            var mq = MQ.MathField($('<span style="width: 400px; display:inline-block"></span>').appendTo('#mock')[0], { enableDigitGrouping: true });
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-empty',
                    content: '',
                },
            });
            $(mq.el()).find('textarea').focus();
            assertClasses(mq, {
                latex: '',
                tree: {
                    classes: 'mq-root-block mq-hasCursor',
                    content: [
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            mq.typedText('1');
            assertClasses(mq, {
                latex: '1',
                tree: {
                    classes: 'mq-root-block mq-hasCursor mq-suppress-grouping',
                    content: [
                        {
                            classes: 'mq-digit',
                            content: '1',
                        },
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            mq.typedText('2');
            mq.typedText('3');
            mq.typedText('4');
            assertClasses(mq, {
                latex: '1234',
                tree: {
                    classes: 'mq-root-block mq-hasCursor mq-suppress-grouping',
                    content: [
                        {
                            classes: 'mq-digit mq-group-leading-1',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '4',
                        },
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            mq.typedText('5');
            assertClasses(mq, {
                latex: '12345',
                tree: {
                    classes: 'mq-root-block mq-hasCursor mq-suppress-grouping',
                    content: [
                        {
                            classes: 'mq-digit mq-group-leading-2',
                            content: '1',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '2',
                        },
                        {
                            classes: 'mq-digit mq-group-start',
                            content: '3',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '4',
                        },
                        {
                            classes: 'mq-digit mq-group-other',
                            content: '5',
                        },
                        {
                            classes: 'mq-cursor',
                        },
                    ],
                },
            });
            setTimeout(function () {
                assertClasses(mq, {
                    latex: '12345',
                    tree: {
                        classes: 'mq-root-block mq-hasCursor',
                        content: [
                            {
                                classes: 'mq-digit mq-group-leading-2',
                                content: '1',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '2',
                            },
                            {
                                classes: 'mq-digit mq-group-start',
                                content: '3',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '4',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '5',
                            },
                            {
                                classes: 'mq-cursor',
                            },
                        ],
                    },
                });
                mq.keystroke('Left');
                assertClasses(mq, {
                    latex: '12345',
                    tree: {
                        classes: 'mq-root-block mq-hasCursor',
                        content: [
                            {
                                classes: 'mq-digit mq-group-leading-2',
                                content: '1',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '2',
                            },
                            {
                                classes: 'mq-digit mq-group-start',
                                content: '3',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '4',
                            },
                            {
                                classes: 'mq-cursor',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '5',
                            },
                        ],
                    },
                });
                mq.keystroke('Backspace');
                assertClasses(mq, {
                    latex: '1235',
                    tree: {
                        classes: 'mq-root-block mq-hasCursor mq-suppress-grouping',
                        content: [
                            {
                                classes: 'mq-digit mq-group-leading-1',
                                content: '1',
                            },
                            {
                                classes: 'mq-digit mq-group-start',
                                content: '2',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '3',
                            },
                            {
                                classes: 'mq-cursor',
                            },
                            {
                                classes: 'mq-digit mq-group-other',
                                content: '5',
                            },
                        ],
                    },
                });
                $(mq.el()).find('textarea').blur();
                setTimeout(function () {
                    assertClasses(mq, {
                        latex: '1235',
                        tree: {
                            classes: 'mq-root-block',
                            content: [
                                {
                                    classes: 'mq-digit mq-group-leading-1',
                                    content: '1',
                                },
                                {
                                    classes: 'mq-digit mq-group-start',
                                    content: '2',
                                },
                                {
                                    classes: 'mq-digit mq-group-other',
                                    content: '3',
                                },
                                {
                                    classes: 'mq-digit mq-group-other',
                                    content: '5',
                                },
                            ],
                        },
                    });
                    done();
                }, 1);
            }, 1100); // should stop suppressing grouping after 1000ms
        });
    });
    suite('focusBlur', function () {
        var $ = window.test_only_jquery;
        function assertHasFocus(mq, name, invert) {
            assert.ok(!!invert ^ ($(mq.el()).find('textarea')[0] === document.activeElement), name + (invert ? ' does not have focus' : ' has focus'));
        }
        suite('handlers can shift focus away', function () {
            var mq, mq2, wasUpOutOfCalled;
            setup(function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                    handlers: {
                        upOutOf: function () {
                            wasUpOutOfCalled = true;
                            mq2.focus();
                        },
                    },
                });
                mq2 = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
                wasUpOutOfCalled = false;
            });
            function triggerUpOutOf(mq) {
                trigger.keydown(mq.el().querySelector('textarea'), 'ArrowUp');
                assert.ok(wasUpOutOfCalled);
            }
            test('normally', function () {
                mq.focus();
                assertHasFocus(mq, 'mq');
                triggerUpOutOf(mq);
                assertHasFocus(mq2, 'mq2');
            });
            test("even if there's a selection", function (done) {
                mq.focus();
                assertHasFocus(mq, 'mq');
                mq.typedText('asdf');
                assert.equal(mq.latex(), 'asdf');
                mq.keystroke('Shift-Left');
                setTimeout(function () {
                    assert.equal($(mq.el()).find('textarea').val(), 'f');
                    triggerUpOutOf(mq);
                    assertHasFocus(mq2, 'mq2');
                    done();
                });
            });
        });
        test('select behaves normally after blurring and re-focusing', function (done) {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            mq.focus();
            assertHasFocus(mq, 'mq');
            mq.typedText('asdf');
            assert.equal(mq.latex(), 'asdf');
            mq.keystroke('Shift-Left');
            setTimeout(function () {
                assert.equal($(mq.el()).find('textarea').val(), 'f');
                mq.blur();
                assertHasFocus(mq, 'mq', 'not');
                setTimeout(function () {
                    assert.equal($(mq.el()).find('textarea').val(), '');
                    mq.focus();
                    assertHasFocus(mq, 'mq');
                    mq.keystroke('Shift-Left');
                    setTimeout(function () {
                        assert.equal($(mq.el()).find('textarea').val(), 'd');
                        done();
                    });
                }, 100);
            });
        });
        test('blur event fired when math field loses focus', function (done) {
            var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            mq.focus();
            assertHasFocus(mq, 'math field');
            var textarea = $('<textarea>').appendTo('#mock').focus();
            assert.ok(textarea[0] === document.activeElement, 'textarea has focus');
            setTimeout(function () {
                assert.ok(!$(mq.el()).hasClass('mq-focused'), 'math field is visibly blurred');
                $('#mock').empty();
                done();
            });
        });
    });
    suite('latex', function () {
        var $ = window.test_only_jquery;
        function assertParsesLatex(str, latex) {
            if (arguments.length < 2)
                latex = str;
            var result = latexMathParser
                .parse(str)
                .postOrder(function (node) {
                node.finalizeTree(Options.prototype);
            })
                .join('latex');
            assert.equal(result, latex, "parsing '" + str + "', got '" + result + "', expected '" + latex + "'");
        }
        test('empty LaTeX', function () {
            assertParsesLatex('');
            assertParsesLatex(' ', '');
            assertParsesLatex('{}', '');
            assertParsesLatex('   {}{} {{{}}  }', '');
        });
        test('variables', function () {
            assertParsesLatex('xyz');
        });
        test('variables that can be mathbb', function () {
            assertParsesLatex('PNZQRCH');
        });
        test('can parse mathbb symbols', function () {
            assertParsesLatex('\\P\\N\\Z\\Q\\R\\C\\H', '\\mathbb{P}\\mathbb{N}\\mathbb{Z}\\mathbb{Q}\\mathbb{R}\\mathbb{C}\\mathbb{H}');
            assertParsesLatex('\\mathbb{P}\\mathbb{N}\\mathbb{Z}\\mathbb{Q}\\mathbb{R}\\mathbb{C}\\mathbb{H}');
        });
        test('can parse mathbb error case', function () {
            assert.throws(function () {
                assertParsesLatex('\\mathbb + 2');
            });
            assert.throws(function () {
                assertParsesLatex('\\mathbb{A}');
            });
        });
        test('simple exponent', function () {
            assertParsesLatex('x^{n}');
        });
        test('block exponent', function () {
            assertParsesLatex('x^{n}', 'x^{n}');
            assertParsesLatex('x^{nm}');
            assertParsesLatex('x^{}', 'x^{ }');
        });
        test('nested exponents', function () {
            assertParsesLatex('x^{n^{m}}');
        });
        test('exponents with spaces', function () {
            assertParsesLatex('x^ 2', 'x^{2}');
            assertParsesLatex('x ^2', 'x^{2}');
        });
        test('inner groups', function () {
            assertParsesLatex('a{bc}d', 'abcd');
            assertParsesLatex('{bc}d', 'bcd');
            assertParsesLatex('a{bc}', 'abc');
            assertParsesLatex('{bc}', 'bc');
            assertParsesLatex('x^{a{bc}d}', 'x^{abcd}');
            assertParsesLatex('x^{a{bc}}', 'x^{abc}');
            assertParsesLatex('x^{{bc}}', 'x^{bc}');
            assertParsesLatex('x^{{bc}d}', 'x^{bcd}');
            assertParsesLatex('{asdf{asdf{asdf}asdf}asdf}', 'asdfasdfasdfasdfasdf');
        });
        test('commands without braces', function () {
            assertParsesLatex('\\frac12', '\\frac{1}{2}');
            assertParsesLatex('\\frac1a', '\\frac{1}{a}');
            assertParsesLatex('\\frac ab', '\\frac{a}{b}');
            assertParsesLatex('\\frac a b', '\\frac{a}{b}');
            assertParsesLatex(' \\frac a b ', '\\frac{a}{b}');
            assertParsesLatex('\\frac{1} 2', '\\frac{1}{2}');
            assertParsesLatex('\\frac{ 1 } 2', '\\frac{1}{2}');
            assert.throws(function () {
                latexMathParser.parse('\\frac');
            });
        });
        test('whitespace', function () {
            assertParsesLatex('  a + b ', 'a+b');
            assertParsesLatex('       ', '');
            assertParsesLatex('', '');
        });
        test('parens', function () {
            var tree = latexMathParser.parse('\\left(123\\right)');
            assert.ok(tree.ends[L] instanceof Bracket);
            var contents = tree.ends[L].ends[L].join('latex');
            assert.equal(contents, '123');
            assert.equal(tree.join('latex'), '\\left(123\\right)');
        });
        test('\\langle/\\rangle (issue #508)', function () {
            var tree = latexMathParser.parse('\\left\\langle 123\\right\\rangle)');
            assert.ok(tree.ends[L] instanceof Bracket);
            var contents = tree.ends[L].ends[L].join('latex');
            assert.equal(contents, '123');
            assert.equal(tree.join('latex'), '\\left\\langle 123\\right\\rangle )');
        });
        test('\\langle/\\rangle (without whitespace)', function () {
            var tree = latexMathParser.parse('\\left\\langle123\\right\\rangle)');
            assert.ok(tree.ends[L] instanceof Bracket);
            var contents = tree.ends[L].ends[L].join('latex');
            assert.equal(contents, '123');
            assert.equal(tree.join('latex'), '\\left\\langle 123\\right\\rangle )');
        });
        test('\\lVert/\\rVert', function () {
            var tree = latexMathParser.parse('\\left\\lVert 123\\right\\rVert)');
            assert.ok(tree.ends[L] instanceof Bracket);
            var contents = tree.ends[L].ends[L].join('latex');
            assert.equal(contents, '123');
            assert.equal(tree.join('latex'), '\\left\\lVert 123\\right\\rVert )');
        });
        test('\\lVert/\\rVert (without whitespace)', function () {
            var tree = latexMathParser.parse('\\left\\lVert123\\right\\rVert)');
            assert.ok(tree.ends[L] instanceof Bracket);
            var contents = tree.ends[L].ends[L].join('latex');
            assert.equal(contents, '123');
            assert.equal(tree.join('latex'), '\\left\\lVert 123\\right\\rVert )');
        });
        test('\\langler should not parse', function () {
            assert.throws(function () {
                latexMathParser.parse('\\left\\langler123\\right\\rangler');
            });
        });
        test('\\lVerte should not parse', function () {
            assert.throws(function () {
                latexMathParser.parse('\\left\\lVerte123\\right\\rVerte');
            });
        });
        test('parens with whitespace', function () {
            assertParsesLatex('\\left ( 123 \\right ) ', '\\left(123\\right)');
        });
        test('escaped whitespace', function () {
            assertParsesLatex('\\ ', '\\ ');
            assertParsesLatex('\\      ', '\\ ');
            assertParsesLatex('  \\   \\\t\t\t\\   \\\n\n\n', '\\ \\ \\ \\ ');
            assertParsesLatex('\\space\\   \\   space  ', '\\ \\ \\ space');
        });
        test('\\text', function () {
            assertParsesLatex('\\text { lol! } ', '\\text{ lol! }');
            assertParsesLatex('\\text{apples} \\ne \\text{oranges}', '\\text{apples}\\ne \\text{oranges}');
            assertParsesLatex('\\text{}', '');
        });
        test('\\textcolor', function () {
            assertParsesLatex('\\textcolor{blue}{8}', '\\textcolor{blue}{8}');
        });
        test('\\class', function () {
            assertParsesLatex('\\class{name}{8}', '\\class{name}{8}');
            assertParsesLatex('\\class{name}{8-4}', '\\class{name}{8-4}');
        });
        test('not real LaTex commands, but valid symbols', function () {
            assertParsesLatex('\\parallelogram ');
            assertParsesLatex('\\circledot ', '\\odot ');
            assertParsesLatex('\\degree ');
            assertParsesLatex('\\square ');
        });
        suite('public API', function () {
            var mq;
            setup(function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            });
            suite('.latex(...)', function () {
                function assertParsesLatex(str, latex) {
                    if (arguments.length < 2)
                        latex = str;
                    mq.latex(str);
                    assert.equal(mq.latex(), latex);
                }
                test('basic rendering', function () {
                    assertParsesLatex('x = \\frac{ -b \\pm \\sqrt{ b^2 - 4ac } }{ 2a }', 'x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}');
                });
                test('re-rendering', function () {
                    assertParsesLatex('a x^2 + b x + c = 0', 'ax^{2}+bx+c=0');
                    assertParsesLatex('x = \\frac{ -b \\pm \\sqrt{ b^2 - 4ac } }{ 2a }', 'x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}');
                });
                test('empty LaTeX', function () {
                    assertParsesLatex('');
                    assertParsesLatex(' ', '');
                    assertParsesLatex('{}', '');
                    assertParsesLatex('   {}{} {{{}}  }', '');
                });
                test('coerces to a string', function () {
                    assertParsesLatex(undefined, 'undefined');
                    assertParsesLatex(null, 'null');
                    assertParsesLatex(0, '0');
                    assertParsesLatex(Infinity, 'Infinity');
                    assertParsesLatex(NaN, 'NaN');
                    assertParsesLatex(true, 'true');
                    assertParsesLatex(false, 'false');
                    assertParsesLatex({}, '[objectObject]'); // lol, the space gets ignored
                    assertParsesLatex({
                        toString: function () {
                            return 'thing';
                        },
                    }, 'thing');
                });
            });
            suite('.write(...)', function () {
                test('empty LaTeX', function () {
                    function assertParsesLatex(str, latex) {
                        if (arguments.length < 2)
                            latex = str;
                        mq.write(str);
                        assert.equal(mq.latex(), latex);
                    }
                    assertParsesLatex('');
                    assertParsesLatex(' ', '');
                    assertParsesLatex('{}', '');
                    assertParsesLatex('   {}{} {{{}}  }', '');
                });
                test('overflow triggers automatic horizontal scroll', function (done) {
                    var mqEl = mq.el();
                    var rootEl = mq.__controller.root.domFrag().oneElement();
                    var cursor = mq.__controller.cursor;
                    $(mqEl).width(10);
                    var previousScrollLeft = rootEl.scrollLeft;
                    mq.write('abc');
                    setTimeout(afterScroll, 150);
                    function afterScroll() {
                        cursor.show();
                        try {
                            assert.ok(rootEl.scrollLeft > previousScrollLeft, 'scrolls on write');
                            assert.ok(mqEl.getBoundingClientRect().right >
                                cursor.domFrag().firstElement().getBoundingClientRect().right, 'cursor right end is inside the field');
                        }
                        catch (error) {
                            done(error);
                            return;
                        }
                        done();
                    }
                });
                suite('\\sum', function () {
                    test('basic', function () {
                        mq.write('\\sum_{n=0}^5');
                        assert.equal(mq.latex(), '\\sum_{n=0}^{5}');
                        mq.write('x^n');
                        assert.equal(mq.latex(), '\\sum_{n=0}^{5}x^{n}');
                    });
                    test('only lower bound', function () {
                        mq.write('\\sum_{n=0}');
                        assert.equal(mq.latex(), '\\sum_{n=0}^{ }');
                        mq.write('x^n');
                        assert.equal(mq.latex(), '\\sum_{n=0}^{ }x^{n}');
                    });
                    test('only upper bound', function () {
                        mq.write('\\sum^5');
                        assert.equal(mq.latex(), '\\sum_{ }^{5}');
                        mq.write('x^n');
                        assert.equal(mq.latex(), '\\sum_{ }^{5}x^{n}');
                    });
                });
                suite('\\token', function () {
                    test('parsing and serializing', function () {
                        mq.latex('\\token{12}');
                        assert.equal(mq.latex(), '\\token{12}');
                    });
                });
            });
            suite('.selection()', function () {
                function assertSelection(str, expected, commands) {
                    mq.latex(str);
                    commands.split(' ').forEach(function (cmd) {
                        if (!cmd)
                            return;
                        switch (cmd) {
                            case 'Blur':
                                mq.blur();
                                break;
                            case 'Start':
                                mq.keystroke('Ctrl-Home');
                                break;
                            default:
                                mq.keystroke(cmd);
                        }
                    });
                    var expectedLatex = expected.replace(/[|]/g, '');
                    var expectedStart = expected.indexOf('|');
                    var expectedEnd = expected.lastIndexOf('|');
                    if (expectedStart !== expectedEnd) {
                        expectedEnd -= 1; // ignore the first | character insertted into our expectation of a selection
                    }
                    var sel = mq.selection();
                    var actualFormattedParts = sel.latex.split('');
                    if (sel.startIndex !== -1) {
                        if (sel.endIndex > sel.startIndex) {
                            actualFormattedParts.splice(sel.endIndex, 0, '|');
                        }
                        actualFormattedParts.splice(sel.startIndex, 0, '|');
                    }
                    var actualFormattedLatex = actualFormattedParts.join('');
                    //if (expected !== actualFormattedLatex) debugger;
                    assert.equal(expected, actualFormattedLatex, 'formatted latex');
                    assert.equal(sel.latex, expectedLatex, 'actual latex');
                    // if (sel.startIndex !== expectedStart) debugger;
                    assert.equal(sel.startIndex, expectedStart, 'start position');
                    assert.equal(sel.endIndex, expectedEnd, 'end position');
                }
                function executeCases(cases, startKeys, repeatKey) {
                    for (var latex in cases) {
                        var keys = startKeys.slice();
                        cases[latex].forEach(function (_case) {
                            assertSelection(latex, _case, keys.join(' '));
                            keys.push(repeatKey);
                        });
                    }
                }
                test('not focused still returns default cursor position', function () {
                    assertSelection('', '|', 'Blur');
                    assertSelection(' ', '|', 'Blur');
                    assertSelection('{}', '|', 'Blur');
                    assertSelection('   {}{} {{{}}  }', '|', 'Blur');
                    assertSelection('y=2', 'y=2|', 'Blur');
                    assertSelection('\\frac{d}{dx}\\sqrt{x}=', '\\frac{d}{dx}\\sqrt{x}=|', 'Blur');
                });
                test('move cursor left from end', function () {
                    var cases = {
                        '': ['|', '|'],
                        '   {}{} {{{}}  }': ['|', '|'],
                        'y=2': ['y=2|', 'y=|2', 'y|=2', '|y=2', '|y=2'],
                        '\\frac{d}{dx}\\sqrt{x}=': [
                            '\\frac{d}{dx}\\sqrt{x}=|',
                            '\\frac{d}{dx}\\sqrt{x}|=',
                            '\\frac{d}{dx}\\sqrt{x|}=',
                            '\\frac{d}{dx}\\sqrt{|x}=',
                            '\\frac{d}{dx}|\\sqrt{x}=',
                            '\\frac{d}{dx|}\\sqrt{x}=',
                            '\\frac{d}{d|x}\\sqrt{x}=',
                            '\\frac{d}{|dx}\\sqrt{x}=',
                            '\\frac{d|}{dx}\\sqrt{x}=',
                            '\\frac{|d}{dx}\\sqrt{x}=',
                            '|\\frac{d}{dx}\\sqrt{x}=',
                            '|\\frac{d}{dx}\\sqrt{x}=',
                        ],
                    };
                    executeCases(cases, [], 'Left');
                });
                test('move cursor right from start', function () {
                    var cases = {
                        '': ['|', '|'],
                        '   {}{} {{{}}  }': ['|', '|'],
                        'y=2': ['|y=2', 'y|=2', 'y=|2', 'y=2|', 'y=2|'],
                        '\\frac{d}{dx}\\sqrt{x}=': [
                            '|\\frac{d}{dx}\\sqrt{x}=',
                            '\\frac{|d}{dx}\\sqrt{x}=',
                            '\\frac{d|}{dx}\\sqrt{x}=',
                            '\\frac{d}{|dx}\\sqrt{x}=',
                            '\\frac{d}{d|x}\\sqrt{x}=',
                            '\\frac{d}{dx|}\\sqrt{x}=',
                            '\\frac{d}{dx}|\\sqrt{x}=',
                            '\\frac{d}{dx}\\sqrt{|x}=',
                            '\\frac{d}{dx}\\sqrt{x|}=',
                            '\\frac{d}{dx}\\sqrt{x}|=',
                            '\\frac{d}{dx}\\sqrt{x}=|',
                            '\\frac{d}{dx}\\sqrt{x}=|',
                        ],
                    };
                    executeCases(cases, ['Start'], 'Right');
                });
                test('shift select leftward', function () {
                    var cases = {
                        '': ['|', '|'],
                        '   {}{} {{{}}  }': ['|', '|'],
                        'y=2': ['y=2|', 'y=|2|', 'y|=2|', '|y=2|', '|y=2|'],
                        '\\frac{d}{dx}\\sqrt{x}=': [
                            '\\frac{d}{dx}\\sqrt{x}=|',
                            '\\frac{d}{dx}\\sqrt{x}|=|',
                            '\\frac{d}{dx}|\\sqrt{x}=|',
                            '|\\frac{d}{dx}\\sqrt{x}=|',
                            '|\\frac{d}{dx}\\sqrt{x}=|',
                        ],
                    };
                    executeCases(cases, [], 'Shift-Left');
                });
                test('shift select rightward', function () {
                    var cases = {
                        '': ['|', '|'],
                        '   {}{} {{{}}  }': ['|', '|'],
                        'y=2': ['|y=2', '|y|=2', '|y=|2', '|y=2|', '|y=2|'],
                        '\\frac{d}{dx}\\sqrt{x}=': [
                            '|\\frac{d}{dx}\\sqrt{x}=',
                            '|\\frac{d}{dx}|\\sqrt{x}=',
                            '|\\frac{d}{dx}\\sqrt{x}|=',
                            '|\\frac{d}{dx}\\sqrt{x}=|',
                            '|\\frac{d}{dx}\\sqrt{x}=|',
                        ],
                    };
                    executeCases(cases, ['Start'], 'Shift-Right');
                });
                test('still cleans the latex', function () {
                    var leftCases = {
                        '\\sin\\cos': [
                            '\\sin\\cos|',
                            '\\sin\\co|s',
                            '\\sin\\c|os',
                            '\\sin|\\cos',
                            '\\si|n\\cos',
                            '\\s|in\\cos',
                            '|\\sin\\cos',
                        ],
                        '\\sin\\left(\\right)': [
                            '\\sin\\left(\\right)|',
                            '\\sin\\left(|\\right)',
                            '\\sin|\\left(\\right)',
                            '\\si|n\\left(\\right)',
                            '\\s|in\\left(\\right)',
                            '|\\sin\\left(\\right)',
                        ],
                        '\\sum _{n=0}^{100}': [
                            '\\sum_{n=0}^{100}|',
                            '\\sum_{n=0}^{100|}',
                            '\\sum_{n=0}^{10|0}',
                            '\\sum_{n=0}^{1|00}',
                            '\\sum_{n=0}^{|100}',
                            '\\sum_{n=0|}^{100}',
                            '\\sum_{n=|0}^{100}',
                            '\\sum_{n|=0}^{100}',
                            '\\sum_{|n=0}^{100}',
                            '|\\sum_{n=0}^{100}',
                        ],
                    };
                    var leftShiftCases = {
                        '\\sin\\left(\\right)': [
                            '\\sin\\left(\\right)|',
                            '\\sin|\\left(\\right)|',
                            '\\si|n\\left(\\right)|',
                            '\\s|in\\left(\\right)|',
                            '|\\sin\\left(\\right)|',
                        ],
                        '\\sum _{n=0}^{100}': ['\\sum_{n=0}^{100}|', '|\\sum_{n=0}^{100}|'],
                    };
                    var rightShiftCases = {
                        '\\sin\\left(\\right)': [
                            '|\\sin\\left(\\right)',
                            '|\\s|in\\left(\\right)',
                            '|\\si|n\\left(\\right)',
                            '|\\sin|\\left(\\right)',
                            '|\\sin\\left(\\right)|',
                        ],
                    };
                    var twoShiftLeftCases = {
                        '\\sin\\cos': [
                            '\\sin\\c|os',
                            '\\sin|\\c|os',
                            '\\si|n\\c|os',
                            '\\s|in\\c|os',
                            '|\\sin\\c|os',
                        ],
                        '\\sin\\cos+': [
                            '\\sin\\co|s+',
                            '\\sin\\c|o|s+',
                            '\\sin|\\co|s+',
                            '\\si|n\\co|s+',
                            '\\s|in\\co|s+',
                            '|\\sin\\co|s+',
                        ],
                        '\\sin\\cos+\\sin\\cos': [
                            '\\sin\\cos+\\sin\\c|os',
                            '\\sin\\cos+\\sin|\\c|os',
                            '\\sin\\cos+\\si|n\\c|os',
                            '\\sin\\cos+\\s|in\\c|os',
                            '\\sin\\cos+|\\sin\\c|os',
                            '\\sin\\cos|+\\sin\\c|os',
                            '\\sin\\co|s+\\sin\\c|os',
                        ],
                    };
                    var fourShiftLeftCases = {
                        '\\sin\\cos': ['\\si|n\\cos', '\\s|i|n\\cos', '|\\si|n\\cos'],
                        '\\sin\\cos+': [
                            '\\sin|\\cos+',
                            '\\si|n|\\cos+',
                            '\\s|in|\\cos+',
                            '|\\sin|\\cos+',
                        ],
                        '\\sin\\cos+\\sin\\cos': [
                            '\\sin\\cos+\\si|n\\cos',
                            '\\sin\\cos+\\s|i|n\\cos',
                            '\\sin\\cos+|\\si|n\\cos',
                            '\\sin\\cos|+\\si|n\\cos',
                            '\\sin\\co|s+\\si|n\\cos',
                            '\\sin\\c|os+\\si|n\\cos',
                            '\\sin|\\cos+\\si|n\\cos',
                            '\\si|n\\cos+\\si|n\\cos',
                            '\\s|in\\cos+\\si|n\\cos',
                            '|\\sin\\cos+\\si|n\\cos',
                        ],
                    };
                    executeCases(leftCases, [], 'Left');
                    executeCases(leftShiftCases, [], 'Shift-Left');
                    executeCases(rightShiftCases, ['Start'], 'Shift-Right');
                    executeCases(twoShiftLeftCases, ['Left Left'], 'Shift-Left');
                    executeCases(fourShiftLeftCases, ['Left Left Left Left'], 'Shift-Left');
                });
            });
        });
        suite('\\MathQuillMathField', function () {
            var outer, inner1, inner2;
            setup(function () {
                outer = MQ.StaticMath($('<span>\\frac{\\MathQuillMathField{x_0 + x_1 + x_2}}{\\MathQuillMathField{3}}</span>').appendTo('#mock')[0]);
                inner1 = outer.innerFields[0];
                inner2 = outer.innerFields[1];
            });
            test('initial latex', function () {
                assert.equal(inner1.latex(), 'x_{0}+x_{1}+x_{2}');
                assert.equal(inner2.latex(), '3');
                assert.equal(outer.latex(), '\\frac{x_{0}+x_{1}+x_{2}}{3}');
            });
            test('setting latex', function () {
                inner1.latex('\\sum_{i=0}^N x_i');
                inner2.latex('N');
                assert.equal(inner1.latex(), '\\sum_{i=0}^{N}x_{i}');
                assert.equal(inner2.latex(), 'N');
                assert.equal(outer.latex(), '\\frac{\\sum_{i=0}^{N}x_{i}}{N}');
            });
            test('writing latex', function () {
                inner1.write('+ x_3');
                inner2.write('+ 1');
                assert.equal(inner1.latex(), 'x_{0}+x_{1}+x_{2}+x_{3}');
                assert.equal(inner2.latex(), '3+1');
                assert.equal(outer.latex(), '\\frac{x_{0}+x_{1}+x_{2}+x_{3}}{3+1}');
            });
            test('optional inner field name', function () {
                outer.latex('\\MathQuillMathField[mantissa]{}\\cdot\\MathQuillMathField[base]{}^{\\MathQuillMathField[exp]{}}');
                assert.equal(outer.innerFields.length, 3);
                var mantissa = outer.innerFields.mantissa;
                var base = outer.innerFields.base;
                var exp = outer.innerFields.exp;
                assert.equal(mantissa, outer.innerFields[0]);
                assert.equal(base, outer.innerFields[1]);
                assert.equal(exp, outer.innerFields[2]);
                mantissa.latex('1.2345');
                base.latex('10');
                exp.latex('8');
                assert.equal(outer.latex(), '1.2345\\cdot10^{8}');
            });
            test('make inner field static and then editable', function () {
                outer.latex('y=\\MathQuillMathField[m]{\\textcolor{blue}{m}}x+\\MathQuillMathField[b]{b}');
                assert.equal(outer.innerFields.length, 2);
                // assert.equal(outer.innerFields.m.__controller.container, false);
                outer.innerFields.m.makeStatic();
                assert.equal(outer.innerFields.m.__controller.editable, false);
                assert.equal(domFrag(outer.innerFields.m.__controller.container).hasClass('mq-editable-field'), false);
                assert.equal(outer.innerFields.b.__controller.editable, true);
                //ensure no errors in making static field static
                outer.innerFields.m.makeStatic();
                assert.equal(outer.innerFields.m.__controller.editable, false);
                assert.equal(domFrag(outer.innerFields.m.__controller.container).hasClass('mq-editable-field'), false);
                assert.equal(outer.innerFields.b.__controller.editable, true);
                outer.innerFields.m.makeEditable();
                assert.equal(outer.innerFields.m.__controller.editable, true);
                assert.equal(domFrag(outer.innerFields.m.__controller.container).hasClass('mq-editable-field'), true);
                assert.equal(outer.innerFields.b.__controller.editable, true);
                //ensure no errors with making editable field editable
                outer.innerFields.m.makeEditable();
                assert.equal(outer.innerFields.m.__controller.editable, true);
                assert.equal(domFrag(outer.innerFields.m.__controller.container).hasClass('mq-editable-field'), true);
                assert.equal(outer.innerFields.b.__controller.editable, true);
            });
            test('separate API object', function () {
                var outer2 = MQ(outer.el());
                assert.equal(outer2.innerFields.length, 2);
                assert.equal(outer2.innerFields[0].id, inner1.id);
                assert.equal(outer2.innerFields[1].id, inner2.id);
            });
        });
        suite('error handling', function () {
            var mq;
            setup(function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            });
            function testCantParse(title /*, latex...*/) {
                var latex = [].slice.call(arguments, 1);
                test(title, function () {
                    for (var i = 0; i < latex.length; i += 1) {
                        mq.latex(latex[i]);
                        assert.equal(mq.latex(), '', "shouldn't parse '" + latex[i] + "'");
                    }
                });
            }
            testCantParse('missing blocks', '\\frac', '\\sqrt', '^', '_');
            testCantParse('unmatched close brace', '}', ' 1 + 2 } ', '1 - {2 + 3} }', '\\sqrt{ x }} + \\sqrt{y}');
            testCantParse('unmatched open brace', '{', '1 * { 2 + 3', '\\frac{ \\sqrt x }{{ \\sqrt y}');
            testCantParse('unmatched \\left/\\right', '\\left ( 1 + 2 )', ' [ 1, 2 \\right ]');
            testCantParse('langlerfish/ranglerfish (checking for confusion with langle/rangle)', '\\left\\langlerfish 123\\right\\ranglerfish)');
        });
    });
    suite('parser', function () {
        var $ = window.test_only_jquery;
        var string = Parser.string;
        var regex = Parser.regex;
        var letter = Parser.letter;
        var digit = Parser.digit;
        var any = Parser.any;
        var optWhitespace = Parser.optWhitespace;
        var eof = Parser.eof;
        var succeed = Parser.succeed;
        var all = Parser.all;
        test('Parser.string', function () {
            var parser = string('x');
            assert.equal(parser.parse('x'), 'x');
            assert.throws(function () {
                parser.parse('y');
            });
        });
        test('Parser.regex', function () {
            var parser = regex(/^[0-9]/);
            assert.equal(parser.parse('1'), '1');
            assert.equal(parser.parse('4'), '4');
            assert.throws(function () {
                parser.parse('x');
            });
            assert.throws(function () {
                regex(/./);
            }, 'must be anchored');
        });
        suite('then', function () {
            test('with a parser, uses the last return value', function () {
                var parser = string('x').then(string('y'));
                assert.equal(parser.parse('xy'), 'y');
                assert.throws(function () {
                    parser.parse('y');
                });
                assert.throws(function () {
                    parser.parse('xz');
                });
            });
            test('asserts that a parser is returned', function () {
                var parser1 = letter.then(function () {
                    return 'not a parser';
                });
                assert.throws(function () {
                    parser1.parse('x');
                });
                var parser2 = letter.then('x');
                assert.throws(function () {
                    letter.parse('xx');
                });
            });
            test('with a function that returns a parser, continues with that parser', function () {
                var piped;
                var parser = string('x').then(function (x) {
                    piped = x;
                    return string('y');
                });
                assert.equal(parser.parse('xy'), 'y');
                assert.equal(piped, 'x');
                assert.throws(function () {
                    parser.parse('x');
                });
            });
        });
        suite('map', function () {
            test('with a function, pipes the value in and uses that return value', function () {
                var piped;
                var parser = string('x').map(function (x) {
                    piped = x;
                    return 'y';
                });
                assert.equal(parser.parse('x'), 'y');
                assert.equal(piped, 'x');
            });
        });
        suite('result', function () {
            test('returns a constant result', function () {
                var myResult = 1;
                var oneParser = string('x').result(1);
                assert.equal(oneParser.parse('x'), 1);
                var myFn = function () { };
                var fnParser = string('x').result(myFn);
                assert.equal(fnParser.parse('x'), myFn);
            });
        });
        suite('skip', function () {
            test('uses the previous return value', function () {
                var parser = string('x').skip(string('y'));
                assert.equal(parser.parse('xy'), 'x');
                assert.throws(function () {
                    parser.parse('x');
                });
            });
        });
        suite('or', function () {
            test('two parsers', function () {
                var parser = string('x').or(string('y'));
                assert.equal(parser.parse('x'), 'x');
                assert.equal(parser.parse('y'), 'y');
                assert.throws(function () {
                    parser.parse('z');
                });
            });
            test('with then', function () {
                var parser = string('\\')
                    .then(function () {
                    return string('y');
                })
                    .or(string('z'));
                assert.equal(parser.parse('\\y'), 'y');
                assert.equal(parser.parse('z'), 'z');
                assert.throws(function () {
                    parser.parse('\\z');
                });
            });
        });
        function assertEqualArray(arr1, arr2) {
            assert.equal(arr1.join(), arr2.join());
        }
        suite('many', function () {
            test('simple case', function () {
                var letters = letter.many();
                assertEqualArray(letters.parse('x'), ['x']);
                assertEqualArray(letters.parse('xyz'), ['x', 'y', 'z']);
                assertEqualArray(letters.parse(''), []);
                assert.throws(function () {
                    letters.parse('1');
                });
                assert.throws(function () {
                    letters.parse('xyz1');
                });
            });
            test('followed by then', function () {
                var parser = string('x').many().then(string('y'));
                assert.equal(parser.parse('y'), 'y');
                assert.equal(parser.parse('xy'), 'y');
                assert.equal(parser.parse('xxxxxy'), 'y');
            });
        });
        suite('times', function () {
            test('zero case', function () {
                var zeroLetters = letter.times(0);
                assertEqualArray(zeroLetters.parse(''), []);
                assert.throws(function () {
                    zeroLetters.parse('x');
                });
            });
            test('nonzero case', function () {
                var threeLetters = letter.times(3);
                assertEqualArray(threeLetters.parse('xyz'), ['x', 'y', 'z']);
                assert.throws(function () {
                    threeLetters.parse('xy');
                });
                assert.throws(function () {
                    threeLetters.parse('xyzw');
                });
                var thenDigit = threeLetters.then(digit);
                assert.equal(thenDigit.parse('xyz1'), '1');
                assert.throws(function () {
                    thenDigit.parse('xy1');
                });
                assert.throws(function () {
                    thenDigit.parse('xyz');
                });
                assert.throws(function () {
                    thenDigit.parse('xyzw');
                });
            });
            test('with a min and max', function () {
                var someLetters = letter.times(2, 4);
                assertEqualArray(someLetters.parse('xy'), ['x', 'y']);
                assertEqualArray(someLetters.parse('xyz'), ['x', 'y', 'z']);
                assertEqualArray(someLetters.parse('xyzw'), ['x', 'y', 'z', 'w']);
                assert.throws(function () {
                    someLetters.parse('xyzwv');
                });
                assert.throws(function () {
                    someLetters.parse('x');
                });
                var thenDigit = someLetters.then(digit);
                assert.equal(thenDigit.parse('xy1'), '1');
                assert.equal(thenDigit.parse('xyz1'), '1');
                assert.equal(thenDigit.parse('xyzw1'), '1');
                assert.throws(function () {
                    thenDigit.parse('xy');
                });
                assert.throws(function () {
                    thenDigit.parse('xyzw');
                });
                assert.throws(function () {
                    thenDigit.parse('xyzwv1');
                });
                assert.throws(function () {
                    thenDigit.parse('x1');
                });
            });
            test('atLeast', function () {
                var atLeastTwo = letter.atLeast(2);
                assertEqualArray(atLeastTwo.parse('xy'), ['x', 'y']);
                assertEqualArray(atLeastTwo.parse('xyzw'), ['x', 'y', 'z', 'w']);
                assert.throws(function () {
                    atLeastTwo.parse('x');
                });
            });
        });
        suite('fail', function () {
            var fail = Parser.fail;
            var succeed = Parser.succeed;
            test('use Parser.fail to fail dynamically', function () {
                var parser = any
                    .then(function (ch) {
                    return fail('character ' + ch + ' not allowed');
                })
                    .or(string('x'));
                assert.throws(function () {
                    parser.parse('y');
                });
                assert.equal(parser.parse('x'), 'x');
            });
            test('use Parser.succeed or Parser.fail to branch conditionally', function () {
                var allowedOperator;
                var parser = string('x')
                    .then(string('+').or(string('*')))
                    .then(function (operator) {
                    if (operator === allowedOperator)
                        return succeed(operator);
                    else
                        return fail('expected ' + allowedOperator);
                })
                    .skip(string('y'));
                allowedOperator = '+';
                assert.equal(parser.parse('x+y'), '+');
                assert.throws(function () {
                    parser.parse('x*y');
                });
                allowedOperator = '*';
                assert.equal(parser.parse('x*y'), '*');
                assert.throws(function () {
                    parser.parse('x+y');
                });
            });
        });
        test('eof', function () {
            var parser = optWhitespace.skip(eof).or(all.result('default'));
            assert.equal(parser.parse('  '), '  ');
            assert.equal(parser.parse('x'), 'default');
        });
    });
    suite('paste', function () {
        var $ = window.test_only_jquery;
        var mq;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
        });
        function prayWellFormedPoint(pt) {
            prayWellFormed(pt.parent, pt[L], pt[R]);
        }
        function assertLatex(latex) {
            prayWellFormedPoint(mq.__controller.cursor);
            assert.equal(mq.latex(), latex);
        }
        function simulatePaste(mq, value) {
            var textarea = mq.el().querySelector('textarea');
            trigger.paste(textarea);
            textarea.value = value;
            trigger.input(textarea);
        }
        suite('√', function () {
            test('sqrt symbol in empty latex', function () {
                simulatePaste(mq, '√');
                assertLatex('\\sqrt{ }');
            });
            test('sqrt symbol in non-empty latex', function () {
                mq.latex('1+');
                simulatePaste(mq, '√');
                assertLatex('1+\\sqrt{ }');
            });
            test('sqrt symbol at start of non-empty latex', function () {
                mq.latex('1+');
                mq.moveToLeftEnd();
                simulatePaste(mq, '√');
                assertLatex('\\sqrt{ }1+');
            });
        });
        suite('√2', function () {
            test('sqrt symbol in empty latex', function () {
                simulatePaste(mq, '√2');
                assertLatex('\\sqrt{ }2');
            });
            test('sqrt symbol in non-empty latex', function () {
                mq.latex('1+');
                simulatePaste(mq, '√2');
                assertLatex('1+\\sqrt{ }2');
            });
            test('sqrt symbol at start of non-empty latex', function () {
                mq.latex('1+');
                mq.moveToLeftEnd();
                simulatePaste(mq, '√2');
                assertLatex('\\sqrt{ }21+');
            });
        });
        suite('sqrt text', function () {
            test('sqrt symbol in empty latex', function () {
                simulatePaste(mq, 'sqrt');
                assertLatex('sqrt');
            });
            test('sqrt symbol in non-empty latex', function () {
                mq.latex('1+');
                simulatePaste(mq, 'sqrt');
                assertLatex('1+sqrt');
            });
            test('sqrt symbol at start of non-empty latex', function () {
                mq.latex('1+');
                mq.moveToLeftEnd();
                simulatePaste(mq, 'sqrt');
                assertLatex('sqrt1+');
            });
        });
    });
    suite('Public API', function () {
        var $ = window.test_only_jquery;
        suite('global functions', function () {
            test('null', function () {
                assert.equal(MQ(), null);
                assert.equal(MQ(0), null);
                assert.equal(MQ('<span/>'), null);
                assert.equal(MQ($('<span/>')[0]), null);
                assert.equal(MQ.MathField(), null);
                assert.equal(MQ.MathField(0), null);
                assert.equal(MQ.MathField('<span/>'), null);
            });
            test('MQ.MathField()', function () {
                var el = $('<span>x^2</span>');
                var mathField = MQ.MathField(el[0]);
                assert.ok(mathField instanceof MQ.MathField);
                assert.ok(mathField instanceof MQ.EditableField);
                assert.ok(mathField instanceof MQ);
                assert.ok(mathField instanceof MathQuill);
            });
            test('interface versioning isolates prototype chain', function () {
                var mathFieldSpan = $('<span/>')[0];
                var mathField = MQ.MathField(mathFieldSpan);
                var MQ1 = MathQuill.getInterface(1);
                assert.ok(!(mathField instanceof MQ1.MathField));
                assert.ok(!(mathField instanceof MQ1.EditableField));
                assert.ok(!(mathField instanceof MQ1));
            });
            test('interface version < 3 throws an error if jQuery is not present', function () {
                window.$ = window.jQuery = undefined;
                assert.throws(function () { return MathQuill.getInterface(1); }, 'MathQuill.getInterface(1) throws if jquery is not present');
                assert.throws(function () { return MathQuill.getInterface(2); }, 'MathQuill.getInterface(2) throws if jquery is not present');
                assert.ok(MathQuill.getInterface(3), 'MathQuill.getInterface(3) succeeds without jquery present');
                setupJqueryStub();
                assert.ok(MathQuill.getInterface(1), 'MathQuill.getInterface(1) succeeds when jquery is present');
                assert.ok(MathQuill.getInterface(2), 'MathQuill.getInterface(1) succeeds when jquery is present');
            });
            test('identity of API object returned by MQ()', function () {
                var mathFieldSpan = $('<span/>')[0];
                var mathField = MQ.MathField(mathFieldSpan);
                assert.ok(MQ(mathFieldSpan) !== mathField);
                assert.equal(MQ(mathFieldSpan).id, mathField.id);
                assert.equal(MQ(mathFieldSpan).id, MQ(mathFieldSpan).id);
                assert.equal(MQ(mathFieldSpan).data, mathField.data);
                assert.equal(MQ(mathFieldSpan).data, MQ(mathFieldSpan).data);
            });
            test('blurred when created', function () {
                var el = $('<span/>');
                MQ.MathField(el[0]);
                var rootBlock = el.find('.mq-root-block');
                assert.ok(rootBlock.hasClass('mq-empty'));
                assert.ok(!rootBlock.hasClass('mq-hasCursor'));
            });
        });
        suite('mathquill-basic', function () {
            var mq;
            setup(function () {
                mq = MQBasic.MathField($('<span></span>').appendTo('#mock')[0]);
            });
            test('typing \\', function () {
                mq.typedText('\\');
                assert.equal(mq.latex(), '\\backslash');
            });
            test('typing $', function () {
                mq.typedText('$');
                assert.equal(mq.latex(), '\\$');
            });
            test('parsing of advanced symbols', function () {
                mq.latex('\\oplus');
                assert.equal(mq.latex(), '\\oplus'); // TODO: better LaTeX parse error behavior
            });
        });
        suite('basic API methods', function () {
            var mq;
            setup(function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            });
            test('.revert()', function () {
                var mq = MQ.MathField($('<span>some <code>HTML</code></span>')[0]);
                assert.equal(mq.revert().innerHTML, 'some <code>HTML</code>');
            });
            test('interface v1 and v2 .revert() return jquery colletion', function () {
                // interface version 1
                setupJqueryStub();
                var MQ1 = MathQuill.getInterface(1);
                var mq = MQ1.MathField($('<span>some <code>HTML</code></span>')[0]);
                assert.equal(mq.revert().html(), 'some <code>HTML</code>');
                var MQ2 = MathQuill.getInterface(2);
                var mq = MQ2.MathField($('<span>some <code>HTML</code></span>')[0]);
                assert.equal(mq.revert().html(), 'some <code>HTML</code>');
            });
            test('select, clearSelection', function () {
                mq.latex('n+\\frac{n}{2}');
                assert.ok(!mq.__controller.cursor.selection);
                mq.select();
                assert.equal(mq.__controller.cursor.selection.join('latex'), 'n+\\frac{n}{2}');
                mq.clearSelection();
                assert.ok(!mq.__controller.cursor.selection);
            });
            test('select an empty mq', function () {
                assert.ok(!mq.__controller.cursor.selection);
                mq.select();
                // select on an empty mq is a noop
                assert.ok(!mq.__controller.cursor.selection);
            });
            test("latex while there's a selection", function () {
                mq.latex('a');
                assert.equal(mq.latex(), 'a');
                mq.select();
                assert.equal(mq.__controller.cursor.selection.join('latex'), 'a');
                mq.latex('b');
                assert.equal(mq.latex(), 'b');
                mq.typedText('c');
                assert.equal(mq.latex(), 'bc');
            });
            test("latex while there's a selection 2", function () {
                mq.latex('1.2');
                assert.equal(mq.latex(), '1.2');
                mq.select();
                assert.equal(mq.__controller.cursor.selection.join('latex'), '1.2');
                mq.latex('1');
                assert.equal(mq.latex(), '1');
                mq.typedText('c');
                assert.equal(mq.latex(), '1c');
            });
            test('latex while cursor is in the middle of an expression', function () {
                mq.typedText('1.2');
                mq.focus();
                var t = mq.el().querySelector('textarea');
                trigger.keydown(t, 'ArrowLeft');
                trigger.keypress(t, 'ArrowLeft');
                trigger.keyup(t, 'ArrowLeft');
                trigger.keydown(t, 'Backspace');
                trigger.keypress(t, 'Backspace');
                trigger.keyup(t, 'Backspace');
                assert.equal(mq.latex(), '12');
                mq.latex('1.2');
                assert.equal(mq.latex(), '1.2');
                mq.typedText('/');
                assert.equal(mq.latex(), '\\frac{1.2}{ }');
            });
            test('.html() trivial case', function () {
                mq.latex('x+y');
                assert.equal(mq.html(), '<var>x</var><span class="mq-binary-operator">+</span><var>y</var>');
            });
            test('.text() with incomplete commands', function () {
                assert.equal(mq.text(), '');
                mq.typedText('\\');
                assert.equal(mq.text(), '\\');
                mq.typedText('s');
                assert.equal(mq.text(), '\\s');
                mq.typedText('qrt');
                assert.equal(mq.text(), '\\sqrt');
            });
            test('.text() with complete commands', function () {
                mq.latex('\\sqrt{}');
                assert.equal(mq.text(), 'sqrt()');
                mq.latex('\\nthroot[]{}');
                assert.equal(mq.text(), 'sqrt[]()');
                mq.latex('\\frac{}{}');
                assert.equal(mq.text(), '()/()');
                mq.latex('\\frac{3}{5}');
                assert.equal(mq.text(), '(3)/(5)');
                mq.latex('\\frac{3+2}{5-1}');
                assert.equal(mq.text(), '(3+2)/(5-1)');
                mq.latex('\\div');
                assert.equal(mq.text(), '[/]');
                mq.latex('^{}');
                assert.equal(mq.text(), '^( )');
                mq.latex('3^{4}');
                assert.equal(mq.text(), '3^4');
                mq.latex('3x+\\ 4');
                assert.equal(mq.text(), '3*x+ 4');
                mq.latex('x^2');
                assert.equal(mq.text(), 'x^2');
                mq.latex('');
                mq.typedText('*2*3***4');
                assert.equal(mq.text(), '*2*3***4');
            });
            test('.moveToDirEnd(dir)', function () {
                mq.latex('a x^2 + b x + c = 0');
                assert.equal(mq.__controller.cursor[L].ctrlSeq, '0');
                assert.equal(mq.__controller.cursor[R], 0);
                mq.moveToLeftEnd();
                assert.equal(mq.__controller.cursor[L], 0);
                assert.equal(mq.__controller.cursor[R].ctrlSeq, 'a');
                mq.moveToRightEnd();
                assert.equal(mq.__controller.cursor[L].ctrlSeq, '0');
                assert.equal(mq.__controller.cursor[R], 0);
            });
            test('.empty()', function () {
                mq.latex('xyz');
                mq.empty();
                assert.equal(mq.latex(), '');
            });
            test('ARIA labels', function () {
                mq.setAriaLabel('ARIA label');
                mq.setAriaPostLabel('ARIA post-label');
                assert.equal(mq.getAriaLabel(), 'ARIA label');
                assert.equal(mq.getAriaPostLabel(), 'ARIA post-label');
                mq.setAriaLabel('');
                mq.setAriaPostLabel('');
                assert.equal(mq.getAriaLabel(), 'Math Input');
                assert.equal(mq.getAriaPostLabel(), '');
            });
            test('.mathspeak()', function () {
                function assertMathSpeakEqual(a, b) {
                    assert.equal(normalize(a), normalize(b));
                    function normalize(str) {
                        return str
                            .replace(/\d(?!\d)/g, '$& ')
                            .split(/[ ,]+/)
                            .join(' ')
                            .trim();
                    }
                }
                mq.latex('123.456');
                assertMathSpeakEqual(mq.mathspeak(), '123.4 5 6');
                mq.latex('\\frac{d}{dx}\\sqrt{x}');
                assertMathSpeakEqual(mq.mathspeak(), 'StartFraction "d" Over "d" "x" EndFraction StartRoot "x" EndRoot');
                mq.latex('1+2-3\\cdot\\frac{5}{6^7}=\\left(8+9\\right)');
                assertMathSpeakEqual(mq.mathspeak(), '1 plus 2 minus 3 times StartFraction 5 Over 6 to the 7th power EndFraction equals left parenthesis 8 plus 9 right parenthesis');
                // Example 13 from http://www.gh-mathspeak.com/examples/quick-tutorial/index.php?verbosity=v&explicitness=2&interp=0
                mq.latex('d=\\sqrt{ \\left( x_2 - x_1 \\right)^2 - \\left( y_2 - y_1 \\right)^2 }');
                assertMathSpeakEqual(mq.mathspeak(), '"d" equals StartRoot left parenthesis "x" Subscript 2 Baseline minus "x" Subscript 1 Baseline right parenthesis squared minus left parenthesis "y" Subscript 2 Baseline minus "y" Subscript 1 Baseline right parenthesis squared EndRoot');
                mq.latex('').typedText('\\langle').keystroke('Spacebar').typedText('u,v'); // .latex() doesn't work yet for angle brackets :(
                assertMathSpeakEqual(mq.mathspeak(), 'left angle-bracket "u" "v" right angle-bracket');
                mq.latex('\\left| x \\right| + \\left( y \\right|');
                assertMathSpeakEqual(mq.mathspeak(), 'StartAbsoluteValue "x" EndAbsoluteValue plus left parenthesis "y" right pipe');
            });
        });
        test('edit handler interface versioning', function () {
            var count = 0;
            setupJqueryStub();
            // interface version 2 (latest)
            var mq2 = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                handlers: {
                    edit: function (_mq) {
                        assert.equal(mq2.id, _mq.id);
                        count += 1;
                    },
                },
            });
            assert.equal(count, 0);
            mq2.latex('x^2');
            assert.equal(count, 2); // sigh, once for postOrder and once for bubble
            count = 0;
            // interface version 1
            var MQ1 = MathQuill.getInterface(1);
            var mq1 = MQ1.MathField($('<span></span>').appendTo('#mock')[0], {
                handlers: {
                    edit: function (_mq) {
                        if (count <= 2)
                            assert.equal(mq1, undefined);
                        else
                            assert.equal(mq1.id, _mq.id);
                        count += 1;
                    },
                },
            });
            assert.equal(count, 2);
        });
        suite('*OutOf handlers', function () {
            testHandlers('MQ.MathField() constructor', function (options) {
                return MQ.MathField($('<span></span>').appendTo('#mock')[0], options);
            });
            testHandlers('MQ.StaticMath() constructor', function (options) {
                return MQ.StaticMath($('<span>\\MathQuillMathField{}</span>').appendTo('#mock')[0], options).innerFields[0];
            });
            testHandlers('MQ.MathField::config()', function (options) {
                return MQ.MathField($('<span></span>').appendTo('#mock')[0]).config(options);
            });
            testHandlers('MQ.StaticMath::config() propagates down to \\MathQuillMathField{}', function (options) {
                return MQ.StaticMath($('<span>\\MathQuillMathField{}</span>').appendTo('#mock')[0]).config(options).innerFields[0];
            });
            testHandlers('.config() directly on a \\MathQuillMathField{} in a MQ.StaticMath using .innerFields', function (options) {
                return MQ.StaticMath($('<span>\\MathQuillMathField{}</span>').appendTo('#mock')[0]).innerFields[0].config(options);
            });
            suite('global MQ.config()', function () {
                testHandlers('a MQ.MathField', function (options) {
                    MQ.config(options);
                    return MQ.MathField($('<span></span>').appendTo('#mock')[0]);
                });
                testHandlers('\\MathQuillMathField{} in a MQ.StaticMath', function (options) {
                    MQ.config(options);
                    return MQ.StaticMath($('<span>\\MathQuillMathField{}</span>').appendTo('#mock')[0]).innerFields[0];
                });
                teardown(function () {
                    MQ.config({ handlers: undefined });
                });
            });
            function testHandlers(title, mathFieldMaker) {
                test(title, function () {
                    var enterCounter = 0, upCounter = 0, moveCounter = 0, deleteCounter = 0, dir = null;
                    var mq = mathFieldMaker({
                        handlers: {
                            enter: function (_mq) {
                                assert.equal(arguments.length, 1);
                                assert.equal(_mq.id, mq.id);
                                enterCounter += 1;
                            },
                            upOutOf: function (_mq) {
                                assert.equal(arguments.length, 1);
                                assert.equal(_mq.id, mq.id);
                                upCounter += 1;
                            },
                            moveOutOf: function (_dir, _mq) {
                                assert.equal(arguments.length, 2);
                                assert.equal(_mq.id, mq.id);
                                dir = _dir;
                                moveCounter += 1;
                            },
                            deleteOutOf: function (_dir, _mq) {
                                assert.equal(arguments.length, 2);
                                assert.equal(_mq.id, mq.id);
                                dir = _dir;
                                deleteCounter += 1;
                            },
                        },
                    });
                    mq.latex('n+\\frac{n}{2}'); // starts at right edge
                    assert.equal(moveCounter, 0);
                    mq.typedText('\n'); // nothing happens
                    assert.equal(enterCounter, 1);
                    mq.keystroke('Right'); // stay at right edge
                    assert.equal(moveCounter, 1);
                    assert.equal(dir, R);
                    mq.keystroke('Right'); // stay at right edge
                    assert.equal(moveCounter, 2);
                    assert.equal(dir, R);
                    mq.keystroke('Left'); // right edge of denominator
                    assert.equal(moveCounter, 2);
                    assert.equal(upCounter, 0);
                    mq.keystroke('Up'); // right edge of numerator
                    assert.equal(moveCounter, 2);
                    assert.equal(upCounter, 0);
                    mq.keystroke('Up'); // stays at right edge of numerator
                    assert.equal(upCounter, 1);
                    mq.keystroke('Up'); // stays at right edge of numerator
                    assert.equal(upCounter, 2);
                    // go to left edge
                    mq.keystroke('Left')
                        .keystroke('Left')
                        .keystroke('Left')
                        .keystroke('Left');
                    assert.equal(moveCounter, 2);
                    mq.keystroke('Left'); // stays at left edge
                    assert.equal(moveCounter, 3);
                    assert.equal(dir, L);
                    assert.equal(deleteCounter, 0);
                    mq.keystroke('Backspace'); // stays at left edge
                    assert.equal(deleteCounter, 1);
                    assert.equal(dir, L);
                    mq.keystroke('Backspace'); // stays at left edge
                    assert.equal(deleteCounter, 2);
                    assert.equal(dir, L);
                    mq.keystroke('Left'); // stays at left edge
                    assert.equal(moveCounter, 4);
                    assert.equal(dir, L);
                    $('#mock').empty();
                });
            }
        });
        suite('edit handler', function () {
            test('fires when closing a bracket expression', function () {
                var count = 0;
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
                    handlers: {
                        edit: function () {
                            count += 1;
                        },
                    },
                });
                mq.typedText('(3, 4');
                var countBeforeClosingBracket = count;
                mq.typedText(']');
                assert.equal(count, countBeforeClosingBracket + 1);
            });
        });
        suite('.cmd(...)', function () {
            var mq;
            setup(function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            });
            test('basic', function () {
                mq.cmd('x');
                assert.equal(mq.latex(), 'x');
                mq.cmd('y');
                assert.equal(mq.latex(), 'xy');
                mq.cmd('^');
                assert.equal(mq.latex(), 'xy^{ }');
                mq.cmd('2');
                assert.equal(mq.latex(), 'xy^{2}');
                mq.keystroke('Right Shift-Left Shift-Left Shift-Left').cmd('\\sqrt');
                assert.equal(mq.latex(), '\\sqrt{xy^{2}}');
                mq.typedText('*2**');
                assert.equal(mq.latex(), '\\sqrt{xy^{2}\\cdot2\\cdot\\cdot}');
            });
            test('backslash commands are passed their name', function () {
                mq.cmd('\\alpha');
                assert.equal(mq.latex(), '\\alpha');
            });
            test('replaces selection', function () {
                mq.typedText('49').select().cmd('\\sqrt');
                assert.equal(mq.latex(), '\\sqrt{49}');
            });
            test('operator name', function () {
                mq.cmd('\\sin');
                assert.equal(mq.latex(), '\\sin');
            });
            test('nonexistent LaTeX command is noop', function () {
                mq.typedText('49').select().cmd('\\asdf').cmd('\\sqrt');
                assert.equal(mq.latex(), '\\sqrt{49}');
            });
            test('overflow triggers automatic horizontal scroll', function (done) {
                var mqEl = mq.el();
                var rootEl = mq.__controller.root.domFrag().oneElement();
                var cursor = mq.__controller.cursor;
                $(mqEl).width(10);
                var previousScrollLeft = rootEl.scrollLeft;
                mq.cmd('\\alpha');
                setTimeout(afterScroll, 150);
                function afterScroll() {
                    cursor.show();
                    try {
                        assert.ok(rootEl.scrollLeft > previousScrollLeft, 'scrolls on cmd');
                        assert.ok(mqEl.getBoundingClientRect().right >
                            cursor.domFrag().firstElement().getBoundingClientRect().right, 'cursor right end is inside the field');
                    }
                    catch (error) {
                        done(error);
                        return;
                    }
                    done();
                }
            });
        });
        suite('spaceBehavesLikeTab', function () {
            var mq, rootBlock, cursor;
            test('space behaves like tab with default opts', function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
                rootBlock = mq.__controller.root;
                cursor = mq.__controller.cursor;
                mq.latex('\\sqrt{x}');
                mq.keystroke('Left');
                mq.keystroke('Spacebar');
                mq.typedText(' ');
                assert.equal(cursor[L].ctrlSeq, '\\ ', 'left of the cursor is ' + cursor[L].ctrlSeq);
                assert.equal(cursor[R], 0, 'right of the cursor is ' + cursor[R]);
                mq.keystroke('Backspace');
                mq.keystroke('Shift-Spacebar');
                mq.typedText(' ');
                assert.equal(cursor[L].ctrlSeq, '\\ ', 'left of the cursor is ' + cursor[L].ctrlSeq);
                assert.equal(cursor[R], 0, 'right of the cursor is ' + cursor[R]);
            });
            test('space behaves like tab when spaceBehavesLikeTab is true', function () {
                var opts = { spaceBehavesLikeTab: true };
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], opts);
                rootBlock = mq.__controller.root;
                cursor = mq.__controller.cursor;
                mq.latex('\\sqrt{x}');
                mq.keystroke('Left');
                mq.keystroke('Spacebar');
                assert.equal(cursor[L].parent, rootBlock, 'parent of the cursor is  ' + cursor[L].ctrlSeq);
                assert.equal(cursor[R], 0, 'right cursor is ' + cursor[R]);
                mq.keystroke('Left');
                mq.keystroke('Shift-Spacebar');
                assert.equal(cursor[L], 0, 'left cursor is ' + cursor[L]);
                assert.equal(cursor[R], rootBlock.ends[L], 'parent of rootBlock is ' + cursor[R]);
            });
            test('space behaves like tab when globally set to true', function () {
                MQ.config({ spaceBehavesLikeTab: true });
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
                rootBlock = mq.__controller.root;
                cursor = mq.__controller.cursor;
                mq.latex('\\sqrt{x}');
                mq.keystroke('Left');
                mq.keystroke('Spacebar');
                assert.equal(cursor.parent, rootBlock, 'cursor in root block');
                assert.equal(cursor[R], 0, 'cursor at end of block');
            });
        });
        suite('maxDepth option', function () {
            setup(function () {
                mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                    maxDepth: 1,
                });
            });
            teardown(function () {
                $(mq.el()).remove();
            });
            test('prevents nested math input via .write() method', function () {
                mq.write('1\\frac{\\frac{3}{3}}{2}');
                assert.equal(mq.latex(), '1\\frac{ }{ }');
            });
            test('prevents nested math input via keyboard input', function () {
                mq.cmd('/').write('x');
                assert.equal(mq.latex(), '\\frac{ }{ }');
            });
            test('stops new fraction moving content into numerator', function () {
                mq.write('x').cmd('/');
                assert.equal(mq.latex(), 'x\\frac{ }{ }');
            });
            test('prevents nested math input via replacedFragment', function () {
                mq.cmd('(').keystroke('Left').cmd('(');
                assert.equal(mq.latex(), '\\left(\\right)');
            });
        });
        suite('statelessClipboard option', function () {
            suite('default', function () {
                var mq, textarea;
                setup(function () {
                    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
                    textarea = $(mq.el()).find('textarea');
                });
                function assertPaste(paste, latex) {
                    if (arguments.length < 2)
                        latex = paste;
                    mq.latex('');
                    trigger.paste(textarea[0]);
                    textarea.val(paste);
                    trigger.input(textarea[0]);
                    assert.equal(mq.latex(), latex);
                }
                test('numbers and letters', function () {
                    assertPaste('123xyz');
                });
                test('a sentence', function () {
                    assertPaste('Lorem ipsum is a placeholder text commonly used to ' +
                        'demonstrate the graphical elements of a document or ' +
                        'visual presentation.', 'Loremipsumisaplaceholdertextcommonlyusedtodemonstrate' +
                        'thegraphicalelementsofadocumentorvisualpresentation.');
                });
                test('actual LaTeX', function () {
                    assertPaste('a_{n}x^{n}+a_{n+1}x^{n+1}');
                    assertPaste('\\frac{1}{2\\sqrt{x}}');
                });
                test('\\text{...}', function () {
                    assertPaste('\\text{lol}');
                    assertPaste('1+\\text{lol}+2');
                    assertPaste('\\frac{\\text{apples}}{\\text{oranges}}');
                });
                test('selection', function (done) {
                    mq.latex('x^2').select();
                    setTimeout(function () {
                        assert.equal(textarea.val(), 'x^{2}');
                        done();
                    });
                });
            });
            suite('statelessClipboard set to true', function () {
                var mq, textarea;
                setup(function () {
                    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                        statelessClipboard: true,
                    });
                    textarea = $(mq.el()).find('textarea');
                });
                function assertPaste(paste, latex) {
                    if (arguments.length < 2)
                        latex = paste;
                    mq.latex('');
                    trigger.paste(textarea[0]);
                    textarea.val(paste);
                    trigger.input(textarea[0]);
                    assert.equal(mq.latex(), latex);
                }
                test('numbers and letters', function () {
                    assertPaste('123xyz', '\\text{123xyz}');
                });
                test('a sentence', function () {
                    assertPaste('Lorem ipsum is a placeholder text commonly used to ' +
                        'demonstrate the graphical elements of a document or ' +
                        'visual presentation.', '\\text{Lorem ipsum is a placeholder text commonly used to ' +
                        'demonstrate the graphical elements of a document or ' +
                        'visual presentation.}');
                });
                test('backslashes', function () {
                    assertPaste('something \\pi something \\asdf', '\\text{something \\backslash pi something \\backslash asdf}');
                });
                // TODO: braces (currently broken)
                test('actual math LaTeX wrapped in dollar signs', function () {
                    assertPaste('$a_nx^n+a_{n+1}x^{n+1}$', 'a_{n}x^{n}+a_{n+1}x^{n+1}');
                    assertPaste('$\\frac{1}{2\\sqrt{x}}$', '\\frac{1}{2\\sqrt{x}}');
                });
                test('selection', function (done) {
                    mq.latex('x^2').select();
                    setTimeout(function () {
                        assert.equal(textarea.val(), '$x^{2}$');
                        done();
                    });
                });
            });
        });
        suite('leftRightIntoCmdGoes: "up"/"down"', function () {
            test('"up" or "down" required', function () {
                assert.throws(function () {
                    MQ.MathField($('<span></span>')[0], { leftRightIntoCmdGoes: 1 });
                });
            });
            suite('default', function () {
                var mq;
                setup(function () {
                    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
                });
                test('fractions', function () {
                    mq.latex('\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    assert.equal(mq.latex(), '\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.moveToLeftEnd().typedText('a');
                    assert.equal(mq.latex(), 'a\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('b');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('c');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('d');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('e');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('f');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('g');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('h');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('i');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('j');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{4}}');
                    mq.keystroke('Right Right').typedText('k');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{k4}}');
                    mq.keystroke('Right Right').typedText('l');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{k4}l}');
                    mq.keystroke('Right').typedText('m');
                    assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{k4}l}m');
                });
                test('supsub', function () {
                    mq.latex('x_a+y^b+z_a^b+w');
                    assert.equal(mq.latex(), 'x_{a}+y^{b}+z_{a}^{b}+w');
                    mq.moveToLeftEnd().typedText('1');
                    assert.equal(mq.latex(), '1x_{a}+y^{b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right').typedText('2');
                    assert.equal(mq.latex(), '1x_{2a}+y^{b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right').typedText('3');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right Right').typedText('4');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right').typedText('5');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{a}^{b}+w');
                    mq.keystroke('Right Right Right').typedText('6');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{6a}^{b}+w');
                    mq.keystroke('Right Right').typedText('7');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{6a}^{7b}+w');
                    mq.keystroke('Right Right').typedText('8');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{6a}^{7b}8+w');
                });
                test('nthroot', function () {
                    mq.latex('\\sqrt[n]{x}');
                    assert.equal(mq.latex(), '\\sqrt[n]{x}');
                    mq.moveToLeftEnd().typedText('1');
                    assert.equal(mq.latex(), '1\\sqrt[n]{x}');
                    mq.keystroke('Right').typedText('2');
                    assert.equal(mq.latex(), '1\\sqrt[2n]{x}');
                    mq.keystroke('Right Right').typedText('3');
                    assert.equal(mq.latex(), '1\\sqrt[2n]{3x}');
                    mq.keystroke('Right Right').typedText('4');
                    assert.equal(mq.latex(), '1\\sqrt[2n]{3x}4');
                });
            });
            suite('"up"', function () {
                var mq;
                setup(function () {
                    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                        leftRightIntoCmdGoes: 'up',
                    });
                });
                test('fractions', function () {
                    mq.latex('\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    assert.equal(mq.latex(), '\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.moveToLeftEnd().typedText('a');
                    assert.equal(mq.latex(), 'a\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('b');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('c');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('d');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('e');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{e1}{2}}{\\frac{3}{4}}');
                    mq.keystroke('Right Right').typedText('f');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{e1}{2}f}{\\frac{3}{4}}');
                    mq.keystroke('Right').typedText('g');
                    assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{e1}{2}f}{\\frac{3}{4}}g');
                });
                test('supsub', function () {
                    mq.latex('x_a+y^b+z_a^b+w');
                    assert.equal(mq.latex(), 'x_{a}+y^{b}+z_{a}^{b}+w');
                    mq.moveToLeftEnd().typedText('1');
                    assert.equal(mq.latex(), '1x_{a}+y^{b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right').typedText('2');
                    assert.equal(mq.latex(), '1x_{2a}+y^{b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right').typedText('3');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right Right').typedText('4');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}+z_{a}^{b}+w');
                    mq.keystroke('Right Right').typedText('5');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{a}^{b}+w');
                    mq.keystroke('Right Right Right').typedText('6');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{a}^{6b}+w');
                    mq.keystroke('Right Right').typedText('7');
                    assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{a}^{6b}7+w');
                });
                test('nthroot', function () {
                    mq.latex('\\sqrt[n]{x}');
                    assert.equal(mq.latex(), '\\sqrt[n]{x}');
                    mq.moveToLeftEnd().typedText('1');
                    assert.equal(mq.latex(), '1\\sqrt[n]{x}');
                    mq.keystroke('Right').typedText('2');
                    assert.equal(mq.latex(), '1\\sqrt[2n]{x}');
                    mq.keystroke('Right Right').typedText('3');
                    assert.equal(mq.latex(), '1\\sqrt[2n]{3x}');
                    mq.keystroke('Right Right').typedText('4');
                    assert.equal(mq.latex(), '1\\sqrt[2n]{3x}4');
                });
            });
        });
        suite('sumStartsWithNEquals', function () {
            test('sum defaults to empty limits', function () {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0]);
                assert.equal(mq.latex(), '');
                mq.cmd('\\sum');
                assert.equal(mq.latex(), '\\sum_{ }^{ }');
                mq.cmd('n');
                assert.equal(mq.latex(), '\\sum_{n}^{ }', 'cursor in lower limit');
            });
            test('sum starts with `n=`', function () {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
                    sumStartsWithNEquals: true,
                });
                assert.equal(mq.latex(), '');
                mq.cmd('\\sum');
                assert.equal(mq.latex(), '\\sum_{n=}^{ }');
                mq.cmd('0');
                assert.equal(mq.latex(), '\\sum_{n=0}^{ }', 'cursor after the `n=`');
            });
            test('integral still has empty limits', function () {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
                    sumStartsWithNEquals: true,
                });
                assert.equal(mq.latex(), '');
                mq.cmd('\\int');
                assert.equal(mq.latex(), '\\int_{ }^{ }');
                mq.cmd('0');
                assert.equal(mq.latex(), '\\int_{0}^{ }', 'cursor in the from block');
            });
        });
        suite('substituteTextarea', function () {
            test("doesn't blow up on selection", function () {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
                    substituteTextarea: function () {
                        return $('<span tabindex=0 style="display:inline-block;width:1px;height:1px" />')[0];
                    },
                });
                assert.equal(mq.latex(), '');
                mq.write('asdf');
                mq.select();
            });
        });
        suite('overrideKeystroke', function () {
            test('can intercept key events', function () {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
                    overrideKeystroke: function (_key, evt) {
                        key = _key;
                        return mq.keystroke.apply(mq, arguments);
                    },
                });
                var key;
                trigger.keydown(mq.el().querySelector('textarea'), 'ArrowLeft');
                assert.equal(key, 'Left');
            });
            test('cut is async', function (done) {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
                    onCut: function () {
                        count += 1;
                    },
                });
                var count = 0;
                mq.latex('a=2');
                mq.select();
                var textarea = mq.el().querySelector('textarea');
                trigger.cut(textarea);
                assert.equal(count, 0);
                trigger.input(textarea);
                assert.equal(count, 0);
                trigger.keyup(textarea);
                assert.equal(count, 0);
                setTimeout(function () {
                    assert.equal(count, 1);
                    done();
                }, 100);
            });
        });
        suite('substituteKeyboardEvents (interface versions 1 and 2)', function () {
            var _loop_4 = function (v) {
                setupJqueryStub();
                var MQ_old = MathQuill.getInterface(v);
                test('can intercept key events, interface version ' + v, function () {
                    var mq = MQ_old.MathField($('<span>').appendTo('#mock')[0], {
                        substituteKeyboardEvents: function (textarea, handlers) {
                            return MQ_old.saneKeyboardEvents(textarea, $.extend({}, handlers, {
                                keystroke: function (_key, evt) {
                                    key = _key;
                                    return handlers.keystroke.apply(handlers, arguments);
                                },
                            }));
                        },
                    });
                    var key;
                    trigger.keydown(mq.el().querySelector('textarea'), 'ArrowLeft');
                    assert.equal(key, 'Left');
                });
                test('cut is async, interface version ' + v, function () {
                    var mq = MQ_old.MathField($('<span>').appendTo('#mock')[0], {
                        substituteKeyboardEvents: function (textarea, handlers) {
                            return MQ_old.saneKeyboardEvents(textarea, $.extend({}, handlers, {
                                cut: function () {
                                    count += 1;
                                    return handlers.cut.apply(handlers, arguments);
                                },
                            }));
                        },
                    });
                    var count = 0;
                    var textarea = mq.el().querySelector('textarea');
                    trigger.cut(textarea);
                    assert.equal(count, 0);
                    trigger.input(textarea);
                    assert.equal(count, 1);
                    trigger.keyup(textarea);
                    assert.equal(count, 1);
                });
            };
            for (var _c = 0, _d = [1, 2]; _c < _d.length; _c++) {
                var v = _d[_c];
                _loop_4(v);
            }
            test('throws for interface version 3', function () {
                assert.throws(function () {
                    return MQ.MathField(document.createElement('span'), {
                        substituteKeyboardEvents: function () { },
                    });
                });
            });
        });
        suite('clickAt', function () {
            test('inserts at coordinates', function () {
                // Insert filler so that the page is taller than the window so this test is deterministic
                // Test that we use clientY instead of pageY
                var windowHeight = $(window).height();
                var filler = $('<div>').height(windowHeight);
                filler.prependTo('#mock');
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0]);
                mq.typedText('mmmm/mmmm');
                mq.el().scrollIntoView();
                var box = mq.el().getBoundingClientRect();
                var clientX = box.left + 30;
                var clientY = box.top + 30;
                var target = document.elementFromPoint(clientX, clientY);
                assert.equal(document.activeElement, document.body);
                mq.clickAt(clientX, clientY, target).write('x');
                assert.equal(document.activeElement, $(mq.el()).find('textarea')[0]);
                assert.equal(mq.latex(), '\\frac{mmmm}{mmxmm}');
            });
            test('target is optional', function () {
                // Insert filler so that the page is taller than the window so this test is deterministic
                // Test that we use clientY instead of pageY
                var windowHeight = $(window).height();
                var filler = $('<div>').height(windowHeight);
                filler.prependTo('#mock');
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0]);
                mq.typedText('mmmm/mmmm');
                mq.el().scrollIntoView();
                var box = mq.el().getBoundingClientRect();
                var clientX = box.left + 30;
                var clientY = box.top + 30;
                assert.equal(document.activeElement, document.body);
                mq.clickAt(clientX, clientY).write('x');
                assert.equal(document.activeElement, $(mq.el()).find('textarea')[0]);
                assert.equal(mq.latex(), '\\frac{mmmm}{mmxmm}');
            });
        });
        suite('dropEmbedded', function () {
            test('inserts into empty', function () {
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0]);
                mq.dropEmbedded(0, 0, {
                    htmlString: '<span class="embedded-html"></span>',
                    text: function () {
                        return 'embedded text';
                    },
                    latex: function () {
                        return 'embedded latex';
                    },
                });
                assert.ok($('.embedded-html').length);
                assert.equal(mq.text(), 'embedded text');
                assert.equal(mq.latex(), 'embedded latex');
            });
            test('inserts at coordinates', function () {
                // Insert filler so that the page is taller than the window so this test is deterministic
                // Test that we use clientY instead of pageY
                var windowHeight = $(window).height();
                var filler = $('<div>').height(windowHeight);
                filler.prependTo('#mock');
                var mq = MQ.MathField($('<span>').appendTo('#mock')[0]);
                mq.typedText('mmmm/mmmm');
                var pos = $(mq.el()).offset();
                var mqx = pos.left;
                var mqy = pos.top;
                mq.el().scrollIntoView();
                mq.dropEmbedded(mqx + 30, mqy + 30, {
                    htmlString: '<span class="embedded-html"></span>',
                    text: function () {
                        return 'embedded text';
                    },
                    latex: function () {
                        return 'embedded latex';
                    },
                });
                assert.ok($('.embedded-html').length);
                assert.equal(mq.text(), '(m*m*m*m)/(m*m*embedded text*m*m)');
                assert.equal(mq.latex(), '\\frac{mmmm}{mmembedded latexmm}');
            });
        });
        test('.registerEmbed()', function () {
            var calls = 0, data;
            MQ.registerEmbed('thing', function (data_) {
                calls += 1;
                data = data_;
                return {
                    htmlString: '<span class="embedded-html"></span><span class="embedded-html-2"></span>',
                    text: function () {
                        return 'embedded text';
                    },
                    latex: function () {
                        return 'embedded latex';
                    },
                };
            });
            var mq = MQ.MathField($('<span>\\sqrt{\\embed{thing}}</span>').appendTo('#mock')[0]);
            assert.equal(calls, 1);
            assert.equal(data, undefined);
            assert.ok($('.embedded-html').length);
            assert.ok($('.embedded-html-2').length);
            assert.equal(mq.text(), 'sqrt(embedded text)');
            assert.equal(mq.latex(), '\\sqrt{embedded latex}');
            mq.latex('\\sqrt{\\embed{thing}[data]}');
            assert.equal(calls, 2);
            assert.equal(data, 'data');
            assert.ok($('.embedded-html').length);
            assert.ok($('.embedded-html-2').length);
            assert.equal(mq.text(), 'sqrt(embedded text)');
            assert.equal(mq.latex(), '\\sqrt{embedded latex}');
        });
        suite('StaticMath', function () {
            test('does not render cursor', function () {
                var span = document.createElement('span');
                span.textContent = '\\frac{1}{2}';
                var mq = MQ.StaticMath(domFrag(span).appendTo(document.querySelector('#mock')).oneElement(), {});
                assert.equal(mq.__controller.blurred, true, 'focus state is initialized to blurred');
                assert.equal(span.querySelector('.mq-cursor'), null, 'there is no .mq-cursor element');
                mq.latex('123');
                assert.equal(span.querySelector('.mq-cursor'), null, 'there is still no .mq-cursor element');
            });
            test('does not render cursor with mouseEvents: false', function () {
                var span = document.createElement('span');
                span.textContent = '\\frac{1}{2}';
                var mq = MQ.StaticMath(domFrag(span).appendTo(document.querySelector('#mock')).oneElement(), {
                    mouseEvents: false,
                });
                assert.equal(mq.__controller.blurred, true, 'focus state is initialized to blurred');
                assert.equal(span.querySelector('.mq-cursor'), null, 'there is no .mq-cursor element');
                mq.latex('123');
                assert.equal(span.querySelector('.mq-cursor'), null, 'there is still no .mq-cursor element');
            });
        });
    });
    suite('quietEmptyDelimiters', function () {
        var $ = window.test_only_jquery;
        test('transparent class properly applied to empty delimiters when typing', function () {
            var el = $('<span></span>');
            var mq = MQ.MathField(el.appendTo('#mock')[0]);
            // Test that parens are not transparent by default.
            mq.typedText('sin(').keystroke('Tab');
            assert.equal(mq.latex(), '\\sin\\left(\\right)');
            assert.equal(el.find('.mq-quiet-delimiter').length, 0);
            // Make parens transparent and verify the mq-quiet-delimiter class is applied.
            mq.latex('');
            mq.config({
                quietEmptyDelimiters: '(',
            });
            mq.typedText('sin(').keystroke('Tab');
            assert.equal(mq.latex(), '\\sin\\left(\\right)');
            assert.equal(el.find('.mq-quiet-delimiter').length, 1);
        });
        test('transparent class properly applied to empty delimiters when setting LaTeX', function () {
            var el = $('<span></span>');
            var mq = MQ.MathField(el.appendTo('#mock')[0]);
            // Test that parens are not transparent by default.
            mq.latex('\\sin\\left(\\right)');
            assert.equal(el.find('.mq-quiet-delimiter').length, 0);
            // Make parens transparent and verify the mq-quiet-delimiter class is applied.
            mq.latex('');
            mq.config({
                quietEmptyDelimiters: '(',
            });
            mq.latex('\\sin\\left(\\right)');
            assert.equal(el.find('.mq-quiet-delimiter').length, 1);
        });
    });
    suite('resetCursorOnBlur', function () {
        var $ = window.test_only_jquery;
        var $el;
        setup(function () {
            $el = $('<span style="display:inline-block; width: 100px"></span>');
        });
        test('remembers cursor position by default', function (done) {
            var mq = MQ.MathField($el.appendTo('#mock')[0]);
            mq.latex('a=2');
            mq.focus();
            mq.keystroke('Left');
            mq.typedText('1');
            assert.equal('a=12', mq.latex());
            mq.blur();
            setTimeout(function () {
                mq.focus();
                setTimeout(function () {
                    mq.typedText('3');
                    assert.equal('a=132', mq.latex());
                    done();
                }, 1);
            }, 1);
        });
        test('forgets cursor position with resetCursorOnBlur option', function (done) {
            var mq = MQ.MathField($el.appendTo('#mock')[0], {
                resetCursorOnBlur: true,
            });
            mq.latex('a=2');
            mq.focus();
            mq.keystroke('Left');
            mq.typedText('1');
            assert.equal('a=12', mq.latex());
            mq.blur();
            setTimeout(function () {
                mq.focus();
                setTimeout(function () {
                    mq.typedText('3');
                    assert.equal('a=123', mq.latex());
                    done();
                }, 1);
            }, 1);
        });
    });
    suite('saneKeyboardEvents', function () {
        var $ = window.test_only_jquery;
        var el;
        function supportsSelectionAPI() {
            return 'selectionStart' in el[0];
        }
        function mockController(opts) {
            return __assign({ addTextareaEventListeners: function (listeners) {
                    for (var key_3 in listeners) {
                        el[0].addEventListener(key_3, listeners[key_3]);
                    }
                } }, opts);
        }
        setup(function () {
            el = $('<textarea>').appendTo('#mock');
        });
        test('normal keys', function (done) {
            var counter = 0;
            saneKeyboardEvents(el[0], mockController({
                keystroke: noop,
                typedText: function (text, keydown, keypress) {
                    counter += 1;
                    assert.ok(counter <= 1, 'callback is only called once');
                    assert.equal(text, 'a', 'text comes back as a');
                    assert.equal(el.val(), '', 'the textarea remains empty');
                    done();
                },
            }));
            trigger.keydown(el[0], 'a');
            trigger.keypress(el[0], 'a');
            el.val('a');
        });
        test('normal keys without keypress', function (done) {
            var counter = 0;
            saneKeyboardEvents(el[0], mockController({
                keystroke: noop,
                typedText: function (text) {
                    counter += 1;
                    assert.ok(counter <= 1, 'callback is only called once');
                    assert.equal(text, 'a', 'text comes back as a');
                    assert.equal(el.val(), '', 'the textarea remains empty');
                    done();
                },
            }));
            trigger.keydown(el[0], 'a');
            trigger.keyup(el[0], 'a');
            el.val('a');
        });
        test('one keydown only', function (done) {
            var counter = 0;
            saneKeyboardEvents(el[0], mockController({
                keystroke: function (key, evt) {
                    counter += 1;
                    assert.ok(counter <= 1, 'callback is called only once');
                    assert.equal(key, 'Backspace', 'key is correctly set');
                    done();
                },
            }));
            trigger.keydown(el[0], 'Backspace');
        });
        test('a series of keydowns only', function (done) {
            var counter = 0;
            saneKeyboardEvents(el[0], mockController({
                keystroke: function (key, keydown) {
                    counter += 1;
                    assert.ok(counter <= 3, 'callback is called at most 3 times');
                    assert.ok(keydown);
                    assert.equal(key, 'Left');
                    if (counter === 3)
                        done();
                },
            }));
            trigger.keydown(el[0], 'ArrowLeft');
            trigger.keydown(el[0], 'ArrowLeft');
            trigger.keydown(el[0], 'ArrowLeft');
        });
        test('keys with evt.key values that are remapped', function (done) {
            var pairs = [
                ['ArrowRight', 'Right'],
                ['ArrowLeft', 'Left'],
                ['ArrowDown', 'Down'],
                ['ArrowUp', 'Up'],
                ['Delete', 'Del'],
                ['Escape', 'Esc'],
                [' ', 'Spacebar'],
            ];
            var counter = 0;
            saneKeyboardEvents(el[0], mockController({
                keystroke: function (key) {
                    assert.equal(key, pairs[counter][1]);
                    counter += 1;
                    if (counter === pairs.length)
                        done();
                },
            }));
            for (var i = 0; i < pairs.length; i++) {
                trigger.keydown(el[0], pairs[i][0]);
            }
        });
        test('one keydown and a series of keypresses', function (done) {
            var counter = 0;
            saneKeyboardEvents(el[0], mockController({
                keystroke: function (key, keydown) {
                    counter += 1;
                    assert.ok(counter <= 3, 'callback is called at most 3 times');
                    assert.ok(keydown);
                    assert.equal(key, 'Backspace');
                    if (counter === 3)
                        done();
                },
            }));
            trigger.keydown(el[0], 'Backspace');
            trigger.keypress(el[0], 'Backspace');
            trigger.keypress(el[0], 'Backspace');
            trigger.keypress(el[0], 'Backspace');
        });
        suite('select', function () {
            test("select populates the textarea but doesn't call .typedText()", function () {
                var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
                shim.select('foobar');
                assert.equal(el.val(), 'foobar');
                trigger.keydown(el[0]);
                assert.equal(el.val(), 'foobar', 'value remains after keydown');
                if (supportsSelectionAPI()) {
                    trigger.keypress(el[0]);
                    assert.equal(el.val(), 'foobar', 'value remains after keypress');
                    trigger.input(el[0]);
                    assert.equal(el.val(), 'foobar', 'value remains after flush after keypress');
                }
            });
            test("select populates the textarea but doesn't call text" +
                ' on keydown, even when the selection is not properly' +
                ' detectable', function () {
                var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
                shim.select('foobar');
                // monkey-patch the dom-level selection so that hasSelection()
                // returns false, as in IE < 9.
                el[0].selectionStart = el[0].selectionEnd = 0;
                trigger.keydown(el[0]);
                assert.equal(el.val(), 'foobar', 'value remains after keydown');
            });
            test('blurring', function () {
                var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
                shim.select('foobar');
                trigger.blur(el[0]);
                el.focus();
                // IE < 9 doesn't support selection{Start,End}
                if (supportsSelectionAPI()) {
                    assert.equal(el[0].selectionStart, 0, 'it is not selected at the start');
                    assert.equal(el[0].selectionEnd, 0, 'it is not selected at the end');
                }
                assert.equal(el.val(), '', 'it has no content');
            });
            test('blur then empty selection', function () {
                var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
                shim.select('foobar');
                el.blur();
                shim.select('');
                assert.ok(document.activeElement !== el[0], 'textarea remains blurred');
            });
            test('blur in keystroke handler', function (done) {
                if (!document.hasFocus()) {
                    console.warn('The test "blur in keystroke handler" needs the document to have ' +
                        'focus. Only when the document has focus does .select() on an ' +
                        'element also focus it, which is part of the problematic behavior ' +
                        'we are testing robustness against. (Specifically, erroneously ' +
                        'calling .select() in a timeout after the textarea has blurred, ' +
                        '"stealing back" focus.)\n' +
                        'Normally, the page being open and focused is enough to have focus, ' +
                        'but with the Developer Tools open, it depends on whether you last ' +
                        'clicked on something in the Developer Tools or on the page itself. ' +
                        'Click the page, or close the Developer Tools, and Refresh.');
                    $('#mock').empty(); // LOL next line skips teardown https://git.io/vaUWq
                    this.skip();
                }
                var shim = saneKeyboardEvents(el[0], mockController({
                    keystroke: function (key) {
                        assert.equal(key, 'Left');
                        el[0].blur();
                    },
                }));
                shim.select('foobar');
                assert.ok(document.activeElement === el[0], 'textarea focused');
                trigger.keydown(el[0], 'ArrowLeft');
                assert.ok(document.activeElement !== el[0], 'textarea blurred');
                setTimeout(function () {
                    assert.ok(document.activeElement !== el[0], 'textarea remains blurred');
                    done();
                });
            });
            suite("selected text after keypress or paste doesn't get mistaken" +
                ' for inputted text', function () {
                test('select() immediately after paste', function () {
                    var pastedText;
                    var onPaste = function (text) {
                        pastedText = text;
                    };
                    var shim = saneKeyboardEvents(el[0], mockController({
                        paste: function (text) {
                            onPaste(text);
                        },
                    }));
                    trigger.paste(el[0]);
                    el.val('$x^2+1$');
                    shim.select('$\\frac{x^2+1}{2}$');
                    assert.equal(pastedText, '$x^2+1$');
                    assert.equal(el.val(), '$\\frac{x^2+1}{2}$');
                    onPaste = null;
                    shim.select('$2$');
                    assert.equal(el.val(), '$2$');
                });
                test('select() after paste/input', function () {
                    var pastedText;
                    var onPaste = function (text) {
                        pastedText = text;
                    };
                    var shim = saneKeyboardEvents(el[0], mockController({
                        paste: function (text) {
                            onPaste(text);
                        },
                    }));
                    trigger.paste(el[0]);
                    el.val('$x^2+1$');
                    trigger.input(el[0]);
                    assert.equal(pastedText, '$x^2+1$');
                    assert.equal(el.val(), '');
                    onPaste = null;
                    shim.select('$\\frac{x^2+1}{2}$');
                    assert.equal(el.val(), '$\\frac{x^2+1}{2}$');
                    shim.select('$2$');
                    assert.equal(el.val(), '$2$');
                });
                test('select() immediately after keydown/keypress', function () {
                    var typedText;
                    var onText = function (text) {
                        typedText = text;
                    };
                    var shim = saneKeyboardEvents(el[0], mockController({
                        keystroke: noop,
                        typedText: function (text) {
                            onText(text);
                        },
                    }));
                    trigger.keydown(el[0], 'a');
                    trigger.keypress(el[0], 'a');
                    el.val('a');
                    shim.select('$\\frac{a}{2}$');
                    assert.equal(typedText, 'a');
                    assert.equal(el.val(), '$\\frac{a}{2}$');
                    onText = null;
                    shim.select('$2$');
                    assert.equal(el.val(), '$2$');
                });
                test('select() after keydown/keypress/input', function () {
                    var typedText;
                    var onText = function (text) {
                        typedText = text;
                    };
                    var shim = saneKeyboardEvents(el[0], mockController({
                        keystroke: noop,
                        typedText: function (text) {
                            onText(text);
                        },
                    }));
                    trigger.keydown(el[0], 'a');
                    trigger.keypress(el[0], 'a');
                    el.val('a');
                    trigger.input(el[0]);
                    assert.equal(typedText, 'a');
                    onText = null;
                    shim.select('$\\frac{a}{2}$');
                    assert.equal(el.val(), '$\\frac{a}{2}$');
                    shim.select('$2$');
                    assert.equal(el.val(), '$2$');
                });
                suite('unrecognized keys that move cursor and clear selection', function () {
                    test('without keypress', function () {
                        var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
                        shim.select('a');
                        assert.equal(el.val(), 'a');
                        if (!supportsSelectionAPI())
                            return;
                        trigger.keydown(el[0], 'ArrowLeft', { altKey: true });
                        el[0].selectionEnd = 0;
                        trigger.keyup(el[0], 'ArrowLeft', { altKey: true });
                        assert.ok(el[0].selectionStart !== el[0].selectionEnd);
                        el.blur();
                        shim.select('');
                        assert.ok(document.activeElement !== el[0], 'textarea remains blurred');
                    });
                    test('with keypress, many characters selected', function () {
                        var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
                        shim.select('many characters');
                        assert.equal(el.val(), 'many characters');
                        if (!supportsSelectionAPI())
                            return;
                        trigger.keydown(el[0], 'ArrowLeft', { altKey: true });
                        trigger.keypress(el[0], 'ArrowLeft', { altKey: true });
                        el[0].selectionEnd = 0;
                        trigger.keyup(el[0]);
                        assert.ok(el[0].selectionStart !== el[0].selectionEnd);
                        el.blur();
                        shim.select('');
                        assert.ok(document.activeElement !== el[0], 'textarea remains blurred');
                    });
                });
            });
        });
        suite('paste', function () {
            test('paste event only', function (done) {
                saneKeyboardEvents(el[0], mockController({
                    paste: function (text) {
                        assert.equal(text, '$x^2+1$');
                        done();
                    },
                }));
                trigger.paste(el[0]);
                el.val('$x^2+1$');
            });
            test('paste after keydown/keypress', function (done) {
                saneKeyboardEvents(el[0], mockController({
                    keystroke: noop,
                    paste: function (text) {
                        assert.equal(text, 'foobar');
                        done();
                    },
                }));
                // Ctrl-V in Firefox or Opera, according to unixpapa.com/js/key.html
                // without an `input` event
                trigger.keydown(el[0], 'V', { ctrlKey: true });
                trigger.keypress(el[0], 'v', { ctrlKey: true });
                trigger.paste(el[0]);
                el.val('foobar');
            });
            test('paste after keydown/keypress/input', function (done) {
                saneKeyboardEvents(el[0], mockController({
                    keystroke: noop,
                    paste: function (text) {
                        assert.equal(text, 'foobar');
                        done();
                    },
                }));
                // Ctrl-V in Firefox or Opera, according to unixpapa.com/js/key.html
                // with an `input` event
                trigger.keydown(el[0], 'V', { ctrlKey: true });
                trigger.keypress(el[0], 'v', { ctrlKey: true });
                trigger.paste(el[0]);
                el.val('foobar');
                trigger.input(el[0]);
            });
            test('keypress timeout happening before paste timeout', function (done) {
                saneKeyboardEvents(el[0], mockController({
                    keystroke: noop,
                    paste: function (text) {
                        assert.equal(text, 'foobar');
                        done();
                    },
                }));
                trigger.keydown(el[0], 'V', { ctrlKey: true });
                trigger.keypress(el[0], 'v', { ctrlKey: true });
                trigger.paste(el[0]);
                el.val('foobar');
                // this synthesizes the keypress timeout calling handleText()
                // before the paste timeout happens.
                trigger.input(el[0]);
            });
            test('pasting into a focused textarea should not fire a redundant focus event', function (done) {
                el.focus();
                var focusCalled = false;
                el.focus(function () {
                    focusCalled = true;
                });
                saneKeyboardEvents(el[0], mockController({
                    paste: function () {
                        assert.ok(!focusCalled, 'Pasting into a focused mathquill should not fire a focus event');
                        done();
                    },
                }));
                // Simulate a paste
                trigger.paste(el[0]);
                el.val('2');
                trigger.input(el[0]);
            });
        });
        suite('copy', function () {
            test('only runs handler once even if handler synchronously selects', function () {
                // ...which MathQuill does and resulted in a stack overflow: https://git.io/vosm0
                var shim = saneKeyboardEvents(el[0], mockController({
                    copy: function () {
                        shim.select();
                    },
                }));
                trigger.copy(el[0]);
            });
        });
    });
    suite('scrollHoriz', function () {
        var $ = window.test_only_jquery;
        var mq;
        var $el;
        setup(function () {
            $el = $('<span style="display:inline-block; width: 100px"></span>');
            mq = MQ.MathField($el.appendTo('#mock')[0]);
        });
        test('classes added as expected', function (done) {
            mq.latex('beginning ------------ end');
            var $root = $el.find('.mq-root-block');
            assert.ok($root.is(':not(.mq-editing-overflow-left)'), 'no left overflow class');
            assert.ok($root.is(':not(.mq-editing-overflow-right)'), 'no right overflow class');
            assert.equal($root.scrollLeft(), 0, 'unscrolled');
            mq.focus();
            assert.ok($root.is(':not(.mq-editing-overflow-left)'), 'no left overflow class');
            assert.ok($root.is('.mq-editing-overflow-right'), 'has right overflow class');
            mq.keystroke('Shift-Right');
            setTimeout(function () {
                assert.ok($root.is('.mq-editing-overflow-left'), 'has left overflow class');
                assert.ok($root.is(':not(.mq-editing-overflow-right)'), 'no right overflow class');
                assert.ok($root.scrollLeft() > 0, 'now scrolled');
                mq.blur();
                setTimeout(function () {
                    assert.ok($root.is(':not(.mq-editing-overflow-left)'), 'left overflow class removed');
                    assert.ok($root.is(':not(.mq-editing-overflow-right)'), 'no right overflow class');
                    assert.equal($root.scrollLeft(), 0, 'scrolled back left');
                    done();
                }, 200);
            }, 200);
        });
    });
    suite('Cursor::select()', function () {
        var $ = window.test_only_jquery;
        var cursor = new Cursor();
        // Stub out insDirOf since it does DOM operations that are not valid
        // for this cursor, which is not fully constructed
        cursor.insDirOf = function () {
            return this;
        };
        cursor.selectionChanged = noop;
        function assertSelection(A, B, leftEnd, rightEnd) {
            var lca = leftEnd.parent, frag = new Fragment(leftEnd, rightEnd || leftEnd);
            (function eitherOrder(A, B) {
                var count = 0;
                lca.selectChildren = function (leftEnd, rightEnd) {
                    count += 1;
                    assert.equal(frag.ends[L], leftEnd);
                    assert.equal(frag.ends[R], rightEnd);
                    return MQNode.prototype.selectChildren.apply(this, arguments);
                };
                Point.prototype.init.call(cursor, A.parent, A[L], A[R]);
                cursor.startSelection();
                Point.prototype.init.call(cursor, B.parent, B[L], B[R]);
                assert.equal(cursor.select(), true);
                assert.equal(count, 1);
                return eitherOrder;
            })(A, B)(B, A);
        }
        var parent = new MQNode();
        var child1 = new MQNode().adopt(parent, parent.ends[R], 0);
        var child2 = new MQNode().adopt(parent, parent.ends[R], 0);
        var child3 = new MQNode().adopt(parent, parent.ends[R], 0);
        var A = new Point(parent, 0, child1);
        var B = new Point(parent, child1, child2);
        var C = new Point(parent, child2, child3);
        var D = new Point(parent, child3, 0);
        var pt1 = new Point(child1, 0, 0);
        var pt2 = new Point(child2, 0, 0);
        var pt3 = new Point(child3, 0, 0);
        test('same parent, one Node', function () {
            assertSelection(A, B, child1);
            assertSelection(B, C, child2);
            assertSelection(C, D, child3);
        });
        test('same Parent, many Nodes', function () {
            assertSelection(A, C, child1, child2);
            assertSelection(A, D, child1, child3);
            assertSelection(B, D, child2, child3);
        });
        test('Point next to parent of other Point', function () {
            assertSelection(A, pt1, child1);
            assertSelection(B, pt1, child1);
            assertSelection(B, pt2, child2);
            assertSelection(C, pt2, child2);
            assertSelection(C, pt3, child3);
            assertSelection(D, pt3, child3);
        });
        test("Points' parents are siblings", function () {
            assertSelection(pt1, pt2, child1, child2);
            assertSelection(pt2, pt3, child2, child3);
            assertSelection(pt1, pt3, child1, child3);
        });
        test('Point is sibling of parent of other Point', function () {
            assertSelection(A, pt2, child1, child2);
            assertSelection(A, pt3, child1, child3);
            assertSelection(B, pt3, child2, child3);
            assertSelection(pt1, D, child1, child3);
            assertSelection(pt1, C, child1, child2);
        });
        test('same Point', function () {
            Point.prototype.init.call(cursor, A.parent, A[L], A[R]);
            cursor.startSelection();
            assert.equal(cursor.select(), false);
        });
        test('different trees', function () {
            var anotherTree = new MQNode();
            Point.prototype.init.call(cursor, A.parent, A[L], A[R]);
            cursor.startSelection();
            Point.prototype.init.call(cursor, anotherTree, 0, 0);
            assert.throws(function () {
                cursor.select();
            });
            Point.prototype.init.call(cursor, anotherTree, 0, 0);
            cursor.startSelection();
            Point.prototype.init.call(cursor, A.parent, A[L], A[R]);
            assert.throws(function () {
                cursor.select();
            });
        });
    });
    suite('text', function () {
        var $ = window.test_only_jquery;
        var mq, mostRecentlyReportedLatex;
        setup(function () {
            mostRecentlyReportedLatex = NaN; // != to everything
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                handlers: {
                    edit: function () {
                        mostRecentlyReportedLatex = mq.latex();
                    },
                },
            });
        });
        function prayWellFormedPoint(pt) {
            prayWellFormed(pt.parent, pt[L], pt[R]);
        }
        function assertLatex(latex) {
            prayWellFormedPoint(mq.__controller.cursor);
            assert.equal(mostRecentlyReportedLatex, latex, 'assertLatex failed');
            assert.equal(mq.latex(), latex, 'assertLatex failed');
        }
        function fromLatex(latex) {
            return latexMathParser.parse(latex);
        }
        // return HTML string for the given node or DocumentFragment
        function domToString(dom) {
            var div = document.createElement('div');
            div.appendChild(dom);
            return div.innerHTML;
        }
        function assertSplit(domFrag, prev, next) {
            var dom = domFrag.firstElement();
            if (prev) {
                assert.ok(dom.previousSibling instanceof Text);
                assert.equal(prev, dom.previousSibling.data, 'assertSplit failed');
            }
            else {
                assert.ok(!dom.previousSibling);
            }
            if (next) {
                assert.ok(dom.nextSibling instanceof Text);
                assert.equal(next, dom.nextSibling.data, 'assertSplit failed');
            }
            else {
                assert.ok(!dom.nextSibling);
            }
        }
        test('changes the text nodes as the cursor moves around', function () {
            mq.latex('\\text{abc}');
            var ctrlr = mq.__controller;
            var cursor = ctrlr.cursor;
            ctrlr.moveLeft();
            assertSplit(cursor.domFrag(), 'abc', null);
            ctrlr.moveLeft();
            assertSplit(cursor.domFrag(), 'ab', 'c');
            ctrlr.moveLeft();
            assertSplit(cursor.domFrag(), 'a', 'bc');
            ctrlr.moveLeft();
            assertSplit(cursor.domFrag(), null, 'abc');
            ctrlr.moveRight();
            assertSplit(cursor.domFrag(), 'a', 'bc');
            ctrlr.moveRight();
            assertSplit(cursor.domFrag(), 'ab', 'c');
            ctrlr.moveRight();
            assertSplit(cursor.domFrag(), 'abc', null);
        });
        test('does not change latex as the cursor moves around', function () {
            mq.latex('\\text{x}');
            var ctrlr = mq.__controller;
            ctrlr.moveLeft();
            ctrlr.moveLeft();
            ctrlr.moveLeft();
            assert.equal(mq.latex(), '\\text{x}');
        });
        suite('typing', function () {
            test('stepping out of an empty block deletes it', function () {
                var controller = mq.__controller;
                var cursor = controller.cursor;
                mq.latex('\\text{x}');
                assertLatex('\\text{x}');
                mq.keystroke('Left');
                assertSplit(cursor.domFrag(), 'x');
                assertLatex('\\text{x}');
                mq.keystroke('Backspace');
                assertSplit(cursor.domFrag());
                assertLatex('');
                mq.keystroke('Right');
                assertSplit(cursor.domFrag());
                assert.equal(cursor[L], 0);
                assertLatex('');
            });
            test('typing $ in a textblock splits it', function () {
                var controller = mq.__controller;
                var cursor = controller.cursor;
                mq.latex('\\text{asdf}');
                assertLatex('\\text{asdf}');
                mq.keystroke('Left Left Left');
                assertSplit(cursor.domFrag(), 'as', 'df');
                assertLatex('\\text{asdf}');
                mq.typedText('$');
                assertLatex('\\text{as}\\text{df}');
            });
        });
        suite('pasting', function () {
            test('sanity', function () {
                var controller = mq.__controller;
                var cursor = controller.cursor;
                mq.latex('\\text{asdf}');
                mq.keystroke('Left Left Left');
                assertSplit(cursor.domFrag(), 'as', 'df');
                controller.paste('foo');
                assertSplit(cursor.domFrag(), 'asfoo', 'df');
                assertLatex('\\text{asfoodf}');
                prayWellFormedPoint(cursor);
            });
            test('pasting a dollar sign', function () {
                var controller = mq.__controller;
                var cursor = controller.cursor;
                mq.latex('\\text{asdf}');
                mq.keystroke('Left Left Left');
                assertSplit(cursor.domFrag(), 'as', 'df');
                controller.paste('$foo');
                assertSplit(cursor.domFrag(), 'as$foo', 'df');
                assertLatex('\\text{as$foodf}');
                prayWellFormedPoint(cursor);
            });
            test('pasting a backslash', function () {
                var controller = mq.__controller;
                var cursor = controller.cursor;
                mq.latex('\\text{asdf}');
                mq.keystroke('Left Left Left');
                assertSplit(cursor.domFrag(), 'as', 'df');
                controller.paste('\\pi');
                assertSplit(cursor.domFrag(), 'as\\pi', 'df');
                assertLatex('\\text{as\\backslash pidf}');
                prayWellFormedPoint(cursor);
            });
            test('pasting a curly brace', function () {
                var controller = mq.__controller;
                var cursor = controller.cursor;
                mq.latex('\\text{asdf}');
                mq.keystroke('Left Left Left');
                assertSplit(cursor.domFrag(), 'as', 'df');
                controller.paste('{');
                assertSplit(cursor.domFrag(), 'as{', 'df');
                assertLatex('\\text{as\\{df}');
                prayWellFormedPoint(cursor);
            });
        });
        test('HTML for subclassed text blocks', function () {
            var block = fromLatex('\\text{abc}');
            block = fromLatex('\\text{abc}');
            assert.equal(domToString(block.html()), '<span class="mq-text-mode">abc</span>');
            block = fromLatex('\\textit{abc}');
            assert.equal(domToString(block.html()), '<i class="mq-text-mode">abc</i>');
            block = fromLatex('\\textbf{abc}');
            assert.equal(domToString(block.html()), '<b class="mq-text-mode">abc</b>');
            block = fromLatex('\\textsf{abc}');
            assert.equal(domToString(block.html()), '<span class="mq-sans-serif mq-text-mode">abc</span>');
            block = fromLatex('\\texttt{abc}');
            assert.equal(domToString(block.html()), '<span class="mq-monospace mq-text-mode">abc</span>');
            block = fromLatex('\\textsc{abc}');
            assert.equal(domToString(block.html()), '<span style="font-variant:small-caps" class="mq-text-mode">abc</span>');
            block = fromLatex('\\uppercase{abc}');
            assert.equal(domToString(block.html()), '<span style="text-transform:uppercase" class="mq-text-mode">abc</span>');
            block = fromLatex('\\lowercase{abc}');
            assert.equal(domToString(block.html()), '<span style="text-transform:lowercase" class="mq-text-mode">abc</span>');
        });
    });
    suite('tree', function () {
        var $ = window.test_only_jquery;
        suite('adopt', function () {
            function assertTwoChildren(parent, one, two) {
                assert.equal(one.parent, parent, 'one.parent is set');
                assert.equal(two.parent, parent, 'two.parent is set');
                assert.ok(!one[L], 'one has nothing leftward');
                assert.equal(one[R], two, 'one[R] is two');
                assert.equal(two[L], one, 'two[L] is one');
                assert.ok(!two[R], 'two has nothing rightward');
                assert.equal(parent.ends[L], one, 'parent.ends[L] is one');
                assert.equal(parent.ends[R], two, 'parent.ends[R] is two');
            }
            test('the empty case', function () {
                var parent = new MQNode();
                var child = new MQNode();
                child.adopt(parent, 0, 0);
                assert.equal(child.parent, parent, 'child.parent is set');
                assert.ok(!child[R], 'child has nothing rightward');
                assert.ok(!child[L], 'child has nothing leftward');
                assert.equal(parent.ends[L], child, 'child is parent.ends[L]');
                assert.equal(parent.ends[R], child, 'child is parent.ends[R]');
            });
            test('with two children from the left', function () {
                var parent = new MQNode();
                var one = new MQNode();
                var two = new MQNode();
                one.adopt(parent, 0, 0);
                two.adopt(parent, one, 0);
                assertTwoChildren(parent, one, two);
            });
            test('with two children from the right', function () {
                var parent = new MQNode();
                var one = new MQNode();
                var two = new MQNode();
                two.adopt(parent, 0, 0);
                one.adopt(parent, 0, two);
                assertTwoChildren(parent, one, two);
            });
            test('adding one in the middle', function () {
                var parent = new MQNode();
                var leftward = new MQNode();
                var rightward = new MQNode();
                var middle = new MQNode();
                leftward.adopt(parent, 0, 0);
                rightward.adopt(parent, leftward, 0);
                middle.adopt(parent, leftward, rightward);
                assert.equal(middle.parent, parent, 'middle.parent is set');
                assert.equal(middle[L], leftward, 'middle[L] is set');
                assert.equal(middle[R], rightward, 'middle[R] is set');
                assert.equal(leftward[R], middle, 'leftward[R] is middle');
                assert.equal(rightward[L], middle, 'rightward[L] is middle');
                assert.equal(parent.ends[L], leftward, 'parent.ends[L] is leftward');
                assert.equal(parent.ends[R], rightward, 'parent.ends[R] is rightward');
            });
        });
        suite('disown', function () {
            function assertSingleChild(parent, child) {
                assert.equal(parent.ends[L], child, 'parent.ends[L] is child');
                assert.equal(parent.ends[R], child, 'parent.ends[R] is child');
                assert.ok(!child[L], 'child has nothing leftward');
                assert.ok(!child[R], 'child has nothing rightward');
            }
            test('the empty case', function () {
                var parent = new MQNode();
                var child = new MQNode();
                child.adopt(parent, 0, 0);
                child.disown();
                assert.ok(!parent.ends[L], 'parent has no left end child');
                assert.ok(!parent.ends[R], 'parent has no right end child');
            });
            test('disowning the right end child', function () {
                var parent = new MQNode();
                var one = new MQNode();
                var two = new MQNode();
                one.adopt(parent, 0, 0);
                two.adopt(parent, one, 0);
                two.disown();
                assertSingleChild(parent, one);
                assert.equal(two.parent, parent, 'two retains its parent');
                assert.equal(two[L], one, 'two retains its [L]');
                assert.throws(function () {
                    two.disown();
                }, 'disown fails on a malformed tree');
            });
            test('disowning the left end child', function () {
                var parent = new MQNode();
                var one = new MQNode();
                var two = new MQNode();
                one.adopt(parent, 0, 0);
                two.adopt(parent, one, 0);
                one.disown();
                assertSingleChild(parent, two);
                assert.equal(one.parent, parent, 'one retains its parent');
                assert.equal(one[R], two, 'one retains its [R]');
                assert.throws(function () {
                    one.disown();
                }, 'disown fails on a malformed tree');
            });
            test('disowning the middle', function () {
                var parent = new MQNode();
                var leftward = new MQNode();
                var rightward = new MQNode();
                var middle = new MQNode();
                leftward.adopt(parent, 0, 0);
                rightward.adopt(parent, leftward, 0);
                middle.adopt(parent, leftward, rightward);
                middle.disown();
                assert.equal(leftward[R], rightward, 'leftward[R] is rightward');
                assert.equal(rightward[L], leftward, 'rightward[L] is leftward');
                assert.equal(parent.ends[L], leftward, 'parent.ends[L] is leftward');
                assert.equal(parent.ends[R], rightward, 'parent.ends[R] is rightward');
                assert.equal(middle.parent, parent, 'middle retains its parent');
                assert.equal(middle[R], rightward, 'middle retains its [R]');
                assert.equal(middle[L], leftward, 'middle retains its [L]');
                assert.throws(function () {
                    middle.disown();
                }, 'disown fails on a malformed tree');
            });
        });
        suite('fragments', function () {
            test('an empty fragment', function () {
                var empty = new Fragment(0, 0);
                var count = 0;
                empty.each(function () {
                    count += 1;
                });
                assert.equal(count, 0, 'each is a noop on an empty fragment');
            });
            test('half-empty fragments are disallowed', function () {
                assert.throws(function () {
                    new Fragment(new MQNode(), 0);
                }, 'half-empty on the right');
                assert.throws(function () {
                    new Fragment(0, new MQNode());
                }, 'half-empty on the left');
            });
            test('directionalized constructor call', function () {
                var ChNode = /** @class */ (function (_super) {
                    __extends(ChNode, _super);
                    function ChNode(ch) {
                        var _this_1 = _super.call(this) || this;
                        _this_1.ch = ch;
                        return _this_1;
                    }
                    return ChNode;
                }(MQNode));
                var parent = new MQNode();
                var a = new ChNode('a').adopt(parent, parent.ends[R], 0);
                var b = new ChNode('b').adopt(parent, parent.ends[R], 0);
                var c = new ChNode('c').adopt(parent, parent.ends[R], 0);
                var d = new ChNode('d').adopt(parent, parent.ends[R], 0);
                var e = new ChNode('e').adopt(parent, parent.ends[R], 0);
                function cat(str, node) {
                    return str + node.ch;
                }
                assert.equal('bcd', new Fragment(b, d).fold('', cat));
                assert.equal('bcd', new Fragment(b, d, L).fold('', cat));
                assert.equal('bcd', new Fragment(d, b, R).fold('', cat));
                assert.throws(function () {
                    new Fragment(d, b, L);
                });
                assert.throws(function () {
                    new Fragment(b, d, R);
                });
            });
            test('disown is idempotent', function () {
                var parent = new MQNode();
                var one = new MQNode().adopt(parent, 0, 0);
                var two = new MQNode().adopt(parent, one, 0);
                var frag = new Fragment(one, two);
                frag.disown();
                frag.disown();
            });
        });
    });
    suite('typing with auto-replaces', function () {
        var $ = window.test_only_jquery;
        var mq, mostRecentlyReportedLatex;
        setup(function () {
            mostRecentlyReportedLatex = NaN; // != to everything
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
                handlers: {
                    edit: function () {
                        mostRecentlyReportedLatex = mq.latex();
                    },
                },
            });
        });
        function prayWellFormedPoint(pt) {
            prayWellFormed(pt.parent, pt[L], pt[R]);
        }
        function assertLatex(latex) {
            prayWellFormedPoint(mq.__controller.cursor);
            assert.equal(mostRecentlyReportedLatex, latex);
            assert.equal(mq.latex(), latex);
        }
        function assertMathspeak(mathspeak) {
            assert.equal(normalize(mq.mathspeak()), normalize(mathspeak));
            function normalize(str) {
                return str
                    .replace(/\d(?!\d)/g, '$& ')
                    .split(/[ ,]+/)
                    .join(' ')
                    .trim();
            }
        }
        suite('cursor movement', function () {
            test('escaping left with a selection', function () {
                mq.typedText('(0');
                assertLatex('\\left(0\\right)');
                mq.keystroke('Shift-Left');
                // Should move the cursor back to the beginning of the input
                mq.keystroke('Shift-Tab');
                mq.typedText('3');
                assertLatex('3\\left(0\\right)');
                mq.keystroke('Left Shift-Right Shift-Right Backspace');
                assertLatex('');
            });
        });
        suite('LiveFraction', function () {
            test('full MathQuill', function () {
                mq.typedText('1/2').keystroke('Tab').typedText('+sinx/');
                assertLatex('\\frac{1}{2}+\\frac{\\sin x}{ }');
                mq.latex('').typedText('1+/2');
                assertLatex('1+\\frac{2}{ }');
                mq.latex('').typedText('1 2/3');
                assertLatex('1\\ \\frac{2}{3}');
            });
            test('mathquill-basic', function () {
                var mq_basic = MQBasic.MathField($('<span></span>').appendTo('#mock')[0]);
                mq_basic.typedText('1/2');
                assert.equal(mq_basic.latex(), '\\frac{1}{2}');
            });
        });
        suite('EquivalentMinus', function () {
            test('different minus symbols', function () {
                //these 4 are all different characters (!!)
                mq.typedText('−—–-');
                //these 4 are all the same character
                assertLatex('----');
            });
        });
        suite('LatexCommandInput', function () {
            test('basic', function () {
                mq.typedText('\\sqrt-x');
                assertLatex('\\sqrt{-x}');
            });
            test("they're passed their name", function () {
                mq.cmd('\\alpha');
                assert.equal(mq.latex(), '\\alpha');
            });
            test('replaces selection', function () {
                mq.typedText('49').select().typedText('\\sqrt').keystroke('Enter');
                assertLatex('\\sqrt{49}');
            });
            test('removes selection if it is removed', function () {
                mq.typedText('49').select().typedText('\\').keystroke('Backspace');
                assertLatex('');
            });
            test('auto-operator names', function () {
                mq.typedText('\\sin^2');
                assertLatex('\\sin^{2}');
            });
            test('nonexistent LaTeX command', function () {
                mq.typedText('\\asdf').keystroke('Enter');
                assertLatex('\\text{asdf}');
            });
            test('nonexistent LaTeX command, then symbol', function () {
                mq.typedText('\\asdf+');
                assertLatex('\\text{asdf}+');
            });
            test('dollar sign', function () {
                mq.typedText('$');
                assertLatex('\\$');
            });
            test('\\text followed by command', function () {
                mq.typedText('\\text{');
                assertLatex('\\text{\\{}');
            });
        });
        suite('MathspeakShorthand', function () {
            test('fractions', function () {
                // Testing singular numeric fractions from 1/2 to 1/10
                mq.latex('\\frac{1}{2}');
                assertMathspeak('1 half');
                mq.latex('\\frac{1}{3}');
                assertMathspeak('1 third');
                mq.latex('\\frac{1}{4}');
                assertMathspeak('1 quarter');
                mq.latex('\\frac{1}{5}');
                assertMathspeak('1 fifth');
                mq.latex('\\frac{1}{6}');
                assertMathspeak('1 sixth');
                mq.latex('\\frac{1}{7}');
                assertMathspeak('1 seventh');
                mq.latex('\\frac{1}{8}');
                assertMathspeak('1 eighth');
                mq.latex('\\frac{1}{9}');
                assertMathspeak('1 ninth');
                mq.latex('\\frac{1}{10}');
                assertMathspeak('StartFraction, 1 Over 10, EndFraction');
                // Testing plural numeric fractions from 31/2 to 31/10
                mq.latex('\\frac{31}{2}');
                assertMathspeak('31 halves');
                mq.latex('\\frac{31}{3}');
                assertMathspeak('31 thirds');
                mq.latex('\\frac{31}{4}');
                assertMathspeak('31 quarters');
                mq.latex('\\frac{31}{5}');
                assertMathspeak('31 fifths');
                mq.latex('\\frac{31}{6}');
                assertMathspeak('31 sixths');
                mq.latex('\\frac{31}{7}');
                assertMathspeak('31 sevenths');
                mq.latex('\\frac{31}{8}');
                assertMathspeak('31 eighths');
                mq.latex('\\frac{31}{9}');
                assertMathspeak('31 ninths');
                mq.latex('\\frac{31}{10}');
                assertMathspeak('StartFraction, 31 Over 10, EndFraction');
                // Fractions with negative numerators should be shortened
                mq.latex('\\frac{-1}{2}');
                assertMathspeak('negative 1 half');
                mq.latex('\\frac{-3}{2}');
                assertMathspeak('negative 3 halves');
                mq.latex('-\\frac{3}{4}');
                assertMathspeak('negative 3 quarters');
                // Fractions with negative denominators should not be shortened
                mq.latex('\\frac{1}{-2}');
                assertMathspeak('StartFraction, 1 Over negative 2, EndFraction');
                // Traditional fractions should be spoken if either numerator or denominator are not numeric
                mq.latex('\\frac{x}{2}');
                assertMathspeak('StartFraction, "x" Over 2, EndFraction');
                mq.latex('\\frac{2}{x}');
                assertMathspeak('StartFraction, 2 Over "x", EndFraction');
                // Traditional fractions should be spoken if either numerator or denominator are not whole numbers
                mq.latex('\\frac{1.2}{2}');
                assertMathspeak('StartFraction, 1.2 Over 2, EndFraction');
                mq.latex('\\frac{4}{2.3}');
                assertMathspeak('StartFraction, 4 Over 2.3, EndFraction');
                // A whole number followed by a shortened fraction should include the word "and", and other combinations should not.
                mq.latex('3\\frac{3}{8}');
                assertMathspeak('3 and 3 eighths');
                mq.latex('3\\ \\frac{3}{8}');
                assertMathspeak('3 and 3 eighths');
                mq.latex('3\\ \\ \\ \\ \\ \\frac{3}{8}');
                assertMathspeak('3 and 3 eighths');
                mq.latex('3.1\\frac{3}{8}');
                assertMathspeak('3.1 3 eighths');
                mq.latex('3.1\\ \\frac{3}{8}');
                assertMathspeak('3.1 3 eighths');
                mq.latex('3.1\\ \\ \\ \\ \\frac{3}{8}');
                assertMathspeak('3.1 3 eighths');
                mq.latex('\\ \\frac{1}{2}');
                assertMathspeak('1 half');
                mq.latex('3\\frac{3}{x}');
                assertMathspeak('3 StartFraction, 3 Over "x", EndFraction');
                mq.latex('x\\frac{3}{8}');
                assertMathspeak('"x" 3 eighths');
            });
            test('exponents', function () {
                // Test simple superscripts and suffix rules
                mq.latex('x^{0}');
                assertMathspeak('"x" to the 0 power');
                mq.latex('x^{1}');
                assertMathspeak('"x" to the 1st power');
                mq.latex('x^{2}');
                assertMathspeak('"x" squared');
                mq.latex('x^{3}');
                assertMathspeak('"x" cubed');
                mq.latex('x^{4}');
                assertMathspeak('"x" to the 4th power');
                mq.latex('x^{5}');
                assertMathspeak('"x" to the 5th power');
                mq.latex('x^{6}');
                assertMathspeak('"x" to the 6th power');
                mq.latex('x^{7}');
                assertMathspeak('"x" to the 7th power');
                mq.latex('x^{8}');
                assertMathspeak('"x" to the 8th power');
                mq.latex('x^{9}');
                assertMathspeak('"x" to the 9th power');
                mq.latex('x^{10}');
                assertMathspeak('"x" to the 10th power');
                mq.latex('x^{11}');
                assertMathspeak('"x" to the 11th power');
                mq.latex('x^{12}');
                assertMathspeak('"x" to the 12th power');
                mq.latex('x^{13}');
                assertMathspeak('"x" to the 13th power');
                mq.latex('x^{14}');
                assertMathspeak('"x" to the 14th power');
                mq.latex('x^{21}');
                assertMathspeak('"x" to the 21st power');
                mq.latex('x^{22}');
                assertMathspeak('"x" to the 22nd power');
                mq.latex('x^{23}');
                assertMathspeak('"x" to the 23rd power');
                mq.latex('x^{999}');
                assertMathspeak('"x" to the 999th power');
                // Values greater than 1000 have no suffix
                mq.latex('x^{1000}');
                assertMathspeak('"x" to the 1000 power');
                mq.latex('x^{10000000000}');
                assertMathspeak('"x" to the 10000000000 power');
                // Ensure negative exponents are shortened
                mq.latex('10^{-5}');
                assertMathspeak('10 to the negative 5th power');
                mq.latex('x^{-5}');
                assertMathspeak('"x" to the negative 5th power');
                // Superscripts that are not strictly integers should continue to be spoken in longer form
                mq.latex('x^{5.3}');
                assertMathspeak('"x" Superscript, 5.3, Baseline');
                mq.latex('x^{y}');
                assertMathspeak('"x" Superscript, "y", Baseline');
                mq.latex('x^{y^{2}}');
                assertMathspeak('"x" Superscript, "y" squared, Baseline');
            });
            test('plus and minus differentiation', function () {
                // Distinguish between positive vs plus and negative vs. minus
                mq.latex('-25-25');
                assertMathspeak('negative 25 minus 25');
                mq.latex('+25+25');
                assertMathspeak('positive 25 plus 25');
            });
            test('styled text', function () {
                // Test that text-related elements include sensible mathspeak.
                // Letters in a non-wrapped block should be split apart (interpreted as variables):
                mq.latex('this is a test');
                assertMathspeak('"t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t"');
                // Contents of a text block should be returned exactly as entered with no start and end delimiters spoken:
                mq.latex('\\text{this is a test}');
                assertMathspeak('this is a test');
                // Specifically for mathrm, don't split characters and also don't speak delimiters.
                // note content is still interpreted as LaTeX, so we use \ to separate words:
                mq.latex('\\mathrm{this\\ is\\ a\\ test}');
                assertMathspeak('this is a test');
                // Any other font command should be spoken "normally"--
                // letters are split and delimiters are announced for remaining commands:
                mq.latex('\\mathit{this\\ is\\ a\\ test}');
                assertMathspeak('StartItalic Font "t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t" EndItalic Font');
                mq.latex('\\textcolor{red}{this\\ is\\ a\\ test}');
                assertMathspeak('Start red "t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t" End red');
                mq.latex('\\class{abc}{this\\ is\\ a\\ test}');
                assertMathspeak('Start abc class "t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t" End abc class');
            });
        });
        suite('auto-expanding parens', function () {
            suite('simple', function () {
                test('empty parens ()', function () {
                    mq.typedText('(');
                    assertLatex('\\left(\\right)');
                    mq.typedText(')');
                    assertLatex('\\left(\\right)');
                });
                test('straight typing 1+(2+3)+4', function () {
                    mq.typedText('1+(2+3)+4');
                    assertLatex('1+\\left(2+3\\right)+4');
                });
                test('basic command \\sin(', function () {
                    mq.typedText('\\sin(');
                    assertLatex('\\sin\\left(\\right)');
                });
                test('wrapping things in parens 1+(2+3)+4', function () {
                    mq.typedText('1+2+3+4');
                    assertLatex('1+2+3+4');
                    mq.keystroke('Left Left').typedText(')');
                    assertLatex('\\left(1+2+3\\right)+4');
                    mq.keystroke('Left Left Left Left').typedText('(');
                    assertLatex('1+\\left(2+3\\right)+4');
                });
                test('nested parens 1+(2+(3+4)+5)+6', function () {
                    mq.typedText('1+(2+(3+4)+5)+6');
                    assertLatex('1+\\left(2+\\left(3+4\\right)+5\\right)+6');
                });
            });
            suite('mismatched brackets', function () {
                test('empty mismatched brackets (] and [}', function () {
                    mq.typedText('(');
                    assertLatex('\\left(\\right)');
                    mq.typedText(']');
                    assertLatex('\\left(\\right]');
                    mq.typedText('[');
                    assertLatex('\\left(\\right]\\left[\\right]');
                    mq.typedText('}');
                    assertLatex('\\left(\\right]\\left[\\right\\}');
                });
                test('typing mismatched brackets 1+(2+3]+4', function () {
                    mq.typedText('1+');
                    assertLatex('1+');
                    mq.typedText('(');
                    assertLatex('1+\\left(\\right)');
                    mq.typedText('2+3');
                    assertLatex('1+\\left(2+3\\right)');
                    mq.typedText(']+4');
                    assertLatex('1+\\left(2+3\\right]+4');
                });
                test('wrapping things in mismatched brackets 1+(2+3]+4', function () {
                    mq.typedText('1+2+3+4');
                    assertLatex('1+2+3+4');
                    mq.keystroke('Left Left').typedText(']');
                    assertLatex('\\left[1+2+3\\right]+4');
                    mq.keystroke('Left Left Left Left').typedText('(');
                    assertLatex('1+\\left(2+3\\right]+4');
                });
                test('nested mismatched brackets 1+(2+[3+4)+5]+6', function () {
                    mq.typedText('1+(2+[3+4)+5]+6');
                    assertLatex('1+\\left(2+\\left[3+4\\right)+5\\right]+6');
                });
                suite('restrictMismatchedBrackets', function () {
                    setup(function () {
                        mq.config({ restrictMismatchedBrackets: true });
                    });
                    test('typing (|x|+1) works', function () {
                        mq.typedText('(|x|+1)');
                        assertLatex('\\left(\\left|x\\right|+1\\right)');
                    });
                    test('typing [x} becomes [{x}]', function () {
                        mq.typedText('[x}');
                        assertLatex('\\left[\\left\\{x\\right\\}\\right]');
                    });
                    test('normal matching pairs {f(n), [a,b]} work', function () {
                        mq.typedText('{f(n), [a,b]}');
                        assertLatex('\\left\\{f\\left(n\\right),\\ \\left[a,b\\right]\\right\\}');
                    });
                    test('[a,b) and (a,b] still work', function () {
                        mq.typedText('[a,b) + (a,b]');
                        assertLatex('\\left[a,b\\right)\\ +\\ \\left(a,b\\right]');
                    });
                });
            });
            suite('pipes', function () {
                test('empty pipes ||', function () {
                    mq.typedText('|');
                    assertLatex('\\left|\\right|');
                    mq.typedText('|');
                    assertLatex('\\left|\\right|');
                });
                test('straight typing 1+|2+3|+4', function () {
                    mq.typedText('1+|2+3|+4');
                    assertLatex('1+\\left|2+3\\right|+4');
                });
                test('wrapping things in pipes 1+|2+3|+4', function () {
                    mq.typedText('1+2+3+4');
                    assertLatex('1+2+3+4');
                    mq.keystroke('Home Right Right').typedText('|');
                    assertLatex('1+\\left|2+3+4\\right|');
                    mq.keystroke('Right Right Right').typedText('|');
                    assertLatex('1+\\left|2+3\\right|+4');
                });
                suite('can type mismatched paren/pipe group from any side', function () {
                    suite('straight typing', function () {
                        test('|)', function () {
                            mq.typedText('|)');
                            assertLatex('\\left|\\right)');
                        });
                        test('(|', function () {
                            mq.typedText('(|');
                            assertLatex('\\left(\\right|');
                        });
                    });
                    suite('the other direction', function () {
                        test('|)', function () {
                            mq.typedText(')');
                            assertLatex('\\left(\\right)');
                            mq.keystroke('Left').typedText('|');
                            assertLatex('\\left|\\right)');
                        });
                        test('(|', function () {
                            mq.typedText('||');
                            assertLatex('\\left|\\right|');
                            mq.keystroke('Left Left Del');
                            assertLatex('\\left|\\right|');
                            mq.typedText('(');
                            assertLatex('\\left(\\right|');
                        });
                    });
                });
            });
            suite('backspacing', backspacingTests);
            suite('backspacing with restrictMismatchedBrackets', function () {
                setup(function () {
                    mq.config({ restrictMismatchedBrackets: true });
                });
                backspacingTests();
            });
            function backspacingTests() {
                test('typing then backspacing a close-paren in the middle of 1+2+3+4', function () {
                    mq.typedText('1+2+3+4');
                    assertLatex('1+2+3+4');
                    mq.keystroke('Left Left').typedText(')');
                    assertLatex('\\left(1+2+3\\right)+4');
                    mq.keystroke('Backspace');
                    assertLatex('1+2+3+4');
                });
                test('backspacing close-paren then open-paren of 1+(2+3)+4', function () {
                    mq.typedText('1+(2+3)+4');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('1+\\left(2+3+4\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('backspacing open-paren of 1+(2+3)+4', function () {
                    mq.typedText('1+(2+3)+4');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Left Left Left Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('backspacing close-bracket then open-paren of 1+(2+3]+4', function () {
                    mq.typedText('1+(2+3]+4');
                    assertLatex('1+\\left(2+3\\right]+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('1+\\left(2+3+4\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('backspacing open-paren of 1+(2+3]+4', function () {
                    mq.typedText('1+(2+3]+4');
                    assertLatex('1+\\left(2+3\\right]+4');
                    mq.keystroke('Left Left Left Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('backspacing close-bracket then open-paren of 1+(2+3] (nothing after paren group)', function () {
                    mq.typedText('1+(2+3]');
                    assertLatex('1+\\left(2+3\\right]');
                    mq.keystroke('Backspace');
                    assertLatex('1+\\left(2+3\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1+2+3');
                });
                test('backspacing open-paren of 1+(2+3] (nothing after paren group)', function () {
                    mq.typedText('1+(2+3]');
                    assertLatex('1+\\left(2+3\\right]');
                    mq.keystroke('Left Left Left Left Backspace');
                    assertLatex('1+2+3');
                });
                test('backspacing close-bracket then open-paren of (2+3]+4 (nothing before paren group)', function () {
                    mq.typedText('(2+3]+4');
                    assertLatex('\\left(2+3\\right]+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('\\left(2+3+4\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('2+3+4');
                });
                test('backspacing open-paren of (2+3]+4 (nothing before paren group)', function () {
                    mq.typedText('(2+3]+4');
                    assertLatex('\\left(2+3\\right]+4');
                    mq.keystroke('Left Left Left Left Left Left Backspace');
                    assertLatex('2+3+4');
                });
                function assertParenBlockNonEmpty() {
                    var parenBlock = $(mq.el()).find('.mq-paren+span');
                    assert.equal(parenBlock.length, 1, 'exactly 1 paren block');
                    assert.ok(!parenBlock.hasClass('mq-empty'), 'paren block auto-expanded, should no longer be gray');
                }
                test('backspacing close-bracket then open-paren of 1+(]+4 (empty paren group)', function () {
                    mq.typedText('1+(]+4');
                    assertLatex('1+\\left(\\right]+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('1+\\left(+4\\right)');
                    assertParenBlockNonEmpty();
                    mq.keystroke('Backspace');
                    assertLatex('1++4');
                });
                test('backspacing open-paren of 1+(]+4 (empty paren group)', function () {
                    mq.typedText('1+(]+4');
                    assertLatex('1+\\left(\\right]+4');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1++4');
                });
                test('backspacing close-bracket then open-paren of 1+(] (empty paren group, nothing after)', function () {
                    mq.typedText('1+(]');
                    assertLatex('1+\\left(\\right]');
                    mq.keystroke('Backspace');
                    assertLatex('1+\\left(\\right)');
                    mq.keystroke('Backspace');
                    assertLatex('1+');
                });
                test('backspacing open-paren of 1+(] (empty paren group, nothing after)', function () {
                    mq.typedText('1+(]');
                    assertLatex('1+\\left(\\right]');
                    mq.keystroke('Left Backspace');
                    assertLatex('1+');
                });
                test('backspacing close-bracket then open-paren of (]+4 (empty paren group, nothing before)', function () {
                    mq.typedText('(]+4');
                    assertLatex('\\left(\\right]+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('\\left(+4\\right)');
                    assertParenBlockNonEmpty();
                    mq.keystroke('Backspace');
                    assertLatex('+4');
                });
                test('backspacing open-paren of (]+4 (empty paren group, nothing before)', function () {
                    mq.typedText('(]+4');
                    assertLatex('\\left(\\right]+4');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('+4');
                });
                test('rendering mismatched brackets 1+(2+3]+4 from LaTeX then backspacing close-bracket then open-paren', function () {
                    mq.latex('1+\\left(2+3\\right]+4');
                    assertLatex('1+\\left(2+3\\right]+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('1+\\left(2+3+4\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('rendering mismatched brackets 1+(2+3]+4 from LaTeX then backspacing open-paren', function () {
                    mq.latex('1+\\left(2+3\\right]+4');
                    assertLatex('1+\\left(2+3\\right]+4');
                    mq.keystroke('Left Left Left Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('rendering paren group 1+(2+3)+4 from LaTeX then backspacing close-paren then open-paren', function () {
                    mq.latex('1+\\left(2+3\\right)+4');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Left Left Backspace');
                    assertLatex('1+\\left(2+3+4\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('rendering paren group 1+(2+3)+4 from LaTeX then backspacing open-paren', function () {
                    mq.latex('1+\\left(2+3\\right)+4');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Left Left Left Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('wrapping selection in parens 1+(2+3)+4 then backspacing close-paren then open-paren', function () {
                    mq.typedText('1+2+3+4');
                    assertLatex('1+2+3+4');
                    mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(')');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Backspace');
                    assertLatex('1+\\left(2+3+4\\right)');
                    mq.keystroke('Left Left Left Backspace');
                    assertLatex('1+2+3+4');
                });
                test('wrapping selection in parens 1+(2+3)+4 then backspacing open-paren', function () {
                    mq.typedText('1+2+3+4');
                    assertLatex('1+2+3+4');
                    mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('(');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Backspace');
                    assertLatex('1+2+3+4');
                });
                test('backspacing close-bracket of 1+(2+3] (nothing after) then typing', function () {
                    mq.typedText('1+(2+3]');
                    assertLatex('1+\\left(2+3\\right]');
                    mq.keystroke('Backspace');
                    assertLatex('1+\\left(2+3\\right)');
                    mq.typedText('+4');
                    assertLatex('1+\\left(2+3+4\\right)');
                });
                test('backspacing open-paren of (2+3]+4 (nothing before) then typing', function () {
                    mq.typedText('(2+3]+4');
                    assertLatex('\\left(2+3\\right]+4');
                    mq.keystroke('Home Right Backspace');
                    assertLatex('2+3+4');
                    mq.typedText('1+');
                    assertLatex('1+2+3+4');
                });
                test('backspacing paren containing a one-sided paren 0+[(1+2)+3]+4', function () {
                    mq.typedText('0+[1+2+3]+4');
                    assertLatex('0+\\left[1+2+3\\right]+4');
                    mq.keystroke('Left Left Left Left Left').typedText(')');
                    assertLatex('0+\\left[\\left(1+2\\right)+3\\right]+4');
                    mq.keystroke('Right Right Right Backspace');
                    assertLatex('0+\\left[1+2\\right)+3+4');
                });
                test('backspacing paren inside a one-sided paren (0+[1+2]+3)+4', function () {
                    mq.typedText('0+[1+2]+3)+4');
                    assertLatex('\\left(0+\\left[1+2\\right]+3\\right)+4');
                    mq.keystroke('Left Left Left Left Left Backspace');
                    assertLatex('0+\\left[1+2+3\\right)+4');
                });
                test('backspacing paren containing and inside a one-sided paren (([1+2]))', function () {
                    mq.typedText('(1+2))');
                    assertLatex('\\left(\\left(1+2\\right)\\right)');
                    mq.keystroke('Left Left').typedText(']');
                    assertLatex('\\left(\\left(\\left[1+2\\right]\\right)\\right)');
                    mq.keystroke('Right Backspace');
                    assertLatex('\\left(\\left(1+2\\right]\\right)');
                    mq.keystroke('Backspace');
                    assertLatex('\\left(1+2\\right)');
                });
                test('auto-expanding calls .siblingCreated() on new siblings 1+((2+3))', function () {
                    mq.typedText('1+((2+3))');
                    assertLatex('1+\\left(\\left(2+3\\right)\\right)');
                    mq.keystroke('Left Left Left Left Left Left Del');
                    assertLatex('1+\\left(\\left(2+3\\right)\\right)');
                    mq.keystroke('Left Left Del');
                    assertLatex('\\left(1+\\left(2+3\\right)\\right)');
                    // now check that the inner open-paren isn't still a ghost
                    mq.keystroke('Right Right Right Right Del');
                    assertLatex('1+\\left(2+3\\right)');
                });
                test('that unwrapping calls .siblingCreated() on new siblings ((1+2)+(3+4))+5', function () {
                    mq.typedText('(1+2+3+4)+5');
                    assertLatex('\\left(1+2+3+4\\right)+5');
                    mq.keystroke('Home Right Right Right Right').typedText(')');
                    assertLatex('\\left(\\left(1+2\\right)+3+4\\right)+5');
                    mq.keystroke('Right').typedText('(');
                    assertLatex('\\left(\\left(1+2\\right)+\\left(3+4\\right)\\right)+5');
                    mq.keystroke('Right Right Right Right Right Backspace');
                    assertLatex('\\left(1+2\\right)+\\left(3+4\\right)+5');
                    mq.keystroke('Left Left Left Left Backspace');
                    assertLatex('\\left(1+2\\right)+3+4+5');
                });
                test('typing Ctrl-Backspace deletes everything to the left of the cursor', function () {
                    mq.typedText('12345');
                    assertLatex('12345');
                    mq.keystroke('Left Left');
                    mq.keystroke('Ctrl-Backspace');
                    assertLatex('45');
                    mq.keystroke('Ctrl-Backspace');
                    assertLatex('45');
                });
                test('typing Ctrl-Del deletes everything to the right of the cursor', function () {
                    mq.typedText('12345');
                    assertLatex('12345');
                    mq.keystroke('Left Left');
                    mq.keystroke('Ctrl-Del');
                    assertLatex('123');
                    mq.keystroke('Ctrl-Del');
                    assertLatex('123');
                });
                suite('pipes', function () {
                    test('typing then backspacing a pipe in the middle of 1+2+3+4', function () {
                        mq.typedText('1+2+3+4');
                        assertLatex('1+2+3+4');
                        mq.keystroke('Left Left Left').typedText('|');
                        assertLatex('1+2+\\left|3+4\\right|');
                        mq.keystroke('Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('backspacing close-pipe then open-pipe of 1+|2+3|+4', function () {
                        mq.typedText('1+|2+3|+4');
                        assertLatex('1+\\left|2+3\\right|+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('1+\\left|2+3+4\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('backspacing open-pipe of 1+|2+3|+4', function () {
                        mq.typedText('1+|2+3|+4');
                        assertLatex('1+\\left|2+3\\right|+4');
                        mq.keystroke('Left Left Left Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('backspacing close-pipe then open-pipe of 1+|2+3| (nothing after pipe pair)', function () {
                        mq.typedText('1+|2+3|');
                        assertLatex('1+\\left|2+3\\right|');
                        mq.keystroke('Backspace');
                        assertLatex('1+\\left|2+3\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1+2+3');
                    });
                    test('backspacing open-pipe of 1+|2+3| (nothing after pipe pair)', function () {
                        mq.typedText('1+|2+3|');
                        assertLatex('1+\\left|2+3\\right|');
                        mq.keystroke('Left Left Left Left Backspace');
                        assertLatex('1+2+3');
                    });
                    test('backspacing close-pipe then open-pipe of |2+3|+4 (nothing before pipe pair)', function () {
                        mq.typedText('|2+3|+4');
                        assertLatex('\\left|2+3\\right|+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('\\left|2+3+4\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('2+3+4');
                    });
                    test('backspacing open-pipe of |2+3|+4 (nothing before pipe pair)', function () {
                        mq.typedText('|2+3|+4');
                        assertLatex('\\left|2+3\\right|+4');
                        mq.keystroke('Left Left Left Left Left Left Backspace');
                        assertLatex('2+3+4');
                    });
                    function assertParenBlockNonEmpty() {
                        var parenBlock = $(mq.el()).find('.mq-paren+span');
                        assert.equal(parenBlock.length, 1, 'exactly 1 paren block');
                        assert.ok(!parenBlock.hasClass('mq-empty'), 'paren block auto-expanded, should no longer be gray');
                    }
                    test('backspacing close-pipe then open-pipe of 1+||+4 (empty pipe pair)', function () {
                        mq.typedText('1+||+4');
                        assertLatex('1+\\left|\\right|+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('1+\\left|+4\\right|');
                        assertParenBlockNonEmpty();
                        mq.keystroke('Backspace');
                        assertLatex('1++4');
                    });
                    test('backspacing open-pipe of 1+||+4 (empty pipe pair)', function () {
                        mq.typedText('1+||+4');
                        assertLatex('1+\\left|\\right|+4');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1++4');
                    });
                    test('backspacing close-pipe then open-pipe of 1+|| (empty pipe pair, nothing after)', function () {
                        mq.typedText('1+||');
                        assertLatex('1+\\left|\\right|');
                        mq.keystroke('Backspace');
                        assertLatex('1+\\left|\\right|');
                        mq.keystroke('Backspace');
                        assertLatex('1+');
                    });
                    test('backspacing open-pipe of 1+|| (empty pipe pair, nothing after)', function () {
                        mq.typedText('1+||');
                        assertLatex('1+\\left|\\right|');
                        mq.keystroke('Left Backspace');
                        assertLatex('1+');
                    });
                    test('backspacing close-pipe then open-pipe of ||+4 (empty pipe pair, nothing before)', function () {
                        mq.typedText('||+4');
                        assertLatex('\\left|\\right|+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('\\left|+4\\right|');
                        assertParenBlockNonEmpty();
                        mq.keystroke('Backspace');
                        assertLatex('+4');
                    });
                    test('backspacing open-pipe of ||+4 (empty pipe pair, nothing before)', function () {
                        mq.typedText('||+4');
                        assertLatex('\\left|\\right|+4');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('+4');
                    });
                    test('rendering pipe pair 1+|2+3|+4 from LaTeX then backspacing close-pipe then open-pipe', function () {
                        mq.latex('1+\\left|2+3\\right|+4');
                        assertLatex('1+\\left|2+3\\right|+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('1+\\left|2+3+4\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('rendering pipe pair 1+|2+3|+4 from LaTeX then backspacing open-pipe', function () {
                        mq.latex('1+\\left|2+3\\right|+4');
                        assertLatex('1+\\left|2+3\\right|+4');
                        mq.keystroke('Left Left Left Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('rendering mismatched paren/pipe group 1+|2+3)+4 from LaTeX then backspacing close-paren then open-pipe', function () {
                        mq.latex('1+\\left|2+3\\right)+4');
                        assertLatex('1+\\left|2+3\\right)+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('1+\\left|2+3+4\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('rendering mismatched paren/pipe group 1+|2+3)+4 from LaTeX then backspacing open-pipe', function () {
                        mq.latex('1+\\left|2+3\\right)+4');
                        assertLatex('1+\\left|2+3\\right)+4');
                        mq.keystroke('Left Left Left Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('rendering mismatched paren/pipe group 1+(2+3|+4 from LaTeX then backspacing close-pipe then open-paren', function () {
                        mq.latex('1+\\left(2+3\\right|+4');
                        assertLatex('1+\\left(2+3\\right|+4');
                        mq.keystroke('Left Left Backspace');
                        assertLatex('1+\\left(2+3+4\\right)');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('rendering mismatched paren/pipe group 1+(2+3|+4 from LaTeX then backspacing open-paren', function () {
                        mq.latex('1+\\left(2+3\\right|+4');
                        assertLatex('1+\\left(2+3\\right|+4');
                        mq.keystroke('Left Left Left Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('wrapping selection in pipes 1+|2+3|+4 then backspacing open-pipe', function () {
                        mq.typedText('1+2+3+4');
                        assertLatex('1+2+3+4');
                        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('|');
                        assertLatex('1+\\left|2+3\\right|+4');
                        mq.keystroke('Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('wrapping selection in pipes 1+|2+3|+4 then backspacing close-pipe then open-pipe', function () {
                        mq.typedText('1+2+3+4');
                        assertLatex('1+2+3+4');
                        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('|');
                        assertLatex('1+\\left|2+3\\right|+4');
                        mq.keystroke('Tab Backspace');
                        assertLatex('1+\\left|2+3+4\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('1+2+3+4');
                    });
                    test('backspacing close-pipe of 1+|2+3| (nothing after) then typing', function () {
                        mq.typedText('1+|2+3|');
                        assertLatex('1+\\left|2+3\\right|');
                        mq.keystroke('Backspace');
                        assertLatex('1+\\left|2+3\\right|');
                        mq.typedText('+4');
                        assertLatex('1+\\left|2+3+4\\right|');
                    });
                    test('backspacing open-pipe of |2+3|+4 (nothing before) then typing', function () {
                        mq.typedText('|2+3|+4');
                        assertLatex('\\left|2+3\\right|+4');
                        mq.keystroke('Home Right Backspace');
                        assertLatex('2+3+4');
                        mq.typedText('1+');
                        assertLatex('1+2+3+4');
                    });
                    test('backspacing pipe containing a one-sided pipe 0+|1+|2+3||+4', function () {
                        mq.typedText('0+|1+2+3|+4');
                        assertLatex('0+\\left|1+2+3\\right|+4');
                        mq.keystroke('Left Left Left Left Left Left').typedText('|');
                        assertLatex('0+\\left|1+\\left|2+3\\right|\\right|+4');
                        mq.keystroke('Shift-Tab Shift-Tab Del');
                        assertLatex('0+1+\\left|2+3\\right|+4');
                    });
                    test('backspacing pipe inside a one-sided pipe 0+|1+|2+3|+4|', function () {
                        mq.typedText('0+1+|2+3|+4');
                        assertLatex('0+1+\\left|2+3\\right|+4');
                        mq.keystroke('Home Right Right').typedText('|');
                        assertLatex('0+\\left|1+\\left|2+3\\right|+4\\right|');
                        mq.keystroke('Right Right Del');
                        assertLatex('0+\\left|1+2+3\\right|+4');
                    });
                    test('backspacing pipe containing and inside a one-sided pipe |0+|1+|2+3||+4|', function () {
                        mq.typedText('0+|1+2+3|+4');
                        assertLatex('0+\\left|1+2+3\\right|+4');
                        mq.keystroke('Home').typedText('|');
                        assertLatex('\\left|0+\\left|1+2+3\\right|+4\\right|');
                        mq.keystroke('Right Right Right Right Right').typedText('|');
                        assertLatex('\\left|0+\\left|1+\\left|2+3\\right|\\right|+4\\right|');
                        mq.keystroke('Left Left Left Backspace');
                        assertLatex('\\left|0+1+\\left|2+3\\right|+4\\right|');
                    });
                    test('backspacing pipe containing a one-sided pipe facing same way 0+||1+2||+3', function () {
                        mq.typedText('0+|1+2|+3');
                        assertLatex('0+\\left|1+2\\right|+3');
                        mq.keystroke('Home Right Right Right').typedText('|');
                        assertLatex('0+\\left|\\left|1+2\\right|\\right|+3');
                        mq.keystroke('Tab Tab Backspace');
                        assertLatex('0+\\left|\\left|1+2\\right|+3\\right|');
                    });
                    test('backspacing pipe inside a one-sided pipe facing same way 0+|1+|2+3|+4|', function () {
                        mq.typedText('0+1+|2+3|+4');
                        assertLatex('0+1+\\left|2+3\\right|+4');
                        mq.keystroke('Home Right Right').typedText('|');
                        assertLatex('0+\\left|1+\\left|2+3\\right|+4\\right|');
                        mq.keystroke('Right Right Right Right Right Right Right Backspace');
                        assertLatex('0+\\left|1+\\left|2+3+4\\right|\\right|');
                    });
                    test('backspacing open-paren of mismatched paren/pipe group containing a one-sided pipe 0+(1+|2+3||+4', function () {
                        mq.latex('0+\\left(1+2+3\\right|+4');
                        assertLatex('0+\\left(1+2+3\\right|+4');
                        mq.keystroke('Left Left Left Left Left Left').typedText('|');
                        assertLatex('0+\\left(1+\\left|2+3\\right|\\right|+4');
                        mq.keystroke('Shift-Tab Shift-Tab Del');
                        assertLatex('0+1+\\left|2+3\\right|+4');
                    });
                    test('backspacing open-paren of mismatched paren/pipe group inside a one-sided pipe 0+|1+(2+3|+4|', function () {
                        mq.latex('0+1+\\left(2+3\\right|+4');
                        assertLatex('0+1+\\left(2+3\\right|+4');
                        mq.keystroke('Home Right Right').typedText('|');
                        assertLatex('0+\\left|1+\\left(2+3\\right|+4\\right|');
                        mq.keystroke('Right Right Del');
                        assertLatex('0+\\left|1+2+3\\right|+4');
                    });
                });
            }
            suite('typing outside ghost paren', function () {
                test('typing outside ghost paren solidifies ghost 1+(2+3)', function () {
                    mq.typedText('1+(2+3');
                    assertLatex('1+\\left(2+3\\right)');
                    mq.keystroke('Right').typedText('+4');
                    assertLatex('1+\\left(2+3\\right)+4');
                    mq.keystroke('Left Left Left Left Left Left Left Del');
                    assertLatex('\\left(1+2+3\\right)+4');
                });
                test('selected and replaced by LiveFraction solidifies ghosts (1+2)/( )', function () {
                    mq.typedText('1+2)/');
                    assertLatex('\\frac{\\left(1+2\\right)}{ }');
                    mq.keystroke('Left Backspace');
                    assertLatex('\\frac{\\left(1+2\\right)}{ }');
                });
                test('close paren group by typing close-bracket outside ghost paren (1+2]', function () {
                    mq.typedText('(1+2');
                    assertLatex('\\left(1+2\\right)');
                    mq.keystroke('Right').typedText(']');
                    assertLatex('\\left(1+2\\right]');
                });
                test('close adjacent paren group before containing paren group (1+(2+3])', function () {
                    mq.typedText('(1+(2+3');
                    assertLatex('\\left(1+\\left(2+3\\right)\\right)');
                    mq.keystroke('Right').typedText(']');
                    assertLatex('\\left(1+\\left(2+3\\right]\\right)');
                    mq.typedText(']');
                    assertLatex('\\left(1+\\left(2+3\\right]\\right]');
                });
                test('can type close-bracket on solid side of one-sided paren [](1+2)', function () {
                    mq.typedText('(1+2');
                    assertLatex('\\left(1+2\\right)');
                    mq.moveToLeftEnd().typedText(']');
                    assertLatex('\\left[\\right]\\left(1+2\\right)');
                });
                suite('pipes', function () {
                    test('close pipe pair from outside to the right |1+2|', function () {
                        mq.typedText('|1+2');
                        assertLatex('\\left|1+2\\right|');
                        mq.keystroke('Right').typedText('|');
                        assertLatex('\\left|1+2\\right|');
                        mq.keystroke('Home Del');
                        assertLatex('\\left|1+2\\right|');
                    });
                    test('close pipe pair from outside to the left |1+2|', function () {
                        mq.typedText('|1+2|');
                        assertLatex('\\left|1+2\\right|');
                        mq.keystroke('Home Del');
                        assertLatex('\\left|1+2\\right|');
                        mq.keystroke('Left').typedText('|');
                        assertLatex('\\left|1+2\\right|');
                        mq.keystroke('Ctrl-End Backspace');
                        assertLatex('\\left|1+2\\right|');
                    });
                    test('can type pipe on solid side of one-sided pipe ||||', function () {
                        mq.typedText('|');
                        assertLatex('\\left|\\right|');
                        mq.moveToLeftEnd().typedText('|');
                        assertLatex('\\left|\\left|\\right|\\right|');
                    });
                });
            });
        });
        suite('autoParenthesizedFunctions', function () {
            var normalConfig = {
                autoParenthesizedFunctions: 'sin cos tan ln',
                autoOperatorNames: 'sin ln',
                autoCommands: 'sum int',
            };
            var subscriptConfig = {
                autoParenthesizedFunctions: 'sin cos tan ln',
                autoOperatorNames: 'sin ln',
                autoCommands: 'sum int',
                disableAutoSubstitutionInSubscripts: true,
            };
            setup(function () {
                mq.config(normalConfig);
            });
            test('individual commands', function () {
                //autoParenthesized and also operatored
                mq.typedText('sin');
                assertLatex('\\sin\\left(\\right)');
                mq.latex('');
                //not parenthesized
                mq.typedText('cot');
                assertLatex('cot');
                mq.latex('');
                //we don't autoparenthesize non-autocommands
                mq.typedText('tan');
                assertLatex('tan');
                mq.latex('');
                //doesn't parenthesize when the middle is completed
                mq.typedText('tn');
                mq.keystroke('Left');
                mq.typedText('a');
                assertLatex('tan');
                mq.latex('');
                //doesn't parenthesize when the middle is completed, but does autoFn
                mq.typedText('sn');
                mq.keystroke('Left');
                mq.typedText('i');
                assertLatex('\\sin');
            });
            test('does not double parenthesize if parenthesized', function () {
                //autoParenthesized and also operatored
                mq.typedText('sin');
                assertLatex('\\sin\\left(\\right)');
                mq.keystroke('Left');
                mq.keystroke('Backspace');
                mq.typedText('n');
                assertLatex('\\sin\\left(\\right)');
            });
            test('works in \\sum', function () {
                mq.typedText('sum');
                assertLatex('\\sum_{ }^{ }');
                mq.typedText('sin');
                assertLatex('\\sum_{\\sin\\left(\\right)}^{ }');
            });
            test('works in \\int', function () {
                mq.typedText('int');
                assertLatex('\\int_{ }^{ }');
                mq.typedText('sin');
                assertLatex('\\int_{\\sin\\left(\\right)}^{ }');
            });
            test('no auto operator names in simple subscripts', function () {
                mq.config(normalConfig);
                mq.typedText('x_');
                assertLatex('x_{ }');
                mq.typedText('sin');
                assertLatex('x_{\\sin\\left(\\right)}');
                mq.latex('');
                mq.config(subscriptConfig);
                mq.typedText('x_');
                assertLatex('x_{ }');
                mq.typedText('sin');
                assertLatex('x_{sin}');
                mq.config(normalConfig);
            });
            test('no auto operator names in simple subscripts when pasting', function () {
                var textarea = $(mq.el()).find('textarea');
                mq.config(normalConfig);
                trigger.paste(textarea[0]);
                textarea.val('x_{sin}');
                trigger.input(textarea[0]);
                assertLatex('x_{\\sin}');
                mq.latex('');
                mq.config(subscriptConfig);
                trigger.paste(textarea[0]);
                textarea.val('x_{sin}');
                trigger.input(textarea[0]);
                assertLatex('x_{sin}');
                mq.config(normalConfig);
            });
        });
        suite('typingSlashCreatesNewFraction', function () {
            setup(function () {
                mq.config({
                    typingSlashCreatesNewFraction: true,
                });
            });
            test('typing slash creates new fraction', function () {
                //autoParenthesized and also operatored
                mq.typedText('1/');
                assertLatex('1\\frac{ }{ }');
            });
        });
        suite('autoCommands', function () {
            var normalConfig = {
                autoOperatorNames: 'sin pp',
                autoCommands: 'pi tau phi theta Gamma sum prod sqrt nthroot cbrt percent',
            };
            var subscriptConfig = {
                autoOperatorNames: 'sin pp',
                autoCommands: 'pi tau phi theta Gamma sum prod sqrt nthroot cbrt percent',
                disableAutoSubstitutionInSubscripts: true,
            };
            setup(function () {
                mq.config(normalConfig);
            });
            test('individual commands', function () {
                mq.typedText('sum' + 'n=0');
                mq.keystroke('Up').typedText('100').keystroke('Right');
                assertLatex('\\sum_{n=0}^{100}');
                mq.keystroke('Ctrl-Backspace');
                mq.typedText('prod');
                mq.typedText('n=0').keystroke('Up').typedText('100').keystroke('Right');
                assertLatex('\\prod_{n=0}^{100}');
                mq.keystroke('Ctrl-Backspace');
                mq.typedText('sqrt');
                mq.typedText('100').keystroke('Right');
                assertLatex('\\sqrt{100}');
                mq.keystroke('Ctrl-Backspace');
                mq.typedText('nthroot');
                mq.typedText('n').keystroke('Right').typedText('100').keystroke('Right');
                assertLatex('\\sqrt[n]{100}');
                assertMathspeak('Root Index "n" Start Root 100 End Root');
                mq.keystroke('Ctrl-Backspace');
                mq.typedText('pi');
                assertLatex('\\pi');
                mq.keystroke('Backspace');
                mq.typedText('tau');
                assertLatex('\\tau');
                mq.keystroke('Backspace');
                mq.typedText('phi');
                assertLatex('\\phi');
                mq.keystroke('Backspace');
                mq.typedText('theta');
                assertLatex('\\theta');
                mq.keystroke('Backspace');
                mq.typedText('Gamma');
                assertLatex('\\Gamma');
                mq.keystroke('Backspace');
                mq.typedText('percent');
                assertLatex('\\%\\operatorname{of}');
                mq.keystroke('Backspace');
                mq.typedText('cbrt');
                assertLatex('\\sqrt[3]{}');
                assertMathspeak('Start Cube Root End Cube Root');
                mq.typedText('pi');
                assertLatex('\\sqrt[3]{\\pi}');
            });
            test('sequences of auto-commands and other assorted characters', function () {
                mq.typedText('sin' + 'pi');
                assertLatex('\\sin\\pi');
                mq.keystroke('Left Backspace');
                assertLatex('si\\pi');
                mq.keystroke('Left').typedText('p');
                assertLatex('spi\\pi');
                mq.typedText('i');
                assertLatex('s\\pi i\\pi');
                mq.typedText('p');
                assertLatex('s\\pi pi\\pi');
                mq.keystroke('Right').typedText('n');
                assertLatex('s\\pi pin\\pi');
                mq.keystroke('Left Left Left').typedText('s');
                assertLatex('s\\pi spin\\pi');
                mq.keystroke('Backspace');
                assertLatex('s\\pi pin\\pi');
                mq.keystroke('Del').keystroke('Backspace');
                assertLatex('\\sin\\pi');
            });
            test('has lower "precedence" than operator names', function () {
                mq.typedText('ppi');
                assertLatex('\\operatorname{pp}i');
                mq.keystroke('Left Left').typedText('i');
                assertLatex('\\pi pi');
            });
            test('command contains non-letters', function () {
                assert.throws(function () {
                    MQ.config({ autoCommands: 'e1' });
                });
            });
            test('command length less than 2', function () {
                assert.throws(function () {
                    MQ.config({ autoCommands: 'e' });
                });
            });
            test('command is a built-in operator name', function () {
                var cmds = ('Pr arg deg det dim exp gcd hom inf ker lg lim ln log max min sup' +
                    ' limsup liminf injlim projlim Pr').split(' ');
                for (var i = 0; i < cmds.length; i += 1) {
                    assert.throws(function () {
                        MQ.config({ autoCommands: cmds[i] });
                    }, 'MQ.config({ autoCommands: "' + cmds[i] + '" })');
                }
            });
            test('built-in operator names even after auto-operator names overridden', function () {
                MQ.config({ autoOperatorNames: 'sin inf arcosh cosh cos cosec csc' });
                // ^ happen to be the ones required by autoOperatorNames.test.js
                var cmds = 'Pr arg deg det exp gcd inf lg lim ln log max min sup'.split(' ');
                for (var i = 0; i < cmds.length; i += 1) {
                    assert.throws(function () {
                        MQ.config({ autoCommands: cmds[i] });
                    }, 'MQ.config({ autoCommands: "' + cmds[i] + '" })');
                }
            });
            test('no auto commands in simple subscripts', function () {
                mq.config(normalConfig);
                mq.typedText('x_');
                assertLatex('x_{ }');
                mq.typedText('pi');
                assertLatex('x_{\\pi}');
                mq.latex('');
                mq.config(subscriptConfig);
                mq.typedText('x_');
                assertLatex('x_{ }');
                mq.typedText('pi');
                assertLatex('x_{pi}');
                mq.config(normalConfig);
            });
            suite('command list not perfectly space-delimited', function () {
                test('double space', function () {
                    assert.throws(function () {
                        MQ.config({ autoCommands: 'pi  theta' });
                    });
                });
                test('leading space', function () {
                    assert.throws(function () {
                        MQ.config({ autoCommands: ' pi' });
                    });
                });
                test('trailing space', function () {
                    assert.throws(function () {
                        MQ.config({ autoCommands: 'pi ' });
                    });
                });
            });
        });
        suite('inequalities', function () {
            // assertFullyFunctioningInequality() checks not only that the inequality
            // has the right LaTeX and when you backspace it has the right LaTeX,
            // but also that when you backspace you get the right state such that
            // you can either type = again to get the non-strict inequality again,
            // or backspace again and it'll delete correctly.
            function assertFullyFunctioningInequality(nonStrict, strict, nonStrictMathspeak, strictMathspeak) {
                assertLatex(nonStrict);
                assertMathspeak(nonStrictMathspeak);
                mq.keystroke('Backspace');
                assertLatex(strict);
                assertMathspeak(strictMathspeak);
                mq.typedText('=');
                assertLatex(nonStrict);
                assertMathspeak(nonStrictMathspeak);
                mq.keystroke('Backspace');
                assertLatex(strict);
                assertMathspeak(strictMathspeak);
                mq.keystroke('Backspace');
                assertLatex('');
                assertMathspeak('');
            }
            test('typing and backspacing <= and >=', function () {
                mq.typedText('<');
                assertLatex('<');
                assertMathspeak('less than');
                mq.typedText('=');
                assertFullyFunctioningInequality('\\le', '<', 'less than or equal to', 'less than');
                mq.typedText('>');
                assertLatex('>');
                mq.typedText('=');
                assertFullyFunctioningInequality('\\ge', '>', 'greater than or equal to', 'greater than');
                mq.typedText('<<>>==>><<==');
                assertLatex('<<>\\ge=>><\\le=');
                assertMathspeak('less than less than greater than greater than or equal to equals greater than greater than less than less than or equal to equals');
            });
            test('typing ≤ and ≥ chars directly', function () {
                mq.typedText('≤');
                assertFullyFunctioningInequality('\\le', '<', 'less than or equal to', 'less than');
                mq.typedText('≥');
                assertFullyFunctioningInequality('\\ge', '>', 'greater than or equal to', 'greater than');
            });
            test('typing and backspacing \\to', function () {
                mq.typedText('-');
                assertLatex('-');
                assertMathspeak('negative');
                mq.typedText('>');
                assertLatex('\\to');
                assertMathspeak('to');
                mq.typedText('-');
                assertLatex('\\to-');
                assertMathspeak('to negative');
                mq.typedText('>');
                assertLatex('\\to\\to');
                assertMathspeak('to to');
                mq.keystroke('Backspace');
                assertLatex('\\to-');
                assertMathspeak('to negative');
                mq.keystroke('Backspace');
                assertLatex('\\to');
                assertMathspeak('to');
                mq.keystroke('Backspace');
                assertLatex('-');
                assertMathspeak('negative');
                mq.keystroke('Backspace');
                mq.typedText('a->b');
                assertLatex('a\\to b');
                assertMathspeak('"a" to "b"');
                mq.latex('');
                mq.typedText('a→b');
                assertLatex('a\\to b');
                assertMathspeak('"a" to "b"');
            });
            test('typing and backspacing ~', function () {
                // Set interprettildeAsSim to false. Tilde characters entered
                // via Latex should change, but those always input from the keyboard should continue to become \sim or \approx regardless.
                mq.config({ interpretTildeAsSim: false });
                mq.typedText('~');
                assertLatex('\\sim');
                assertMathspeak('tilde');
                mq.typedText('~');
                assertLatex('\\approx');
                assertMathspeak('approximately equal');
                mq.config({ interpretTildeAsSim: true });
                mq.typedText('~');
                assertLatex('\\approx\\sim');
                assertMathspeak('approximately equal tilde');
                mq.typedText('~');
                assertLatex('\\approx\\approx');
                assertMathspeak('approximately equal approximately equal');
                mq.config({ interpretTildeAsSim: false });
                mq.keystroke('Backspace');
                assertLatex('\\approx\\sim');
                assertMathspeak('approximately equal tilde');
                mq.keystroke('Backspace');
                assertLatex('\\approx');
                assertMathspeak('approximately equal');
                mq.keystroke('Backspace');
                assertLatex('\\sim');
                assertMathspeak('tilde');
                mq.keystroke('Backspace');
                mq.typedText('a~b');
                assertLatex('a\\sim b');
                assertMathspeak('"a" tilde "b"');
                mq.keystroke('Backspace');
                mq.typedText('~b');
                assertLatex('a\\approx b');
                assertMathspeak('"a" approximately equal "b"');
                // Now test that tilde is properly transformed when pasting in LaTeX.
                mq.latex('');
                mq.latex('a~b');
                assertLatex('a~b');
                assertMathspeak('"a" "b"');
                mq.latex('');
                mq.config({ interpretTildeAsSim: true });
                mq.latex('a~b');
                assertLatex('a\\sim b');
                assertMathspeak('"a" tilde "b"');
            });
            test('typing ≈ char directly', function () {
                mq.typedText('≈');
                assertLatex('\\approx');
                assertMathspeak('approximately equal');
                mq.keystroke('Backspace');
                assertLatex('\\sim');
                assertMathspeak('tilde');
            });
            suite('rendered from LaTeX', function () {
                test('control sequences', function () {
                    mq.latex('\\le');
                    assertFullyFunctioningInequality('\\le', '<', 'less than or equal to', 'less than');
                    mq.latex('\\ge');
                    assertFullyFunctioningInequality('\\ge', '>', 'greater than or equal to', 'greater than');
                });
                test('≤ and ≥ chars', function () {
                    mq.latex('≤');
                    assertFullyFunctioningInequality('\\le', '<', 'less than or equal to', 'less than');
                    mq.latex('≥');
                    assertFullyFunctioningInequality('\\ge', '>', 'greater than or equal to', 'greater than');
                });
            });
        });
        suite('SupSub behavior options', function () {
            test('superscript', function () {
                assert.equal(mq.typedText('x^2n+y').latex(), 'x^{2n+y}');
                mq.latex('');
                assert.equal(mq.typedText('x^+2n').latex(), 'x^{+2n}');
                mq.latex('');
                assert.equal(mq.typedText('x^-2n').latex(), 'x^{-2n}');
                mq.latex('');
                assert.equal(mq.typedText('x^=2n').latex(), 'x^{=2n}');
                mq.latex('');
            });
            test('subscript', function () {
                assert.equal(mq.typedText('x_2n+y').latex(), 'x_{2n+y}');
                mq.latex('');
                assert.equal(mq.typedText('x_+2n').latex(), 'x_{+2n}');
                mq.latex('');
                assert.equal(mq.typedText('x_-2n').latex(), 'x_{-2n}');
                mq.latex('');
                assert.equal(mq.typedText('x_=2n').latex(), 'x_{=2n}');
                mq.latex('');
            });
            test('supSubsRequireOperand', function () {
                assert.equal(mq.typedText('^').latex(), '^{ }');
                assert.equal(mq.typedText('2').latex(), '^{2}');
                assert.equal(mq.typedText('n').latex(), '^{2n}');
                mq.latex('');
                assert.equal(mq.typedText('x').latex(), 'x');
                assert.equal(mq.typedText('^').latex(), 'x^{ }');
                assert.equal(mq.typedText('2').latex(), 'x^{2}');
                assert.equal(mq.typedText('n').latex(), 'x^{2n}');
                mq.latex('');
                assert.equal(mq.typedText('x').latex(), 'x');
                assert.equal(mq.typedText('^').latex(), 'x^{ }');
                assert.equal(mq.typedText('^').latex(), 'x^{^{ }}');
                assert.equal(mq.typedText('2').latex(), 'x^{^{2}}');
                assert.equal(mq.typedText('n').latex(), 'x^{^{2n}}');
                mq.latex('');
                assert.equal(mq.typedText('2').latex(), '2');
                assert.equal(mq.keystroke('Shift-Left').typedText('^').latex(), '^{2}');
                mq.latex('');
                MQ.config({ supSubsRequireOperand: true });
                assert.equal(mq.typedText('^').latex(), '');
                assert.equal(mq.typedText('2').latex(), '2');
                assert.equal(mq.typedText('n').latex(), '2n');
                mq.latex('');
                assert.equal(mq.typedText('x').latex(), 'x');
                assert.equal(mq.typedText('^').latex(), 'x^{ }');
                assert.equal(mq.typedText('2').latex(), 'x^{2}');
                assert.equal(mq.typedText('n').latex(), 'x^{2n}');
                mq.latex('');
                assert.equal(mq.typedText('x').latex(), 'x');
                assert.equal(mq.typedText('^').latex(), 'x^{ }');
                assert.equal(mq.typedText('^').latex(), 'x^{ }');
                assert.equal(mq.typedText('2').latex(), 'x^{2}');
                assert.equal(mq.typedText('n').latex(), 'x^{2n}');
                mq.latex('');
                assert.equal(mq.typedText('2').latex(), '2');
                assert.equal(mq.keystroke('Shift-Left').typedText('^').latex(), '^{2}');
            });
        });
        suite('alternative symbols when typing / and *', function () {
            test('typingSlashWritesDivisionSymbol', function () {
                mq.typedText('/');
                assertLatex('\\frac{ }{ }');
                mq.config({ typingSlashWritesDivisionSymbol: true });
                mq.keystroke('Backspace').typedText('/');
                assertLatex('\\div');
            });
            test('typingAsteriskWritesTimesSymbol', function () {
                mq.typedText('*');
                assertLatex('\\cdot');
                mq.config({ typingAsteriskWritesTimesSymbol: true });
                mq.keystroke('Backspace').typedText('*');
                assertLatex('\\times');
            });
        });
        suite('typingPercentWritesPercentOf', function () {
            test('typingSlashWritesDivisionSymbol', function () {
                mq.typedText('%');
                assertLatex('\\%');
                mq.keystroke('Backspace');
                mq.config({ typingPercentWritesPercentOf: true });
                mq.typedText('%');
                assertLatex('\\%\\operatorname{of}');
                mq.keystroke('Backspace');
                assertLatex('');
            });
            test('percentof round trips correctly through serializing and parsing', function () {
                mq.latex('\\%\\operatorname{of}');
                assertLatex('\\%\\operatorname{of}');
            });
            test('overline renders as expected', function () {
                mq.latex('0.3\\overline{5}');
                assertLatex('0.3\\overline{5}');
                assertMathspeak('0 .3 StartOverline 5 EndOverline');
            });
        });
    });
    suite('up/down', function () {
        var $ = window.test_only_jquery;
        var mq, rootBlock, controller, cursor;
        setup(function () {
            mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
            rootBlock = mq.__controller.root;
            controller = mq.__controller;
            cursor = controller.cursor;
        });
        test('up/down in out of exponent', function () {
            controller.renderLatexMath('x^{nm}');
            var exp = rootBlock.ends[R], expBlock = exp.ends[L];
            assert.equal(exp.latex(), '^{nm}', 'right end el is exponent');
            assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
            assert.equal(cursor[L], exp, 'cursor is at the end of root block');
            mq.keystroke('Up');
            assert.equal(cursor.parent, expBlock, 'cursor up goes into exponent');
            mq.keystroke('Down');
            assert.equal(cursor.parent, rootBlock, 'cursor down leaves exponent');
            assert.equal(cursor[L], exp, 'down when cursor at end of exponent puts cursor after exponent');
            mq.keystroke('Up Left Left');
            assert.equal(cursor.parent, expBlock, 'cursor up left stays in exponent');
            assert.equal(cursor[L], 0, 'cursor is at the beginning of exponent');
            mq.keystroke('Down');
            assert.equal(cursor.parent, rootBlock, 'cursor down leaves exponent');
            assert.equal(cursor[R], exp, 'cursor down in beginning of exponent puts cursor before exponent');
            mq.keystroke('Up Right');
            assert.equal(cursor.parent, expBlock, 'cursor up left stays in exponent');
            assert.equal(cursor[L].latex(), 'n', 'cursor is in the middle of exponent');
            assert.equal(cursor[R].latex(), 'm', 'cursor is in the middle of exponent');
            mq.keystroke('Down');
            assert.equal(cursor.parent, rootBlock, 'cursor down leaves exponent');
            assert.equal(cursor[R], exp, 'cursor down in middle of exponent puts cursor before exponent');
        });
        // literally just swapped up and down, exponent with subscript, nm with 12
        test('up/down in out of subscript', function () {
            controller.renderLatexMath('a_{12}');
            var sub = rootBlock.ends[R], subBlock = sub.ends[L];
            assert.equal(sub.latex(), '_{12}', 'right end el is subscript');
            assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
            assert.equal(cursor[L], sub, 'cursor is at the end of root block');
            mq.keystroke('Down');
            assert.equal(cursor.parent, subBlock, 'cursor down goes into subscript');
            mq.keystroke('Up');
            assert.equal(cursor.parent, rootBlock, 'cursor up leaves subscript');
            assert.equal(cursor[L], sub, 'up when cursor at end of subscript puts cursor after subscript');
            mq.keystroke('Down Left Left');
            assert.equal(cursor.parent, subBlock, 'cursor down left stays in subscript');
            assert.equal(cursor[L], 0, 'cursor is at the beginning of subscript');
            mq.keystroke('Up');
            assert.equal(cursor.parent, rootBlock, 'cursor up leaves subscript');
            assert.equal(cursor[R], sub, 'cursor up in beginning of subscript puts cursor before subscript');
            mq.keystroke('Down Right');
            assert.equal(cursor.parent, subBlock, 'cursor down left stays in subscript');
            assert.equal(cursor[L].latex(), '1', 'cursor is in the middle of subscript');
            assert.equal(cursor[R].latex(), '2', 'cursor is in the middle of subscript');
            mq.keystroke('Up');
            assert.equal(cursor.parent, rootBlock, 'cursor up leaves subscript');
            assert.equal(cursor[R], sub, 'cursor up in middle of subscript puts cursor before subscript');
        });
        test('up/down into and within fraction', function () {
            controller.renderLatexMath('\\frac{12}{34}');
            var frac = rootBlock.ends[L], numer = frac.ends[L], denom = frac.ends[R];
            assert.equal(frac.latex(), '\\frac{12}{34}', 'fraction is in root block');
            assert.equal(frac, rootBlock.ends[R], 'fraction is sole child of root block');
            assert.equal(numer.latex(), '12', 'numerator is left end child of fraction');
            assert.equal(denom.latex(), '34', 'denominator is right end child of fraction');
            mq.keystroke('Up');
            assert.equal(cursor.parent, numer, 'cursor up goes into numerator');
            assert.equal(cursor[R], 0, 'cursor up from right of fraction inserts at right end of numerator');
            mq.keystroke('Down');
            assert.equal(cursor.parent, denom, 'cursor down goes into denominator');
            assert.equal(cursor[R], 0, 'cursor down from numerator inserts at right end of denominator');
            mq.keystroke('Up');
            assert.equal(cursor.parent, numer, 'cursor up goes into numerator');
            assert.equal(cursor[R], 0, 'cursor up from denominator inserts at right end of numerator');
            mq.keystroke('Left Left Left');
            assert.equal(cursor.parent, rootBlock, 'cursor outside fraction');
            assert.equal(cursor[R], frac, 'cursor before fraction');
            mq.keystroke('Up');
            assert.equal(cursor.parent, numer, 'cursor up goes into numerator');
            assert.equal(cursor[L], 0, 'cursor up from left of fraction inserts at left end of numerator');
            mq.keystroke('Left');
            assert.equal(cursor.parent, rootBlock, 'cursor outside fraction');
            assert.equal(cursor[R], frac, 'cursor before fraction');
            mq.keystroke('Down');
            assert.equal(cursor.parent, denom, 'cursor down goes into denominator');
            assert.equal(cursor[L], 0, 'cursor down from left of fraction inserts at left end of denominator');
        });
        test('nested subscripts and fractions', function () {
            controller.renderLatexMath('\\frac{d}{dx_{\\frac{24}{36}0}}\\sqrt{x}=x^{\\frac{1}{2}}');
            var exp = rootBlock.ends[R], expBlock = exp.ends[L], half = expBlock.ends[L], halfNumer = half.ends[L], halfDenom = half.ends[R];
            mq.keystroke('Left');
            assert.equal(cursor.parent, expBlock, 'cursor left goes into exponent');
            mq.keystroke('Down');
            assert.equal(cursor.parent, halfDenom, 'cursor down goes into denominator of half');
            mq.keystroke('Down');
            assert.equal(cursor.parent, rootBlock, 'down again puts cursor back in root block');
            assert.equal(cursor[L], exp, 'down from end of half puts cursor after exponent');
            var derivative = rootBlock.ends[L], dBlock = derivative.ends[L], dxBlock = derivative.ends[R], sub = dxBlock.ends[R], subBlock = sub.ends[L], subFrac = subBlock.ends[L], subFracNumer = subFrac.ends[L], subFracDenom = subFrac.ends[R];
            cursor.insAtLeftEnd(rootBlock);
            mq.keystroke('Down Right Right Down');
            assert.equal(cursor.parent, subBlock, 'cursor in subscript');
            mq.keystroke('Up');
            assert.equal(cursor.parent, subFracNumer, 'cursor up from beginning of subscript goes into subscript fraction numerator');
            mq.keystroke('Up');
            assert.equal(cursor.parent, dxBlock, 'cursor up from subscript fraction numerator goes out of subscript');
            assert.equal(cursor[R], sub, 'cursor up from subscript fraction numerator goes before subscript');
            mq.keystroke('Down Down');
            assert.equal(cursor.parent, subFracDenom, 'cursor in subscript fraction denominator');
            mq.keystroke('Up Up');
            assert.equal(cursor.parent, dxBlock, 'cursor up up from subscript fraction denominator thats not at right end goes out of subscript');
            assert.equal(cursor[R], sub, 'cursor up up from subscript fraction denominator thats not at right end goes before subscript');
            cursor.insAtRightEnd(subBlock);
            controller.backspace();
            assert.equal(subFrac[R], 0, 'subscript fraction is at right end');
            assert.equal(cursor[L], subFrac, 'cursor after subscript fraction');
            mq.keystroke('Down');
            assert.equal(cursor.parent, subFracDenom, 'cursor in subscript fraction denominator');
            mq.keystroke('Up Up');
            assert.equal(cursor.parent, dxBlock, 'cursor up up from subscript fraction denominator that is at right end goes out of subscript');
            assert.equal(cursor[L], sub, 'cursor up up from subscript fraction denominator that is at right end goes after subscript');
        });
        test('integral in exponent', function () {
            controller.renderLatexMath('2^{\\int_0^1}');
            var exp = rootBlock.ends[R], expBlock = exp.ends[L];
            mq.keystroke('Up');
            mq.keystroke('Up');
            assert.equal(cursor.parent.latex(), '1', 'cursor up goes to upper limit');
            var upperRect = cursor.parent
                .domFrag()
                .firstElement()
                .getBoundingClientRect();
            mq.keystroke('Down');
            assert.equal(cursor.parent.latex(), '0', 'cursor down goes to lower limit');
            var lowerRect = cursor.parent
                .domFrag()
                .firstElement()
                .getBoundingClientRect();
            mq.keystroke('Up');
            assert.equal(cursor.parent.latex(), '1', 'cursor up goes to upper limit');
            var upperAboveLower = upperRect.bottom < lowerRect.top;
            assert.equal(upperAboveLower, true, 'cursor actually moves downward for lower limit');
        });
        test('\\MathQuillMathField{} in a fraction', function () {
            var outer = MQ.StaticMath($('<span>\\frac{\\MathQuillMathField{n}}{2}</span>').appendTo('#mock')[0]);
            var inner = MQ($(outer.el()).find('.mq-editable-field')[0]);
            assert.equal(inner.__controller.cursor.parent, inner.__controller.root);
            inner.keystroke('Down');
            assert.equal(inner.__controller.cursor.parent, inner.__controller.root);
        });
    });
    suite('HTML', function () {
        function renderHtml(domView) {
            var Cmd = /** @class */ (function (_super) {
                __extends(class_15, _super);
                function class_15() {
                    var _this_1 = _super.call(this, undefined, domView) || this;
                    _this_1.id = 1;
                    _this_1.blocks = Array(domView.childCount);
                    var _loop_5 = function (i) {
                        var content = 'Block:' + i;
                        this_4.blocks[i] = {
                            id: 2 + i,
                            setDOM: function (_sibling) { },
                            html: function () {
                                var frag = document.createDocumentFragment();
                                frag.appendChild(h.text(content));
                                return frag;
                            },
                        };
                    };
                    var this_4 = this;
                    for (var i = 0; i < domView.childCount; i += 1) {
                        _loop_5(i);
                    }
                    return _this_1;
                }
                return class_15;
            }(MathCommand));
            return new Cmd().html();
        }
        function assertDOMEqual(actual, expected, message) {
            var expectedNode = parseHTML(expected);
            if (actual.isEqualNode(expectedNode))
                return;
            var d = document.createElement('div');
            d.appendChild(actual);
            var actualString = d.innerHTML;
            assert.fail(message + ' expected (' + actualString + ') to equal (' + expected + ')');
        }
        test('simple HTML templates', function () {
            assertDOMEqual(renderHtml(new DOMView(0, function () { return h('span', {}, [h.text('A Symbol')]); })), '<span>A Symbol</span>', 'a symbol');
            assertDOMEqual(renderHtml(new DOMView(1, function (blocks) { return h.block('span', {}, blocks[0]); })), '<span>Block:0</span>', 'same span is cmd and block');
            assertDOMEqual(renderHtml(new DOMView(2, function (blocks) {
                return h('span', {}, [
                    h.block('span', {}, blocks[0]),
                    h.block('span', {}, blocks[1]),
                ]);
            })), '<span>' + '<span>Block:0</span>' + '<span>Block:1</span>' + '</span>', 'container span with two block spans');
            assertDOMEqual(renderHtml(new DOMView(0, function () { return h('br'); })), '<br/>', 'self-closing tag');
        });
        test('Attempting to render multiple html nodes into a math command throws', function () {
            assert.throws(function () {
                renderHtml(new DOMView(2, function (blocks) {
                    var frag = document.createDocumentFragment();
                    frag.appendChild(h('span', {}, [h.block('span', {}, blocks[0])]));
                    frag.appendChild(h('span', {}, [h.block('span', {}, blocks[1])]));
                    return frag;
                }));
            });
        });
    });
    suite('DOMFragment', function () {
        function nodeArraysEqual(arr1, arr2) {
            if (arr1.length !== arr2.length)
                return false;
            for (var i = 0; i < arr1.length; i++) {
                if (arr1[i] !== arr2[i])
                    return false;
            }
            return true;
        }
        function fragmentsEqual(frag1, frag2) {
            return nodeArraysEqual(frag1.toNodeArray(), frag2.toNodeArray());
        }
        suite('DOMFragment.create factory function', function () {
            test('DOMFragment.create is aliased to domFrag', function () {
                assert.ok(domFrag === DOMFragment.create);
            });
            test('domFrag() creates an empty fragment', function () {
                assert.ok(domFrag().isEmpty());
            });
            test('domFrag(el) creates a one element fragment', function () {
                var el = h('span');
                assert.equal(domFrag(el).oneElement(), el);
            });
            test('domFrag(text) can hold a text node', function () {
                var el = h.text('text');
                assert.equal(domFrag(el).oneText(), el);
            });
            test('domFrag(el1, el2) throws an error if elements are not siblings', function () {
                var el1 = h('span');
                var el2 = h('span');
                assert.throws(function () { return domFrag(el1, el2); });
            });
            test('domFrag(el, undefined) throws', function () {
                var el = h('span');
                assert.throws(function () { return domFrag(el, undefined); });
            });
            test('domFrag(undefined, el) throws', function () {
                var el = h('span');
                assert.throws(function () { return domFrag(undefined, el); });
            });
            test('domFrag(el1, el2) represents all siblings between el1 and el2', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                var frag = domFrag(parent.firstChild, parent.lastChild);
                assert.ok(nodeArraysEqual(frag.toNodeArray(), children));
            });
            test('domFrag(el1, el2) does not include other children of the common parent', function () {
                var children = [
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                ];
                // Insert children into a parent to make them siblings
                h('span', {}, children);
                var innerChildren = children.slice(1, 4);
                var frag = domFrag(innerChildren[0], innerChildren[innerChildren.length - 1]);
                assert.ok(nodeArraysEqual(frag.toNodeArray(), innerChildren));
            });
        });
        test('.isEmpty()', function () {
            var children = [
                h('span'),
                h.text('text'),
                h('span'),
                h.text('text'),
                h('span'),
            ];
            var parent = h('span', {}, children);
            assert.ok(domFrag().isEmpty());
            assert.ok(!domFrag(h('span')).isEmpty());
            assert.ok(!domFrag(parent).children().isEmpty());
        });
        test('.isOneNode()', function () {
            var children = [
                h('span'),
                h.text('text'),
                h('span'),
                h.text('text'),
                h('span'),
            ];
            var parent = h('span', {}, children);
            assert.ok(!domFrag().isOneNode());
            assert.ok(domFrag(h('span')).isOneNode());
            assert.ok(!domFrag(parent).children().isOneNode());
        });
        suite('.isValid()', function () {
            test('empty fragments are always valid', function () {
                assert.ok(domFrag().isValid());
            });
            test('single element fragments are always valid', function () {
                assert.ok(domFrag(h('span')).isValid());
            });
            test('moving an end of a multi-element fragment invalidates it', function () {
                var children = [h('span'), h('span')];
                var parent = h('span', {}, children);
                var frag = domFrag(children[0], children[1]);
                assert.ok(frag.isValid());
                parent.removeChild(parent.lastChild);
                assert.ok(!frag.isValid());
            });
        });
        suite('.firstNode()', function () {
            test('throws when called on an empty fragment', function () {
                assert.throws(function () { return domFrag().firstNode(); });
            });
            test('works for a single element fragment', function () {
                var el = h('span');
                assert.equal(domFrag(el).firstNode(), el);
            });
            test('works for a single text Node fragment', function () {
                var el = h.text('text');
                assert.equal(domFrag(el).firstNode(), el);
            });
            test('works for a multi-element fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                // insert children into a parent so that thehy are siblings
                h('span', {}, children);
                var frag = domFrag(children[0], children[children.length - 1]);
                assert.equal(frag.firstNode(), children[0]);
            });
        });
        suite('.lastNode()', function () {
            test('throws when called on an empty fragment', function () {
                assert.throws(function () { return domFrag().lastNode(); });
            });
            test('works for a single element fragment', function () {
                var el = h('span');
                assert.equal(domFrag(el).lastNode(), el);
            });
            test('works for a single text Node fragment', function () {
                var el = h.text('text');
                assert.equal(domFrag(el).lastNode(), el);
            });
            test('works for a multi-element fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                // insert children into a parent so that thehy are siblings
                h('span', {}, children);
                var frag = domFrag(children[0], children[children.length - 1]);
                assert.equal(frag.lastNode(), children[children.length - 1]);
            });
        });
        suite('.children()', function () {
            test('throws when called on an empty fragment', function () {
                assert.throws(function () { return domFrag().children(); });
            });
            test('throws when called on a fragment with many nodes', function () {
                var children = [h('span'), h('span')];
                var parent = h('span', {}, children);
                assert.throws(function () { return domFrag(parent).children().children(); });
            });
            test('returns an empty fragment when called on a fragment holding an element with no children', function () {
                assert.ok(domFrag(h('span')).children().isEmpty());
            });
            test('returns an empty fragment when called on a fragment holding a single Text node', function () {
                assert.ok(domFrag(h.text('text')).children().isEmpty());
            });
            test('returns a fragment representing all children', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
            });
        });
        suite('.join()', function () {
            test('joining two empty fragments', function () {
                assert.ok(domFrag().join(domFrag()).isEmpty());
            });
            test('joining an empty fragment returns original fragment', function () {
                var frag = domFrag(h('span'));
                assert.ok(fragmentsEqual(frag.join(domFrag()), frag));
            });
            test('joining to an empty fragment returns the argument', function () {
                var frag = domFrag(h('span'));
                assert.ok(fragmentsEqual(domFrag().join(frag), frag));
            });
            test('Joining fragments that are not siblings throws', function () {
                var frag1 = domFrag(h('span'));
                var frag2 = domFrag(h('span'));
                assert.throws(function () { return frag1.join(frag2); });
            });
            test('Joining a fragment to itself throws', function () {
                var el = h('span');
                assert.throws(function () { return domFrag(el).join(domFrag(el)).oneElement(); });
            });
            test('Joining fragments that are siblings but not directional siblings throws', function () {
                var children = [h('span'), h.text('text'), h('span')];
                // Insert children into a parent to make them siblings;
                h('span', {}, children);
                assert.throws(function () { return domFrag(children[2]).join(domFrag(children[0])); });
                assert.throws(function () {
                    return domFrag(children[0], children[2]).join(domFrag(children[1]));
                });
                assert.throws(function () {
                    return domFrag(children[2]).join(domFrag(children[0], children[2]));
                });
            });
            test('Joining fragments represents the closure of their union', function () {
                var children = [
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                ];
                // Insert children into a parent to make them siblings
                h('span', {}, children);
                var frag1 = domFrag(children[1], children[3]);
                var frag2 = domFrag(children[5], children[6]);
                var expected = domFrag(children[1], children[6]);
                assert.ok(fragmentsEqual(frag1.join(frag2), expected));
            });
        });
        suite('.oneNode()', function () {
            test('throws for empty fragments', function () {
                assert.throws(function () { return domFrag().oneNode(); });
            });
            test('throws for many node fragments', function () {
                var el = h('span', {}, [h('span'), h('span')]);
                assert.throws(function () { return domFrag(el).children().oneNode(); });
            });
            test('returns a single Element node', function () {
                var el = h('span');
                assert.equal(domFrag(el).oneNode(), el);
            });
            test('returns a single Text node', function () {
                var el = h.text('text');
                assert.equal(domFrag(el).oneNode(), el);
            });
        });
        suite('.oneElement()', function () {
            test('throws for empty fragments', function () {
                assert.throws(function () { return domFrag().oneElement(); });
            });
            test('for many node fragments', function () {
                var el = h('span', {}, [h('span'), h('span')]);
                assert.throws(function () { return domFrag(el).children().oneElement(); });
            });
            test('returns a single Element node', function () {
                var el = h('span');
                assert.equal(domFrag(el).oneElement(), el);
            });
            test('throws for a single Text node', function () {
                var el = h.text('text');
                assert.throws(function () { return domFrag(el).oneElement(); });
            });
        });
        suite('.oneText()', function () {
            test('throws for empty fragments', function () {
                assert.throws(function () { return domFrag().oneText(); });
            });
            test('for many node fragments', function () {
                var el = h('span', {}, [h.text('a'), h.text('b')]);
                assert.throws(function () { return domFrag(el).children().oneText(); });
            });
            test('throws for a single Element node', function () {
                var el = h('span');
                assert.throws(function () { return domFrag(el).oneText(); });
            });
            test('returns a single Text node', function () {
                var el = h.text('text');
                assert.equal(domFrag(el).oneText(), el);
            });
        });
        suite('.eachNode()', function () {
            test('never calls its argument for an empty fragment', function () {
                var count = 0;
                function cb() {
                    count += 1;
                }
                domFrag().eachNode(cb);
                assert.equal(count, 0);
            });
            test('calls its argument once for a one element fragment', function () {
                var count = 0;
                function cb() {
                    count += 1;
                }
                domFrag(h('span')).eachNode(cb);
                assert.equal(count, 1);
            });
            test('calls its argument once for a one node fragment', function () {
                var count = 0;
                function cb() {
                    count += 1;
                }
                domFrag(h.text('a')).eachNode(cb);
                assert.equal(count, 1);
            });
            test('calls its argument once for each node of a multi node fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                var accum = [];
                domFrag(parent)
                    .children()
                    .eachNode(function (node) { return accum.push(node); });
                assert.ok(nodeArraysEqual(accum, children));
            });
        });
        suite('.eachElement()', function () {
            test('never calls its argument for an empty fragment', function () {
                var count = 0;
                function cb() {
                    count += 1;
                }
                domFrag().eachElement(cb);
                assert.equal(count, 0);
            });
            test('calls its argument once for a one element fragment', function () {
                var count = 0;
                function cb() {
                    count += 1;
                }
                domFrag(h('span')).eachElement(cb);
                assert.equal(count, 1);
            });
            test('never calls its argument once for a one text node fragment', function () {
                var count = 0;
                function cb() {
                    count += 1;
                }
                domFrag(h.text('a')).eachElement(cb);
                assert.equal(count, 0);
            });
            test('calls its argument once for each element of a multi node fragment', function () {
                var children = [h.text('text'), h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                var accum = [];
                domFrag(parent)
                    .children()
                    .eachElement(function (node) { return accum.push(node); });
                assert.ok(nodeArraysEqual([children[1], children[3]], accum));
            });
        });
        suite('.text()', function () {
            test('returns empty string for an empty fragment', function () {
                assert.equal(domFrag().text(), '');
            });
            test('returns the text content of a single text node', function () {
                assert.equal(domFrag(h.text('abc')).text(), 'abc');
            });
            test('returns the concatenated of multi-node fragments', function () {
                var el = h('span', {}, [
                    h.text('a'),
                    h('span', {}, [h.text('b'), h.text('c')]),
                    h('span'),
                ]);
                assert.equal(domFrag(el).text(), 'abc');
                assert.equal(domFrag(el).children().text(), 'abc');
            });
        });
        suite('.toNodeArray()', function () {
            test('returns an empty array for an empty fragment', function () {
                assert.ok(nodeArraysEqual(domFrag().toNodeArray(), []));
            });
            test('returns a one node array for a one element fragment', function () {
                var el = h('span');
                assert.ok(nodeArraysEqual(domFrag(el).toNodeArray(), [el]));
            });
            test('returns a one node array for a one text node fragment', function () {
                var el = h.text('a');
                assert.ok(nodeArraysEqual(domFrag(el).toNodeArray(), [el]));
            });
            test('returns an array of each node in a multi-node fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
            });
        });
        suite('.toElementArray()', function () {
            test('returns an empty array for an empty fragment', function () {
                assert.ok(nodeArraysEqual(domFrag().toElementArray(), []));
            });
            test('returns a one node array for a one element fragment', function () {
                var el = h('span');
                assert.ok(nodeArraysEqual(domFrag(el).toElementArray(), [el]));
            });
            test('returns an empty array for a one text node fragment', function () {
                var el = h.text('a');
                assert.ok(nodeArraysEqual(domFrag(el).toElementArray(), []));
            });
            test('returns an array of each element in a multi-node fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                var expected = [children[0], children[2]];
                assert.ok(nodeArraysEqual(domFrag(parent).children().toElementArray(), expected));
            });
        });
        suite('.toDocumentFragment()', function () {
            test('returns an empty DocumentFragment for an empty fragment', function () {
                assert.ok(domFrag().toDocumentFragment().firstChild === null);
            });
            test('moves all nodes in the fragment into a document fragment and returns it', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.equal(parent.firstChild, children[0]);
                var docFrag = domFrag(parent).children().toDocumentFragment();
                assert.equal(parent.firstChild, null);
                assert.ok(nodeArraysEqual(domFrag(docFrag.firstChild, docFrag.lastChild).toNodeArray(), children));
            });
        });
        var _loop_6 = function (name, apply) {
            suite(name, function () {
                test('is a noop when called on an empty fragment', function () {
                    var children = [h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                    assert.ok(apply(domFrag(), domFrag(parent).children()).isValid());
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                });
                test('detaches this fragment when called with an empty fragment', function () {
                    var children = [h('span'), h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(!domFrag(parent).children().isEmpty(), 'parent starts off with children');
                    assert.ok(apply(domFrag(parent).children(), domFrag()).isValid());
                    assert.ok(domFrag(parent).children().isEmpty(), 'inserting the parents children somewhere else removes them from parent');
                });
                test('detaches this fragment when called with a parentless fragment', function () {
                    var children = [h('span'), h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(!domFrag(parent).children().isEmpty(), 'parent starts off with children');
                    assert.ok(apply(domFrag(parent).children(), domFrag(h('span'))).isValid());
                    assert.ok(domFrag(parent).children().isEmpty(), 'inserting the parents children somewhere else removes them from parent');
                });
                test('works correctly with single node targets', function () {
                    var nTargetChildren = 3;
                    for (var i = 0; i < nTargetChildren; i++) {
                        var sourceChildren = [h('span'), h.text('a'), h('span')];
                        var sourceParent = h('span', {}, sourceChildren);
                        var targetChildren = [h('span'), h.text('a'), h('span')];
                        assert.equal(nTargetChildren, targetChildren.length);
                        var targetParent = h('span', {}, targetChildren);
                        assert.ok(!domFrag(sourceParent).children().isEmpty(), 'source parent starts off with children');
                        var targetFrag = domFrag(targetChildren[i]);
                        assert.ok(apply(domFrag(sourceParent).children(), targetFrag).isValid());
                        assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after they are moved');
                        assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren
                            .slice(0, i)
                            .concat(sourceChildren)
                            .concat(targetChildren.slice(i))));
                    }
                });
                test('works correctly with multi node targets', function () {
                    var nTargetChildren = 3;
                    for (var i = 0; i < nTargetChildren; i++) {
                        var sourceChildren = [h('span'), h.text('a'), h('span')];
                        var sourceParent = h('span', {}, sourceChildren);
                        var targetChildren = [h('span'), h.text('a'), h('span')];
                        assert.equal(nTargetChildren, targetChildren.length);
                        var targetParent = h('span', {}, targetChildren);
                        assert.ok(!domFrag(sourceParent).children().isEmpty(), 'source parent starts off with children');
                        // This makes a sliding window of two adjacent sibling nodes
                        var targetFrag = domFrag(targetChildren[i], targetChildren[Math.min(i + 1, nTargetChildren - 1)]);
                        assert.ok(apply(domFrag(sourceParent).children(), targetFrag).isValid());
                        assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after they are moved');
                        assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren
                            .slice(0, i)
                            .concat(sourceChildren)
                            .concat(targetChildren.slice(i))));
                    }
                });
            });
        };
        // .insertBefore(x) === .insDirOf(L, x) so run the same test suite for them
        for (var _c = 0, _d = [
            {
                name: '.insertBefore()',
                apply: function (self, arg) {
                    return self.insertBefore(arg);
                },
            },
            {
                name: '.insDirOf(L, ...)',
                apply: function (self, arg) {
                    return self.insDirOf(L, arg);
                },
            },
        ]; _c < _d.length; _c++) {
            var _e = _d[_c], name = _e.name, apply = _e.apply;
            _loop_6(name, apply);
        }
        var _loop_7 = function (name, apply) {
            suite(name, function () {
                test('is a noop when called on an empty fragment', function () {
                    var children = [h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                    assert.ok(apply(domFrag(), domFrag(parent).children()).isValid());
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                });
                test('detaches this fragment when called with an empty fragment', function () {
                    var children = [h('span'), h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(!domFrag(parent).children().isEmpty(), 'parent starts off with children');
                    assert.ok(apply(domFrag(parent).children(), domFrag()).isValid());
                    assert.ok(domFrag(parent).children().isEmpty(), 'inserting the parents children somewhere else removes them from parent');
                });
                test('detaches this fragment when called with a parentless fragment', function () {
                    var children = [h('span'), h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(!domFrag(parent).children().isEmpty(), 'parent starts off with children');
                    assert.ok(apply(domFrag(parent).children(), domFrag(h('span'))).isValid());
                    assert.ok(domFrag(parent).children().isEmpty(), 'inserting the parents children somewhere else removes them from parent');
                });
                test('works correctly with single node targets', function () {
                    var nTargetChildren = 3;
                    for (var i = 0; i < nTargetChildren; i++) {
                        var sourceChildren = [h('span'), h.text('a'), h('span')];
                        var sourceParent = h('span', {}, sourceChildren);
                        var targetChildren = [h('span'), h.text('a'), h('span')];
                        assert.equal(nTargetChildren, targetChildren.length);
                        var targetParent = h('span', {}, targetChildren);
                        assert.ok(!domFrag(sourceParent).children().isEmpty(), 'source parent starts off with children');
                        var targetFrag = domFrag(domFrag(targetParent).children().toNodeArray()[i]);
                        assert.ok(apply(domFrag(sourceParent).children(), targetFrag).isValid());
                        assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after they are moved');
                        assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren
                            .slice(0, i + 1)
                            .concat(sourceChildren)
                            .concat(targetChildren.slice(i + 1))));
                    }
                });
                test('works correctly with multi node targets', function () {
                    var nTargetChildren = 3;
                    for (var i = 0; i < nTargetChildren; i++) {
                        var sourceChildren = [h('span'), h.text('a'), h('span')];
                        var sourceParent = h('span', {}, sourceChildren);
                        var targetChildren = [h('span'), h.text('a'), h('span')];
                        assert.equal(nTargetChildren, targetChildren.length);
                        var targetParent = h('span', {}, targetChildren);
                        assert.ok(!domFrag(sourceParent).children().isEmpty(), 'source parent starts off with children');
                        var targetNodeArray = domFrag(targetParent)
                            .children()
                            .toNodeArray();
                        // This makes a sliding window of two adjacent sibling nodes
                        var targetFrag = domFrag(targetNodeArray[Math.max(i - 1, 0)], targetNodeArray[i]);
                        assert.ok(apply(domFrag(sourceParent).children(), targetFrag).isValid());
                        assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after they are moved');
                        assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren
                            .slice(0, i + 1)
                            .concat(sourceChildren)
                            .concat(targetChildren.slice(i + 1))));
                    }
                });
            });
        };
        // .insertAfter(x) === .insDirOf(R, x) so run the same test suite for them
        for (var _f = 0, _g = [
            {
                name: '.insertAfter()',
                apply: function (self, arg) {
                    return self.insertAfter(arg);
                },
            },
            {
                name: '.insDirOf(R, ...)',
                apply: function (self, arg) {
                    return self.insDirOf(R, arg);
                },
            },
        ]; _f < _g.length; _f++) {
            var _h = _g[_f], name = _h.name, apply = _h.apply;
            _loop_7(name, apply);
        }
        suite('.append()', function () {
            test('is a noop when called with an empty fragment', function () {
                var children = [h('span')];
                var parent = h('span', {}, children);
                assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                assert.ok(domFrag(parent).append(domFrag()).isValid());
                assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
            });
            test('throws on attempt to target an empty fragment', function () {
                var children = [h('span'), h('span')];
                var parent = h('span', {}, children);
                assert.throws(function () {
                    domFrag().append(domFrag(parent).children());
                });
                assert.throws(function () {
                    domFrag().append(domFrag());
                });
            });
            test('throws on attempt to target a multi-node fragment', function () {
                var sourceChildren = [h('span'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var targetChildren = [h('span'), h('span')];
                var targetParent = h('span', {}, targetChildren);
                assert.throws(function () {
                    domFrag(targetParent)
                        .children()
                        .append(domFrag(sourceParent).children());
                });
                assert.throws(function () {
                    domFrag(targetParent).children().append(domFrag());
                });
            });
            test('throws on attempt to target a non-Element Node', function () {
                var sourceChildren = [h('span'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var target = h.text('text');
                assert.throws(function () {
                    domFrag(target).append(domFrag(sourceParent).children());
                });
            });
            test('works correctly on target with no children', function () {
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var target = h('span');
                assert.ok(domFrag(target).children().isEmpty());
                assert.ok(domFrag(target).append(domFrag(sourceParent).children()).isValid());
                assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                assert.ok(nodeArraysEqual(domFrag(target).children().toNodeArray(), sourceChildren), 'all source children moved to target children');
            });
            test('works correctly on target with children', function () {
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var targetChildren = [h('span'), h.text('text'), h('span')];
                var targetParent = h('span', {}, targetChildren);
                assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren));
                assert.ok(domFrag(targetParent).append(domFrag(sourceParent).children()).isValid());
                assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren.concat(sourceChildren)), 'all source children moved to target children');
            });
        });
        suite('.prepend()', function () {
            test('is a noop when called on a one element fragment with an empty fragment', function () {
                var children = [h('span')];
                var parent = h('span', {}, children);
                assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                assert.ok(domFrag(parent).prepend(domFrag()).isValid());
                assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
            });
            test('throws on attempt to target an empty fragment', function () {
                var children = [h('span'), h('span')];
                var parent = h('span', {}, children);
                assert.throws(function () {
                    domFrag().prepend(domFrag(parent).children());
                });
                assert.throws(function () {
                    domFrag().prepend(domFrag());
                });
            });
            test('throws on attempt to target a multi-node fragment', function () {
                var sourceChildren = [h('span'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var targetChildren = [h('span'), h('span')];
                var targetParent = h('span', {}, targetChildren);
                assert.throws(function () {
                    domFrag(targetParent)
                        .children()
                        .prepend(domFrag(sourceParent).children());
                });
                assert.throws(function () {
                    domFrag(targetParent).children().prepend(domFrag());
                });
            });
            test('throws on attempt to target a non-Element Node', function () {
                var sourceChildren = [h('span'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var target = h.text('text');
                assert.throws(function () {
                    domFrag(target).prepend(domFrag(sourceParent).children());
                });
            });
            test('works correctly on target with no children', function () {
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var target = h('span');
                assert.ok(domFrag(target).children().isEmpty());
                assert.ok(domFrag(target).prepend(domFrag(sourceParent).children()).isValid());
                assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                assert.ok(nodeArraysEqual(domFrag(target).children().toNodeArray(), sourceChildren), 'all source children moved to target children');
            });
            test('works correctly on target with children', function () {
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                var targetChildren = [h('span'), h.text('text'), h('span')];
                var targetParent = h('span', {}, targetChildren);
                assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren));
                assert.ok(domFrag(targetParent)
                    .prepend(domFrag(sourceParent).children())
                    .isValid());
                assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), sourceChildren.concat(targetChildren)), 'all source children moved to target children');
            });
        });
        var _loop_8 = function (name, apply) {
            suite(name, function () {
                test('is a noop when this is an empty fragment', function () {
                    var children = [h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                    assert.ok(apply(domFrag(), domFrag(parent).oneElement()).isValid());
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                });
                test('works correctly on target with no children', function () {
                    var sourceChildren = [h('span'), h.text('text'), h('span')];
                    var sourceParent = h('span', {}, sourceChildren);
                    var target = h('span');
                    assert.ok(domFrag(target).children().isEmpty());
                    assert.ok(apply(domFrag(sourceParent).children(), domFrag(target).oneElement()).isValid());
                    assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                    assert.ok(nodeArraysEqual(domFrag(target).children().toNodeArray(), sourceChildren), 'all source children moved to target children');
                });
                test('works correctly on target with children', function () {
                    var sourceChildren = [h('span'), h.text('text'), h('span')];
                    var sourceParent = h('span', {}, sourceChildren);
                    var targetChildren = [h('span'), h.text('text'), h('span')];
                    var targetParent = h('span', {}, targetChildren);
                    assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren));
                    assert.ok(apply(domFrag(sourceParent).children(), domFrag(targetParent).oneElement()).isValid());
                    assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                    assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren.concat(sourceChildren)), 'all source children moved to target children');
                });
            });
        };
        // .appendTo(x) === .insAtDirEnd(R, x) so run the same test suite for them
        for (var _j = 0, _k = [
            {
                name: '.appendTo()',
                apply: function (self, arg) {
                    return self.appendTo(arg);
                },
            },
            {
                name: '.insAtDirEnd(R, ...)',
                apply: function (self, arg) {
                    return self.insAtDirEnd(R, arg);
                },
            },
        ]; _j < _k.length; _j++) {
            var _l = _k[_j], name = _l.name, apply = _l.apply;
            _loop_8(name, apply);
        }
        var _loop_9 = function (name, apply) {
            suite(name, function () {
                test('is a noop when this is an empty fragment', function () {
                    var children = [h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                    assert.ok(apply(domFrag(), domFrag(parent).oneElement()).isValid());
                    assert.ok(nodeArraysEqual(domFrag(parent).children().toNodeArray(), children));
                });
                test('works correctly on target with no children', function () {
                    var sourceChildren = [h('span'), h.text('text'), h('span')];
                    var sourceParent = h('span', {}, sourceChildren);
                    var target = h('span');
                    assert.ok(domFrag(target).children().isEmpty());
                    assert.ok(apply(domFrag(sourceParent).children(), domFrag(target).oneElement()).isValid());
                    assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                    assert.ok(nodeArraysEqual(domFrag(target).children().toNodeArray(), sourceChildren), 'all source children moved to target children');
                });
                test('works correctly on target with children', function () {
                    var sourceChildren = [h('span'), h.text('text'), h('span')];
                    var sourceParent = h('span', {}, sourceChildren);
                    var targetChildren = [h('span'), h.text('text'), h('span')];
                    var targetParent = h('span', {}, targetChildren);
                    assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), targetChildren));
                    assert.ok(apply(domFrag(sourceParent).children(), domFrag(targetParent).oneElement()).isValid());
                    assert.ok(domFrag(sourceParent).children().isEmpty(), 'source parent has no children after moving them');
                    assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), sourceChildren.concat(targetChildren)), 'all source children moved to target children');
                });
            });
        };
        // .prependTo(x) === .insAtDirEnd(L, x) so run the same test suite for them
        for (var _m = 0, _o = [
            {
                name: '.prependTo()',
                apply: function (self, arg) {
                    return self.prependTo(arg);
                },
            },
            {
                name: '.insAtDirEnd(L, ...)',
                apply: function (self, arg) {
                    return self.insAtDirEnd(L, arg);
                },
            },
        ]; _m < _o.length; _m++) {
            var _p = _o[_m], name = _p.name, apply = _p.apply;
            _loop_9(name, apply);
        }
        suite('.parent()', function () {
            test('returns an empty fragment when this is an empty fragment', function () {
                assert.ok(domFrag().parent().isEmpty());
            });
            test('returns an empty fragment when this is a fragment with no parent', function () {
                assert.ok(domFrag(h('span')).parent().isEmpty());
            });
            test('returns the parent of a one element fragment', function () {
                var children = [h('span')];
                var parent = h('span', {}, children);
                assert.equal(domFrag(parent).children().parent().oneElement(), parent);
            });
            test('returns the parent of a one text node fragment', function () {
                var children = [h.text('text')];
                var parent = h('span', {}, children);
                assert.equal(domFrag(parent).children().parent().oneElement(), parent);
            });
            test('returns the parent of a multi-element fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.equal(domFrag(parent).children().parent().oneElement(), parent);
            });
        });
        suite('.wrapAll()', function () {
            test("removes all of target's children when called with an empty fragment", function () {
                var targetChildren = [h('span'), h.text('text'), h('span')];
                var target = h('span', {}, targetChildren);
                assert.ok(!domFrag(target).children().isEmpty());
                assert.ok(domFrag().wrapAll(domFrag(target).oneElement()).isValid());
                assert.ok(domFrag(target).children().isEmpty());
            });
            test("replaces target's children with this fragment and places target into the DOM at the previous location of this fragment", function () {
                var targetChildren = [h('span'), h.text('text'), h('span')];
                var target = h('span', {}, targetChildren);
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                // Wrap only the last two source children
                var frag = domFrag(sourceChildren[1], sourceChildren[2]);
                assert.ok(frag.wrapAll(domFrag(target).oneElement()).isValid());
                assert.ok(nodeArraysEqual(domFrag(sourceParent).children().toNodeArray(), [
                    sourceChildren[0],
                    target,
                ]));
                assert.ok(nodeArraysEqual(domFrag(target).children().toNodeArray(), [
                    sourceChildren[1],
                    sourceChildren[2],
                ]));
            });
        });
        suite('.replaceWith()', function () {
            test('detaches source when this is an empty fragment', function () {
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                assert.ok(!domFrag(sourceParent).children().isEmpty());
                assert.ok(domFrag().replaceWith(domFrag(sourceParent).children()).isValid());
                assert.ok(domFrag(sourceParent).children().isEmpty());
            });
            test('detaches this fragment when called with an empty fragment', function () {
                var targetChildren = [h('span'), h.text('text'), h('span')];
                var targetParent = h('span', {}, targetChildren);
                // This fragment represents only the final two target children
                var frag = domFrag(targetChildren[1], targetChildren[2]);
                assert.ok(frag.replaceWith(domFrag()).isValid());
                assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), [
                    targetChildren[0],
                ]));
            });
            test('replaces this fragment with the fragment it is called with', function () {
                var targetChildren = [h('span'), h.text('text'), h('span')];
                var targetParent = h('span', {}, targetChildren);
                var sourceChildren = [h('span'), h.text('text'), h('span')];
                var sourceParent = h('span', {}, sourceChildren);
                // This fragment represents only the final two target children
                var frag = domFrag(targetChildren[1], targetChildren[2]);
                assert.ok(!domFrag(sourceParent).children().isEmpty());
                assert.ok(frag.replaceWith(domFrag(sourceParent).children()).isValid());
                assert.ok(domFrag(sourceParent).children().isEmpty());
                assert.ok(nodeArraysEqual(domFrag(targetParent).children().toNodeArray(), [targetChildren[0]].concat(sourceChildren)));
            });
        });
        suite('.nthElement()', function () {
            test('returns undefined when this is an empty fragments', function () {
                assert.equal(domFrag().nthElement(0), undefined);
                assert.equal(domFrag().nthElement(1), undefined);
                assert.equal(domFrag().nthElement(-1), undefined);
            });
            test('returns undefined when this fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.equal(frag.nthElement(0), undefined);
                assert.equal(frag.nthElement(1), undefined);
                assert.equal(frag.nthElement(-1), undefined);
            });
            test('returns undefined when there is no nth element of a multi-element fragment', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.equal(frag.nthElement(-1), undefined);
                assert.equal(frag.nthElement(0.5), undefined);
                assert.equal(frag.nthElement(3), undefined);
            });
            test('returns the nth element of a multi-element collection', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                var elements = [children[1], children[3]];
                for (var i = 0; i < elements.length; i++) {
                    assert.equal(frag.nthElement(i), elements[i]);
                }
            });
        });
        suite('.firstElement()', function () {
            test('returns undefined when this is an empty fragments', function () {
                assert.equal(domFrag().firstElement(), undefined);
            });
            test('returns undefined when this fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.equal(frag.firstElement(), undefined);
            });
            test('returns the first element of a multi-element collection', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.equal(frag.firstElement(), children[1]);
            });
        });
        suite('.lastElement()', function () {
            test('returns undefined when this is an empty fragments', function () {
                assert.equal(domFrag().lastElement(), undefined);
            });
            test('returns undefined when this fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.equal(frag.lastElement(), undefined);
            });
            test('returns the last element of a multi-element collection', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.equal(frag.lastElement(), children[3]);
            });
        });
        suite('.first()', function () {
            test('returns an empty fragment is an empty fragments', function () {
                assert.ok(domFrag().first().isEmpty());
            });
            test('returns an empty fragment fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.ok(frag.first().isEmpty());
            });
            test('returns a fragment representing first element of a multi-element collection', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.equal(frag.first().oneElement(), children[1]);
            });
        });
        suite('.last()', function () {
            test('returns an empty fragment is an empty fragments', function () {
                assert.ok(domFrag().last().isEmpty());
            });
            test('returns an empty fragment fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.ok(frag.last().isEmpty());
            });
            test('returns a fragment representing last element of a multi-element collection', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.equal(frag.last().oneElement(), children[3]);
            });
        });
        suite('.eq()', function () {
            test('returns an empty fragment when this is an empty fragments', function () {
                assert.ok(domFrag().eq(0).isEmpty());
                assert.ok(domFrag().eq(1).isEmpty());
                assert.ok(domFrag().eq(-1).isEmpty());
            });
            test('returns an empty fragment when this fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.ok(frag.eq(0).isEmpty());
                assert.ok(frag.eq(1).isEmpty());
                assert.ok(frag.eq(-1).isEmpty());
            });
            test('returns an empty fragment when there is no nth element of a multi-element fragment', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.ok(frag.eq(-1).isEmpty());
                assert.ok(frag.eq(0.5).isEmpty());
                assert.ok(frag.eq(3).isEmpty());
            });
            test('returns a fragment holding the nth element of a multi-element collection', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                var elements = [children[1], children[3]];
                for (var i = 0; i < elements.length; i++) {
                    assert.equal(frag.eq(i).oneElement(), elements[i]);
                }
            });
        });
        suite('.slice()', function () {
            test('returns an empty fragment when this is an empty fragments', function () {
                assert.ok(domFrag().slice(0).isEmpty());
                assert.ok(domFrag().slice(1).isEmpty());
                assert.ok(domFrag().slice(-1).isEmpty());
            });
            test('returns an empty fragment when this fragment contains only non-Element nodes', function () {
                var frag = domFrag(h.text('text'));
                assert.ok(frag.slice(0).isEmpty());
                assert.ok(frag.slice(1).isEmpty());
                assert.ok(frag.slice(-1).isEmpty());
            });
            test('returns an empty fragment when there is no nth element of a multi-element fragment', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.ok(frag.slice(-1).isEmpty());
                assert.ok(frag.slice(0.5).isEmpty());
                assert.ok(frag.slice(3).isEmpty());
            });
            test('returns a fragment starting from the nth element of this fragment and ending at the end of this fragment', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                var parent = h('span', {}, children);
                var frag = domFrag(parent).children();
                assert.ok(nodeArraysEqual(frag.slice(0).toNodeArray(), children.slice(1)));
                assert.ok(nodeArraysEqual(frag.slice(1).toNodeArray(), children.slice(3)));
            });
        });
        suite('.next()', function () {
            test('throws when this is an empty fragment', function () {
                assert.throws(function () { return domFrag().next(); });
            });
            test('throws when this is a multi-node fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.throws(function () { return domFrag(parent).children().next(); });
            });
            test('returns an empty fragment when called on a single element fragment', function () {
                var el = h('span');
                assert.ok(domFrag(el).next().isEmpty());
            });
            test('returns an empty fragment when called on a single text node fragment', function () {
                var el = h.text('text');
                assert.ok(domFrag(el).next().isEmpty());
            });
            test('returns single element fragments holding successive elements of a multi-element fragment', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                // Insert children into a parent to make them siblings
                h('span', {}, children);
                var frag = domFrag(children[0]);
                assert.equal(frag.next().oneElement(), children[1]);
                assert.equal(frag.next().next().oneElement(), children[3]);
                assert.ok(frag.next().next().next().isEmpty());
            });
        });
        suite('.prev()', function () {
            test('throws when this is an empty fragment', function () {
                assert.throws(function () { return domFrag().prev(); });
            });
            test('throws when this is a multi-node fragment', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.throws(function () { return domFrag(parent).children().prev(); });
            });
            test('returns an empty fragment when called on a single element fragment', function () {
                var el = h('span');
                assert.ok(domFrag(el).prev().isEmpty());
            });
            test('returns an empty fragment when called on a single text node fragment', function () {
                var el = h.text('text');
                assert.ok(domFrag(el).prev().isEmpty());
            });
            test('returns single element fragments holding predecessor elements of a multi-element fragment', function () {
                var children = [
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                    h('span'),
                    h.text('text'),
                ];
                // Insert children into a parent to make them siblings
                h('span', {}, children);
                var frag = domFrag(children[children.length - 1]);
                assert.equal(frag.prev().oneElement(), children[3]);
                assert.equal(frag.prev().prev().oneElement(), children[1]);
                assert.ok(frag.prev().prev().prev().isEmpty());
            });
        });
        suite('.empty()', function () {
            test('is a noop on an empty fragment', function () {
                assert.ok(domFrag().empty().isValid());
            });
            test('is a noop on a single element with no children', function () {
                var el = h('span');
                assert.ok(domFrag(el).children().isEmpty());
                assert.ok(domFrag(el).empty().isValid());
                assert.ok(domFrag(el).children().isEmpty());
            });
            test('is a noop on a single text node fragment', function () {
                var el = h.text('text');
                assert.ok(domFrag(el).children().isEmpty());
                assert.ok(domFrag(el).empty().isValid());
                assert.ok(domFrag(el).children().isEmpty());
            });
            test('empties every element of a multi-element fragment', function () {
                var children = [
                    h('span', {}, [h('span'), h.text('text'), h('span')]),
                    h.text('text'),
                    h('span', {}, [h('span'), h.text('text'), h('span')]),
                ];
                var parent = h('span', {}, children);
                var foundNonEmpty = false;
                for (var _c = 0, children_1 = children; _c < children_1.length; _c++) {
                    var child = children_1[_c];
                    if (!domFrag(child).children().isEmpty())
                        foundNonEmpty = true;
                }
                assert.ok(foundNonEmpty, 'children are not all empty at start');
                assert.ok(domFrag(parent).children().empty().isValid());
                for (var _d = 0, children_2 = children; _d < children_2.length; _d++) {
                    var child = children_2[_d];
                    assert.ok(domFrag(child).children().isEmpty(), 'every node of the fragment is empty after calling .empty()');
                }
            });
        });
        var _loop_10 = function (method) {
            suite(".".concat(method, "()"), function () {
                test('is a noop on an empty fragment', function () {
                    assert.ok(domFrag()[method]().isValid());
                });
                test('is a noop on a fragment with no parent', function () {
                    var el = h('span');
                    var frag = domFrag(el);
                    assert.equal(frag.oneElement(), el);
                    assert.ok(domFrag(h('span'))[method]().isValid());
                    assert.equal(frag.oneElement(), el);
                });
                test('detaches each node in the fragment from its parent', function () {
                    var children = [h('span'), h.text('text'), h('span')];
                    var parent = h('span', {}, children);
                    assert.ok(!domFrag(parent).children().isEmpty());
                    assert.ok(domFrag(parent).children()[method]().isValid());
                    assert.ok(domFrag(parent).children().isEmpty());
                });
            });
        };
        // remove and detach are currently aliases
        //
        // I propose dropping remove and always using detach, but currently
        // they're both here to express places that jQuery made a distinction
        // that DOMFragment doesn't
        for (var _q = 0, _r = ['remove', 'detach']; _q < _r.length; _q++) {
            var method = _r[_q];
            _loop_10(method);
        }
        suite('.hasClass()', function () {
            test('is always false for an empty fragment', function () {
                assert.ok(!domFrag().hasClass('cls'));
            });
            test('returns false for a one element fragment that does not have the class', function () {
                assert.ok(!domFrag(h('span')).hasClass('cls'));
            });
            test('returns true if a one element fragment does have the class', function () {
                assert.ok(domFrag(h('span', { class: 'cls' })).hasClass('cls'));
            });
            test('returns false if no element of a multi-element fragment has the class', function () {
                var children = [h('span'), h.text('text'), h('span')];
                var parent = h('span', {}, children);
                assert.ok(!domFrag(parent).children().hasClass('cls'));
            });
            test('returns true if any element of a multi-element fragment has the class', function () {
                var nChildren = 3;
                for (var i = 0; i <= nChildren; i++) {
                    var filler = [h('span'), h.text('text'), h('span')];
                    assert.equal(filler.length, nChildren);
                    var children = filler
                        .slice(0, i)
                        .concat(h('span', { class: 'a cls b' }))
                        .concat(filler.slice(i));
                    var parent = h('span', {}, children);
                    assert.ok(domFrag(parent).children().hasClass('cls'));
                }
            });
        });
        suite('.addClass()', function () {
            test('is a noop for an empty fragment', function () {
                assert.ok(domFrag().addClass('cls').isValid());
            });
            test('is a noop for a fragment with no elements', function () {
                assert.ok(domFrag(h.text('text')).addClass('cls').isValid());
            });
            test('adds class to each element of a multi-element fragment', function () {
                var children = [
                    h('span', { class: 'a b' }),
                    h.text('text'),
                    h('span', { class: 'c' }),
                    h('span', { class: 'cls' }),
                ];
                // Making children a tuple so we know we can read the classname
                // of the first and last element, but TS doesn't like handing a
                // type this specific to h
                var parent = h('span', {}, children);
                assert.equal(children[0].className, 'a b');
                assert.equal(children[2].className, 'c');
                assert.equal(children[3].className, 'cls');
                domFrag(parent).children().addClass('cls');
                assert.equal(children[0].className, 'a b cls');
                assert.equal(children[2].className, 'c cls');
                assert.equal(children[3].className, 'cls');
            });
        });
        suite('.removeClass()', function () {
            test('is a noop for an empty fragment', function () {
                assert.ok(domFrag().removeClass('cls').isValid());
            });
            test('is a noop for a fragment with no elements', function () {
                assert.ok(domFrag(h.text('text')).removeClass('cls').isValid());
            });
            test('removes class from each element of a multi-element fragment', function () {
                var children = [
                    h('span', { class: 'a cls b' }),
                    h.text('text'),
                    h('span', { class: 'c cls' }),
                    h('span', { class: 'd' }),
                ];
                // Making children a tuple so we know we can read the classname
                // of the first and last element, but TS doesn't like handing a
                // type this specific to h
                var parent = h('span', {}, children);
                assert.equal(children[0].className, 'a cls b');
                assert.equal(children[2].className, 'c cls');
                assert.equal(children[3].className, 'd');
                domFrag(parent).children().removeClass('cls');
                assert.equal(children[0].className, 'a b');
                assert.equal(children[2].className, 'c');
                assert.equal(children[3].className, 'd');
            });
        });
        suite('.toggleClass()', function () {
            test('is a noop for an empty fragment', function () {
                assert.ok(domFrag().toggleClass('cls').isValid());
                assert.ok(domFrag().toggleClass('cls', true).isValid());
                assert.ok(domFrag().toggleClass('cls', false).isValid());
            });
            test('is a noop for a fragment with no elements', function () {
                assert.ok(domFrag(h.text('text')).toggleClass('cls').isValid());
                assert.ok(domFrag(h.text('text')).toggleClass('cls', true).isValid());
                assert.ok(domFrag(h.text('text')).toggleClass('cls', false).isValid());
            });
            test('with one argumet, toggles class to each element of a multi-element fragment', function () {
                var children = [
                    h('span', { class: 'a b' }),
                    h.text('text'),
                    h('span', { class: 'c' }),
                    h('span', { class: 'cls' }),
                ];
                // Making children a tuple so we know we can read the classname
                // of the first and last element, but TS doesn't like handing a
                // type this specific to h
                var parent = h('span', {}, children);
                assert.equal(children[0].className, 'a b');
                assert.equal(children[2].className, 'c');
                assert.equal(children[3].className, 'cls');
                domFrag(parent).children().toggleClass('cls');
                assert.equal(children[0].className, 'a b cls');
                assert.equal(children[2].className, 'c cls');
                assert.equal(children[3].className, '');
            });
            test('when second argument is true, adds class to each element of a multi-element fragment', function () {
                var children = [
                    h('span', { class: 'a b' }),
                    h.text('text'),
                    h('span', { class: 'c' }),
                    h('span', { class: 'cls' }),
                ];
                // Making children a tuple so we know we can read the classname
                // of the first and last element, but TS doesn't like handing a
                // type this specific to h
                var parent = h('span', {}, children);
                assert.equal(children[0].className, 'a b');
                assert.equal(children[2].className, 'c');
                assert.equal(children[3].className, 'cls');
                domFrag(parent).children().toggleClass('cls', true);
                assert.equal(children[0].className, 'a b cls');
                assert.equal(children[2].className, 'c cls');
                assert.equal(children[3].className, 'cls');
            });
            test('when second argument is false, removes class to each element of a multi-element fragment', function () {
                var children = [
                    h('span', { class: 'a b cls' }),
                    h.text('text'),
                    h('span', { class: 'c cls' }),
                    h('span', { class: 'd' }),
                ];
                // Making children a tuple so we know we can read the classname
                // of the first and last element, but TS doesn't like handing a
                // type this specific to h
                var parent = h('span', {}, children);
                assert.equal(children[0].className, 'a b cls');
                assert.equal(children[2].className, 'c cls');
                assert.equal(children[3].className, 'd');
                domFrag(parent).children().toggleClass('cls', false);
                assert.equal(children[0].className, 'a b');
                assert.equal(children[2].className, 'c');
                assert.equal(children[3].className, 'd');
            });
        });
    });
    var MQ1 = getInterface(1);
    for (var key in MQ1)
        (function (key, val) {
            if (typeof val === 'function') {
                MathQuill[key] = function () {
                    insistOnInterVer();
                    return val.apply(this, arguments);
                };
                MathQuill[key].prototype = val.prototype;
            }
            else
                MathQuill[key] = val;
        }(key, MQ1[key]));
}());

