import { SelectionWithEditor } from "./Types";

export class ThatMark {
  private mark: SelectionWithEditor[] = [];

  set(value: SelectionWithEditor[]) {
    this.mark = value;
  }

  get() {
    return this.mark;
  }
}
