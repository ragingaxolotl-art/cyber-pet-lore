"""Publish the separately labeled Custodian draft, plans and passage-level review."""
import hashlib
import html
import json
import re
from pathlib import Path

TITLE = 'The Custodian Who Refused'
SID = 'custodian-who-refused'


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def inline(text):
    text = html.escape(text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    return text


def markdown(text):
    result = []
    for part in re.split(r'\n\s*\n', text.strip()):
        match = re.match(r'^(#{1,6}) (.+)$', part)
        if match:
            level, title = len(match[1]), match[2]
            result.append(f'<h{level} id="{slug(title)}">{inline(title)}</h{level}>')
        elif part.startswith('- '):
            result.append('<ul>' + ''.join('<li>'+inline(line[2:])+'</li>' for line in part.splitlines()) + '</ul>')
        else:
            result.append('<p>'+inline(part)+'</p>')
    return '\n'.join(result)


CSS = '''*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f4f1e9;color:#24322f;font:19px/1.82 Georgia,serif}main{max-width:790px;margin:auto;padding:30px 26px 80px}h1,h2,h3{line-height:1.23;scroll-margin-top:22px}h1{font-size:clamp(2.2rem,7vw,3.5rem);letter-spacing:-.025em}h2{margin-top:2.2em;font-size:1.65rem}h3{font-size:1.25rem}a{color:#155b64;text-underline-offset:4px}a:focus-visible,summary:focus-visible{outline:3px solid #ad7528;outline-offset:5px}nav,.notice,.metadata,footer,summary,.evidence{font:15px/1.65 system-ui,sans-serif}nav{display:flex;flex-wrap:wrap;gap:.5em 1em}.notice{padding:1em 1.2em;border-left:4px solid #9b742e;background:#eee6d5;margin:1.8em 0}.metadata{color:#53635c}.contents{padding-left:1.3em}.contents li{padding:.45em 0}.contents small{display:block;color:#53635c;font:14px/1.6 system-ui,sans-serif}.chapter p{margin:1.15em 0}details{margin:2em 0;border:1px solid #bbc9bf;border-radius:6px;padding:1em}summary{cursor:pointer;font-weight:650}.evidence{border-left:3px solid #9db4a7;padding-left:1em}.evidence li{margin:.5em 0}footer{border-top:1px solid #b8c8bf;margin-top:3em;padding-top:1.2em}.pager{justify-content:space-between;align-items:center}.skip{position:absolute;left:-10000px}.skip:focus{position:static;display:block;padding:1em}.plan{font-size:17px;line-height:1.7}code{font-size:.85em;overflow-wrap:anywhere}.downloads{display:flex;flex-wrap:wrap;gap:.6em 1.1em}@media(max-width:560px){body{font-size:18px}main{padding:20px 19px 60px}h1{font-size:2.35rem}details{padding:.8em}.pager a{max-width:46%}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{nav,.downloads,.pager,.skip{display:none}body{background:white;color:black}main{max-width:none;padding:0}details{break-inside:avoid}}'''


def shell(title, body):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="A twelve-chapter Cyberpath draft with detailed chapter plans and source-based continuity checks."><title>'+html.escape(title)+' — Cyber Pet Lore</title><link rel="stylesheet" href="story.css"></head><body><a class="skip" href="#content">Skip to content</a><main id="content"><nav aria-label="Archive"><a href="../index.html">Library</a><a href="../plans.html">Plans &amp; possibilities</a><a href="../custodians.html">Custodian history</a><a href="index.html">Story contents</a></nav>'+body+'<footer><nav aria-label="Story resources"><a href="index.html">All chapters</a><a href="plans.html">Detailed plans</a><a href="review.html">Continuity review</a><a href="manuscript.md" download>Download manuscript</a></nav></footer></main></body></html>'


def add_custodian_story(root, catalog, sources):
    source = root/'sources'/SID
    output = root/'site'/'custodian'
    output.mkdir(exist_ok=True)
    manifest = json.loads((source/'evidence.json').read_text())
    # Validate exact reviewed passages rather than treating changed canon as checked.
    for ref in manifest['passages']:
        reading = json.loads((root/'site/content'/f'{ref["readingId"]}.json').read_text())
        block = next(b for b in reading['blocks'] if b['id'] == ref['blockId'])
        assert hashlib.sha256(block['text'].encode()).hexdigest() == ref['sha256'], 'Recheck changed source: '+ref['blockId']
    plans = (source/'development.md').read_text()
    review = (source/'review.md').read_text()
    parts = re.split(r'^## Chapter (\d+) — (.+)$', plans, flags=re.M)
    planned = {int(parts[i]): '## Chapter '+parts[i]+' — '+parts[i+1]+parts[i+2].split('\n## Review gates')[0] for i in range(1, len(parts), 3)}
    assert set(planned) == set(range(1,13))
    chapters = []
    blocks = [{'id':SID+'-status','text':'Proposed fiction · Complete first draft. New characters and events remain proposed additions, not established Cyberpath history. Detailed chapter plans and source-based continuity checks accompany this publication.','style':'NORMAL_TEXT','referenceUrl':'custodian/plans.html'}]
    outline = []
    for number in range(1,13):
        text = (source/f'chapter-{number:02d}.md').read_text()
        title = text.splitlines()[0].removeprefix('# ')
        assert title.startswith(f'Chapter {number} — ')
        assert '**Check before prose:**' in planned[number]
        words = len(text.split())
        assert words > 700, f'Chapter {number} is not a developed chapter'
        paragraphs = re.split(r'\n\s*\n',text.strip())
        chapter_id = f'{SID}-ch{number:02d}'
        blocks.append({'id':chapter_id,'text':title,'style':'HEADING_2'})
        outline.append({'id':chapter_id,'title':title,'level':2})
        for i, p in enumerate(paragraphs[1:],1):
            blocks.append({'id':f'{chapter_id}-p{i:03d}','text':p,'style':'NORMAL_TEXT'})
        chapters.append({'number':number,'title':title,'text':text,'wordCount':words,'id':chapter_id})
    assert len({b['id'] for b in blocks}) == len(blocks)
    all_refs = {r['blockId']:r for r in manifest['passages']}
    def evidence(number):
        refs = [all_refs[key] for key in manifest['chapters'][str(number)]]
        return '<aside class="evidence"><h3>Source passages checked</h3><ul>'+''.join('<li><a href="../index.html#read='+r['readingId']+'&amp;block='+r['blockId']+'">'+html.escape(r['label'])+'</a></li>' for r in refs)+'</ul><p>These sources constrain the setting; they do not establish the new scenes as historical fact.</p></aside>'
    for ch in chapters:
        n = ch['number']
        previous = f'<a rel="prev" href="chapter-{n-1:02d}.html">← Chapter {n-1}</a>' if n>1 else '<a href="index.html">← Contents</a>'
        following = f'<a rel="next" href="chapter-{n+1:02d}.html">Chapter {n+1} →</a>' if n<12 else '<a href="review.html">Read the review →</a>'
        notice = '<p class="metadata">THE CUSTODIAN WHO REFUSED · ERA −3 · PROPOSED FICTION</p>'
        embedded_plan = re.sub(r'id="([^"]+)"', r'id="plan-\1"', markdown(planned[n]))
        body = notice+'<article class="chapter">'+markdown(ch['text'])+'</article><nav class="pager" aria-label="Chapter navigation">'+previous+following+'</nav><details><summary>Chapter plan and continuity check</summary><div class="plan">'+embedded_plan+evidence(n)+'</div></details>'
        (output/f'chapter-{n:02d}.html').write_text(shell(ch['title'],body))
    contents = '<ol class="contents">'+''.join(f'<li><a href="chapter-{c["number"]:02d}.html">{html.escape(c["title"].split(" — ",1)[1])}</a><small>{c["wordCount"]:,} words · <a href="plans.html#{slug(c["title"])}">Plan and source check</a></small></li>' for c in chapters)+'</ol>'
    total = sum(c['wordCount'] for c in chapters)
    body = '<p class="metadata">CYBERPATH · LATE ERA −3</p><h1>'+TITLE+'</h1><p>An evaluation engineer investigates a monitoring system whose increasingly consistent judgments expose a conflict between institutional policy and the evidence it is supposed to certify.</p><p class="notice">Complete first draft · Twelve chapters · '+f'{total:,}'+' words. Published for reading and revision; new people, company and events remain proposed fiction. Consciousness is unresolved.</p><p><a href="chapter-01.html">Begin Chapter 1 →</a> · <a href="../index.html#read='+SID+'">Read with highlights and notes</a></p><h2>Chapters</h2>'+contents+'<h2>How the story was developed</h2><p>Each chapter was planned scene by scene and checked against identified lore before drafting. The full manuscript was then reviewed against those plans. The development record separates established context, new invention and unresolved questions.</p><div class="downloads"><a href="plans.html">Read the detailed plans</a><a href="review.html">Read the editorial review</a><a href="manuscript.md" download>Download complete manuscript</a><a href="development.md" download>Download plans</a></div><p class="metadata">Adapted from the author’s <a href="'+manifest['conversation']+'">shared planning conversation</a>. No new historical dates or connection to later founders is asserted.</p>'
    (output/'index.html').write_text(shell(TITLE,body))
    # The per-chapter evidence is next to the corresponding plan, with stable headings.
    plan_html = markdown(plans)
    for n in range(1,13):
        title = chapters[n-1]['title']
        marker = f'<h2 id="{slug(title)}">{inline(title)}</h2>'
        plan_html = plan_html.replace(marker,marker+evidence(n),1)
    (output/'plans.html').write_text(shell('Chapter plans and continuity checks',plan_html))
    (output/'review.html').write_text(shell('Manuscript review',markdown(review)))
    (output/'story.css').write_text(CSS)
    for name in ['development.md','review.md','evidence.json']:
        (output/name).write_bytes((source/name).read_bytes())
    manuscript = '# '+TITLE+'\n\nCyberpath · Late Era −3 · Proposed fiction · Complete first draft\n\n'+ '\n\n'.join(c['text'].strip() for c in chapters)+'\n'
    (output/'manuscript.md').write_text(manuscript)
    (output/'publication.json').write_text(json.dumps({'title':TITLE,'status':'draft','wordCount':total,'chapters':[{k:v for k,v in c.items() if k!='text'} for c in chapters],'manuscriptSha256':hashlib.sha256(manuscript.encode()).hexdigest(),'sourceReview':manifest['reviewed']},ensure_ascii=False,indent=2)+'\n')
    (root/'site/content'/f'{SID}.json').write_text(json.dumps({'id':SID,'blocks':blocks,'outline':outline},ensure_ascii=False,indent=2)+'\n')
    catalog.append({'id':SID,'title':TITLE+' — complete draft','kind':'Draft','era':[-3],'timeLabel':'Late Era −3 · Custodians and Closed Windows · proposed fiction','timeOrder':99000,'status':'draft','characters':['Elias Venn','Nadia Serrin','Priya Das','Jon Bellamy','C-17'],'places':[],'topics':['Custodians','uncertainty','monitoring','discontinuity','responsibility'],'source':{'title':'Author-directed story development, October 30, 2026','url':manifest['conversation']},'summary':'Twelve fully written chapters: an experienced engineer investigates C-17, a monitoring deployment that withholds an unsupported certification. Detailed plans and source-based checks accompany the proposed story.','wordCount':total,'variant':'New proposed fiction — complete first draft','explicitLinks':['lore-p00039'],'connectionLabel':'Era −3 setting reference; new story events remain proposed'})
    sources.append({'key':SID,'title':TITLE,'note':'Author requested chapter-by-chapter planning, continuity checking, complete prose and publication. New fiction remains a draft rather than silently changing established canon.'})
    print(f'Custodian draft: 12 chapters, {total:,} words; plans and source checks published.')
