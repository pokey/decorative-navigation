import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
} from "../Types";
import { TextEditor, Selection, Position } from "vscode";
import displayPendingEditDecorations from "../editDisplayUtils";
import { runForEachEditor } from "../targetUtils";

class InsertEmptyLines implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "inside" }];

  constructor(
    private graph: Graph,
    private insertAbove: boolean,
    private insertBelow: boolean
  ) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [TypedSelection[]]): Promise<ActionReturnValue> {
    displayPendingEditDecorations(
      targets,
      this.graph.editStyles.referenced,
      this.graph.editStyles.referencedLine
    );

    const edits = await runForEachEditor(
      targets,
      (target) => target.selection.editor,
      async (editor: TextEditor, targets: TypedSelection[]) => {
        const lines = targets.flatMap((target) => {
          const lines = [];
          if (this.insertAbove) {
            lines.push(target.selection.selection.start.line);
          }
          if (this.insertBelow) {
            lines.push(target.selection.selection.end.line + 1);
          }
          return lines;
        });
        return { editor, lines };
      }
    );

    for (const edit of edits) {
      await edit.editor.edit((editBuilder) => {
        edit.lines.forEach((line) => {
          editBuilder.insert(new Position(line, 0), "\n");
        });
      });
    }

    const thatMark = targets.map((target) => {
      const lines = edits.find(
        (edit) => edit.editor === target.selection.editor
      )!.lines;
      const selection = target.selection.selection;
      const offsetAnchor = lines.filter(
        (line) => line <= selection.anchor.line
      ).length;
      const offsetActive = lines.filter(
        (line) => line <= selection.active.line
      ).length;
      const newSelection = new Selection(
        selection.anchor.line + offsetAnchor,
        selection.anchor.character,
        selection.active.line + offsetActive,
        selection.active.character
      );
      return {
        selection: newSelection,
        editor: target.selection.editor,
      };
    });

    return {
      returnValue: null,
      thatMark,
    };
  }
}

export class InsertEmptyLinesAround extends InsertEmptyLines {
  constructor(graph: Graph) {
    super(graph, true, true);
  }
}

export class InsertEmptyLineAbove extends InsertEmptyLines {
  constructor(graph: Graph) {
    super(graph, true, false);
  }
}

export class InsertEmptyLineBelow extends InsertEmptyLines {
  constructor(graph: Graph) {
    super(graph, false, true);
  }
}
