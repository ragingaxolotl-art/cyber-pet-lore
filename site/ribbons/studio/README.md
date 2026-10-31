# Ribbon studio

Open `index.html` through the Atlas website or a local HTTP server. The cabinet contains original independent PixelLab pieces and the sixteen existing quarter-award components. New artwork was generated against those references; no parts were cut out of a finished award. Original source pixels and provenance are preserved. The display fits ribbon bodies to 288 pixels high, pendant medals to 184, rosette heads to 152, and clasp bars to 92 pixels wide, using nearest-neighbor rendering. All sizes and positions are adjustable. The complete export canvas is 512 × 640 with transparency.

## Use

1. Click a part to add it; select it in Layers or directly on the preview.
2. Drag to move, or use the position and size controls. Forward/Backward controls stacking. Duplicate adds another copy for repeated clasps or trim.
3. Choose Whole layer to recolor that part. Choose One colour family, then Pick a colour and click a visible pixel of the selected part to recolor just similar hues. The range slider controls hue matching. This is hue selection, not semantic fabric/metal detection: if two materials share a hue, both may change. Shadows and highlights are retained. Original colours restores the source.
4. Copy code or download the recipe. Paste it into a conversation with Codex to reproduce the exact design. Load pasted code restores a design. Download PNG exports only the art, without the preview background or selection outline.

Autosave is local to this browser and origin. Recipe files are portable. No login, AI generation, network upload, student save changes, or gameplay grants happen while using the designer. All recoloring is local and spends no PixelLab generations. New part generation was a one-time creation step.

## Recipe contract

`RBN1.<base64url UTF-8 JSON>.<FNV-1a-32 checksum of JSON>`

The checksum detects accidental copy errors; it is not authentication. The strict decoder limits codes to 40,000 characters and 24 layers, checks the library/version, known part IDs, colors and finite position/scale bounds, then discards extra fields. Recipes cannot load external URLs or execute code. Never repurpose an existing part ID for different art; publish a new library version when changing existing artwork after release.

JSON fields: version=1, library="ornate-v1", name (up to 80 characters), layers ordered back-to-front. Each layer has part, x (center), y (top), scale, visible, mode (original/all/family), color, source and tolerance. Catalog parts contain immutable source file/hash, alpha bounds and default display width/height and position. `model.mjs` is the authoritative portable decoder and recolor implementation. The UI crops only transparent margins at draw time; the PNG files remain unchanged. `catalog.json` preserves PixelLab job IDs and source paths. `generation-record.json` retains generation and repair receipts.

Run checks: `node --test model.test.mjs` from this directory. Render a code by loading it in the studio and exporting PNG; this uses the same rendering path as the live preview, without the editing outline. Designs are visual proposals; the game’s award catalog remains authoritative for criteria and rewards.
