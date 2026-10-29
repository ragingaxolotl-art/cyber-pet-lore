"""Apply shared, progressively enhanced navigation to Lore archive pages."""
from pathlib import Path
import re
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
    groups=[('Read',[('Library','index.html'),('Timeline','timeline.html'),('Era Zero songs','songs/')]),
            ('Explore',[('Connections','wiki.html'),('Terms & unexplained lore','terms.html'),('Illnesses','index.html#read=reference-illnesses'),('Ribbons & honours','index.html#read=reference-ribbons'),('Remedies & care','index.html#read=reference-era-four-remedies')]),
            ('Write & plan',[('Story genres','genres.html'),('Plans & possibilities','plans.html'),('DBA translator','translator/')])]
    parts=['<nav aria-label="Main" class="lore-navigation">']
    for label,items in groups:
        content=''.join(link(*item) for item in items)
        active=' current-group' if 'aria-current' in content else ''
        parts.append(f'<details class="lore-nav-group{active}"><summary>{escape(label)}</summary><div class="lore-nav-panel">{content}</div></details>')
    personal=('<button id="notebook-open">My notebook <span id="note-count">0</span></button><button id="backup-open">Backups</button>' if main else link('My notebook','index.html#notebook')+link('Backups','index.html#backups'))
    parts.append('<details class="lore-nav-group"><summary>My reading</summary><div class="lore-nav-panel">'+personal+'</div></details>')
    if main:parts.append('<button id="save-reading" class="save-button">Save</button>')
    parts.append('<a class="lore-game-link" href="https://ragingaxolotl-art.github.io/cyber-pet-play/" target="_blank" rel="noopener">Game ↗</a></nav>')
    return ''.join(parts)

def build():
    count=0
    for path in SITE.rglob('*.html'):
        text=path.read_text()
        if '<header class="masthead">' not in text:continue
        relative=path.relative_to(SITE);prefix='../'*(len(relative.parts)-1)
        pattern=r'(<header class="masthead">.*?)(<nav aria-label="Main"[^>]*>.*?</nav>)(.*?</header>)'
        changed,n=re.subn(pattern,lambda m:m[1]+navigation(relative)+m[3],text,count=1,flags=re.S)
        if not n:continue
        if 'navigation.css' not in changed:changed=changed.replace('</head>',f'<link rel="stylesheet" href="{prefix}navigation.css"></head>',1)
        if 'navigation.mjs' not in changed:changed=changed.replace('</body>',f'<script type="module" src="{prefix}navigation.mjs"></script></body>',1)
        if changed!=text:path.write_text(changed)
        count+=1
    print(f'Shared dropdown navigation: {count} pages')
if __name__=='__main__':build()
