import type { Metadata } from "next";
import Image from "next/image";
import { HouseholdBadge } from "./HouseholdBadge";
import styles from "./menu.module.css";

export const metadata: Metadata = { title: "Menu" };

// Temporary: the real Menu screen is step 5, the shell (household menu, Réglages) step 3.
export default function MenuPage() {
  return (
    <main className={styles.page}>
      <header className={styles.title}>
        <Image
          src="/illustrations/titre-menu.webp"
          alt=""
          width={423}
          height={280}
          preload
          className={styles.illustration}
        />
        <div className={styles.titleText}>
          <h1 className="kd-display">Menu</h1>
          <p className={styles.subtitle}>Le menu de la semaine arrive bientôt.</p>
        </div>
      </header>
      <HouseholdBadge />
    </main>
  );
}
