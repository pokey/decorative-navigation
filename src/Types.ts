import { SyntaxNode } from "web-tree-sitter";
import * as vscode from "vscode";
import { Location } from "vscode";
import { SymbolColor } from "./constants";
import EditStyles from "./editStyles";
import NavigationMap from "./NavigationMap";

/**
 * A token within a text editor, including the current display line of the token
 */
export interface Token {
  text: string;
  range: vscode.Range;
  startOffset: number;
  endOffset: number;
  editor: vscode.TextEditor;
  displayLine: number;
}

export interface CursorMark {
  type: "cursor";
}

export interface That {
  type: "that";
}

export interface LastCursorPosition {
  type: "lastCursorPosition";
}

export interface DecoratedSymbol {
  type: "decoratedSymbol";
  symbolColor: SymbolColor;
  character: string;
}

export type Mark = CursorMark | That | LastCursorPosition | DecoratedSymbol;
export type Delimiter =
  | "squareBrackets"
  | "curlyBrackets"
  | "angleBrackets"
  | "parentheses"
  | "singleQuotes"
  | "doubleQuotes";
export type ScopeType =
  | "argumentOrParameter"
  | "arrowFunction"
  | "class"
  | "className"
  | "comment"
  | "dictionary"
  | "functionCall"
  | "functionName"
  | "ifStatement"
  | "list"
  | "listElement"
  | "name"
  | "namedFunction"
  | "pair"
  | "pairKey"
  | "statement"
  | "string"
  | "type"
  | "value";
export type PieceType = "word" | "character";

export interface SurroundingPairModifier {
  type: "surroundingPair";
  delimiter: Delimiter;
}
export interface ContainingScopeModifier {
  type: "containingScope";
  scopeType: ScopeType;
  valueOnly?: boolean;
  includeSiblings?: boolean;
}
export interface SubpieceModifier {
  type: "subpiece";
  pieceType: PieceType;
  startIndex: number;
  endIndex: number | null;
}
export interface MatchingPairSymbolModifier {
  type: "matchingPairSymbol";
}
export interface IdentityModifier {
  type: "identity";
}

export type Modifier =
  | SurroundingPairModifier
  | ContainingScopeModifier
  | SubpieceModifier
  | MatchingPairSymbolModifier
  | IdentityModifier;

export type SelectionType =
  | "character"
  | "token"
  | "line"
  | "block"
  | "document";
export type Position = "before" | "after" | "contents";
export type InsideOutsideType = "inside" | "outside" | null;

export interface PartialPrimitiveTarget {
  type: "primitive";
  mark?: Mark;
  modifier?: Modifier;
  selectionType?: SelectionType;
  position?: Position;
  insideOutsideType?: InsideOutsideType;
}

export interface PartialRangeTarget {
  type: "range";
  start: PartialPrimitiveTarget;
  end: PartialPrimitiveTarget;
}

export interface PartialListTarget {
  type: "list";
  elements: (PartialPrimitiveTarget | PartialRangeTarget)[];
}

export type PartialTarget =
  | PartialPrimitiveTarget
  | PartialRangeTarget
  | PartialListTarget;

export interface PrimitiveTarget {
  type: "primitive";
  mark: Mark;
  modifier: Modifier;
  selectionType: SelectionType;
  position: Position;
  insideOutsideType: InsideOutsideType;
}

export interface RangeTarget {
  type: "range";
  start: PrimitiveTarget;
  end: PrimitiveTarget;
}

export interface ListTarget {
  type: "list";
  elements: (PrimitiveTarget | RangeTarget)[];
}

export type Target = PrimitiveTarget | RangeTarget | ListTarget;

export interface InferenceContext {
  selectionContents: string[];
  clipboardContents?: string;
  isPaste: boolean;
}

export interface ProcessedTargetsContext {
  currentSelections: SelectionWithEditor[];
  currentEditor: vscode.TextEditor | undefined;
  navigationMap: NavigationMap;
  thatMark: SelectionWithEditor[];
  getNodeAtLocation: (location: Location) => SyntaxNode;
}

export interface SelectionWithEditor {
  selection: vscode.Selection;
  editor: vscode.TextEditor;
}

export interface SelectionContext {
  isInDelimitedList?: boolean;
  containingListDelimiter?: string;

  /**
   * The range of the delimiter before the selection, *if* the selection has a
   * preceding sibling, else null
   */
  leadingDelimiterRange?: vscode.Range | null;

  /**
   * The range of the delimiter after the selection, *if* the selection has a
   * following sibling, else null
   */
  trailingDelimiterRange?: vscode.Range | null;
}

export interface TypedSelection {
  /**
   * The selection.  If insideOutsideType is non-null, it will be adjusted to
   * include delimiter if outside
   */
  selection: SelectionWithEditor;
  selectionType: SelectionType;
  selectionContext: SelectionContext;

  /**
   * Is a boolean if user specifically requested inside or outside
   */
  insideOutsideType: InsideOutsideType;
}

export interface ActionPreferences {
  position?: Position;
  insideOutsideType: InsideOutsideType;
}

export interface SelectionWithContext {
  selection: vscode.Selection;
  context: SelectionContext;
}

export interface ActionReturnValue {
  returnValue: any;
  thatMark: SelectionWithEditor[];
}

export interface Action {
  run(targets: TypedSelection[][], ...args: any[]): Promise<ActionReturnValue>;
  targetPreferences: ActionPreferences[];
}

export type ActionType =
  | "bring"
  | "clear"
  | "copy"
  | "cut"
  | "delete"
  | "extractVariable"
  | "fold"
  | "insertLineAfter"
  | "insertLineBefore"
  | "move"
  | "paste"
  | "scrollToBottom"
  | "scrollToCenter"
  | "scrollToTop"
  | "setSelection"
  | "setSelectionAfter"
  | "setSelectionBefore"
  | "swap"
  | "unfold"
  | "wrap";

export type ActionRecord = Record<ActionType, Action>;

export interface Graph {
  readonly actions: ActionRecord;
  readonly editStyles: EditStyles;
}

export interface DecorationColorSetting {
  dark: string;
  light: string;
  highContrast: string;
}

export type NodeMatcher = (
  editor: vscode.TextEditor,
  node: SyntaxNode
) => SelectionWithContext | null;

/**
 * Returns the desired relative of the provided node.
 * Returns null if matching node not found.
 **/
export type NodeFinder = (node: SyntaxNode) => SyntaxNode | null;

/** Returns a selection for a given SyntaxNode */
export type SelectionExtractor = (
  editor: vscode.TextEditor,
  node: SyntaxNode
) => SelectionWithContext | null;
