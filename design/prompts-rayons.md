# Aisle illustration prompts

One picture per aisle, 27 in all, in the original crayon + gouache style (see `DESIGN.md`, section Aisles). They replace the old 4×4 sheet `design/rayons-planche.webp`, whose 14 pictures cannot cover the 27 aisles of `data/aisles.json`.

The pictures are shown small: 64 × 56 px in Mon Kaddy, 40 × 38 px in Ordre des rayons, and larger in the page headers and the Menu summary. Each one sits on its aisle's pastel (`--kd-aisle-{id}`), so every subject below is chosen to stand out against that colour and to look different from the neighbouring aisles.

## How to generate

1. The prompts ask for a plain white background: `npm run aisle-art` removes it. Don't ask for transparency in a chat interface: ChatGPT then paints a grey-and-white checkerboard into the picture, which can't be removed. Through the API, GPT Image's `background: transparent` parameter works too (with the same prompt).
2. Square, 1024 × 1024 or larger, PNG.
3. Attach two or three of the current pictures as style references, as the reference for both style and level of detail: `public/illustrations/rayons/fruits-legumes.webp`, `epicerie-sucree.webp` and `surgeles.webp`. Once the first new pictures are accepted, use them as references instead, so the series doesn't drift. If a result is still too detailed, reply "simpler: fewer, larger shapes and broader strokes, like the reference pictures" rather than regenerating from scratch.
4. Each prompt = the **style block** below, followed by the aisle's **subject**. Send them together, with the style block always unchanged.
5. Save each result as `design/rayons/{id}.png` (the `id` from `data/aisles.json`).

## Style block (shared by every prompt)

```
A simple, stylised hand-drawn illustration in wax crayon and gouache, like a sticker in a children's picture book: soft, chalky, matte crayon texture over flat opaque colour, warm saturated colours, no black outlines.

Keep it simple, not realistic. Each item is made of a few large, rounded, slightly chunky shapes. Each shape is filled with one main colour, plus one lighter tone for a soft highlight and one darker tone on its shaded side, laid down in broad, even crayon strokes. Leave out fine detail: no marbling, no grain of the meat, no pores, no fibres, no crumbs, no glossy reflections, no small speckles beyond a few large dots where they define the item.

The picture shows one or two everyday grocery items, seen at a slight three-quarter angle from just above eye level, overlapping a little and grouped tightly so that together they form one compact silhouette. The group is centred in a square frame and fills about 80% of it, with an even margin on every side.

The background is flat, solid pure white (#FFFFFF), the same white edge to edge, with no table, no ground line, no cast shadow, no halo, no paper texture and no stray marks around the items. Any white or very pale item has a soft grey or tinted shaded edge so it stands apart from the white background. Packaging is generic and has no lettering: where a real product would carry a label, it shows a simple picture of what it contains instead. The picture must stay recognisable when shrunk to 40 pixels wide, so every item has a clear, distinctive outline and a strong colour.

No text, no letters, no numbers, no logos, no brand names, no watermark. Square 1:1.
```

## Subjects

Subjects come from the products of each aisle in `data/products.json`. Where an aisle already had a fitting drawing, the subject stays the same so the aisle keeps a familiar look.

### viandes-volailles: Viandes & volailles (on #FDD3C6)
```
Subject: a golden roast chicken drumstick with a pale knobbly bone end, leaning against a thick raw beef steak (an entrecôte), deep red with a creamy white rim of fat. Dominant colours: golden orange and deep red.
```

### poissonnerie: Poissonnerie (on #CDE0EE)
```
Subject: a whole fresh sardine-like fish with a slate-blue back, silvery belly and a round dark eye, lying diagonally, with two curled pink-orange cooked prawns in front of it. Dominant colours: slate blue and coral pink.
```

### fruits-legumes: Fruits & légumes (on #CFE6D3)
```
Subject: a long orange carrot with a bushy green leafy top, leaning against a round shiny red apple with a short brown stalk and one green leaf. Dominant colours: orange and red, with green leaves.
```

### boulangerie: Boulangerie (on #FBE3B8)
```
Subject: a golden-brown baguette with three diagonal scored cuts, lying diagonally, with a plump flaky croissant in front of it. Dominant colours: deep golden brown and amber.
```

### lait-oeufs: Lait & œufs (on #F8EDC8)
```
Subject: a glass bottle of milk with a blue cap and a wide blue band around its middle, standing upright, with two brown hen's eggs resting at its foot. Dominant colours: milky white with cobalt blue, and russet brown eggs.
```

### cremerie-yaourts: Crèmerie & yaourts (on #E3ECF3)
```
Subject: a round white yoghurt pot with its foil lid peeled half back and a little white yoghurt showing, next to a block of butter half unwrapped from gold foil paper. Dominant colours: white and buttery yellow with gold.
```

### desserts: Desserts (on #FCE0D0)
```
Subject: a small glass verrine filled with dark chocolate mousse, standing behind a wobbly crème caramel flan on a little white plate, the flan pale yellow with glossy amber caramel running down its sides. Dominant colours: chocolate brown and caramel amber.
```

### fromages: Fromages (on #F5E6C0)
```
Subject: a round camembert in a light wooden box, with one wedge cut out to show the soft creamy inside under its white bloomy rind, and in front of it a wedge of blue cheese with blue-green veins. Dominant colours: chalky white rind, light wood, and blue-green veins.
```

### charcuterie: Charcuterie (on #F9D3DD)
```
Subject: a dry saucisson with a dusty white skin and a tied string at one end, with two round slices in front showing deep red meat speckled with white fat, and a folded pink slice of cooked ham beside them. Dominant colours: deep red and pink, with the white skin.
```

### produits-cuisines: Produits cuisinés (on #E8EBC9)
```
Subject: a slice of quiche lorraine with a golden pastry crust and a pale yellow egg filling dotted with bits of bacon, in front of a small rectangular tray of fresh square ravioli under clear film. Dominant colours: golden pastry and pale yellow pasta.
```

### surgeles: Surgelés (on #D2EFEC)
```
Subject: a clear plastic bag of frozen green peas with blue sealed edges and a white snowflake printed on it, with three loose peas and two clear ice cubes beside it. Dominant colours: bright pea green and cobalt blue.
```

### conserves-legumes: Conserves de légumes (on #DDE6E1)
```
Subject: a squat tin can with a bright yellow label showing a picture of a corn cob, standing next to a glass jar of chickpeas with a gold metal lid. Dominant colours: sunny yellow and beige, with silver and gold metal.
```

### plats-cuisines: Plats cuisinés (on #EFE3C2)
```
Subject: a round tin can with its lid rolled half open, showing a hot cassoulet inside (white beans in a red-brown sauce with a piece of sausage), and in front of it a flat open sardine tin with three silver sardines in oil. Dominant colours: red-brown sauce and silver metal.
```

### assaisonnements-condiments: Assaisonnements & condiments (on #F5D5CA)
```
Subject: a tall glass bottle of olive oil, greenish-gold, with a cork stopper, standing beside a dark wooden pepper mill. Dominant colours: olive green and gold, and dark brown wood.
```

### pates-riz-feculents: Pâtes, riz & féculents (on #F1E2CC)
```
Subject: an upright bundle of dry spaghetti tied in the middle with a brown string, with a small heap of penne pasta at its foot. Dominant colours: wheat yellow and warm ochre.
```

### aperitif: Apéritif (on #E0E8C8)
```
Subject: a small round terracotta bowl full of glossy green olives, next to a few golden ridged potato crisps spilling out of an opened foil snack bag. Dominant colours: olive green, terracotta and golden yellow.
```

### produits-du-monde: Produits du monde (on #FCDDC2)
```
Subject: a dark glass soy sauce bottle with a red cap, standing beside a blue-and-white striped bowl of white rice with a pair of wooden chopsticks resting in it. Dominant colours: near-black brown, red and blue-and-white.
```

### bio-vegetal: Bio & végétal (on #D8EDC9)
```
Subject: a tall beige carton of oat milk with a green leaf and a golden oat sprig drawn on it, beside a small cluster of bright green edamame pods. Dominant colours: oat beige and fresh green.
```

### boissons-chaudes: Boissons chaudes (on #E6D6CC)
```
Subject: a kraft paper coffee bag folded at the top, with a few dark roasted coffee beans spilling at its foot, and a paper tea bag with a turquoise tag on a string leaning against it. Dominant colours: kraft brown, dark coffee brown and turquoise.
```

### epicerie-sucree: Épicerie sucrée (on #F3D8EE)
```
Subject: a jar of strawberry jam with a red-and-white gingham cloth over its lid, tied with a string, next to a small stack of three golden butter biscuits with scalloped edges. Dominant colours: jam red and golden biscuit.
```

### aide-cuisine: Aide à la cuisine (on #F4EBDD)
```
Subject: a plain white paper bag of flour, folded open at the top with a little flour showing and a wooden scoop in it, next to a small heap of white sugar cubes. Dominant colours: white and light grey, with a pale wooden scoop and a soft blue band at the bottom of the bag for contrast.
```

### friandises: Friandises (on #FAD6E8)
```
Subject: a milk chocolate bar half unwrapped from red paper and silver foil, with one square snapped off, next to a round spiral lollipop in red, yellow and blue on a white stick. Dominant colours: chocolate brown, red and bright candy colours.
```

### boissons: Boissons (on #CFE9F5)
```
Subject: a clear plastic water bottle with a blue cap and a blue label band, beside an orange juice carton with a picture of an orange and a green leaf on it. Dominant colours: clear blue and bright orange.
```

### hygiene: Hygiène (on #E6DAF7)
```
Subject: a soft white roll of toilet paper with a few sheets hanging down, and a blue toothbrush with white bristles leaning against it. Dominant colours: white with lavender shading, and cobalt blue.
```

### entretien-nettoyage: Entretien & nettoyage (on #DCE7F7)
```
Subject: a spray bottle of cleaner with a white trigger head and turquoise liquid, beside a rectangular kitchen sponge with a yellow soft side and a green scrubbing side. Dominant colours: turquoise, yellow and green.
```

### maison-loisirs: Maison & loisirs (on #E4E4EC)
```
Subject: a classic glass light bulb with a warm yellow glow inside and a silver screw base, next to two cylindrical batteries with a copper-coloured top and a black body. Dominant colours: warm yellow, copper and black.
```

### autres: Autres (on #EAE5DE)
```
Subject: a brown kraft paper grocery bag, slightly crumpled, filled with a leafy green lettuce, a red tomato and a golden baguette sticking out of the top. Dominant colours: kraft brown, with green, red and golden accents.
```

## After generation

- Check each picture at 40 px wide on its aisle colour: it should still read as its aisle and not look like a neighbour (Lait & œufs / Crèmerie / Fromages / Bio & végétal, Conserves / Plats cuisinés, Desserts / Friandises / Épicerie sucrée).
- `npm run aisle-art` turns `design/rayons/{id}.png` into `public/illustrations/rayons/{id}.webp` and writes the sizes into `data/aisles.json`.
