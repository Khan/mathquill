import { ControllerBase } from '../bundle';
export class Controller_exportText extends ControllerBase {
  exportText() {
    return this.root.foldChildren('', function (text, child) {
      return text + child.text();
    });
  }
}
