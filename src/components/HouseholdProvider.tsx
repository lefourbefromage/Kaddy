"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { signOutHousehold } from "@/lib/auth";

export type Household = {
  name: string;
  slug: string;
  aisleOrder: string[];
};

type HouseholdState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; householdId: string; household: Household | null };

const HouseholdContext = createContext<HouseholdState>({ status: "loading" });

// The household of the signed-in Auth user, for an offline start (storage may be unavailable).
const storageKey = (uid: string) => `kaddy.household.${uid}`;
function remember(uid: string, hid: string) {
  try {
    localStorage.setItem(storageKey(uid), hid);
  } catch {}
}
function recall(uid: string) {
  try {
    return localStorage.getItem(storageKey(uid));
  } catch {
    return null;
  }
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HouseholdState>({ status: "loading" });
  const householdId = state.status === "signedIn" ? state.householdId : null;

  // Who is signed in: the householdId comes from the token's custom claim.
  useEffect(
    () =>
      onIdTokenChanged(auth, async (user) => {
        if (!user) {
          setState({ status: "signedOut" });
          return;
        }
        let hid: string | null;
        try {
          const { claims } = await user.getIdTokenResult();
          hid = typeof claims.householdId === "string" ? claims.householdId : null;
          if (hid) remember(user.uid, hid);
        } catch {
          // Offline with an expired token (it lasts an hour): keep the last known household,
          // Firestore serves its cache meanwhile.
          hid = recall(user.uid);
          if (!hid) return;
        }
        if (!hid) {
          // An Auth user without a household cannot read anything: sign it out.
          await signOutHousehold();
          return;
        }
        setState((s) =>
          s.status === "signedIn" && s.householdId === hid
            ? s
            : { status: "signedIn", householdId: hid, household: null },
        );
      }),
    [],
  );

  // The household document (name, aisle order), kept in sync.
  useEffect(() => {
    if (!householdId) return;
    return onSnapshot(
      doc(db, "households", householdId),
      (snap) => {
        const household = snap.exists() ? (snap.data() as Household) : null;
        setState((s) =>
          s.status === "signedIn" && s.householdId === householdId ? { ...s, household } : s,
        );
      },
      // Signing out revokes access before this listener is torn down: nothing to report.
      () => {},
    );
  }, [householdId]);

  return <HouseholdContext.Provider value={state}>{children}</HouseholdContext.Provider>;
}

export const useHousehold = () => useContext(HouseholdContext);

/** The signed-in household's id, for screens rendered inside RequireHousehold. */
export function useHouseholdId() {
  const state = useContext(HouseholdContext);
  if (state.status !== "signedIn") throw new Error("useHouseholdId outside RequireHousehold");
  return state.householdId;
}
