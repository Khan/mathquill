import { Aria, Cursor, L, R, pray } from './bundle';
export class ControllerBase {
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
    this.cursor = root.cursor = new Cursor(
      root,
      options,
      this.getControllerSelf()
    );
  }
  getControllerSelf() {
    return this;
  }
  handle(name, dir) {
    var _a;
    var handlers = this.options.handlers;
    var handler =
      (_a = this.options.handlers) === null || _a === void 0
        ? void 0
        : _a.fns[name];
    if (handler) {
      var APIClass =
        handlers === null || handlers === void 0
          ? void 0
          : handlers.APIClasses[this.KIND_OF_MQ];
      pray('APIClass is defined', APIClass);
      var mq = new APIClass(this);
      if (dir === L || dir === R) handler(dir, mq);
      else handler(mq);
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
    } else if (this.editable) {
      this.ariaLabel = 'Math Input';
    } else {
      this.ariaLabel = '';
    }
    if (this.ariaLabel !== oldAriaLabel && !this.containerHasFocus()) {
      this.updateMathspeak();
    }
    return this;
  }
  getAriaLabel() {
    if (this.ariaLabel !== 'Math Input') {
      return this.ariaLabel;
    } else if (this.editable) {
      return 'Math Input';
    } else {
      return '';
    }
  }
  setAriaPostLabel(ariaPostLabel, timeout) {
    if (
      ariaPostLabel &&
      typeof ariaPostLabel === 'string' &&
      ariaPostLabel !== ''
    ) {
      if (ariaPostLabel !== this.ariaPostLabel && typeof timeout === 'number') {
        if (this._ariaAlertTimeout) clearTimeout(this._ariaAlertTimeout);
        this._ariaAlertTimeout = setTimeout(() => {
          if (this.containerHasFocus()) {
            this.aria.alert(
              this.root.mathspeak().trim() + ' ' + ariaPostLabel.trim()
            );
          } else {
            this.updateMathspeak();
          }
        }, timeout);
      }
      this.ariaPostLabel = ariaPostLabel;
    } else {
      if (this._ariaAlertTimeout) clearTimeout(this._ariaAlertTimeout);
      this.ariaPostLabel = '';
    }
    return this;
  }
  getAriaPostLabel() {
    return this.ariaPostLabel || '';
  }
  containerHasFocus() {
    return (
      document.activeElement && this.container.contains(document.activeElement)
    );
  }
  getTextareaOrThrow() {
    var textarea = this.textarea;
    if (!textarea) throw new Error('expected a textarea');
    return textarea;
  }
  getTextareaSpanOrThrow() {
    var textareaSpan = this.textareaSpan;
    if (!textareaSpan) throw new Error('expected a textareaSpan');
    return textareaSpan;
  }
  addTextareaEventListeners(listeners) {
    if (!this.textarea) return;
    for (var key in listeners) {
      var event = key;
      this.removeTextareaEventListener(event);
      this.textarea.addEventListener(event, listeners[event]);
    }
  }
  removeTextareaEventListener(event) {
    if (!this.textarea) return;
    var listener = this.textareaEventListeners[event];
    if (!listener) return;
    this.textarea.removeEventListener(event, listener);
  }
  exportMathSpeak() {
    return this.root.mathspeak();
  }
  updateMathspeak() {}
  scrollHoriz() {}
  selectionChanged() {}
  setOverflowClasses() {}
}
ControllerBase.notifyees = [];
