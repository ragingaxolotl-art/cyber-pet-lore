# DBA translator and Lore backups

The browser translator is vendored in `site/translator/`; see its PROVENANCE.md for the upstream revision. Canonical language data is unchanged. Preserve the Lore integration when updating the vendor files.

DBA concept proposals and recorded reviews live in the optional `conceptQueue` field of the existing version 1 reading state. Old backups remain readable. `concept-records.mjs` validates backup structure; the translator additionally validates approved targets against its dictionary. Proposal IDs merge independently by updated_at; reading merges keep their existing behavior.

Opening the translator imports the previous `era-zero-concept-queue-v1` browser value without deleting it. A valid proposal is retained in memory before local persistence is attempted. Full or blocked browser storage cannot discard it; the page offers proposal export and a complete Lore backup. Unsaved changes warn before leaving. Private saving uses the same Lore backup session/code and reads and merges the latest remote revision before writing. A conflict is reported for retry; no last-write-wins overwrite is attempted.

The existing private backup service was updated to preserve this field and current highlight tags/context. It also preserves proposals submitted by newer clients if an older open Lore tab saves a state without the field. No dictionary root or compound is created by a saved proposal.

Verification: node --test tests/*.test.mjs; backend tests/lore-backups.test.mjs; browser proposal save, refresh, and Lore backup summary. Synthetic data only. No private backup code or real saved records were used in testing.
