// A tiny in-memory router standing in for next/navigation inside the single-page build.
import { useSyncExternalStore } from "react";

let current = "/";
const listeners = new Set<() => void>();
const ROUTES = ["/chat/:id", "/report/:sid"];

function go(to: string) {
  current = to;
  listeners.forEach((l) => l());
  try {
    window.scrollTo(0, 0);
  } catch {
    /* ignore */
  }
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useLocation = () => useSyncExternalStore(subscribe, () => current, () => current);

const router = { push: go, replace: go, back: () => go("/"), refresh: () => {}, prefetch: () => {} };
export const useRouter = () => router;
export const usePathname = () => useLocation().split("?")[0];
export function useSearchParams() {
  const q = useLocation().split("?")[1] ?? "";
  return new URLSearchParams(q);
}
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/");
  const b = path.split("/");
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
export function useParams<T = Record<string, string>>(): T {
  const path = usePathname();
  for (const r of ROUTES) {
    const m = matchPath(r, path);
    if (m) return m as T;
  }
  return {} as T;
}
export function notFound(): never {
  go("/");
  throw new Error("not found");
}
