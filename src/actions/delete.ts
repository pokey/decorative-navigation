import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
} from "../Types";
import { runOnTargetsForEachEditor } from "../targetUtils";
import displayPendingEditDecorations from "../editDisplayUtils";
import { flatten } from "lodash";
import CalculateChanges from "../CalculateChanges";
import performDocumentEdits from "../performDocumentEdits";

export default class Delete implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "outside" }];

  constructor(private graph: Graph) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [TypedSelection[]]): Promise<ActionReturnValue> {
    await displayPendingEditDecorations(
      targets,
      this.graph.editStyles.pendingDelete,
      this.graph.editStyles.pendingLineDelete
    );

    const thatMark = flatten(
      await runOnTargetsForEachEditor(targets, async (editor, targets) => {
        const edits = targets.map((target) => ({
          range: target.selection.selection,
          text: "",
        }));

        const calculateChanges = new CalculateChanges(
          editor,
          [targets.map((target) => target.selection.selection)],
          edits
        );

        await performDocumentEdits(editor, edits);

        const [updatedSelections] = calculateChanges.calculateSelections();

        return updatedSelections.map((selection) => ({
          editor,
          selection,
        }));
      })
    );

    return { returnValue: null, thatMark };
  }
}
