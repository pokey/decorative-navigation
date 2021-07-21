import { commands, window } from "vscode";
import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
  SelectionWithEditor,
} from "./Types";
import displayPendingEditDecorations from "./editDisplayUtils";
import { runOnTargetsForEachEditor } from "./targetUtils";
import { focusEditor } from "./setSelectionsAndFocusEditor";
import { flatten } from "lodash";
import { listenForDocumentChanges } from "./CalculateChanges";

export default class CommandAction implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "inside" }];

  constructor(
    private graph: Graph,
    private command: string,
    private noEdit = false
  ) {
    this.run = this.run.bind(this);
  }

  private async runWithEdit(targets: TypedSelection[]) {
    return flatten(
      await runOnTargetsForEachEditor<SelectionWithEditor[]>(
        targets,
        async (editor, targets) => {
          // For command to the work we have to have the correct editor focused
          if (editor !== window.activeTextEditor) {
            await focusEditor(editor);
          }

          const originalSelections = editor.selections;

          const targetSelections = targets.map(
            (target) => target.selection.selection
          );

          editor.selections = targetSelections;

          const promise = listenForDocumentChanges(editor, [
            originalSelections,
            targetSelections,
          ]);

          await commands.executeCommand(this.command);

          const [updatedOriginalSelections, updatedTargetSelections] =
            await promise;

          // Reset original selections
          editor.selections = updatedOriginalSelections;

          return updatedTargetSelections.map((selection) => ({
            editor,
            selection,
          }));
        }
      )
    );
  }

  private async runNoEdit(targets: TypedSelection[]) {
    await runOnTargetsForEachEditor(targets, async (editor, targets) => {
      // For command to the work we have to have the correct editor focused
      if (editor !== window.activeTextEditor) {
        await focusEditor(editor);
      }

      const originalSelections = editor.selections;

      editor.selections = targets.map((target) => target.selection.selection);

      await commands.executeCommand(this.command);

      // Reset original selections
      editor.selections = originalSelections;
    });

    return targets.map((target) => target.selection);
  }

  async run([targets]: [
    TypedSelection[],
    TypedSelection[]
  ]): Promise<ActionReturnValue> {
    await displayPendingEditDecorations(
      targets,
      this.graph.editStyles.referenced,
      this.graph.editStyles.referencedLine
    );

    const originalEditor = window.activeTextEditor;

    const thatMark = this.noEdit
      ? await this.runNoEdit(targets)
      : await this.runWithEdit(targets);

    // If necessary focus back original editor
    if (originalEditor != null && originalEditor !== window.activeTextEditor) {
      await focusEditor(originalEditor);
    }

    return { returnValue: null, thatMark };
  }
}
