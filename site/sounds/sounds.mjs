export function matchesSound(entry, {query = '', kind = '', collection = ''} = {}) {
  return (!kind || entry.kind === kind) && (!collection || entry.new === (collection === 'new')) &&
    query.trim().toLocaleLowerCase().split(/\s+/).every(word => entry.search.toLocaleLowerCase().includes(word));
}
export function pauseOthers(players, active = null) {
  for (const player of players) if (player !== active) player.pause();
}
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('.sound-card')];
  const players = [...document.querySelectorAll('audio')];
  const rows = [...document.querySelectorAll('.location-map tbody tr')];
  for (const player of players) player.addEventListener('play', () => pauseOthers(players, player));
  $('stop-all').addEventListener('click', () => { pauseOthers(players); for (const p of players) p.currentTime = 0; });
  $('loop-audio').addEventListener('change', () => {
    for (const player of players) player.loop = $('loop-audio').checked && player.closest('.sound-card').dataset.kind !== 'footstep';
  });
  function filterSounds() {
    let count = 0, clips = 0;
    for (const card of cards) {
      card.hidden = !matchesSound({ ...card.dataset, new: card.dataset.new === 'true' }, {
        query: $('sound-search').value, kind: $('sound-kind').value, collection: $('sound-new').value
      });
      if (card.hidden) pauseOthers(card.querySelectorAll('audio'));
      else { count++; clips += card.querySelectorAll('audio').length; }
    }
    $('sound-count').textContent = `${count} entries · ${clips} audio clips`;
    $('sound-empty').hidden = count > 0;
  }
  $('sound-filters').addEventListener('submit', event => event.preventDefault());
  $('sound-filters').addEventListener('input', filterSounds);
  $('sound-filters').addEventListener('reset', () => setTimeout(filterSounds, 0));
  function filterLocations() {
    const words = $('location-search').value.trim().toLocaleLowerCase().split(/\s+/);
    for (const row of rows) row.hidden = !words.every(word => row.dataset.search.includes(word));
    $('location-count').textContent = `${rows.filter(row => !row.hidden).length} locations`;
  }
  $('location-search').addEventListener('input', filterLocations);
  function revealHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target?.hidden) return;
    if (target.classList.contains('sound-card')) { $('sound-filters').reset(); setTimeout(() => { filterSounds(); target.scrollIntoView(); }, 0); }
    else if (target.tagName === 'TR') { $('location-search').value = ''; filterLocations(); target.scrollIntoView(); }
  }
  window.addEventListener('hashchange', revealHash);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseOthers(players); });
  window.addEventListener('pagehide', () => pauseOthers(players));
  filterSounds(); revealHash();
}
