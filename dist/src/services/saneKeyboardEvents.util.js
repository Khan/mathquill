import { noop } from '../bundle';
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
export var saneKeyboardEvents = (function () {
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
    var _a;
    if (evt.key === undefined) {
      var which = evt.which || evt.keyCode;
      return WHICH_TO_MQ_KEY_STEM[which] || String.fromCharCode(which);
    }
    if (isLowercaseAlphaCharacter(evt.key)) return evt.key.toUpperCase();
    return (_a = KEY_TO_MQ_KEY_STEM[evt.key]) !== null && _a !== void 0
      ? _a
      : evt.key;
  }
  function getMQKeyName(evt) {
    var key = getMQKeyStem(evt);
    var modifiers = [];
    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');
    if (!modifiers.length) return key;
    if (key !== 'Alt' && key !== 'Control' && key !== 'Meta' && key !== 'Shift')
      modifiers.push(key);
    return modifiers.join('-');
  }
  return function saneKeyboardEvents(textarea, controller) {
    var keydown = null;
    var keypress = null;
    var everyTick = new EveryTick();
    function guardedTextareaSelect() {
      try {
        if (textarea instanceof HTMLTextAreaElement) textarea.select();
      } catch (e) {}
    }
    function select(text) {
      everyTick.trigger();
      everyTick.clearListener();
      if (textarea instanceof HTMLTextAreaElement) textarea.value = text;
      if (text) guardedTextareaSelect();
      shouldBeSelected = !!text;
    }
    var shouldBeSelected = false;
    function hasSelection() {
      if (!('selectionStart' in textarea)) return false;
      if (!(textarea instanceof HTMLTextAreaElement)) return false;
      return textarea.selectionStart !== textarea.selectionEnd;
    }
    function handleKey() {
      if (controller.options && controller.options.overrideKeystroke) {
        controller.options.overrideKeystroke(getMQKeyName(keydown), keydown);
      } else {
        controller.keystroke(getMQKeyName(keydown), keydown);
      }
    }
    function onKeydown(e) {
      everyTick.trigger(e);
      if (e.target !== textarea) return;
      keydown = e;
      keypress = null;
      if (shouldBeSelected)
        everyTick.listenOnce(function (e) {
          if (!(e && e.type === 'focusout')) {
            guardedTextareaSelect();
          }
        });
      handleKey();
    }
    function onKeypress(e) {
      everyTick.trigger(e);
      if (e.target !== textarea) return;
      if (keydown && keypress) handleKey();
      keypress = e;
      if (!isArrowKey(e)) {
        everyTick.listen(typedText);
      } else {
        everyTick.listenOnce(maybeReselect);
      }
    }
    function onKeyup(e) {
      everyTick.trigger(e);
      if (e.target !== textarea) return;
      if (!!keydown && !keypress) {
        if (!isArrowKey(e)) {
          everyTick.listen(typedText);
        } else {
          everyTick.listenOnce(maybeReselect);
        }
      }
    }
    function typedText() {
      if (hasSelection()) return;
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      var text = textarea.value;
      if (
        keydown &&
        !keydown.altKey &&
        keydown.ctrlKey &&
        !keydown.metaKey &&
        keydown.shiftKey &&
        (keydown.key === 'U' ||
          keydown.key === 'Unidentified' ||
          keydown.key === 'Process')
      )
        return;
      if (text.length === 1) {
        textarea.value = '';
        if (controller.options && controller.options.overrideTypedText) {
          controller.options.overrideTypedText(text);
        } else {
          controller.typedText(text);
        }
      } else maybeReselect();
    }
    function maybeReselect() {
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      if (textarea.value.length > 1) {
        guardedTextareaSelect();
      }
    }
    function onBlur() {
      keydown = null;
      keypress = null;
      everyTick.clearListener();
      if (textarea instanceof HTMLTextAreaElement) textarea.value = '';
    }
    function onPaste(e) {
      everyTick.trigger();
      if (e.target !== textarea) return;
      if (document.activeElement !== textarea) {
        textarea.focus();
      }
      everyTick.listen(function pastedText() {
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        var text = textarea.value;
        textarea.value = '';
        if (text) controller.paste(text);
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
    } else {
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
    return { select };
  };
})();
