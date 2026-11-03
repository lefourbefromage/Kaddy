"use client";

import { useEffect, useRef, useState } from "react";
import { drawMenuImage, shareMenuImage, type ShareOutcome, type ShareWeek } from "./menuImage";
import styles from "./menu.module.css";

const FEEDBACK: Partial<Record<ShareOutcome | "error", { short: string; spoken: string }>> = {
  copied: { short: "Image copiée", spoken: "Image du menu copiée, tu peux la coller dans ta conversation." },
  downloaded: { short: "Image téléchargée", spoken: "Image du menu téléchargée." },
  error: { short: "Partage impossible", spoken: "Le partage du menu n’a pas marché, réessaie." },
};

/** "Partager": the displayed week as a picture, sent through the share sheet or the clipboard. */
export function ShareMenuButton({ week, filename, ready }: { week: ShareWeek; filename: string; ready: boolean }) {
  const [feedback, setFeedback] = useState<ShareOutcome | "error" | null>(null);
  const [busy, setBusy] = useState(false);
  // Drawn ahead of the click: Safari only shares or copies while the tap is still "fresh".
  const cache = useRef<{ week: ShareWeek; blob: Blob } | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const timer = setTimeout(() => {
      drawMenuImage(week)
        .then((blob) => {
          if (alive) cache.current = { week, blob };
        })
        .catch(() => {});
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [week, ready]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function share() {
    setBusy(true);
    try {
      const blob = cache.current?.week === week ? cache.current.blob : await drawMenuImage(week);
      setFeedback(await shareMenuImage(blob, filename));
    } catch {
      setFeedback("error");
    } finally {
      setBusy(false);
    }
  }

  const message = feedback ? FEEDBACK[feedback] : undefined;
  return (
    <>
      <button type="button" className={styles.shareButton} onClick={share} disabled={!ready || busy}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
          <path d="M8 11H6.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H16" />
        </svg>
        <span aria-hidden={message ? true : undefined}>{message?.short ?? "Partager"}</span>
        {message && <span className={styles.srOnly}>Partager</span>}
      </button>
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {message?.spoken}
      </span>
    </>
  );
}
