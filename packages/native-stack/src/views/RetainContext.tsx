import * as React from 'react';
import type {
  ParamListBase,
  Route,
  StackNavigationState,
} from '@react-navigation/native';

import type { NativeStackNavigationHelpers } from '../types';

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
  [key: string]: Route<any>;
};

export function useRetainContext(
  state: StackNavigationState<ParamListBase>,
  navigation: NativeStackNavigationHelpers
) {
  const [retainedScenes, setRetainedScenes] = React.useState<RetainedScenes>(
    {}
  );
  const latestState = React.useRef({ state, retainedScenes });
  React.useEffect(() => {
    latestState.current = { state, retainedScenes };
  });

  const retainContext = React.useMemo<RetainContextT>(
    () => ({
      retain() {
        const { state } = latestState.current;
        const route = state.routes[state.routes.length - 1];
        setRetainedScenes((screens) => ({ ...screens, [route.key]: route }));
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

        const route = retainedScenes[key];
        if (!route) {
          return false;
        }

        const routes = state.routes.filter((route) => route.key !== key);
        routes.push(route);
        navigation.dispatch({
          type: 'RESET',
          payload: { ...state, index: routes.length - 1, routes },
        });

        return true;
      },
      supported: true,
    }),
    []
  );

  const routeKeys = state.routes.reduce(
    (map, route) => ((map[route.key] = true), map),
    {} as { [key: string]: true }
  );

  // Routes that were marked as 'retain' and have been removed from the stack.
  const hiddenRoutes = Object.keys(retainedScenes)
    .filter((k) => !routeKeys[k])
    .map((k) => retainedScenes[k]);

  return { retainContext, hiddenRoutes };
}
