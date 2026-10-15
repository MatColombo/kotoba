"""Visual and geometry regression for v0.4.2 headword-first flashcards.
Mocked persistent storage and Web Speech; tests actual Chromium layout, not Safari.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
legacy = root/'tests/browser_revision041_mock.py'
namespace = {'__file__':str(legacy)}
exec(compile(legacy.read_text().split('with sync_playwright() as pw:')[0], str(legacy), 'exec'), namespace)
html = namespace['html']

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'], headless=True)
    page = browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html, wait_until='load', timeout=60000)
    page.wait_for_function('window.KotobaDriveQA && KotobaDriveQA.getDecks().length===1', timeout=30000)
    # Sort the installed deck, not the contents of any user session. The five-character
    # entry must become the first card of a new session with shuffle disabled.
    page.evaluate('''() => {const deck=[...__fakeStore.decks.values()][0];deck.cards.sort((a,b)=>b.jp.length-a.jp.length); }''')
    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="sessions"]').click()
    page.locator('#create-shuffle').uncheck()
    page.locator('#create-size').fill('75')
    page.locator('#create-known').select_option('include')
    page.locator('#create-session').click()
    current=page.evaluate('KotobaDriveQA.getCurrent()')
    print('First word:',current,flush=True)
    assert len(current)>=5, 'Expected longest word first in unshuffled session'
    page.locator('#btn-reveal').click()
    sizes=[(320,568),(375,667),(390,844),(428,926),(1366,768),(844,390),(320,480)]
    def inspect(label):
        return page.evaluate('''() => {
          const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
          const c=document.querySelector('.study-card'),h=document.querySelector('#study-front'),a=document.querySelector('#study-answer'),p=document.querySelector('.learning-extras'),bottom=document.querySelector('.study-bottom');
          const rh=rect(h),rc=rect(c),rp=rect(p),rb=rect(bottom),ra=rect(a);
          return {head:rh,card:rc,examples:rp,answer:ra,bottom:rb,
            frontText:h.textContent,headScroll:[h.scrollWidth,h.clientWidth,h.scrollHeight,h.clientHeight],
            font:getComputedStyle(h).fontSize,headOverflow:getComputedStyle(h).overflow,headMaxHeight:getComputedStyle(h).maxHeight,
            pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,
            screen:[innerWidth,innerHeight],screenMode:document.querySelector('#study-card').className,
            extrasVisible:getComputedStyle(p).display!=='none'};
        }''')
    for width,height in sizes:
        page.set_viewport_size({'width':width,'height':height})
        page.wait_for_timeout(160)
        m=inspect(f'{width}x{height}')
        print(width,height,'kanji',m['frontText'],'font',m['font'],'head',m['head'],'extras',m['examples'], 'bottom',m['bottom'],flush=True)
        assert m['head']['h']>26,(width,height,m)
        assert m['head']['y']>=m['card']['y']-1,(width,height,'headword starts outside card')
        assert m['head']['bottom']<=m['card']['bottom']+1,(width,height,'headword cut at bottom',m)
        assert m['head']['x']>=m['card']['x']-1 and m['head']['right']<=m['card']['right']+1,(width,height,'headword out of horizontal bounds',m)
        assert m['headScroll'][2]<=m['headScroll'][3]+2,(width,height,'clipped internal text',m)
        assert m['headOverflow']!='hidden' and m['headMaxHeight']=='none',(width,height,'kanji still clipped',m)
        assert m['pageWidth']<=width+3 and m['pageHeight']<=height+3,(width,height,'page overflow',m)
        assert m['head']['bottom']<=m['bottom']['y']+1,(width,height,'overlaps playback',m)
        if m['extrasVisible']:
            assert m['head']['bottom']<=m['examples']['y']+1,(width,height,'overlaps examples',m)
        if (width,height) in [(320,568),(390,844),(844,390)]:
            page.screenshot(path=str(root/f'qa-042-{width}x{height}.png'))
    # A long synthetic Japanese word should wrap, NOT get truncated to 1-2 lines.
    page.set_viewport_size({'width':320,'height':568})
    page.evaluate('''() => {let h=document.querySelector('#study-front');h.textContent='難しい漢字の長い表現を確かめる';}''')
    page.wait_for_timeout(80)
    m=inspect('long');print('SYNTHETIC LONG WORD',m['head'],m['headScroll'],flush=True)
    assert m['head']['h']>100 and m['headScroll'][2]<=m['headScroll'][3]+2
    assert m['head']['bottom']<=m['examples']['y']+1
    page.screenshot(path=str(root/'qa-042-long-word-320.png'))
    # Native->Japanese: Japanese is the answer; no clipping in that direction either.
    page.locator('#btn-menu').click()
    page.locator('[data-menu-view="sessions"]').click()
    page.locator('#create-direction').select_option('native-jp')
    page.locator('#create-shuffle').uncheck()
    page.locator('#create-session').click()
    page.locator('#btn-reveal').click()
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(120)
    a=page.locator('#study-answer').evaluate('''e=>({text:e.textContent,sh:e.scrollHeight,ch:e.clientHeight,rect:e.getBoundingClientRect().toJSON()})''')
    print('Reverse direction JP answer',a,flush=True)
    assert a['sh']<=a['ch']+2
    assert not errors,errors
    print('PASS: word fully visible and untruncated across seven viewports, 14-character wrap and native-to-Japanese answer',flush=True)
    browser.close()
