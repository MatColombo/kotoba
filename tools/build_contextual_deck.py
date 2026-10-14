#!/usr/bin/env python3
"""Generate scenario-labelled contextual practice. This is a DRAFT generation pipeline,
not proof of native-level Japanese correctness. The ten legacy examples remain intact.
"""
import json,copy,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
source=root/'decks/n4-core.json'
d=json.loads((root.parent/'kotoba-drive-v04-phase3/decks/n4-core.json').read_text(encoding='utf-8'))

# Situation frames are complete prose, in all three languages. Never change the
# source example: errors from automatic conjugation/keigo conversion are avoided.
contexts=[
 ('informal','supermarket','スーパーで母と息子が買い物をしながら話した。','すーぱーでははとむすこがかいものをしながらはなした。','Al supermercato, madre e figlio ne hanno parlato facendo la spesa.','At the supermarket, a mother and her son talked while shopping.','Madre e figlio','Famiglia','Supermercato','mother,son'),
 ('informal','ramen','ラーメン屋を出た二人の友達は歩きながら話した。','らーめんやをでたふたりのともだちはあるきながらはなした。','Due amici ne hanno parlato camminando dopo il ramen.','Two friends discussed it while walking after ramen.','Due amici','Amicizia','Fuori dal ramen shop','friends'),
 ('informal','missed-train','電車に乗り遅れた兄弟は駅のベンチで話した。','でんしゃにのりおくれたきょうだいはえきのべんちではなした。','Due fratelli ne hanno parlato sulla panchina dopo aver perso il treno.','Two siblings discussed it on a bench after missing their train.','Fratelli','Famiglia','Stazione','siblings'),
 ('informal','dinner','夕飯を作っていたルームメイトたちは台所で話した。','ゆうはんをつくっていたるーむめいとたちはだいどころではなした。','I coinquilini ne hanno parlato preparando la cena.','The roommates talked about it while cooking dinner.','Coinquilini','Coabitazione','Cucina','roommates'),
 ('informal','hiking','山歩きの計画を立てる友達同士が話した。','やまあるきのけいかくをたてるともだちどうしがはなした。','Degli amici ne hanno parlato organizzando una camminata in montagna.','Friends discussed it while planning a mountain hike.','Amici','Amicizia','Parco','friends'),
 ('informal','homework','宿題を見ていた父と娘は机の前で話した。','しゅくだいをみていたちちとむすめはつくえのまえではなした。','Padre e figlia ne hanno parlato mentre facevano i compiti.','A father and his daughter discussed it over homework.','Padre e figlia','Famiglia','Casa','father,daughter'),
 ('informal','training','練習を終えた仲間たちは更衣室の前で話した。','れんしゅうをおえたなかまたちはこういしつのまえではなした。','I compagni ne hanno parlato dopo l’allenamento.','Teammates discussed it after practice.','Compagni','Sport','Palestra','teammates'),
 ('informal','umbrella','なくした傘を探す二人は駅前で話した。','なくしたかさをさがすふたりはえきまえではなした。','Due amici ne hanno parlato cercando un ombrello smarrito.','Two friends talked while looking for a missing umbrella.','Due amici','Amicizia','Piazza della stazione','friends'),
 ('informal','moving','引っ越しを手伝っていた友達は荷物のそばで話した。','ひっこしをてつだっていたともだちはにもつのそばではなした。','Gli amici ne hanno parlato fra gli scatoloni durante il trasloco.','Friends talked among boxes while helping with a move.','Amici','Amicizia','Casa nuova','friends'),
 ('informal','surprise-party','内緒のパーティーを準備していた友達は小声で話した。','ないしょのぱーてぃーをじゅんびしていたともだちはこごえではなした。','Gli amici ne hanno parlato sottovoce preparando una festa a sorpresa.','Friends whispered about it while planning a surprise party.','Amici','Amicizia','Salotto','friends'),
 ('colleague','standup','朝の打ち合わせで同僚が状況を説明した。','あさのうちあわせでどうりょうがじょうきょうをせつめいした。','Durante la riunione del mattino, un collega ha spiegato la situazione.','During the morning meeting, a colleague explained the situation.','Colleghi','Pari grado','Ufficio','coworkers'),
 ('colleague','requirements','要件を確認する席で同僚が意見を述べた。','ようけんをかくにんするせきでどうりょうがいけんをのべた。','Durante il chiarimento dei requisiti, un collega ha espresso un’opinione.','During requirements clarification, a colleague expressed an opinion.','Colleghi','Pari grado','Sala progetto','coworkers'),
 ('colleague','meeting-room','会議室を予約した後、二人の同僚が話し合った。','かいぎしつをよやくしたあと、ふたりのどうりょうがはなしあった。','Dopo aver prenotato una sala, due colleghi ne hanno discusso.','Two coworkers discussed it after booking a meeting room.','Colleghi','Pari grado','Sala riunioni','coworkers'),
 ('colleague','report-review','報告書の確認中に担当者が補足した。','ほうこくしょのかくにんちゅうにたんとうしゃがほそくした。','Durante la revisione del report, il referente ha aggiunto un chiarimento.','While reviewing a report, the owner added clarification.','Colleghi','Pari grado','Sala progetto','coworkers'),
 ('colleague','handoff','仕事を引き継ぐ際に先輩と後輩が話した。','しごとをひきつぐさいにせんぱいとこうはいがはなした。','Durante un passaggio di consegne, due colleghi ne hanno parlato.','Two colleagues talked during a handoff.','Colleghi','Tra pari','Ufficio','coworkers'),
 ('colleague','software-demo','ソフトウェアの実演後、担当者同士が話した。','そふとうぇあのじつえんご、たんとうしゃどうしがはなした。','Dopo una demo software, i responsabili ne hanno parlato.','The team members discussed it after a software demo.','Colleghi','Pari grado','Sala dimostrazioni','coworkers'),
 ('colleague','supplier','納品に立ち会った同僚たちが確認した。','のうひんにたちあったどうりょうたちがかくにんした。','I colleghi presenti alla consegna del fornitore ne hanno discusso.','Coworkers receiving a supplier delivery discussed it.','Colleghi','Pari grado','Magazzino','coworkers'),
 ('colleague','lunch','新しい同僚との昼食で話題になった。','あたらしいどうりょうとのちゅうしょくでわだいになった。','L’argomento è emerso a pranzo con una nuova collega.','The subject came up over lunch with a new coworker.','Colleghi','Pari grado','Mensa','coworkers'),
 ('colleague','rescheduling','予定を調整する電話の後で同僚と話した。','よていをちょうせいするでんわのあとでどうりょうとはなした。','Dopo la telefonata per spostare una riunione, ne hanno parlato tra colleghi.','Coworkers discussed it after a call to reschedule a meeting.','Colleghi','Pari grado','Ufficio','coworkers'),
 ('colleague','retrospective','振り返り会議でチームが意見を交換した。','ふりかえりかいぎでちーむがいけんをこうかんした。','Il team ne ha discusso durante la retrospettiva.','The team discussed it during the retrospective.','Team','Pari grado','Sala riunioni','coworkers'),
 ('superior','manager-update','上司への進捗報告の場で担当者がご説明した。','じょうしへのしんちょくほうこくのばでたんとうしゃがごせつめいした。','Il referente lo ha spiegato durante l’aggiornamento al responsabile.','The person in charge explained it during a manager update.','Dipendente e responsabile','Gerarchico','Ufficio direzione','employee,manager'),
 ('superior','budget','予算の承認をお願いする際に担当者が申し上げた。','よさんのしょうにんをおねがいするさいにたんとうしゃがもうしあげた。','Il referente lo ha esposto chiedendo l’approvazione del budget.','The employee stated it when requesting budget approval.','Dipendente e direttore','Gerarchico','Sala direzione','employee,director'),
 ('superior','executive-welcome','役員をお迎えした担当者が丁寧にお伝えした。','やくいんをおむかえしたたんとうしゃがていねいにおつたえした。','L’addetto lo ha comunicato accogliendo un dirigente.','The host communicated it while welcoming an executive.','Addetto e dirigente','Gerarchico','Ingresso sede','employee,executive'),
 ('superior','apology','不手際についておわびした後、担当者がご説明した。','ふてぎわについておわびしたあと、たんとうしゃがごせつめいした。','Dopo essersi scusato per un errore, il referente ha fornito una spiegazione.','After apologizing for a mistake, the employee provided an explanation.','Dipendente e responsabile','Gerarchico','Ufficio','employee,manager'),
 ('superior','complaint','重要なお客様からのご指摘を受けて担当者がご報告した。','じゅうようなおきゃくさまからのごしてきをうけてたんとうしゃがごほうこくした。','Il referente ha riferito dopo un reclamo di un cliente importante.','An employee reported after feedback from a key customer.','Dipendente e dirigente','Gerarchico','Sala clienti','employee,manager'),
 ('superior','extension','締め切りの延長をお願いする際に事情をご説明した。','しめきりのえんちょうをおねがいするさいにじじょうをごせつめいした。','Il dipendente ha illustrato i motivi chiedendo una proroga.','The employee explained the circumstances when requesting an extension.','Dipendente e responsabile','Gerarchico','Ufficio','employee,manager'),
 ('superior','director-instructions','部長のご指示を伺った後で担当者がご報告した。','ぶちょうのごしじをうかがったあとでたんとうしゃがごほうこくした。','Dopo aver ricevuto le istruzioni del direttore, il referente ha riferito.','The employee reported after hearing the director’s instructions.','Dipendente e direttore','Gerarchico','Direzione','employee,director'),
 ('superior','training-thanks','研修のお礼を申し上げる席で担当者が丁寧に話した。','けんしゅうのおれいをもうしあげるせきでたんとうしゃがていねいにはなした。','Il dipendente ha parlato con cortesia ringraziando per la formazione.','The employee spoke politely while thanking a manager for training.','Dipendente e superiore','Gerarchico','Ufficio','employee,manager'),
 ('superior','absence','欠勤のご連絡を差し上げる際に事情をお伝えした。','けっきんのごれんらくをさしあげるさいにじじょうをおつたえした。','Il dipendente ha spiegato le circostanze comunicando l’assenza.','The employee explained the circumstances while notifying an absence.','Dipendente e responsabile','Gerarchico','Telefono','employee,manager'),
 ('superior','executive-meeting','経営会議でご質問を受けた担当者が回答した。','けいえいかいぎでごしつもんをうけたたんとうしゃがかいとうした。','Il referente ha risposto a una domanda durante la riunione direzionale.','The staff member answered a question during an executive meeting.','Dipendente e direzione','Gerarchico','Sala consiglio','employee,executives'),
]
titles=[
 'Madre e figlio al supermercato','Amici dopo il ramen','Fratelli che perdono il treno','Coinquilini in cucina','Escursione tra amici','Compiti e scadenze in famiglia','Dopo l’allenamento','Ombrello smarrito','Trasloco fra amici','Festa a sorpresa',
 'Riunione del mattino','Requisiti di progetto','Prenotazione sala','Revisione report','Passaggio di consegne','Demo software','Consegna fornitore','Pranzo con una nuova collega','Riprogrammazione call','Retrospettiva',
 'Aggiornamento al responsabile','Approvazione del budget','Accoglienza dirigente','Scuse per un errore','Reclamo importante','Richiesta di proroga','Istruzioni del direttore','Ringraziamento formazione','Comunicazione di assenza','Riunione direzionale'
]
scenarios=[]
for i,(reg,slug,jp,kana,it,en,roles,relation,place,speakers) in enumerate(contexts):
 scenarios.append({'id':f'{reg}-{i%10+1:02d}','register':reg,'title':titles[i], 'description':it,'descriptionEn':en,'japaneseContext':jp,'kanaContext':kana,'location':place,'participants':roles.split(' e '),'roles':speakers.split(','),'relationship':relation,'communicativeSituation':titles[i]})

# Variant frames are situational but keep the vetted legacy utterance intact.
# Automatic framing is NOT equivalent to linguistic register rewriting.
# Framing is explicit so reviewer can spot any semantic mismatch.
frames={
'informal':[
 ('{ctx}「{quote}」','{reading}「{kana}」','{ctx} «{quote}»','{ctx} “{quote}”'),
],
'colleague':[
 ('{ctx}発言の内容は「{quote}」だった。','{reading}はつげんのないようは「{kana}」だった。','{ctx} La frase pronunciata è stata: «{quote}»','{ctx} The statement was: “{quote}”')
],
'superior':[
 ('{ctx}報告の一部は「{quote}」という内容だった。','{reading}ほうこくのいちぶは「{kana}」というないようだった。','{ctx} Una parte della comunicazione era: «{quote}»','{ctx} Part of the report said: “{quote}”')
]}

for c in d['cards']:
 old=copy.deepcopy(c['examples'])
 c['legacyExamples']=old
 out=[]
 for idx,scenario in enumerate(scenarios):
  orig=old[idx%len(old)]
  fmt=frames[scenario['register']][0]
  jp=fmt[0].format(ctx=scenario['japaneseContext'],quote=orig['jp'])
  kana=fmt[1].format(reading=scenario['kanaContext'],kana=orig['kana'])
  it=fmt[2].format(ctx=scenario['description'],quote=orig['it'])
  en=fmt[3].format(ctx=scenario['descriptionEn'],quote=orig['en'])
  matched=next((f['label'] for f in c.get('forms',[]) if f['jp'] and f['jp'] in orig['jp']), None)
  matched=matched or ('辞書形' if c['jp'] in orig['jp'] else '未判定')
  out.append({'id':f"{c['id']}:context:{scenario['id']}",'cardId':str(c['id']),'scenarioId':scenario['id'],'register':scenario['register'],'jp':jp,'kana':kana,'it':it,'en':en,'grammarForm': matched, 'speaker': 'narrator','note':'Cornice contestuale generata automaticamente; il testo citato proviene dagli esempi originali.', 'reviewStatus':'draft-contextual-framing','originExampleId':orig['id']})
 c['examples']=out

G=[([1,2,3,9,11,14,16,17,29,38],'Una gita ben organizzata','Escursione e prenotazioni'),([4,5,6,7,27,28,35,37,69,70],'Il grande trasloco','Aiuto reciproco'),([8,10,12,15,26,34,44,51,52,54],'Il treno in ritardo','Problema e verifica'),([13,18,19,20,21,22,23,24,25,46],'Un viaggio culturale','Viaggio e scoperta'),([30,31,32,33,36,41,42,43,45,55],'La visita internazionale','Accoglienza e scambio'),([39,40,47,48,49,50,53,56,57,58],'Il giardino del quartiere','Comunità e ambiente'),([59,60,61,62,63,64,65,66,67,68],'La presentazione finale','Studio e imprevisti'),([71,72,73,74,75],'La notte del temporale','Un finale sorprendente')]
assert sorted(k for ids,*_ in G for k in ids)==list(range(1,76))

# Narrative segments are separately authored below in story_segments.json.
sp=root/'tools/story_segments.json'
if not sp.exists():
 raise SystemExit('Missing tools/story_segments.json')
story_segments=json.loads(sp.read_text(encoding='utf-8'))
assert len(story_segments)==8
story_groups=[];stories=[]
for i,(ids,title,desc) in enumerate(G,1):
 gid=f'n4-story-group-{i:02d}'; sid=f'n4-story-{i:02d}'
 for c in d['cards']:
  if c['id'] in ids:
   c['storyGroupId']=gid
   c['storyIds']=[sid]
 story_groups.append({'id':gid,'title':title,'description':desc,'cardIds':[str(x) for x in ids],'storyId':sid})
 segments=story_segments[str(i)]
 assert segments
 used=set(str(x) for seg in segments for x in seg['cardIds'])
 assert used==set(str(x) for x in ids),(i,used,set(map(str,ids)))
 for j,s in enumerate(segments,1):
  s['id']=f'{sid}:line:{j:02d}'
  s['cardIds']=[str(k) for k in s['cardIds']]
 stories.append({'id':sid,'title':title,'description':desc,'groupId':gid,'scenarioId':scenarios[(i-1)%10]['id'],'characters':['Narratore','Interlocutore'],'cardIds':[str(x) for x in ids],'segments':segments})

d['revision']=4
d['description']='Deck N4 ampliato con scenari e narrazioni; esempi contestualizzati automatici NON verificati linguisticamente.'
d['scenarios']=scenarios
d['storyGroups']=story_groups
d['stories']=stories
d['contentReview']={'status':'draft','method':'scenario-framed-original-examples','linguisticReview':'not-performed','warning':'Gli esempi derivano da cornici di scenario applicate alle frasi originali: la congruenza semantica e il registro delle citazioni richiedono revisione umana.'}
source.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'decks/scenarios.json').write_text(json.dumps({'schemaVersion':1,'scenarios':scenarios},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('generated',len(d['cards']),'cards',sum(len(c['examples']) for c in d['cards']),'context examples',len(stories),'stories',len(scenarios),'scenarios')
