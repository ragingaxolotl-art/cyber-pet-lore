const descriptions = {line: 'DBA line', dictionary: 'DBA dictionary reading', words: 'DBA word sketch', label: 'DBA sound label'};
let resources, player, current, status, view = 0;

function loadResources() {
  if (!resources) {
    resources = Promise.all([
      fetch(new URL('story-dialogue.json', import.meta.url)).then(response => {
        if (!response.ok) throw Error('Dialogue audio unavailable');
        return response.json();
      }),
      import('./translator/local_compound_player.mjs')
    ]).then(([data, audio]) => {
      player = audio.createLocalCompoundPlayer({onStatus(message) {
        if (message === 'Playback finished.') clearCurrent();
      }});
      return data;
    }).catch(error => { resources = null; throw error; });
  }
  return resources;
}

function report(message) {
  if (!status && !message) return;
  if (!status) {
    status = document.createElement('div');
    status.className = 'story-dialogue-status';
    status.setAttribute('role', 'status');
    document.body.append(status);
  }
  status.textContent = message;
}

function clearCurrent() {
  if (current) {
    current.button.setAttribute('aria-label', current.button.title = 'Play ' + current.label);
    current.button.setAttribute('aria-pressed', 'false');
    current = null;
  }
  globalThis.CSS?.highlights?.delete('dba-dialogue');
  report('');
}

function stop() {
  player?.stop();
  clearCurrent();
}

export function leaveStoryDialogue() {
  view++;
  stop();
}

// DOM Range and the notebook both count UTF-16 text offsets. The icon button has no text nodes.
function textRange(block, start, end) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let offset = 0, started = false, node;
  while ((node = walker.nextNode())) {
    const next = offset + node.length;
    if (!started && start < next) {
      range.setStart(node, start - offset);
      started = true;
    }
    if (started && end <= next) {
      range.setEnd(node, end - offset);
      return range;
    }
    offset = next;
  }
  return null;
}

function insertButton(block, source, start, clip) {
  if (source.slice(start, start + clip.text.length) !== clip.text) return;
  const end = start + clip.text.length;
  const punctuation = source.slice(end).match(/^[.,!?…]*[”"]?/u)[0];
  const range = textRange(block, start, end + punctuation.length);
  if (!range) return;

  const button = document.createElement('button');
  const label = descriptions[clip.kind] + ' · “' + clip.text + '”';
  button.type = 'button';
  button.className = 'story-dialogue-play';
  button.setAttribute('aria-label', button.title = 'Play ' + label);
  button.setAttribute('aria-pressed', 'false');
  range.collapse(false);
  const link = range.endContainer.parentElement.closest('a');
  if (link) link.after(button);
  else range.insertNode(button);

  button.addEventListener('click', async event => {
    event.stopPropagation();
    if (current?.button === button) return stop();
    stop();
    document.dispatchEvent(new CustomEvent('lore-dialogue-start'));
    current = {button, label};
    button.setAttribute('aria-label', button.title = 'Stop ' + label);
    button.setAttribute('aria-pressed', 'true');
    try {
      if (globalThis.CSS?.highlights && globalThis.Highlight) {
        CSS.highlights.set('dba-dialogue', new Highlight(textRange(block, start, end)));
      }
      report(label);
      const midi = Uint8Array.from(atob(clip.midi), char => char.charCodeAt(0));
      await player.play(midi, {chords: true});
    } catch (error) {
      if (current?.button === button) {
        stop();
        report(error.message || 'Playback could not start. Try the play button again.');
      }
    }
  });
}

export async function attachStoryDialogue(container, reading) {
  const version = ++view;
  let data;
  try { data = await loadResources(); }
  catch {
    if (version === view) report('Dialogue audio could not load. Reopen the story to try again.');
    return;
  }
  if (version !== view || !container.isConnected) return;
  for (const [id, cues] of Object.entries(data.readings[reading] || {})) {
    const block = document.getElementById('block-' + id);
    if (!block || !container.contains(block) || block.querySelector('.story-dialogue-play')) continue;
    const source = block.textContent;
    for (const {start, clip} of cues) insertButton(block, source, start, data.clips[clip]);
  }
}

window.addEventListener('pagehide', leaveStoryDialogue);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
const chapter = document.querySelector('article[data-dialogue-reading]');
if (chapter) attachStoryDialogue(chapter, chapter.dataset.dialogueReading);
