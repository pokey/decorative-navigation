import * as vscode from "vscode";

/**
 * A mockable layer over the vscode clipboard
 *
 * For unknown reasons it's not possible to mock the clipboard directly.
 * Use this instead of vscode.env.clipboard so it can be mocked in testing.
 **/
export class Clipboard {
  static readText = vscode.env.clipboard.readText;
  static writeText = vscode.env.clipboard.writeText;
}
