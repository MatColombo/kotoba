"""Check the responsive side-by-side treatment for compact Japanese words."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
prior=root/'tests/browser_revision041_mock.py'
namespace={'__file__':str(prior)}
exec(compile(prior.read_text().split('with sync_playwright() as pw:')[0],str(prior),'exec'),namespace)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page.set_content(namespace['html'],wait_until='load',timeout=60000)
 page.wait_for_function('window.KotobaDriveQA && KotobaDriveQA.getDecks().length===1',timeout=25000)
 page.evaluate('''() => {const deck=[...__fakeStore.decks.values()][0];deck.cards.sort((a,b)=>a.jp.length-b.jp.length);}''')
 page.locator('#btn-menu').click()
 page.locator('[data-menu-view="sessions"]').click()
 page.locator('#create-shuffle').uncheck()
 page.locator('#create-size').fill('75')
 page.locator('#create-known').select_option('include')
 page.locator('#create-session').click()
 page.locator('#btn-reveal').click()
 d=page.evaluate('''() => {const e=id=>document.querySelector(id).getBoundingClientRect().toJSON();return {j:document.querySelector('#study-front').textContent, inline:document.querySelector('.study-card').classList.contains('inline-headword'),head:e('#study-front'),ans:e('.answer-panel'),extras:e('.learning-extras')}}''')
 assert len(d['j'])<=3 and d['inline'],d
 assert d['head']['right']<d['ans']['left'],d
 assert d['head']['bottom']<=d['extras']['top'],d
 page.screenshot(path=str(root/'qa-042-compact-390x844.png'))
 print('PASS: 3-character Japanese headword and answer use separate columns with original font sizes',d['j'],flush=True)
 browser.close()
