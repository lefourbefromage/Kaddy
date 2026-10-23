import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { clearIndexedDbPersistence, terminate } from "firebase/firestore";
import { auth, db } from "./firebase";
import { householdEmail, slugify } from "./household";

export type SignInError = "bad" | "tooMany" | "network" | "unknown";

/** Signs the household in. Resolves to null on success, or the error kind. */
export async function signInHousehold(
  name: string,
  password: string,
  remember: boolean,
): Promise<SignInError | null> {
  const householdId = slugify(name);
  if (!householdId) return "bad";
  try {
    // "Rester connecté": survives closing the browser, otherwise this tab only.
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, householdEmail(householdId), password);
    return null;
  } catch (e) {
    const code = e instanceof FirebaseError ? e.code : "";
    if (code === "auth/too-many-requests") return "tooMany";
    if (code === "auth/network-request-failed") return "network";
    if (
      code === "auth/invalid-credential" ||
      code === "auth/invalid-email" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password"
    ) {
      return "bad";
    }
    return "unknown";
  }
}

/** Signs out and leaves nothing of the household on this device, the offline copy included. */
export async function signOutHousehold() {
  await signOut(auth);
  await terminate(db);
  // Refused while another tab still has the database open: that tab keeps its copy.
  await clearIndexedDbPersistence(db).catch(() => {});
  // A terminated Firestore cannot be reopened: a fresh page, which sends to /connexion.
  window.location.reload();
}
