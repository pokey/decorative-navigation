export type ConstructorMap<T> = {
  [P in keyof T]: new (t: T) => T[P];
};

function makeGetter<GraphType, K extends keyof GraphType>(
  graph: GraphType,
  components: Partial<GraphType>,
  constructorMap: ConstructorMap<GraphType>,
  key: K
): () => GraphType[K] {
  return () => {
    var returnValue: GraphType[K];

    if (components[key] == null) {
      const constructor = constructorMap[key] as new (
        graph: GraphType
      ) => GraphType[K];
      returnValue = new constructor(graph);
      components[key] = returnValue;
    } else {
      returnValue = components[key] as GraphType[K];
    }

    return returnValue;
  };
}

export function makeGraph<GraphType extends object>(
  constructorMap: ConstructorMap<GraphType>
) {
  const components: Partial<GraphType> = {};
  const graph: Partial<GraphType> = {};

  Object.keys(constructorMap).forEach((key: keyof GraphType | PropertyKey) => {
    Object.defineProperty(graph, key, {
      get: makeGetter(
        graph as GraphType,
        components,
        constructorMap,
        key as keyof GraphType
      ),
    });
  });

  return graph as GraphType;
}
