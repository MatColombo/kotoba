'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const css=read('source/notebook.css');
const html=read('source/template.html');
const app=read('source/app.js');
const hl=require('../source/word-highlighter.js');

test('Japanese い adjectives highlight -く forms even without deck entry',()=>{
 const w={jp:'暖かい',kana:'あたたかい',pos:'i',forms:[{jp:'暖かかった'},{jp:'暖かくない'},{jp:'暖かくて'}]};
 assert.match(hl.markJapanese('だんだん暖かくなります。',w),/<mark class="nb-term-mark">暖かく<\/mark>/);
 assert.match(hl.markJapanese('あたたかくなりました。',w),/<mark class="nb-term-mark">あたたかく<\/mark>/);
 assert.match(hl.markJapanese('暖かくない',w),/<mark class="nb-term-mark">暖かくない<\/mark>/);
 assert.equal(hl.markJapanese('寒いです。',w),'寒いです。');
 assert.match(hl.markJapanese('<span>暖かく',w),/&lt;span&gt;/);
});
test('readings are exactly one horizontal scrolling line, while the player anchors to bottom',()=>{
 assert.match(css, /#view-study \.nb-forms-section\{[^}]*overflow-x:auto/);
 assert.match(css, /#view-study \.compact-forms\{[^}]*flex-wrap:nowrap/);
 assert.match(css, /#view-study \.study-bottom\.nb-player\{[^}]*align-self:end/);
 assert.match(css, /#view-study \.nb-no-kana \.kana-viewport\{display:none!important/);
});
test('kana is a persisted session setting and Japanese + translation always display',()=>{
 for(const id of ['create-show-kana','session-show-kana'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/session\.showKana=options\.showKana!==false/);
 assert.match(app,/const showKana=currentSession\(\)\?\.showKana!==false/);
 assert.match(app,/\$\('study-example-jp'\)\.innerHTML=highlightNotebookTerm\(example\.jp,w\)/);
 assert.match(app,/\$\('study-example-native'\)\.textContent=example\[state\.lang\]\|\|''/);
});
test('ONNX caption localizes English and Italian rather than leaking raw Italian',()=>{
 assert.match(app,/Loading \$\{label\} model/);
 assert.match(app,/Generating \$\{label\} audio/);
 assert.match(app,/Caricamento modello \$\{label\}/);
});
