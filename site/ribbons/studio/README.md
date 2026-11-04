# Creative Ribbon Studio — version 3

The existing 40-part cabinet, material tinting and rotation are retained. New designs support up to 64 layers; old RBN1 version-1 and version-2 recipes remain readable. Extended designs use version 3 inside the same checksummed envelope. Imported images are decoded locally, reduced to at most 256 pixels per side, and embedded as PNGs. Recipes never fetch external artwork or run code. Exported recipes are limited to 3 MB.

## Create and arrange

Use **Add lettering** to write on seals, locks, clasps or medals. The lettering is a separate movable layer: select it together with its background and group them. Styles include plain, engraved, raised and glowing, with color, font and size controls. Use **Add picture** for an emblem or pet portrait; **Draw pixel emblem** opens a 16-by-16 editable grid. Emblems support circle, shield, scalloped seal, square and opening-locket frames.

Shift-click layer rows for multiple selection. Group/ungroup, lock/unlock, linked mirror copies, unlink, center, center alignment and spacing controls operate on the selection. Dragging a group preserves its offsets. Locked layers cannot be dragged or edited. Mirrored partners follow edits across the center of the 512-by-640 canvas. The snap toggle controls the 8-pixel grid; the visible center guide shares that grid. Old rotation and source-pixel color picking work with mirrored layers.

## Keep designs and matching sets

The browser cabinet uses IndexedDB and retains named thumbnails and five earlier saved versions per design. Save as new duplicates a design. Gold/silver/bronze and quarterly sets share a set identifier; updating a set propagates the current layout and award text while preserving variant colors and layers marked unique. Cabinet storage is local to this browser and origin. Download recipes as independent backups. Legacy draft autosave remains available.

## Motion and exports

Each layer supports up to six effects: shine, foil, hologram, gemstone highlights, sparkles, glow, runes, orbiting stars/moons/crystals, flutter and sway. Each has color, speed, intensity and continuous/hover/click playback. Three reveal styles and interactive locket opening are included. Motion pauses when the document is hidden; reduced-motion mode keeps a still presentation and immediate locket opening. The editor updates at most 24 times per second.

PNG exports remain transparent and omit selection marks. Animated PNG export renders 48 lossless frames at 12 fps with transparent backgrounds. Export triggers are deliberately played for the recording. Character-card, award-popup and print-size previews use the same renderer. Award-card export includes the name, description, criteria and artwork.

## Classroom recognition

Download a **teacher review package**, then open it under Custom Ribbon Studio award in the authenticated character manager. The teacher sees its artwork, name and earning criteria before assignment. Assignment/removal uses existing revision checks, immutable backups and explicit ribbon decisions. No student data is changed by using the studio or importing a review package.

Packages contain a portable recipe, 512-by-640 still and a 12-frame 128-by-160 animation strip. Up to twelve cosmetic custom ribbons may be assigned per character. The game applies them through its authenticated entry-time ribbon sync, saves them, displays them in the character's honors row and prints their still artwork. In-game playback uses the compact baked animation; editable hover/click triggers and the full interactive locket remain studio features. Custom awards grant no levels, XP or stat bonuses.

Validation includes old recipe/material/rotation tests, creative recipe and editing regressions, APNG checksums, a Node DOM/Canvas runtime harness, teacher API grant/removal checks, and isolated Godot save/sync/printing/render tests. Interactive browser QA is unavailable while local browser control is disabled in Work settings.

## Portable format and provenance

`RBN1.<base64url UTF-8 JSON>.<FNV-1a-32 checksum>` remains the portable envelope. The checksum detects copy errors, not author identity. Version 3 carries custom layers, group and mirror IDs, lock state, effects, set information and award text. Known-part IDs, finite transforms, image dimensions, colors, effect counts and text lengths are bounded before a recipe replaces the current design. Catalog source hashes, source paths, material masks and original PixelLab generation records remain unchanged.
