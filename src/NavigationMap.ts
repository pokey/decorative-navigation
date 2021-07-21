import { TextDocumentChangeEvent } from "vscode";
import { SymbolColor } from "./constants";
import { SerializedRange, serializeRange } from "./TestCase";
import { Token } from "./Types";

/**
 * Maps from (color, character) pairs to tokens
 */
export default class NavigationMap {
  updateTokenRanges(edit: TextDocumentChangeEvent) {
    edit.contentChanges.forEach((editComponent) => {
      // Amount by which to shift ranges
      const shift = editComponent.text.length - editComponent.rangeLength;

      Object.entries(this.map).forEach(([coloredSymbol, token]) => {
        if (token.editor.document !== edit.document) {
          return;
        }

        if (editComponent.range.start.isAfterOrEqual(token.range.end)) {
          return;
        }

        if (editComponent.range.end.isAfter(token.range.start)) {
          // If there is overlap, we just delete the token
          delete this.map[coloredSymbol];
          return;
        }

        const startOffset = token.startOffset + shift;
        const endOffset = token.endOffset + shift;

        token.range = token.range.with(
          edit.document.positionAt(startOffset),
          edit.document.positionAt(endOffset)
        );
        token.startOffset = startOffset;
        token.endOffset = endOffset;
      });
    });
  }

  private map: {
    [coloredSymbol: string]: Token;
  } = {};

  static getKey(color: SymbolColor, character: string) {
    return `${color}.${character}`;
  }

  public addToken(color: SymbolColor, character: string, token: Token) {
    this.map[NavigationMap.getKey(color, character)] = token;
  }

  public getToken(color: SymbolColor, character: string) {
    return this.map[NavigationMap.getKey(color, character)];
  }

  public serializeRanges() {
    const rangeMap: { [coloredSymbol: string]: SerializedRange } = {};
    Object.entries(this.map).forEach(([key, value]) => {
      rangeMap[key] = serializeRange(value.range);
    });
    return rangeMap;
  }

  public clear() {
    this.map = {};
  }
}
