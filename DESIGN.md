---
name: Kaddy
description: The household menu of the week, and the grocery list that follows.
colors:
  ink: "#2D2848"
  ink-hover: "#3D3760"
  violet: "#6A57CC"
  violet-deep: "#4B3F8F"
  violet-cap: "#9D88F8"
  lavender: "#D6CBFD"
  lavender-soft: "#E4DCFD"
  lavender-mist: "#ECE5F5"
  sun: "#F9D86E"
  sun-logo: "#FEDA4F"
  paper: "#F0E9E0"
  surface: "#FFFFFF"
  field: "#F6F1EA"
  surface-subtle: "#FBF8F3"
  track: "#EEE7DC"
  divider: "#F3EEE7"
  text-muted: "#5F5A70"
  text-faint: "#6B6680"
  stroke-dashed: "#857F98"
  stroke-soft: "#CFC6DA"
  ink-track: "#4A4370"
  dot-empty: "#E3DCD0"
  dot-empty-on-ink: "#5A5480"
  dot-empty-stroke: "#8E88A0"
  food-fruits: "#F49AC1"
  todo: "#FFB54D"
  todo-bg: "#FFF1DA"
  todo-text: "#8A5300"
  error: "#E0603F"
  error-bg: "#FDD3C6"
  error-text: "#7A2E17"
  success-text: "#3F6B4C"
  aisle-produce: "#CFE6D3"
  aisle-produce-dot: "#5A9868"
  aisle-butcher: "#FDD3C6"
  aisle-butcher-dot: "#F87A56"
  aisle-dairy: "#F8EDC8"
  aisle-dairy-dot: "#E6CFA0"
  aisle-grocery: "#F1E2CC"
  aisle-grocery-dot: "#D9A86A"
  aisle-bakery: "#FBE3B8"
  aisle-bakery-dot: "#F2C94C"
  aisle-household: "#DCE7F7"
  aisle-household-dot: "#8FA9D6"
  aisle-other: "#ECE5F5"
  aisle-other-dot: "#B9A8FF"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "52px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 85"
  display-mobile:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 85"
  numeral:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 80"
  headline:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.45
  body-small:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.35
  headline-lg:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.1
  headline-sm:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.15
  title-lg:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
  body-lg:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.45
  body-medium:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.3
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "0.08em"
rounded:
  xs: "10px"
  sm: "12px"
  md: "16px"
  lg: "22px"
  xl: "28px"
  dialog: "32px"
  panel: "40px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 8px 0 22px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  chip-reste:
    backgroundColor: "{colors.lavender-soft}"
    textColor: "{colors.violet-deep}"
    rounded: "{rounded.pill}"
    height: "22px"
    padding: "0 8px"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "52px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  tile-stat:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
  slot-filled:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  nav-mobile:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    height: "72px"
  nav-mobile-active:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.ink}"
  checkbox:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xs}"
    size: "30px"
  checkbox-checked:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.surface}"
---

# Design System: Kaddy

## Overview

**Creative North Star: "Le carnet de cuisine"**

Kaddy looks like a household's cookbook-notebook: cream paper, things jotted down in pencil, stickers stuck in, and a mascot drawn in the margins. The interface is the notebook page. The illustrations, hand-drawn in crayon and gouache, carry the warmth and the humour. The UI stays soft and round so it never competes with them.

Density is relaxed: few elements per screen, generous targets, and short French copy addressed as "tu". The palette rests on a cream paper, a deep navy ink, a violet that stands for action, and a sunny yellow used sparingly. The supermarket aisles each have their pastel, as if colour-coded in the notebook.

**Key Characteristics:**
- Cream paper (`paper`) as the background, white cards on top, no visible borders.
- Bold, very rounded typography (Bricolage Grotesque, narrowed) for titles and numbers; Figtree for everything else.
- Every page title is paired with an illustration of the mascot.
- Flat surfaces. Depth comes from colour fills; light shadows are reserved for floating elements.
- Shapes are pills and large radii, never a sharp angle.

## Colors

A warm, slightly retro palette: navy ink and violet for structure, cream for paper, yellow as a highlighter, and a pastel per aisle.

### Primary
- **Encre de nuit** (#2D2848): every text, primary button, mobile navigation bar and icon. It is the pencil line of the notebook.
- **Violet Kaddy** (#6A57CC): action and state. Focus ring, ticked box, progress bar, active slot. Never decorative.

### Secondary
- **Lavande** (#D6CBFD): active tab in the navigation, "Repas différents" tile, "En cours" badge.
- **Lavande douce** (#E4DCFD): the "Reste" pill, and the reste quantities in the list.
- **Violet profond** (#4B3F8F): text on lavender.
- **Casquette** (#9D88F8): the mascot's colour. Used in illustrations and for focus inside dark areas.

### Tertiary
- **Jaune soleil** (#F9D86E): accent in the icons of dark buttons (+, →), the yellow tile, the Mon Kaddy counter, the ticked "Rester connecté" box.
- **Jaune logo** (#FEDA4F): reserved for the logo and the yellow panel of the sign-in page.

### Neutral
- **Papier crème** (#F0E9E0): app background.
- **Blanc** (#FFFFFF): cards, dialogs, day columns.
- **Champ** (#F6F1EA): field background, filled slots, secondary buttons.
- **Papier doux** (#FBF8F3): sunken areas (ingredient zone of the recipe sheet, ticked rows).
- **Rail** (#EEE7DC): progress-bar track, quantity chips.
- **Filet** (#F3EEE7): 1.5px row separators.
- **Gris ardoise** (#5F5A70): secondary text (5.5:1 on paper).
- **Gris plume** (#6B6680): placeholders and ticked items (4.5:1 minimum).
- **Pointillé** (#857F98): dashed border of empty slots and "add" fields (3:1 minimum).
- **Pointillé doux** (#CFC6DA): decorative dashes on elements that already carry a label ("Ajouter un ingrédient" buttons, "Ingrédients à classer" tile).
- **Rail sur encre** (#4A4370): progress track on the dark "Semaine remplie" tile.
- **Pastilles vides** (#E3DCD0, #5A5480 on ink, #8E88A0 dashed stroke): food-group dots not yet filled.

### Status
- **To complete:** #FFB54D (dot "!"), #FFF1DA (background), #8A5300 (text).
- **Error:** #E0603F (field border), #FDD3C6 (message background), #7A2E17 (text).
- **Success:** #3F6B4C ("Rayon terminé").

### Aisles
Each aisle has a pastel background (section header) and a dot (navigation):

| Aisle | Background | Dot |
|---|---|---|
| Fruits & légumes | #CFE6D3 | #5A9868 |
| Boucherie & charcuterie | #FDD3C6 | #F87A56 |
| Crémerie & fromages | #F8EDC8 | #E6CFA0 |
| Épicerie salée | #F1E2CC | #D9A86A |
| Boulangerie | #FBE3B8 | #F2C94C |
| Hygiène & entretien | #DCE7F7 | #8FA9D6 |
| Autres | #ECE5F5 | #B9A8FF |

The same pastels are reused for recipe-card backgrounds and the summary tiles. The Menu food-group dots reuse the aisle dots (vegetables #5A9868, starches #F2C94C, meat & fish #F87A56, dairy #E6CFA0), plus fruit #F49AC1.

### Named Rules
**The Violet = Action Rule.** #6A57CC appears only on what responds or has just responded (focus, ticked, progress, active slot). For a decorative accent, use lavender or yellow.

**The Equal Meals Rule.** A leftover is a meal like any other: same background as a filled slot, distinguished only by the lavender "Reste" pill.

## Typography

**Display font:** Bricolage Grotesque, variable, narrowed (`wdth` 80–85), weight 800.
**Body font:** Figtree (with system-ui).

**Character:** a rounded, slightly condensed grotesque that recalls the bubble lettering of the logo, paired with a friendly, very legible humanist sans for the interface.

### Hierarchy
- **Display** (800, 52px desktop / 36–40px mobile, line-height 1, tracking −0.02em): page title, always next to its illustration.
- **Numeral** (800, 56–64px, `wdth` 80, line-height .9): the big numbers of the summary and of Mon Kaddy.
- **Headline** (800, 20–26px): section titles ("Pas cuisinées depuis longtemps", week headers, recipe sheets).
- **Title** (Figtree 700, 16–18px): dish names, items, aisle names.
- **Body** (Figtree 600, 15–16px): actions, fields, descriptions. 16px minimum in mobile fields.
- **Body small** (Figtree 600, 13–14px): subtitles ("de mardi soir", "Hors menu").
- **Label** (Figtree 800, 11–12px, uppercase, tracking .06–.08em): "Midi", "Soir", "En cours", column headers.

### Named Rules
**The Single Lettering Rule.** Only two families. Titan One, currently loaded for the avatar initial alone, must go.

## Layout

- **Desktop:** container max 1448px, side padding 48px, sections spaced 28px apart. Menu grid of 7 day columns. Summary on 5 columns with 184px rows. Mon Kaddy: 360px aside column plus aisles in 2 columns (`columns: 2 380px`).
- **Mobile (390px):** one column, 16px gutter, 14px between blocks. Floating navigation bar at the bottom (72px, 12px from the edges), with 112px of reserved bottom padding. Day carousel and a single-day view on Menu; dialogs open as full-screen sheets.
- **Rhythm:** a 4px base; 8, 10 and 12px most often inside components; 16–24px between cards.
- **Targets:** 44 × 44px minimum. When the visual stays smaller (desktop), an invisible hit area `.kd-hit` brings it up to 44px.

## Elevation & Depth

The system is flat at rest: surfaces separate by colour fill (paper, then white, then field). Light shadows are allowed only for floating elements, where they explain that the element sits above the content.

### Shadow Vocabulary
- **Floating** (`box-shadow: 0 8px 24px rgba(45, 40, 72, .14)`): mobile navigation bar, dialogs and sheets, the duplicate alert.
- **Veil** (`background: rgba(45, 40, 72, .5)`): behind desktop dialogs.
- **Today's ring** (`box-shadow: inset 0 0 0 3px #6A57CC`): highlights today's column.

### Named Rules
**The Flat Page Rule.** Nothing that belongs to the page (cards, tiles, slots) gets a shadow. A shadow means "this floats".

## Shapes

Everything is rounded, nothing is sharp. Pills (999px) for buttons, chips, tabs and the navigation bar; large radii for containers, decreasing as you nest: panel 40 › dialog 32 › tile 28 › card 22 › slot/field 16 › inner field 12 › checkbox 10. Borders are rare: 1.5px separators, 2px dashed for "to fill" areas, 2px violet for the active state. The illustrations are cut out with no frame; they overlap the edges of tiles and title rows.

## Components

### Buttons
- **Shape:** pill (999px).
- **Primary:** ink background, white text 700/15px, 52px high. On the right, a yellow circle holding the icon (+ or →).
- **Secondary:** field background, ink text, 40–44px high ("Tout décocher").
- **Icon:** round 44px, white or transparent background, navy icon with a 2–2.4 stroke.
- **Hover / Focus:** hover darkens (#3D3760) or turns lavender. Focus is a 3px violet ring, offset 3px (yellow on navy).

### Chips
- **Reste:** lavender-soft background, deep violet text 700/12px, refresh icon, 22px.
- **Counters:** white or rail background, numeral font 800/13–16px.
- **Filters and sorting:** transparent pill, active state lavender with weight 800, 44px high.

### Cards / Containers
- **Corner style:** 22px (cards, days), 28px (summary tiles), 24–26px (aisles).
- **Background:** white on paper; aisle and recipe headers take their pastel.
- **Shadow strategy:** none (Flat Page Rule).
- **Internal padding:** 16–22px.

### Inputs / Fields
- **Style:** no stroke, field background, radius 16px (12px inside a row), 44–56px high, text 600/15–17px.
- **Focus:** 3px violet ring; for the Menu slot, the whole slot carries the violet border and the field becomes transparent.
- **Error:** #E0603F border plus a pink message (#FDD3C6 / #7A2E17) with an icon.

### Navigation
- **Desktop:** a white pill bar at the top (logo, 4 links, household). The active link has a lavender background.
- **Mobile:** a floating navy pill bar at the bottom, with 4 icon + label tabs. The active tab is lavender with ink text. A yellow badge counts the Mon Kaddy items.

### Menu slot (signature component)
- **Empty:** 2px dashed (#857F98) border, "Midi" or "Soir" label, "Quel plat ?". It is a button.
- **Active:** 2px solid violet border, white background, transparent field, small secondary "Reste" button.
- **Filled:** field background, dish name in title style, eye and "…" buttons.
- **Reste:** the same background as a filled slot, plus the lavender "Reste" pill and the subtitle "de mardi soir".

### Mon Kaddy row (signature component)
- 60px row with a 30px rounded box, then the name, then the quantity chip.
- When ticked:
  1. the box fills with violet and the tick draws itself;
  2. the name is struck through;
  3. the row slides out and collapses into "déjà dans le caddie".

## Do's and Don'ts

### Do:
- **Do** pair every page title with an illustration of the mascot in the series (crayon + gouache, violet cap, navy line).
- **Do** keep the pastels for the aisles and use the aisle colour wherever a product's aisle appears.
- **Do** keep 44 × 44px targets on mobile, and a `.kd-hit` area when the visual is smaller.
- **Do** keep a reduced-motion path (`prefers-reduced-motion`) for every animation.

### Don't:
- **Don't** use #6A57CC as decoration (Violet = Action Rule).
- **Don't** give a leftover more weight than a dish (Equal Meals Rule).
- **Don't** put a shadow on a card, tile or slot (Flat Page Rule).
- **Don't** add a third type family.
- **Don't** add a sharp angle or a radius below 9px.
