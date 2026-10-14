from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,time,os,json
root=Path(__file__).resolve().parent.parent
server=subprocess.Popen(['python','-m','http.server','8765','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
time.sleep(1)
result={'pageOpened':False,'deckLoaded':False,'storyView':False,'registerExamples':False,'sessionCreation':False,'errors':[], 'screenshots':[]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
  page=context.new_page()
  page.on('pageerror',lambda exc:result['errors'].append(str(exc)))
  page.goto('http://127.0.0.1:8765/',wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function("window.KotobaDriveQA && window.KotobaDriveQA.getDecks().length>0",timeout=30000)
  result['pageOpened']=True
  result['deckLoaded']=page.evaluate('window.KotobaDriveQA.getDecks()')
  page.screenshot(path=str(root/'qa-phase4-study.png'))
  result['screenshots'].append('qa-phase4-study.png')
  page.click('#btn-menu');page.click('[data-menu-view="library"]')
  page.wait_for_timeout(400)
  page.select_option('#detail-register','colleague')
  page.wait_for_timeout(150)
  result['registerExamples']=page.locator('.ex-row').count()
  page.screenshot(path=str(root/'qa-phase4-examples.png'))
  result['screenshots'].append('qa-phase4-examples.png')
  page.click('#btn-menu');page.click('[data-menu-view="stories"]')
  page.wait_for_timeout(300)
  result['storyView']={'stories':page.locator('[data-story-open]').count(),'segments':page.locator('.story-segment').count()}
  page.screenshot(path=str(root/'qa-phase4-stories.png'))
  result['screenshots'].append('qa-phase4-stories.png')
  page.click('#btn-menu');page.click('[data-menu-view="sessions"]')
  page.wait_for_timeout(200)
  page.select_option('#create-register','informal')
  page.select_option('#create-group','n4-story-group-01')
  page.fill('#create-size','10')
  page.click('#create-session')
  page.wait_for_timeout(350)
  result['sessionCreation']={'ids':page.evaluate('window.KotobaDriveQA.getSession()?.orderedCardIds'),'examples':page.evaluate('window.KotobaDriveQA.getContextSelection()')}
  page.screenshot(path=str(root/'qa-phase4-session.png'))
  result['screenshots'].append('qa-phase4-session.png')
  browser.close()
finally:
 server.terminate();server.wait(timeout=8)
(root/'BROWSER_QA.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(result,indent=2,ensure_ascii=False))
if not (result['pageOpened'] and result['registerExamples']==10 and result['storyView']['stories']==8 and len(result['sessionCreation'].get('ids',[]))==10 and not result['errors']):
 raise SystemExit(1)
