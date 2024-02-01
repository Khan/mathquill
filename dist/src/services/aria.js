import { L, MQNode, domFrag, h, prayDirection } from '../bundle';
export class Aria {
  constructor(controller) {
    this.span = h('span', {
      class: 'mq-aria-alert',
      'aria-live': 'assertive',
      'aria-atomic': 'true',
    });
    this.msg = '';
    this.items = [];
    this.controller = controller;
  }
  attach() {
    var container = this.controller.container;
    if (this.span.parentNode !== container) {
      domFrag(container).prepend(domFrag(this.span));
    }
  }
  queue(item, shouldDescribe = false) {
    var output = '';
    if (item instanceof MQNode) {
      var itemMathspeak = item.mathspeak({ ignoreShorthand: true });
      if (shouldDescribe) {
        if (
          item.parent &&
          item.parent.ariaLabel &&
          item.ariaLabel === 'block'
        ) {
          output = item.parent.ariaLabel + ' ' + itemMathspeak;
        } else if (item.ariaLabel) {
          output = item.ariaLabel + ' ' + itemMathspeak;
        }
      }
      if (output === '') {
        output = itemMathspeak;
      }
    } else {
      output = item || '';
    }
    this.items.push(output);
    return this;
  }
  queueDirOf(dir) {
    prayDirection(dir);
    return this.queue(dir === L ? 'before' : 'after');
  }
  queueDirEndOf(dir) {
    prayDirection(dir);
    return this.queue(dir === L ? 'beginning of' : 'end of');
  }
  alert(t) {
    this.attach();
    if (t) this.queue(t);
    if (this.items.length) {
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
  }
  clear() {
    this.items.length = 0;
    return this;
  }
}
