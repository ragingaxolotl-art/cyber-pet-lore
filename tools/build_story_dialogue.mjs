import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {wordScorePlan, scoreSelectedWords} from '../site/translator/word_score.mjs';
import {scoreSongText} from '../site/translator/song_lines.mjs';
import {storyReading} from '../site/translator/story_readings.mjs';
import {scoreStory} from '../site/translator/story_music.mjs';
import {analyzeEnglish} from '../site/translator/english.mjs';
import {midiFromFormal} from '../site/translator/engine.mjs';
import {encodeName, midiFromName} from '../site/translator/names.mjs';
import {compactChordPerformance} from '../site/translator/compact_chords.mjs';

const site = new URL('../site/', import.meta.url);
const json = async url => JSON.parse(await readFile(url, 'utf8'));

async function makeScorer() {
  const translator = new URL('translator/', site);
  const authority = await json(new URL('data/index.json', translator));
  const resolutions = new Map();
  async function resolution(target) {
    assert(authority.resolution_files[target], 'No standalone resolution for ' + target);
    if (!resolutions.has(target)) {
      resolutions.set(target, await json(new URL(authority.resolution_files[target], translator)));
    }
    return resolutions.get(target);
  }
  async function template(target) {
    if (authority.compound_plans?.[target]?.expanded.nodes.some(node => node.kind === 'slot')) return {authority};
    return {...(await resolution(target)).variants['assertion:1'], authority};
  }
  return async function score(cue) {
    const {text} = cue;
    // A trailing attribution comma is typography. Keep the printed excerpt verbatim.
    const input = text.replace(/,$/, '').replaceAll('’', "'");
    if (cue.phonemic) return {kind: 'label', midi: midiFromName(await encodeName(input))};
    let melody;
    if (cue.words) {
      const {term_coverage} = analyzeEnglish(input, authority);
      assert.equal(term_coverage.length, cue.words.length, 'Recheck the words in ' + text);
      const selections = new Map();
      for (const [i, target] of cue.words.entries()) {
        if (target === null) continue; // Use the translator's phonemic label for this noun.
        const match = term_coverage[i].matches.find(m => m.target_id === target);
        assert(match, 'Recheck dictionary sense for ' + term_coverage[i].term);
        selections.set(i, match.sense_id);
      }
      const plan = wordScorePlan(term_coverage, selections, authority);
      assert.deepEqual(plan.omitted, [], 'A word would be skipped in ' + text);
      assert.deepEqual(plan.playable.map(w => w.target || null), cue.words);
      melody = await scoreSelectedWords(plan, 1, resolution);
    } else if (cue.target) {
      const english = analyzeEnglish(input, authority);
      assert(english.candidates.some(c => c.target_id === cue.target), 'Dictionary reading missing for ' + text);
      const act = cue.act || english.speech_act_proposal;
      const variant = (await resolution(cue.target)).variants[act + ':1'];
      melody = midiFromFormal(variant.formal);
    } else if (cue.answers) {
      const plan = storyReading(input, authority, {answers: cue.answers});
      assert(plan && !plan.question, 'Unresolved speaker or meaning in ' + text);
      melody = (await scoreStory(plan, authority)).midi;
    } else {
      const result = await scoreSongText(input, authority, template);
      assert(result?.midi, 'No complete DBA performance for ' + text);
      melody = result.midi;
    }
    const chords = compactChordPerformance(melody, authority.atoms);
    assert(chords.rootCount > 0, 'No scored dictionary roots in ' + text);
    const kind = cue.words ? 'words' : cue.target ? 'dictionary' : 'line';
    return {kind, midi: chords.midi};
  };
}

export async function buildStoryDialogue() {
  const cues = await json(new URL('../sources/story-dialogue.json', import.meta.url));
  const catalog = await json(new URL('catalog.json', site));
  const blocks = new Map();
  for (const reading of catalog.entries.filter(e => ['Story', 'Draft'].includes(e.kind))) {
    const content = await json(new URL('content/' + reading.id + '.json', site));
    for (const block of content.blocks) {
      if (block.annotation || block.referenceUrl || block.style !== 'NORMAL_TEXT') continue;
      blocks.set(block.id, {reading: reading.id, text: block.text});
    }
  }
  const score = await makeScorer();
  const clips = [], readings = {};
  for (const cue of cues) {
    const {kind, midi} = await score(cue);
    const clip = clips.length;
    clips.push({text: cue.text, kind, midi: Buffer.from(midi).toString('base64')});
    for (const [id, start] of cue.locations) {
      const block = blocks.get(id);
      assert(block && block.text.slice(start, start + cue.text.length) === cue.text,
        'Recheck dialogue against the source at ' + id + ' for ' + cue.text);
      const reading = readings[block.reading] ||= {};
      (reading[id] ||= []).push({start, clip});
    }
  }
  for (const reading of Object.values(readings)) {
    for (const cues of Object.values(reading)) {
      cues.sort((a, b) => a.start - b.start);
      for (let i = 1; i < cues.length; i++) {
        assert(cues[i - 1].start + clips[cues[i - 1].clip].text.length <= cues[i].start, 'Overlapping dialogue controls');
      }
    }
  }
  return {clips, readings};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = await buildStoryDialogue();
  await writeFile(new URL('story-dialogue.json', site), JSON.stringify(data) + '\n');
  const total = Object.values(data.readings).flatMap(Object.values).flat().length;
  console.log(total + ' dialogue cues in ' + Object.keys(data.readings).length + ' readings.');
}
