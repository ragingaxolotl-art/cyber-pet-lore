import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('shared navigation preserves newer translator entry scripts through repeated builds',()=>{
 const result=JSON.parse(execFileSync('python3',['-c',String.raw`
import contextlib,importlib.util,io,json,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('navigation','tools/build_navigation.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory(prefix='lore-navigation-cache-') as directory:
 site=Path(directory);module.SITE=site
 (site/'early-machine-language').mkdir();(site/'early-machine-language/provenance.json').write_text('{"files":[]}')
 (site/'translator').mkdir()
 pages={'index.html':'<script src="./app.js?v=old-reader"></script>',
  'translator/index.html':'<script type="module" src="./app.js?v=lore-translator-new-release"></script>',
  'translator/compound-builder.html':'<script type="module" src="./compound-builder.mjs?v=lore-translator-new-release"></script>'}
 for path,script in pages.items():(site/path).write_text('<html><head></head><body>'+script+'</body></html>')
 with contextlib.redirect_stdout(io.StringIO()):module.build()
 first={path:(site/path).read_text() for path in pages}
 with contextlib.redirect_stdout(io.StringIO()):module.build()
 second={path:(site/path).read_text() for path in pages}
 print(json.dumps({'first':first,'second':second}))
`],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
 assert.deepEqual(result.second,result.first);
 assert.match(result.second['index.html'],/app\.js\?v=workspace-20261122/);
 assert.match(result.second['translator/index.html'],/app\.js\?v=lore-translator-new-release/);
 assert.match(result.second['translator/compound-builder.html'],/compound-builder\.mjs\?v=lore-translator-new-release/);
 for(const page of Object.values(result.second))assert.match(page,/workspace-shell\.mjs\?v=workspace-20261122/);
});
