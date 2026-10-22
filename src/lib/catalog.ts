"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

async function load(): Promise<Catalog> {
  const snap = await getDocs(collection(db, "catalog"));
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
