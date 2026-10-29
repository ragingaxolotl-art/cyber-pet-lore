# Story genre reference

Live route: `genres.html`. Canonical definitions and reviewed story associations: `site/genres.json`.

The hierarchy is an original editorial browsing arrangement, not a universal taxonomy. Established genres and recognized labels are distinguished from locally named planning branches, themes, tropes, forms, techniques, tones, audiences, and reference shelves. Definitions and prompts are original writing; external links provide classification background rather than a reproduced commercial taxonomy.

The default nested view uses native disclosure branches; clicking a parent reveals its children. Full explanation opens a native modal dialog on the same page, with its definition, scope note, writing prompt, ancestors, children, and reviewed existing-story matches. Supporting passages expand inside the dialog. A deliberate full-story link navigates in the same tab. Escape and Close restore focus. Search and category/type/story/match filters operate together; reset restores the full tree. CSV exports all entries, not just filtered rows.

Green marks a direct reviewed association; amber marks an association inherited from a narrower branch. Both have text labels. No match means no reviewed association, not that no qualifying story exists. Matches are editorial interpretations, never new canon, and prose remains unchanged. Current coverage: all fifteen catalog entries of kind Story, including both parts of the now-completed Corrected Child. Status is read from the live catalog. Plans are not counted as existing prose.

To add an entry, assign a stable unique ID, existing parent (or null), type, definition, prompt, scopeNote, and matches array. To add a story association, read the text and record its story ID, exact paragraph ID, reason, and assessment. Parent results deduplicate stories and prefer a direct association. Do not classify by title keywords. Future stories require review. Run `node --test tests/genres.test.mjs` and the existing suite. Test keyboard focus, Escape, mobile scrolling, inline passage expansion, filters, and CSV in a browser after UI changes.

The expanded reference contains 508 entries. Slice-of-life planning branches cover household, school, work, friendship, care, neighborhood, hobbies, transitions, and speculative routines. Poetry separates purposes such as lament/dirge/elegy from fixed forms and devices. Story structures and plot patterns have their own shelves. These are editorial arrangements, not an exhaustive or universal taxonomy.

Table view remains available. Filters show matching entries plus their ancestor context and open paths to results. Expand/collapse and focused browse shortcuts require no browser storage. Optional aliases improve search; related IDs and per-entry references appear in the explanation. New labels must not imply a recognized form when they are editorial planning categories.
