"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp, useHydrated } from "@/lib/store";

/** Waits for local state to load, and sends new users to onboarding. */
export function Gate({ children, requireProfile = true }: { children: ReactNode; requireProfile?: boolean }) {
  const hydrated = useHydrated();
  const profile = useApp((s) => s.profile);
  const router = useRouter();
  useEffect(() => {
    if (hydrated && requireProfile && !profile) router.replace("/welcome");
  }, [hydrated, profile, requireProfile, router]);
  if (!hydrated || (requireProfile && !profile)) return <div className="page" />;
  return <>{children}</>;
}
