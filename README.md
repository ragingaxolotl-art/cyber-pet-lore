# Cyber Pet Lore

The separate Cyber Pet reading archive: https://ragingaxolotl-art.github.io/cyber-pet-lore/

## Collection

484 indexed readings from the Cyberpath Stories Archive, CPP Lore, DBA Era 0 Language, Cyberpath Locations Atlas, the Game Lorebook additions, and two local reference guides. This is an October 27, 2026 source snapshot, not automatic synchronization with Google Docs.

- 14 primary stories (13 complete; The Corrected Child is unfinished)
- 19 earlier drafts and alternate copies
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

## Era Zero songs

Open **Era Zero songs** in the main navigation, or visit https://ragingaxolotl-art.github.io/cyber-pet-lore/songs/. Four original instrumental compositions include full arrangements, isolated language melodies, synchronized verified meanings, phrase seeking, and audio/MIDI/meaning-sheet downloads. Source: `CPP-V3/exports/era-zero-songs/2026-10-27` on the Cyber Pet Workspace SSD. These are new compositions, not historical recordings or human-sung voices. The source export retains lossless masters and score provenance.

## Connected song lore and translator

Each song now has an original Era Zero backstory and a supporting performer profile: Sova, Neral, Pelli, and Keshet. The Listening Alcove is a new small location within the Garden Worlds. These additions live in `sources/song-cycle.json`, are labeled new fiction, and preserve uncertainty around proposed settings and later survival. The 14 archived primary stories and all source paragraphs remain unchanged.

The reader’s **Follow the connections** section links named places, people/groups, related readings, and songs in both directions. A shortcut appears in the reader outline. Exact named mentions are distinguished from authored song-cycle connections; links do not assert identity or geographical relationships. Place/person links also open a library-wide list of mentions. `tools/build_connections.py` rebuilds these references and verifies targets. Song links select the correct track directly.

**DBA translator** in the main navigation and song player opens https://ragingaxolotl-art.github.io/era-zero-translator/. Language and song readings also offer this link.
