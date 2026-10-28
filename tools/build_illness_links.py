"""Attach authored trademark illnesses to their exact atlas locations in both directions."""
import html
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'

def normalize(name):
    name = re.sub(r'^\d+\.\s*', '', name.strip()).casefold()
    return re.sub(r'^the\s+', '', name)

def attach_illnesses(wiki, entries):
    directory = json.loads((SITE / 'illnesses/directory.json').read_text())
    wiki['readingIllnesses'] = {}
    links = []
    for illness in directory:
        if not illness['trademark']:
            continue
        name = normalize(illness['location_name'])
        topics = [t for t in wiki['topics'] if any(normalize(a) == name for a in [t['title'], *t['aliases']])]
        assert len(topics) == 1, (illness['id'], 'ambiguous or missing location', topics)
        topic = topics[0]
        readings = [e for e in entries if e['id'].startswith('atlas-') and normalize(e['title']) == name]
        assert readings, (illness['id'], 'missing atlas entry')
        info = {key: illness[key] for key in ['id', 'name', 'family', 'description', 'visual', 'treatment', 'story_hook', 'status', 'corruption', 'location_name']}
        info['href'] = 'illnesses/index.html#' + illness['id']
        topic.setdefault('illnesses', []).append(info)
        for entry in readings:
            wiki['readingIllnesses'].setdefault(entry['id'], []).append(info)
        links.append({'illnessId': illness['id'], 'illnessHref': info['href'], 'locationTopicId': topic['id'], 'locationHref': 'wiki.html#' + topic['id'], 'readingIds': [e['id'] for e in readings]})
    # Keep directory links in the HTML itself, including when JavaScript is unavailable.
    page_path = SITE / 'illnesses/index.html'
    page = page_path.read_text()
    for link in links:
        pattern = r'(<article id="' + re.escape(link['illnessId']) + r'"[\s\S]*?<p class="place">)([\s\S]*?)(</p>)'
        def replace(match):
            content = re.sub(r'<a\b[^>]*>(.*?)</a>', r'\1', match[2])
            place, separator, rest = content.partition(' · ')
            return match[1] + '<a href="../' + html.escape(link['locationHref'], quote=True) + '">' + place + '</a>' + separator + rest + match[3]
        page, count = re.subn(pattern, replace, page, count=1)
        assert count == 1, link['illnessId']
    page_path.write_text(page)
    (SITE / 'illness-location-links.json').write_text(json.dumps(links, ensure_ascii=False, indent=2) + '\n')
