import * as assert from "assert";
import { promises as fsp } from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as vscode from "vscode";
import TestCase, {
  SerializedPosition,
  SerializedSelection,
  TestCaseFixture,
} from "../../TestCase";
import { SymbolColor } from "../../constants";
import { ThatMark } from "../../ThatMark";
import NavigationMap from "../../NavigationMap";
import * as sinon from "sinon";
import { Clipboard } from "../../Clipboard";

function deserializePosition(position: SerializedPosition) {
  return new vscode.Position(position.line, position.character);
}

function deserializeSelection(
  selection: SerializedSelection
): vscode.Selection {
  const active = deserializePosition(selection.active);
  const anchor = deserializePosition(selection.anchor);
  return new vscode.Selection(anchor, active);
}

suite("recorded test cases", async function () {
  const directory = path.join(__dirname, "../../../testFixtures");
  const files = await fsp.readdir(directory);

  files.forEach(async (file) => {
    test(file.split(".")[0], async function () {
      this.timeout(100000);
      const cursorless = vscode.extensions.getExtension("pokey.cursorless");

      if (cursorless == null) {
        throw new Error("Could not get cursorless extension");
      }

      const cursorlessApi: {
        thatMark: ThatMark;
        navigationMap: NavigationMap;
      } = await cursorless.activate();
      const buffer = await fsp.readFile(path.join(directory, file));
      const fixture = yaml.load(buffer.toString()) as TestCaseFixture;

      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      const document = await vscode.workspace.openTextDocument({
        language: fixture.languageId,
        content: fixture.initialState.document,
      });
      const editor = await vscode.window.showTextDocument(document);
      editor.selections =
        fixture.initialState.selections.map(deserializeSelection);

      if (fixture.initialState.thatMark) {
        const initialThatMark = fixture.initialState.thatMark.map((mark) => ({
          selection: deserializeSelection(mark),
          editor,
        }));
        cursorlessApi.thatMark.set(initialThatMark);
      }

      let clip = fixture.initialState.clipboard;
      sinon.replace(Clipboard, "readText", async () => clip);
      sinon.replace(Clipboard, "writeText", async (value: string) => {
        clip = value;
      });

      // Wait for cursorless to set up decorations
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Assert that recorded decorations are present
      Object.entries(fixture.marks).forEach(([key, _]) => {
        const [color, character] = key.split(".") as [SymbolColor, string];
        const token = cursorlessApi.navigationMap.getToken(color, character);
        assert(token != null, `Mark "${color} ${character}" not found`);
      });

      const returnValue = await vscode.commands.executeCommand(
        "cursorless.command",
        fixture.command.actionName,
        fixture.command.partialTargets,
        ...fixture.command.extraArgs
      );

      const resultState = await TestCase.getSnapshot(
        cursorlessApi.thatMark.get()
      );
      assert.deepStrictEqual(fixture.finalState, resultState);
      assert.deepStrictEqual(fixture.returnValue, returnValue);

      sinon.restore();
    });
  });
});
