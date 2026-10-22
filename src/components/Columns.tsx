import { Children, type ReactNode } from "react";
import styles from "./Columns.module.css";

/**
 * Cards dealt round-robin into fixed columns. CSS columns rebalance whenever a card changes
 * height (typing, suggestions opening, a ticked row leaving), which made cards jump from one
 * column to another. The gap comes from `--columns-gap` on a parent.
 */
export function Columns({ count, children }: { count: number; children: ReactNode }) {
  const items = Children.toArray(children);
  if (count === 1) return <div className={styles.stack}>{items}</div>;
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }, (_, c) => (
        <div key={c} className={styles.stack}>
          {items.filter((_, i) => i % count === c)}
        </div>
      ))}
    </div>
  );
}
