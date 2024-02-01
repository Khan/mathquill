/***********************************************
 * Horizontal panning for editable fields that
 * overflow their width
 **********************************************/

import {
  Controller_mouse,
  L,
  R,
  animate,
  getBoundingClientRect,
} from '../bundle';

export class Controller_scrollHoriz extends Controller_mouse {
  cancelScrollHoriz: (() => void) | undefined;
  setOverflowClasses() {
    var root = this.root.domFrag().oneElement();
    var shouldHaveOverflowRight = false;
    var shouldHaveOverflowLeft = false;
    if (!this.blurred) {
      var width = getBoundingClientRect(root).width;
      var scrollWidth = root.scrollWidth;
      var scroll = root.scrollLeft;
      shouldHaveOverflowRight = scrollWidth > width + scroll;
      shouldHaveOverflowLeft = scroll > 0;
    }
    if (
      root.classList.contains('mq-editing-overflow-right') !==
      shouldHaveOverflowRight
    )
      root.classList.toggle('mq-editing-overflow-right');
    if (
      root.classList.contains('mq-editing-overflow-left') !==
      shouldHaveOverflowLeft
    )
      root.classList.toggle('mq-editing-overflow-left');
  }
  scrollHoriz() {
    var cursor = this.cursor,
      seln = cursor.selection;
    var scrollBy = 0;
    var rootRect = getBoundingClientRect(this.root.domFrag().oneElement());
    if (cursor.domFrag().isEmpty() && !seln) {
      if (this.cancelScrollHoriz) {
        this.cancelScrollHoriz();
        this.cancelScrollHoriz = undefined;
      }

      var rootElt = this.root.domFrag().oneElement();
      var start = rootElt.scrollLeft;
      animate(
        this.getScrollAnimationDuration(),
        (progress, scheduleNext, cancel) => {
          if (progress >= 1) {
            this.cancelScrollHoriz = undefined;
            rootElt.scrollLeft = 0;
            this.setOverflowClasses();
          } else {
            this.cancelScrollHoriz = cancel;
            scheduleNext();
            rootElt.scrollLeft = Math.round((1 - progress) * start);
          }
        }
      );

      return;
    } else if (!seln) {
      var x = getBoundingClientRect(cursor.domFrag().oneElement()).left;
      if (x > rootRect.right - 20) scrollBy = x - (rootRect.right - 20);
      else if (x < rootRect.left + 20) scrollBy = x - (rootRect.left + 20);
      else return;
    } else {
      var rect = getBoundingClientRect(seln.domFrag().oneElement());
      var overLeft = rect.left - (rootRect.left + 20);
      var overRight = rect.right - (rootRect.right - 20);
      if (seln.getEnd(L) === cursor[R]) {
        if (overLeft < 0) scrollBy = overLeft;
        else if (overRight > 0) {
          if (rect.left - overRight < rootRect.left + 20) scrollBy = overLeft;
          else scrollBy = overRight;
        } else return;
      } else {
        if (overRight > 0) scrollBy = overRight;
        else if (overLeft < 0) {
          if (rect.right - overLeft > rootRect.right - 20) scrollBy = overRight;
          else scrollBy = overLeft;
        } else return;
      }
    }

    var root = this.root.domFrag().oneElement();
    if (scrollBy < 0 && root.scrollLeft === 0) return;
    if (scrollBy > 0 && root.scrollWidth <= root.scrollLeft + rootRect.width)
      return;

    if (this.cancelScrollHoriz) {
      this.cancelScrollHoriz();
      this.cancelScrollHoriz = undefined;
    }

    var rootElt = this.root.domFrag().oneElement();
    var start = rootElt.scrollLeft;
    animate(
      this.getScrollAnimationDuration(),
      (progress, scheduleNext, cancel) => {
        if (progress >= 1) {
          this.cancelScrollHoriz = undefined;
          rootElt.scrollLeft = Math.round(start + scrollBy);
          this.setOverflowClasses();
        } else {
          this.cancelScrollHoriz = cancel;
          scheduleNext();
          rootElt.scrollLeft = Math.round(start + progress * scrollBy);
        }
      }
    );
  }

  getScrollAnimationDuration() {
    return this.options.scrollAnimationDuration ?? 100;
  }
}
