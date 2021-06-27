import { concat, range, zip } from "lodash";
import update from "immutability-helper";
import { SyntaxNode } from "web-tree-sitter";
import * as vscode from "vscode";
import { Position, Selection } from "vscode";
import { nodeMatchers } from "./languages";
import {
  Mark,
  PrimitiveTarget,
  ProcessedTargetsContext,
  RangeTarget,
  SelectionContext,
  SelectionWithContext,
  SelectionWithEditor,
  Target,
  TypedSelection,
} from "./Types";
import { performInsideOutsideAdjustment } from "./performInsideOutsideAdjustment";
import { SUBWORD_MATCHER } from "./constants";

export default function processTargets(
  context: ProcessedTargetsContext,
  targets: Target[]
): TypedSelection[][] {
  return targets.map((target) => processSingleTarget(context, target));
}

function processSingleTarget(
  context: ProcessedTargetsContext,
  target: Target
): TypedSelection[] {
  switch (target.type) {
    case "list":
      return concat(
        [],
        ...target.elements.map((target) => processSingleTarget(context, target))
      );
    case "range":
      return processSingleRangeTarget(context, target).map((selection) =>
        performInsideOutsideAdjustment(selection)
      );
    case "primitive":
      return processSinglePrimitiveTarget(context, target).map((selection) =>
        performInsideOutsideAdjustment(selection)
      );
  }
}

function processSingleRangeTarget(
  context: ProcessedTargetsContext,
  target: RangeTarget
): TypedSelection[] {
  const startTargets = processSinglePrimitiveTarget(context, target.start);
  const endTargets = processSinglePrimitiveTarget(context, target.end);

  if (startTargets.length !== endTargets.length) {
    throw new Error("startTargets and endTargets lengths don't match");
  }

  return zip(startTargets, endTargets).map(([startTarget, endTarget]) => {
    if (startTarget!.selection.editor !== endTarget!.selection.editor) {
      throw new Error("startTarget and endTarget must be in same document");
    }

    const startSelection = startTarget!.selection.selection;
    const endSelection = endTarget!.selection.selection;

    const isStartBeforeEnd = startSelection.start.isBeforeOrEqual(
      endSelection.end
    );

    const anchor = isStartBeforeEnd ? startSelection.start : startSelection.end;
    const active = isStartBeforeEnd ? endSelection.end : endSelection.start;
    const leadingDelimiterRange = isStartBeforeEnd
      ? startTarget!.selectionContext.leadingDelimiterRange
      : endTarget!.selectionContext.leadingDelimiterRange;
    const trailingDelimiterRange = isStartBeforeEnd
      ? endTarget!.selectionContext.trailingDelimiterRange
      : startTarget!.selectionContext.trailingDelimiterRange;

    return {
      selection: {
        selection: new Selection(anchor, active),
        editor: startTarget!.selection.editor,
      },
      selectionType: startTarget!.selectionType,
      selectionContext: {
        containingListDelimiter:
          startTarget!.selectionContext.containingListDelimiter,
        isInDelimitedList: startTarget!.selectionContext.isInDelimitedList,
        leadingDelimiterRange,
        trailingDelimiterRange,
      },
      insideOutsideType: startTarget!.insideOutsideType,
    };
  });
}

function processSinglePrimitiveTarget(
  context: ProcessedTargetsContext,
  target: PrimitiveTarget
): TypedSelection[] {
  const markSelections = getSelectionsFromMark(context, target.mark);
  const transformedSelections = concat(
    [],
    ...markSelections.map((markSelection) =>
      transformSelection(context, target, markSelection)
    )
  );
  const typedSelections = transformedSelections.map(
    ({ selection, context: selectionContext }) =>
      createTypedSelection(context, target, selection, selectionContext)
  );
  return typedSelections.map((selection) =>
    performPositionAdjustment(context, target, selection)
  );
}

function getSelectionsFromMark(
  context: ProcessedTargetsContext,
  mark: Mark
): SelectionWithEditor[] {
  switch (mark.type) {
    case "cursor":
      return context.currentSelections;
    case "decoratedSymbol":
      const token = context.navigationMap.getToken(
        mark.symbolColor,
        mark.character
      );
      if (token == null) {
        throw new Error(
          `Couldn't find mark ${mark.symbolColor} '${mark.character}'`
        );
      }
      return [
        {
          selection: new Selection(token.range.start, token.range.end),
          editor: token.editor,
        },
      ];
    case "that":
      return context.thatMark;
    case "lastCursorPosition":
      throw new Error("Not implemented");
  }
}

function transformSelection(
  context: ProcessedTargetsContext,
  target: PrimitiveTarget,
  selection: SelectionWithEditor
): { selection: SelectionWithEditor; context: SelectionContext }[] {
  const { transformation } = target;

  switch (transformation.type) {
    case "identity":
      return [{ selection, context: {} }];
    case "containingScope":
      var node: SyntaxNode | null = context.getNodeAtLocation(
        new vscode.Location(selection.editor.document.uri, selection.selection)
      );

      const nodeMatcher =
        nodeMatchers[selection.editor.document.languageId][
          transformation.scopeType
        ];

      while (node != null) {
        const matchedSelection = nodeMatcher(selection.editor, node);
        if (matchedSelection != null) {
          var matchedSelections: SelectionWithContext[];
          if (transformation.includeSiblings) {
            matchedSelections = node
              .parent!.children.map((sibling) =>
                nodeMatcher(selection.editor, sibling)
              )
              .filter(
                (selection) => selection != null
              ) as SelectionWithContext[];
          } else {
            matchedSelections = [matchedSelection];
          }
          return matchedSelections.map((matchedSelection) => ({
            selection: {
              editor: selection.editor,
              selection: matchedSelection.selection,
            },
            context: matchedSelection.context,
          }));
        }
        console.log(node.type);
        node = node.parent;
      }

      throw new Error(`Couldn't find containing ${transformation.scopeType}`);
    case "subpiece":
      const token = selection.editor.document.getText(selection.selection);
      let pieces: { start: number; end: number }[] = [];

      if (transformation.pieceType === "subtoken") {
        const matches = token.matchAll(SUBWORD_MATCHER);
        for (const match of matches) {
          pieces.push({
            start: match.index!,
            end: match.index! + match[0].length,
          });
        }
      } else if (transformation.pieceType === "character") {
        pieces = range(token.length).map((index) => ({
          start: index,
          end: index + 1,
        }));
      }

      // NB: We use the modulo here to handle negative offsets
      const endIndex =
        transformation.endIndex == null
          ? pieces.length
          : transformation.endIndex <= 0
          ? transformation.endIndex + pieces.length
          : transformation.endIndex;

      const startIndex =
        transformation.startIndex < 0
          ? transformation.startIndex + pieces.length
          : transformation.startIndex;

      const start = selection.selection.start.translate(
        undefined,
        pieces[startIndex].start
      );
      const end = selection.selection.start.translate(
        undefined,
        pieces[endIndex - 1].end
      );

      return [
        {
          selection: update(selection, {
            selection: (s) =>
              s.isReversed
                ? new Selection(end, start)
                : new Selection(start, end),
          }),
          context: {},
        },
      ];
    case "matchingPairSymbol":
    case "surroundingPair":
      throw new Error("Not implemented");
  }
}

function createTypedSelection(
  context: ProcessedTargetsContext,
  target: PrimitiveTarget,
  selection: SelectionWithEditor,
  selectionContext: SelectionContext
): TypedSelection {
  const { selectionType, insideOutsideType } = target;
  var start: vscode.Position;
  var end: vscode.Position;

  switch (selectionType) {
    case "token":
      return {
        selection,
        selectionType,
        selectionContext,
        insideOutsideType: target.insideOutsideType ?? null,
      };

    case "line":
      const originalSelectionStart = selection.selection.start;
      const originalSelectionEnd = selection.selection.end;

      if (insideOutsideType) {
        const startLine = selection.editor.document.lineAt(
          originalSelectionStart.line
        );
        const endLine = selection.editor.document.lineAt(
          originalSelectionEnd.line
        );
        start = new vscode.Position(
          originalSelectionStart.line,
          startLine.firstNonWhitespaceCharacterIndex
        );
        end = endLine.range.end;
      } else {
        start = new vscode.Position(originalSelectionStart.line, 0);
        end =
          originalSelectionEnd.line > originalSelectionStart.line &&
          originalSelectionEnd.character === 0
            ? originalSelectionEnd
            : new vscode.Position(originalSelectionEnd.line + 1, 0);
      }

      const isAnchorBeforeActive = selection.selection.anchor.isBeforeOrEqual(
        selection.selection.active
      );
      const anchor = isAnchorBeforeActive ? start : end;
      const active = isAnchorBeforeActive ? end : start;

      return {
        selection: {
          selection: new Selection(anchor, active),
          editor: selection.editor,
        },
        selectionType,
        selectionContext,
        insideOutsideType: target.insideOutsideType ?? null,
      };
    case "document":
      const document = selection.editor.document;
      // From https://stackoverflow.com/a/46427868
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      start = firstLine.range.start;
      end = lastLine.range.end;

      return {
        selection: update(selection, {
          selection: (s) =>
            s.isReversed
              ? new Selection(end, start)
              : new Selection(start, end),
        }),
        selectionType,
        selectionContext,
        insideOutsideType: target.insideOutsideType ?? null,
      };
    case "block":
    case "character":
      throw new Error("Not implemented");
  }
}

function performPositionAdjustment(
  context: ProcessedTargetsContext,
  target: PrimitiveTarget,
  selection: TypedSelection
): TypedSelection {
  var newSelection;
  const { position } = target;
  const originalSelection = selection.selection.selection;

  switch (position) {
    case "contents":
      newSelection = originalSelection;
      break;
    case "before":
      newSelection = new Selection(
        originalSelection.start,
        originalSelection.start
      );
      break;
    case "after":
      newSelection = new Selection(
        originalSelection.end,
        originalSelection.end
      );
      break;
  }

  return {
    selection: {
      selection: newSelection,
      editor: selection.selection.editor,
    },
    selectionType: selection.selectionType,
    selectionContext: selection.selectionContext,
    insideOutsideType: target.insideOutsideType ?? null,
  };
}
