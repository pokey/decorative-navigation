import {
  Action,
  ActionPreferences,
  ActionReturnValue,
  Graph,
  TypedSelection,
} from "../Types";
import {
  SourceBreakpoint,
  Location,
  debug,
  Uri,
  Range,
  Breakpoint,
} from "vscode";
import displayPendingEditDecorations from "../editDisplayUtils";

function getBreakpoint(uri: Uri, line: number) {
  return debug.breakpoints.find((breakpoint) => {
    if (breakpoint instanceof SourceBreakpoint) {
      return (
        (breakpoint as SourceBreakpoint).location.uri.toString() ===
          uri.toString() &&
        (breakpoint as SourceBreakpoint).location.range.start.line === line
      );
    }
    return false;
  });
}

export default class SetBreakpoint implements Action {
  targetPreferences: ActionPreferences[] = [{ insideOutsideType: "inside" }];

  constructor(private graph: Graph) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [
    TypedSelection[],
    TypedSelection[]
  ]): Promise<ActionReturnValue> {
    await displayPendingEditDecorations(
      targets,
      this.graph.editStyles.referenced,
      this.graph.editStyles.referencedLine
    );

    const lines = targets.flatMap((target) => {
      const { start, end } = target.selection.selection;
      const lines = [];
      for (let i = start.line; i <= end.line; ++i) {
        lines.push({
          uri: target.selection.editor.document.uri,
          line: i,
        });
      }
      return lines;
    });

    const toAdd: Breakpoint[] = [];
    const toRemove: Breakpoint[] = [];

    lines.forEach(({ uri, line }) => {
      const existing = getBreakpoint(uri, line);
      if (existing) {
        toRemove.push(existing);
      } else {
        toAdd.push(
          new SourceBreakpoint(new Location(uri, new Range(line, 0, line, 0)))
        );
      }
    });

    debug.addBreakpoints(toAdd);
    debug.removeBreakpoints(toRemove);

    const thatMark = targets.map((target) => target.selection);

    return { returnValue: null, thatMark };
  }
}
