import { TextEditorDecorationType, workspace } from "vscode";
import { TypedSelection, SelectionWithEditor } from "./Types";
import { isLineSelectionType } from "./selectionType";
import { promisify } from "util";
import { runOnTargetsForEachEditor, runForEachEditor } from "./targetUtils";

const sleep = promisify(setTimeout);

const getPendingEditDecorationTime = () =>
  workspace
    .getConfiguration("cursorless")
    .get<number>("pendingEditDecorationTime")!;

export async function decorationSleep() {
  await sleep(getPendingEditDecorationTime());
}

export default async function displayPendingEditDecorations(
  targets: TypedSelection[],
  tokenStyle: TextEditorDecorationType,
  lineStyle: TextEditorDecorationType
) {
  await runOnTargetsForEachEditor(targets, async (editor, selections) => {
    editor.setDecorations(
      tokenStyle,
      selections
        .filter((selection) => !isLineSelectionType(selection.selectionType))
        .map((selection) => selection.selection.selection)
    );

    editor.setDecorations(
      lineStyle,
      selections
        .filter((selection) => isLineSelectionType(selection.selectionType))
        .map((selection) => {
          const start = selection.selection.selection.start;
          const startLine = selection.selection.editor.document.lineAt(start);
          if (start.character === startLine.range.end.character) {
            return selection.selection.selection.with(
              // NB: We move start down one line because it is at end of
              // previous line
              selection.selection.selection.start.translate(1),
              undefined
            );
          }
          if (selection.selection.selection.end.character === 0) {
            return selection.selection.selection.with(
              undefined,
              // NB: We move end up one line because it is at beginning of
              // next line
              selection.selection.selection.end.translate(-1)
            );
          }
          return selection.selection.selection;
        })
    );
  });

  await decorationSleep();

  await runOnTargetsForEachEditor(targets, async (editor) => {
    editor.setDecorations(tokenStyle, []);
    editor.setDecorations(lineStyle, []);
  });
}

/**
1. Shows decorations.
2. Wait for pending edit decoration time while subtracting the time it takes to actually run the callback
3. Removes decorations
*/
export async function displayDecorationsWhileRunningFunc(
  selections: SelectionWithEditor[],
  decorationType: TextEditorDecorationType,
  callback: () => Promise<void>,
  showAdditionalHighlightBeforeCallback: boolean
) {
  if (!showAdditionalHighlightBeforeCallback) {
    await callback();
  }

  await runForEachEditor(
    selections,
    (s) => s.editor,
    async (editor, selections) => {
      editor.setDecorations(
        decorationType,
        selections.map((s) => s.selection)
      );
    }
  );

  const pendingEditDecorationTime = getPendingEditDecorationTime();

  if (showAdditionalHighlightBeforeCallback) {
    await sleep(pendingEditDecorationTime);
    await callback();
  }

  await sleep(pendingEditDecorationTime);

  await runForEachEditor(
    selections,
    (s) => s.editor,
    async (editor) => {
      editor.setDecorations(decorationType, []);
    }
  );
}
