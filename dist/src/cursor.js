import {
  Fragment,
  L,
  MathBlock,
  Point,
  R,
  U_ZERO_WIDTH_SPACE,
  domFrag,
  getBoundingClientRect,
  h,
  pray,
  prayDirection,
} from './bundle';
export class Anticursor extends Point {
  constructor(parent, leftward, rightward) {
    super(parent, leftward, rightward);
    this.ancestors = {};
  }
  static fromCursor(cursor) {
    return new Anticursor(cursor.parent, cursor[L], cursor[R]);
  }
}
export class Cursor extends Point {
  constructor(initParent, options, controller) {
    super(initParent, 0, 0);
    this.upDownCache = {};
    this.cursorElement = h('span', { class: 'mq-cursor' }, [
      h.text(U_ZERO_WIDTH_SPACE),
    ]);
    this._domFrag = domFrag();
    this.controller = controller;
    this.options = options;
    this.setDOMFrag(domFrag(this.cursorElement));
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
    if (this.intervalId) clearInterval(this.intervalId);
    else {
      var right = this[R];
      if (right) {
        var selection = this.selection;
        if (selection && selection.getEnd(L)[L] === this[L])
          this.domFrag().insertBefore(selection.domFrag());
        else this.domFrag().insertBefore(right.domFrag());
      } else this.domFrag().appendTo(this.parent.domFrag().oneElement());
      this.parent.focus();
    }
    this.intervalId = setInterval(this.blink, 500);
    return this;
  }
  hide() {
    if (this.intervalId) clearInterval(this.intervalId);
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
    if (oldParent !== parent && oldParent.blur) oldParent.blur(this);
  }
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
  jumpUpDown(from, to) {
    var self = this;
    self.upDownCache[from.id] = Point.copy(self);
    var cached = self.upDownCache[to.id];
    if (cached) {
      var cachedR = cached[R];
      if (cachedR) {
        self.insLeftOf(cachedR);
      } else {
        self.insAtRightEnd(cached.parent);
      }
    } else {
      var clientX = self.getBoundingClientRectWithoutMargin().left;
      to.seek(clientX, self);
    }
    self.controller.aria.queue(to, true);
  }
  getBoundingClientRectWithoutMargin() {
    var frag = this.domFrag();
    frag.removeClass('mq-cursor');
    var { left, right } = getBoundingClientRect(frag.oneElement());
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
      if (uncle.isEmpty()) return true;
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
      var thisL = this[L];
      if (thisL) this[R] = thisL[R];
      else {
        while (!this[R]) {
          var newParent = this.parent[R];
          if (newParent) {
            this.parent = newParent;
            this[R] = newParent.getEnd(L);
          } else {
            this[R] = gramp[R];
            this.parent = greatgramp;
            break;
          }
        }
      }
    }
    var thisR = this[R];
    if (thisR) this.insLeftOf(thisR);
    else this.insAtRightEnd(greatgramp);
    gramp.domFrag().remove();
    var grampL = gramp[L];
    var grampR = gramp[R];
    if (grampL) grampL.siblingDeleted(cursor.options, R);
    if (grampR) grampR.siblingDeleted(cursor.options, L);
  }
  startSelection() {
    var anticursor = (this.anticursor = Anticursor.fromCursor(this));
    var ancestors = anticursor.ancestors;
    for (
      var ancestor = anticursor;
      ancestor.parent;
      ancestor = ancestor.parent
    ) {
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
    var ancestor = this;
    while (ancestor.parent) {
      if (ancestor.parent.id in anticursor.ancestors) {
        _lca = ancestor.parent;
        break;
      }
      ancestor =
        ancestor === null || ancestor === void 0 ? void 0 : ancestor.parent;
    }
    pray('cursor and anticursor in the same tree', _lca);
    var lca = _lca;
    var antiAncestor = anticursor.ancestors[lca.id];
    var leftEnd,
      rightEnd,
      dir = R;
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
    if (leftEnd instanceof Point) leftEnd = leftEnd[R];
    if (rightEnd instanceof Point) rightEnd = rightEnd[L];
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
    if (!selection) return;
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
    } else {
      return false;
    }
  }
  selectionChanged() {}
}
export class MQSelection extends Fragment {
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
    var childFrag = this.getDOMFragFromEnds();
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
