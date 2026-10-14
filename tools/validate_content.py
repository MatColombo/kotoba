#!/usr/bin/env python3
"""Static checks and a linguistic-review signal report, not a native proofreading tool."""
import json,re,collections,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
D=json.loads((root/'decks/n4-core.json').read_text(encoding='utf-8'))
errors=[];warnings=[];ids=set();sc={s['id']:s for s in D['scenarios']}
for c in D['cards']:
 if str(c['id']) in ids:errors.append('duplicate card id')
 ids.add(str(c['id']))
 if len(c['examples'])!=30:errors.append(f'count {c["id"]}')
 for reg in ['informal','colleague','superior']:
  if len([e for e in c['examples'] if e['register']==reg])!=10:errors.append(f'register count {c["id"]} {reg}')
 for e in c['examples']:
  if e['scenarioId'] not in sc:errors.append('invalid scenario')
  if e['register']!=sc[e['scenarioId']]['register']:errors.append('mismatched register')
  for k in ['jp','kana','it','en','grammarForm']:
   if not e[k]:errors.append(f'missing {k}')
  if re.search(r'[一-龯]',e['kana']):warnings.append(f"kanji in kana {e['id']}")
  # A stem heuristic can only flag manual-review candidates, never prove use.
  stem=(c['jp'][:-2] if c['pos']=='verb' and c['jp'].endswith('する') else c['jp'][:-1] if c['pos'] in ['verb','i'] else c['jp'])
  if stem not in e['jp']:warnings.append(f"target stem not matched {e['id']} ({stem})")
  if e['grammarForm']=='未判定':warnings.append(f"grammar form uncertain {e['id']}")
  if not e['jp'].endswith(('。','」')):warnings.append(f"punctuation {e['id']}")
for story in D['stories']:
 if set(story['cardIds'])!=set(k for seg in story['segments'] for k in seg['cardIds']):errors.append(f"story coverage {story['id']}")
 for seg in story['segments']:
  if re.search(r'[一-龯]',seg['kana']):warnings.append(f"story kana has kanji {seg['id']}")
  for id in seg['cardIds']:
   word=next(c for c in D['cards'] if str(c['id'])==str(id))
   stem=word['jp'][:-2] if word['pos']=='verb' and word['jp'].endswith('する') else word['jp'][:-1] if word['pos'] in ['verb','i'] else word['jp']
   if stem not in seg['jp']:warnings.append(f"story target form needs review {seg['id']} {word['jp']}")
report={"summary":{"cards":len(D['cards']),"newContextExamples":sum(len(c['examples']) for c in D['cards']),"preservedOriginalExamples":sum(len(c['legacyExamples']) for c in D['cards']),"scenarios":len(D['scenarios']),"groups":len(D['storyGroups']),"stories":len(D['stories']),"segments":sum(len(st['segments']) for st in D['stories']),"automaticStructuralErrors":len(errors),"automaticLinguisticReviewFlags":len(warnings),"humanReviewCompleted":False},"structuralErrors":errors,"linguisticReviewFlags":warnings[:200],"qualityNotes":["The 2250 contextual items were formed by wrapping 750 earlier examples with scenario narration; they are draft examples, NOT newly authored register-specific dialogue.","Quoted text may contain a register that differs from the situational framing and may not semantically fit the location.","No Japanese native-speaker linguistic review was completed.","Grammar form detection uses substring heuristics, not morphological analysis; 未判定 requires manual review."]}
(root/'CONTENT_QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report['summary'],ensure_ascii=False))
if errors:sys.exit(1)
