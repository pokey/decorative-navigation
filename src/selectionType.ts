import { SelectionType } from "./Types";

export function isLineSelectionType(selectionType: SelectionType) {
  return selectionType === "line" || selectionType === "paragraph";
}
