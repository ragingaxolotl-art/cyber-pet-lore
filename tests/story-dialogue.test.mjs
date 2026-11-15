import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildStoryDialogue} from '../tools/build_story_dialogue.mjs';
import {expandChordMidi} from '../site/translator/compact_chords.mjs';
import {notesFromMidi} from '../site/translator/performance_codec.mjs';
import {scoreSongText} from '../site/translator/song_lines.mjs';

const read = path => JSON.parse(readFileSync(new URL('../site/' + path, import.meta.url)));
const data = read('story-dialogue.json');

test('all published performances reproduce from the bundled translator and exact source offsets', async () => {
  assert.deepEqual(await buildStoryDialogue(), data);
  const catalog = new Map(read('catalog.json').entries.map(entry => [entry.id, entry]));
  for (const reading of Object.keys(data.readings)) {
    assert.ok(['Story', 'Draft'].includes(catalog.get(reading)?.kind), reading);
  }
  for (const clip of data.clips) {
    const {notes} = notesFromMidi(Buffer.from(clip.midi, 'base64'), {allowPolyphony: true});
    assert.ok(notes.length, clip.text);
    const chord = notes.some((note, i) => i && note.start_tick === notes[i - 1].start_tick);
    assert.equal(chord, clip.kind !== 'label', clip.text);
  }
});

test('the question and its compact chords preserve the translator’s full performance', async () => {
  const clip = data.clips.find(c => c.text === 'Is Leth awake?');
  const authority = read('translator/data/index.json');
  const original = await scoreSongText(clip.text, authority);
  const expanded = expandChordMidi(Buffer.from(clip.midi, 'base64'), authority.atoms);
  assert.deepEqual(notesFromMidi(expanded).notes, notesFromMidi(original.midi).notes);
});

test('stage directions, speaker labels and narration stay outside the scored excerpts', () => {
  const play = data.readings['stories-p14362'];
  const script = read('content/stories-p14362.json');
  for (const [blockId, entries] of Object.entries(play)) {
    const text = script.blocks.find(b => b.id === blockId).text;
    assert.match(text, /^(?:ILEX|VARO|NACRE|THE ANNOUNCEMENT): /);
    for (const {start} of entries) assert.ok(start > text.indexOf(':'));
  }
  const line = data.readings['stories-p01469']['stories-p01685'];
  assert.deepEqual(line.map(c => data.clips[c.clip].text), ['Is Leth awake?']);
  assert.ok(line[0].start > 'Then Vey whispered, '.length);
  assert.equal(data.readings['stories-p00435']['stories-p00436'], undefined);
  assert.equal(data.readings['stories-p03043']['stories-p05109'], undefined); // Mara's unsent note.
});

test('standalone chapter buttons use the same paragraph anchors and performances as the library', () => {
  const id = 'custodian-who-refused-revised';
  const pages = new Map();
  for (const blockId of Object.keys(data.readings[id])) {
    const chapter = blockId.match(/-ch(\d+)-p/)[1];
    if (!pages.has(chapter)) pages.set(chapter, readFileSync(
      new URL('../site/custodian/chapter-' + chapter + '.html', import.meta.url), 'utf8'));
    const page = pages.get(chapter);
    assert.ok(page.includes('data-dialogue-reading="' + id + '"'));
    assert.ok(page.includes('id="block-' + blockId + '"'));
    assert.ok(page.includes('src="../story-dialogue.mjs"'));
  }
});
