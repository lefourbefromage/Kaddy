"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getDocsFromCache, type QuerySnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { keyOf } from "./normalize";

export type CatalogProduct = {
  key: string;
  name: string;
  aisleId: string;
  aliases: string[];
  defaultUnit: string | null;
};

export type Catalog = {
  products: CatalogProduct[];
  /** keyOf(name or alias) → product */
  byKey: Map<string, CatalogProduct>;
};

// A few hundred read-only entries: loaded once per session, kept in memory (docs/data-model.md).
let pending: Promise<Catalog> | null = null;

// The catalogue barely changes (scripts/seed-catalog.mjs): the offline copy is used, and the
// server is read again at most once a day, instead of ~400 billed reads on every app start.
// Renamed (".v2") when the aisles change, so every phone reads the new catalogue at once.
const FETCHED_AT = "kaddy.catalog.fetchedAt.v2";
const REFRESH_MS = 24 * 60 * 60 * 1000;

async function read(): Promise<QuerySnapshot> {
  const ref = collection(db, "catalog");
  let fetchedAt = 0;
  try {
    fetchedAt = Number(localStorage.getItem(FETCHED_AT)) || 0;
  } catch {}
  if (Date.now() - fetchedAt < REFRESH_MS) {
    const cached = await getDocsFromCache(ref).catch(() => null);
    if (cached && !cached.empty) return cached;
  }
  const snap = await getDocs(ref);
  if (!snap.metadata.fromCache) {
    try {
      localStorage.setItem(FETCHED_AT, String(Date.now()));
    } catch {}
  }
  return snap;
}

async function load(): Promise<Catalog> {
  const snap = await read();
  const products = snap.docs.map((d) => ({ key: d.id, ...(d.data() as Omit<CatalogProduct, "key">) }));
  const byKey = new Map<string, CatalogProduct>();
  for (const p of products) byKey.set(p.key, p);
  for (const p of products) {
    for (const alias of [p.name, ...p.aliases]) {
      const k = keyOf(alias);
      if (!byKey.has(k)) byKey.set(k, p);
    }
  }
  return { products, byKey };
}

export function loadCatalog() {
  pending ??= load().catch((e) => {
    pending = null; // retry on next call
    throw e;
  });
  return pending;
}

/** The shared catalogue, or null while it loads. */
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    let alive = true;
    loadCatalog().then(
      (c) => alive && setCatalog(c),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);
  return catalog;
}
