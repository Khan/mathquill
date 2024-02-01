import {
  ControllerBase,
  Controller_latex,
  NodeBase,
  Options,
  closest,
  domFrag,
  noop,
} from '../bundle';
var ignoreNextMouseDownNoop = (_el) => {
  return false;
};
Options.prototype.ignoreNextMousedown = ignoreNextMouseDownNoop;
var cancelSelectionOnEdit;
(function () {
  ControllerBase.onNotify(function (cursor, e) {
    if (e === 'edit' || e === 'replace') {
      if (cancelSelectionOnEdit && cancelSelectionOnEdit.cursor === cursor) {
        cancelSelectionOnEdit.cb();
      }
    }
  });
})();
export class Controller_mouse extends Controller_latex {
  constructor() {
    super(...arguments);
    this.handleMouseDown = (e) => {
      var rootElement = closest(e.target, '.mq-root-block');
      var root =
        (rootElement && NodeBase.getNodeOfElement(rootElement)) ||
        NodeBase.getNodeOfElement(this.root.domFrag().oneElement());
      var ownerDocument = root.domFrag().firstNode().ownerDocument;
      var ctrlr = root.controller,
        cursor = ctrlr.cursor,
        blink = cursor.blink;
      var textareaSpan = ctrlr.getTextareaSpanOrThrow();
      var textarea = ctrlr.getTextareaOrThrow();
      e.preventDefault();
      e.target.unselectable = true;
      if (cursor.options.ignoreNextMousedown(e)) return;
      if (closest(e.target, '.mq-ignore-mousedown')) {
        return;
      }
      if (e.detail === 3) {
        ctrlr.selectAll();
        return;
      }
      var lastMousemoveTarget = null;
      function mousemove(e) {
        lastMousemoveTarget = e.target;
      }
      function onDocumentMouseMove(e) {
        if (!cursor.anticursor) cursor.startSelection();
        ctrlr.seek(lastMousemoveTarget, e.clientX, e.clientY).cursor.select();
        if (cursor.selection)
          cursor.controller.aria
            .clear()
            .queue(cursor.selection.join('mathspeak') + ' selected')
            .alert();
        lastMousemoveTarget = null;
      }
      function unbindListeners() {
        rootElement === null || rootElement === void 0
          ? void 0
          : rootElement.removeEventListener('mousemove', mousemove);
        ownerDocument === null || ownerDocument === void 0
          ? void 0
          : ownerDocument.removeEventListener('mousemove', onDocumentMouseMove);
        ownerDocument === null || ownerDocument === void 0
          ? void 0
          : ownerDocument.removeEventListener('mouseup', onDocumentMouseUp);
        cancelSelectionOnEdit = undefined;
      }
      function updateCursor() {
        if (ctrlr.editable) {
          cursor.show();
          cursor.controller.aria.queue(cursor.parent).alert();
        } else {
          domFrag(textareaSpan).detach();
        }
      }
      function onDocumentMouseUp() {
        cursor.blink = blink;
        if (!cursor.selection) updateCursor();
        unbindListeners();
      }
      var wasEdited;
      cancelSelectionOnEdit = {
        cursor: cursor,
        cb: function () {
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
        if (wasEdited) return;
      }
      cursor.blink = noop;
      ctrlr.seek(e.target, e.clientX, e.clientY).cursor.startSelection();
      rootElement === null || rootElement === void 0
        ? void 0
        : rootElement.addEventListener('mousemove', mousemove);
      ownerDocument === null || ownerDocument === void 0
        ? void 0
        : ownerDocument.addEventListener('mousemove', onDocumentMouseMove);
      ownerDocument === null || ownerDocument === void 0
        ? void 0
        : ownerDocument.addEventListener('mouseup', onDocumentMouseUp);
    };
  }
  addMouseEventListener() {
    this.container.addEventListener('mousedown', this.handleMouseDown);
  }
  removeMouseEventListener() {
    this.container.removeEventListener('mousedown', this.handleMouseDown);
  }
  seek(targetElm, clientX, _clientY) {
    var cursor = this.notify('select').cursor;
    var node;
    while (targetElm) {
      node = NodeBase.getNodeOfElement(targetElm);
      if (node) break;
      targetElm = targetElm.parentElement;
    }
    if (!node) {
      node = this.root;
    }
    cursor.clearSelection().show();
    node.seek(clientX, cursor);
    this.scrollHoriz();
    return this;
  }
}
