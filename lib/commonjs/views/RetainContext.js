"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RetainContext = void 0;
exports.useRetainContext = useRetainContext;
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
 * This context allows you to retain screens in memory, even after
 * they have been popped off the stack. This is important for
 * supporting native iOS "Picture in Picture" mode, as the
 * originating UIViewController must be retained in memory for the
 * PiP overlay to continue running.
 * Retained screens can also be "restored" to the top of the stack,
 * for example when the user taps the button in the PiP overlay
 * to return to the app.
 */
const RetainContext = /*#__PURE__*/React.createContext({
  retain() {
    throw new Error(`Not in a native screen stack`);
  },
  release() {
    throw new Error(`Not in a native screen stack`);
  },
  restore() {
    throw new Error(`Not in a native screen stack`);
  },
  supported: false
});
exports.RetainContext = RetainContext;
function useRetainContext(state, navigation, descriptors) {
  const [retainedScenes, setRetainedScenes] = React.useState({});
  const latestValues = React.useRef({
    state,
    retainedScenes,
    descriptors
  });
  React.useEffect(() => {
    latestValues.current = {
      state,
      retainedScenes,
      descriptors
    };
  });
  const retainContext = React.useMemo(() => ({
    retain() {
      const {
        state,
        descriptors
      } = latestValues.current;
      const route = state.routes[state.routes.length - 1];
      setRetainedScenes(screens => ({
        ...screens,
        [route.key]: {
          route,
          descriptor: descriptors[route.key]
        }
      }));
      return route.key;
    },
    release(key) {
      setRetainedScenes(screens => {
        const {
          [key]: _,
          ...rest
        } = screens;
        return rest;
      });
      return latestValues.current.retainedScenes[key] != null;
    },
    restore(key) {
      var _retainedScenes$key;
      const {
        retainedScenes,
        state
      } = latestValues.current;
      const route = (_retainedScenes$key = retainedScenes[key]) === null || _retainedScenes$key === void 0 ? void 0 : _retainedScenes$key.route;
      if (!route) {
        return false;
      }

      // Remove from retained
      setRetainedScenes(screens => {
        const {
          [key]: _,
          ...rest
        } = screens;
        return rest;
      });
      const index = state.routes.findIndex(r => r.key === key);
      const routes = index !== -1 ? state.routes.slice(0, index) : state.routes.slice();
      routes.push(route);
      navigation.dispatch({
        type: 'RESET',
        payload: {
          ...state,
          index: routes.length - 1,
          routes
        }
      });
      return true;
    },
    supported: true
  }), []);
  const routeKeys = state.routes.reduce((map, route) => {
    map[route.key] = true;
    return map;
  }, {});

  // Routes that were marked as 'retain' and have been removed from the stack,
  // for which we still want to keep the memory allocated.
  const hiddenRoutes = [];
  const hiddenDescriptors = {};
  Object.keys(retainedScenes).forEach(key => {
    if (!routeKeys[key]) {
      hiddenRoutes.push(retainedScenes[key].route);
      hiddenDescriptors[key] = retainedScenes[key].descriptor;
    }
  });
  return {
    retainContext,
    hiddenRoutes,
    hiddenDescriptors,
    retainedKeys: Object.keys(retainedScenes)
  };
}
//# sourceMappingURL=RetainContext.js.map