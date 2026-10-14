"""End-to-end UI verification in Chromium with a simulated archive and TTS.
Real Safari/iOS voices and physical Bluetooth are not covered.
"""
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
    page.set_content(html,wait_until='load',timeout=45000)
    page.wait_for_function('window.KotobaDriveQA && KotobaDriveQA.getDecks().length===1',timeout=20000)
    assert page.locator('#boot-error').is_hidden(),errors
    # Normal mode initially hides meaning and examples; forward skip reveals the whole card.
    initial=page.evaluate('KotobaDriveQA.getCurrent()')
    assert page.locator('#study-answer').inner_text()=='••••'
    assert 'Frase nascosta' in page.locator('#study-example-jp').inner_text()
    page.locator('#btn-next').click()
    assert page.evaluate('KotobaDriveQA.getCurrent()')==initial
    assert page.locator('#study-answer').inner_text()!='••••'
    assert 'Frase nascosta' not in page.locator('#study-example-jp').inner_text()
    assert page.locator('#study-example-native').inner_text()
    assert page.locator('#study-forms .form-pill').count()>=1
    page.locator('#btn-next').click()
    assert page.locator('#study-answer').inner_text()!='••••', 'Skipping again must not hide revealed content'
    # Deliberately long sentence must scroll slowly instead of being truncated.
    page.evaluate('''() => {
      const deck=[...window.__fakeStore.decks.values()][0],c=deck.cards.find(c=>c.jp===KotobaDriveQA.getCurrent());
      window.__beforeLongExamples=c.examples.map(e=>e.jp);
      c.examples.forEach(e=>e.jp=e.jp+' 昨日は非常に長い説明を読みました。'.repeat(16));
    }''')
    page.locator('#example-next').click()
    page.wait_for_function("document.querySelector('.jp-viewport .example-scroll-inner').classList.contains('scrolling')",timeout=10000)
    assert page.locator('.jp-viewport .example-scroll-inner').evaluate('(el)=>el.style.getPropertyValue("--scroll-duration")')
    page.evaluate('''() => {
      const deck=[...window.__fakeStore.decks.values()][0],c=deck.cards.find(c=>c.jp===KotobaDriveQA.getCurrent());
      c.examples.forEach((e,i)=>e.jp=window.__beforeLongExamples[i]);
    }''')
    # Switching to a fresh card hides content again.
    for _ in range(4):
        if page.evaluate('KotobaDriveQA.getCurrent()')!=initial:break
        page.locator('#btn-next').click()
    assert page.evaluate('KotobaDriveQA.getCurrent()')!=initial
    assert page.locator('#study-answer').inner_text()=='••••'
    # New session: shuffled examples, original card order.
    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="sessions"]').click()
    page.locator('#create-shuffle').uncheck()
    page.locator('#create-shuffle-examples').check()
    page.locator('#create-size').fill('4')
    page.locator('#create-known').select_option('include')
    page.locator('#create-session').click()
    s=page.evaluate('KotobaDriveQA.getSession()')
    assert s['shuffleEnabled'] is False and s['exampleShuffleEnabled'] is True
    assert len(s['orderedCardIds'])==4 and len(s['exampleOrders'][s['orderedCardIds'][0]])==30
    assert page.locator('#study-meaning-count').is_visible()
    # Use speech mock for a single successful meaning utterance.
    page.evaluate('''() => {
      const q=KotobaDriveQA,groups=q.getSettings().groups;
      groups.splice(0,groups.length,{id:'meaning-only',name:'Meaning test',enabled:true,repeat:1,pauseAfterGroupMs:0,pauseBetweenGroupRepeatsMs:0,
        items:[{id:'meaning-1',type:'meaning',enabled:true,repeat:1,pauseBetweenRepeatsMs:0,pauseAfterElementMs:0}]});
      let calls=0;
      KotobaCore.SpeechAdapter.prototype.speak=async()=> ++calls===1?'done':new Promise(()=>{});
    }''')
    first_id=s['orderedCardIds'][0]
    page.locator('#btn-play').click()
    page.wait_for_function('''cid => {
      const q=KotobaDriveQA, st=q.getStudy(), sess=q.getSession();
      return (st.deckStates[sess.deckId]?.cards?.[cid]?.meaningPlays||0)>=1;
    }''',arg=first_id,timeout=10000)
    v=page.evaluate('''cid => {const q=KotobaDriveQA,s=q.getSession();return q.getStudy().deckStates[s.deckId].cards[cid]}''',first_id)
    assert v['meaningPlays']==1 and v['exposures']==1
    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="library"]').click()
    page.locator('[data-word-id="'+first_id+'"]').first.click()
    assert '1 volte' in page.locator('#detail-meaning-count').inner_text()
    page.locator('#view-library [data-goto-study]').click()
    for width,height in [(320,568),(390,844),(1366,768)]:
        page.set_viewport_size({'width':width,'height':height})
        page.wait_for_timeout(180)
        metrics=page.evaluate('''() => ({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,
          headword:document.querySelector('#study-front').getBoundingClientRect().height,
          meaning:document.querySelector('#study-meaning-count').getBoundingClientRect().width})''')
        assert metrics['w']<=width+2 and metrics['h']<=height+3,(width,metrics)
        assert metrics['headword']>15,(width,metrics)
        if width in (320,390): page.screenshot(path=str(root/f'qa-ux-{width}.png'))
    assert not errors,errors
    print('Chromium mock integration verified: progressive reveal, forward skip, reset new card, independent example shuffle, meaning playback counter, 3 viewport layouts, no JS errors')
    browser.close()
