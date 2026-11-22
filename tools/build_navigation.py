"""Apply shared, progressively enhanced navigation to Lore archive pages."""
from pathlib import Path
import re,json
from html import escape

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
def navigation(relative):
    prefix='../'*(len(relative.parts)-1)
    main=relative.as_posix()=='index.html'
    def link(label,target):
        href=prefix+target
        current=' aria-current="page"' if relative.as_posix()==target else ''
        if main and target=='index.html':return '<a href="#" id="library-link">Library</a>'
        return f'<a href="{escape(href,quote=True)}"{current}>{escape(label)}</a>'
    groups=[('Read',[('Library','index.html'),('Recently added','recent.html'),('Haven stories','haven-stories/index.html'),('Timeline','timeline.html'),('Era · period · stage','chronology.html'),('Era Zero songs','songs/')]),
            ('Explore',[('Sound library','sounds/index.html'),('Connections','wiki.html'),('Shelter atlas','shelter-atlas.html'),('The Catalistym','catalistym.html'),('Terms & unexplained lore','terms.html'),('Illnesses','index.html#read=reference-illnesses'),('Ribbons & honours','ribbons/'),('Ribbon Studio','ribbons/studio/'),('Remedies & care','index.html#read=reference-era-four-remedies')]),
            ('Write & plan',[('Story genres','genres.html'),('Plans & possibilities','plans.html'),('DBA translator','translator/')])]
    parts=['<nav aria-label="Main" class="lore-navigation">'+link('Search all lore','search.html')]
    for label,items in groups:
        content=''.join(link(*item) for item in items)
        active=' current-group' if 'aria-current' in content else ''
        parts.append(f'<details class="lore-nav-group{active}"><summary>{escape(label)}</summary><div class="lore-nav-panel">{content}</div></details>')
    personal=('<button id="notebook-open">My notebook <span id="note-count">0</span></button><button id="backup-open">Backups</button>' if main else link('My notebook','notebook.html')+link('Backups','notebook.html#backups'))
    parts.append('<details class="lore-nav-group"><summary>My reading</summary><div class="lore-nav-panel">'+personal+'</div></details>')
    if main:parts.append('<button id="save-reading" class="save-button">Save</button>')
    parts.append('<a class="lore-game-link" href="https://ragingaxolotl-art.github.io/cyber-pet-play/" target="_blank" rel="noopener">Game ↗</a></nav>')
    return ''.join(parts)

def build():
    count=0
    archive=json.loads((SITE/'early-machine-language/provenance.json').read_text())['files']
    preserved={'early-machine-language/'+p for p in archive}
    for path in SITE.rglob('*.html'):
        text=path.read_text()
        relative=path.relative_to(SITE);prefix='../'*(len(relative.parts)-1)
        # Archived previews retain their historical chrome; all active tools and
        # published readings get the same workspace navigation.
        if relative.parts[0]=='previews' or relative.as_posix() in preserved:continue
        if not re.search(r'<header class="masthead(?: [^"]*)?">',text):
            text=re.sub(r'(<body[^>]*>)',lambda m:m[1]+'<header class="masthead workspace-masthead"><a class="brand" href="'+prefix+'index.html">Cyber Pet Lore</a><nav aria-label="Main"></nav></header>',text,count=1)

        pattern=r'(<header class="masthead(?: [^"]*)?">.*?)(<nav aria-label="Main"[^>]*>.*?</nav>)(.*?</header>)'
        changed,n=re.subn(pattern,lambda m:m[1]+navigation(relative)+m[3],text,count=1,flags=re.S)
        if not n:continue
        if 'navigation.css' not in changed:changed=changed.replace('</head>',f'<link rel="stylesheet" href="{prefix}navigation.css"></head>',1)
        if 'chronology.css' not in changed:changed=changed.replace('</head>',f'<link rel="stylesheet" href="{prefix}chronology.css"></head>',1)
        if 'navigation.mjs' not in changed:changed=changed.replace('</body>',f'<script type="module" src="{prefix}navigation.mjs"></script></body>',1)
        if 'workspace-shell.mjs' not in changed:changed=changed.replace('</body>',f'<script type="module" src="{prefix}workspace-shell.mjs"></script></body>',1)
        if changed!=path.read_text():path.write_text(changed)
        count+=1
    print(f'Shared dropdown navigation: {count} pages')
if __name__=='__main__':build()
