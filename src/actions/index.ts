import { Action, ActionRecord, Graph } from "../Types";
import Clear from "./clear";
import Copy from "./copy";
import Cut from "./cut";
import Delete from "./delete";
import ExtractVariable from "./extractVariable";
import { Fold, Unfold } from "./fold";
import { InsertLineBefore, InsertLineAfter } from "./InsertLine";
import {
  SetSelection,
  SetSelectionBefore,
  SetSelectionAfter,
} from "./setSelection";
import Wrap from "./wrap";
import { ScrollToTop, ScrollToCenter, ScrollToBottom } from "./Scroll";
import { IndentLines, OutdentLines } from "./Indent";
import { CommentLines } from "./Comment";
import Paste from "./Paste";
import { Bring, Move, Swap } from "./BringMoveSwap";
import GetText from "./GetText";
import { FindInFiles } from "./Find";
import SetBreakpoint from "./SetBreakpoint";

class Actions implements ActionRecord {
  constructor(private graph: Graph) {}

  // TODO NB Remove when user had time to migrate to new talon code
  use = new Bring(this.graph);

  bring = new Bring(this.graph);
  clear = new Clear(this.graph);
  commentLines = new CommentLines(this.graph);
  copy = new Copy(this.graph);
  cut = new Cut(this.graph);
  delete = new Delete(this.graph);
  extractVariable = new ExtractVariable(this.graph);
  findInFiles = new FindInFiles(this.graph);
  fold = new Fold(this.graph);
  getText = new GetText(this.graph);
  indentLines = new IndentLines(this.graph);
  insertLineBefore = new InsertLineBefore(this.graph);
  insertLineAfter = new InsertLineAfter(this.graph);
  move = new Move(this.graph);
  outdentLines = new OutdentLines(this.graph);
  paste = new Paste(this.graph);
  scrollToBottom = new ScrollToBottom(this.graph);
  scrollToCenter = new ScrollToCenter(this.graph);
  scrollToTop = new ScrollToTop(this.graph);
  setBreakpoint = new SetBreakpoint(this.graph);
  setSelection = new SetSelection(this.graph);
  setSelectionAfter = new SetSelectionAfter(this.graph);
  setSelectionBefore = new SetSelectionBefore(this.graph);
  swap = new Swap(this.graph);
  unfold = new Unfold(this.graph);
  wrap = new Wrap(this.graph);
}

export default Actions;
