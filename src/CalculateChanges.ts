import {
  Selection,
  Range,
  TextEditor,
  workspace,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
} from "vscode";
import { Edit } from "./Types";

interface MatrixSelection {
  range: Range;
  isReversed: boolean;
  startOffset: number;
  endOffset: number;
}

function selectionsToMatrix(
  document: TextDocument,
  selections: Selection[][]
): MatrixSelection[][] {
  return selections.map((selections) =>
    selections.map((selection) => ({
      range: selection,
      isReversed: selection.isReversed,
      startOffset: document.offsetAt(selection.start),
      endOffset: document.offsetAt(selection.end),
    }))
  );
}

function matrixToSelections(
  document: TextDocument,
  matrixSelections: MatrixSelection[][]
): Selection[][] {
  return matrixSelections.map((matrixSelections) =>
    matrixSelections.map(
      (selection) =>
        new Selection(
          document.positionAt(
            selection.isReversed ? selection.endOffset : selection.startOffset
          ),
          document.positionAt(
            selection.isReversed ? selection.startOffset : selection.endOffset
          )
        )
    )
  );
}

function updateMatrixWithChanges(
  contentChanges: readonly TextDocumentContentChangeEvent[],
  matrixSelections: MatrixSelection[][]
) {
  contentChanges.forEach((change) => {
    const offsetDelta = change.text.length - change.rangeLength;

    matrixSelections.forEach((matrixSelections) => {
      matrixSelections.forEach((selection) => {
        // Change is before selection. Move entire selection.
        if (change.range.start.isBefore(selection.range.start)) {
          selection.startOffset += offsetDelta;
          selection.endOffset += offsetDelta;
        }
        // Change is selection. Move just end to match.
        else if (change.range.isEqual(selection.range)) {
          selection.endOffset += offsetDelta;
        }
      });
    });
  });
}

export default class CalculateChanges {
  document: TextDocument;
  matrix: MatrixSelection[][];
  contentChanges: TextDocumentContentChangeEvent[];

  constructor(editor: TextEditor, selections: Selection[][], edits: Edit[]) {
    this.document = editor.document;
    this.matrix = selectionsToMatrix(this.document, selections);
    this.contentChanges = edits.map((edit) => ({
      range: edit.range,
      text: edit.text,
      rangeOffset: this.document.offsetAt(edit.range.start),
      rangeLength:
        this.document.offsetAt(edit.range.end) -
        this.document.offsetAt(edit.range.start),
    }));
  }

  calculateSelections() {
    updateMatrixWithChanges(this.contentChanges, this.matrix);
    return matrixToSelections(this.document, this.matrix);
  }
}

export function listenForDocumentChanges(
  editor: TextEditor,
  selections: Selection[][]
): Promise<Selection[][]> {
  return new Promise((resolve) => {
    const matrix = selectionsToMatrix(editor.document, selections);

    const disposable = workspace.onDidChangeTextDocument(
      (event: TextDocumentChangeEvent) => {
        if (
          event.document !== editor.document ||
          event.contentChanges.length === 0
        ) {
          return;
        }

        // Only listen for the one event
        disposable.dispose();

        updateMatrixWithChanges(event.contentChanges, matrix);

        const returnValue = matrixToSelections(event.document, matrix);
        resolve(returnValue);
      }
    );
  });
}
