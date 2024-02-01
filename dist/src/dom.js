import { NodeBase, pray } from './bundle';
export function parseHTML(s) {
  var tmp = document.implementation.createHTMLDocument('');
  tmp.body.innerHTML = s;
  if (tmp.body.children.length === 1) return tmp.body.children[0];
  var frag = document.createDocumentFragment();
  while (tmp.body.firstChild) {
    frag.appendChild(tmp.body.firstChild);
  }
  return frag;
}
export var h = function h(type, attributes, children) {
  var el;
  switch (type) {
    case 'svg':
    case 'path':
      el = document.createElementNS('http://www.w3.org/2000/svg', type);
      break;
    default:
      el = document.createElement(type);
  }
  for (var key in attributes) {
    var value = attributes[key];
    if (value === undefined) continue;
    el.setAttribute(key, typeof value === 'string' ? value : String(value));
  }
  if (children) {
    for (var i = 0; i < children.length; i++) {
      el.appendChild(children[i]);
    }
  }
  return el;
};
h.text = (s) => document.createTextNode(s);
h.block = (type, attributes, block) => {
  var out = h(type, attributes, [block.html()]);
  block.setDOM(out);
  NodeBase.linkElementByBlockNode(out, block);
  return out;
};
h.entityText = (s) => {
  var val = parseHTML(s);
  pray(
    'entity parses to a single text node',
    val instanceof DocumentFragment &&
      val.childNodes.length === 1 &&
      val.childNodes[0] instanceof Text
  );
  return val.childNodes[0];
};
export function closest(el, s) {
  var _a, _b;
  if (
    typeof (el === null || el === void 0 ? void 0 : el.closest) === 'function'
  ) {
    return el.closest(s);
  }
  if (!(el instanceof HTMLElement)) return null;
  var matches =
    Element.prototype.matches ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
  var match = el;
  do {
    if (matches.call(match, s)) return match;
    match =
      (_b =
        (_a =
          match === null || match === void 0 ? void 0 : match.parentElement) !==
          null && _a !== void 0
          ? _a
          : match === null || match === void 0
          ? void 0
          : match.parentNode) !== null && _b !== void 0
        ? _b
        : null;
  } while (match !== null && match.nodeType === 1);
  return null;
}
