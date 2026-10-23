"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";

const GAP = 6; // between the field and its list (top/bottom: calc(100% + 6px) in the CSS)
const MARGIN = 8; // kept free at the edge of the visible area
const ENOUGH = 180; // room for about four options: below that, the list may open upwards
const FLOOR = 96;

/**
 * Fits an absolutely positioned dropdown (list) under its anchor in the room actually visible:
 * above the mobile bottom bar and the on-screen keyboard (visual viewport). Writes max-height
 * on the list and sets data-up when it should open above the anchor instead.
 */
export function useDropdownSpace(
  anchor: RefObject<HTMLElement | null>,
  list: RefObject<HTMLElement | null>,
  open: boolean,
) {
  // Every render: the options change as the user types.
  useLayoutEffect(() => {
    if (open) fit(anchor.current, list.current);
  });

  useEffect(() => {
    if (!open) return;
    const refit = () => fit(anchor.current, list.current);
    const vv = window.visualViewport;
    window.addEventListener("scroll", refit, true);
    window.addEventListener("resize", refit);
    vv?.addEventListener("resize", refit);
    vv?.addEventListener("scroll", refit);
    return () => {
      window.removeEventListener("scroll", refit, true);
      window.removeEventListener("resize", refit);
      vv?.removeEventListener("resize", refit);
      vv?.removeEventListener("scroll", refit);
    };
  }, [open, anchor, list]);
}

function fit(anchor: HTMLElement | null, list: HTMLElement | null) {
  if (!anchor || !list) return;
  const vv = window.visualViewport;
  const top = (vv?.offsetTop ?? 0) + MARGIN;
  let bottom = (vv ? vv.offsetTop + vv.height : window.innerHeight) - MARGIN;
  // The floating bottom bar (mobile) covers the page, but not a modal dialog.
  const bar = document.querySelector<HTMLElement>("[data-bottom-bar]");
  if (bar?.getClientRects().length && !anchor.closest("dialog")) {
    bottom = Math.min(bottom, bar.getBoundingClientRect().top - MARGIN);
  }

  const r = anchor.getBoundingClientRect();
  const below = bottom - r.bottom - GAP;
  const above = r.top - GAP - top;
  const needed = list.scrollHeight;
  const up = below < Math.min(needed, ENOUGH) && above > below;

  list.style.maxHeight = `${Math.max(up ? above : below, FLOOR)}px`;
  list.toggleAttribute("data-up", up);
}
