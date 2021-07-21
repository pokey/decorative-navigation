// @ts-nocheck
import {
  ActionPreferences,
  InferenceContext,
  PartialTarget,
  Target,
} from "../../../Types";

interface FixtureInput {
  context: InferenceContext;
  partialTargets: PartialTarget[];
  actionPreferences: ActionPreferences[];
}

interface Fixture {
  input: FixtureInput;
  expectedOutput: Target[];
}

const fixture: Fixture[] = [
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "f",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "containingScope",
          scopeType: "namedFunction",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
          },
          end: {
            type: "primitive",
            position: "end",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "token",
          position: "end",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            selectionType: "line",
          },
          end: {
            type: "primitive",
            position: "end",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "line",
          position: "end",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
          end: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "h",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "h",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
          },
          end: {
            type: "primitive",
            selectionType: "paragraph",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "red",
              character: "h",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "paragraph",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "red",
            character: "h",
          },
          selectionType: "paragraph",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          modifier: {
            type: "containingScope",
            scopeType: "class",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "containingScope",
          scopeType: "class",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "i",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "i",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          modifier: {
            type: "surroundingPair",
            delimiter: "parentheses",
            includePairDelimiter: false,
          },
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "surroundingPair",
          delimiter: "parentheses",
          includePairDelimiter: false,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          modifier: {
            type: "surroundingPair",
            delimiter: "parentheses",
            includePairDelimiter: false,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "surroundingPair",
          delimiter: "parentheses",
          includePairDelimiter: false,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "after",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          position: "before",
          selectionType: "line",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "f",
        },
        selectionType: "line",
        position: "before",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "surroundingPair",
            delimiter: "parentheses",
            includePairDelimiter: false,
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "surroundingPair",
          delimiter: "parentheses",
          includePairDelimiter: false,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "surroundingPair",
            delimiter: "parentheses",
            includePairDelimiter: false,
          },
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "f",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "surroundingPair",
          delimiter: "parentheses",
          includePairDelimiter: false,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "h",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "h",
        },
        selectionType: "line",
        position: "after",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "h",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "h",
        },
        selectionType: "token",
        position: "after",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello\n",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "after",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "\nhello\n",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "f",
        },
        selectionType: "paragraph",
        position: "after",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "\nhello\n",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "paragraph",
        position: "after",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello"],
        isPaste: true,
        clipboardContents: "\nhello\n",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "paragraph",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello\n"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["\nhello\n"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "paragraph",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "cursor",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "identity",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "list",
          elements: [
            {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "f",
              },
            },
            {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "g",
              },
            },
          ],
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "list",
        elements: [
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
            selectionType: "token",
            position: "contents",
            modifier: {
              type: "identity",
            },
          },
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
            selectionType: "token",
            position: "contents",
            modifier: {
              type: "identity",
            },
          },
        ],
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "list",
          elements: [
            {
              type: "primitive",
              selectionType: "line",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "f",
              },
            },
            {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "g",
              },
            },
          ],
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "list",
        elements: [
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
            selectionType: "line",
            position: "contents",
            modifier: {
              type: "identity",
            },
          },
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
            selectionType: "line",
            position: "contents",
            modifier: {
              type: "identity",
            },
          },
        ],
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            selectionType: "line",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
          },
          end: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: ["hello"],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "list",
          elements: [
            {
              type: "primitive",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "g",
              },
            },
            {
              type: "range",
              start: {
                type: "primitive",
                mark: {
                  type: "decoratedSymbol",
                  symbolColor: "default",
                  character: "h",
                },
              },
              end: {
                type: "primitive",
                mark: {
                  type: "decoratedSymbol",
                  symbolColor: "default",
                  character: "e",
                },
              },
            },
          ],
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "list",
        elements: [
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
            selectionType: "token",
            position: "contents",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
          {
            type: "range",
            start: {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "h",
              },
              selectionType: "token",
              position: "contents",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
            },
            end: {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "e",
              },
              selectionType: "token",
              position: "contents",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
            },
          },
        ],
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "subpiece",
            pieceType: "subtoken",
            startIndex: 3,
            endIndex: 4,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "subtoken",
          startIndex: 3,
          endIndex: 4,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "subpiece",
            pieceType: "subtoken",
            startIndex: 1,
            endIndex: 3,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "subtoken",
          startIndex: 1,
          endIndex: 3,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "subpiece",
            pieceType: "subtoken",
            startIndex: 1,
            endIndex: 2,
          },
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "f",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "subtoken",
          startIndex: 1,
          endIndex: 2,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          modifier: {
            type: "subpiece",
            pieceType: "subtoken",
            startIndex: 2,
            endIndex: 3,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "g",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "subtoken",
          startIndex: 2,
          endIndex: 3,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "subpiece",
            pieceType: "character",
            startIndex: 2,
            endIndex: 6,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "character",
          startIndex: 2,
          endIndex: 6,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          position: "after",
          modifier: {
            type: "subpiece",
            pieceType: "subtoken",
            startIndex: 2,
            endIndex: 3,
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "after",
        modifier: {
          type: "subpiece",
          pieceType: "subtoken",
          startIndex: 2,
          endIndex: 3,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "subpiece",
            pieceType: "character",
            startIndex: 3,
            endIndex: 4,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "character",
          startIndex: 3,
          endIndex: 4,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          modifier: {
            type: "subpiece",
            pieceType: "character",
            startIndex: 3,
            endIndex: 4,
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "f",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "subpiece",
          pieceType: "character",
          startIndex: 3,
          endIndex: 4,
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "list",
          elements: [
            {
              type: "primitive",
              selectionType: "line",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "h",
              },
            },
            {
              type: "range",
              start: {
                type: "primitive",
                mark: {
                  type: "decoratedSymbol",
                  symbolColor: "default",
                  character: "g",
                },
              },
              end: {
                type: "primitive",
                mark: {
                  type: "decoratedSymbol",
                  symbolColor: "default",
                  character: "f",
                },
              },
            },
          ],
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "list",
        elements: [
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "h",
            },
            selectionType: "line",
            position: "contents",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
          {
            type: "range",
            start: {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "g",
              },
              selectionType: "line",
              position: "contents",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
            },
            end: {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "f",
              },
              selectionType: "line",
              position: "contents",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
            },
          },
        ],
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "list",
          elements: [
            {
              type: "range",
              start: {
                type: "primitive",
                selectionType: "line",
                modifier: {
                  type: "containingScope",
                  scopeType: "namedFunction",
                },
                mark: {
                  type: "decoratedSymbol",
                  symbolColor: "default",
                  character: "g",
                },
              },
              end: {
                type: "primitive",
                mark: {
                  type: "decoratedSymbol",
                  symbolColor: "default",
                  character: "h",
                },
              },
            },
            {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "e",
              },
            },
          ],
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "list",
        elements: [
          {
            type: "range",
            start: {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "g",
              },
              selectionType: "line",
              position: "contents",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
            },
            end: {
              type: "primitive",
              mark: {
                type: "decoratedSymbol",
                symbolColor: "default",
                character: "h",
              },
              selectionType: "line",
              position: "contents",
              modifier: {
                type: "containingScope",
                scopeType: "namedFunction",
              },
            },
          },
          {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "e",
            },
            selectionType: "line",
            position: "contents",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
        ],
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
          },
          end: {
            type: "primitive",
            position: "end",
            selectionType: "line",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "line",
          position: "end",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            selectionType: "line",
          },
          end: {
            type: "primitive",
            position: "end",
            selectionType: "paragraph",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "paragraph",
          position: "end",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
          },
          end: {
            type: "primitive",
            position: "end",
            selectionType: "line",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "line",
          position: "end",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            selectionType: "line",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
          end: {
            type: "primitive",
            position: "end",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "line",
          position: "end",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
          end: {
            type: "primitive",
            modifier: {
              type: "surroundingPair",
              delimiter: "doubleQuotes",
              includePairDelimiter: true,
            },
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "h",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "h",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "surroundingPair",
            delimiter: "doubleQuotes",
            includePairDelimiter: true,
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
          end: {
            type: "primitive",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
          },
          end: {
            type: "primitive",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
          },
          end: {
            type: "primitive",
            modifier: {
              type: "surroundingPair",
              delimiter: "doubleQuotes",
              includePairDelimiter: true,
            },
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "surroundingPair",
            delimiter: "doubleQuotes",
            includePairDelimiter: true,
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            modifier: {
              type: "surroundingPair",
              delimiter: "doubleQuotes",
              includePairDelimiter: false,
            },
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "f",
            },
          },
          end: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "f",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "surroundingPair",
            delimiter: "doubleQuotes",
            includePairDelimiter: false,
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            modifier: {
              type: "surroundingPair",
              delimiter: "singleQuotes",
              includePairDelimiter: false,
            },
          },
          end: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "h",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "surroundingPair",
            delimiter: "singleQuotes",
            includePairDelimiter: false,
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "h",
          },
          selectionType: "token",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            selectionType: "line",
            modifier: {
              type: "surroundingPair",
              delimiter: "parentheses",
              includePairDelimiter: false,
            },
          },
          end: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "surroundingPair",
            delimiter: "parentheses",
            includePairDelimiter: false,
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "identity",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "range",
          start: {
            type: "primitive",
            selectionType: "line",
            modifier: {
              type: "containingScope",
              scopeType: "namedFunction",
            },
          },
          end: {
            type: "primitive",
            mark: {
              type: "decoratedSymbol",
              symbolColor: "default",
              character: "g",
            },
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "range",
        start: {
          type: "primitive",
          mark: {
            type: "cursor",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
        end: {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          selectionType: "line",
          position: "contents",
          modifier: {
            type: "containingScope",
            scopeType: "namedFunction",
          },
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "g",
          },
          modifier: {
            type: "matchingPairSymbol",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "g",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "matchingPairSymbol",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          modifier: {
            type: "matchingPairSymbol",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "matchingPairSymbol",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: false,
      },
      partialTargets: [
        {
          type: "primitive",
          selectionType: "line",
          modifier: {
            type: "matchingPairSymbol",
          },
        },
      ],
      actionPreferences: [{}],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "cursor",
        },
        selectionType: "line",
        position: "contents",
        modifier: {
          type: "matchingPairSymbol",
        },
      },
    ],
  },
  {
    input: {
      context: {
        selectionContents: [""],
        isPaste: true,
        clipboardContents: "hello",
      },
      partialTargets: [
        {
          type: "primitive",
          mark: {
            type: "decoratedSymbol",
            symbolColor: "default",
            character: "(",
          },
          modifier: {
            type: "matchingPairSymbol",
          },
        },
      ],
      actionPreferences: [{ position: "after" }],
    },
    expectedOutput: [
      {
        type: "primitive",
        mark: {
          type: "decoratedSymbol",
          symbolColor: "default",
          character: "(",
        },
        selectionType: "token",
        position: "contents",
        modifier: {
          type: "matchingPairSymbol",
        },
      },
    ],
  },
];

export default fixture;
