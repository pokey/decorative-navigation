import { concat, range, zip } from "lodash";
import update from "immutability-helper";
import { SyntaxNode } from "web-tree-sitter";
import * as vscode from "vscode";
import { Selection, Range, Position } from "vscode";
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
      endSelection.start
    );

    const anchor = isStartBeforeEnd ? startSelection.start : startSelection.end;
    const active = isStartBeforeEnd ? endSelection.end : endSelection.start;
    const leadingDelimiterRange = isStartBeforeEnd
      ? startTarget!.selectionContext.leadingDelimiterRange
      : endTarget!.selectionContext.leadingDelimiterRange;
    const trailingDelimiterRange = isStartBeforeEnd
      ? endTarget!.selectionContext.trailingDelimiterRange
      : startTarget!.selectionContext.trailingDelimiterRange;

    const startOuterSelection =
      startTarget!.selectionContext.outerSelection ?? startSelection;
    const endOuterSelection =
      endTarget!.selectionContext.outerSelection ?? endSelection;
    const outerSelection = isStartBeforeEnd
      ? new Selection(startOuterSelection.start, endOuterSelection.end)
      : new Selection(endOuterSelection.start, startOuterSelection.end);

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
        outerSelection,
      },
      insideOutsideType: startTarget!.insideOutsideType,
      position: "contents",
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
        pieces = [...token.matchAll(SUBWORD_MATCHER)].map((match) => ({
          start: match.index!,
          end: match.index! + match[0].length,
        }));
      } else if (modifier.pieceType === "character") {
        pieces = range(token.length).map((index) => ({
          start: index,
          end: index + 1,
        }));
      }

      const anchorIndex =
        modifier.anchor < 0 ? modifier.anchor + pieces.length : modifier.anchor;
      const activeIndex =
        modifier.active < 0 ? modifier.active + pieces.length : modifier.active;

      const isReversed = activeIndex < anchorIndex;

      const anchor = selection.selection.start.translate(
        undefined,
        isReversed ? pieces[anchorIndex].end : pieces[anchorIndex].start
      );
      const active = selection.selection.start.translate(
        undefined,
        isReversed ? pieces[activeIndex].start : pieces[activeIndex].end
      );

      return [
        {
          selection: update(selection, {
            selection: () => new Selection(anchor, active),
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
  const { selectionType, insideOutsideType, position } = target;
  const { document } = selection.editor;

  switch (selectionType) {
    case "token":
      return {
        selection,
        selectionType,
        position,
        insideOutsideType,
        selectionContext: getTokenSelectionContext(selection, selectionContext),
      };

    case "line": {
      const startLine = document.lineAt(selection.selection.start);
      const endLine = document.lineAt(selection.selection.end);
      const start = new Position(
        startLine.lineNumber,
        startLine.firstNonWhitespaceCharacterIndex
      );
      const end = endLine.range.end;

      const newSelection = update(selection, {
        selection: (s) =>
          s.isReversed ? new Selection(end, start) : new Selection(start, end),
      });

      return {
        selection: newSelection,
        selectionType,
        position,
        insideOutsideType,
        selectionContext: getLineSelectionContext(
          newSelection,
          selectionContext
        ),
      };
    }

    case "document": {
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const start = firstLine.range.start;
      const end = lastLine.range.end;

      return {
        selection: update(selection, {
          selection: (s) =>
            s.isReversed
              ? new Selection(end, start)
              : new Selection(start, end),
        }),
        selectionType,
        position,
        insideOutsideType,
        selectionContext,
      };
    }

    case "paragraph": {
      let startLine = document.lineAt(selection.selection.start.line);
      while (startLine.lineNumber > 0) {
        const line = document.lineAt(startLine.lineNumber - 1);
        if (line.isEmptyOrWhitespace) {
          break;
        }
        startLine = line;
      }
      const lineCount = document.lineCount;
      let endLine = document.lineAt(selection.selection.end.line);
      while (endLine.lineNumber + 1 < lineCount) {
        const line = document.lineAt(endLine.lineNumber + 1);
        if (line.isEmptyOrWhitespace) {
          break;
        }
        endLine = line;
      }

      const start = new Position(
        startLine.lineNumber,
        startLine.firstNonWhitespaceCharacterIndex
      );
      const end = endLine.range.end;

      const newSelection = update(selection, {
        selection: (s) =>
          s.isReversed ? new Selection(end, start) : new Selection(start, end),
      });

      return {
        selection: newSelection,
        position,
        selectionType,
        insideOutsideType,
        selectionContext: getParagraphSelectionContext(
          newSelection,
          selectionContext
        ),
      };
    }

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
    position,
  };
}

function getTokenSelectionContext(
  selection: SelectionWithEditor,
  selectionContext: SelectionContext
): SelectionContext {
  if (!isSelectionContextEmpty(selectionContext)) {
    return selectionContext;
  }

  const document = selection.editor.document;
  const { start, end } = selection.selection;

  const startLine = document.lineAt(start);
  const leadingText = startLine.text.slice(0, start.character);
  const hasLeadingSibling = leadingText.trim().length > 0;
  const leadingDelimiters = leadingText.match(/\s+$/);
  const leadingDelimiterRange =
    hasLeadingSibling && leadingDelimiters != null
      ? new Range(
          start.line,
          start.character - leadingDelimiters[0].length,
          start.line,
          start.character
        )
      : null;

  const endLine = document.lineAt(end);
  const trailingText = endLine.text.slice(end.character);
  const hasTrailingSibling = trailingText.trim().length > 0;
  const trailingDelimiters = trailingText.match(/^\s+/);
  const trailingDelimiterRange =
    hasTrailingSibling && trailingDelimiters != null
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
    containingListDelimiter: document.getText(
      (trailingDelimiterRange ?? leadingDelimiterRange)!
    ),
    leadingDelimiterRange,
    trailingDelimiterRange,
  };
}

// TODO Clean this up once we have rich targets and better polymorphic
// selection contexts that indicate their type
function isSelectionContextEmpty(selectionContext: SelectionContext) {
  return (
    selectionContext.isInDelimitedList == null &&
    selectionContext.containingListDelimiter == null &&
    selectionContext.leadingDelimiterRange == null &&
    selectionContext.trailingDelimiterRange == null
  );
}

function getLineSelectionContext(
  selection: SelectionWithEditor,
  selectionContext: SelectionContext
): SelectionContext {
  if (selectionContext.isInDelimitedList) {
    return selectionContext;
  }
  const { document } = selection.editor;
  const start = selection.selection.start;
  const end = selection.selection.end;

  const leadingDelimiterRange =
    start.line > 0
      ? new Range(
          start.line - 1,
          document.lineAt(start.line - 1).range.end.character,
          start.line,
          start.character
        )
      : null;

  const trailingDelimiterRange =
    end.line + 1 < document.lineCount
      ? new Range(end.line, end.character, end.line + 1, 0)
      : null;

  // Outer selection contains the entire lines
  const outerSelection = new Selection(
    start.line,
    0,
    end.line,
    selection.editor.document.lineAt(end.line).range.end.character
  );

  const isInDelimitedList =
    leadingDelimiterRange != null || trailingDelimiterRange != null;

  return {
    isInDelimitedList,
    containingListDelimiter: isInDelimitedList ? "\n" : undefined,
    leadingDelimiterRange,
    trailingDelimiterRange,
    outerSelection,
  };
}

function getParagraphSelectionContext(
  selection: SelectionWithEditor,
  selectionContext: SelectionContext
): SelectionContext {
  if (selectionContext.isInDelimitedList) {
    return selectionContext;
  }
  const { document } = selection.editor;
  const start = selection.selection.start;
  const end = selection.selection.end;

  const leadingLine =
    start.line > 1 ? start.line - 2 : start.line > 0 ? start.line - 1 : null;
  const trailingLine =
    end.line + 2 < document.lineCount
      ? end.line + 2
      : end.line + 1 < document.lineCount
      ? end.line + 1
      : null;

  const leadingDelimiterRange =
    leadingLine != null
      ? new Range(
          leadingLine,
          document.lineAt(leadingLine).range.end.character,
          start.line,
          start.character
        )
      : null;
  const trailingDelimiterRange =
    trailingLine != null
      ? new Range(end.line, end.character, trailingLine, 0)
      : null;

  // Outer selection contains the entire lines
  const outerSelection = new Selection(
    start.line,
    0,
    end.line,
    selection.editor.document.lineAt(end.line).range.end.character
  );

  const isInDelimitedList =
    leadingDelimiterRange != null || trailingDelimiterRange != null;

  return {
    isInDelimitedList,
    containingListDelimiter: isInDelimitedList ? "\n" : undefined,
    leadingDelimiterRange,
    trailingDelimiterRange,
    outerSelection,
  };
}
