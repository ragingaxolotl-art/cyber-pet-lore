# Ribbon gallery — November 3, 2026

The lore website now opens Ribbons & honours as a compact gallery. Four sections separate game awards, classroom honours, design resources, and archived concepts. Search, collection and kind filters work together. Hover and keyboard focus show dismissible previews; click, Enter or touch open a modal with complete details. Escape and Close return focus. Existing award hashes and individual reading IDs remain valid.

High Honors includes five anonymous Celestial / Divine Code display examples, zero through four clasps. Benefits follow CPP-V3 high_honors.gd (+5 base skill cap, +2 per clasp, maximum +13; strongest quarter only). No student records or awards are changed. Source PNGs and attribution are in site/ribbons/art/high-honors/.

Build: python3 tools/build_catalog.py (includes tools/build_ribbon_gallery.py). Directory JSON remains the canonical gallery data; individual logbook notes remain in the existing reader. Historical ZIP downloads remain explicitly labeled as original archives; current definitions and per-card artwork links are available separately.

Validation: full Node test suite plus DOM interaction checks for filtering, previews, modal details, deep links, close/focus, and High Honors examples. Browser visual inspection is unavailable in this session because local browser access is disabled.
