import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
} from "../Types";
import { runForEachEditor } from "../targetUtils";
import update from "immutability-helper";
import displayPendingEditDecorations from "../editDisplayUtils";
import { computeChangedOffsets } from "../computeChangedOffsets";
import { flatten, zip } from "lodash";
import { Selection, TextEditorDecorationType, TextEditor } from "vscode";

interface DecorationTypes {
  sourceStyle: TextEditorDecorationType;
  sourceLineStyle: TextEditorDecorationType;
  destinationStyle: TextEditorDecorationType;
  destinationLineStyle: TextEditorDecorationType;
}

interface Edit {
  editor: TextEditor;
  range: Selection;
  newText: string;
  targetsIndex: number;
  originalSelection: TypedSelection;
}

class Base implements Action {
  targetPreferences: ActionPreferences[] = [
    { insideOutsideType: "inside" },
    { position: "after", insideOutsideType: "outside" },
  ];

  constructor(private graph: Graph, private type: string) {
    this.run = this.run.bind(this);
  }

  private expandSources(
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
    if (this.type === "use") {
      return {
        sourceStyle: this.graph.editStyles.referenced,
        sourceLineStyle: this.graph.editStyles.referencedLine,
        destinationStyle: this.graph.editStyles.pendingModification0,
        destinationLineStyle: this.graph.editStyles.pendingLineModification0,
      };
    }
    return {
      sourceStyle: this.graph.editStyles.pendingModification0,
      sourceLineStyle: this.graph.editStyles.pendingLineModification0,
      destinationStyle: this.graph.editStyles.pendingModification1,
      destinationLineStyle: this.graph.editStyles.pendingLineModification1,
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
  ): Edit[] {
    const usedSources: TypedSelection[] = [];
    return flatten(
      zip(sources, destinations).map(([source, destination]) => {
        if (source == null || destination == null) {
          throw new Error("Targets must have same number of args");
        }

        // Add destination edit
        const result = [
          {
            editor: destination.selection.editor,
            range: destination.selection.selection,
            newText: source.selection.editor.document.getText(
              source.selection.selection
            ),
            targetsIndex: 0,
            originalSelection: destination,
          },
        ];

        // Add source edit for move and swap
        // Prevent multiple instances of the same expanded source.
        if (this.type !== "use" && !usedSources.includes(source)) {
          let newText = ""; // Defaults to delete source/move
          if (this.type === "swap") {
            newText = destination.selection.editor.document.getText(
              destination.selection.selection
            );
          }
          
          usedSources.push(source);
          result.push({
            editor: source.selection.editor,
            range: source.selection.selection,
            newText,
            targetsIndex: 1,
            originalSelection: source,
          });
        }

        return result;
      })
    );
  }

  private async performDocumentEdits(edits: Edit[]) {
    return runForEachEditor(
      edits,
      (edit) => edit.editor,
      async (editor, edits) => {
        await editor.edit((editBuilder) => {
          edits.forEach((edit) => {
            if (edit.range.isEmpty) {
              editBuilder.insert(edit.range.start, edit.newText);
            } else {
              editBuilder.replace(edit.range, edit.newText);
            }
          });
        });
      }
    );
  }

  private async getThatMark(edits: Edit[]) {
    // Only swap has source as a that mark
    if (this.type !== "swap") {
      edits = edits.filter(({ targetsIndex }) => targetsIndex === 0);
    }
    return flatten(
      await runForEachEditor(
        edits,
        (edit) => edit.editor,
        async (editor, edits) => {
          const newEdits = zip(edits, computeChangedOffsets(editor, edits)).map(
            ([originalEdit, changedEdit]) => ({
              targetsIndex: originalEdit!.targetsIndex,
              originalSelection: originalEdit!.originalSelection,
              originalRange: originalEdit!.range,
              newText: originalEdit!.newText,
              newStartOffset: changedEdit!.startOffset,
              newEndOffset: changedEdit!.endOffset,
            })
          );

          return newEdits.map((edit) => {
            const start = editor.document.positionAt(edit.newStartOffset);
            const end = editor.document.positionAt(edit.newEndOffset);

            const isReversed =
              edit.originalSelection.selection.selection.isReversed;

            const selection = new Selection(
              isReversed ? end : start,
              isReversed ? start : end
            );

            return {
              editor,
              targetsIndex: edit.targetsIndex,
              typedSelection: update(edit.originalSelection, {
                selection: {
                  selection: { $set: selection },
                },
              }),
              selection,
            };
          });
        }
      )
    );
  }

  private async decorateThatMark(thatMark: any[]) {
    return Promise.all([
      displayPendingEditDecorations(
        thatMark
          .filter(({ targetsIndex }) => targetsIndex === 0)
          .map(({ typedSelection }) => typedSelection),
        this.graph.editStyles.pendingModification0,
        this.graph.editStyles.pendingLineModification0
      ),
      displayPendingEditDecorations(
        thatMark
          .filter(({ targetsIndex }) => targetsIndex === 1)
          .map(({ typedSelection }) => typedSelection),
        this.graph.editStyles.pendingModification1,
        this.graph.editStyles.pendingLineModification1
      ),
    ]);
  }

  async run([sources, destinations]: [
    TypedSelection[],
    TypedSelection[]
  ]): Promise<ActionReturnValue> {
    sources = this.expandSources(sources, destinations);

    await this.decorateTargets(sources, destinations);

    const edits = this.getEdits(sources, destinations);

    const thatMark = await this.getThatMark(edits);

    await this.performDocumentEdits(edits);

    await this.decorateThatMark(thatMark);

    return { returnValue: null, thatMark };
  }
}

export class Use extends Base {
  constructor(graph: Graph) {
    super(graph, "use");
  }
}

export class Swap extends Base {
  constructor(graph: Graph) {
    super(graph, "swap");
  }
}

export class Move extends Base {
  constructor(graph: Graph) {
    super(graph, "move");
  }
}
