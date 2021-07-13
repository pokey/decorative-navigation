import * as vscode from "vscode";
import { addDecorationsToEditors } from "./addDecorationsToEditor";
import { DEBOUNCE_DELAY } from "./constants";
import Decorations from "./Decorations";
import graphConstructors from "./graphConstructors";
import { inferFullTargets } from "./inferFullTargets";
import processTargets from "./processTargets";
import computeFontSize from "./computeFontSize";
import {
  ActionType,
  PartialTarget,
  ProcessedTargetsContext,
  SelectionWithEditor,
} from "./Types";
import makeGraph from "./makeGraph";
import { SyntaxNode } from "web-tree-sitter";

export async function activate(context: vscode.ExtensionContext) {
  const fontSize = await computeFontSize();
  const decorations = new Decorations(fontSize);
  const parseTreeExtension = vscode.extensions.getExtension("pokey.parse-tree");

  if (parseTreeExtension == null) {
    throw new Error("Depends on pokey.parse-tree extension");
  }

  const { getNodeAtLocation } = await parseTreeExtension.activate();

  var isActive = vscode.workspace
    .getConfiguration("cursorless")
    .get<boolean>("showOnStart")!;

  function clearEditorDecorations(editor: vscode.TextEditor) {
    decorations.decorations.forEach(({ decoration }) => {
      editor.setDecorations(decoration, []);
    });
  }

  function addDecorations() {
    if (isActive) {
      addDecorationsToEditors(graph.navigationMap, decorations);
    } else {
      vscode.window.visibleTextEditors.forEach(clearEditorDecorations);
      graph.navigationMap.clear();
    }
  }

  var timeoutHandle: NodeJS.Timeout | null = null;

  function addDecorationsDebounced() {
    if (timeoutHandle != null) {
      clearTimeout(timeoutHandle);
    }

    timeoutHandle = setTimeout(() => {
      addDecorations();

      timeoutHandle = null;
    }, DEBOUNCE_DELAY);
  }

  const toggleDecorationsDisposable = vscode.commands.registerCommand(
    "cursorless.toggleDecorations",
    () => {
      isActive = !isActive;
      addDecorationsDebounced();
    }
  );

  const graph = makeGraph(graphConstructors);
  var thatMark: SelectionWithEditor[] = [];
  const cursorlessRecordTestCaseDisposable = vscode.commands.registerCommand(
    "cursorless.recordTestCase",
    () => {
      console.log("Hello world");
    }
  );
  const cursorlessCommandDisposable = vscode.commands.registerCommand(
    "cursorless.command",
    async (
      actionName: ActionType,
      partialTargets: PartialTarget[],
      ...extraArgs: any[]
    ) => {
      try {
        console.debug(`action: ${actionName}`);
        console.debug(`partialTargets:`);
        console.debug(JSON.stringify(partialTargets, null, 3));
        console.debug(`extraArgs:`);
        console.debug(JSON.stringify(extraArgs, null, 3));

        const action = graph.actions[actionName];

        const selectionContents =
          vscode.window.activeTextEditor?.selections.map((selection) =>
            vscode.window.activeTextEditor!.document.getText(selection)
          ) ?? [];

        const isPaste = actionName === "paste";

        var clipboardContents: string | undefined;

        if (isPaste) {
          clipboardContents = await vscode.env.clipboard.readText();
          // clipboardContents = "hello";
          // clipboardContents = "hello\n";
          // clipboardContents = "\nhello\n";
        }

        const inferenceContext = {
          selectionContents,
          isPaste,
          clipboardContents,
        };

        const targets = inferFullTargets(
          inferenceContext,
          partialTargets,
          action.targetPreferences
        );
        // console.log(`targets:`);
        // console.log(JSON.stringify(targets, null, 3));

        const processedTargetsContext: ProcessedTargetsContext = {
          currentSelections:
            vscode.window.activeTextEditor?.selections.map((selection) => ({
              selection,
              editor: vscode.window.activeTextEditor!,
            })) ?? [],
          currentEditor: vscode.window.activeTextEditor,
          navigationMap: graph.navigationMap,
          thatMark,
          getNodeAtLocation,
        };

        const selections = processTargets(processedTargetsContext, targets);

        const { returnValue, thatMark: newThatMark } = await action.run(
          selections,
          ...extraArgs
        );

        thatMark = newThatMark;

        return returnValue;

        // writeFileSync(
        //   "/Users/pokey/src/cursorless-vscode/inferFullTargetsTests.jsonl",
        //   JSON.stringify({
        //     input: { context, partialTargets, preferredPositions },
        //     expectedOutput: targets,
        //   }) + "\n",
        //   { flag: "a" }
        // );

        // writeFileSync(
        //   "/Users/pokey/src/cursorless-vscode/processTargetsTests.jsonl",
        //   JSON.stringify({
        //     input: {
        //       context: processedTargetsContext,
        //       targets,
        //     },
        //     expectedOutput: selections,
        //   }) + "\n",
        //   { flag: "a" }
        // );

        // const processedTargets = processTargets(navigationMap!, targets);
      } catch (e) {
        vscode.window.showErrorMessage(e.message);
        throw e;
      }
    }
  );

  addDecorationsDebounced();

  function handleEdit(edit: vscode.TextDocumentChangeEvent) {
    graph.navigationMap.updateTokenRanges(edit);

    addDecorationsDebounced();
  }

  function logBranchTypes(event: vscode.TextEditorSelectionChangeEvent) {
    const getBranch = (branch: SyntaxNode[]): SyntaxNode[] => {
      if (branch[0].parent) {
        return getBranch([branch[0].parent, ...branch]);
      }
      return branch;
    };

    const location = new vscode.Location(
      vscode.window.activeTextEditor!.document.uri,
      event.selections[0]
    );
    const leaf: SyntaxNode = getNodeAtLocation(location);
    const branch = getBranch([leaf]);
    branch.forEach((node, i) => console.log(">".repeat(i + 1), node.type));
    const leafText = leaf.text.replace(/\s+/g, " ").substring(0, 100);
    console.log(">".repeat(branch.length), `"${leafText}"`);
  }

  context.subscriptions.push(
    cursorlessCommandDisposable,
    cursorlessRecordTestCaseDisposable,
    toggleDecorationsDisposable,
    vscode.window.onDidChangeTextEditorVisibleRanges(addDecorationsDebounced),
    vscode.window.onDidChangeActiveTextEditor(addDecorationsDebounced),
    vscode.window.onDidChangeVisibleTextEditors(addDecorationsDebounced),
    vscode.window.onDidChangeTextEditorSelection(addDecorationsDebounced),
    vscode.window.onDidChangeTextEditorSelection(logBranchTypes),
    vscode.workspace.onDidChangeTextDocument(handleEdit),
    {
      dispose() {
        if (timeoutHandle != null) {
          clearTimeout(timeoutHandle);
        }
      },
    }
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
