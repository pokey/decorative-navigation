import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
} from "../Types";
import displayPendingEditDecorations from "../editDisplayUtils";
import { env } from "vscode";
import { runForEachEditor } from "../targetUtils";
import { flatten } from "lodash";
import update from "immutability-helper";
import CalculateChanges from "../CalculateChanges";
import performDocumentEdits from "../performDocumentEdits";

export default class Paste implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "inside" }];

  constructor(private graph: Graph) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [TypedSelection[]]): Promise<ActionReturnValue> {
    await displayPendingEditDecorations(
      targets,
      this.graph.editStyles.pendingModification0,
      this.graph.editStyles.pendingLineModification0
    );

    const text = await env.clipboard.readText();

    if (text.length === 0) {
      throw new Error("Can't paste empty clipboard");
    }

    const lines = text.trim().split("\n");

    const getText =
      targets.length === lines.length
        ? // Paste each line on each target
          (index: number) => lines[index]
        : // Paste entire clipboard on each target
          () => text;

    const edits = targets.map((target, index) => ({
      editor: target.selection.editor,
      range: target.selection.selection,
      text: getText(index),
      originalSelection: target,
    }));

    const thatMark = flatten(
      await runForEachEditor(
        edits,
        (edit) => edit.editor,
        async (editor, edits) => {
          const calculateChanges = new CalculateChanges(
            editor,
            [targets.map((target) => target.selection.selection)],
            edits
          );

          await performDocumentEdits(editor, edits);

          const [updatedSelections] = calculateChanges.calculateSelections();

          return edits.map((edit, index) => {
            const selection = updatedSelections[index];
            return {
              editor,
              selection,
              typedSelection: update(edit.originalSelection, {
                selection: {
                  selection: { $set: selection },
                },
              }),
            };
          });
        }
      )
    );

    await displayPendingEditDecorations(
      thatMark.map(({ typedSelection }) => typedSelection),
      this.graph.editStyles.pendingModification0,
      this.graph.editStyles.pendingLineModification0
    );

    return { returnValue: null, thatMark };
  }
}
