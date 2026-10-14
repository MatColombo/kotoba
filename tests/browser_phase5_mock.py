"""Browser integration with a simulated archive (NOT real IndexedDB or Safari)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64

root=Path(__file__).resolve().parent.parent
src=root/'source'
html=(src/'template.html').read_text()
for marker,name in [('__APP_CSS__','app.css'),('__ENGINE_JS__','engine.js'),('__STORAGE_JS__','storage.js'),('__SESSIONS_JS__','sessions.js'),('__CONTENT_JS__','content.js')]:
    html=html.replace(marker,(src/name).read_text())
html=html.replace('__AUDIO_BASE64__',base64.b64encode((root/'bridge.mp3').read_bytes()).decode())
deck64=base64.b64encode((root/'decks/n4-core.json').read_bytes()).decode()
cat64=base64.b64encode((root/'decks/catalog.json').read_bytes()).decode()
mock='''
(function(){
 const decks=new Map(),study={main:null};
 const store={read:async(s,id)=>s==='study'?study.main:s==='decks'?decks.get(id):null,
  list:async s=>s==='decks'?[...decks.values()]:[],
  put:async(s,item)=>{if(s==='decks')decks.set(item.deckId,item);else if(s==='study')study.main=item},
  remove:async(s,id)=>{if(s==='decks')decks.delete(id)},
  saveBundle:async({study:doc})=>{study.main={id:'main',data:structuredClone(doc)}}};
 KotobaStore.Database.open=async()=>store;
 const decode=t=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(t),c=>c.charCodeAt(0))));
 const d=decode('__DECK__'),c=decode('__CAT__');
 window.fetch=async url=>({ok:true,json:async()=>String(url).includes('catalog')?c:d});
 window.__fakeStore={decks,study};
})();
'''.replace('__DECK__',deck64).replace('__CAT__',cat64)
html=html.replace('<script>__APP_JS__</script>',f'<script>{mock}</script><script>{(src/"app.js").read_text()}</script>')

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load',timeout=40000)
    page.wait_for_function('window.KotobaDriveQA && KotobaDriveQA.getDecks().length===1',timeout=15000)
    assert not errors and page.locator('#boot-error').is_hidden(),errors
    assert page.evaluate('KotobaDriveQA.getDecks()[0].cards')==75
    assert page.locator('#pre-import-backup').count()==1

    # Simulated TTS failure must stop the session without crediting an exposure.
    page.evaluate("KotobaCore.SpeechAdapter.prototype.speak=async()=> 'error'")
    page.locator('#btn-play').click()
    page.wait_for_function('KotobaDriveQA.getPlayback().playing===false',timeout=10000)
    assert page.evaluate("(function(){const q=KotobaDriveQA;return q.getMetrics().exposures})()") == 0
    assert page.evaluate('KotobaDriveQA.getSession().status')!='completed'

    # Navigation and new filtered session.
    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="sessions"]').click()
    page.locator('#create-shuffle').uncheck()
    page.locator('#create-size').fill('7')
    page.locator('#create-known').select_option('include')
    page.locator('#create-session').click()
    assert page.evaluate('KotobaDriveQA.getSession().orderedCardIds.length')==7
    assert page.evaluate('KotobaDriveQA.getSession().shuffleEnabled')==False
    page.locator('#study-favorite').click()
    page.locator('#study-known').click()
    assert page.evaluate("(function(){let s=KotobaDriveQA.getStudy(),k=KotobaDriveQA.getSession(),p=s.deckStates[k.deckId].cards[k.orderedCardIds[0]];return p.favorite&&p.known})()")

    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="library"]').click()
    page.locator('#detail-register').select_option('colleague')
    assert page.locator('.ex-row').count()==10
    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="stories"]').click()
    assert page.locator('[data-story-open]').count()==8

    # Restore the card screen, verify viewport and screenshot at small and large widths.
    page.locator('#view-stories [data-goto-study]').click()
    for width,height in [(320,568),(375,667),(390,844),(430,932),(1366,768)]:
        page.set_viewport_size({'width':width,'height':height})
        page.wait_for_timeout(150)
        result=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,scrollHeight:document.documentElement.scrollHeight,viewHeight:innerHeight,card:document.querySelector('#view-study').getBoundingClientRect().toJSON()})''')
        assert result['scrollWidth'] <= width+2, (width,result)
        assert result['scrollHeight'] <= height+3, (width,result)
        if width in (320,390,1366):page.screenshot(path=str(root/f'qa-phase5-{width}.png'))
    print('Browser mock verified: TTS fault/no completion, 7-card ordered session, favorite/known, 10 examples, 8 stories, 5 viewports, no JS errors')
    print('JS errors',errors)
    assert not errors
    browser.close()
