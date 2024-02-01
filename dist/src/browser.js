export function getBoundingClientRect(el) {
  if (!el.getClientRects().length) {
    return {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      x: 0,
      y: 0,
      bottom: 0,
      right: 0,
    };
  }
  return el.getBoundingClientRect();
}
export function getScrollX() {
  return window.pageXOffset !== undefined
    ? window.pageXOffset
    : (document.documentElement || document.body.parentNode || document.body)
        .scrollLeft;
}
export function getScrollY() {
  return window.pageYOffset !== undefined
    ? window.pageYOffset
    : (document.documentElement || document.body.parentNode || document.body)
        .scrollTop;
}
