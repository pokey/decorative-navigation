import Actions from "./actions";
import EditStyles from "./editStyles";
import { Graph } from "./Types";
import { ConstructorMap } from "./makeGraph";
import NavigationMap from "./NavigationMap";

const graphConstructors: ConstructorMap<Graph> = {
  actions: Actions,
  editStyles: EditStyles,
  navigationMap: NavigationMap,
};

export default graphConstructors;
