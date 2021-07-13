import { Edit } from "./types";
import { TextEditor } from "vscode";

export default async function performDocumentEdits(
  editor: TextEditor,
  edits: Edit[]
) {
  return editor.edit((editBuilder) => {
    edits.forEach((edit) => {
      if (edit.newText === "") {
        editBuilder.delete(edit.range);
      } else if (edit.range.isEmpty) {
        editBuilder.insert(edit.range.start, edit.newText);
      } else {
        editBuilder.replace(edit.range, edit.newText);
      }
    });
  });
}
