# Cyber Pet Lore

The separate Cyber Pet reading archive: https://ragingaxolotl-art.github.io/cyber-pet-lore/

## Collection

485 indexed readings from the Cyberpath Stories Archive, CPP Lore, DBA Era 0 Language, Cyberpath Locations Atlas, the Game Lorebook additions, and two local reference guides. This is an October 27, 2026 source snapshot, not automatic synchronization with Google Docs.

- 14 primary stories (13 complete; The Corrected Child is unfinished)
- 20 earlier drafts and alternate copies (including the reviewed chapel draft)
- 18 timeline sections, 98 people sections, 206 location sections, 119 language sections, 4 song backstories, and 6 reference readings

Location sections include multiple treatments of the same place: the atlas describes 106 numbered locations. The Quiet One’s Human is one work with its eleven installments in the reader outline. Unknown dates are left unspecified. Within-era ordering follows source order where precise dates are unavailable. Character/place filters represent mentions, not claims about participation or geographical relationships.

## Reading

Choose a collection, era, character, place, or reading status. Search titles, summaries and topic metadata. Open a reading, check **Mark as read**, select text to highlight it or add a note, and write in the margins. **My notebook** brings annotations together. Personal tags can be used to filter the library.

Click **Save** in the top navigation for an immediate save confirmation. Automatic saving also remains enabled. Reading records save automatically in localStorage in the same browser, device, and website origin. Use **Backups → Connect and back up** to enable private GitHub backups for the current page session. Clearing website data removes them. **Backups → Download reading backup** exports a portable JSON copy. Import merges records; the most recently updated record wins per reading. A pre-import snapshot can be downloaded. Storage errors show a visible warning rather than silently claiming success. Backups contain your notes; keep them private.

## Develop and verify

No dependencies or build framework are required. With Python 3 and Node 22+:

```sh
python3 tools/build_catalog.py
npm test
npm start
```

Open http://127.0.0.1:8768. GitHub Actions rebuilds, tests, and deploys `site/` to GitHub Pages.

`source-data` is stored in `sources/`: only the requested fiction/reference source text and provenance, with no student profiles, game saves, credentials, or reader annotations. `tools/story-segmentation.json` records story boundaries and metadata. `tools/build_catalog.py` verifies every source paragraph and the exact concatenated source text, including text originally fused to adjacent headings. Stable paragraph IDs anchor highlights, and quote verification prevents silently moving a highlight onto changed text. When refreshing sources, preserve IDs or provide an explicit migration; paragraph insertions can otherwise invalidate old anchors. Original rich document layouts are not reproduced; mapped project location artwork is shown separately from source paragraphs. Source links remain available.

Content belongs to the project author(s); publication does not grant a new reuse license. Public source links may still require permission to open the original Google Docs.

## Numbered clips

Select a passage and choose **Clip**, add optional notes, review the detected character names, and click **Clip** in the dialog. Existing highlights have a Clip action too, which preserves their notes and anchors. Each clip stores a sequential number, the story title and ID, era/context, exact selected text, characters, and notes. A clear era section can narrow the era of a passage in a story spanning several eras; uncertain context retains the story's era range. Character detection matches explicit names; review the editable list for pronouns or shortened names.

Clips remain highlighted in the story. **My notebook → Show only clips** collects them with editable notes, a **Return to passage** link, and **Copy passage** for preparing teasers. Copying does not publish anything. The existing Save button, automatic browser saving, and JSON backups include clips. Imported clip number collisions are assigned the next available number while local numbers remain stable. Numbers are personal to the browser's reading collection, not a public global numbering system. Earlier reading backups remain supported.

## Private code-based backup

Open Backups, enter your backup code, and choose Unlock and back up. The site merges remote reading records, preserves a pre-merge browser copy, then saves notes, clips, highlights, tags, and progress after five idle seconds. Save and Back up now save immediately. Online records use the existing Cyber Pet service at `/lore-backups`, in separate lore tables; they are not written to either GitHub repository or student storage.

The server-only `LORE_ACCESS_CODE` secret authorizes an independent 12-hour session. Only its opaque session token is kept in this tab's session storage; the code is not persisted or bundled. Refresh resumes the session. Lock revokes it. Local reading data remains on the device after locking. Anyone with the shared code has access to the online notebook.

Server checks enforce allowed origins, login throttling, a 900 KB request limit, validated reading data, and atomic revision comparisons. Prior versions remain in private storage. A conflicting save stops and requests Merge latest backup; newer whole-reading records win on merge. Download/import remain available. Existing private GitHub backups are not deleted; download their JSON and import it if needed. The GitHub client module remains for compatibility tests, but the main website no longer asks for a GitHub token.

## Era timeline

Open `timeline.html` from the main navigation. Eight clickable eras (−3 through 4) contain 103 sourced history entries, era summaries, human-world context, adjacent disputes, and links to the site reader. Weather links open the relevant era section. The current 14 primary stories are placed using the existing archive metadata; exact dates and intra-era ordering are not invented.

`tools/build_timeline.py` rebuilds `site/timeline.json` after the catalog. It uses stable reading/block IDs and preserved source passages. It separates established canon, expanded history, reconstruction, draft fiction, and six hypothetical Era Four continuations. The new chapel draft is preserved in `sources/chapel-pilgrim-draft.json` and indexed separately; existing story IDs, paragraph anchors, and reading records are unchanged.

Research coverage: the expanded CPP Lore chronology, primary story metadata, language history, and ten turns of the October 20 chapel discussion were reviewed. The current thread tools did not surface the older ChatGPT lore discussions; this is **not** a complete all-chat audit. The archived Real World Relationship Guide is empty. No human calendar dates or fixed Codex/human time conversion were found in the reviewed sources. Dates remain explicitly unestablished, with relative human-world context shown for each era. Future source evidence can refine these fields.

Validation: timeline and reading tests cover existing reading/clip/backup behavior, all era order and deep links, every internal story/history anchor, full primary-story coverage, multi-era Weather anchors, uncertainty placement, speculative-history separation, and exact preservation of event excerpts.

## Era Zero songs

Open **Era Zero songs** in the main navigation, or visit https://ragingaxolotl-art.github.io/cyber-pet-lore/songs/. Four original songs now use three synthesized DBA voices each. Every voice carries canonical Era Zero statements, with simultaneous meaning cards, solo listening, phrase seeking, and audio/MIDI/meaning-sheet downloads. Source: `CPP-V3/exports/era-zero-songs/2026-10-27` on the Cyber Pet Workspace SSD. These are new compositions, not historical recordings or human-sung voices. The source export retains lossless masters and score provenance.

## Connected song lore and translator

Each song now has an original Era Zero backstory and a supporting performer profile: Sova, Neral, Pelli, and Keshet. The Listening Alcove is a new small location within the Garden Worlds. These additions live in `sources/song-cycle.json`, are labeled new fiction, and preserve uncertainty around proposed settings and later survival. The 14 archived primary stories and all source paragraphs remain unchanged.

The reader’s **Follow the connections** section links named places, people/groups, related readings, and songs in both directions. A shortcut appears in the reader outline. Exact named mentions are distinguished from authored song-cycle connections; links do not assert identity or geographical relationships. Place/person links also open a library-wide list of mentions. `tools/build_connections.py` rebuilds these references and verifies targets. Song links select the correct track directly.

**DBA translator** in the main navigation and song player opens https://ragingaxolotl-art.github.io/era-zero-translator/. Language and song readings also offer this link.

## Wiki connections

Open **Connections** (`wiki.html`) to search 348 indexed people, places, stories, events, and ideas. Names in readings and timeline passages link to internal topic pages, with dossier links, “Mentioned in” passages, and direct timeline-event links. Each reading also includes related topics and eras. Vey and Pell have explicit disambiguation pages. Links indicate named mentions; they do not establish identity or causal relationships. Draft and proposed source labels remain visible.

`tools/build_wiki.py` rebuilds the index from published archive content after the timeline build. Automated checks validate every reading/block/event destination, ambiguous-name choices, and exact passage-text preservation for highlights and clips. Original-document provenance remains in the library Sources dialog; connected reading links stay on this site.


## Illness field guide

The **Illnesses** directory contains 46 named conditions: 15 random category variants and 31 location-specific trademarks restricted to corruption 4–5. Every entry includes an animated native Godot preview on anonymous sample artwork, a frame sheet, treatment information, and a clearly hypothetical future story hook. Filters cover category, location/name, and trademark status. The original stories and existing reading anchors are preserved.

Artwork includes 14 reviewed transparent PixelLab sprites, seven eight-frame loops, and native Godot echo, orbit, heat, and pulse effects. Reduced-motion preferences show still previews. The downloadable ZIP groups each illness with its description and frame sheet. Google Drive and CPP Lore/Locations Atlas tabs link to the same field guide. Runtime balance remains authored in CPP-V3/config/scenery_profiles.json.
## Semantic vocal arrangements (version 2)

The current player uses `site/songs/voices-v2/`: four songs, twelve separately auditable voices, 144 assertions and 1,508 notes. Every pitched event belongs to a canonical phrase. There are no accompaniment-only notes or percussion. The three concurrent statements remain independent; this does not establish a new canonical polyphonic grammar. Sound color is synthesized DBA vocal timbre, not a claim of recorded human pronunciation. Original instrumental exports remain as historical files; the player and backstories use version 2.

`tools/compose_song_voices.mjs <translator-directory>` derives the score from the official read-only translator MIDI renderer. `render_song_voices.py` renders lossless masters, `encode_song_voices.py` makes AAC listening files, `verify_song_voices.mjs <translator-directory>` verifies every solo MIDI phrase against the official renderer, and `check_song_voice_audio.py` checks every lossless solo note’s global spectral peak, clipping, and silence outside assigned note windows. Validation reports and the complete formal-source score are published with the version. Codec tools require macOS; numpy is required for rendering and audio checks.

## Location artwork

Existing location composites appear on matching **Connections** place pages and their location readings. `sources/location-art.json` records atlas IDs, exact wiki-topic/readings mappings, original asset paths, attribution and SHA-256 hashes. Display copies preserve the source dimensions and use WebP compression. The import source is the available October 26 project staging snapshot at `/private/tmp/boulder-test-source`; the SSD workspace volume was unavailable during this update. No student media or saves are included. The 65 mapped places include 66 views (the chapel has an exterior and interior). Places without available images remain text-only; no neighboring artwork is substituted.

`tools/import_location_art.py <project-source-directory>` imports already existing composites using `config/location_filesystem.json`; it does not generate art. `tools/build_wiki.py` attaches checked image references to the wiki and location readings. Images remain outside source text blocks so annotations and clips retain their original anchors.

Song location cards link artwork to the exact origin topic; the Listening Alcove uses explicitly labeled Garden Worlds context art. Image filenames include place names, and `site/images/locations/location-files.csv` maps every view to its original project asset and lore page. Wiki overviews and details reproduce source paragraphs with block-level citations; ambiguous identities remain separate.

Character profiles and era timelines use verbatim source passages. `sources/continuity-review.json` holds reviewed indexing corrections and source-scope notes, surfaced on the wiki and readings. `sources/continuity-audit-2026-10-27.json` records audit coverage and limits. Profile appearance eras are not birth dates or proof of survival; archive allocations are explicitly fictional decoration.

## Terms and unexplained lore

`terms.html` is the searchable register for source-attested concepts that may not have a dedicated definition. It filters by category, definition status, and associated reading. The initial pass scans all 485 catalog readings (32,137 text blocks) and records 228 terms across 11 categories. This is a growing editorial index, not a claim that every possible noun or concept has been found.

`sources/term-register.json` retains exact evidence, reading/block IDs, category, status, and editorial cautions. “Needs definition review” does not mean the source has no explanation anywhere; it means a standalone explanation has not been settled by this index. “Source explanation recorded” identifies explanatory source wording. Negative mentions, section titles, attributed interpretations, and earlier drafts retain their limitations.

The wiki builder validates each evidence quote, adds inline hyperlinks and reading backreferences, and creates Connected pages from topics named in the same paragraph. These are co-mentions, not inferred relationships. Every connection links to its shared passage. Story readers link to their filtered register. Coverage records enumerate every scanned reading; tests validate source conservation, categories/statuses, destination anchors, and connection evidence. Existing source prose and personal notes are unchanged.

## Embodiment and world development

Author-approved October 28 definitions are in `sources/world-development.json` and [development notes](docs/world-development.md), with a synchronized reference in CPP-V3 `docs/lore-world-development.md`. The build publishes linked concept entries, Lio and Sen profile supplements, and contextual links on The Corrected Child. Original story snapshots remain unchanged.

## Authored person articles

The Connections pages contain 71 authored biographies, including all 60 indexed individual topics and separately labeled historical or proposed roles. `sources/person-articles.json` supplies connected prose, passage-level evidence, linked places, and explicitly labeled interpretations. Proposed lives remain proposed; ambiguous identities remain separate. The source archive and original excerpts are expandable beneath each article. The build validates every evidence block, place destination, portrait path, and individual’s coverage against the 735-reading snapshot. Original source text and annotation anchors remain unchanged.

Seventeen new PixelLab studies interpret recorded appearance details; sixteen appear in the articles. Aru uses existing story-stage artwork, and Mael retains the concurrently published eight-direction PixelLab artwork (the new Mael study remains an alternate asset). Captions distinguish recorded features from illustrative choices. People without a usable visual description remain text-only. `sources/person-portrait-jobs.json` records accepted generation jobs, prompts, source blocks, local assets, and SHA-256 hashes. These are project illustrations, not additional canonical evidence.


## The Custodian Who Refused

A complete twelve-chapter proposed story is published at `custodian/`, with scene-by-scene chapter plans, exact-source continuity checks, an editorial review and a manuscript download. It is also a separate Draft reading with stable paragraph anchors for highlights and notes. New people and events remain proposed fiction; original archive prose and recovered proposal records are unchanged. Source: `sources/custodian-who-refused/`. Build integration: `tools/build_custodian_story.py`.

The current edition is the 16,605-word three-pass revision in `sources/custodian-who-refused-revised/`, published at the same `custodian/` collection. Its new archive reading ID preserves the first draft’s existing anchors. The revision record and three complete pass snapshots are linked from `custodian/revisions.html`; original manuscript and plans remain downloadable. `tools/build_custodian_revision.py` publishes this edition after the unchanged first-draft reading.

## Public comments and private feedback

Every archive reading and Connections article has a feedback form. Standalone story chapters and reference/planning pages receive it through `tools/build_comments.py`. Visitors choose a public comment (published after review) or private feedback (never exposed by the public API). Replies stay attached to the same reading. Existing highlights and notebook notes remain separate.

Open `comments-inbox.html` or the **Owner inbox** link beneath any form and unlock with the existing lore backup code. Anyone holding that code has inbox access. Approve/hide public comments and archive/restore private feedback. Private feedback has no publication action, and the server rejects attempts to publish it. No email or real name is required, and no notification email is sent.

The existing Classroom Settings service stores these records in separate `lore_comments` and `lore_comment_limits` tables at `/lore-comments`. Its migration and API tests live in that Site’s source repository. Submissions use opaque retry receipts, bounded input, same-thread reply checks, hourly rate limits and a honeypot. Public reads select only approved public fields. The form keeps unsent drafts in tab memory while switching readings; closing the tab discards unsent drafts. The inbox reuses expiring, revocable lore sessions; its responses are not cached.

## Aru — The First Newborn revised edition

The author-approved third revision is published as `aru-first-newborn-revised`. The previous edition retains `stories-p01889` and every original passage anchor, so existing notes and clips stay with the text they quote. The current edition appears in Stories; the previous edition is labeled in Drafts and links to it. The exact approved manuscript and its hash are in `site/aru/`. Editorial plans, reviews, explanatory cuts and the lore reserve remain in `sources/aru-first-newborn-revised/`; they are working material rather than newly established world history. The ending preserves room for Part Two.
