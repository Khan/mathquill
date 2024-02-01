var _a, _b;
import {
  L,
  MQNode,
  MQSelection,
  R,
  SupSub,
  domFrag,
  pray,
  prayDirection,
} from './bundle';
export class Point {
  constructor(parent, leftward, rightward) {
    this.init(parent, leftward, rightward);
  }
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
  if (!el) return;
  var stop = ends[R];
  if (!stop) return;
  stop = stop[R];
  for (; el !== stop; el = el[R]) {
    var result = yield_(el);
    if (result === false) break;
  }
}
function foldNodes(ends, fold, yield_) {
  var el = ends[L];
  if (!el) return fold;
  var stop = ends[R];
  if (!stop) return fold;
  stop = stop[R];
  for (; el !== stop; el = el[R]) {
    fold = yield_(fold, el);
  }
  return fold;
}
export class NodeBase {
  constructor() {
    this[_a] = 0;
    this[_b] = 0;
    this.parent = 0;
    this.ends = { [L]: 0, [R]: 0 };
    this.id = NodeBase.uniqueNodeId();
  }
  static uniqueNodeId() {
    return (NodeBase.idCounter += 1);
  }
  static getNodeOfElement(el) {
    if (!el) return;
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
      pray(
        'DOM is an element or a text node',
        el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE
      );
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
    cursor[dir] = node.adopt(cursor.parent, cursor[L], cursor[R]);
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
      if (result === false) break;
    }
    return this;
  }
  postOrder(yield_) {
    var self = this.getSelfNode();
    (function recurse(descendant) {
      if (!descendant) return false;
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
    if (!this.isEmpty()) return false;
    if (!dlms) return false;
    if (!this.parent || this.parent.ctrlSeq === undefined) return false;
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
    var self = this.getSelfNode();
    new Fragment(self, self).withDirAdopt(dir, parent, withDir, oppDir);
    return this;
  }
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
    if (!options.disableAutoSubstitutionInSubscripts) return false;
    if (!this.parent) return false;
    if (!(this.parent.parent instanceof SupSub)) return false;
    if (!this.parent.domFrag().hasClass('mq-sub')) return false;
    return true;
  }
  getSelfNode() {
    return this;
  }
  parser() {
    pray('Abstract parser() method is never called', false);
  }
  html() {
    throw new Error('html() unimplemented in NodeBase');
  }
  text() {
    return '';
  }
  latex() {
    var ctx = { latex: '', startIndex: -1, endIndex: -1 };
    this.latexRecursive(ctx);
    return ctx.latex;
  }
  latexRecursive(_ctx) {}
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
  finalizeTree(_options, _dir) {}
  contactWeld(_cursor, _dir) {}
  blur(_cursor) {}
  focus() {}
  intentionalBlur() {}
  reflow() {}
  registerInnerField(_innerFields, _mathField) {}
  chToCmd(_ch, _options) {
    pray('Abstract chToCmd() method is never called', false);
  }
  mathspeak(_options) {
    return '';
  }
  seek(_clientX, _cursor) {}
  siblingDeleted(_options, _dir) {}
  siblingCreated(_options, _dir) {}
  finalizeInsert(_options, _cursor) {}
  fixDigitGrouping(_opts) {}
  writeLatex(_cursor, _latex) {}
  write(_cursor, _ch) {}
}
(_a = L), (_b = R);
NodeBase.idCounter = 0;
function prayWellFormed(parent, leftward, rightward) {
  pray('a parent is always present', parent);
  pray(
    'leftward is properly set up',
    (function () {
      if (!leftward) return parent.getEnd(L) === rightward;
      return leftward[R] === rightward && leftward.parent === parent;
    })(),
    {
      parent: parent,
      leftward: leftward,
      leftwardL: leftward && leftward[L],
      leftwardR: leftward && leftward[R],
      rightwardL: rightward && rightward[L],
      rightwardR: rightward && rightward[R],
    }
  );
  pray(
    'rightward is properly set up',
    (function () {
      if (!rightward) return parent.getEnd(R) === leftward;
      return rightward[L] === leftward && rightward.parent === parent;
    })(),
    {
      parent: parent,
      rightward: rightward,
      leftwardL: leftward && leftward[L],
      leftwardR: leftward && leftward[R],
      rightwardL: rightward && rightward[L],
      rightwardR: rightward && rightward[R],
      rightwardParent: rightward && rightward.parent,
    }
  );
}
export class Fragment {
  constructor(withDir, oppDir, dir) {
    this.disowned = false;
    if (dir === undefined) dir = L;
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
    pray(
      'withDir and oppDir have the same parent',
      withDir.parent === oppDir.parent
    );
    var ends = {
      [dir]: withDir,
      [-dir]: oppDir,
    };
    this.setEnds(ends);
    var maybeRightEnd = 0;
    this.each((el) => {
      maybeRightEnd = el;
    });
    pray(
      'following direction siblings from start reaches end',
      maybeRightEnd === ends[R]
    );
  }
  getDOMFragFromEnds() {
    var left = this.ends[L];
    var right = this.ends[R];
    if (left === 0 || right === 0) {
      return domFrag();
    } else if (left === right) {
      return left.domFrag();
    } else {
      return left.domFrag().join(right.domFrag());
    }
  }
  setEnds(ends) {
    this.ends = ends;
  }
  getEnd(dir) {
    return this.ends ? this.ends[dir] : 0;
  }
  domFrag() {
    return this.getDOMFragFromEnds();
  }
  withDirAdopt(dir, parent, withDir, oppDir) {
    return dir === L
      ? this.adopt(parent, withDir, oppDir)
      : this.adopt(parent, oppDir, withDir);
  }
  adopt(parent, leftward, rightward) {
    prayWellFormed(parent, leftward, rightward);
    var self = this;
    this.disowned = false;
    var leftEnd = self.ends[L];
    if (!leftEnd) return this;
    var rightEnd = self.ends[R];
    if (!rightEnd) return this;
    var ends = { [L]: parent.getEnd(L), [R]: parent.getEnd(R) };
    if (leftward) {
    } else {
      ends[L] = leftEnd;
    }
    if (rightward) {
      rightward[L] = rightEnd;
    } else {
      ends[R] = rightEnd;
    }
    parent.setEnds(ends);
    rightEnd[R] = rightward;
    self.each(function (el) {
      el[L] = leftward;
      el.parent = parent;
      if (leftward) leftward[R] = el;
      leftward = el;
      return true;
    });
    return self;
  }
  disown() {
    var self = this;
    var leftEnd = self.ends[L];
    if (!leftEnd || self.disowned) return self;
    this.disowned = true;
    var rightEnd = self.ends[R];
    if (!rightEnd) return self;
    var parent = leftEnd.parent;
    prayWellFormed(parent, leftEnd[L], leftEnd);
    prayWellFormed(parent, rightEnd, rightEnd[R]);
    var ends = { [L]: parent.getEnd(L), [R]: parent.getEnd(R) };
    if (leftEnd[L]) {
      var leftLeftEnd = leftEnd[L];
      leftLeftEnd[R] = rightEnd[R];
    } else {
      ends[L] = rightEnd[R];
    }
    if (rightEnd[R]) {
      var rightRightEnd = rightEnd[R];
      rightRightEnd[L] = leftEnd[L];
    } else {
      ends[R] = leftEnd[L];
    }
    if (ends[L] && ends[R]) {
      parent.setEnds(ends);
    } else {
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
export var LatexCmds = {};
export var CharCmds = {};
export function isMQNodeClass(cmd) {
  return cmd && cmd.prototype instanceof MQNode;
}
