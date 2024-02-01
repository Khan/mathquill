import { Controller_exportText } from '../bundle';
export declare class Controller_focusBlur extends Controller_exportText {
  blurred: boolean;
  __disableGroupingTimeout: number;
  textareaSelectionTimeout: number;
  disableGroupingForSeconds(seconds: number): void;
  blurTimeout: number;
  handleTextareaFocusEditable: () => void;
  handleTextareaBlurEditable: () => void;
  handleTextareaFocusStatic: () => void;
  handleTextareaBlurStatic: () => void;
  handleWindowBlur: () => void;
  blur(): void;
  addEditableFocusBlurListeners(): void;
  addStaticFocusBlurListeners(): void;
}
//# sourceMappingURL=focusBlur.d.ts.map
