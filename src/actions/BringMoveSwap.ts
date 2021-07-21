import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
  Edit,
} from "../Types";
import { runForEachEditor } from "../targetUtils";
import update from "immutability-helper";
import displayPendingEditDecorations from "../editDisplayUtils";
import { performInsideOutsideAdjustment } from "../performInsideOutsideAdjustment";
import { flatten, zip } from "lodash";
import { Selection, TextEditorDecorationType, TextEditor, Range } from "vscode";
import performDocumentEdits from "../performDocumentEdits";
import CalculateChanges from "../CalculateChanges";

interface DecorationTypes {
  sourceStyle: TextEditorDecorationType;
  sourceLineStyle: TextEditorDecorationType;
  destinationStyle: TextEditorDecorationType;
  destinationLineStyle: TextEditorDecorationType;
}

interface ExtendedEdit extends Edit {
  editor: TextEditor;
  isSource: boolean;
  originalSelection: TypedSelection;
}

interface ThatMarkEntry {
  editor: TextEditor;
  selection: Selection;
  isSource: boolean;
  typedSelection: TypedSelection;
}

class BringMoveSwap implements Action {
  targetPreferences: ActionPreferences[] = [
    { insideOutsideType: null },
    { insideOutsideType: "inside" },
  ];

  constructor(private graph: Graph, private type: string) {
    this.run = this.run.bind(this);
  }

  private broadcastSource(
    sources: TypedSelection[],
    destinations: TypedSelection[]
  ) {
    if (sources.length === 1 && this.type !== "swap") {
      // If there is only one source target, expand it to same length as
      // destination target
      return Array(destinations.length).fill(sources[0]);
    }
    return sources;
  }

  private getDecorationStyles(): DecorationTypes {
    let sourceStyle, sourceLineStyle;
    if (this.type === "bring") {
      sourceStyle = this.graph.editStyles.referenced;
      sourceLineStyle = this.graph.editStyles.referencedLine;
    } else if (this.type === "swap") {
      sourceStyle = this.graph.editStyles.pendingModification1;
      sourceLineStyle = this.graph.editStyles.pendingLineModification1;
    } else if (this.type === "move") {
      sourceStyle = this.graph.editStyles.pendingDelete;
      sourceLineStyle = this.graph.editStyles.pendingLineDelete;
    } else {
      throw Error(`Unknown type "${this.type}"`);
    }
    return {
      sourceStyle,
      sourceLineStyle,
      destinationStyle: this.graph.editStyles.pendingModification0,
      destinationLineStyle: this.graph.editStyles.pendingLineModification0,
    };
  }

  private async decorateTargets(
    sources: TypedSelection[],
    destinations: TypedSelection[]
  ) {
    const decorationTypes = this.getDecorationStyles();
    await Promise.all([
      displayPendingEditDecorations(
        sources,
        decorationTypes.sourceStyle,
        decorationTypes.sourceLineStyle
      ),
      displayPendingEditDecorations(
        destinations,
        decorationTypes.destinationStyle,
        decorationTypes.destinationLineStyle
      ),
    ]);
  }

  private getEdits(
    sources: TypedSelection[],
    destinations: TypedSelection[]
  ): ExtendedEdit[] {
    const usedSources: TypedSelection[] = [];
    return zip(sources, destinations).flatMap(([source, destination]) => {
      if (source == null || destination == null) {
        throw new Error("Targets must have same number of args");
      }

      const sourceText = source.selection.editor.document.getText(
        source.selection.selection
      );

      const { containingListDelimiter } = destination.selectionContext;
      const newText =
        containingListDelimiter == null || destination.position === "contents"
          ? sourceText
          : destination.position === "after"
          ? containingListDelimiter + sourceText
          : sourceText + containingListDelimiter;

      // Add destination edit
      const result = [
        {
          isSource: false,
          editor: destination.selection.editor,
          originalSelection: destination,
          range: destination.selection.selection as Range,
          text: newText,
        },
      ];

      // Add source edit for move and swap
      // Prevent multiple instances of the same expanded source.
      if (this.type !== "bring" && !usedSources.includes(source)) {
        let newText: string;
        let range: Range;

        if (this.type === "swap") {
          newText = destination.selection.editor.document.getText(
            destination.selection.selection
          );
          range = source.selection.selection;
        } else {
          // NB: this.type === "move"
          newText = "";
          range = performInsideOutsideAdjustment(source, "outside").selection
            .selection;
        }

        usedSources.push(source);
        result.push({
          isSource: true,
          editor: source.selection.editor,
          originalSelection: source,
          range,
          text: newText,
        });
      }

      return result;
    });
  }

  private async performEditsAndComputeThatMark(
    edits: ExtendedEdit[]
  ): Promise<ThatMarkEntry[]> {
    return flatten(
      await runForEachEditor(
        edits,
        (edit) => edit.editor,
        async (editor, edits) => {
          const calculateChanges = new CalculateChanges(
            editor,
            [edits.map(
                (edit) => edit.originalSelection.selection.selection
              )],
            edits
          );

          await performDocumentEdits(editor, edits);

          const [updatedSelections] = calculateChanges.calculateSelections();

          // Only swap has source as a "that" mark
          if (this.type !== "swap") {
            edits = edits.filter((edit) => !edit.isSource);
          }

          return edits.map((edit, index) => {
            const selection = updatedSelections[index];
            return {
              editor,
              selection,
              isSource: edit.isSource,
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
  }

  private async decorateThatMark(thatMark: ThatMarkEntry[]) {
    const decorationTypes = this.getDecorationStyles();
    return Promise.all([
      displayPendingEditDecorations(
        thatMark
          .filter(({ isSource }) => isSource)
          .map(({ typedSelection }) => typedSelection),
        decorationTypes.sourceStyle,
        decorationTypes.sourceLineStyle
      ),
      displayPendingEditDecorations(
        thatMark
          .filter(({ isSource }) => !isSource)
          .map(({ typedSelection }) => typedSelection),
        decorationTypes.destinationStyle,
        decorationTypes.destinationLineStyle
      ),
    ]);
  }

  async run([sources, destinations]: [
    TypedSelection[],
    TypedSelection[]
  ]): Promise<ActionReturnValue> {
    sources = this.broadcastSource(sources, destinations);

    await this.decorateTargets(sources, destinations);

    const edits = this.getEdits(sources, destinations);

    const thatMark = await this.performEditsAndComputeThatMark(edits);

    await this.decorateThatMark(thatMark);

    return { returnValue: null, thatMark };
  }
}

export class Bring extends BringMoveSwap {
  constructor(graph: Graph) {
    super(graph, "bring");
  }
}

export class Move extends BringMoveSwap {
  constructor(graph: Graph) {
    super(graph, "move");
  }
}

export class Swap extends BringMoveSwap {
  constructor(graph: Graph) {
    super(graph, "swap");
  }
}
