"""Publish recovered proposals without changing the story catalogue or source anchors."""
import html,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'site'
data=json.loads((ROOT/'sources/story-plans.json').read_text())
esc=html.escape
sources={s['id']:s for s in data['sources']}
def prose(text):
    # Original Markdown headings/emphasis are presentation only; all words survive.
    chunks=[]
    for para in text.split('\n\n'):
        para=para.strip()
        if not para:continue
        if para=='---':chunks.append('<hr>');continue
        match=re.match(r'^(#{1,6})\s+(.+)$',para)
        tag='h3' if match else 'p'
        content=match[2] if match else para
        content=esc(content)
        content=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',content)
        chunks.append(f'<{tag}>'+content.replace('\n','<br>')+f'</{tag}>')
    return '\n'.join(chunks)
def shell(title,body,prefix='',script=''):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#103f5a"><title>{esc(title)} — Cyber Pet Lore</title><link rel="stylesheet" href="{prefix}style.css"><link rel="stylesheet" href="{prefix}plans.css"></head><body><a class="skip" href="#plans-content">Skip to plans</a><header class="masthead"><a href="{prefix}index.html" class="brand"><span class="brand-icon" aria-hidden="true">◇</span><span>CYBER PET <b>LORE</b><small>THE READING ARCHIVE</small></span></a><nav aria-label="Main"><a href="{prefix}index.html">Library</a><a href="{prefix}timeline.html">Timeline</a><a href="{prefix}wiki.html">Connections</a><a href="{prefix}terms.html">Terms</a><a href="{prefix}plans.html" aria-current="page">Plans &amp; possibilities</a></nav></header><main id="plans-content" class="plans-main">{body}</main><footer><span>CYBER PET LORE ◇ The reading archive</span><a href="{prefix}index.html">Back to library →</a></footer>{script}</body></html>'''
(OUT/'plans').mkdir(exist_ok=True)
for source in data['sources']:
    # Local references must resolve from the source page's subdirectory.
    url=source['url'] if source['url'].startswith('https:') else '../'+source['url']
    original=f'<a href="{esc(url)}">Open original source ↗</a>'
    text=source['text'];parts=[];table=[]
    def flush():
        if table:
            rows=[]
            for i,line in enumerate(table):
                tag='th' if i==0 else 'td'
                rows.append('<tr>'+''.join(f'<{tag}>{esc(c)}</{tag}>' for c in line.split('\t'))+'</tr>')
            parts.append('<div class="source-table"><table>'+''.join(rows)+'</table></div>');table.clear()
    paragraphs=[]
    for line in text.splitlines():
        if '\t' in line:
            if paragraphs:parts.append(prose('\n'.join(paragraphs)));paragraphs=[]
            table.append(line)
        else:
            flush();paragraphs.append(line)
    flush()
    if paragraphs:parts.append(prose('\n'.join(paragraphs)))
    body=f'<p class="eyebrow">RECOVERED SOURCE · PLANNING RECORD</p><h1>{esc(source["label"])}</h1><p class="source-note">Original planning text. Its proposals and alternate versions are not automatically established canon.</p><p>{original} · <a href="../plans.html">Return to all plans</a></p>'
    if source.get('messageId'):body+=f'<p class="source-id">Message reference: {esc(source["messageId"])}</p>'
    body+='<article class="source-reading">'+''.join(parts)+'</article>'
    (OUT/'plans'/f'{source["id"]}.html').write_text(shell(source['label'],body,'../'))
articles=[]
for g in data['groups']:
    variants=[]
    for v in g['variants']:
        s=sources[v['source']]
        summary=s['label']+(f' · #{v["number"]}' if v.get('number') else '')
        fields=''.join(f'<dt>{esc(k)}</dt><dd>{prose(value)}</dd>' for k,value in v['fields'].items() if k not in ['Title','Era'] and value)
        sourceLink=f'plans/{s["id"]}.html'
        note=f'<p class="source-note">{esc(v["note"])}</p>' if v.get('note') else ''
        if v.get('partial'):note+='<p class="source-note">Incomplete source row. Blank fields remain unknown; no continuation has been invented.</p>'
        variants.append(f'<details class="variant"><summary>{esc(summary)}</summary><p class="variant-meta">Era {esc(v["era"])} · {esc(v["status"])}</p>{note}<dl>{fields}</dl><p><a href="{sourceLink}">Read this source version →</a></p></details>')
    eras=' / '.join(dict.fromkeys(v['era'] for v in g['variants']))
    statuses=list(dict.fromkeys(v['status'] for v in g['variants']))
    lead=next((value for v in reversed(g['variants']) for k,value in v['fields'].items() if k in ['Short-story premise','One-line explanation','Story premise','Possibility','Story hook']),None)
    if not lead:lead=g['variants'][0].get('note','Open the source version below for the recovered details.')
    reading=f'<a class="reading-link" href="{g["reading"]["url"]}">Read existing prose: {esc(g["reading"]["title"])} →</a>' if g.get('reading') else ''
    words=' '.join([g['title'],g['category'],json.dumps(g['variants'],ensure_ascii=False)])
    articles.append(f'<article class="plan-card" id="{g["id"]}" data-category="{esc(g["category"])}" data-eras="{esc(eras)}" data-status="{esc(" | ".join(statuses))}"><p class="eyebrow">{esc(g["category"])} · ERA {esc(eras)}</p><h2><a href="#{g["id"]}">{esc(g["title"])}</a></h2><p class="status-label">{esc(" · ".join(statuses))}</p><p class="plan-lead">{esc(lead)}</p>{reading}<p class="variant-count">{len(g["variants"])} recovered version'+('s' if len(g['variants'])!=1 else '')+'</p>'+''.join(variants)+'</article>')
counts=data['counts'];audit='<ul>'+''.join('<li>'+esc(s)+'</li>' for s in data['coverage'])+'</ul>'
body=f'''<section class="plans-hero"><p class="eyebrow">THE UNWRITTEN SHELF · RECOVERED {data['reviewed']}</p><h1>Plans &amp; possibilities</h1><p class="intro">The stories that could still be told. Recovered outlines, abandoned directions, alternate plots, and open questions from the Cyberpath development archive.</p><div class="plan-stats"><span><strong>{counts['groups']}</strong> title groups &amp; possibilities</span><span><strong>{counts['tableRows']}</strong> recovered table rows</span><span><strong>{counts['tables']}</strong> source tables</span></div><p class="source-note">These are planning records, not new chapters. “No standalone prose located” describes the reviewed archive; it is not proof that no draft exists elsewhere. Versions with existing prose are marked and linked.</p><nav class="quick-links" aria-label="Start reading"><a href="custodian/index.html">The Custodian Who Refused: twelve-chapter draft, plans &amp; checks →</a><a href="#the-corrected-child-complete-two-part-outline">The Corrected Child: full plan →</a><a href="#the-oldest-newborn-arus-later-life">Aru’s later life →</a><a href="#search-plans">Browse every possibility ↓</a></nav></section><details class="coverage"><summary>What was searched, what is included, and limits</summary>{audit}<p>The early cross-era table contains 72 rows. Repeated titles and revised premises count as separate source versions, not separate completed stories. The later compact catalogue runs from 1 through 200.</p><p><a href="plans/chat-60.html">Catalogue 1–80</a> · <a href="plans/chat-61.html">81–140</a> · <a href="plans/chat-62.html">141–200</a> · <a href="plans/chat-90.html">Final 40 options</a></p><p><a href="catalog.json">Existing reading catalogue</a> · <a href="index.html#read=chapel-pilgrim-draft-p00000">What the Pillar Carried — existing draft</a></p></details><form id="search-plans" class="plan-filters" role="search"><label>Search every detail<input id="plan-search" type="search" placeholder="Aru, unfinished, winter, childhood…"></label><label>Collection<select id="plan-category"><option value="">All collections</option></select></label><label>Status<select id="plan-status"><option value="">All statuses</option></select></label><label>Era<select id="plan-era"><option value="">Every era</option><option value="-3">−3</option><option value="-2">−2</option><option value="-1">−1</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label><button type="reset">Reset filters</button></form><p id="plan-count" role="status">{counts['groups']} groups; {counts['variants']} recovered entries and variants.</p><noscript><p>All entries are shown below. Use your browser’s Find command to search.</p></noscript><div id="plan-list">{''.join(articles)}</div><p id="no-plans" hidden>No matching plans. Try another word or reset the filters.</p><nav class="plan-pages" aria-label="Plan results"><button id="plan-prev" type="button">← Previous</button><span id="plan-page"></span><button id="plan-next" type="button">Next →</button></nav>'''
(OUT/'plans.html').write_text(shell('Plans & possibilities',body,script='<script type="module" src="plans.mjs"></script>'))
# The normal build regenerates several navigation headers; keep the new section discoverable.
for path in OUT.glob('*.html'):
    if path.name=='plans.html':continue
    text=path.read_text()
    if 'href="plans.html"' not in text:
        text=re.sub(r'(<a href="timeline.html"[^>]*>Timeline</a>)',r'\1<a href="plans.html">Plans &amp; possibilities</a>',text,count=1)
        path.write_text(text)
print(f'Plans archive: {counts["groups"]} groups, {counts["variants"]} entries and variants.')
