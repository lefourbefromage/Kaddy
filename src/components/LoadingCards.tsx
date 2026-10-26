import styles from "./LoadingCards.module.css";

/**
 * Placeholder cards while a screen waits for Firestore (slow on a phone network):
 * the page never looks empty or broken, and the line says what is coming.
 */
export function LoadingCards({ label, count = 3 }: { label: string; count?: number }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <p className={styles.label}>
        <span className={styles.spinner} aria-hidden="true" />
        {label}
      </p>
      <div className={styles.cards} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={styles.card} style={{ animationDelay: `${i * 160}ms` }}>
            <span className={styles.lineTitle} />
            <span className={styles.lineSub} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Whole-page wait, before any screen can draw (the signed-in household is being checked). */
export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <p className={styles.label}>
        <span className={styles.spinner} aria-hidden="true" />
        {label}
      </p>
    </div>
  );
}
