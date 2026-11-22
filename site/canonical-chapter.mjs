// One reading edition owns the paragraph IDs and notes. Preserve the static
// presentation as an explicit reference view rather than creating a second copy.
const canonical=document.querySelector('link[rel="canonical"][data-lore-reading]');
if(canonical&&!new URLSearchParams(location.search).has('presentation'))location.replace(canonical.href);
