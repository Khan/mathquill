import { ControllerBase, Controller_exportText, domFrag } from '../bundle';
ControllerBase.onNotify(function (cursor, e) {
  if (e === 'edit' || e === 'replace' || e === undefined) {
    var controller = cursor.controller;
    if (!controller) return;
    if (!controller.options.enableDigitGrouping) return;
    if (controller.blurred !== false) return;
    controller.disableGroupingForSeconds(1);
  }
});
export class Controller_focusBlur extends Controller_exportText {
  constructor() {
    super(...arguments);
    this.handleTextareaFocusEditable = () => {
      var cursor = this.cursor;
      this.updateMathspeak();
      this.blurred = false;
      clearTimeout(this.blurTimeout);
      domFrag(this.container).addClass('mq-focused');
      if (!cursor.parent) cursor.insAtRightEnd(this.root);
      if (cursor.selection) {
        cursor.selection.domFrag().removeClass('mq-blur');
        this.selectionChanged();
      } else {
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
        this.root.postOrder(function (node) {
          node.intentionalBlur();
        });
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
      setTimeout(() => {
        domFrag(this.getTextareaSpanOrThrow()).detach();
        this.blurred = true;
      });
    };
    this.handleWindowBlur = () => {
      clearTimeout(this.blurTimeout);
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
    } else {
      this.root.domFrag().addClass('mq-suppress-grouping');
      this.__disableGroupingTimeout = setTimeout(() => {
        this.root.domFrag().removeClass('mq-suppress-grouping');
      }, seconds * 1000);
    }
  }
  blur() {
    this.cursor.hide().parent.blur(this.cursor);
    domFrag(this.container).removeClass('mq-focused');
    window.removeEventListener('blur', this.handleWindowBlur);
    if (this.options && this.options.resetCursorOnBlur) {
      this.cursor.resetToEnd(this);
    }
  }
  addEditableFocusBlurListeners() {
    var ctrlr = this,
      cursor = ctrlr.cursor;
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
