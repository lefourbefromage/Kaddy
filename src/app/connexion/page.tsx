import type { Metadata } from "next";
import Image from "next/image";
import { SignInForm } from "./SignInForm";
import styles from "./connexion.module.css";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Image
          src="/illustrations/logo-wordmark.webp"
          alt="Kaddy"
          width={600}
          height={222}
          preload
          className={styles.logo}
        />
        <p className={styles.tagline}>On mange quoi ce soir&nbsp;?</p>
        <Image
          src="/illustrations/connexion-maison.webp"
          alt=""
          width={900}
          height={900}
          preload
          sizes="(max-width: 899px) 212px, 451px"
          className={styles.mascot}
        />
      </section>

      <main className={styles.card}>
        <h1 className={styles.title}>Connexion au foyer</h1>
        <p className={styles.intro}>
          Retrouve le menu, la liste et le Kaddy partagés avec ton foyer.
        </p>
        <SignInForm />
      </main>
    </div>
  );
}
