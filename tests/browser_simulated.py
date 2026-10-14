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
 page.locator('[data-menu-view="sessions"]').click()
 print('session form',page.locator('#view-sessions').is_visible(),page.locator('#session-eligible').inner_text())
 page.locator('#create-shuffle').uncheck()
 page.locator('#create-size').fill('12')
 page.locator('#create-session').click()
 print('created',page.evaluate('({length:KotobaDriveQA.getSession().orderedCardIds.length,shuffle:KotobaDriveQA.getSession().shuffleEnabled})'))
 assert page.evaluate('KotobaDriveQA.getSession().orderedCardIds.length')==12
 page.locator('#study-favorite').click();page.locator('#study-known').click()
 print('flags',page.locator('#study-favorite').inner_text(),page.locator('#study-known').inner_text())
 page.locator('#btn-menu').click();page.locator('[data-menu-view="sessions"]').click()
 print('stats',page.locator('#deck-dashboard').inner_text()[:120])
 page.wait_for_timeout(500)
 print('drawer open',page.locator('#app-drawer').get_attribute('class'))
 page.screenshot(path=str(root/'qa-phase3-sessions.png'),full_page=True)
 # Fake TTS completion and time passage: verifies that the app credits a genuine end-of-card event.
 page.locator('#create-size').fill('1')
 page.locator('#create-known').select_option('include')
 page.locator('#create-session').click()
 first_id=page.evaluate('KotobaDriveQA.getSession().orderedCardIds[0]')
 page.evaluate("KotobaCore.SpeechAdapter.prototype.speak=async()=> 'done'; KotobaCore.PlaybackController.prototype.wait=async()=>{};")
 page.locator('#btn-play').click()
 page.wait_for_function('(id)=>KotobaDriveQA.getStudy().deckStates[KotobaDriveQA.getSession().deckId].cards[id]?.exposures===1',arg=first_id,timeout=10000)
 print('tts simulation exposures',page.evaluate('(id)=>KotobaDriveQA.getStudy().deckStates[KotobaDriveQA.getSession().deckId].cards[id].exposures',first_id))
 print('completed session',page.evaluate('KotobaDriveQA.getSession().status'))
 print('final errors',errors)
 assert not errors
 browser.close()
