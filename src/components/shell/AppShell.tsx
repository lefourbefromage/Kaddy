"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import aisles from "../../../data/aisles.json";
import { useHousehold } from "../HouseholdProvider";
import { signOutHousehold } from "@/lib/auth";
import { NAV_LINKS, isActive } from "./nav";
import {
  IconAisles,
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconHouse,
  IconSettings,
  IconSignOut,
} from "./icons";
import styles from "./shell.module.css";

const AISLE_LABELS = new Map(aisles.map((a) => [a.id, a.label]));

/** Shared frame of the signed-in screens: desktop top bar, mobile top row + bottom bar + Réglages sheet. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const state = useHousehold();
  const name =
    state.status === "signedIn" ? (state.household?.name ?? state.householdId) : "";
  const aisleOrder = state.status === "signedIn" ? (state.household?.aisleOrder ?? []) : [];
  const aislePreview = `${aisleOrder
    .slice(0, 3)
    .map((id) => AISLE_LABELS.get(id))
    .filter(Boolean)
    .join(", ")}…`;

  return (
    <div className={styles.shell}>
      <DesktopHeader pathname={pathname} name={name} />
      <div className={styles.content}>
        <MobileTopBar name={name} aislePreview={aislePreview} />
        {children}
      </div>
      <MobileNav pathname={pathname} />
    </div>
  );
}

function Logo({ size }: { size: "desktop" | "mobile" }) {
  return (
    <Link href="/menu" aria-label="Kaddy, accueil" className={styles.logoLink}>
      <Image
        src="/illustrations/app-icon.webp"
        alt=""
        width={128}
        height={128}
        className={size === "desktop" ? styles.appIcon : styles.appIconMobile}
      />
      <Image
        src="/illustrations/logo-wordmark.webp"
        alt=""
        width={600}
        height={222}
        preload
        className={size === "desktop" ? styles.wordmark : styles.wordmarkMobile}
      />
    </Link>
  );
}

/* ---------- Desktop ---------- */

function DesktopHeader({ pathname, name }: { pathname: string; name: string }) {
  return (
    <header className={styles.desktopHeader}>
      <div className={styles.topBar}>
        <Logo size="desktop" />
        <nav aria-label="Navigation principale" className={styles.desktopNav}>
          {NAV_LINKS.map((link) => {
            const { href, label, Icon } = link;
            const active = isActive(pathname, link);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={styles.desktopLink}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>
        <HouseholdMenu pathname={pathname} name={name} />
      </div>
    </header>
  );
}

function HouseholdMenu({ pathname, name }: { pathname: string; name: string }) {
  const ref = useRef<HTMLDetailsElement>(null);

  // A <details> menu stays open on its own: close it on navigation, outside click and Esc.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        el.open = false;
        el.querySelector("summary")?.focus();
      } else if (!el.contains(e.target as Node)) {
        el.open = false;
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={ref} className={styles.household}>
      <summary
        aria-label={`Foyer ${name} : réglages et déconnexion`}
        className={styles.householdSummary}
      >
        <span className={styles.householdAvatar} aria-hidden="true">
          <IconHouse size={17} />
        </span>
        <span className={styles.householdName}>{name}</span>
        <IconChevronDown className={styles.chevron} />
      </summary>
      <div className={styles.householdMenu}>
        <Link href="/reglages/rayons" className={styles.householdItem}>
          <IconAisles size={18} />
          Ordre des rayons
        </Link>
        <button type="button" className={styles.householdItem} onClick={() => signOutHousehold()}>
          <IconSignOut size={18} />
          Se déconnecter
        </button>
      </div>
    </details>
  );
}

/* ---------- Mobile ---------- */

function MobileTopBar({ name, aislePreview }: { name: string; aislePreview: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  return (
    <div className={styles.mobileTop}>
      <Logo size="mobile" />
      <button
        type="button"
        aria-label="Réglages"
        aria-haspopup="dialog"
        className={styles.settingsButton}
        onClick={() => dialogRef.current?.showModal()}
      >
        <IconSettings size={22} />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.sheet}
        aria-labelledby="reglages-titre"
        // Tap on the veil (outside the sheet box) closes it.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className={styles.sheetBody}>
          <div className={styles.sheetHandle} aria-hidden="true" />
          <div className={styles.sheetHeader}>
            <h2 id="reglages-titre" className={styles.sheetTitle}>
              Réglages
            </h2>
            <button
              type="button"
              aria-label="Fermer les réglages"
              className={styles.sheetClose}
              onClick={() => dialogRef.current?.close()}
            >
              <IconClose />
            </button>
          </div>
          <div className={styles.sheetHousehold}>
            <span className={styles.sheetAvatar} aria-hidden="true">
              <IconHouse size={22} />
            </span>
            <span className={styles.sheetHouseholdText}>
              <strong>{name}</strong>
              <span>Connecté sur cet appareil</span>
            </span>
          </div>
          <nav aria-label="Réglages" className={styles.sheetNav}>
            <Link href="/reglages/rayons" className={styles.sheetRow}>
              <IconAisles />
              <span className={styles.sheetRowText}>
                Ordre des rayons
                <span>{aislePreview}</span>
              </span>
              <IconChevronRight />
            </Link>
            <div className={styles.sheetDivider} aria-hidden="true" />
            <button type="button" className={styles.sheetRow} onClick={() => signOutHousehold()}>
              <IconSignOut />
              <span className={styles.sheetRowText}>Se déconnecter</span>
            </button>
          </nav>
        </div>
      </dialog>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Navigation principale" className={`${styles.mobileNav} kd-on-dark`}>
      {NAV_LINKS.map((link) => {
        const { href, short, Icon } = link;
        const active = isActive(pathname, link);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={styles.mobileLink}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 2} />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
