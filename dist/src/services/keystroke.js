import {
  ControllerBase,
  Controller_focusBlur,
  Fragment,
  L,
  NodeBase,
  R,
  baseOptionProcessors,
  pray,
  prayDirection,
} from '../bundle';
var INCREMENTAL_SELECTION_OPEN = false;
export class MQNode extends NodeBase {
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
      case 'Esc':
      case 'Tab':
        ctrlr.escapeDir(R, key, e);
        return;
      case 'Shift-Tab':
      case 'Shift-Esc':
        ctrlr.escapeDir(L, key, e);
        return;
      case 'End':
        ctrlr.notify('move').cursor.insAtRightEnd(cursor.parent);
        ctrlr.aria.queue('end of').queue(cursor.parent, true);
        break;
      case 'Ctrl-End':
        ctrlr.notify('move').cursor.insAtRightEnd(ctrlr.root);
        ctrlr.aria
          .queue('end of')
          .queue(ctrlr.ariaLabel)
          .queue(ctrlr.root)
          .queue(ctrlr.ariaPostLabel);
        break;
      case 'Shift-End':
        ctrlr.selectToBlockEndInDir(R);
        break;
      case 'Ctrl-Shift-End':
        ctrlr.selectToRootEndInDir(R);
        break;
      case 'Home':
        ctrlr.notify('move').cursor.insAtLeftEnd(cursor.parent);
        ctrlr.aria.queue('beginning of').queue(cursor.parent, true);
        break;
      case 'Ctrl-Home':
        ctrlr.notify('move').cursor.insAtLeftEnd(ctrlr.root);
        ctrlr.aria
          .queue('beginning of')
          .queue(ctrlr.ariaLabel)
          .queue(ctrlr.root)
          .queue(ctrlr.ariaPostLabel);
        break;
      case 'Shift-Home':
        ctrlr.selectToBlockEndInDir(L);
        break;
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
            while (cursor[L]) selectDir(L);
          } else {
            selectDir(L);
          }
        });
        break;
      case 'Shift-Down':
        ctrlr.withIncrementalSelection((selectDir) => {
          if (cursor[R]) {
            while (cursor[R]) selectDir(R);
          } else {
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
      case 'Ctrl-Alt-Up':
        if (cursor.parent.parent && cursor.parent.parent instanceof MQNode)
          ctrlr.aria.queue(cursor.parent.parent);
        else ctrlr.aria.queue('nothing above');
        break;
      case 'Ctrl-Alt-Down':
        if (cursor.parent && cursor.parent instanceof MQNode)
          ctrlr.aria.queue(cursor.parent);
        else ctrlr.aria.queue('block is empty');
        break;
      case 'Ctrl-Alt-Left':
        if (cursor.parent.parent && cursor.parent.parent.getEnd(L)) {
          ctrlr.aria.queue(cursor.parent.parent.getEnd(L));
        } else {
          ctrlr.aria.queue('nothing to the left');
        }
        break;
      case 'Ctrl-Alt-Right':
        if (cursor.parent.parent && cursor.parent.parent.getEnd(R)) {
          ctrlr.aria.queue(cursor.parent.parent.getEnd(R));
        } else {
          ctrlr.aria.queue('nothing to the right');
        }
        break;
      case 'Ctrl-Alt-Shift-Down':
        if (cursor.selection)
          ctrlr.aria.queue(
            cursor.selection.join('mathspeak', ' ').trim() + ' selected'
          );
        else ctrlr.aria.queue('nothing selected');
        break;
      case 'Ctrl-Alt-=':
      case 'Ctrl-Alt-Shift-Right':
        if (ctrlr.ariaPostLabel.length) ctrlr.aria.queue(ctrlr.ariaPostLabel);
        else ctrlr.aria.queue('no answer');
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
  }
  moveTowards(_dir, _cursor, _updown) {
    pray('overridden or never called on this node', false);
  }
  deleteOutOf(_dir, _cursor) {
    pray('overridden or never called on this node', false);
  }
  deleteTowards(_dir, _cursor) {
    pray('overridden or never called on this node', false);
  }
  unselectInto(_dir, _cursor) {
    pray('overridden or never called on this node', false);
  }
  selectOutOf(_dir, _cursor) {
    pray('overridden or never called on this node', false);
  }
  selectTowards(_dir, _cursor) {
    pray('overridden or never called on this node', false);
  }
}
ControllerBase.onNotify(function (cursor, e) {
  if (e === 'move' || e === 'upDown') cursor.show().clearSelection();
});
baseOptionProcessors.leftRightIntoCmdGoes = function (updown) {
  if (updown && updown !== 'up' && updown !== 'down') {
    throw (
      '"up" or "down" required for leftRightIntoCmdGoes option, ' +
      'got "' +
      updown +
      '"'
    );
  }
  return updown;
};
ControllerBase.onNotify(function (cursor, e) {
  if (e !== 'upDown') cursor.upDownCache = {};
});
ControllerBase.onNotify(function (cursor, e) {
  if (e === 'edit') cursor.show().deleteSelection();
});
ControllerBase.onNotify(function (cursor, e) {
  if (e !== 'select') cursor.endSelection();
});
export class Controller_keystroke extends Controller_focusBlur {
  keystroke(key, evt) {
    this.cursor.parent.keystroke(key, evt, this.getControllerSelf());
  }
  escapeDir(dir, _key, e) {
    prayDirection(dir);
    var cursor = this.cursor;
    if (cursor.parent !== this.root)
      e === null || e === void 0 ? void 0 : e.preventDefault();
    if (cursor.parent === this.root) return;
    cursor.clearSelection();
    cursor.parent.moveOutOf(dir, cursor);
    cursor.controller.aria.alert();
    return this.notify('move');
  }
  moveDir(dir) {
    prayDirection(dir);
    var cursor = this.cursor,
      updown = cursor.options.leftRightIntoCmdGoes;
    var cursorDir = cursor[dir];
    if (cursor.selection) {
      cursor.insDirOf(dir, cursor.selection.getEnd(dir));
    } else if (cursorDir) cursorDir.moveTowards(dir, cursor, updown);
    else cursor.parent.moveOutOf(dir, cursor, updown);
    return this.notify('move');
  }
  moveLeft() {
    return this.moveDir(L);
  }
  moveRight() {
    return this.moveDir(R);
  }
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
    } else {
      dirInto = 'downInto';
      dirOutOf = 'downOutOf';
    }
    var cursorL = cursor[L];
    var cursorR = cursor[R];
    var cursorR_dirInto = cursorR && cursorR[dirInto];
    var cursorL_dirInto = cursorL && cursorL[dirInto];
    if (cursorR_dirInto) cursor.insAtLeftEnd(cursorR_dirInto);
    else if (cursorL_dirInto) cursor.insAtRightEnd(cursorL_dirInto);
    else {
      cursor.parent.bubble(function (ancestor) {
        var prop = ancestor[dirOutOf];
        if (prop) {
          if (typeof prop === 'function') prop = prop.call(ancestor, cursor);
          if (prop instanceof MQNode) cursor.jumpUpDown(ancestor, prop);
          if (prop !== true) return false;
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
        ctrlr.aria.queue(
          cursorEl.parent
            .chToCmd(cursorEl.sides[-dir].ch)
            .mathspeak({ createdLeftOf: cursor })
        );
      } else if (!cursorEl.blocks && cursorEl.parent.ctrlSeq !== '\\text') {
        ctrlr.aria.queue(cursorEl);
      }
    } else if (cursorElParent && cursorElParent instanceof MQNode) {
      if (cursorElParent.sides) {
        ctrlr.aria.queue(
          cursorElParent.parent
            .chToCmd(cursorElParent.sides[dir].ch)
            .mathspeak({ createdLeftOf: cursor })
        );
      } else if (cursorElParent.blocks && cursorElParent.mathspeakTemplate) {
        if (cursorElParent.upInto && cursorElParent.downInto) {
          ctrlr.aria.queue(cursorElParent.mathspeakTemplate[1]);
        } else {
          var mst = cursorElParent.mathspeakTemplate;
          var textToQueue = dir === L ? mst[0] : mst[mst.length - 1];
          ctrlr.aria.queue(textToQueue);
        }
      } else {
        ctrlr.aria.queue(cursorElParent);
      }
    }
    var hadSelection = cursor.selection;
    this.notify('edit');
    if (!hadSelection) {
      var cursorDir = cursor[dir];
      if (cursorDir) cursorDir.deleteTowards(dir, cursor);
      else cursor.parent.deleteOutOf(dir, cursor);
    }
    var cursorL = cursor[L];
    var cursorR = cursor[R];
    if (cursorL.siblingDeleted) cursorL.siblingDeleted(cursor.options, R);
    if (cursorR.siblingDeleted) cursorR.siblingDeleted(cursor.options, L);
    cursor.parent.bubble(function (node) {
      node.reflow();
      return undefined;
    });
    return this;
  }
  ctrlDeleteDir(dir) {
    prayDirection(dir);
    var cursor = this.cursor;
    if (!cursor[dir] || cursor.selection) return this.deleteDir(dir);
    this.notify('edit');
    var fragRemoved;
    if (dir === L) {
      fragRemoved = new Fragment(cursor.parent.getEnd(L), cursor[L]);
    } else {
      fragRemoved = new Fragment(cursor[R], cursor.parent.getEnd(R));
    }
    cursor.controller.aria.queue(fragRemoved);
    fragRemoved.remove();
    cursor.insAtDirEnd(dir, cursor.parent);
    var cursorL = cursor[L];
    var cursorR = cursor[R];
    if (cursorL) cursorL.siblingDeleted(cursor.options, R);
    if (cursorR) cursorR.siblingDeleted(cursor.options, L);
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
  startIncrementalSelection() {
    pray(
      "Multiple selections can't be simultaneously open",
      !INCREMENTAL_SELECTION_OPEN
    );
    INCREMENTAL_SELECTION_OPEN = true;
    this.notify('select');
    var cursor = this.cursor;
    if (!cursor.anticursor) cursor.startSelection();
  }
  selectDirIncremental(dir) {
    pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
    INCREMENTAL_SELECTION_OPEN = true;
    var cursor = this.cursor,
      seln = cursor.selection;
    prayDirection(dir);
    var node = cursor[dir];
    if (node) {
      if (
        seln &&
        seln.getEnd(dir) === node &&
        cursor.anticursor[-dir] !== node
      ) {
        node.unselectInto(dir, cursor);
      } else node.selectTowards(dir, cursor);
    } else cursor.parent.selectOutOf(dir, cursor);
  }
  finishIncrementalSelection() {
    pray('A selection is open', INCREMENTAL_SELECTION_OPEN);
    var cursor = this.cursor;
    cursor.clearSelection();
    cursor.select() || cursor.show();
    var selection = cursor.selection;
    if (selection) {
      cursor.controller.aria
        .clear()
        .queue(selection.join('mathspeak', ' ').trim() + ' selected');
    }
    INCREMENTAL_SELECTION_OPEN = false;
  }
  withIncrementalSelection(cb) {
    try {
      this.startIncrementalSelection();
      try {
        cb((dir) => this.selectDirIncremental(dir));
      } finally {
        this.finishIncrementalSelection();
      }
    } finally {
      INCREMENTAL_SELECTION_OPEN = false;
    }
  }
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
    var cursor = this.cursor;
    cursor.insAtRightEnd(this.root);
    this.withIncrementalSelection((selectDir) => {
      while (cursor[L]) selectDir(L);
    });
  }
  selectToBlockEndInDir(dir) {
    var cursor = this.cursor;
    this.withIncrementalSelection((selectDir) => {
      while (cursor[dir]) selectDir(dir);
    });
  }
  selectToRootEndInDir(dir) {
    var cursor = this.cursor;
    this.withIncrementalSelection((selectDir) => {
      while (cursor[dir] || cursor.parent !== this.root) {
        selectDir(dir);
      }
    });
  }
}
