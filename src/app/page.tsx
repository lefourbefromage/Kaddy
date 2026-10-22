import Image from "next/image";
import styles from "./page.module.css";

// Temporary home: replaced by the sign-in redirect (step 2) and the shell (step 3).
export default function Home() {
  return (
    <main className={styles.page}>
      <Image
        src="/illustrations/logo-wordmark.webp"
        alt="Kaddy"
        width={600}
        height={222}
        preload
        className={styles.logo}
      />
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
          <h1 className="kd-display">On mange quoi ce soir ?</h1>
          <p className={styles.subtitle}>Kaddy se prépare. Le menu arrive bientôt.</p>
        </div>
      </header>
    </main>
  );
}
