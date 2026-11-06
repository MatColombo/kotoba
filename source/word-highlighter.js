/* Japanese term highlighting for Notebook UI. Does not change the deck or TTS text. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KotobaTermHighlight=api;})(typeof globalThis==='object'?globalThis:this,function(){'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const len=s=>Array.from(s).length;
 function candidates(card){
  const out=new Set([card?.jp,...(card?.forms||[]).map(f=>f?.jp)].filter(Boolean).map(String));
  const original=String(card?.jp||'');
  const reading=String(card?.kana||'');
  // い-adjectives: 暖かい -> 暖かく; 高い -> 高く (adverbial form is often absent in decks).
  // Avoid arbitrary prefix matches, which would highlight unrelated compounds.
  if(card?.pos==='i'){
   for(const base of [original,reading]){
    if(!base.endsWith('い')||len(base)<3)continue;
    const stem=base.slice(0,-1);
    for(const suffix of ['く','かった','くて','ければ','さ','そう','すぎる','くない','くなかった'])out.add(stem+suffix);
   }
   if(['いい','良い','よい'].includes(original)||['いい','よい'].includes(reading)){
    for(const form of ['よく','よかった','よくない','良く','良かった','良くない'])out.add(form);
   }
  }
  // な-adjectives: use the explicitly known base with common grammatical continuations.
  if(card?.pos==='na'){
   for(const base of [original,reading])if(len(base)>=2){for(const suffix of ['に','な','で','だった','じゃない','ではない'])out.add(base+suffix)}
  }
  // Ichidan verb stems can produce legitimate forms absent from a small declension list.
  // Do not treat a one-character stem as a free match.
  if(card?.pos==='verb'&&original.endsWith('る')&&len(original)>=3){
   const stem=original.slice(0,-1);
   if(/[いきしちにひみりえけせてねへめれげぜでべぺ]/u.test(String(card?.kana||'').slice(-2,-1))){
    for(const suffix of ['たい','たく','ている','ていた','てる','れば','よう','られる','させる'])out.add(stem+suffix);
   }
  }
  return [...out].filter(s=>len(s)>=2).sort((a,b)=>len(b)-len(a)||a.localeCompare(b));
 }
 function markJapanese(value,card){
  const text=String(value??''),terms=candidates(card);if(!terms.length)return esc(text);
  let html='',i=0;
  while(i<text.length){const hit=terms.find(word=>text.startsWith(word,i));if(hit){html+='<mark class="nb-term-mark">'+esc(hit)+'</mark>';i+=hit.length;}else{const code=text.codePointAt(i),char=String.fromCodePoint(code);html+=esc(char);i+=char.length}}
  return html;
 }
 return {candidates,markJapanese};
});
