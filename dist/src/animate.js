export var animate = (function () {
  var rafShim, cancelShim;
  if (
    typeof requestAnimationFrame === 'function' &&
    typeof cancelAnimationFrame === 'function'
  ) {
    rafShim = requestAnimationFrame;
    cancelShim = cancelAnimationFrame;
  } else {
    rafShim = (cb) => setTimeout(cb, 13);
    cancelShim = clearTimeout;
  }
  return function (duration, cb) {
    var start = Date.now();
    var cancelToken;
    var progress = 0;
    function step() {
      var proposedProgress = (Date.now() - start) / duration;
      if (proposedProgress <= progress) {
        scheduleNext();
      } else {
        progress = proposedProgress;
      }
      cb(progress, scheduleNext, cancel);
    }
    function cancel() {
      if (cancelToken !== undefined) cancelShim(cancelToken);
      cancelToken = undefined;
    }
    function scheduleNext() {
      cancel();
      cancelToken = rafShim(step);
    }
    cb(duration <= 0 ? 1 : 0, scheduleNext, cancel);
  };
})();
