/* Kotoba Drive v0.4 phase 4: contextual content selection, no persistent user data. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.KotobaContent=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const REGISTERS=['informal','colleague','superior'];
 function examplesFor(card, filters={}){const xs=filters.register==='legacy'?(card?.legacyExamples||[]):(Array.isArray(card?.examples)?card.examples:[]);
  const chosen=xs.filter(e=>(!filters.register||filters.register==='all'||filters.register==='legacy'||e.register===filters.register)&&(!filters.scenario||filters.scenario==='all'||e.scenarioId===filters.scenario));
  if((!filters.register||filters.register==='all')&&(!filters.scenario||filters.scenario==='all'))return chosen.sort((a,b)=>{const ao=Number(a.scenarioId?.split('-').at(-1))||0,bo=Number(b.scenarioId?.split('-').at(-1))||0;return ao-bo||REGISTERS.indexOf(a.register)-REGISTERS.indexOf(b.register)});
  return chosen;
 }
 function availableScenarios(deck,register='all'){return (deck?.scenarios||[]).filter(s=>register==='all'||s.register===register)}
 function storiesFor(deck,groupId='all'){return (deck?.stories||[]).filter(s=>groupId==='all'||s.groupId===groupId)}
 function groupById(deck,id){return (deck?.storyGroups||[]).find(g=>g.id===id)||null}
 function storyById(deck,id){return (deck?.stories||[]).find(s=>s.id===id)||null}
 function validateContextDeck(deck){const issues=[],ids=new Set((deck.cards||[]).map(c=>String(c.id))),scenarios=new Set((deck.scenarios||[]).map(x=>x.id)),groups=new Set((deck.storyGroups||[]).map(x=>x.id)),stories=new Set((deck.stories||[]).map(x=>x.id));
  if((deck.scenarios||[]).length!==30)issues.push('Expected 30 scenarios');
  for(const c of deck.cards||[]){if(c.examples?.length!==30)issues.push(`Card ${c.id}: expected 30 examples`);
   for(const reg of REGISTERS)if(c.examples?.filter(e=>e.register===reg).length!==10)issues.push(`Card ${c.id}: ${reg} count`);
   for(const e of c.examples||[]){if(!scenarios.has(e.scenarioId))issues.push('Missing scenario '+e.scenarioId);if(String(e.cardId)!==String(c.id))issues.push('Card mismatch');for(const k of ['jp','kana','it','en','grammarForm'])if(!e[k])issues.push(`Missing ${k}`)}
   if(!groups.has(c.storyGroupId))issues.push('Missing group for '+c.id);
  }
  for(const g of deck.storyGroups||[]){if(!stories.has(g.storyId))issues.push('Missing story '+g.storyId);for(const id of g.cardIds||[])if(!ids.has(String(id)))issues.push('Missing card '+id)}
  for(const s of deck.stories||[]){const included=new Set();for(const seg of s.segments||[]){for(const k of ['jp','kana','it','en'])if(!seg[k])issues.push('Story segment missing '+k);for(const id of seg.cardIds||[])included.add(String(id));}for(const id of s.cardIds||[])if(!included.has(String(id)))issues.push('Story does not use '+id)}
  return issues;
 }
 return {REGISTERS,examplesFor,availableScenarios,storiesFor,groupById,storyById,validateContextDeck};
});
