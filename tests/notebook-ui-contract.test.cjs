'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const template=read('source/template.html');
const css=read('source/notebook.css');
const ui=read('source/notebook-ui.js');
const app=read('source/app.js');
const bundle=read('index.html');
test('Notebook retains stable study and ONNX HTML hook ids',()=>{
 for(const id of ['study-front','study-answer','study-forms','study-example-jp','study-example-native','btn-play','btn-repeat','btn-next','onnx-readiness','onnx-progress-caption','event-log','deck-import-file'])assert.match(template,new RegExp('id="'+id+'"'));
});
test('Notebook exposes frozen Home, Library, appearance and technical screen containers',()=>{
 for(const id of ['view-home','view-study','view-notebook-library','view-notebook-detail','view-notebook-sequences','view-notebook-audio','view-notebook-appearance','view-notebook-backup','view-notebook-errors'])assert.match(template,new RegExp('id="'+id+'"'));
 assert.match(template,/Learn Japanese\.\.\. hands free/);
 assert.match(ui,/Importa da file locale/);
});
test('Notebook style has anthracite night and 6px text minimum, not permanent bottom navigation',()=>{
 assert.match(css,/#1C1D1F/);
 assert.match(css,/#F8F6EF/);
 assert.match(template,/id="nb-font-size"[^>]*min="6"[^>]*max="30"/);
 assert.doesNotMatch(template,/class="bottom-navigation"/);
 assert.match(css,/#view-study .*\.nb-reading/);
});
test('Notebook boot and worker progress hooks remain in generated standalone bundle',()=>{
 assert.match(app,/window\.KotobaNotebookBridge=Object\.freeze/);
 assert.match(app,/Caricamento modello/);
 assert.match(app,/Generazione/);
 assert.match(ui,/data-nb-theme-choice/);
 for(const token of ['window.KotobaNotebookBridge','kotoba:booted','view-notebook-detail','kotoba-notebook-listens-v1'])assert.ok(bundle.includes(token),token);
 assert.doesNotMatch(bundle,/__NOTEBOOK_JS__|__ENGINE_JS__|__APP_CSS__/);
});
