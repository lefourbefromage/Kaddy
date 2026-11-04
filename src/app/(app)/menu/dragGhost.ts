// The meal being dragged: the browser's drag image is a frozen bitmap, so it is hidden and a
// copy of the slot follows the pointer instead. It lifts, tilts with the horizontal speed and
// swings back upright when the pointer stops. Reduced motion keeps the browser's own image.

import type { DragEvent } from "react";

const LIFT = 1.04;
const FOLLOW = 0.35; // share of the gap to the pointer closed each frame
const TILT_PER_PX = 0.9; // degrees per pixel of horizontal movement per frame
const MAX_TILT = 10;
const TILT_EASE = 0.18;

let stopCurrent: (() => void) | null = null;

let transparent: HTMLImageElement | null = null;
function transparentImage() {
  if (!transparent) {
    transparent = new Image();
    transparent.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  return transparent;
}
// Loaded ahead: setDragImage ignores an image that is still loading.
if (typeof window !== "undefined") transparentImage();

/** Call from onDragStart. Cleans itself up on drop or dragend. */
export function startDragGhost(e: DragEvent<HTMLElement>, className: string) {
  stopCurrent?.();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const source = e.currentTarget;
  const rect = source.getBoundingClientRect();
  const grabX = e.clientX - rect.left;
  const grabY = e.clientY - rect.top;
  e.dataTransfer.setDragImage(transparentImage(), 0, 0);

  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("draggable");
  ghost.setAttribute("aria-hidden", "true");
  ghost.inert = true;
  ghost.classList.add(className);
  Object.assign(ghost.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transformOrigin: `${grabX}px ${grabY}px`,
  });
  document.body.appendChild(ghost);

  let targetX = e.clientX;
  let targetY = e.clientY;
  let x = targetX;
  let y = targetY;
  let tilt = 0;
  let scale = 1;
  let frame = 0;

  const tick = () => {
    const prevX = x;
    x += (targetX - x) * FOLLOW;
    y += (targetY - y) * FOLLOW;
    const wanted = Math.max(-MAX_TILT, Math.min(MAX_TILT, (x - prevX) * TILT_PER_PX));
    tilt += (wanted - tilt) * TILT_EASE;
    scale += (LIFT - scale) * 0.25;
    ghost.style.transform = `translate(${x - e.clientX}px, ${y - e.clientY}px) rotate(${tilt}deg) scale(${scale})`;
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  // dragover keeps firing (every ~50ms) wherever the pointer is, with usable coordinates.
  const follow = (ev: globalThis.DragEvent) => {
    if (ev.clientX === 0 && ev.clientY === 0) return;
    targetX = ev.clientX;
    targetY = ev.clientY;
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    ghost.remove();
    document.removeEventListener("dragover", follow);
    document.removeEventListener("drop", stop, true);
    document.removeEventListener("dragend", stop, true);
    stopCurrent = null;
  };
  document.addEventListener("dragover", follow);
  // drop: the source slot may re-render away before its dragend.
  document.addEventListener("drop", stop, true);
  document.addEventListener("dragend", stop, true);
  stopCurrent = stop;
}
