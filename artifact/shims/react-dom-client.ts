const D = (globalThis as unknown as { ReactDOM: typeof import("react-dom/client") }).ReactDOM;
export const createRoot = D.createRoot;
export default D;
