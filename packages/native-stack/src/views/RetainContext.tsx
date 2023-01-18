import * as React from 'react';
import type {
  ParamListBase,
  Route,
  StackNavigationState,
} from '@react-navigation/native';

import type {
  NativeStackDescriptorMap,
  NativeStackNavigationHelpers,
} from '../types';

type RetainContextT = {
  retain(): string;
  release(key: string): boolean;
  restore(key: string): boolean;
  supported: boolean;
};

export const RetainContext = React.createContext<RetainContextT>({
  retain() {
    throw new Error(`Not in a native screen stack`);
  },
  release() {
    throw new Error(`Not in a native screen stack`);
  },
  restore() {
    throw new Error(`Not in a native screen stack`);
  },
  supported: false,
});

type RetainedScenes = {
  [key: string]: {
    route: Route<any>;
    descriptor: NativeStackDescriptorMap['key'];
  };
};

export function useRetainContext(
  state: StackNavigationState<ParamListBase>,
  navigation: NativeStackNavigationHelpers,
  descriptors: NativeStackDescriptorMap
) {
  const [retainedScenes, setRetainedScenes] = React.useState<RetainedScenes>(
    {}
  );
  const latestState = React.useRef({ state, retainedScenes, descriptors });
  React.useEffect(() => {
    latestState.current = { state, retainedScenes, descriptors };
  });

  const retainContext = React.useMemo<RetainContextT>(
    () => ({
      retain() {
        const { state, descriptors } = latestState.current;
        const route = state.routes[state.routes.length - 1];
        setRetainedScenes((screens) => ({
          ...screens,
          [route.key]: {
            route,
            descriptor: descriptors[route.key],
          },
        }));
        return route.key;
      },
      release(key) {
        setRetainedScenes((screens) => {
          const { [key]: _, ...rest } = screens;
          return rest;
        });
        return latestState.current.retainedScenes[key] != null;
      },
      restore(key) {
        const { retainedScenes, state } = latestState.current;

        // Remove from retained
        setRetainedScenes((screens) => {
          const { [key]: _, ...rest } = screens;
          return rest;
        });

        const route = retainedScenes[key].route;
        if (!route) {
          return false;
        }

        const index = state.routes.findIndex((r) => r.key === key);
        const routes =
          index !== -1
            ? state.routes.slice(0, index + 1)
            : state.routes.slice();
        if (index === -1) {
          routes.push(route);
        }
        navigation.dispatch({
          type: 'RESET',
          payload: { ...state, index: routes.length - 1, routes },
        });
        // navigation.dispatch(({
        //   type: 'PUSH',
        //   payload: {name: route.name, params: route.params}
        // }))

        return true;
      },
      supported: true,
    }),
    []
  );

  const routeKeys = state.routes.reduce((map, route) => {
    map[route.key] = true;
    return map;
  }, {} as { [key: string]: true });

  // Routes that were marked as 'retain' and have been removed from the stack.
  const hiddenRoutes: Route<any>[] = [];
  const hiddenDescriptors: NativeStackDescriptorMap = {};
  Object.keys(retainedScenes).forEach((key) => {
    if (!routeKeys[key]) {
      hiddenRoutes.push(retainedScenes[key].route);
      hiddenDescriptors[key] = retainedScenes[key].descriptor;
    }
  });

  return {
    retainContext,
    hiddenRoutes,
    hiddenDescriptors,
    retainedKeys: Object.keys(retainedScenes),
  };
}
