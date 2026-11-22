# Unified lore workspace implementation

Authorized November 22, 2026: implement the full website audit recommendations.
The source requirements and acceptance checks are in `lore-audit-findings.json`.

## Implementation coverage (checked = code implemented, not browser acceptance)

- [x] F01 global metadata, passage, tool and private-note search
- [x] F02 shared notebook coverage and canonical note targets
- [x] F03 field/note revisions, conflict preservation and deletion tombstones
- [x] F04 common local/online save lifecycle on every surface
- [x] F05 typed targets and backward-compatible browser/server validation
- [x] F06 searchable/filterable notebook, pins and questions
- [x] F07 consistent primary navigation and return paths
- [x] F08 maintained publication manifest and personal log migration
- [x] F09 mobile chapter picker, notes access and save status
- [x] F10 catalog-first loading and smaller initial knowledge payload
- [x] F11 stable article anchors and visible outdated quotations
- [x] F12 URL search/filter state and complete reset
- [x] F13 canonical reader links and shared chapter notes
- [x] F14 map stage notes, name/code search and stage comparison
- [x] F15 versioned tool artifacts and unified export/restore
- [x] F16 backup capacity/visibility and explicit access model
- [x] F17 task-oriented homepage and contextual routes
- [x] F18 generated documentation counts and repeatable build checks
- [ ] End-to-end browser/device/accessibility and authenticated test backup validation
- [ ] Publish, verify live and synchronize the SSD workspace

## Constraints

Preserve original story block IDs, quotes, distinct manuscript editions, private
notes and existing source assets. No student or game save data enters Lore.
Do not use iframes for pages already owned by this site. Public discussion,
published annotations and the private notebook remain visibly different.

## Current verification limitation

Browser control was disabled during the audit; recheck availability during
implementation and keep unverified visual/device tests explicit. The active goal
remains open until its implementation and required validation are complete.

## Verification and deployment evidence

- Before the latest upstream integration: 204 full website tests passed; five Haven titles, Vell (28 passages), exact prose and sound-library discovery probes passed. Later targeted tests cover canonical chapter anchors, generated census, whole song restoration and offline recovery. A final build and full suite are required after merging current main.
- Reader connection payload: 320,244 bytes, versus 4,547,266 bytes for the full wiki. This is a file-size comparison, not a measured mobile network benchmark.
- Backup service version 94 deployed successfully at `https://cyber-pet-classroom-settings.ragingaxolotl.chatgpt.site`, source `efc90021ad75cfc8b7d738734050bff8c2e21edd`. New authenticated in-memory database tests verify v2 persistence, old-client preservation, tombstones and invalid targets. Service build passed; 144 tests passed and one unrelated Foundling test file could not load its sibling board-site fixture in the isolated checkout.
- No production reader notes or backup code were accessed for testing. Live authenticated restore across devices remains unverified.
- Browser access was checked again: Work settings disable local browser use. Mobile 390px/200% zoom, keyboard interaction and rendered layout remain unverified.
- Archived early-language source files retain their original hashes. They and preserved previews intentionally do not acquire the new navigation.

### Integrated release checks

Current main through `c56bd5d` was merged, preserving the newer translator meanings, Dance announcers and illness visual revisions. The combined build indexes 1,758 resources and 44,180 passages. All explicit local HTML page and asset links resolve. Entry scripts and schema-related imports carry a consistent release query so cached older modules cannot mix with notebook v2.

Final integrated automated suite before publication: **237 tests passed, 0 failed**. Rendering, mobile network timing and live authenticated cross-device restoration remain explicitly unverified.

The subsequent six-illness update `6d1fda3` was also merged. Final pre-publication suite: **240 passed, 0 failed**; regenerated search now contains 44,288 passages.

### HTTP integration and first successful publication

GitHub Pages run `45079128898` succeeded on attempt 2. Attempt 1 passed the build and tests but failed to discover its just-uploaded Pages artifact; the artifact was confirmed present before retrying.

`tools/check_notebook_service.mjs <service checkout>` starts an isolated HTTP server using the deployed handler, an in-memory database and temporary test authentication. It passed restore across two independent notebook clients, typed map records, ribbon artifacts, competing note edits, deletion tombstones and expired-session recovery. It does not access production reader records. Each NotebookStore now owns a distinct writer identity; its regression is included in the **241 passing website tests**. Actual browser interactions and live production authenticated restore remain unverified.

The replacement browser tool was attempted after the environment change. Setup failed with `Trusted RPC service is not configured: browser`; no browser instance was established.
