// The week as a picture, for the "Partager" button: drawn on a canvas from tokens.css,
// portrait (one row per day, midi | soir) so it stays readable in a phone chat.

import { GROUPS, type GroupId } from "@/lib/foodGroups";
import type { Day } from "@/lib/weeks";

export type ShareMeal = { kind: "empty" } | { kind: "dish" | "leftover"; name: string };
export type ShareDay = { day: Day; name: string; date: number; groups: GroupId[]; lunch: ShareMeal; dinner: ShareMeal };
export type ShareWeek = { subtitle: string; days: ShareDay[] };

const WIDTH = 760; // CSS px; drawn at 2× for a sharp picture once compressed by the chat app
const SCALE = 2;
const DAY_COLUMN = 108;
const TITLE_ART = { src: "/illustrations/titre-menu.webp", height: 120 };
const WORDMARK = { src: "/illustrations/logo-wordmark.webp", height: 30 };
const MAX_DISH_LINES = 3;

type Font = { css: string; size: number; line: number };

function readTokens() {
  const css = getComputedStyle(document.documentElement);
  const raw = (name: string) => css.getPropertyValue(name).trim();
  const color = (name: string) => raw(`--kd-${name}`);
  const px = (name: string) => parseFloat(raw(`--kd-${name}`));
  // "800 52px/1 'Bricolage Grotesque', sans-serif" → a canvas font plus its line height.
  const font = (name: string): Font => {
    const m = raw(`--kd-text-${name}`).match(/^(\d+)\s+([\d.]+)px\s*\/\s*([\d.]+)\s+(.+)$/);
    if (!m) throw new Error(`Token --kd-text-${name} illisible`);
    const size = parseFloat(m[2]);
    return { css: `${m[1]} ${size}px ${m[4]}`, size, line: size * parseFloat(m[3]) };
  };
  const varColor = (value: string) => {
    const m = value.match(/var\((--[\w-]+)\)/);
    return m ? raw(m[1]) : value;
  };
  return {
    color,
    px,
    varColor,
    fonts: {
      display: font("display"),
      subtitle: font("body-lg"),
      dayName: font("body-medium"),
      dayNum: font("headline-lg"),
      label: font("label"),
      dish: font("title"),
      pill: font("caption"),
      legend: font("body-small"),
    },
    tracking: {
      display: parseFloat(raw("--kd-tracking-display")),
      label: parseFloat(raw("--kd-tracking-label")),
    },
  };
}

/** #RRGGBB mix, like color-mix(in srgb, a share%, b). */
function mix(a: string, b: string, share: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) * share + ch(b, i) * (1 - share)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

/** Splits a dish name into lines that fit; the last kept line ends with "…" when cut. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    // A single word longer than the slot: break it.
    while (ctx.measureText(line).width > width && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > width) cut--;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

function setFont(ctx: CanvasRenderingContext2D, font: Font, tracking = 0, stretch: CanvasFontStretch = "normal") {
  ctx.font = font.css;
  ctx.fontStretch = stretch;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${tracking * font.size}px`;
}

const REFRESH = [
  "M20 11a8 8 0 0 0-14.3-4.9L4 8",
  "M4 4v4h4",
  "M4 13a8 8 0 0 0 14.3 4.9L20 16",
  "M20 20v-4h-4",
];

export async function drawMenuImage(week: ShareWeek): Promise<Blob> {
  const t = readTokens();
  const f = t.fonts;
  await Promise.all(Object.values(f).map((font) => document.fonts.load(font.css, "Menu àé")));
  const [art, wordmark] = await Promise.all([loadImage(TITLE_ART.src), loadImage(WORDMARK.src)]);

  const pad = t.px("space-8");
  const cardPad = t.px("space-3");
  const rowGap = t.px("space-2");
  const slotPadX = t.px("space-4");
  const slotPadY = t.px("space-3");
  const slotGap = t.px("space-2");
  const pillH = 22;
  const dot = 12;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // ---- Layout first (measuring), then the canvas size, then the drawing. ----
  const slotW = (WIDTH - 2 * pad - 2 * cardPad - DAY_COLUMN - slotGap) / 2;
  const dishW = slotW - 2 * slotPadX;
  setFont(ctx, f.dish);
  const rows = week.days.map((d) => {
    const meals = ([["Midi", d.lunch], ["Soir", d.dinner]] as const).map(([label, meal]) => ({
      label,
      meal,
      lines: meal.kind === "empty" ? ["—"] : wrap(ctx, meal.name, dishW, MAX_DISH_LINES),
    }));
    const slotH = Math.max(...meals.map((m) => 2 * slotPadY + pillH + t.px("space-1") + m.lines.length * f.dish.line));
    const dayH = f.dayName.line + t.px("space-1") + f.dayNum.line + t.px("space-2") + dot;
    return { d, meals, h: Math.max(slotH, dayH) + 2 * cardPad };
  });

  const wordmarkW = (wordmark.naturalWidth / wordmark.naturalHeight) * WORDMARK.height;
  const legendItems = [
    ...GROUPS.map((g) => ({ label: g.label, color: t.varColor(g.color) })),
    { label: "Absent du jour", color: null },
  ];
  setFont(ctx, f.legend);
  const legendW = WIDTH - 2 * pad - wordmarkW - t.px("space-4");
  const legendGapX = t.px("space-4");
  const legendLineH = Math.max(f.legend.line, dot) + t.px("space-1");
  const legendPos: { x: number; line: number }[] = [];
  let lx = 0;
  let lline = 0;
  for (const item of legendItems) {
    const w = dot + 6 + ctx.measureText(item.label).width;
    if (lx > 0 && lx + w > legendW) {
      lx = 0;
      lline++;
    }
    legendPos.push({ x: lx, line: lline });
    lx += w + legendGapX;
  }
  const footerH = Math.max((lline + 1) * legendLineH, WORDMARK.height);

  const headerH = TITLE_ART.height;
  const gridTop = pad + headerH + t.px("space-6");
  const gridH = rows.reduce((s, r) => s + r.h, 0) + rowGap * (rows.length - 1);
  const footerTop = gridTop + gridH + t.px("space-6");
  const height = footerTop + footerH + pad;

  canvas.width = WIDTH * SCALE;
  canvas.height = Math.ceil(height * SCALE);
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "top";

  // ---- Background and header ----
  ctx.fillStyle = t.color("paper");
  ctx.fillRect(0, 0, WIDTH, height);

  const artW = (art.naturalWidth / art.naturalHeight) * TITLE_ART.height;
  ctx.drawImage(art, pad, pad, artW, TITLE_ART.height);
  const textX = pad + artW + t.px("space-5");
  const subtitleY = pad + headerH - f.subtitle.line - t.px("space-2");
  const titleY = subtitleY - 6 - f.display.line;
  ctx.fillStyle = t.color("ink");
  setFont(ctx, f.display, t.tracking.display, "semi-condensed");
  ctx.fillText("Menu", textX, titleY);
  ctx.fillStyle = t.color("text-muted");
  setFont(ctx, f.subtitle);
  ctx.fillText(week.subtitle, textX, subtitleY);

  // ---- Days ----
  const slotBg = t.color("field");
  const leftoverBg = mix(slotBg, t.color("lavender-mist"), 0.55);
  let y = gridTop;
  for (const { d, meals, h } of rows) {
    ctx.fillStyle = t.color("surface");
    ctx.beginPath();
    ctx.roundRect(pad, y, WIDTH - 2 * pad, h, t.px("radius-lg"));
    ctx.fill();

    const dx = pad + cardPad + t.px("space-1");
    let dy = y + cardPad + t.px("space-1");
    ctx.fillStyle = t.color("ink");
    setFont(ctx, f.dayName);
    ctx.font = ctx.font.replace(/^\d+/, "700");
    ctx.fillText(d.name, dx, dy);
    dy += f.dayName.line + t.px("space-1");
    setFont(ctx, f.dayNum, t.tracking.display, "semi-condensed");
    ctx.fillText(String(d.date), dx, dy);
    dy += f.dayNum.line + t.px("space-2");
    GROUPS.forEach((g, i) => {
      const cx = dx + dot / 2 + i * (dot + t.px("space-1"));
      ctx.beginPath();
      if (d.groups.includes(g.id)) {
        ctx.arc(cx, dy + dot / 2, dot / 2, 0, Math.PI * 2);
        ctx.fillStyle = t.varColor(g.color);
        ctx.fill();
      } else {
        ctx.arc(cx, dy + dot / 2, dot / 2 - 0.75, 0, Math.PI * 2);
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = t.color("dot-empty-stroke");
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    meals.forEach(({ label, meal, lines }, i) => {
      const sx = pad + cardPad + DAY_COLUMN + i * (slotW + slotGap);
      const sy = y + cardPad;
      const sh = h - 2 * cardPad;
      ctx.beginPath();
      if (meal.kind === "empty") {
        ctx.roundRect(sx + 1, sy + 1, slotW - 2, sh - 2, t.px("radius-md"));
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = t.color("stroke-dashed");
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.roundRect(sx, sy, slotW, sh, t.px("radius-md"));
        ctx.fillStyle = meal.kind === "leftover" ? leftoverBg : slotBg;
        ctx.fill();
      }

      const labelY = sy + slotPadY + (pillH - f.label.line) / 2;
      ctx.fillStyle = t.color("ink");
      setFont(ctx, f.label, t.tracking.label);
      ctx.fillText(label.toUpperCase(), sx + slotPadX, labelY);

      if (meal.kind === "leftover") {
        setFont(ctx, f.pill);
        const icon = 13;
        const pillW = t.px("space-2") * 2 + icon + t.px("space-1") + ctx.measureText("Reste").width;
        const px = sx + slotW - slotPadX + 4 - pillW;
        const py = sy + slotPadY;
        ctx.beginPath();
        ctx.roundRect(px, py, pillW, pillH, t.px("radius-pill"));
        ctx.fillStyle = t.color("lavender-soft");
        ctx.fill();
        ctx.save();
        ctx.translate(px + t.px("space-2"), py + (pillH - icon) / 2);
        ctx.scale(icon / 24, icon / 24);
        ctx.strokeStyle = t.color("violet-deep");
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        REFRESH.forEach((p) => ctx.stroke(new Path2D(p)));
        ctx.restore();
        ctx.fillStyle = t.color("violet-deep");
        ctx.fillText("Reste", px + t.px("space-2") + icon + t.px("space-1"), py + (pillH - f.pill.line) / 2);
      }

      ctx.fillStyle = meal.kind === "empty" ? t.color("text-faint") : t.color("ink");
      setFont(ctx, f.dish);
      lines.forEach((line, n) => {
        ctx.fillText(line, sx + slotPadX, sy + slotPadY + pillH + t.px("space-1") + n * f.dish.line);
      });
    });

    y += h + rowGap;
  }

  // ---- Legend and wordmark ----
  setFont(ctx, f.legend);
  legendItems.forEach((item, i) => {
    const { x, line } = legendPos[i];
    const ix = pad + x;
    const iy = footerTop + line * legendLineH;
    ctx.beginPath();
    if (item.color) {
      ctx.arc(ix + dot / 2, iy + f.legend.line / 2, dot / 2, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
    } else {
      ctx.arc(ix + dot / 2, iy + f.legend.line / 2, dot / 2 - 0.75, 0, Math.PI * 2);
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = t.color("dot-empty-stroke");
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = t.color("text-muted");
    ctx.fillText(item.label, ix + dot + 6, iy);
  });
  ctx.drawImage(wordmark, WIDTH - pad - wordmarkW, footerTop + footerH - WORDMARK.height, wordmarkW, WORDMARK.height);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image impossible"))), "image/png"),
  );
}

export type ShareOutcome = "shared" | "copied" | "downloaded" | "cancelled";

/**
 * Phone: the system share sheet (Telegram, Messages…). Computer: the clipboard, ready
 * for Ctrl+V. Download when neither is available.
 */
export async function shareMenuImage(blob: Blob, filename: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: "image/png" });
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return "copied";
    } catch {
      // Refused (permissions, no focus): fall back to the download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
