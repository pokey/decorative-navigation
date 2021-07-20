import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
} from "../Types";
import { commands } from "vscode";

export class EditNewLineAbove implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "outside" }];

  constructor(private graph: Graph) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [TypedSelection[]]): Promise<ActionReturnValue> {
    await this.graph.actions.setSelectionBefore.run([targets]);
    await commands.executeCommand("editor.action.insertLineBefore");

    return {
      returnValue: null,
      thatMark: targets.map((target) => ({
        selection: target.selection.editor.selection,
        editor: target.selection.editor,
      })),
    };
  }
}

export class EditNewLineBelow implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "outside" }];

  constructor(private graph: Graph) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [TypedSelection[]]): Promise<ActionReturnValue> {
    await this.graph.actions.setSelectionAfter.run([targets]);
    await commands.executeCommand("editor.action.insertLineAfter");

    return {
      returnValue: null,
      thatMark: targets.map((target) => ({
        selection: target.selection.editor.selection,
        editor: target.selection.editor,
      })),
    };
  }
}
