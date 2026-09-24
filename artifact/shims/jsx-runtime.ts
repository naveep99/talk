const R = (globalThis as unknown as { React: typeof import("react") }).React;
export const Fragment = R.Fragment;
export function jsx(type: never, props: Record<string, unknown>, key?: string) {
  return R.createElement(type, key === undefined ? props : { ...props, key });
}
export const jsxs = jsx;
