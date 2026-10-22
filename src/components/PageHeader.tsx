import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type Illustration = { src: string; width: number; height: number };

// The title illustrations of public/illustrations/titre-*.webp.
export const TITLE_ILLUSTRATIONS = {
  menu: { src: "/illustrations/titre-menu.webp", width: 423, height: 280 },
  liste: { src: "/illustrations/titre-liste-de-courses.webp", width: 353, height: 280 },
  recettes: { src: "/illustrations/titre-recettes.webp", width: 721, height: 450 },
  kaddy: { src: "/illustrations/titre-mon-kaddy.webp", width: 397, height: 280 },
} satisfies Record<string, Illustration>;

/** Page title, always paired with its illustration (left on desktop, right on mobile). */
export function PageHeader({
  title,
  subtitle,
  illustration,
  illustrationClassName,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  illustration: Illustration;
  /** An extra class on the picture (Mon Kaddy animates it when everything is ticked). */
  illustrationClassName?: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <Image
          src={illustration.src}
          alt=""
          width={illustration.width}
          height={illustration.height}
          preload
          className={illustrationClassName ? `${styles.illustration} ${illustrationClassName}` : styles.illustration}
        />
        <div className={styles.text}>
          <h1 className="kd-display">{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
