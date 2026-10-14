#!/usr/bin/env python3
"""Deterministic, newly composed contextual examples with stable example identifiers.
The rule-based drafts replace quoted legacy content. They are NOT native-reviewed.
The former 750 legacyExamples are preserved unchanged for compatibility.
No external paid service / no network. Source ideas and grammar are curated, while
actual output is programmatically assembled; report linguistic limitations accurately.
"""
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'decks/n4-core.json'
D=json.loads(DATA.read_text(encoding='utf-8'))
# (Japanese, kana, Italian including article, English including article)
raw='''
practice|練習|れんしゅう|la pratica|practice
time|時間|じかん|il tempo a disposizione|the available time
typhoon|台風|たいふう|il tifone|the typhoon
thunder|雷|かみなり|il temporale|the thunderstorm
earthquake|地震|じしん|il terremoto|the earthquake
fire|火事|かじ|l'incendio|the fire
cliff|崖|がけ|il precipizio|the cliff
disease|病気|びょうき|la malattia|the illness
beast|野生動物|やせいどうぶつ|l'animale selvatico|the wild animal
storm|嵐|あらし|la tempesta|the storm
flood|洪水|こうずい|l'alluvione|the flood
accident|事故|じこ|l'incidente|the accident
life|生活|せいかつ|la vita quotidiana|daily life
breathing|呼吸|こきゅう|il respiro|breathing
working_conditions|労働環境|ろうどうかんきょう|le condizioni di lavoro|the working conditions
management|経営|けいえい|la gestione|management
climb|登山|とざん|la scalata|mountain climbing
stress|ストレス|すとれす|lo stress|stress
hotel|ホテル|ほてる|l'hotel|the hotel
restaurant|レストラン|れすとらん|il ristorante|the restaurant
flight|飛行機|ひこうき|l'aereo|the flight
well|井戸|いど|il pozzo|the well
valley|谷|たに|la valle|the valley
cave|洞窟|どうくつ|la grotta|the cave
emergency|緊急事態|きんきゅうじたい|l'emergenza|the emergency
power_cut|停電|ていでん|il blackout|the power outage
coupon|割引券|わりびきけん|il buono sconto|the discount coupon
receipt|レシート|れしーと|lo scontrino|the receipt
ticket|切符|きっぷ|il biglietto|the ticket
bag|かばん|かばん|lo zaino|the bag
food|食材|しょくざい|l'ingrediente|the ingredient
price|値段|ねだん|il prezzo|the price
menu|メニュー|めにゅー|il menu|the menu
seat|席|せき|il posto|the seat
umbrella|傘|かさ|l'ombrello|the umbrella
photo|写真|しゃしん|la fotografia|the photo
report|報告書|ほうこくしょ|il rapporto|the report
document|資料|しりょう|il documento|the document
email|メール|めーる|l'email|the email
data|データ|でーた|il dato|the data point
proposal|提案|ていあん|la proposta|the proposal
meeting|会議|かいぎ|la riunione|the meeting
budget|予算|よさん|il bilancio|the budget
schedule|予定表|よていひょう|il calendario|the timetable
password|パスワード|ぱすわーど|la password|the password
invitation|招待状|しょうたいじょう|l'invito|the invitation
stamp|切手|きって|il francobollo|the stamp
map|地図|ちず|la mappa|the map
key|鍵|かぎ|la chiave|the key
instruction|指示|しじ|l'istruzione|the instruction
design|設計図|せっけいず|il disegno tecnico|the blueprint
order|注文|ちゅうもん|l'ordine|the order
problem|問題|もんだい|il problema|the problem
software|ソフト|そふと|il programma|the software
file|ファイル|ふぁいる|il file|the file
name|名前|なまえ|il nome|the name
comment|コメント|こめんと|il commento|the comment
record|記録|きろく|il registro|the record
address|住所|じゅうしょ|l'indirizzo|the address
product|商品|しょうひん|il prodotto|the product
contract|契約書|けいやくしょ|il contratto|the contract
plan|計画|けいかく|il piano|the plan
answer|答え|こたえ|la risposta|the answer
result|結果|けっか|il risultato|the result
number|番号|ばんごう|il numero|the number
customer|お客さん|おきゃくさん|il cliente|the customer
colleague|同僚|どうりょう|il collega|the colleague
teacher|先生|せんせい|l'insegnante|the teacher
manager|部長|ぶちょう|il responsabile|the manager
guest|お客様|おきゃくさま|l'ospite|the guest
supplier|業者|ぎょうしゃ|il fornitore|the supplier
staff|担当者|たんとうしゃ|il referente|the staff member
service|サービス|さーびす|il servizio|the service
method|方法|ほうほう|il metodo|the method
situation|状況|じょうきょう|la situazione|the situation
reason|理由|りゆう|il motivo|the reason
child|子供|こども|il bambino|the child
flower|花|はな|il fiore|the flower
seed|種|たね|il seme|the seed
vegetable|野菜|やさい|la verdura|the vegetable
tree|木|き|l'albero|the tree
house|家|いえ|la casa|the house
garden|庭|にわ|il giardino|the garden
fence|柵|さく|il recinto|the fence
road|道路|どうろ|la strada|the road
building|建物|たてもの|l'edificio|the building
school|学校|がっこう|la scuola|the school
hospital|病院|びょういん|l'ospedale|the hospital
car|車|くるま|l'automobile|the car
train|電車|でんしゃ|il treno|the train
bus|バス|ばす|l'autobus|the bus
notebook|ノート|のーと|il quaderno|the notebook
diary|日記|にっき|il diario|the diary
letter|手紙|てがみ|la lettera|the letter
book|本|ほん|il libro|the book
coin|硬貨|こうか|la moneta|the coin
newspaper|新聞|しんぶん|il giornale|the newspaper
shirt|シャツ|しゃつ|la camicia|the shirt
desk|机|つくえ|la scrivania|the desk
chair|椅子|いす|la sedia|the chair
window|窓|まど|la finestra|the window
door|ドア|どあ|la porta|the door
table|テーブル|てーぶる|il tavolo|the table
gym|体育館|たいいくかん|la palestra|the gym
lake|湖|みずうみ|il lago|the lake
river|川|かわ|il fiume|the river
forest|森|もり|il bosco|the forest
mountain|山|やま|il monte|the mountain
sea|海|うみ|il mare|the sea
sky|空|そら|il cielo|the sky
rain|雨|あめ|la pioggia|the rain
night|夜|よる|la notte|the night
light|電灯|でんとう|la lampada|the lamp
bridge|橋|はし|il ponte|the bridge
station|駅|えき|la stazione|the station
room|部屋|へや|la stanza|the room
park|公園|こうえん|il parco|the park
city|町|まち|il quartiere|the town
museum|博物館|はくぶつかん|il museo|the museum
language|日本語|にほんご|il giapponese|Japanese
lesson|授業|じゅぎょう|la lezione|the lesson
exercise|練習|れんしゅう|l'esercizio|the exercise
project|事業|じぎょう|il progetto|the project
trip|旅行|りょこう|il viaggio|the trip
exam|試験|しけん|l'esame|the exam
festival|祭り|まつり|la festa|the festival
promise|約束|やくそく|la promessa|the promise
work|仕事|しごと|il lavoro|the work
family|家族|かぞく|la famiglia|the family
friend|友達|ともだち|l'amico|the friend
student|学生|がくせい|lo studente|the student
presentation|発表|はっぴょう|la presentazione|the presentation
traffic|交通|こうつう|il traffico|the traffic
rule|規則|きそく|il regolamento|the rule
music|音楽|おんがく|la musica|the music
weather|天気|てんき|il tempo|the weather
memory|思い出|おもいで|il ricordo|the memory
word|単語|たんご|la parola|the word
mistake|間違い|まちがい|l'errore|the mistake
machine|機械|きかい|il macchinario|the machine
clock|時計|とけい|l'orologio|the clock
computer|パソコン|ぱそこん|il computer|the computer
phone|電話|でんわ|il telefono|the phone
question|質問|しつもん|la domanda|the question
customer_review|評価|ひょうか|il giudizio|the assessment
party|パーティー|ぱーてぃー|la festa|the party
chairman|社長|しゃちょう|il presidente|the president
neighbor|近所の人|きんじょのひと|il vicino|the neighbor
parent|親|おや|il genitore|the parent
son|息子|むすこ|il figlio|the son
museum_guide|案内|あんない|la guida|the guidance
flowerbed|花壇|かだん|l'aiuola|the flowerbed
paper|紙|かみ|il foglio|the sheet
parcel|荷物|にもつ|il pacco|the parcel
payment|料金|りょうきん|il pagamento|the fee
room_key|部屋の鍵|へやのかぎ|la chiave della stanza|the room key
bus_stop|バス停|ばすてい|la fermata|the bus stop
appointment|面談|めんだん|il colloquio|the appointment
'''
TERMS={}
for line in raw.strip().splitlines():
 k,*v=line.split('|');assert len(v)==4,(k,v);TERMS[k]=v
# Curated collocations, one per scenario position. No quotes or recycling of original examples.
THEMES={
 1:'coupon stamp photo receipt record document comment seed idea'.replace('idea','plan')+' email',
 2:'menu seat ticket photo product schedule design method plan answer',
 3:'schedule menu trip plan appointment budget invitation order method name',
 4:'lesson diary exercise project meeting work music trip presentation practice',
 5:'parent friend child colleague teacher guest staff neighbor student supplier',
 6:'clock computer chair door mistake file machine schedule fence software',
 7:'bag parcel table desk chair document product flowerbed parcel'.replace('flowerbed parcel','garden machine')+' book',
 8:'train bus meeting lesson exam appointment presentation trip schedule party',
 9:'seat table ticket room appointment meeting bus flight restaurant hotel',
 10:'schedule password plan design file rule room order program'.replace('program','software')+' method',
 11:'trip work family meeting school festival project party lesson appointment',
 12:'mistake traffic rain meeting problem order rule plan exam result',
 13:'trip project festival exam work lesson exercise presentation customer_review meeting',
 14:'friend family colleague manager guest student parent teacher staff customer',
 15:'rain traffic emergency meeting trip appointment exam power_cut order weather',
 16:'ticket document umbrella key password schedule money'.replace('money','payment')+' map food book',
 17:'map phone software method train bus service machine computer key',
 18:'road station room park train hospital gym building house bridge',
 19:'service customer staff colleague teacher parent guest report comment instruction',
 20:'child friend student colleague parent manager staff guest neighbor family',
 21:'lake river sea well valley cave forest mountain garden snow'.replace('snow','lake'),
 22:'design map report record comment document question method instruction rule',
 23:'teacher parent friend neighbor child colleague manager student staff guest',
 24:'answer method rule result number address schedule price explanation'.replace('explanation','document')+' name',
 25:'flower seed stamp coin map house book tree photo product',
 26:'price schedule traffic address result document cause'.replace('cause','reason')+' map rule weather',
 27:'parcel letter document report product invitation key food book photo',
 28:'room desk table kitchen'.replace('kitchen','house')+' chair garden garage'.replace('garage','gym')+' file notebook bag',
 29:'price product ticket method design service schedule result plan data',
 30:'schedule reason result plan answer name address problem instruction idea'.replace('idea','proposal'),
 31:'guest manager friend colleague customer child teacher parent staff neighbor',
 32:'invitation order proposal appointment meeting trip party contract plan ticket',
 33:'friend guest colleague teacher neighbor student customer parent staff manager',
 34:'password number address name answer schedule order price ticket question',
 35:'key umbrella ticket photo book stamp record parcel flower notebook',
 36:'parcel letter document ticket receipt key payment invitation product file',
 37:'receipt bag paper shirt notebook newspaper parcel document product chair',
 38:'ticket payment fee'.replace('fee','price')+' meal'.replace('meal','menu')+' order product room book contract service',
 39:'flower vegetable tree seed child garden student flowerbed dog'.replace('dog','family')+' forest',
 40:'house school bridge building fence hospital room museum station gym',
 41:'rule method plan result software problem contract lesson schedule design',
 42:'guest manager colleague friend customer teacher neighbor student staff parent',
 43:'email report letter contract instruction book menu map document comment',
 44:'answer number address result schedule data contract price report information'.replace('information','file'),
 45:'word name address password rule lesson poem'.replace('poem','song').replace('song','music')+' presentation number question',
 46:'city school family trip festival work museum music garden language',
 47:'morning'.replace('morning','work')+' family school dinner'.replace('dinner','food')+' study'.replace('study','lesson')+' work habit'.replace('habit','exercise')+' music trip language',
 48:'meeting service guest manager trip museum photo product staff presentation',
 49:'rain traffic rule music project work family exam result weather',
 50:'family friend colleague customer supplier student manager parent neighbor staff',
 51:'lesson work trip food exercise payment order language plan problem',
 52:'weather traffic train service project order contract school result product',
 53:'school work park garden room city family hospital station gym',
 54:'contract order project meeting appointment budget plan work payment exam',
 55:'friend colleague teacher manager customer student parent staff guest neighbor',
 56:'exam lesson method design work explanation'.replace('explanation','report')+' exercise software trip rule',
 57:'report plan contract method route'.replace('route','map')+' rule result project software problem',
 58:'room park lake forest garden house museum school station night',
 59:'teacher student colleague child manager staff parent neighbor guest friend',
 60:'child friend family customer staff teacher manager parent guest colleague',
 61:'family friend promise project memory lesson work environment'.replace('environment','garden')+' book trip',
 62:'budget time food service document schedule explanation'.replace('explanation','report')+' payment seat lesson',
 63:'trip menu product festival party lesson guest meeting memory book',
 64:'schedule budget project trip work exam payment plan method contract',
 65:'result mistake loss'.replace('loss','problem')+' weather meeting exam order trip service news'.replace('news','report'),
 66:'teacher manager rule training'.replace('training','exercise')+' exam work budget schedule parent condition'.replace('condition','contract'),
 67:'mistake question photo song'.replace('song','music')+' presentation party letter remark'.replace('remark','comment')+' name meeting',
 68:'child student colleague manager friend staff driver'.replace('driver','parent')+' teacher guest neighbor',
 69:'parcel bag desk book machine chair table door computer suitcase'.replace('suitcase','product'),
 70:'bag shirt notebook paper parcel table chair book computer product',
 71:'life breathing work climb stress management working_conditions disease exercise situation',
 72:'sea lake mountain garden forest sky flower museum town'.replace('town','city')+' night',
 73:'typhoon thunder earthquake cliff fire disease beast storm flood accident',
 74:'music child traffic train party machine room festival work noise'.replace('noise','bus'),
 75:'service lesson result presentation garden trip friend guest event'.replace('event','festival')+' museum'
}
# `THEMES` entries are deliberately explicit and topic-appropriate rather than
# deriving content from legacy example texts. A few duplicate collocations are fine
# only when the proposition changes, but validation reports repetition.
# Missing terms and incorrect theme lengths must fail loudly.
for c in D['cards']:
 k=c['id']; names=THEMES.get(k,'').split()
 if len(names)!=10:print('THEME WRONG LENGTH',k,len(names),names)
 for n in names:
  if n not in TERMS:print('MISSING TERM',k,n)

VERB_TRANSLATIONS={
1:('raccogliere','raccolto','collect','collected'),2:('scegliere','scelto','choose','chose'),3:('decidere','deciso','decide','decided'),4:('continuare','continuato','continue','continued'),5:('aiutare','aiutato','help','helped'),6:('riparare','riparato','fix','fixed'),7:('trasportare','trasportato','carry','carried'),8:('fare in tempo per','fatto in tempo per','make it in time for','made it in time for'),9:('prenotare','prenotato','book','booked'),10:('cambiare','cambiato','change','changed'),
26:('controllare','controllato','check','checked'),27:('consegnare','consegnato','deliver','delivered'),28:('riordinare','riordinato','tidy up','tidied up'),29:('confrontare','confrontato','compare','compared'),30:('comunicare','comunicato','communicate','communicated'),31:('accogliere','accolto','welcome','welcomed'),32:('rifiutare','rifiutato','decline','declined'),33:('invitare','invitato','invite','invited'),34:('sbagliare','sbagliato','get wrong','got wrong'),35:('trovare','trovato','find','found'),36:('ricevere','ricevuto','receive','received'),37:('buttare','buttato','throw away','threw away'),38:('pagare','pagato','pay for','paid for'),39:('coltivare','coltivato','grow','grew'),40:('costruire','costruito','build','built'),41:('spiegare','spiegato','explain','explained'),42:('invitare','invitato','invite','invited'),43:('tradurre','tradotto','translate','translated'),44:('verificare','verificato','verify','verified'),45:('memorizzare','memorizzato','memorize','memorized')
}
ICHIDAN={1,3,4,10,26,27,28,29,30,31,34,35,37,39,40,44,45}
GODAN_I={'う':'い','く':'き','ぐ':'ぎ','す':'し','つ':'ち','ぬ':'に','ぶ':'び','む':'み','る':'り'}
GODAN_A={'う':'わ','く':'か','ぐ':'が','す':'さ','つ':'た','ぬ':'な','ぶ':'ば','む':'ま','る':'ら'}
GODAN_E={'う':'え','く':'け','ぐ':'げ','す':'せ','つ':'て','ぬ':'ね','ぶ':'べ','む':'め','る':'れ'}
TE={'う':('って','った'),'つ':('って','った'),'る':('って','った'),'む':('んで','んだ'),'ぶ':('んで','んだ'),'ぬ':('んで','んだ'),'く':('いて','いた'),'ぐ':('いで','いだ'),'す':('して','した')}

def verb_inflections(word):
 id=word['id']; jp=word['jp']; kana=word['kana']; forms={}
 for k,v in [('dictionary',''),('masu',''),('mashita',''),('nai',''),('te',''),('past',''),('potential','')]:forms[k]=None
 def mk(surface,kana_s):return (surface,kana_s)
 forms['dictionary']=mk(jp,kana)
 if jp.endswith('する'):
  a=jp[:-2];b=kana[:-2]
  forms.update(masu=mk(a+'します',b+'します'),mashita=mk(a+'しました',b+'しました'),nai=mk(a+'しない',b+'しない'),te=mk(a+'して',b+'して'),past=mk(a+'した',b+'した'),potential=mk(a+'できる',b+'できる'))
 elif id in ICHIDAN:
  a=jp[:-1];b=kana[:-1]
  forms.update(masu=mk(a+'ます',b+'ます'),mashita=mk(a+'ました',b+'ました'),nai=mk(a+'ない',b+'ない'),te=mk(a+'て',b+'て'),past=mk(a+'た',b+'た'),potential=mk(a+'られる',b+'られる'))
 else:
  end=kana[-1];assert end in GODAN_I,(id,kana)
  a=jp[:-1];b=kana[:-1];te,past=TE[end]
  forms.update(masu=mk(a+GODAN_I[end]+'ます',b+GODAN_I[end]+'ます'),mashita=mk(a+GODAN_I[end]+'ました',b+GODAN_I[end]+'ました'),nai=mk(a+GODAN_A[end]+'ない',b+GODAN_A[end]+'ない'),te=mk(a+te,b+te),past=mk(a+past,b+past),potential=mk(a+GODAN_E[end]+'る',b+GODAN_E[end]+'る'))
 return forms

NOUN_TRANSLATIONS={11:('il programma','the plan'),12:('il motivo','the reason'),13:("l'esperienza",'the experience'),14:('la promessa','the promise'),15:('il caso','the case'),46:('la cultura','the culture'),47:("l'abitudine",'the habit'),48:("l'impressione",'the impression'),49:("l'effetto",'the effect'),50:('il rapporto','the relationship'),51:('il metodo','the method'),52:("l'informazione",'the information'),53:("l'ambiente",'the environment'),54:('la condizione','the condition'),55:("l'opinione",'the opinion')}
ADJ_TRANSLATIONS={
16:('necessario','necessary'),17:('comodo','convenient'),18:('sicuro','safe'),19:('accurato','careful'),20:('libero','free'),21:('profondo','deep'),22:('dettagliato','detailed'),23:('gentile','kind'),24:('corretto','correct'),25:('insolito','unusual'),56:('semplice','simple'),57:('complicato','complicated'),58:('tranquillo','quiet'),59:('appassionato','enthusiastic'),60:('preoccupante','worrying'),61:('importante','important'),62:('sufficiente','sufficient'),63:('speciale','special'),64:('impossibile','unrealistic'),65:('deludente','disappointing'),66:('severo','strict'),67:('imbarazzante','embarrassing'),68:('assonnato','sleepy'),69:('pesante','heavy'),70:('leggero','light'),71:('faticoso','painful'),72:('bello','beautiful'),73:('terrificante','terrifying'),74:('rumoroso','noisy'),75:('splendido','wonderful')}

IT_PRESENT={1:'raccolgo',2:'scelgo',3:'decido',4:'continuo',5:'aiuto',6:'riparo',7:'trasporto',8:'faccio in tempo per',9:'prenoto',10:'cambio',26:'controllo',27:'consegno',28:'riordino',29:'confronto',30:'comunico',31:'accolgo',32:'rifiuto',33:'invito',34:'sbaglio',35:'trovo',36:'ricevo',37:'butto',38:'pago',39:'coltivo',40:'costruisco',41:'spiego',42:'invito',43:'traduco',44:'verifico',45:'memorizzo'}

def kana_pieces(*pieces):return ''.join(p[1] if isinstance(p,tuple) else p for p in pieces)

def verb_text(c,term,reg,i):
 f=verb_inflections(c);obj,reading,it_obj,en_obj=TERMS[term];part='に' if c['id']==8 else 'を';tr=VERB_TRANSLATIONS[c['id']];it_inf,it_past,en_inf,en_past=tr
 # Fix the English word order for the transitive phrase "get X wrong".
 def verb_en(tense):
  if c['id']==34:return ('get ' if tense=='present' else 'got ')+en_obj+' wrong'
  return (en_inf if tense=='present' else en_past)+' '+en_obj
 def v(name):return f[name][0]
 def k(name):return f[name][1]
 z=obj+part;zk=reading+part
 if reg=='informal':
  rows=[
   (f'昨日、{z}{v("past")}。',f'きのう、{zk}{k("past")}。',f'Ieri ho {it_past} {it_obj}.',f'Yesterday I {verb_en("past")}. '),
   (f'今日は{z}{v("nai")}。',f'きょうは{zk}{k("nai")}。',f'Oggi non {IT_PRESENT[c["id"]]} {it_obj}.',f'I am not going to {verb_en("present")} today.'.replace('..','.')),
   (f'時間があったら、{z}{v("dictionary")}。',f'じかんがあったら、{zk}{k("dictionary")}。',f'Se ho tempo, vorrei {it_inf} {it_obj}.',f'If I have time, I will {verb_en("present")}.'.replace('..','.')),
   (f'今朝、{z}{v("past")}んだ。',f'けさ、{zk}{k("past")}んだ。',f'Stamattina ho proprio {it_past} {it_obj}.',f'This morning, I really {verb_en("past")}.'.replace('..','.')),
   (f'{z}{v("te")}から出かけよう。',f'{zk}{k("te")}からでかけよう。',f'Usciamo dopo aver {it_past} {it_obj}.',f"Let's go out after we {verb_en('present')}."),
   (f'{z}{v("dictionary")}のは初めてだ。',f'{zk}{k("dictionary")}のははじめてだ。',f'È la prima volta che provo a {it_inf} {it_obj}.',f"It's my first time trying to {verb_en('present')}."),
   (f'{z}{v("te")}もいい？',f'{zk}{k("te")}もいい？',f'Posso {it_inf} {it_obj}?',f'May I {verb_en("present")}?'),
   (f'もう{z}{v("past")}？',f'もう{zk}{k("past")}？',f'Hai già {it_past} {it_obj}?',f'Did you already {verb_en("present")}?'),
   (f'{z}{v("te")}みたい。',f'{zk}{k("te")}みたい。',f'Vorrei provare a {it_inf} {it_obj}.',f'I want to try to {verb_en("present")}.'.replace('..','.')),
   (f'明日は{z}{v("nai")}よ。',f'あしたは{zk}{k("nai")}よ。',f'Domani non intendo {it_inf} {it_obj}.',f'Tomorrow I do not intend to {verb_en("present")}.'.replace('..','.')),
  ]; grammars=['過去形','ない形','辞書形・条件','過去形・口語','て形','辞書形','て形・許可','過去形・質問','て形・希望','ない形']
 elif reg=='colleague':
  rows=[
   (f'始業前に{z}{v("masu")}。',f'しぎょうまえに{zk}{k("masu")}。',f'Prima di iniziare il lavoro, intendo {it_inf} {it_obj}.',f'I will {verb_en("present")} before the workday starts.'),
   (f'午後までに{z}{v("te")}ください。',f'ごごまでに{zk}{k("te")}ください。',f'Per favore, cerca di {it_inf} {it_obj} entro il pomeriggio.',f'Please {verb_en("present")} by this afternoon.'),
   (f'先ほど{z}{v("mashita")}。',f'さきほど{zk}{k("mashita")}。',f'Ho appena {it_past} {it_obj}.',f'I just {verb_en("past")}.'.replace('..','.')),
   (f'{z}{v("dictionary")}予定です。',f'{zk}{k("dictionary")}よていです。',f'Abbiamo in programma di {it_inf} {it_obj}.',f'We plan to {verb_en("present")}.'.replace('..','.')),
   (f'{z}{v("dictionary")}必要があります。',f'{zk}{k("dictionary")}ひつようがあります。',f'È necessario {it_inf} {it_obj}.',f'It is necessary to {verb_en("present")}.'.replace('..','.')),
   (f'{z}{v("nai")}場合は、ご連絡ください。',f'{zk}{k("nai")}ばあいは、ごれんらくください。',f'Se non riesci a {it_inf} {it_obj}, avvisaci.',f'If you cannot {verb_en("present")}, please contact us.'),
   (f'{z}{v("past")}あとで、確認しました。',f'{zk}{k("past")}あとで、かくにんしました。',f'Ho controllato tutto dopo aver {it_past} {it_obj}.',f'I checked everything after I {verb_en("past")}.'.replace('..','.')),
   (f'{z}{v("te")}おきます。',f'{zk}{k("te")}おきます。',f'Provvederò in anticipo a {it_inf} {it_obj}.',f'I will {verb_en("present")} ahead of time.'),
   (f'今日中に{z}{v("dictionary")}ことはできますか。',f'きょうじゅうに{zk}{k("dictionary")}ことはできますか。',f'È possibile {it_inf} {it_obj} entro oggi?',f'Can you {verb_en("present")} by the end of today?'),
   (f'{z}{v("mashita")}が、まだ問題があります。',f'{zk}{k("mashita")}が、まだもんだいがあります。',f'Abbiamo {it_past} {it_obj}, ma rimane un problema.',f'We {verb_en("past")}, but a problem remains.'),
  ];grammars=['ます形','て形・依頼','過去丁寧形','辞書形・予定','辞書形・必要','ない形・場合','た形','て形・準備','辞書形・可能','過去丁寧形']
 else:
  rows=[
   (f'先ほど{z}{v("mashita")}ので、ご報告いたします。',f'さきほど{zk}{k("mashita")}ので、ごほうこくいたします。',f'Le comunico che ho appena {it_past} {it_obj}.',f'I would like to report that I just {verb_en("past")}.'.replace('..','.')),
   (f'恐れ入りますが、{z}{v("te")}いただけますでしょうか。',f'おそれいりますが、{zk}{k("te")}いただけますでしょうか。',f'Mi scusi, potrebbe {it_inf} {it_obj}?',f'Excuse me, would you be able to {verb_en("present")}?'),
   (f'{z}{v("dictionary")}件について、ご相談したく存じます。',f'{zk}{k("dictionary")}けんについて、ごそうだんしたくぞんじます。',f'Desidererei consultarla in merito a {it_inf} {it_obj}.',f'I would like to consult you about {verb_en("present")}.'.replace('..','.')),
   (f'ご承認いただければ、{z}{v("masu")}。',f'ごしょうにんいただければ、{zk}{k("masu")}。',f'Con la sua autorizzazione, provvederò a {it_inf} {it_obj}.',f'With your approval, I will {verb_en("present")}.'.replace('..','.')),
   (f'ご指示に従い、{z}{v("mashita")}。',f'ごしじにしたがい、{zk}{k("mashita")}。',f'Come da sue istruzioni, ho {it_past} {it_obj}.',f'Following your instructions, I {verb_en("past")}.'.replace('..','.')),
   (f'次回は{z}{v("dictionary")}ようにいたします。',f'じかいは{zk}{k("dictionary")}ようにいたします。',f'La prossima volta farò il possibile per {it_inf} {it_obj}.',f'Next time I will make sure to {verb_en("present")}.'.replace('..','.')),
   (f'{z}{v("dictionary")}必要があると考えております。',f'{zk}{k("dictionary")}ひつようがあるとかんがえております。',f'Ritengo necessario {it_inf} {it_obj}.',f'I believe we need to {verb_en("present")}.'.replace('..','.')),
   (f'{z}{v("te")}から、改めてご連絡いたします。',f'{zk}{k("te")}から、あらためてごれんらくいたします。',f'La ricontatterò dopo aver {it_past} {it_obj}.',f'I will contact you again after I {verb_en("past")}.'.replace('..','.')),
   (f'{z}{v("te")}もよろしいでしょうか。',f'{zk}{k("te")}もよろしいでしょうか。',f'Con il suo permesso, potrei {it_inf} {it_obj}?',f'With your permission, may I {verb_en("present")}?'),
   (f'{z}{v("past")}件は、部長にご説明いたします。',f'{zk}{k("past")}けんは、ぶちょうにごせつめいいたします。',f'Spiegherò al responsabile la questione relativa a {it_inf} {it_obj}.',f'I will explain to the manager the matter of {verb_en("present")}.'.replace('..','.')),
  ];grammars=['過去丁寧形・謙譲語','て形・依頼','辞書形・謙譲語','ます形・条件','過去丁寧形','ない形・謙譲語','辞書形・丁重語','て形・謙譲語','て形・許可','た形・謙譲語']
 jp,kana,it,en=rows[i]
 if c['id']==8 and reg=='colleague' and i==1:
  jp=f'{z}{v("dictionary")}ように、早めに出発してください。';kana=f'{zk}{k("dictionary")}ように、はやめにしゅっぱつしてください。';it=f'Parta per tempo, così potrà {it_inf} {it_obj}.';en=f'Please leave early enough to {verb_en("present")}.';grammars[i]='辞書形・目的'
 if c['id'] in (28,41) and reg=='informal' and i==0:
  jp=jp.replace('昨日、','一昨日、');kana=kana.replace('きのう、','おととい、');it=it.replace('Ieri ',"L’altro ieri ");en=en.replace('Yesterday ',"The day before yesterday ")
 if c['id']==8 and reg=='informal' and i==4:
  jp=f'{z}{v("dictionary")}ために早く出よう。';kana=f'{zk}{k("dictionary")}ためにはやくでよう。';it=f'Partiamo presto per {it_inf} {it_obj}.';en=f'Let us leave early to {verb_en("present")}.';grammars[i]='辞書形・目的'
 if c['id']==8 and reg=='superior' and i==5:
  jp=f'次回は{z}{v("dictionary")}ようにいたします。';kana=f'じかいは{zk}{k("dictionary")}ようにいたします。'
  it=f'La prossima volta farò il possibile per {it_inf} {it_obj}.';en=f'Next time I will make sure to {verb_en("present")}.';grammars[i]='辞書形・意志'
 if c['id']==8 and reg=='informal' and i==9:
  jp=f'明日は{z}{v("nai")}かもしれない。';kana=f'あしたは{zk}{k("nai")}かもしれない。'
  it=f'Domani potrei non {it_inf} {it_obj}.';en=f'Tomorrow I might not {verb_en("present")}.';grammars[i]='ない形・推量'
 if c['id']==34 and reg=='colleague' and i in (0,1,4,8):
  jp=f'{z}{v("nai")}ように確認します。';kana=f'{zk}{k("nai")}ようにかくにんします。';it=f'Controllerò tutto per non {it_inf} {it_obj}.';en=f'I will double-check so I do not {verb_en("present")}.';grammars[i]='ない形・目的'
 if c['id']==34 and reg=='superior' and i in (1,3,6,8):
  jp=f'{z}{v("nai")}ようにいたします。';kana=f'{zk}{k("nai")}ようにいたします。';it=f'Farò attenzione a non {it_inf} {it_obj}.';en=f'I will take care not to {verb_en("present")}.';grammars[i]='ない形・丁重語'
 return jp,kana,it.strip(),en.strip(),grammars[i]

def genitive_it(phrase):
 for a,b in [('il ','del '),('lo ','dello '),('la ','della '),("l'","dell'"),('i ','dei '),('le ','delle ')]:
  if phrase.startswith(a):return b+phrase[len(a):]
 return 'di '+phrase

def polish_italian(s):
 import re
 for prep,forms in {'di':{'il':'del','lo':'dello','la':'della',"l'":"dell'"},'a':{'il':'al','lo':'allo','la':'alla',"l'":"all'"},'su':{'il':'sul','lo':'sullo','la':'sulla',"l'":"sull'"}}.items():
  for art,merged in forms.items():
   s=re.sub(r'(?<!\w)'+re.escape(prep)+' '+re.escape(art)+(r'\b' if art!="l'" else ''), merged, s)
 s=re.sub(r'(?i)(ritengo|penso|non penso|non credo|è possibile) che (.+?) è ',lambda m:m.group(1)+' che '+m.group(2)+' sia ',s)
 return s

def noun_text(c,term,reg,i):
 obj,kana,it_obj,en_obj=TERMS[term];it_n,en_n=NOUN_TRANSLATIONS[c['id']]
 subject=obj+'の'+c['jp'];sk=kana+'の'+c['kana'];ti=it_n+' '+genitive_it(it_obj);te=en_n+' of '+en_obj
 # Japanese, matching kana, translations, grammatical function.
 informal=[
 ('{s}のこと、知ってる？','{s}のこと、しってる？','Sai qualcosa di {s}?','Have you heard of {s}?','口語・質問'),
 ('{s}について話そう。','{s}についてはなそう。','Parliamo di {s}.',"Let's talk about {s}.",'意向形'),
 ('昨日、{s}が気になった。','きのう、{s}がきになった.','Ieri mi sono interessato a {s}.','Yesterday I became curious about {s}.','過去形'),
 ('{s}は意外と大切だね。','{s}はいがいとたいせつだね。','A pensarci, {s} è piuttosto importante.','Come to think of it, {s} is quite important.','口語'),
 ('{s}を聞いて驚いた。','{s}をきいておどろいた。','Sono rimasto sorpreso sentendo parlare di {s}.','I was surprised to hear about {s}.','て形・過去'),
 ('もし{s}が変わったら教えて。','もし{s}がかわったらおしえて。','Se cambia qualcosa riguardo a {s}, dimmelo.','If anything changes about {s}, tell me.','条件形'),
 ('{s}について友達に質問した。','{s}についてともだちにしつもんした。','Ho fatto una domanda a un amico su {s}.','I asked a friend about {s}.','過去形'),
 ('{s}を忘れないで。','{s}をわすれないで。','Non dimenticare {s}.',"Don't forget {s}.",'ない形・依頼'),
 ('{s}をどう思う？','{s}をどうおもう？','Che cosa pensi di {s}?','What do you think of {s}?','疑問形'),
 ('今度、{s}をもっと調べたい。','こんど、{s}をもっとしらべたい。','La prossima volta vorrei approfondire {s}.','Next time I want to look into {s}.','たい形')]
 colleague=[
 ('{s}について会議で説明しました。','{s}についてかいぎでせつめいしました。','Ho spiegato {s} durante la riunione.','I explained {s} during the meeting.','過去丁寧形'),
 ('{s}の資料を共有してください。','{s}のしりょうをきょうゆうしてください。','Condividi, per favore, i documenti su {s}.','Please share the documents about {s}.','て形・依頼'),
 ('{s}はまだ確認中です。','{s}はまだかくにんちゅうです。','Stiamo ancora verificando {s}.','We are still checking {s}.','丁寧形'),
 ('{s}について質問があります。','{s}についてしつもんがあります。','Avrei una domanda riguardo a {s}.','I have a question concerning {s}.','丁寧形'),
 ('{s}は来週も重要です。','{s}はらいしゅうもじゅうようです。','Anche la prossima settimana {s} sarà importante.','Next week, {s} will still be important.','丁寧形'),
 ('{s}の変更があればお知らせください。','{s}のへんこうがあればおしらせください。','Avvisami se ci sono variazioni riguardo a {s}.','Please let me know if there are changes to {s}.','条件形・依頼'),
 ('{s}について簡単にまとめました。','{s}についてかんたんにまとめました。','Ho preparato un riepilogo di {s}.','I prepared a summary of {s}.','過去丁寧形'),
 ('{s}をもう一度確認しましょう。','{s}をもういちどかくにんしましょう。','Ricontrolliamo insieme {s}.',"Let's review {s} once again.",'勧誘形'),
 ('{s}に関して意見を聞かせてください。','{s}にかんしていけんをきかせてください。','Vorrei conoscere la tua opinione su {s}.','Please share your opinion about {s}.','て形・依頼'),
 ('{s}の説明をメールで送ります。','{s}のせつめいをめーるでおくります。','Ti invierò una spiegazione di {s} via email.','I will email you an explanation of {s}.','ます形')]
 superior=[
 ('{s}につきまして、ご報告いたします。','{s}につきまして、ごほうこくいたします。','Desidero riferirle in merito a {s}.','I would like to report on {s}.','謙譲語'),
 ('{s}についてご意見を伺えますでしょうか。','{s}についてごいけんをうかがえますでしょうか。','Potrei conoscere il suo parere riguardo a {s}?','May I ask for your opinion on {s}?','謙譲語・質問'),
 ('{s}の資料を提出いたしました。','{s}のしりょうをていしゅついたしました。','Ho presentato la documentazione relativa a {s}.','I have submitted the documents about {s}.','謙譲語・過去'),
 ('{s}に関するご指示をお願いいたします。','{s}にかんするごしじをおねがいいたします。','Le chiedo gentilmente indicazioni relative a {s}.','I respectfully request your guidance on {s}.','丁重語'),
 ('{s}は慎重に確認しております。','{s}はしんちょうにかくにんしております。','Stiamo verificando attentamente {s}.','We are carefully checking {s}.','丁重語・進行'),
 ('{s}の詳細をご説明申し上げます。','{s}のしょうさいをごせつめいもうしあげます。','Le illustrerò i dettagli di {s}.','I will explain the details of {s}.','謙譲語'),
 ('{s}について改めてご相談いたします。','{s}についてあらためてごそうだんいたします。','Tornerò a consultarla riguardo a {s}.','I will consult you again about {s}.','謙譲語'),
 ('{s}の内容に誤りがないか確認いたします。','{s}のないようにあやまりがないかかくにんいたします。','Verificherò che il contenuto di {s} non contenga errori.','I will check the contents of {s} for errors.','謙譲語・疑問'),
 ('{s}を踏まえて対応を検討いたします。','{s}をふまえてたいおうをけんとういたします。','Prenderemo in considerazione {s} prima di decidere come procedere.','We will consider {s} when deciding our response.','謙譲語'),
 ('{s}に関しまして後ほどご連絡いたします。','{s}にかんしましてのちほどごれんらくいたします。','La ricontatterò più tardi in merito a {s}.','I will contact you later about {s}.','謙譲語')]
 row={'informal':informal,'colleague':colleague,'superior':superior}[reg][i]
 jp,k,ital,eng,label=row
 return jp.format(s=subject),k.format(s=sk).replace('きになった.','きになった。'),polish_italian(ital.format(s=ti)),eng.format(s=te),label

# Produce inflected forms of Japanese adjectives with matching kana.
def adjective_forms(c):
 jp,k=c['jp'],c['kana']
 if c['pos']=='i':
  a,b=jp[:-1],k[:-1]
  return dict(plain=(jp,k),past=(a+'かった',b+'かった'),pastPolite=(a+'かったです',b+'かったです'),negative=(a+'くない',b+'くない'),negativePolite=(a+'くありません',b+'くありません'),pastNeg=(a+'くなかった',b+'くなかった'),polite=(jp+'です',k+'です'),because=(jp+'ので',k+'ので'),attributive=(jp,k),became=(a+'くなりました',b+'くなりました'),become=(a+'くなる',b+'くなる'),statement=(jp,k),ifform=(jp+'なら',k+'なら'))
 return dict(plain=(jp+'だ',k+'だ'),past=(jp+'だった',k+'だった'),pastPolite=(jp+'でした',k+'でした'),negative=(jp+'じゃない',k+'じゃない'),negativePolite=(jp+'ではありません',k+'ではありません'),pastNeg=(jp+'じゃなかった',k+'じゃなかった'),polite=(jp+'です',k+'です'),because=(jp+'なので',k+'なので'),attributive=(jp+'な',k+'な'),became=(jp+'になりました',k+'になりました'),become=(jp+'になる',k+'になる'),statement=(jp+'だ',k+'だ'),ifform=(jp+'なら',k+'なら'))

def adjective_text(c,term,reg,i):
 obj,kana,it_obj,en_obj=TERMS[term]; a=adjective_forms(c);it_adj,en_adj=ADJ_TRANSLATIONS[c['id']]
 def f(name):return a[name][0]
 def k(name):return a[name][1]
 # With 心配, Japanese means 'being worried about X', not 'X is worried'.
 it_pred=(lambda x: f'mi preoccupa {x}') if c['id']==60 else (lambda x:f'{x} è {it_adj}')
 en_pred=(lambda x:f'I am worried about {x}') if c['id']==60 else (lambda x:f'{x} is {en_adj}')
 feminine_terms={ 'email','photo','proposal','meeting','invitation','instruction','answer','situation','flower','vegetable','house','road','car','letter','shirt','desk','chair','window','door','gym','rain','night','station','room','school','lesson','exercise','family','presentation','music','memory','question','party','flowerbed','power_cut' }
 gender_f=it_obj.startswith('la ') or (it_obj.startswith("l'") and term in feminine_terms)
 if gender_f and it_adj.endswith('o'):it_adj=it_adj[:-1]+'a'
 it_base=it_pred(it_obj);en_base=en_pred(en_obj)
 it_was=it_base.replace(' è ',' era ') if c['id']!=60 else 'ero preoccupato per '+it_obj
 en_was=en_base.replace(' is ',' was ').replace(' are ',' were ').replace('I am ','I was ')
 it_was_not=it_was.replace(' era ',' non era ').replace('ero ','non ero ',1)
 en_was_not=en_was.replace(' was ',' was not ').replace(' were ',' were not ').replace('I was ','I was not ',1)
 it_subj=it_base.replace(' è ',' sia ') if c['id']!=60 else it_base.replace('mi preoccupa','mi preoccupi')

 if reg=='informal':
  rows=[
   (f'昨日、{obj}は{f("past")}。',f'きのう、{kana}は{k("past")}。',f'Ieri {it_was}.',f'Yesterday, {en_was}.','過去形'),
   (f'{obj}って{f("plain")}ね。',f'{kana}って{k("plain")}ね。',f'A pensarci, {it_base}, vero?',f'Come to think of it, {en_base}, right?','口語・判断'),
   (f'{obj}は{f("negative")}と思う。',f'{kana}は{k("negative")}とおもう。',f'Non penso che {it_subj}.',f'I do not think {en_base}.','否定形'),
   (f'{obj}が{f("because")}、気をつけて。',f'{kana}が{k("because")}、きをつけて。',f'Fai attenzione perché {it_base}.',f'Be careful because {en_base}.','理由・ので'),
   (f'{obj}は前より{f("plain")}。',f'{kana}はまえより{k("plain")}。',f'Rispetto a prima, {it_base}.',f'Compared with before, {en_base}.','比較'),
   (f'こんなに{obj}が{f("plain")}とは知らなかった。',f'こんなに{kana}が{k("plain")}とはしらなかった。',f'Non immaginavo che {it_base} così tanto.',f'I did not expect that {en_base} to this extent.','驚き・過去'),
   (f'{obj}は{f("pastNeg")}よ。',f'{kana}は{k("pastNeg")}よ。',f'Ieri {it_was_not}.',f'Yesterday, {en_was_not}.','否定過去'),
   (f'{obj}が{f("ifform")}、教えて。',f'{kana}が{k("ifform")}、おしえて。',f'Dimmi se {it_base}.',f'Tell me if {en_base}.','条件形'),
   (f'明日も{obj}は{f("plain")}かな。',f'あしたも{kana}は{k("plain")}かな。',f'Mi chiedo se anche domani {it_base}.',f'I wonder whether tomorrow {en_base} too.','推量'),
   (f'{obj}のほうが{f("plain")}と思う。',f'{kana}のほうが{k("plain")}とおもう。',f'Se faccio un confronto, penso che {it_base}.',f'By comparison, I think {en_base}.','比較・意見')]
 elif reg=='colleague':
  rows=[
   (f'{obj}は{f("polite")}。',f'{kana}は{k("polite")}。',f'Rileviamo che {it_base}.',f'We find that {en_base}.','丁寧形'),
   (f'先週は{obj}が{f("pastPolite")}。',f'せんしゅうは{kana}が{k("pastPolite")}。',f'La settimana scorsa abbiamo notato che {it_was}.',f'Last week, we noticed that {en_was}.','過去丁寧形'),
   (f'この資料によると、{obj}は{f("polite")}。',f'このしりょうによると、{kana}は{k("polite")}。',f'Secondo il documento, {it_base}.',f'According to the document, {en_base}.','引用・丁寧形'),
   (f'{obj}はまだ{f("negativePolite")}。',f'{kana}はまだ{k("negativePolite")}。',f'Per il momento, non possiamo dire che {it_base}.',f'For now, we cannot say that {en_base}.','否定丁寧形'),
   (f'以前より{obj}が{f("became")}。',f'いぜんより{kana}が{k("became")}。',f'Rispetto a prima, {it_base} in misura maggiore.',f'Compared with before, {en_base} to a greater extent.','変化・過去'),
   (f'{obj}が{f("because")}、注意してください。',f'{kana}が{k("because")}、ちゅういしてください。',f'Prestate attenzione: {it_base}.',f'Please pay attention: {en_base}.','理由・依頼'),
   (f'{obj}は{f("plain") if c["pos"]=="i" else c["jp"]}かもしれません。',f'{kana}は{k("plain") if c["pos"]=="i" else c["kana"]}かもしれません。',f'È possibile che {it_subj}.',f'It is possible that {en_base}.','推量'),
   (f'{obj}が{f("past")}と聞きました。',f'{kana}が{k("past")}とききました。',f'Mi è stato riferito che {it_was}.',f'I was told that {en_was}.','伝聞・過去'),
   (f'{obj}は{f("negative")}と思います。',f'{kana}は{k("negative")}とおもいます。',f'Non mi risulta che {it_base}.',f'I do not believe that {en_base}.','否定・丁寧形'),
   (f'{obj}が{f("statement")}と確認しました。',f'{kana}が{k("statement")}とかくにんしました。',f'Ho verificato che {it_base}.',f'I confirmed that {en_base}.','引用・過去丁寧形')]
 else:
  rows=[
   (f'{obj}は{f("statement")}と存じます。',f'{kana}は{k("statement")}とぞんじます。',f'Ritengo che {it_subj}.',f'I believe that {en_base}.','丁重語'),
   (f'{obj}の状態は{f("statement")}と伺っております。',f'{kana}のじょうたいは{k("statement")}とうかがっております。',f'Mi è stato riferito che {it_base}.',f'I have been informed that {en_base}.','謙譲語・伝聞'),
   (f'{obj}について、{c["jp"]}かどうか確認いたします。',f'{kana}について、{c["kana"]}かどうかかくにんいたします。',f'Verificherò se {it_base}.',f'I will check whether {en_base}.','謙譲語・疑問'),
   (f'{obj}が{f("attributive")}ため、対応を検討しております。',f'{kana}が{k("attributive")}ため、たいおうをけんとうしております。',f'Poiché {it_base}, stiamo valutando come intervenire.',f'Since {en_base}, we are reviewing our response.','理由・丁重語'),
   (f'{obj}は{f("pastPolite")}と報告を受けました。',f'{kana}は{k("pastPolite")}とほうこくをうけました。',f'Abbiamo ricevuto una segnalazione secondo cui {it_was}.',f'We received a report stating that {en_was}.','過去丁寧形'),
   (f'{obj}が{(c["jp"]+"ではない") if c["pos"]=="na" else f("negative")}場合は、ご連絡ください。',f'{kana}が{(c["kana"]+"ではない") if c["pos"]=="na" else k("negative")}ばあいは、ごれんらくください。',f'La prego di avvisarmi se non è vero che {it_base}.',f'Please contact me if it is not true that {en_base}.','否定・条件'),
   (f'{obj}はさらに{f("become")}見込みです。',f'{kana}はさらに{k("become")}みこみです。',f'Prevediamo che {it_base} ancora di più.',f'We expect that {en_base} to an even greater extent.','変化・予想'),
   (f'{obj}について、{f("negative")}と認識しております。',f'{kana}について、{k("negative")}とにんしきしております。',f'La nostra valutazione è che non si possa dire che {it_subj}.',f'Our assessment is that we cannot say {en_base}.','否定・丁重語'),
   (f'{obj}が{c["jp"]}かどうか、ご確認いただけますか。',f'{kana}が{c["kana"]}かどうか、ごかくにんいただけますか。',f'Potrebbe verificare se {it_base}?',f'Could you please confirm whether {en_base}?','尊敬依頼'),
   (f'{obj}は{f("statement")}と考えております。',f'{kana}は{k("statement")}とかんがえております。',f'Siamo dell’avviso che {it_base}.',f'We are of the opinion that {en_base}.','丁重語')]
 return (*rows[i],)

# Compose 30 independent propositions per card: with hand-curated exceptions, no legacy quotation and no
# repeated original utterance. The ten themes vary topics; thirty distinct
# tense/aspect/intent/negation patterns vary the assertions and pragmatic intent.
curated={}
for line in (ROOT/'tools/curated_special_cases.tsv').read_text(encoding='utf-8').splitlines():
 parts=line.split('|')
 assert len(parts)==7,(len(parts),line)
 cid,reg,*payload=parts
 curated.setdefault((int(cid),reg),[]).append(tuple(payload))
for key,examples in curated.items(): assert len(examples)==10,(key,len(examples))
new_count=0
for card in D['cards']:
 themes=THEMES[card['id']].split();assert len(themes)==10,(card['id'],themes)
 for j,ex in enumerate(card['examples']):
  scenario=D['scenarios'][j]
  assert ex['scenarioId']==scenario['id']
  reg=scenario['register'];i=j%10;theme=themes[(i+{'informal':0,'colleague':3,'superior':7}[reg])%10]
  if (card['id'],reg) in curated:jp,kana,it,en,grammar=curated[(card['id'],reg)][i]
  elif card['pos']=='verb':jp,kana,it,en,grammar=verb_text(card,theme,reg,i)
  elif card['pos']=='noun':jp,kana,it,en,grammar=noun_text(card,theme,reg,i)
  else:jp,kana,it,en,grammar=adjective_text(card,theme,reg,i)
  assert all(map(bool,(jp,kana,it,en,grammar)))
  ex.update(jp=jp,kana=kana,it=it,en=en,grammarForm=grammar,speaker='friend' if reg=='informal' else 'colleague' if reg=='colleague' else 'staff',
            note=('Esempio curato individualmente, non verificato da un madrelingua.' if (card['id'],reg) in curated else 'Esempio nuovo generato da lessico tematico e modelli grammaticali; richiede revisione linguistica madrelingua.'),reviewStatus='new-original-draft')
  ex.pop('originExampleId',None)
  new_count+=1
card_texts=[e['jp'] for c in D['cards'] for e in c['examples']]
repeats=len(card_texts)-len(set(card_texts));assert repeats==0,repeats
D['revision']=6
D['description']='Deck N4 con 2.250 esempi nuovi e diversificati; la revisione linguistica madrelingua rimane da completare.'
D['contentReview']={'status':'draft','method':'new-proposition-composition-from-curated-themes-and-inflected-templates','linguisticReview':'not-performed','warning':'2250 frasi nuove, senza cornici né citazioni dal deck precedente; modelli grammaticali e traduzioni ancora da verificare da un revisore madrelingua.'}
DATA.write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Rewrote',new_count,'new unique examples; old 750 preserved separately. Revision',D['revision'])
