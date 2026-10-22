"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";

/**
 * Modal dialog on the native <dialog>: focus kept inside, Esc closes, focus returns to
 * the opener. Centred card on desktop, full-screen sheet on mobile. Mark a field with
 * data-autofocus to focus it on open.
 */
export function Modal({
  labelledBy,
  onClose,
  closeOnVeil = true,
  as = "div",
  onSubmit,
  wide = false,
  narrow = false,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  /** false for forms: a stray tap outside must not lose what was typed */
  closeOnVeil?: boolean;
  as?: "div" | "form";
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  wide?: boolean;
  /** short pickers: a small card on desktop */
  narrow?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // showModal focuses the first focusable element; a field can ask for focus instead.
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const panelClass = `${styles.panel} ${wide ? styles.wide : ""} ${narrow ? styles.narrow : ""}`;
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault(); // React owns the open state
        onClose();
      }}
      onClick={(e) => {
        if (closeOnVeil && e.target === e.currentTarget) onClose();
      }}
    >
      {as === "form" ? (
        <form className={panelClass} onSubmit={onSubmit} noValidate>
          {children}
        </form>
      ) : (
        <div className={panelClass}>{children}</div>
      )}
    </dialog>
  );
}
