import { flatten } from "lodash";
import { TextEditor } from "vscode";
import { groupBy } from "./itertools";
import { TypedSelection } from "./Types";

export function ensureSingleEditor(targets: TypedSelection[]) {
  const editors = targets.map((target) => target.selection.editor);

  if (new Set(editors).size > 1) {
    throw new Error("Can only select from one document at a time");
  }

  return editors[0];
}

export function ensureSingleTarget(targets: TypedSelection[]) {
  if (targets.length !== 1) {
    throw new Error("Can only have one target with this action");
  }

  return targets[0];
}

export async function runForEachEditor<T, U>(
  targets: T[],
  getEditor: (target: T) => TextEditor,
  func: (editor: TextEditor, editorTargets: T[]) => Promise<U>
): Promise<U[]> {
  return await Promise.all(
    Array.from(groupBy(targets, getEditor), async ([editor, editorTargets]) =>
      func(editor, editorTargets)
    )
  );
}

export async function runOnTargetsForEachEditor<T>(
  targets: TypedSelection[],
  func: (editor: TextEditor, selections: TypedSelection[]) => Promise<T>
): Promise<T[]> {
  return runForEachEditor(targets, (target) => target.selection.editor, func);
}
