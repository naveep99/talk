// React comes from the pinned UMD build on the page (window.React).
const R = (globalThis as unknown as { React: typeof import("react") }).React;
export default R;
export const {
  useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useSyncExternalStore,
  useDebugValue, useContext, createContext, Fragment, Suspense, createElement, StrictMode,
} = R;
