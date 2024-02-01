export var L = -1;
export var R = 1;
export var min = Math.min;
export var max = Math.max;
export function noop() {}
function walkUpAsFarAsPossible(node) {
  while (node) {
    if (!node.parent) {
      return node;
    }
    node = node.parent;
  }
  return undefined;
}
export function pray(message, cond, optionalContextNodes) {
  if (!cond) {
    var error = new Error('prayer failed: ' + message);
    if (optionalContextNodes) {
      var jsonData = {};
      error.dcgExtraErrorMetaData = jsonData;
      for (var contextName in optionalContextNodes) {
        var localNode = optionalContextNodes[contextName];
        var data = (jsonData[contextName] = {});
        if (localNode) {
          data.localLatex = localNode.latex();
          var root = walkUpAsFarAsPossible(localNode);
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
export function prayDirection(dir) {
  pray('a direction was passed', dir === L || dir === R);
}
