import { concat, range, zip } from "lodash";
import update from "immutability-helper";
import { SyntaxNode } from "web-tree-sitter";
import * as vscode from "vscode";
import { Selection, Range } from "vscode";
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
  const { modifier } = target;

  switch (modifier.type) {
    case "identity":
      return [{ selection, context: {} }];
    case "containingScope":
      var node: SyntaxNode | null = context.getNodeAtLocation(
        new vscode.Location(selection.editor.document.uri, selection.selection)
      );

      const nodeMatcher =
        nodeMatchers[selection.editor.document.languageId][modifier.scopeType];

      while (node != null) {
        const matchedSelection = nodeMatcher(selection.editor, node);
        if (matchedSelection != null) {
          var matchedSelections: SelectionWithContext[];
          if (modifier.includeSiblings) {
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
        node = node.parent;
      }

      throw new Error(`Couldn't find containing ${modifier.scopeType}`);
    case "subpiece":
      const token = selection.editor.document.getText(selection.selection);
      let pieces: { start: number; end: number }[] = [];

      if (modifier.pieceType === "word") {
        const matches = token.matchAll(SUBWORD_MATCHER);
        for (const match of matches) {
          pieces.push({
            start: match.index!,
            end: match.index! + match[0].length,
          });
        }
      } else if (modifier.pieceType === "character") {
        pieces = range(token.length).map((index) => ({
          start: index,
          end: index + 1,
        }));
      }

      // NB: We use the modulo here to handle negative offsets
      const endIndex =
        modifier.endIndex == null
          ? pieces.length
          : modifier.endIndex <= 0
          ? modifier.endIndex + pieces.length
          : modifier.endIndex;

      const startIndex =
        modifier.startIndex < 0
          ? modifier.startIndex + pieces.length
          : modifier.startIndex;

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
  let start: vscode.Position;
  let end: vscode.Position;

  switch (selectionType) {
    case "token":
      return {
        selection,
        selectionType,
        selectionContext: getTokenSelectionContext(selection, selectionContext),
        insideOutsideType: target.insideOutsideType ?? null,
      };

    case "line":
      const originalSelectionStart = selection.selection.start;
      const originalSelectionEnd = selection.selection.end;

      const startLine = selection.editor.document.lineAt(
        originalSelectionStart
      );
      const endLine = selection.editor.document.lineAt(originalSelectionEnd);
      start = new vscode.Position(
        originalSelectionStart.line,
        startLine.firstNonWhitespaceCharacterIndex
      );
      end = endLine.range.end;

      const isSelectionReversed = selection.selection.isReversed;
      const anchor = isSelectionReversed ? start : end;
      const active = isSelectionReversed ? end : start;
      const newSelection = new Selection(anchor, active);
      selection = {
        selection: newSelection,
        editor: selection.editor,
      };

      return {
        selection,
        selectionType,
        selectionContext: getLineSelectionContext(selection, selectionContext),
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

function getTokenSelectionContext(
  selection: SelectionWithEditor,
  selectionContext: SelectionContext
): SelectionContext {
  if (selectionContext.isInDelimitedList) {
    return selectionContext;
  }

  const start = selection.selection.isReversed
    ? selection.selection.end
    : selection.selection.start;
  const end = selection.selection.isReversed
    ? selection.selection.start
    : selection.selection.end;

  const startLine = selection.editor.document.lineAt(start);
  const leadingText = startLine.text.slice(0, start.character);
  const leadingSibling = leadingText.trim().length > 0;
  const leadingDelimiters = leadingText.match(/\s+$/);
  const leadingDelimiterRange =
    leadingSibling && leadingDelimiters
      ? new Range(
          start.line,
          start.character - leadingDelimiters[0].length,
          start.line,
          start.character
        )
      : null;

  const endLine = selection.editor.document.lineAt(end);
  const trailingText = endLine.text.slice(end.character);
  const trailingSibling = trailingText.trim().length > 0;
  const trailingDelimiters = trailingText.match(/^ +/);
  const trailingDelimiterRange =
    trailingSibling && trailingDelimiters
      ? new Range(
          end.line,
          end.character,
          end.line,
          end.character + trailingDelimiters[0].length
        )
      : null;

  // Didn't find any delimiters
  if (leadingDelimiterRange == null && trailingDelimiterRange == null) {
    return selectionContext;
  }

  return {
    isInDelimitedList: true,
    containingListDelimiter: " ",
    leadingDelimiterRange,
    trailingDelimiterRange,
  };
}

function getLineSelectionContext(
  selection: SelectionWithEditor,
  selectionContext: SelectionContext
): SelectionContext {
  if (selectionContext.isInDelimitedList) {
    return selectionContext;
  }

  const start = selection.selection.isReversed
    ? selection.selection.end
    : selection.selection.start;
  const end = selection.selection.isReversed
    ? selection.selection.start
    : selection.selection.end;

  const leadingDelimiterRange =
    start.line > 0
      ? new Range(
          end.line - 1,
          selection.editor.document.lineAt(end.line - 1).range.end.character,
          start.line,
          0
        )
      : null;

  const trailingDelimiterRange =
    end.line + 1 < selection.editor.document.lineCount
      ? new Range(end.line, 0, end.line + 1, 0)
      : null;

  // Didn't find any delimiters
  if (leadingDelimiterRange == null && trailingDelimiterRange == null) {
    return selectionContext;
  }

  return {
    isInDelimitedList: true,
    containingListDelimiter: "\n",
    leadingDelimiterRange,
    trailingDelimiterRange,
  };
}
