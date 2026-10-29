// Native details keep navigation usable before JavaScript loads.
const navigation = document.querySelector('.lore-navigation');
if (navigation) {
  const groups = [...navigation.querySelectorAll('details')];
  for (const group of groups) group.addEventListener('toggle', () => {
    if (group.open) for (const other of groups) if (other !== group) other.open = false;
  });
  navigation.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const group = event.target.closest('details[open]');
    if (group) { group.open = false; group.querySelector('summary').focus(); event.preventDefault(); }
  });
  navigation.addEventListener('click', event => {
    if (!event.target.closest('a,button')) return;
    for (const group of groups) group.open = false;
  });
  document.addEventListener('click', event => {
    if (!navigation.contains(event.target)) for (const group of groups) group.open = false;
  });
  navigation.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!navigation.contains(document.activeElement)) for (const group of groups) group.open = false;
    }, 0);
  });
}
