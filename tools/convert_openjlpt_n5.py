import json,re,hashlib,collections,math,pathlib,datetime
ROOT=pathlib.Path('/mnt/data/n5-build');SITE=ROOT/'site';OUT=SITE/'decks'/'jlpt-n5-openjlpt.json'
src=json.load(open('/mnt/data/n5.json',encoding='utf-8'))
source_hash=hashlib.sha256(pathlib.Path('/mnt/data/n5.json').read_bytes()).hexdigest()
pos_map={'v':'verb','adj-i':'i','adj-ix':'i','adj-na':'na','n':'noun','pn':'pronoun','adv':'adverb','adv-to':'adverb','num':'numeral','int':'interjection','exp':'expression','conj':'conjunction','prt':'particle','ctr':'counter','pref':'prefix','suf':'suffix','adj-pn':'determiner','adj-f':'determiner','aux-adj':'auxiliary','aux-v':'auxiliary'}
def pos(c):
 p=c['pos']
 if any(x.startswith('v5') or x in ('v1','vs','vs-i','vk') for x in p):return 'verb'
 for k in ['adj-i','adj-ix','adj-na','n','pn','adv','adv-to','num','int','exp','conj','prt','ctr','pref','suf','adj-pn','adj-f','aux-adj','aux-v']:
  if k in p:return pos_map[k]
 return 'other'
def hira(s):return ''.join(chr(ord(c)-96) if 'ァ'<=c<='ヶ' else c for c in s)
def kana_from_furi(text):
 s=re.sub(r'\{([^{}|]+)\|([^{}|]+)\}',lambda m:m.group(2),text)
 return s if not re.search(r'[\u3400-\u9fff\uF900-\uFAFF]',s) else None
G={'う':('い','わ','って','った'),'く':('き','か','いて','いた'),'ぐ':('ぎ','が','いで','いだ'),'す':('し','さ','して','した'),'つ':('ち','た','って','った'),'ぬ':('に','な','んで','んだ'),'ぶ':('び','ば','んで','んだ'),'む':('み','ま','んで','んだ'),'る':('り','ら','って','った')}
def forms(c):
 w=c['word'];p=c['pos'];reading=c['reading'];out=[]
 def add(label,x):out.append({'label':label,'jp':x})
 if not (reading and w):return out
 if 'adj-i' in p or 'adj-ix' in p:
  if w.endswith('い') and w!='いい':stem=w[:-1];add('過去形',stem+'かった');add('ない形',stem+'くない');add('て形',stem+'くて')
  elif w=='いい':add('過去形','よかった');add('ない形','よくない');add('て形','よくて')
 elif 'adj-na' in p:
  add('丁寧形',w+'です');add('過去形',w+'だった');add('否定形',w+'ではない')
 elif 'v1' in p and w.endswith('る'):
  stem=w[:-1];add('ます形',stem+'ます');add('て形',stem+'て');add('ない形',stem+'ない');add('た形',stem+'た')
 elif 'vs' in p or 'vs-i' in p:
  if w.endswith('する'):
   stem=w[:-2];add('ます形',stem+'します');add('て形',stem+'して');add('ない形',stem+'しない');add('た形',stem+'した')
 elif 'vk' in p:
  if w.endswith('来る'):
   base=w[:-2];add('ます形',base+'来ます');add('て形',base+'来て');add('ない形',base+'来ない');add('た形',base+'来た')
 elif any(x.startswith('v5') for x in p):
  if w.endswith('く') and 'v5k-s' in p:
   stem=w[:-1];add('ます形',stem+'きます');add('て形',stem+'って');add('ない形',stem+'かない');add('た形',stem+'った')
  elif w=='ある' or 'v5r-i' in p:
   add('ます形','あります');add('て形','あって');add('ない形','ない');add('た形','あった')
  elif w[-1] in G:
   stem=w[:-1];a,b,t,ta=G[w[-1]];add('ます形',stem+a+'ます');add('て形',stem+t);add('ない形',stem+b+'ない');add('た形',stem+ta)
 return out
cards=[];ids=set();rawEx=0;usableEx=0;missingReading=0;mapping=[]
for i,c in enumerate(src):
 cid='openjlpt-n5:'+c['id'];assert cid not in ids;ids.add(cid)
 p=pos(c);exs=[];original=[]
 for j,e in enumerate(c.get('examples',[])):
  rawEx+=1;eid=cid+':src-'+str(e.get('tatoeba_id') or (j+1))
  original.append({'id':eid,'ja':e.get('ja',''),'en':e.get('en',''),'furigana':e.get('furigana'),'tatoeba_id':e.get('tatoeba_id')})
  reading=kana_from_furi(e.get('furigana') or e.get('ja',''))
  if not reading:
   missingReading+=1;continue
  if not e.get('en') or not e.get('ja'):continue
  exs.append({'id':eid,'cardId':cid,'jp':e['ja'],'kana':reading,'en':e['en'],'it':'[EN - traduzione italiana da completare] '+e['en'],'grammarForm':'non annotata','reviewStatus':'source-example-unreviewed','translationStatus':{'it':'english-fallback','en':'source-original'},'provenance':{'dataset':'OpenJLPT','tatoebaId':e.get('tatoeba_id')}});usableEx+=1
 card={'id':cid,'pos':p,'jp':c['word'],'kana':c['reading'],'meaning':{'en':'; '.join(c.get('meanings',[])),'it':'[EN - da tradurre] '+'; '.join(c.get('meanings',[]))},'forms':forms(c),'examples':exs,'jlptLevel':c['level'],'jlptLevelSource':'OpenJLPT','jlptLevelConfidence':'source-asserted','originalPOS':c['pos'],'jmdictId':c.get('jmdict_id'),'romaji':c.get('romaji'),'otherForms':c.get('other_forms',[]),'sourceExamples':original,'contentReview':{'status':'incomplete','reason':'30 original examples per word, Italian translations and reviewed conjugations not complete'}}
 cards.append(card);mapping.append({'sourceId':c['id'],'cardId':cid,'sourceIndex':i,'jp':c['word']})
# group into coherent coarse semantic categories where possible; avoid fabricated story objects
categories={'trasporti':{'駅','電車','車','自転車','バス','空港','地下鉄','切符','タクシー','道','飛行機','船'},'famiglia':{'父','母','兄','姉','妹','弟','家族','お母さん','お父さん','子供','お祖父さん'},'cibo':{'食べる','飲む','朝ごはん','ご飯','お菓子','水','お茶','魚','肉','野菜','果物','料理','レストラン','パン','卵'},'scuola':{'学校','大学','教室','先生','学生','本','鉛筆','書く','読む','勉強','教える','宿題'},'tempo':{'今日','明日','昨日','朝','夜','昼','時間','時計','月','火曜日','水曜日','土曜日','日曜日'}}
def theme(c):
 for key, words in categories.items():
  if c['jp'] in words:return key
 if c['pos']=='verb':return 'azioni'
 if c['pos'] in ('i','na'):return 'descrizioni'
 if c['pos'] in ('pronoun','determiner','adverb','conjunction','particle','auxiliary','interjection','expression'):return 'conversazione'
 if c['pos'] in ('numeral','counter'):return 'numeri'
 return 'vita-quotidiana'
buckets=collections.defaultdict(list)
for c in cards:buckets[theme(c)].append(c['id'])
clusters=[];idx=0
for key, items in buckets.items():
 for start in range(0,len(items),10):
  idx+=1;subset=items[start:start+10]
  clusters.append({'clusterId':f'n5-plan-{idx:03d}','title':key.replace('-',' ').title()+f' {start//10+1}','theme':key,'cardIds':subset,'rationale':'Raggruppamento lessicale preliminare, da riprogettare per una storia coerente','storyStatus':'planned','narrativeArc':'Da progettare in fase di generazione storie'})
deck={'schemaVersion':1,'deckId':'openjlpt-n5','revision':1,'title':'JLPT N5 — OpenJLPT (import lessicale)','description':'674 vocaboli con significati EN, livello JLPT e esempi fonte quando pronunciabili. Traduzioni IT e 30 esempi per card NON completati.','level':'N5','languages':['ja','en','it'],'license':'OpenJLPT CC BY-SA 4.0; esempi Tatoeba: verificare licenza e attribuzione dei singoli testi prima della ridistribuzione','source':'OpenJLPT, user-provided n5.json','sourceSha256':source_hash,'cards':cards,'stories':[],'scenarios':[],'contentReview':{'status':'incomplete','linguisticReview':'not-performed','translationIt':'english-fallback-marked','sourceExamplesPreserved':True,'originalContextExamplesRequired':20220,'originalContextExamplesProduced':0,'storyStatus':'planned'}}
OUT.write_text(json.dumps(deck,ensure_ascii=False,indent=2),encoding='utf8');(SITE/'decks'/'jlpt-n5-clusters.json').write_text(json.dumps(clusters,ensure_ascii=False,indent=2),encoding='utf8');(SITE/'decks'/'jlpt-n5-id-mapping.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2),encoding='utf8')
report={'sourceRecords':len(src),'convertedCards':len(cards),'sourceSHA256':source_hash,'sourceExamples':rawEx,'playableExamplesWithCompleteKana':usableEx,'unplayableDueToIncompleteReading':missingReading,'sourceEntriesWithoutExamples':sum(not c.get('examples') for c in src),'contextExamplesRequired':len(cards)*30,'contextExamplesCreated':0,'posCounts':dict(collections.Counter(c['pos'] for c in cards)),'clusters':len(clusters),'licenseStatus':'example provenance verification required','nativeReview':False}
(SITE/'decks'/'jlpt-n5-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=False,indent=2))
