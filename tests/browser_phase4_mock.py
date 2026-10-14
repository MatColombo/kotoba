from pathlib import Path
from playwright.sync_api import sync_playwright
import json,base64
root=Path(__file__).resolve().parent.parent; src=root/'source'
html=(src/'template.html').read_text();
for mark,name in [('__APP_CSS__','app.css'),('__ENGINE_JS__','engine.js'),('__STORAGE_JS__','storage.js'),('__SESSIONS_JS__','sessions.js'),('__CONTENT_JS__','content.js'),('__APP_JS__','app.js')]:
 if mark=='__APP_JS__':continue
 html=html.replace(mark,(src/name).read_text())
html=html.replace('__AUDIO_BASE64__',base64.b64encode((root/'bridge.mp3').read_bytes()).decode())
deck=(root/'decks/n4-core.json').read_text();catalog=(root/'decks/catalog.json').read_text()
mock='''
(function(){
 const decks=new Map(),study={main:null};
 const api={
  read:async (store,key)=>store==='study'?study.main:store==='decks'?decks.get(key):null,
  list:async store=>store==='decks'?[...decks.values()]:[],
  put:async(store,obj)=>{if(store==='decks')decks.set(obj.deckId,obj);else if(store==='study')study.main=obj;},
  remove:async(store,key)=>{if(store==='decks')decks.delete(key);},
  saveBundle:async({study:s})=>{study.main={id:'main',data:structuredClone(s)};},
  transact:async(names,mode,fn)=>{} };
 KotobaStore.Database.open=async()=>api;
 const rawDeck=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('__DECK64__'),c=>c.charCodeAt(0))));
 const rawCatalog=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('__CAT64__'),c=>c.charCodeAt(0))));
 window.fetch=async url=>({ok:true,json:async()=>String(url).includes('catalog')?rawCatalog:rawDeck});
 window.__debugStore={decks,study};
})();
'''.replace('__DECK64__',base64.b64encode(deck.encode()).decode()).replace('__CAT64__',base64.b64encode(catalog.encode()).decode())
html=html.replace('<script>__APP_JS__</script>',f'<script>{mock}</script><script>{(src/"app.js").read_text()}</script>')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load',timeout=40000)
 page.wait_for_timeout(600)
 print('errors',errors,'boot_error',page.locator('#boot-error').is_hidden())
 print('session',page.evaluate('KotobaDriveQA.getSession()?.orderedCardIds.length'))
 assert not errors and page.locator('#boot-error').is_hidden()
 page.locator('#btn-menu').click()
 page.locator('[data-menu-view="library"]').click()
 page.locator('#detail-register').select_option('colleague')
 print('example count colleague',page.locator('.ex-row').count())
 assert page.locator('.ex-row').count()==10
 page.wait_for_timeout(600)
 page.screenshot(path=str(root/'qa-phase4-examples.png'),full_page=True)
 page.locator('#btn-menu').click()
 page.locator('[data-menu-view="stories"]').click()
 print('stories',page.locator('[data-story-open]').count(),'segments',page.locator('.story-segment').count())
 assert page.locator('[data-story-open]').count()==8
 page.wait_for_timeout(600)
 page.screenshot(path=str(root/'qa-phase4-stories.png'),full_page=True)
 page.evaluate("(()=>{window.__storySpeech=[]; KotobaCore.SpeechAdapter.prototype.speak=async function(step){window.__storySpeech.push(step.lang);return 'done'};return true})()")
 page.locator('#story-play').click()
 page.wait_for_timeout(1100)
 print('story audio sequence',page.evaluate('window.__storySpeech'))
 assert page.evaluate('window.__storySpeech.slice(0,3)')==['ja-JP','it-IT','ja-JP']
 page.locator('#story-stop').click()
 page.locator('#btn-menu').click()
 page.locator('[data-menu-view="sessions"]').click()
 page.locator('#create-register').select_option('informal')
 page.locator('#create-group').select_option('n4-story-group-01')
 page.locator('#create-size').fill('10')
 page.locator('#create-example-count').select_option('3')
 page.locator('#create-session').click()
 print('session',page.evaluate('KotobaDriveQA.getSession()?.orderedCardIds'),'example selection',page.evaluate('KotobaDriveQA.getContextSelection()'))
 assert page.evaluate('KotobaDriveQA.getSession()?.orderedCardIds.length')==10
 assert page.evaluate('KotobaDriveQA.getContextSelection().length')==10
 page.wait_for_timeout(600)
 page.screenshot(path=str(root/'qa-phase4-study.png'),full_page=True)
 assert page.evaluate('KotobaDriveQA.getSession()?.exampleCount')==3
 print('compiled examples',page.evaluate("KotobaDriveQA.getPlan().plan.filter(x=>x.kind==='say'&&x.type==='exampleJP').length"))
 print('final errors',errors)
 assert not errors
 browser.close()
