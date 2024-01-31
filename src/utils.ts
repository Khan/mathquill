// L = 'left'
// R = 'right'
//
// the contract is that they can be used as object properties

import { NodeRef } from './shared_types';

// and (-L) === R, and (-R) === L.
type L = -1;
type R = 1;
export const L: L = -1;
export const R: R = 1;
export type Direction = L | R;

export const min = Math.min;
export const max = Math.max;

export function noop() {}

function walkUpAsFarAsPossible(node: NodeRef | undefined) {
  while (node) {
    if (!node.parent) {
      return node;
    }
    node = node.parent;
  }
  return undefined;
}

/**
 * a development-only debug method.  This definition and all
 * calls to `pray` will be stripped from the minified
 * build of mathquill.
 *
 * This function must be called by name to be removed
 * at compile time.  Do not define another function
 * with the same name, and only call this function by
 * name.
 */
export function pray(
  message: string,
  cond?: unknown,
  optionalContextNodes?: Record<string, NodeRef>
): asserts cond {
  if (!cond) {
    const error = new Error('prayer failed: ' + message);

    // optionally add more context to this prayer failure. We will
    // trace up as far as possible to get all latex we can find as well
    // as output the latex down at the direct parent of the prayer failure
    if (optionalContextNodes) {
      const jsonData: any = {};

      // this data is attached to the error. The app that controls the mathquill
      // can optionally pull it off when it catches the error and send the extra
      // info with the error.
      (error as any).dcgExtraErrorMetaData = jsonData;

      for (const contextName in optionalContextNodes) {
        const localNode = optionalContextNodes[contextName];
        const data: any = (jsonData[contextName] = {});

        if (localNode) {
          data.localLatex = localNode.latex();
          const root = walkUpAsFarAsPossible(localNode);
          if (root) {
            data.rootLatex = root.latex();
          }
        } else {
          data.emptyNode = true;
        }
      }
    }

    throw error;
  }
}

export function prayDirection(dir: Direction) {
  pray('a direction was passed', dir === L || dir === R);
}
