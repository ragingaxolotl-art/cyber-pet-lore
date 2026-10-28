# Illustrated references in the logbook

Ribbons and Illnesses are native reading collections, not just external galleries.
160 ribbon cards and 46 illness cards each have a stable reading ID. Each directory
also has one full collection reading, retaining all cards on the same page.
Collection notes and individual-card notes are separate, clearly labeled records.

All use the existing article notes, highlights, tags, clips, read marks, reading
positions, notebook, local save, exports and authenticated private backups. No new
storage format, server permission or backup system is introduced. Existing private
backups still need the user's code; browser saving requires no code.

`tools/build_reference_readings.py` runs from the regular catalog build. IDs use
the existing card ID plus a fixed ribbon-/illness- prefix. Paragraph IDs use stable
field names, so reordering cards does not move notes or highlights. Old prose IDs
and text remain unchanged. Full collection blocks use the same field IDs but a
different reading record, making their independently written notes unambiguous.

`reference-art.mjs` adds only images/canvases after highlight painting, never extra
text inside an anchored paragraph. Animation is lazy/visible-only, has a pause
control and follows Reduced Motion. Original galleries/downloads are retained and
every card links directly to its logbook record. Main navigation opens collections.
