import { Edit } from "./Types";
import { TextEditor } from "vscode";

export default async function performDocumentEdits(
  editor: TextEditor,
  edits: Edit[]
) {
  return editor.edit((editBuilder) => {
    edits.forEach(({ range, text }) => {
      if (text === "") {
        editBuilder.delete(range);
      } else if (range.isEmpty) {
        editBuilder.insert(range.start, text);
      } else {
        editBuilder.replace(range, text);
      }
    });
  });
}
