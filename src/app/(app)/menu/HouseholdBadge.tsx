"use client";

import { useHousehold } from "@/components/HouseholdProvider";
import { signOutHousehold } from "@/lib/auth";
import styles from "./menu.module.css";

// Temporary sign-out until the household menu (desktop) and Réglages sheet (mobile) of step 3.
export function HouseholdBadge() {
  const state = useHousehold();
  if (state.status !== "signedIn") return null;

  return (
    <div className={styles.badge}>
      <p>
        Connecté au foyer <strong>{state.household?.name ?? state.householdId}</strong>
      </p>
      <button type="button" className={styles.signOut} onClick={() => signOutHousehold()}>
        Se déconnecter
      </button>
    </div>
  );
}
