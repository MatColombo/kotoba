from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,time,sys
root=Path(__file__).resolve().parent.parent
server=subprocess.Popen(['python3','-m','http.server','8871','--bind','127.0.0.1','--directory',str(root)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.75)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for name,w,h,mobile in [('iphone',390,844,True),('iphone-small',375,667,True),('iphone-se',320,568,True),('desktop',1440,900,False)]:
   ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=mobile,has_touch=mobile)
   page=ctx.new_page()
   errors=[]
   page.on('pageerror',lambda err: errors.append(str(err)))
   page.evaluate("window._localSave = {}; Object.defineProperty(window, 'localStorage', {value:{getItem:k=>window._localSave[k]||null,setItem:(k,v)=>window._localSave[k]=v,removeItem:k=>delete window._localSave[k]}})")
   page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load',timeout=45000)
   page.wait_for_timeout(300)
   assert page.title()=='Kotoba Drive — Studio audio N4'
   assert page.locator('#study-counter').inner_text().endswith('/ 20'),page.locator('#study-counter').inner_text()
   assert page.locator('#study-front').inner_text()!=''
   bounds=page.evaluate('''() => ({innerWidth:innerWidth,innerHeight:innerHeight,scrollHeight:document.body.scrollHeight,card:document.querySelector('.study-card').getBoundingClientRect().toJSON(),header:document.querySelector('header').getBoundingClientRect().toJSON(),cardActions:document.querySelector('.card-actions').getBoundingClientRect().toJSON()})''')
   assert bounds['card']['bottom']<=h+1,(name,bounds)
   assert bounds['cardActions']['bottom']<=h-1,(name,bounds)
   assert page.evaluate('document.scrollingElement.scrollHeight<=innerHeight+2'),(name,bounds)
   page.screenshot(path=str(root/f'qa-{name}.png'),full_page=True)
   assert page.locator('#study-answer').inner_text()=='••••'
   page.locator('#btn-reveal').click()
   assert page.locator('#study-answer').inner_text()!='••••'
   page.locator('#btn-reveal').click()
   page.locator('#btn-menu').click()
   assert page.locator('#app-drawer').get_attribute('aria-hidden')=='false'
   assert page.locator('#drawer-settings').is_visible()
   page.locator('#study-direction').select_option('native-jp')
   assert page.locator('#study-answer').inner_text()=='••••'
   assert page.locator('#study-front').get_attribute('lang')=='it'
   front=page.locator('#study-front').inner_text()
   answerJP=page.evaluate('window.KotobaDriveQA.getCurrent()')
   assert front!=answerJP,(front,answerJP)
   page.locator('#btn-close-drawer').click()
   assert page.locator('#app-drawer').get_attribute('aria-hidden')=='true'
   page.locator('#btn-reveal').click()
   assert page.locator('#study-answer').inner_text()==answerJP
   page.locator('#btn-menu').click()
   page.locator('#example-count').select_option('3')
   plan=page.evaluate('window.KotobaDriveQA.getPlan().plan.filter(x=>x.kind==="say")')
   kinds=[step['type'] for step in plan]
   assert kinds[0]=='meaning',kinds[:5]
   assert kinds[1]=='word',kinds[:5]
   assert kinds.count('exampleJP')==3,kinds.count('exampleJP')
   assert kinds.count('exampleNative')==3
   exSteps=[step for step in plan if step['type'].startswith('example')]
   assert [s['type'] for s in exSteps]==['exampleJP','exampleNative']*3,[s['type'] for s in exSteps]
   firstForm=kinds.index('form')
   assert kinds[firstForm-1]=='formLabel'
   page.locator('[data-drawer="sequence"]').click()
   assert page.locator('.sequence-group').count()==4
   page.locator('#preset-repeat').click()
   plan=page.evaluate('window.KotobaDriveQA.getPlan().plan.filter(x=>x.kind==="say")')
   kinds=[s['type'] for s in plan]
   assert kinds[:9]==['word','word','meaning']*3,kinds[:12]
   page.locator('[data-g-repeat]').first.fill('2')
   page.locator('[data-g-repeat]').first.press('Tab')
   plan=page.evaluate('window.KotobaDriveQA.getPlan().plan.filter(x=>x.kind==="say")')
   assert [s['type'] for s in plan[:6]]==['word','word','meaning']*2
   page.locator('#preset-standard').click()
   page.locator('.sequence-group').first.locator('[data-g-action="add-item"]').click()
   assert page.locator('.sequence-group').first.locator('.sequence-item').count()==2
   page.locator('.sequence-group').first.locator('[data-i-type]').last.select_option('exampleJP')
   page.locator('.sequence-group').first.locator('[data-i-enabled]').last.uncheck()
   assert page.locator('.sequence-group').first.locator('.sequence-item').count()==2
   page.locator('#btn-drawer-done').click()
   assert page.locator('#view-study').is_visible()
   page.locator('#language-en').click()
   assert page.locator('#study-front').get_attribute('lang')=='en'
   plan=page.evaluate('window.KotobaDriveQA.getPlan().plan.filter(x=>x.kind==="say")')
   assert plan[0]['lang']=='en-US'
   persisted=page.evaluate('window._localSave')
   page.close()
   page=ctx.new_page()
   page.evaluate("saved => { window._localSave = saved; Object.defineProperty(window, 'localStorage', {value:{getItem:k=>window._localSave[k]||null,setItem:(k,v)=>window._localSave[k]=v,removeItem:k=>delete window._localSave[k]}}) }", persisted)
   page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load')
   assert page.locator('#study-front').get_attribute('lang')=='en'
   assert page.evaluate('window.KotobaDriveQA.getSettings().exampleCount')==3
   page.locator('#btn-menu').click()
   page.locator('[data-menu-view="library"]').click()
   assert page.locator('.word-row').count()==25
   page.locator('[data-filter="na"]').click()
   assert page.locator('.word-row').count()==5
   page.locator('.word-row').first.click()
   assert page.locator('.ex-row').count()==10
   page.locator('#btn-menu').click()
   page.locator('[data-menu-view="diagnostics"]').click()
   page.locator('#sim-next').click()
   assert 'SIMULATO' in page.locator('#event-log').inner_text()
   assert not errors,(name,errors)
   print(f'{name} OK: {w}x{h}; card bottom {bounds["card"]["bottom"]:.0f}; events {len(errors)}',flush=True)
   ctx.close()
  browser.close()
finally:
 server.terminate();server.wait()
