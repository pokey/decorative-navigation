import { Edit } from "./types";
import { TextEditor } from "vscode";
import { performInsideOutsideAdjustment } from "./performInsideOutsideAdjustment";

export default async function performDocumentEdits(
  editor: TextEditor,
  edits: Edit[]
) {
  return editor.edit((editBuilder) => {
    edits.forEach((edit) => {
      if (edit.newText === "") {
        const selection = performInsideOutsideAdjustment(
          edit.originalSelection,
          "outside"
        );
        editBuilder.delete(selection.selection.selection);
      } else if (edit.range.isEmpty) {
        editBuilder.insert(edit.range.start, edit.newText);
      } else {
        editBuilder.replace(edit.range, edit.newText);
      }
    });
  });
}
