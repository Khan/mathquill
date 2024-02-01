import { Controller_scrollHoriz } from '../bundle';
export declare function defaultSubstituteKeyboardEvents(
  jq: any,
  controller: Controller
): {
  select: (text: string) => void;
};
export declare class Controller extends Controller_scrollHoriz {
  selectFn: (text: string) => void;
  createTextarea(): void;
  selectionChanged(): void;
  setTextareaSelection(): void;
  staticMathTextareaEvents(): void;
  editablesTextareaEvents(): void;
  unbindEditablesEvents(): void;
  typedText(ch: string): void;
  cut(): void;
  copy(): void;
  paste(text: string): void;
  setupStaticField(): void;
  updateMathspeak(): void;
}
//# sourceMappingURL=textarea.d.ts.map
