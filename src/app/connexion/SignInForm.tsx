"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInHousehold, type SignInError } from "@/lib/auth";
import { useHousehold } from "@/components/HouseholdProvider";
import styles from "./connexion.module.css";

type FormError = SignInError | "empty";

const MESSAGES: Record<FormError, string> = {
  empty: "Renseigne le nom du foyer et son mot de passe.",
  bad: "Nom du foyer ou mot de passe incorrect. Vérifie l’orthographe du foyer et les majuscules du mot de passe.",
  tooMany: "Trop d’essais d’affilée. Patiente quelques minutes avant de réessayer.",
  network: "Pas de connexion internet. Réessaie dès que le réseau revient.",
  unknown: "La connexion n’a pas abouti. Réessaie dans un instant.",
};

export function SignInForm() {
  const router = useRouter();
  const state = useHousehold();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<FormError | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0); // replays the shake on each failure

  // Already signed in (or just signed in): straight to the menu.
  useEffect(() => {
    if (state.status === "signedIn") router.replace("/menu");
  }, [state.status, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password) {
      setError("empty");
      setAttempt((n) => n + 1);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await signInHousehold(name, password, remember);
    if (result) {
      setError(result);
      setAttempt((n) => n + 1);
      setBusy(false);
    }
  }

  const nameInvalid = error === "bad" || (error === "empty" && !name.trim());
  const passwordInvalid = error === "bad" || (error === "empty" && !password);

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label htmlFor="foyer" className={styles.label}>
          Nom du foyer
        </label>
        <div className={styles.input} data-invalid={nameInvalid || undefined}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={styles.inputIcon}>
            <path d="M4 11l8-6.5 8 6.5" />
            <path d="M6 9.5V19h12V9.5" />
            <path d="M10 19v-5h4v5" />
          </svg>
          <input
            id="foyer"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ex. Famille Martin"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            aria-invalid={nameInvalid}
            aria-describedby="connexion-erreur"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="mot-de-passe" className={styles.label}>
          Mot de passe
        </label>
        <div className={`${styles.input} ${styles.inputWithButton}`} data-invalid={passwordInvalid || undefined}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={styles.inputIcon}>
            <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
          </svg>
          <input
            id="mot-de-passe"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Le mot de passe du foyer"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            aria-invalid={passwordInvalid}
            aria-describedby="connexion-erreur connexion-aide"
          />
          <button
            type="button"
            className={styles.eye}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5S3 12 3 12z" />
              <circle cx="12" cy="12" r="2.8" />
              {showPassword && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>
        <span id="connexion-aide" className={styles.hint}>
          Le même pour tout le foyer.
        </span>
      </div>

      <label className={styles.remember}>
        <input
          type="checkbox"
          className={styles.rememberInput}
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <span className={styles.rememberBox} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        Rester connecté sur cet appareil
      </label>

      <div id="connexion-erreur" className={styles.errorSlot}>
        {error && (
          <div key={attempt} className={styles.error} role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5M12 16.5v.01" />
            </svg>
            <span>{MESSAGES[error]}</span>
          </div>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={busy}>
        {busy ? "Connexion…" : "Se connecter"}
        <span className={styles.submitIcon} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    </form>
  );
}
