"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useHousehold } from "./HouseholdProvider";
import { LoadingScreen } from "./LoadingCards";

/** Renders its children only for a signed-in household; otherwise goes to /connexion. */
export function RequireHousehold({ children }: { children: ReactNode }) {
  const state = useHousehold();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "signedOut") router.replace("/connexion");
  }, [state.status, router]);

  if (state.status === "loading") return <LoadingScreen label="Ouverture de ton foyer…" />;
  return state.status === "signedIn" ? children : null;
}
