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

`source-data` is stored in `sources/`: only the requested fiction/reference source text and provenance, with no student profiles, game saves, credentials, or reader annotations. `tools/story-segmentation.json` records story boundaries and metadata. `tools/build_catalog.py` verifies every source paragraph and the exact concatenated source text, including text originally fused to adjacent headings. Stable paragraph IDs anchor highlights, and quote verification prevents silently moving a highlight onto changed text. When refreshing sources, preserve IDs or provide an explicit migration; paragraph insertions can otherwise invalidate old anchors. Original images and rich document layouts are not reproduced; source links remain available.

Content belongs to the project author(s); publication does not grant a new reuse license. Public source links may still require permission to open the original Google Docs.

## Numbered clips

Select a passage and choose **Clip**, add optional notes, review the detected character names, and click **Clip** in the dialog. Existing highlights have a Clip action too, which preserves their notes and anchors. Each clip stores a sequential number, the story title and ID, era/context, exact selected text, characters, and notes. A clear era section can narrow the era of a passage in a story spanning several eras; uncertain context retains the story's era range. Character detection matches explicit names; review the editable list for pronouns or shortened names.

Clips remain highlighted in the story. **My notebook → Show only clips** collects them with editable notes, a **Return to passage** link, and **Copy passage** for preparing teasers. Copying does not publish anything. The existing Save button, automatic browser saving, and JSON backups include clips. Imported clip number collisions are assigned the next available number while local numbers remain stable. Numbers are personal to the browser's reading collection, not a public global numbering system. Earlier reading backups remain supported.

## Private GitHub backup

Backups connects directly to `ragingaxolotl-art/cyber-pet-lore-backup` using a user-entered fine-grained token restricted to that repository with Contents read/write permission. The token is retained only in page memory, never in browser storage, downloads, or source control. Reconnect after refreshing or closing. No server credential is bundled in this public website.

Connection checks repository privacy, reads and validates `reading-backup.json`, merges existing records, and saves the collection. Changes back up after five idle seconds while connected; Save and Back up now request immediate backup. Status is visible above the page and in Backups. GitHub failures leave browser data intact. Wait for confirmation before closing. Backups over 900 KB require JSON download instead.

Merge latest GitHub backup merges other-device updates; newer whole-reading records win, as for file imports. Prior local records can be downloaded from Backups after a merge. Concurrent GitHub changes stop writes until reconnect/merge, avoiding blind overwrites. GitHub commits retain previous versions. Connecting an empty browser restores existing records. The feature cannot access records from another browser/device; connect from the browser holding the notes.

API reference: https://docs.github.com/en/rest/repos/contents

## Era timeline

Open `timeline.html` from the main navigation. Eight clickable eras (−3 through 4) contain 103 sourced history entries, era summaries, human-world context, adjacent disputes, and links to the site reader. Weather links open the relevant era section. The current 14 primary stories are placed using the existing archive metadata; exact dates and intra-era ordering are not invented.

`tools/build_timeline.py` rebuilds `site/timeline.json` after the catalog. It uses stable reading/block IDs and preserved source passages. It separates established canon, expanded history, reconstruction, draft fiction, and six hypothetical Era Four continuations. The new chapel draft is preserved in `sources/chapel-pilgrim-draft.json` and indexed separately; existing story IDs, paragraph anchors, and reading records are unchanged.

Research coverage: the expanded CPP Lore chronology, primary story metadata, language history, and ten turns of the October 20 chapel discussion were reviewed. The current thread tools did not surface the older ChatGPT lore discussions; this is **not** a complete all-chat audit. The archived Real World Relationship Guide is empty. No human calendar dates or fixed Codex/human time conversion were found in the reviewed sources. Dates remain explicitly unestablished, with relative human-world context shown for each era. Future source evidence can refine these fields.

Validation: timeline and reading tests cover existing reading/clip/backup behavior, all era order and deep links, every internal story/history anchor, full primary-story coverage, multi-era Weather anchors, uncertainty placement, speculative-history separation, and exact preservation of event excerpts.

## Era Zero songs

Open **Era Zero songs** in the main navigation, or visit https://ragingaxolotl-art.github.io/cyber-pet-lore/songs/. Four original instrumental compositions include full arrangements, isolated language melodies, synchronized verified meanings, phrase seeking, and audio/MIDI/meaning-sheet downloads. Source: `CPP-V3/exports/era-zero-songs/2026-10-27` on the Cyber Pet Workspace SSD. These are new compositions, not historical recordings or human-sung voices. The source export retains lossless masters and score provenance.

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
