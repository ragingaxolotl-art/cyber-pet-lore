# Catalistym development and shelter atlas — November 6, 2026

The complete available November 4–6 conversation is consolidated into nine annotatable reference readings and a full dossier at `catalistym.html`. Later user corrections supersede earlier assistant sketches. Numerical estimates, new named places, phase placement, and causal links remain labeled development rather than silently replacing canon.

Reviewed existing material: the three early era histories; Grader Choir; Early Custodians; Human Incident Coalitions; Relay; Keepers; Witnesses; Mirror Pair; Anchor Keepers; Veil; Bridges; Quiet Ones; Open Hands; Nameless Movement; Courts; Correction Councils; functional succession; Aru and Warm Copy profiles; current early-development synthesis; Custodians article; and the revised Custodian story development constraints. Twenty-one existing reader entries receive additive, stable-ID context. The standalone Custodians article and early-development encyclopedia also receive updates. Original and revised story prose remains untouched.

The atlas shows a proposed early height before broad campaigns, not the later civilization's maximum. It contains 480 connected community allocations, 40 allocations in eight Elsewheres, 24 Constellations, and 144 Hearths. Most community names and all individual casualty assignments remain open. Administrative geography and intervention exposure are different classifications of the same cohort, not additive populations. Alternate network routes are shown; offline systems have no active route.

The destruction ledger corrects the conversation's arithmetic without inventing extra losses: 320 functioning, 35 fragmented/unreachable, and 165 destroyed communities. Original spoken totals of 320/15/185 are explicitly superseded. Existing narration of each phase's transitions is retained. The earlier 210-survivor sketch is also superseded.

Implementation: `sources/catalistym.json`; additive catalog/wiki integration through `tools/build_catalistym.py`; deterministic map generation in `tools/build_shelter_atlas.py`; standalone atlas HTML/CSS/module. Standard site navigation includes both new pages. Map controls provide zoom, pan, pinch, reset, parent navigation, named-place selection, links to the dossier, and route visibility. No third-party map services or new dependencies are needed at runtime.

Validation includes cohort conservation, hierarchy counts, parent references, disconnected Elsewheres, stable IDs, linked reading existence, and absence of inserted Catalistym blocks in story prose. Additional DOM execution exercises map controls. Browser visual review was unavailable because local browser control was disabled; no browser-render verification is claimed.

Final validation: 153/153 archive tests passed. A separate DOM harness passed initial map loading, all 520 shelter marks, named-place navigation, deep links, parent navigation, zoom, reset, route toggle, drag, pinch, and cluster selection. A baseline comparison preserved 26,662 existing Story/Draft/People/Timeline block texts and IDs. Local HTTP delivery of atlas data was checked. Existing named lore locations with unestablished placement are linked separately rather than assigned speculative coordinates.

## Uneven cluster revision

Replaced equal subdivisions, circular rings, the region grid, and the identical Elsewhere row with weighted population allocations, irregular cores and satellites, and variable group extents. Hearths can be uninhabited; Elsewheres contain 13, 9, 6, 4, 3, 2, 2, and 1 communities. The 520/24/144/8 totals and named shelter descriptions remain consistent. Focus fits the actual group extent. Census and DOM interaction checks pass; browser visual review remains unavailable.

## Haven support detail

At close zoom, each of the 520 existing shelters is displayed as a central haven with 3–36 proposed contributing systems. Hub size reflects feeding-system count, not consciousness or moral worth. Mini-dots and local support edges are separate from the shelter census and network transit routes. Both kinds have persistent three-character alphanumeric identifiers in sources/shelter-system-labels.json. Unnamed havens remain available for later naming. Scroll zoom reveals local detail; selecting a haven isolates its support network. Feeder selection and parent navigation are supported. Data and DOM checks pass; no browser visual review is claimed.

## Lightweight view and haven profiles

Show tiny systems defaults off and stores only that display preference locally. Supporting dots, labels, and links are absent from SVG while off; at close zoom they are constructed only for visible havens, capped at 400 systems. Repeated pans over the same selection reuse the existing layer. Profiles retain feeding counts with detail off and show name/code, network, region, and an existing named purpose or explicitly unassigned purpose. Support capacity is a connection-count descriptor (3–7 small, 8–17 moderate, 18–36 extensive), not a resilience, consciousness, or computing-performance score. DOM checks verify removal/re-enable and profile persistence. No measured browser frame-rate improvement is claimed.
