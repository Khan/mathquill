import { pray, L, R } from './bundle';
export class DOMFragment {
  static create(first, last) {
    if (arguments.length === 1) last = first;
    pray('No half-empty DOMFragments', !!first === !!last);
    var out = new DOMFragment(first, last);
    pray('last is a forward sibling of first', out.isValid());
    return out;
  }
  constructor(first, last) {
    if (arguments.length === 1) last = first;
    if (!first || !last) return;
    this.ends = { [L]: first, [R]: last };
  }
  isEmpty() {
    return this.ends === undefined;
  }
  isOneNode() {
    return !!(this.ends && this.ends[L] === this.ends[R]);
  }
  isValid() {
    if (!this.ends) return true;
    if (this.ends[L] === this.ends[R]) return true;
    var maybeLast;
    this.eachNode((el) => (maybeLast = el));
    return maybeLast === this.ends[R];
  }
  firstNode() {
    pray('Fragment is not empty', this.ends);
    return this.ends[L];
  }
  lastNode() {
    pray('Fragment is not empty', this.ends);
    return this.ends[R];
  }
  children() {
    var el = this.oneNode();
    var first = el.firstChild;
    var last = el.lastChild;
    return first && last ? new DOMFragment(first, last) : new DOMFragment();
  }
  join(sibling) {
    if (!this.ends) return sibling;
    if (!sibling.ends) return this;
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
  }
  oneNode() {
    pray(
      'Fragment has a single node',
      this.ends && this.ends[L] === this.ends[R]
    );
    return this.ends[L];
  }
  oneElement() {
    var el = this.oneNode();
    pray('Node is an Element', el.nodeType === Node.ELEMENT_NODE);
    return el;
  }
  oneText() {
    var el = this.oneNode();
    pray('Node is Text', el.nodeType === Node.TEXT_NODE);
    return el;
  }
  eachNode(cb) {
    if (!this.ends) return this;
    var stop = this.ends[R];
    for (var node = this.ends[L], next; node; node = next) {
      next = node.nextSibling;
      cb(node);
      if (node === stop) break;
    }
    return this;
  }
  eachElement(cb) {
    this.eachNode((el) => {
      if (el.nodeType === Node.ELEMENT_NODE) cb(el);
    });
    return this;
  }
  text() {
    var accum = '';
    this.eachNode((node) => {
      accum += node.textContent || '';
    });
    return accum;
  }
  toNodeArray() {
    var accum = [];
    this.eachNode((el) => accum.push(el));
    return accum;
  }
  toElementArray() {
    var accum = [];
    this.eachElement((el) => accum.push(el));
    return accum;
  }
  toDocumentFragment() {
    var frag = document.createDocumentFragment();
    this.eachNode((el) => frag.appendChild(el));
    return frag;
  }
  insertBefore(sibling) {
    return this.insDirOf(L, sibling);
  }
  insertAfter(sibling) {
    return this.insDirOf(R, sibling);
  }
  append(children) {
    children.appendTo(this.oneElement());
    return this;
  }
  prepend(children) {
    children.prependTo(this.oneElement());
    return this;
  }
  appendTo(el) {
    return this.insAtDirEnd(R, el);
  }
  prependTo(el) {
    return this.insAtDirEnd(L, el);
  }
  parent() {
    if (!this.ends) return this;
    var parent = this.ends[L].parentNode;
    if (!parent) return new DOMFragment();
    return new DOMFragment(parent);
  }
  wrapAll(el) {
    el.textContent = '';
    if (!this.ends) return this;
    var parent = this.ends[L].parentNode;
    var next = this.ends[R].nextSibling;
    this.appendTo(el);
    if (parent) {
      parent.insertBefore(el, next);
    }
    return this;
  }
  replaceWith(children) {
    var _a;
    var rightEnd = (_a = this.ends) === null || _a === void 0 ? void 0 : _a[R];
    var parent =
      rightEnd === null || rightEnd === void 0 ? void 0 : rightEnd.parentNode;
    var nextSibling =
      rightEnd === null || rightEnd === void 0 ? void 0 : rightEnd.nextSibling;
    this.detach();
    var childDocumentFragment = children.toDocumentFragment();
    if (!rightEnd || !parent) return this;
    parent.insertBefore(childDocumentFragment, nextSibling || null);
    return this;
  }
  nthElement(n) {
    if (!this.ends) return undefined;
    if (n < 0 || n !== Math.floor(n)) return undefined;
    var current = this.ends[L];
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        if (n <= 0) return current;
        n -= 1;
      }
      if (current === this.ends[R]) return undefined;
      current = current.nextSibling;
    }
    return undefined;
  }
  firstElement() {
    return this.nthElement(0);
  }
  lastElement() {
    if (!this.ends) return undefined;
    var current = this.ends[R];
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        return current;
      }
      if (current === this.ends[L]) return undefined;
      current = current.previousSibling;
    }
    return undefined;
  }
  first() {
    return new DOMFragment(this.firstElement());
  }
  last() {
    return new DOMFragment(this.lastElement());
  }
  eq(n) {
    return new DOMFragment(this.nthElement(n));
  }
  slice(n) {
    if (!this.ends) return this;
    var el = this.nthElement(n);
    if (!el) return new DOMFragment();
    return new DOMFragment(el, this.ends[R]);
  }
  next() {
    var current = this.oneNode();
    while (current) {
      current = current.nextSibling;
      if (current && current.nodeType === Node.ELEMENT_NODE)
        return new DOMFragment(current);
    }
    return new DOMFragment();
  }
  prev() {
    var current = this.oneNode();
    while (current) {
      current = current.previousSibling;
      if (current && current.nodeType === Node.ELEMENT_NODE)
        return new DOMFragment(current);
    }
    return new DOMFragment();
  }
  empty() {
    this.eachElement((el) => {
      el.textContent = '';
    });
    return this;
  }
  remove() {
    this.toDocumentFragment();
    return this;
  }
  detach() {
    return this.remove();
  }
  insDirOf(dir, sibling) {
    var _a;
    if (!this.ends) return this;
    var el = (_a = sibling.ends) === null || _a === void 0 ? void 0 : _a[dir];
    if (!el || !el.parentNode) return this.detach();
    _insDirOf(dir, el.parentNode, this.toDocumentFragment(), el);
    return this;
  }
  insAtDirEnd(dir, el) {
    if (!this.ends) return this;
    _insAtDirEnd(dir, this.toDocumentFragment(), el);
    return this;
  }
  hasClass(className) {
    var out = false;
    this.eachElement((el) => {
      if (el.classList.contains(className)) out = true;
    });
    return out;
  }
  addClass(classNames) {
    for (var className of classNames.split(/\s+/)) {
      if (!className) continue;
      this.eachElement((el) => {
        el.classList.add(className);
      });
    }
    return this;
  }
  removeClass(classNames) {
    for (var className of classNames.split(/\s+/)) {
      if (!className) continue;
      this.eachElement((el) => {
        el.classList.remove(className);
      });
    }
    return this;
  }
  toggleClass(classNames, on) {
    if (on === true) return this.addClass(classNames);
    if (on === false) return this.removeClass(classNames);
    for (var className of classNames.split(/\s+/)) {
      if (!className) continue;
      this.eachElement((el) => {
        el.classList.toggle(className);
      });
    }
    return this;
  }
}
export var domFrag = DOMFragment.create;
function _insDirOf(dir, parent, source, target) {
  parent.insertBefore(source, dir === L ? target : target.nextSibling);
}
function _insAtDirEnd(dir, source, parent) {
  if (dir === L) {
    parent.insertBefore(source, parent.firstChild);
  } else {
    parent.appendChild(source);
  }
}
