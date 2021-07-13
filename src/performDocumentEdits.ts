import { Edit } from "./types";
import { runForEachEditor } from "./targetUtils";

export default async function performDocumentEdits(edits: Edit[]) {
  return runForEachEditor(
    edits,
    (edit) => edit.editor,
    async (editor, edits) => {
      await editor.edit((editBuilder) => {
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
  );
}
