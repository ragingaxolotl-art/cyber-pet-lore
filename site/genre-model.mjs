export function createIndex(data, catalog) {
  const byId = new Map(data.entries.map(entry => [entry.id, entry]));
  const stories = new Map(catalog.entries.filter(entry => entry.kind === 'Story').map(entry => [entry.id, entry]));
  const children = new Map();
  for (const entry of data.entries) {
    if (!children.has(entry.parent)) children.set(entry.parent, []);
    children.get(entry.parent).push(entry);
  }
  function path(entry) {
    const result = [], seen = new Set();
    while (entry) {
      if (seen.has(entry.id)) throw new Error('Circular genre hierarchy');
      seen.add(entry.id); result.unshift(entry); entry = byId.get(entry.parent);
    }
    return result;
  }
  const cache = new Map();
  function matches(entry) {
    if (cache.has(entry.id)) return cache.get(entry.id);
    const result = new Map();
    for (const match of entry.matches) if (stories.has(match.story)) result.set(match.story, {...match, via: entry.id});
    for (const child of children.get(entry.id) || []) for (const match of matches(child)) {
      if (!result.has(match.story)) result.set(match.story, match);
    }
    const found = [...result.values()]; cache.set(entry.id, found); return found;
  }
  const ordered=[];
  function walk(parent) { for (const entry of children.get(parent) || []) {ordered.push(entry); walk(entry.id);} }
  walk(null);
  return {byId, stories, children, path, matches, ordered};
}
export function filterEntries(index, filters = {}) {
  const terms = (filters.query || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return index.ordered.filter(entry => {
    const path = index.path(entry), matches = index.matches(entry);
    if (filters.category && path[0].id !== filters.category) return false;
    if (filters.kind && entry.kind !== filters.kind) return false;
    if (filters.match === 'matched' && !matches.length) return false;
    if (filters.match === 'unmatched' && matches.length) return false;
    if (filters.story && !matches.some(match => match.story === filters.story)) return false;
    const text = [entry.name, ...(entry.aliases || []), entry.definition, entry.prompt, entry.kind, ...path.map(p => p.name), ...matches.map(m => index.stories.get(m.story).title)].join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
}
export function referenceCSV(index) {
  const quote = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  const rows = [['Category', 'Hierarchy', 'Name', 'Type', 'Definition', 'Writing question', 'Classification note', 'Reviewed story matches']];
  for (const entry of index.ordered) rows.push([index.path(entry)[0].name, index.path(entry).map(p=>p.name).join(' > '), entry.name, entry.kind, entry.definition, entry.prompt, entry.scopeNote, index.matches(entry).map(m => `${index.stories.get(m.story).title} [${index.byId.get(m.via).name}]: ${m.reason}`).join(' | ')]);
  return '\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n');
}

export function visibleTreeIds(index, entries) {
  return new Set(entries.flatMap(entry => index.path(entry).map(parent => parent.id)));
}
