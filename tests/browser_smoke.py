import sys,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
proc=subprocess.Popen(['python','-m','http.server','8766','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
 time.sleep(1)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  errs=[]
  page.on('pageerror',lambda e: errs.append(str(e)))
  
  def fulfill(route):
   from urllib.parse import urlparse,unquote
   target=urlparse(route.request.url).path.lstrip('/') or 'index.html'
   target=unquote(target)
   source=(root/target).resolve()
   if not str(source).startswith(str(root)) or not source.is_file():
    route.fulfill(status=404,body='not found');return
   ext=source.suffix.lower()
   mime={'.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.js':'application/javascript','.png':'image/png','.mp3':'audio/mpeg','.svg':'image/svg+xml'}.get(ext,'application/octet-stream')
   route.fulfill(status=200,body=source.read_bytes(),content_type=mime)
  page.route('https://kotoba-drive.test/**', fulfill)
  page.goto('https://kotoba-drive.test/index.html',wait_until='domcontentloaded',timeout=25000)
  page.wait_for_timeout(700)
  print('errors',errs)
  print('boot error hidden',page.locator('#boot-error').is_hidden())
  print('initial',page.evaluate('KotobaDriveQA.getSession()'))
  page.locator('#btn-menu').click()
  page.locator('[data-menu-view="sessions"]').click()
  print('session view visible',page.locator('#view-sessions').is_visible())
  print('eligible',page.locator('#session-eligible').inner_text())
  page.locator('#create-known').select_option('include')
  page.locator('#create-size').fill('12')
  page.locator('#create-shuffle').uncheck()
  page.locator('#create-session').click()
  print('new session',page.evaluate('KotobaDriveQA.getSession()'))
  page.locator('#study-favorite').click()
  page.locator('#study-known').click()
  print('flags',page.evaluate('KotobaDriveQA.getStudy().deckStates[KotobaDriveQA.getSession().deckId].cards[KotobaDriveQA.getSession().orderedCardIds[0]]'))
  page.locator('#btn-menu').click()
  page.locator('[data-menu-view="sessions"]').click()
  print('dashboard',page.locator('#deck-dashboard').inner_text()[:350])
  print('sessions',page.locator('#saved-sessions').locator('.session-entry').count())
  page.screenshot(path=str(root/'qa-phase3-sessions.png'),full_page=True)
  page.reload(wait_until='domcontentloaded')
  page.wait_for_timeout(500)
  print('after reload',page.evaluate('KotobaDriveQA.getSession()'))
  print('after reload flags',page.evaluate('KotobaDriveQA.getStudy().deckStates[KotobaDriveQA.getSession().deckId].cards[KotobaDriveQA.getSession().orderedCardIds[0]]'))
  print('post errors',errs)
  if errs or not page.locator('#boot-error').is_hidden():raise RuntimeError('browser test failed')
  browser.close()
finally:
 proc.terminate();proc.wait(timeout=5)
