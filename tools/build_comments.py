"""Attach feedback to standalone reading pages; dynamic readers mount stable IDs."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
def build():
    count=0
    for path in SITE.rglob('*.html'):
        rel=path.relative_to(SITE)
        if rel.parts[0] in {'previews','images','translator','illnesses','remedies','ribbons'} or rel.as_posix() in {'index.html','wiki.html','comments-inbox.html'}:
            continue
        text=path.read_text()
        if '<main' not in text or '</body>' not in text or 'comments-auto.mjs' in text:
            continue
        prefix='../'*(len(rel.parts)-1)
        text=text.replace('</body>',f'<script type="module" src="{prefix}comments-auto.mjs"></script></body>')
        path.write_text(text)
        count+=1
    print(f'Comments attached to {count} standalone pages')
if __name__=='__main__':build()
