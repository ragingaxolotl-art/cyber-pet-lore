# Cyber Pet Lore

The separate Cyber Pet reading archive: https://ragingaxolotl-art.github.io/cyber-pet-lore/

## Collection

475 indexed readings from the Cyberpath Stories Archive, CPP Lore, DBA Era 0 Language, Cyberpath Locations Atlas, the Game Lorebook additions, and two local reference guides. This is an October 27, 2026 source snapshot, not automatic synchronization with Google Docs.

- 14 primary stories (13 complete; The Corrected Child is unfinished)
- 19 earlier drafts and alternate copies
- 18 timeline sections, 94 people sections, 205 location sections, 119 language sections, and 6 reference readings

Location sections include multiple treatments of the same place: the atlas describes 106 numbered locations. The Quiet One’s Human is one work with its eleven installments in the reader outline. Unknown dates are left unspecified. Within-era ordering follows source order where precise dates are unavailable. Character/place filters represent mentions, not claims about participation or geographical relationships.

## Reading

Choose a collection, era, character, place, or reading status. Search titles, summaries and topic metadata. Open a reading, check **Mark as read**, select text to highlight it or add a note, and write in the margins. **My notebook** brings annotations together. Personal tags can be used to filter the library.

Reading records save automatically in localStorage in the same browser, device, and website origin. They do not sync through GitHub or an account. Clearing website data removes them. **Saved reading → Download reading backup** exports a portable JSON copy. Import merges records; the most recently updated record wins per reading. A pre-import snapshot can be downloaded. Storage errors show a visible warning rather than silently claiming success. Backups contain your notes; keep them private.

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
