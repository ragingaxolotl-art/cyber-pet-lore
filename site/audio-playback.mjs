// One deliberate sound at a time; never autoplay or resume after leaving a page.
export function stopAudio(root = document, except = null) {
  for (const media of root.querySelectorAll('audio,video')) if (media !== except) media.pause();
}
if (typeof document !== 'undefined') {
  document.addEventListener('play', event => {
    if (!['AUDIO','VIDEO'].includes(event.target?.tagName)) return;
    stopAudio(document,event.target);
    document.dispatchEvent(new CustomEvent('lore-media-start'));
  },true);
  document.addEventListener('lore-dialogue-start', () => stopAudio());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });
  window.addEventListener('pagehide', () => stopAudio());
}
