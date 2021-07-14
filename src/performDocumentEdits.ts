import { Edit } from "./types";
import { TextEditor } from "vscode";

export default async function performDocumentEdits(
  editor: TextEditor,
  edits: Edit[]
) {
  return editor.edit((editBuilder) => {
    edits.forEach(({ range, newText }) => {
      if (newText === "") {
        editBuilder.delete(range);
      } else if (range.isEmpty) {
        editBuilder.insert(range.start, newText);
      } else {
        editBuilder.replace(range, newText);
      }
    });
  });
}
