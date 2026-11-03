# Ribbon studio

Open `index.html` through the Atlas website or a local HTTP server. The cabinet contains original independent PixelLab pieces and the sixteen existing quarter-award components. New artwork was generated against those references; no parts were cut out of a finished award. Original source pixels and provenance are preserved. The display fits ribbon bodies to 288 pixels high, pendant medals to 184, rosette heads to 152, and new clasp bars to 112 pixels wide, using nearest-neighbor rendering. All sizes and positions are adjustable. The complete export canvas is 512 × 640 with transparency.

## Use

1. Click a part to add it; select it in Layers or directly on the preview.
2. Drag to move, or use the position and size controls. Forward/Backward controls stacking. Duplicate adds another copy for repeated clasps or trim.
3. Use Material colours to tint metal, fabric, gemstones, or leaves separately. Apply a matching palette to coordinate the design. For advanced whole-layer or hue-family recolouring, turn off Keep materials separate first. Shadows and highlights are retained.
4. Copy code or download the recipe. Paste it into a conversation with Codex to reproduce the exact design. Load pasted code restores a design. Download PNG exports only the art, without the preview background or selection outline.

Autosave is local to this browser and origin. Recipe files are portable. No login, AI generation, network upload, student save changes, or gameplay grants happen while using the designer. All recoloring is local and spends no PixelLab generations. New part generation was a one-time creation step.

## Recipe contract

`RBN1.<base64url UTF-8 JSON>.<FNV-1a-32 checksum of JSON>`

The checksum detects accidental copy errors; it is not authentication. The strict decoder limits codes to 40,000 characters and 24 layers, checks the library/version, known part IDs, colors and finite position/scale bounds, then discards extra fields. Recipes cannot load external URLs or execute code. Never repurpose an existing part ID for different art; publish a new library version when changing existing artwork after release.

JSON fields: version=1/2/3, library="ornate-v1", name (up to 80 characters), layers ordered back-to-front. Each layer has part, x (center), y (top), scale, visible, mode (original/all/family), color, source and tolerance. Catalog parts contain immutable source file/hash, alpha bounds and default display width/height and position. `model.mjs` is the authoritative portable decoder and recolor implementation. The UI crops only transparent margins at draw time; the PNG files remain unchanged. `catalog.json` preserves PixelLab job IDs and source paths. `generation-record.json` retains generation and repair receipts.

Run checks: `node --test model.test.mjs` from this directory. Render a code by loading it in the studio and exporting PNG; this uses the same rendering path as the live preview, without the editing outline. Designs are visual proposals; the game’s award catalog remains authoritative for criteria and rewards.

## Separate gemstones and leaves

Gem-bearing and leaf-bearing parts now have independent **Tint gemstones** and **Tint leaves** controls. Metal and fabric also have their own controls in the expanded cabinet. New parts keep materials separate by default; old recipes retain their exact rendering until you enable separation or a material tint. Metal preset buttons enable separation automatically. Uncheck a material tint to restore its original pixels.

Selections are explicit pixel runs in `material-selections.json`, using original PNG coordinates. They select the visible gem interior or leafwork without replacing source artwork. Leafwork includes stems and the raised leaf decoration on the oak shield. Source PNGs, IDs, hashes and provenance remain unchanged. Tinting preserves original lightness differences, saturation variation, shadows and white highlights. Preview and PNG export share the same renderer. Optional `materialColors` recipe fields (`gem` / `leaf`, hex colour or null for original) persist through undo, duplication, autosave and recipe round-trips; absent fields retain legacy behaviour.

Regenerate the expanded catalog and selections with `python3 tools/build_ribbon_expansion.py --require-counts` (Pillow). The original reviewed selections are preserved under `sources/ribbon-expansion/`. Run `node --test tests/ribbon-materials.test.mjs` from the repository root to check artwork hashes, selection bounds, recipe compatibility and independent tint behaviour.


## Rotation

Select any layer, then enter Rotation (degrees), use the ±15° buttons, or Reset rotation. Each part rotates around its own displayed center. Move, resize, layer order, material tinting, pixel picking, undo/redo, duplication, browser drafts and transparent PNG export retain the angle. Position remains the unrotated top-center.

The RBN1 envelope and checksum are unchanged. Unrotated legacy recipes retain version 1; recipes with a nonzero rotation use JSON version 2 and a finite per-layer rotation from −180 through 180 degrees. New code reads both versions; older designers reject version 2 instead of silently discarding the angle. Missing rotation means zero. Source artwork and part hashes are unchanged.


## Expanded PixelLab cabinet (November 2026)

Every category has at least 60 distinct artwork choices. The original 40 pieces keep their IDs, source pixels, sizes and placement. Seven additional existing PixelLab components were recovered from the canonical game asset directory, with original paths and hashes recorded. New parts are PixelLab Pro generations; some receive explicitly recorded PixelLab pixel-workbench finishing for hanging loops, metal tips or clasp endcaps. Candidate images with unfinished cut edges are excluded. Colour variants do not count as additional choices.

Use the collection filter to distinguish original, recovered and new artwork. Use **Show only orbit particles** for small floating pieces. The earlier ornate satellite designs are kept in **Medals & pendants**. The cabinet loads thumbnails in pages of 60 and only loads full canvas images when a design needs them.

Use **Material colours** to tint metal, fabric, gems and leaves independently. The four ramps in new artwork support deterministic material selections, including dark facets and highlights. Original gem/leaf selections remain unchanged. Each tint preserves the lightness ordering of source shading; unselected materials and transparency retain their original pixels. **Match … across design** matches one material; **Apply matching palette** coordinates all four and makes subsequently added parts inherit those colours. Disable separation to use the legacy whole-layer or hue-family controls.

Particle groups start with **Horizontal orbit** enabled. The source images are separated into up to 16 independent pixel islands, with explicit selection runs preserving every original pixel. Each bit follows the same horizontal ellipse at a staggered phase, so one group can be behind and in front of the pendant simultaneously. **Particle group spacing** changes the total arc occupied by the trail. Groups remain one editable layer for moving, tinting, sizing, duplication and recipes. Other ornaments can also enable orbit. Each moves left/right in a shallow perspective ellipse, behind the static ribbon on the far side and in front on the near side. Position anchors its orbit; width, depth, period and starting phase are adjustable. Give multiple ornaments different phases. Motion can be paused and respects reduced-motion preference at startup. Recipes preserve motion settings; PNG export is the current still frame, not an animated file.

JSON version 3 adds optional design `palette` and layer `orbit: {radius, depth, period, phase, spread?}`, plus `metal` and `fabric` in `materialColors`. Existing versions 1 and 2 remain readable and retain legacy rendering. The RBN1 envelope is unchanged; older editors reject version 3. Separate material and orbit settings survive undo, duplication, autosave and portable recipes.

Generation receipts, rejected-candidate audit, source inventory and PixelLab finishing recipes are in `sources/ribbon-expansion*`. Blank seal/frame/lid components support the other chat's proposed future pet emblems and lettering. This update does not implement that chat's full grouping, pet-lettering, cabinet, or animated-locket plan.


## Preserve every generation

**Download all generations** provides the original cabinet, recovered art, every new candidate (including rejected candidates), separate PixelLab finishing outputs, source job records, catalog and material selections. Prior cabinet generations and repair images are also retained in `parts/previous-generations/`. No previous generated file is overwritten by a finish or discarded for failing cabinet review. Rebuild the deterministic ZIP and hash inventory with `python3 tools/archive_ribbon_generations.py`.
