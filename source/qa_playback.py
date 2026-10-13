from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 err=[];page.on('pageerror',lambda e:err.append(str(e)))
 page.evaluate('''() => {
 window.ttsHistory=[];
 window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],resume:()=>{},cancel:()=>{},speak(u){ttsHistory.push([u.text,u.lang]);setTimeout(()=>u.onend&&u.onend(),4)}}});
 Object.defineProperty(window, 'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{}}});
 }''')
 page.set_content((root/'index.html').read_text(encoding='utf-8'))
 page.locator('#btn-menu').click()
 page.locator('#study-category').select_option('noun')
 page.locator('#session-size').select_option('5')
 page.locator('#example-count').select_option('2')
 page.locator('#form-count').select_option('1')
 page.locator('#global-gap').fill('0')
 page.locator('#global-gap').press('Tab')
 page.locator('#wheel-enabled').evaluate('(el)=>el.click()')
 page.evaluate('window.KotobaDriveQA.getSettings().groups.forEach(g=>g.after=0)')
 page.locator('#btn-close-drawer').click()
 expected=page.evaluate('window.KotobaDriveQA.getPlan().plan.filter(x=>x.kind==="say")')
 assert [x['type'] for x in expected]==['word','meaning','formLabel','form','exampleJP','exampleNative','exampleJP','exampleNative']
 page.locator('#btn-play').click()
 page.wait_for_timeout(400)
 observed=page.evaluate('window.ttsHistory')
 assert len(observed)>=len(expected),(len(observed),len(expected))
 assert observed[0][0]==expected[0]['text'],(observed[0],expected[0])
 assert observed[1][0]==expected[1]['text']
 assert observed[2][0].startswith('Forma'),observed[2]
 assert observed[3][1]=='ja-JP'
 assert observed[4][1]=='ja-JP'
 assert observed[5][1]=='it-IT'
 assert observed[6][1]=='ja-JP'
 assert observed[7][1]=='it-IT'
 page.wait_for_timeout(2600)
 assert 'Sessione completata' in page.locator('#playback-status').inner_text(),page.locator('#playback-status').inner_text()
 assert not err,err
 print('PASS: audio engine executed scripted voices in order, spoke grammar labels and 2 examples per term, completed session')
 b.close()
