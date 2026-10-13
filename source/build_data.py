import json,re
from pathlib import Path
root=Path(__file__).parent
raw=r'''
@verb|集める|あつめる|raccogliere / collezionare|collect / gather|て形=集めて;ます形=集めます;ない形=集めない;た形=集めた;可能形=集められる
旅行先で見つけた古い切手を集めています。|りょこうさきでみつけたふるいきってをあつめています。|Colleziono francobolli antichi trovati durante i viaggi.|I collect old stamps I find while traveling.
会議の前に全員の意見を集めてください。|かいぎのまえにぜんいんのいけんをあつめてください。|Raccogli le opinioni di tutti prima della riunione.|Please gather everyone's opinions before the meeting.
必要な資料を集めなければ、調査は始められません。|ひつようなしりょうをあつめなければ、ちょうさははじめられません。|Se non raccogliamo i documenti necessari, non possiamo iniziare l'indagine.|We can't start the investigation unless we collect the necessary documents.
妹は去年から海辺の石を集め始めました。|いもうとはきょねんからうみべのいしをあつめはじめました。|Mia sorella minore ha iniziato a raccogliere sassi sulla spiaggia l'anno scorso.|My younger sister started collecting stones from the beach last year.
地域の人たちが公園のごみを集めてくれました。|ちいきのひとたちがこうえんのごみをあつめてくれました。|Gli abitanti del quartiere hanno raccolto i rifiuti del parco per noi.|Local residents kindly collected the litter in the park.
急いで情報を集めても、間違いがあるかもしれません。|いそいでじょうほうをあつめても、まちがいがあるかもしれません。|Anche raccogliendo informazioni in fretta, potrebbero esserci errori.|Even if we gather information quickly, there may be mistakes.
写真を百枚集めたら、小さな展示会を開きたいです。|しゃしんをひゃくまいあつめたら、ちいさなてんじかいをひらきたいです。|Quando avrò raccolto cento fotografie, vorrei organizzare una piccola mostra.|Once I have collected a hundred photos, I'd like to hold a small exhibition.
この箱には使わなくなった道具を集めてあります。|このはこにはつかわなくなったどうぐをあつめてあります。|In questa scatola sono stati raccolti gli attrezzi che non usiamo più.|Tools we no longer use have been gathered in this box.
一人では十分なお金を集められませんでした。|ひとりではじゅうぶんなおかねをあつめられませんでした。|Da solo non sono riuscito a raccogliere abbastanza denaro.|I couldn't raise enough money on my own.
資料を集めながら、新しい疑問も出てきました。|しりょうをあつめながら、あたらしいぎもんもでてきました。|Mentre raccoglievo materiale, sono emerse anche nuove domande.|As I gathered materials, new questions came up.
@verb|選ぶ|えらぶ|scegliere|choose / select|て形=選んで;ます形=選びます;ない形=選ばない;た形=選んだ;可能形=選べる
長く使う物だから、値段だけで選ばないでください。|ながくつかうものだから、ねだんだけでえらばないでください。|Dato che lo userai a lungo, non scegliere solo in base al prezzo.|Since you'll use it for a long time, don't choose based only on price.
写真を見ながら、旅行先のホテルを選びました。|しゃしんをみながら、りょこうさきのほてるをえらびました。|Ho scelto l'hotel per il viaggio guardando le fotografie.|I chose the hotel for the trip while looking at photos.
好きな席を選んでから、名前を書いてください。|すきなせきをえらんでから、なまえをかいてください。|Dopo aver scelto il posto che preferisci, scrivi il tuo nome.|After choosing your preferred seat, write down your name.
候補が多すぎて、一つに選べません。|こうほがおおすぎて、ひとつにえらべません。|Ci sono troppi candidati e non riesco a sceglierne uno.|There are too many options, so I can't pick just one.
先生は私の作文を代表作品に選んでくれました。|せんせいはわたしのさくぶんをだいひょうさくひんにえらんでくれました。|L'insegnante ha scelto il mio tema come elaborato rappresentativo.|The teacher selected my essay as a representative piece.
急いで選ぶと、大事な違いを見落とします。|いそいでえらぶと、だいじなちがいをみおとします。|Se scegli in fretta, rischi di non notare differenze importanti.|If you choose in a hurry, you'll miss important differences.
友達が選んだ映画は、予想よりずっと面白かったです。|ともだちがえらんだえいがは、よそうよりずっとおもしろかったです。|Il film scelto dal mio amico era molto più interessante del previsto.|The movie my friend chose was far more interesting than expected.
子どもたちに自分で本を選ばせました。|こどもたちにじぶんでほんをえらばせました。|Ho lasciato che i bambini scegliessero i libri da soli.|I let the children choose their own books.
色を選ぶ前に、部屋の明るさを考えましょう。|いろをえらぶまえに、へやのあかるさをかんがえましょう。|Prima di scegliere il colore, consideriamo la luminosità della stanza.|Before choosing a color, let's consider how bright the room is.
失敗しても、もう一度選び直せばいいですよ。|しっぱいしても、もういちどえらびなおせばいいですよ。|Anche se sbagli, puoi semplicemente scegliere di nuovo.|Even if you make a mistake, you can simply choose again.
@verb|決める|きめる|decidere / stabilire|decide / set|て形=決めて;ます形=決めます;ない形=決めない;た形=決めた;可能形=決められる
出発する時間は天気を見てから決めましょう。|しゅっぱつするじかんはてんきをみてからきめましょう。|Decidiamo l'orario di partenza dopo aver controllato il meteo.|Let's decide when to leave after checking the weather.
まだ進路を決めていないので、先生に相談します。|まだしんろをきめていないので、せんせいにそうだんします。|Non ho ancora deciso il mio percorso di studi, quindi parlerò con l'insegnante.|I haven't decided my path yet, so I'll consult my teacher.
家族と話し合って、新しい家に引っ越すことを決めました。|かぞくとはなしあって、あたらしいいえにひっこすことをきめました。|Dopo averne parlato con la famiglia, abbiamo deciso di trasferirci.|After discussing it with my family, we decided to move to a new home.
大切なことを一人だけで決めないほうがいいです。|たいせつなことをひとりだけできめないほうがいいです。|È meglio non decidere da soli le questioni importanti.|It's better not to decide important matters alone.
会議で次の担当者が決められました。|かいぎでつぎのたんとうしゃがきめられました。|Durante la riunione è stato designato il prossimo responsabile.|The next person in charge was chosen at the meeting.
何を買うか決めてから店に入りました。|なにをかうかきめてからみせにはいりました。|Sono entrato nel negozio dopo aver deciso cosa comprare.|I entered the store after deciding what to buy.
毎朝の勉強時間を決めると、続けやすくなります。|まいあさのべんきょうじかんをきめると、つづけやすくなります。|Se stabilisci un orario di studio ogni mattina, è più facile essere costanti.|Setting a study time each morning makes it easier to keep going.
答えを急いで決めなくても大丈夫です。|こたえをいそいできめなくてもだいじょうぶです。|Va bene anche non decidere subito la risposta.|You don't have to rush to decide on an answer.
旅行の予定が決まったら、すぐに知らせます。|りょこうのよていがきまったら、すぐにしらせます。|Quando il programma del viaggio sarà deciso, ti avviserò subito.|I'll let you know as soon as the travel plans are settled.
彼女は練習方法を自分で決めたがっています。|かのじょはれんしゅうほうほうをじぶんできめたがっています。|Lei vuole decidere da sola il metodo di allenamento.|She wants to decide on her training method herself.
@verb|続ける|つづける|continuare|continue / keep doing|て形=続けて;ます形=続けます;ない形=続けない;た形=続けた;可能形=続けられる
雨が降っても、試合を続ける予定です。|あめがふっても、しあいをつづけるよていです。|Anche se piove, prevediamo di continuare la partita.|We plan to continue the match even if it rains.
日本語の日記を半年間書き続けています。|にほんごのにっきをはんとしかんかきつづけています。|Continuo a scrivere un diario in giapponese da sei mesi.|I've kept writing a diary in Japanese for six months.
無理をして練習を続けないで、少し休んでください。|むりをしてれんしゅうをつづけないで、すこしやすんでください。|Non forzarti a continuare l'allenamento; riposati un po'.|Don't push yourself to keep practicing; take a short break.
周りが静かになってから、先生は説明を続けました。|まわりがしずかになってから、せんせいはせつめいをつづけました。|L'insegnante ha ripreso la spiegazione quando si è fatto silenzio.|The teacher continued the explanation once things became quiet.
忙しくても、一日十分なら勉強を続けられます。|いそがしくても、いちにちじゅっぷんべんきょうをつづけられます。|Anche se sei impegnato, puoi continuare a studiare per dieci minuti al giorno.|Even when you're busy, you can keep studying for ten minutes a day.
兄は仕事を続けながら、夜の学校に通っています。|あにはしごとをつづけながら、よるのがっこうにかよっています。|Mio fratello continua a lavorare mentre frequenta una scuola serale.|My older brother keeps working while attending evening classes.
続けていた運動のおかげで、階段が楽になりました。|つづけていたうんどうのおかげで、かいだんがらくになりました。|Grazie all'esercizio che facevo regolarmente, le scale sono diventate più facili.|Thanks to the exercise I kept up, climbing stairs has become easier.
失敗しても続ければ、少しずつ上手になります。|しっぱいしてもつづければ、すこしずつじょうずになります。|Se continui anche dopo gli errori, migliorerai poco alla volta.|If you keep going despite mistakes, you'll improve little by little.
同じ話を何度も続けるので、みんな困っていました。|おなじはなしをなんどもつづけるので、みんなこまっていました。|Continuava a ripetere la stessa storia, e tutti erano in difficoltà.|They kept repeating the same story, which bothered everyone.
昨日の話の続きを、昼休みに聞かせてください。|きのうのはなしのつづきを、ひるやすみにきかせてください。|Raccontami il seguito della storia di ieri durante la pausa pranzo.|Please tell me the rest of yesterday's story at lunch break.
@verb|手伝う|てつだう|aiutare / dare una mano|help / lend a hand|て形=手伝って;ます形=手伝います;ない形=手伝わない;た形=手伝った;可能形=手伝える
週末に祖父の庭仕事を手伝いました。|しゅうまつにそふのにわしごとをてつだいました。|Nel fine settimana ho aiutato mio nonno a lavorare in giardino.|I helped my grandfather with gardening over the weekend.
荷物が重そうですね。運ぶのを手伝いましょうか。|にもつがおもそうですね。はこぶのをてつだいましょうか。|Quel bagaglio sembra pesante. Vuoi che ti aiuti a portarlo?|That luggage looks heavy. Shall I help you carry it?
料理を手伝ってくれた友達に、お礼を言いました。|りょうりをてつだってくれたともだちに、おれいをいいました。|Ho ringraziato l'amico che mi ha aiutato a cucinare.|I thanked the friend who helped me cook.
忙しいときは、遠慮しないで手伝ってと言ってください。|いそがしいときは、えんりょしないでてつだってといってください。|Quando sei occupato, chiedimi pure una mano senza esitazione.|When you're busy, don't hesitate to ask me for help.
弟は宿題が終わるまで家事を手伝いません。|おとうとはしゅくだいがおわるまでかじをてつだいません。|Mio fratello minore non aiuta in casa finché non finisce i compiti.|My younger brother doesn't help with chores until he finishes his homework.
受付を手伝える人を三人探しています。|うけつけをてつだえるひとをさんにんさがしています。|Cerchiamo tre persone che possano aiutare alla reception.|We're looking for three people who can help at reception.
友達に引っ越しを手伝ってもらうことにしました。|ともだちにひっこしをてつだってもらうことにしました。|Ho deciso di chiedere a un amico di aiutarmi con il trasloco.|I decided to ask a friend to help me move.
手伝おうとしたのに、もう作業は終わっていました。|てつだおうとしたのに、もうさぎょうはおわっていました。|Volevo dare una mano, ma il lavoro era già finito.|I tried to help, but the work had already been completed.
母を手伝いながら、昔の家族の話を聞きました。|ははをてつだいながら、むかしのかぞくのはなしをききました。|Mentre aiutavo mia madre, ho ascoltato storie sulla nostra famiglia di un tempo.|While helping my mother, I heard stories about our family long ago.
手伝ってもらったおかげで、準備が予定より早く終わりました。|てつだってもらったおかげで、じゅんびがよていよりはやくおわりました。|Grazie all'aiuto ricevuto, i preparativi sono finiti prima del previsto.|Thanks to the help I received, preparations finished ahead of schedule.
@verb|直す|なおす|riparare / correggere|fix / correct|て形=直して;ます形=直します;ない形=直さない;た形=直した;可能形=直せる
壊れた時計を父が自分で直しました。|こわれたとけいをちちがじぶんでなおしました。|Mio padre ha riparato da solo l'orologio rotto.|My father fixed the broken watch himself.
先生に言われたところを直して、作文を出しました。|せんせいにいわれたところをなおして、さくぶんをだしました。|Ho corretto le parti indicate dall'insegnante e consegnato il tema.|I corrected the parts my teacher pointed out and submitted my essay.
機械を直せない場合は、専門の人に頼みます。|きかいをなおせないばあいは、せんもんのひとにたのみます。|Se non riesco a riparare il macchinario, chiederò a uno specialista.|If I can't fix the machine, I'll ask a specialist.
その数字は間違っているので、すぐに直してください。|そのすうじはまちがっているので、すぐになおしてください。|Quel numero è sbagliato, quindi correggilo subito.|That figure is wrong, so please correct it right away.
雨にぬれた本は、元どおりには直りませんでした。|あめにぬれたほんは、もとどおりにはなおりませんでした。|Il libro bagnato dalla pioggia non è tornato come prima.|The rain-soaked book couldn't be restored to its original condition.
予定を直すより、集合場所を変えたほうが簡単です。|よていをなおすより、しゅうごうばしょをかえたほうがかんたんです。|Piuttosto che modificare il programma, è più semplice cambiare il luogo d'incontro.|It's easier to change the meeting place than to revise the schedule.
書類を直さないまま送ってしまいました。|しょるいをなおさないままおくってしまいました。|Ho inviato il documento senza correggerlo.|I sent the document without fixing it.
発音を何度も直してもらい、やっと覚えました。|はつおんをなんどもなおしてもらい、やっとおぼえました。|Dopo avermi corretto più volte la pronuncia, finalmente l'ho imparata.|After having my pronunciation corrected many times, I finally learned it.
この古い自転車なら、少し時間があれば直せます。|このふるいじてんしゃなら、すこしじかんがあればなおせます。|Questa vecchia bicicletta posso ripararla, se ho un po' di tempo.|I can fix this old bicycle if I have a little time.
間違いに気づいたら、恥ずかしがらずに直しましょう。|まちがいにきづいたら、はずかしがらずになおしましょう。|Se ti accorgi di un errore, correggilo senza vergognarti.|If you notice a mistake, correct it without feeling embarrassed.
@verb|運ぶ|はこぶ|trasportare / portare|carry / transport|て形=運んで;ます形=運びます;ない形=運ばない;た形=運んだ;可能形=運べる
新しい机を二階まで運ぶのは大変でした。|あたらしいつくえをにかいまではこぶのはたいへんでした。|Portare la nuova scrivania al secondo piano è stato faticoso.|Carrying the new desk up to the second floor was hard work.
割れやすい皿は一枚ずつ運んでください。|われやすいさらはいちまいずつはこんでください。|Porta i piatti fragili uno alla volta, per favore.|Please carry the fragile plates one at a time.
父は毎朝、自転車で新聞を運んでいます。|ちちはまいあさ、じてんしゃでしんぶんをはこんでいます。|Mio padre trasporta giornali in bicicletta ogni mattina.|My father delivers newspapers by bicycle every morning.
荷物が多すぎて、一度では全部運べません。|にもつがおおすぎて、いちどではぜんぶはこべません。|Ci sono troppi bagagli per portarli tutti in una volta.|There's too much luggage to carry it all in one trip.
台風の前に植木を家の中へ運びました。|たいふうのまえにうえきをいえのなかへはこびました。|Prima del tifone abbiamo portato le piante in casa.|We brought the potted plants indoors before the typhoon.
水を運ぶ間に、床をぬらさないようにしてください。|みずをはこぶあいだに、ゆかをぬらさないようにしてください。|Mentre trasporti l'acqua, cerca di non bagnare il pavimento.|Try not to wet the floor while carrying the water.
この箱は重いので、一人で運ばないでください。|このはこはおもいので、ひとりではこばないでください。|Questa scatola è pesante, quindi non portarla da solo.|This box is heavy, so please don't carry it alone.
船で運ばれた果物は、港で検査されます。|ふねではこばれたくだものは、みなとでけんさされます。|La frutta trasportata via nave viene controllata al porto.|Fruit shipped by boat is inspected at the port.
必要な道具だけを車に運んでおきました。|ひつようなどうぐだけをくるまにはこんでおきました。|Ho caricato in auto soltanto gli attrezzi necessari.|I loaded only the necessary tools into the car in advance.
病院へ運ばれた人は、もう元気になったそうです。|びょういんへはこばれたひとは、もうげんきになったそうです。|A quanto pare la persona portata in ospedale ora sta bene.|I hear the person taken to the hospital has already recovered.
@verb|間に合う|まにあう|arrivare in tempo / fare in tempo|be on time / make it|て形=間に合って;ます形=間に合います;ない形=間に合わない;た形=間に合った;条件形=間に合えば
急げば、七時の電車にまだ間に合います。|いそげば、しちじのでんしゃにまだまにあいます。|Se ci sbrighiamo, facciamo ancora in tempo a prendere il treno delle sette.|If we hurry, we can still catch the seven o'clock train.
道が混んでいて、会議の開始に間に合いませんでした。|みちがこんでいて、かいぎのかいしにまにあいませんでした。|C'era traffico e non sono arrivato in tempo per l'inizio della riunione.|Traffic was heavy, and I didn't make it to the start of the meeting.
今日中に仕上げれば、締め切りに間に合うでしょう。|きょうじゅうにしあげれば、しめきりにまにあうでしょう。|Se lo finiamo entro oggi, dovremmo rispettare la scadenza.|If we finish it today, we should meet the deadline.
走っても間に合わないので、次のバスを待ちます。|はしってもまにあわないので、つぎのばすをまちます。|Neanche correndo farei in tempo, quindi aspetto il prossimo autobus.|Even running won't get me there in time, so I'll wait for the next bus.
開演に間に合って、本当によかったです。|かいえんにまにあって、ほんとうによかったです。|Sono davvero contento di essere arrivato in tempo per l'inizio dello spettacolo.|I'm really glad we made it before the performance began.
資料が届かなければ、明日の発表に間に合いません。|しりょうがとどかなければ、あしたのはっぴょうにまにあいません。|Se i documenti non arrivano, non saremo pronti per la presentazione di domani.|If the documents don't arrive, we won't be ready for tomorrow's presentation.
授業に間に合うように、いつも早めに家を出ます。|じゅぎょうにまにあうように、いつもはやめにいえをでます。|Esco sempre un po' prima per arrivare in orario a lezione.|I always leave home early so I can get to class on time.
修理が間に合ったおかげで、旅行に車を使えました。|しゅうりがまにあったおかげで、りょこうにくるまをつかえました。|Grazie alla riparazione completata in tempo, abbiamo potuto usare l'auto per il viaggio.|Because the repair was finished in time, we could use the car for our trip.
申し込みは金曜日までなら間に合いますか。|もうしこみはきんようびまでならまにあいますか。|Se faccio domanda entro venerdì, sono ancora in tempo?|Will my application still be on time if I submit it by Friday?
あと五分あれば、準備は十分間に合います。|あとごふんあれば、じゅんびはじゅうぶんまにあいます。|Con altri cinque minuti, riusciremo senz'altro a prepararci in tempo.|With five more minutes, we'll definitely finish preparing in time.
@verb|予約する|よやくする|prenotare|reserve / book|て形=予約して;ます形=予約します;ない形=予約しない;た形=予約した;可能形=予約できる
人気の店なので、二週間前に席を予約しました。|にんきのみせなので、にしゅうかんまえにせきをよやくしました。|Dato che il locale è molto richiesto, ho prenotato due settimane prima.|Since the restaurant is popular, I booked a table two weeks ahead.
病院に行く前に、電話で予約してください。|びょういんにいくまえに、でんわでよやくしてください。|Prima di andare in ospedale, prenota per telefono.|Please book by phone before going to the hospital.
まだホテルを予約していないので、今夜調べます。|まだほてるをよやくしていないので、こんやしらべます。|Non ho ancora prenotato l'hotel, quindi cercherò stasera.|I haven't booked a hotel yet, so I'll look tonight.
この切符はインターネットでも予約できます。|このきっぷはいんたーねっとでもよやくできます。|Questo biglietto si può prenotare anche online.|You can reserve this ticket online too.
天気が悪そうなら、船のツアーは予約しません。|てんきがわるそうなら、ふねのつあーはよやくしません。|Se il tempo sembra brutto, non prenoterò il tour in barca.|If the weather looks bad, I won't book the boat tour.
間違った日に予約してしまい、変更をお願いしました。|まちがったひによやくしてしまい、へんこうをおねがいしました。|Ho prenotato per il giorno sbagliato e ho chiesto di cambiare data.|I accidentally booked the wrong day and asked to change it.
予約した時間より早く着いたら、入口で待ってください。|よやくしたじかんよりはやくついたら、いりぐちでまってください。|Se arrivi prima dell'orario prenotato, aspetta all'ingresso.|If you arrive before your booked time, wait at the entrance.
週末の部屋はすぐ埋まるので、早めに予約しましょう。|しゅうまつのへやはすぐうまるので、はやめによやくしましょう。|Le camere per il fine settimana si esauriscono presto, quindi prenotiamo per tempo.|Weekend rooms fill up quickly, so let's book early.
予約を取り消す場合は、前日までに連絡が必要です。|よやくをとりけすばあいは、ぜんじつまでにれんらくがひつようです。|Se annulli la prenotazione, devi avvisare entro il giorno prima.|If you cancel your reservation, you must notify them by the previous day.
友達の誕生日のために、窓側の席を予約しておきました。|ともだちのたんじょうびのために、まどがわのせきをよやくしておきました。|Per il compleanno di un amico, ho prenotato in anticipo un tavolo vicino alla finestra.|I reserved a window seat in advance for my friend's birthday.
@verb|変える|かえる|cambiare / modificare|change / alter|て形=変えて;ます形=変えます;ない形=変えない;た形=変えた;可能形=変えられる
電車が止まったので、帰る道を変えました。|でんしゃがとまったので、かえるみちをかえました。|Il treno si è fermato, quindi ho cambiato il percorso per tornare a casa.|The train stopped, so I changed my route home.
この設定を変えると、音が小さくなります。|このせっていをかえると、おとがちいさくなります。|Se modifichi questa impostazione, il volume si abbassa.|Changing this setting makes the sound quieter.
急に予定を変えないで、先に相談してください。|きゅうによていをかえないで、さきにそうだんしてください。|Non cambiare i piani all'improvviso; parlane prima con me.|Please discuss it with me before suddenly changing the plans.
髪形を変えたら、友達にすぐ気づかれました。|かみがたをかえたら、ともだちにすぐきづかれました。|Quando ho cambiato pettinatura, i miei amici se ne sono accorti subito.|My friends noticed immediately when I changed my hairstyle.
席を変えてもいいか、係の人に聞きました。|せきをかえてもいいか、かかりのひとにききました。|Ho chiesto all'addetto se potevo cambiare posto.|I asked the attendant if I could change seats.
考え方を少し変えれば、別の答えが見つかります。|かんがえかたをすこしかえれば、べつのこたえがみつかります。|Se cambi leggermente prospettiva, troverai un'altra risposta.|If you change your way of thinking a little, you'll find another answer.
大事な部分は変えずに、文章だけ短くしました。|だいじなぶぶんはかえずに、ぶんしょうだけみじかくしました。|Ho accorciato solo il testo senza cambiare le parti importanti.|I shortened the text without changing the important parts.
古い家具の色を変えて、新しい部屋に合わせました。|ふるいかぐのいろをかえて、あたらしいへやにあわせました。|Ho cambiato il colore dei vecchi mobili per abbinarli alla nuova stanza.|I changed the color of the old furniture to match the new room.
名前を変えた理由を、まだ誰にも話していません。|なまえをかえたりゆうを、まだだれにもはなしていません。|Non ho ancora detto a nessuno perché ho cambiato nome.|I haven't told anyone why I changed my name.
予定を変えられなかったため、今回は参加できません。|よていをかえられなかったため、こんかいはさんかできません。|Non posso partecipare questa volta perché non sono riuscito a cambiare programma.|I can't take part this time because I couldn't change my schedule.
@noun|予定|よてい|programma / piano|plan / schedule|丁寧形=予定です;過去形=予定だった;否定形=予定ではない;連体形=予定の
明日の予定が急に変わったので、友達に連絡しました。|あしたのよていがきゅうにかわったので、ともだちにれんらくしました。|Il programma di domani è cambiato all'improvviso, quindi ho avvisato un amico.|Tomorrow's plans changed suddenly, so I contacted a friend.
予定より早く仕事が終わり、映画を見に行けました。|よていよりはやくしごとがおわり、えいがをみにいけました。|Ho finito di lavorare prima del previsto e sono riuscito ad andare al cinema.|I finished work earlier than planned and managed to go to a movie.
来月は京都に三日間滞在する予定です。|らいげつはきょうとにみっかかんたいざいするよていです。|Il mese prossimo ho in programma di restare tre giorni a Kyoto.|I plan to stay in Kyoto for three days next month.
この週末、何か特別な予定がありますか。|このしゅうまつ、なにかとくべつなよていがありますか。|Hai programmi speciali per questo fine settimana?|Do you have any special plans this weekend?
予定が決まったら、集合場所も知らせてください。|よていがきまったら、しゅうごうばしょもしらせてください。|Quando il programma sarà definito, comunicami anche il punto d'incontro.|Once the plan is settled, please let me know the meeting place too.
台風のため、出発の予定を一日遅らせました。|たいふうのため、しゅっぱつのよていをいちにちおくらせました。|A causa del tifone, abbiamo rinviato la partenza di un giorno.|Because of the typhoon, we postponed our departure by a day.
予定を詰め込みすぎると、旅行が疲れるものになります。|よていをつめこみすぎると、りょこうがつかれるものになります。|Se riempi troppo il programma, il viaggio diventa stancante.|Packing in too many activities makes a trip exhausting.
父は予定のない日曜日を大切にしています。|ちちはよていのないにちようびをたいせつにしています。|Mio padre tiene molto alle domeniche senza impegni.|My father values Sundays when he has no plans.
予定どおりに進まなくても、落ち着いてください。|よていどおりにすすまなくても、おちついてください。|Anche se le cose non vanno secondo i piani, mantieni la calma.|Even if things don't go according to plan, stay calm.
来年の予定について、家族でゆっくり話しました。|らいねんのよていについて、かぞくでゆっくりはなしました。|Abbiamo parlato con calma in famiglia dei programmi per l'anno prossimo.|We talked calmly as a family about next year's plans.
@noun|理由|りゆう|motivo / ragione|reason|丁寧形=理由です;過去形=理由だった;否定形=理由ではない;連体形=理由の
遅れた理由を説明したら、先生は理解してくれました。|おくれたりゆうをせつめいしたら、せんせいはりかいしてくれました。|Dopo che ho spiegato il motivo del ritardo, l'insegnante ha capito.|When I explained why I was late, the teacher understood.
その店を選んだ理由は、駅から近いことです。|そのみせをえらんだりゆうは、えきからちかいことです。|Il motivo per cui ho scelto quel negozio è che è vicino alla stazione.|I chose that shop because it's close to the station.
理由も聞かずに相手を責めるべきではありません。|りゆうもきかずにあいてをせめるべきではありません。|Non si dovrebbe accusare qualcuno senza nemmeno ascoltarne le ragioni.|You shouldn't blame someone without even hearing their reasons.
欠席する理由を、前の日にメールで伝えました。|けっせきするりゆうを、まえのひにめーるでつたえました。|Ho comunicato via email il motivo della mia assenza il giorno prima.|I emailed the reason for my absence the day before.
その判断には、何か特別な理由があったのでしょうか。|そのはんだんには、なにかとくべつなりゆうがあったのでしょうか。|C'era forse un motivo particolare dietro quella decisione?|Was there a special reason behind that decision?
忙しいという理由だけで、運動をやめたくありません。|いそがしいというりゆうだけで、うんどうをやめたくありません。|Non voglio smettere di fare esercizio solo perché sono occupato.|I don't want to stop exercising just because I'm busy.
理由が分からないまま、会議が中止になりました。|りゆうがわからないまま、かいぎがちゅうしになりました。|La riunione è stata annullata senza che ne sapessimo il motivo.|The meeting was canceled without anyone knowing why.
彼女が怒った理由を、後になって知りました。|かのじょがおこったりゆうを、あとになってしりました。|Solo più tardi ho scoperto perché si era arrabbiata.|I found out only later why she had become angry.
理由を一つずつ書き出すと、問題が整理できます。|りゆうをひとつずつかきだすと、もんだいがせいりできます。|Scrivendo le ragioni una per una, puoi mettere ordine nel problema.|Writing down the reasons one by one helps organize the problem.
理由はともかく、まず相手の話を聞きましょう。|りゆうはともかく、まずあいてのはなしをききましょう。|A prescindere dal motivo, ascoltiamo prima l'altra persona.|Whatever the reason, let's listen to the other person first.
@noun|経験|けいけん|esperienza|experience|丁寧形=経験です;過去形=経験だった;否定形=経験ではない;連体形=経験の
初めて一人で海外旅行をした経験は忘れられません。|はじめてひとりでかいがいりょこうをしたけいけんはわすれられません。|Non dimenticherò mai l'esperienza del mio primo viaggio all'estero da solo.|I'll never forget my first experience of traveling abroad alone.
接客の経験がある人を募集しています。|せっきゃくのけいけんがあるひとをぼしゅうしています。|Cerchiamo persone con esperienza nel servizio clienti.|We're recruiting people with customer service experience.
失敗した経験から、多くのことを学びました。|しっぱいしたけいけんから、おおくのことをまなびました。|Ho imparato molto dall'esperienza di un fallimento.|I learned a great deal from the experience of failing.
日本で働いた経験はありますか。|にほんではたらいたけいけんはありますか。|Hai mai avuto esperienza di lavoro in Giappone?|Have you ever worked in Japan?
経験が少なくても、熱心に練習すれば上達します。|けいけんがすくなくても、ねっしんにれんしゅうすればじょうたつします。|Anche con poca esperienza, migliorerai esercitandoti con impegno.|Even with little experience, you'll improve if you practice diligently.
祖母は戦後の生活について、自分の経験を話してくれました。|そぼはせんごのせいかつについて、じぶんのけいけんをはなしてくれました。|Mia nonna mi ha raccontato la sua esperienza di vita nel dopoguerra.|My grandmother told me about her own experiences of life after the war.
今回の経験を次の仕事に生かしたいと思います。|こんかいのけいけんをつぎのしごとにいかしたいとおもいます。|Vorrei mettere a frutto questa esperienza nel prossimo lavoro.|I'd like to make use of this experience in my next job.
経験者の意見を聞いてから、道具を買いました。|けいけんしゃのいけんをきいてから、どうぐをかいました。|Ho comprato l'attrezzatura dopo aver sentito il parere di una persona esperta.|I bought the equipment after listening to someone experienced.
同じ経験をしても、感じ方は人によって違います。|おなじけいけんをしても、かんじかたはひとによってちがいます。|Anche vivendo la stessa esperienza, le persone la percepiscono in modo diverso.|Even after the same experience, people can feel differently about it.
知らない町で道に迷ったのも、いい経験でした。|しらないまちでみちにまよったのも、いいけいけんでした。|Anche perdermi in una città sconosciuta è stata una bella esperienza.|Even getting lost in an unfamiliar town was a valuable experience.
@noun|約束|やくそく|promessa / appuntamento|promise / arrangement|丁寧形=約束です;過去形=約束だった;否定形=約束ではない;連体形=約束の
明日の約束を忘れないように、カレンダーに書きました。|あしたのやくそくをわすれないように、かれんだーにかきました。|Ho segnato l'appuntamento di domani sul calendario per non dimenticarlo.|I wrote tomorrow's appointment on my calendar so I wouldn't forget it.
友達との約束があるので、今日は早く帰ります。|ともだちとのやくそくがあるので、きょうははやくかえります。|Oggi torno presto perché ho un appuntamento con un amico.|I'm going home early today because I have plans with a friend.
子どもとした約束は、できるだけ守りたいです。|こどもとしたやくそくは、できるだけまもりたいです。|Cerco di mantenere, per quanto possibile, le promesse fatte ai bambini.|I want to keep my promises to children whenever possible.
約束の時間を過ぎても、彼は現れませんでした。|やくそくのじかんをすぎても、かれはあらわれませんでした。|Anche dopo l'ora concordata, lui non si è presentato.|He didn't show up even after the agreed time.
雨が降った場合の集合場所も約束しておきましょう。|あめがふったばあいのしゅうごうばしょもやくそくしておきましょう。|Mettiamoci d'accordo anche sul punto d'incontro in caso di pioggia.|Let's also agree on a meeting place in case it rains.
大切な約束を破ったことを、今でも後悔しています。|たいせつなやくそくをやぶったことを、いまでもこうかいしています。|Mi pento ancora oggi di aver infranto una promessa importante.|I still regret breaking an important promise.
約束を変更したいなら、早めに連絡してください。|やくそくをへんこうしたいなら、はやめにれんらくしてください。|Se vuoi cambiare l'appuntamento, avvisami per tempo.|If you want to change our plans, please let me know early.
先生は約束どおり、授業の後で質問に答えてくれました。|せんせいはやくそくどおり、じゅぎょうのあとでしつもんにこたえてくれました。|Come promesso, l'insegnante ha risposto alle domande dopo la lezione.|As promised, the teacher answered questions after class.
その約束には、二人だけが知っている理由がありました。|そのやくそくには、ふたりだけがしっているりゆうがありました。|Dietro quella promessa c'era un motivo noto solo a loro due.|There was a reason for that promise that only the two of them knew.
彼女は一度決めた約束を簡単には変えません。|かのじょはいちどきめたやくそくをかんたんにはかえません。|Lei non cambia facilmente una promessa già fatta.|She doesn't easily change a promise once she's made it.
@noun|場合|ばあい|caso / situazione|case / situation|丁寧形=場合です;過去形=場合だった;否定形=場合ではない;連体形=場合の
地震が起きた場合は、この出口から避難してください。|じしんがおきたばあいは、このでぐちからひなんしてください。|In caso di terremoto, evacuate attraverso questa uscita.|In the event of an earthquake, evacuate through this exit.
予定が変わる場合は、前日までに知らせてください。|よていがかわるばあいは、ぜんじつまでにしらせてください。|Se il programma cambia, avvisami entro il giorno prima.|If the schedule changes, please let me know by the previous day.
雨の場合でも、イベントは予定どおり行います。|あめのばあいでも、いべんとはよていどおりおこないます。|Anche in caso di pioggia, l'evento si svolgerà come previsto.|Even in case of rain, the event will go ahead as planned.
分からない場合は、遠慮せず質問してください。|わからないばあいは、えんりょせずしつもんしてください。|Se non capisci, fai pure domande senza esitare.|If you don't understand, please ask questions without hesitation.
この場合は、謝るより先に事情を説明しましょう。|このばあいは、あやまるよりさきにじじょうをせつめいしましょう。|In questo caso, spieghiamo prima la situazione invece di scusarci subito.|In this case, let's explain the circumstances before apologizing.
電車が遅れた場合の連絡方法を決めておきます。|でんしゃがおくれたばあいのれんらくほうほうをきめておきます。|Stabilirò prima come comunicare in caso di ritardo del treno.|I'll decide in advance how to get in touch if the train is delayed.
特別な場合を除いて、図書館では静かにしてください。|とくべつなばあいをのぞいて、としょかんではしずかにしてください。|Tranne in casi particolari, mantenete il silenzio in biblioteca.|Except in special circumstances, please be quiet in the library.
同じ問題でも、人によって答えが違う場合があります。|おなじもんだいでも、ひとによってこたえがちがうばあいがあります。|Anche alla stessa domanda, le risposte possono variare da persona a persona.|Even for the same question, answers sometimes differ from person to person.
道に迷った場合に備えて、地図を保存しておきました。|みちにまよったばあいにそなえて、ちずをほぞんしておきました。|Ho salvato una mappa nel caso in cui mi perdessi.|I saved a map in case I got lost.
その場合は、新しい予約を取り直す必要があります。|そのばあいは、あたらしいよやくをとりなおすひつようがあります。|In quel caso bisogna effettuare una nuova prenotazione.|In that case, you'll need to make a new reservation.
@na|必要|ひつよう|necessario / indispensabile|necessary / needed|連体形=必要な;補語形=必要に;て形=必要で;否定形=必要じゃない;過去形=必要だった;否定過去=必要じゃなかった
海外旅行には有効なパスポートが必要です。|かいがいりょこうにはゆうこうなぱすぽーとがひつようです。|Per viaggiare all'estero è necessario un passaporto valido.|A valid passport is necessary for international travel.
必要な書類をそろえてから、申し込んでください。|ひつようなしょるいをそろえてから、もうしこんでください。|Raccogli i documenti necessari prima di presentare la domanda.|Gather the required documents before applying.
急がなくてもいいので、必要な時間をかけてください。|いそがなくてもいいので、ひつようなじかんをかけてください。|Non c'è fretta, quindi prenditi tutto il tempo necessario.|There's no need to rush, so take the time you need.
この作業に特別な道具は必要ありません。|このさぎょうにとくべつなどうぐはひつようありません。|Per questo lavoro non servono attrezzi speciali.|No special tools are needed for this task.
説明が必要なら、担当者を呼んできます。|せつめいがひつようなら、たんとうしゃをよんできます。|Se ti serve una spiegazione, chiamo il responsabile.|If you need an explanation, I'll get the person in charge.
必要以上に心配すると、眠れなくなります。|ひつよういじょうにしんぱいすると、ねむれなくなります。|Se ti preoccupi più del necessario, non riuscirai a dormire.|Worrying more than necessary can keep you awake.
この経験は、今後の仕事に必要になるでしょう。|このけいけんは、こんごのしごとにひつようになるでしょう。|Questa esperienza probabilmente sarà utile nel lavoro futuro.|This experience will probably become necessary in future work.
道が暗くて危険なので、明かりが必要でした。|みちがくらくてきけんなので、あかりがひつようでした。|Dato che la strada era buia e pericolosa, serviva una luce.|The road was dark and dangerous, so a light was needed.
全員に必要な情報だけを、短くまとめました。|ぜんいんにひつようなじょうほうだけを、みじかくまとめました。|Ho riassunto brevemente solo le informazioni necessarie a tutti.|I briefly summarized only the information everyone needed.
この話し合いは必要ではなかったと、後で気づきました。|このはなしあいはひつようではなかったと、あとできづきました。|In seguito mi sono accorto che quella discussione non era necessaria.|I realized afterward that the discussion hadn't been necessary.
@na|便利|べんり|comodo / pratico|convenient / handy|連体形=便利な;副詞形=便利に;て形=便利で;否定形=便利じゃない;過去形=便利だった;否定過去=便利じゃなかった
駅の近くに住むと、買い物にも通勤にも便利です。|えきのちかくにすむと、かいものにもつうきんにもべんりです。|Abitare vicino alla stazione è comodo sia per fare acquisti sia per andare al lavoro.|Living near the station is convenient for both shopping and commuting.
このアプリには便利な辞書機能が付いています。|このあぷりにはべんりなじしょきのうがついています。|Quest'app include una pratica funzione dizionario.|This app includes a handy dictionary feature.
便利でも、使い方が難しければ意味がありません。|べんりでも、つかいかたがむずかしければいみがありません。|Anche se è comodo, non serve a nulla se è difficile da usare.|Even if it's convenient, it's useless if it's hard to use.
田舎では車がないと、あまり便利ではありません。|いなかではくるまがないと、あまりべんりではありません。|In campagna non è molto comodo vivere senza auto.|In the countryside, getting around without a car isn't very convenient.
新しい道ができて、学校まで便利に行けるようになりました。|あたらしいみちができて、がっこうまでべんりにいけるようになりました。|Con la nuova strada è diventato più comodo raggiungere la scuola.|The new road has made it easier to get to school.
紙の地図も、電池が切れたときには便利です。|かみのちずも、でんちがきれたときにはべんりです。|Anche una mappa cartacea è utile quando la batteria si scarica.|A paper map is handy when the battery runs out.
この店は便利な場所にあるので、よく利用します。|このみせはべんりなばしょにあるので、よくりようします。|Uso spesso questo negozio perché si trova in una posizione comoda.|I often use this shop because it's in a convenient location.
以前の電話は不便でしたが、新しいものはずっと便利です。|いぜんのでんわはふべんでしたが、あたらしいものはずっとべんりです。|Il vecchio telefono era scomodo, ma quello nuovo è molto più pratico.|The old phone was inconvenient, but the new one is much handier.
便利だからといって、何でも機械に任せるのは危険です。|べんりだからといって、なんでもきかいにまかせるのはきけんです。|Solo perché è comodo, non significa che sia sicuro affidare tutto alle macchine.|Just because it's convenient doesn't mean it's safe to leave everything to machines.
便利な道具ほど、正しい使い方を覚えましょう。|べんりなどうぐほど、ただしいつかいかたをおぼえましょう。|Più uno strumento è pratico, più è importante imparare a usarlo correttamente.|The handier a tool is, the more important it is to learn how to use it properly.
@na|安全|あんぜん|sicuro / in sicurezza|safe / secure|連体形=安全な;副詞形=安全に;て形=安全で;否定形=安全じゃない;過去形=安全だった;否定過去=安全じゃなかった
夜道を歩くときは、安全な道を選んでください。|よみちをあるくときは、あんぜんなみちをえらんでください。|Quando cammini di notte, scegli una strada sicura.|Choose a safe route when walking at night.
子どもたちが安全に遊べる公園を作りたいです。|こどもたちがあんぜんにあそべるこうえんをつくりたいです。|Vorremmo creare un parco dove i bambini possano giocare in sicurezza.|We want to create a park where children can play safely.
安全のために、山に入る前に天気を確認します。|あんぜんのために、やまにはいるまえにてんきをかくにんします。|Per sicurezza controllo il tempo prima di andare in montagna.|For safety, I check the weather before entering the mountains.
この橋は古いですが、検査では安全だと分かりました。|このはしはふるいですが、けんさではあんぜんだとわかりました。|Questo ponte è vecchio, ma un'ispezione ha confermato che è sicuro.|The bridge is old, but an inspection showed it was safe.
道が凍っているので、今は安全ではありません。|みちがこおっているので、いまはあんぜんではありません。|La strada è ghiacciata, quindi al momento non è sicura.|The road is icy, so it's not safe right now.
安全な場所に移動してから、家族に連絡しました。|あんぜんなばしょにいどうしてから、かぞくにれんらくしました。|Mi sono spostato in un luogo sicuro prima di contattare la famiglia.|I moved to a safe place before contacting my family.
便利さだけでなく、安全も考えて道具を選びます。|べんりさだけでなく、あんぜんもかんがえてどうぐをえらびます。|Scelgo gli strumenti considerando non solo la comodità, ma anche la sicurezza.|I choose tools based not only on convenience but also on safety.
安全だと思っていた道が、雨で通れなくなりました。|あんぜんだとおもっていたみちが、あめでとおれなくなりました。|La strada che credevo sicura è diventata impraticabile per la pioggia.|The road I thought was safe became impassable because of rain.
交通安全について、学校で話し合いました。|こうつうあんぜんについて、がっこうではなしあいました。|A scuola abbiamo discusso di sicurezza stradale.|We discussed road safety at school.
急いでいるときほど、安全に気をつけましょう。|いそいでいるときほど、あんぜんにきをつけましょう。|Più hai fretta, più devi prestare attenzione alla sicurezza.|The more of a hurry you're in, the more carefully you should think about safety.
@na|丁寧|ていねい|cortese / accurato|polite / careful / thorough|連体形=丁寧な;副詞形=丁寧に;て形=丁寧で;否定形=丁寧じゃない;過去形=丁寧だった;否定過去=丁寧じゃなかった
店員さんが丁寧に商品の違いを説明してくれました。|てんいんさんがていねいにしょうひんのちがいをせつめいしてくれました。|Il commesso mi ha spiegato con cura le differenze tra i prodotti.|The shop assistant carefully explained the differences between the products.
初めて会う人には、丁寧な言葉を使うようにしています。|はじめてあうひとには、ていねいなことばをつかうようにしています。|Cerco di usare un linguaggio cortese con le persone che incontro per la prima volta.|I try to use polite language with people I meet for the first time.
説明が丁寧だったので、初心者にも分かりました。|せつめいがていねいだったので、しょしんしゃにもわかりました。|La spiegazione era così accurata che anche i principianti l'hanno capita.|The explanation was so thorough that even beginners understood it.
急いで書いた字は、あまり丁寧ではありません。|いそいでかいたじは、あまりていねいではありません。|I caratteri scritti in fretta non sono molto curati.|The characters I wrote in a hurry aren't very neat.
大切な手紙なので、一文字ずつ丁寧に書きました。|たいせつなてがみなので、ひともじずつていねいにかきました。|Dato che era una lettera importante, l'ho scritta con cura, carattere per carattere.|Because it was an important letter, I wrote each character carefully.
丁寧に作られた家具は、長く使えることが多いです。|ていねいにつくられたかぐは、ながくつかえることがおおいです。|I mobili realizzati con cura spesso durano a lungo.|Carefully made furniture often lasts a long time.
先生は間違いを丁寧に直してくれました。|せんせいはまちがいをていねいになおしてくれました。|L'insegnante ha corretto attentamente i miei errori.|My teacher corrected my mistakes carefully.
彼の話し方は丁寧ですが、少し堅く感じます。|かれのはなしかたはていねいですが、すこしかたくかんじます。|Il suo modo di parlare è cortese, ma suona un po' formale.|He speaks politely, but it feels a little formal.
丁寧で分かりやすい説明をありがとうございました。|ていねいでわかりやすいせつめいをありがとうございました。|Grazie per la spiegazione accurata e facile da capire.|Thank you for the careful, easy-to-understand explanation.
短い返事でも、丁寧に伝えれば失礼になりません。|みじかいへんじでも、ていねいにつたえればしつれいになりません。|Anche una risposta breve non è scortese se viene espressa con gentilezza.|Even a short reply isn't rude if you phrase it politely.
@na|自由|じゆう|libero / senza vincoli|free / unrestricted|連体形=自由な;副詞形=自由に;て形=自由で;否定形=自由じゃない;過去形=自由だった;否定過去=自由じゃなかった
この図書館では、好きな席を自由に選べます。|このとしょかんでは、すきなせきをじゆうにえらべます。|In questa biblioteca puoi scegliere liberamente il posto che preferisci.|In this library, you can freely choose your preferred seat.
仕事の後は、自由な時間を大切にしています。|しごとのあとは、じゆうなじかんをたいせつにしています。|Dopo il lavoro tengo molto al mio tempo libero.|I value my free time after work.
質問は自由ですが、相手の話を最後まで聞いてください。|しつもんはじゆうですが、あいてのはなしをさいごまできいてください。|Le domande sono libere, ma ascoltate l'altro fino alla fine.|You're free to ask questions, but please let the other person finish speaking.
子どもたちは自由に絵を描いていました。|こどもたちはじゆうにえをかいていました。|I bambini disegnavano liberamente.|The children were drawing freely.
自由に旅行できるようになったら、北海道に行きたいです。|じゆうにりょこうできるようになったら、ほっかいどうにいきたいです。|Quando potrò viaggiare liberamente, vorrei andare in Hokkaido.|When I can travel freely, I'd like to visit Hokkaido.
意見を自由に言える雰囲気が必要です。|いけんをじゆうにいえるふんいきがひつようです。|Serve un ambiente in cui si possano esprimere liberamente le proprie opinioni.|We need an atmosphere where people can express their opinions freely.
予定のない日は、何をするか自由に決めています。|よていのないひは、なにをするかじゆうにきめています。|Nei giorni senza programmi decido liberamente cosa fare.|On days without plans, I decide freely what to do.
便利な生活でも、自由な時間がなければ疲れます。|べんりなせいかつでも、じゆうなじかんがなければつかれます。|Anche una vita comoda può essere stancante senza tempo libero.|Even a convenient lifestyle is tiring without free time.
昼休みは自由なので、公園で本を読んでもいいです。|ひるやすみはじゆうなので、こうえんでほんをよんでもいいです。|La pausa pranzo è libera, quindi puoi leggere un libro al parco.|Lunch break is free time, so you can read a book in the park.
自由だからこそ、自分の行動に責任を持ちたいです。|じゆうだからこそ、じぶんのこうどうにせきにんをもちたいです。|Proprio perché sono libero, voglio assumermi la responsabilità delle mie azioni.|Precisely because I'm free, I want to take responsibility for my actions.
@i|深い|ふかい|profondo|deep|副詞形=深く;て形=深くて;否定形=深くない;過去形=深かった;否定過去=深くなかった;条件形=深ければ
この湖は見た目よりずっと深いそうです。|このみずうみはみためよりずっとふかいそうです。|Pare che questo lago sia molto più profondo di quanto sembri.|Apparently this lake is much deeper than it looks.
深い森に入る前に、道を確認しました。|ふかいもりにはいるまえに、みちをかくにんしました。|Prima di entrare nel fitto bosco, ho controllato il percorso.|Before entering the deep forest, I checked the route.
彼の話を聞いて、問題について深く考えました。|かれのはなしをきいて、もんだいについてふかくかんがえました。|Ascoltando la sua storia, ho riflettuto a fondo sul problema.|Listening to his story made me think deeply about the issue.
夜が深くなるにつれて、町は静かになりました。|よるがふかくなるにつれて、まちはしずかになりました。|Man mano che si faceva notte fonda, la città diventava silenziosa.|As the night grew late, the town became quieter.
傷は思ったほど深くなかったので、安心しました。|きずはおもったほどふかくなかったので、あんしんしました。|La ferita non era così profonda come pensavo, e mi sono tranquillizzato.|The cut wasn't as deep as I thought, which was a relief.
二人には長い間にできた深い信頼があります。|ふたりにはながいあいだにできたふかいしんらいがあります。|Tra loro c'è una profonda fiducia costruita nel tempo.|They share a deep trust built over many years.
この川は流れが速くて深いので、泳がないでください。|このかわはながれがはやくてふかいので、およがないでください。|Questo fiume ha una corrente forte ed è profondo, quindi non nuotare.|This river has a strong current and is deep, so don't swim in it.
調べれば調べるほど、歴史の深さに驚きます。|しらべればしらべるほど、れきしのふかさにおどろきます。|Più approfondisco la ricerca, più mi sorprende la complessità della storia.|The more I research, the more I'm amazed by the depth of history.
深く息を吸ってから、ゆっくり話し始めました。|ふかくいきをすってから、ゆっくりはなしはじめました。|Ho fatto un respiro profondo prima di iniziare a parlare lentamente.|I took a deep breath before beginning to speak slowly.
昨日の雪は予想より深く、道が見えませんでした。|きのうのゆきはよそうよりふかく、みちがみえませんでした。|La neve di ieri era più alta del previsto e non si vedeva la strada.|Yesterday's snow was deeper than expected, hiding the road.
@i|細かい|こまかい|minuto / dettagliato|fine / detailed|副詞形=細かく;て形=細かくて;否定形=細かくない;過去形=細かかった;否定過去=細かくなかった;条件形=細かければ
この地図は細かい道まで載っているので便利です。|このちずはこまかいみちまでのっているのでべんりです。|Questa mappa è utile perché mostra anche le stradine più piccole.|This map is useful because it shows even the smallest streets.
玉ねぎを細かく切ってから、鍋に入れてください。|たまねぎをこまかくきってから、なべにいれてください。|Taglia finemente la cipolla prima di metterla nella pentola.|Finely chop the onion before putting it in the pot.
先生の説明は細かくて、初心者には少し難しかったです。|せんせいのせつめいはこまかくて、しょしんしゃにはすこしむずかしかったです。|La spiegazione dell'insegnante era molto dettagliata e un po' difficile per i principianti.|The teacher's explanation was detailed and a little difficult for beginners.
細かい間違いを直すより、まず内容を確認しましょう。|こまかいまちがいをなおすより、まずないようをかくにんしましょう。|Invece di correggere i piccoli errori, controlliamo prima il contenuto.|Rather than fixing tiny mistakes, let's check the content first.
文字が細かすぎて、眼鏡なしでは読めません。|もじがこまかすぎて、めがねなしではよめません。|I caratteri sono troppo piccoli per leggerli senza occhiali.|The print is too fine to read without glasses.
予定を細かく決めすぎると、自由な時間がなくなります。|よていをこまかくきめすぎると、じゆうなじかんがなくなります。|Se pianifichi tutto nei minimi dettagli, non ti resta tempo libero.|If you plan everything in too much detail, you lose your free time.
この布は模様が細かく、とても丁寧に作られています。|このぬのはもようがこまかく、とてもていねいにつくられています。|Questo tessuto ha un motivo finissimo ed è lavorato con grande cura.|This fabric has a delicate pattern and is very carefully made.
細かいことを気にしない性格の友達がいます。|こまかいことをきにしないせいかくのともだちがいます。|Ho un amico che non si preoccupa dei piccoli dettagli.|I have a friend who doesn't worry about minor details.
雨が細かく降っていて、傘が必要か迷いました。|あめがこまかくふっていて、かさがひつようかまよいました。|Pioveva così finemente che non sapevo se servisse l'ombrello.|The rain was so fine that I wasn't sure whether I needed an umbrella.
前の説明ほど細かくなくても、要点が分かれば十分です。|まえのせつめいほどこまかくなくても、ようてんがわかればじゅうぶんです。|Non serve una spiegazione dettagliata quanto la precedente, purché si capiscano i punti essenziali.|It doesn't need to be as detailed as the previous explanation if the main points are clear.
@i|優しい|やさしい|gentile / premuroso|kind / gentle|副詞形=優しく;て形=優しくて;否定形=優しくない;過去形=優しかった;否定過去=優しくなかった;条件形=優しければ
道に迷ったとき、優しい人が駅まで案内してくれました。|みちにまよったとき、やさしいひとがえきまであんないしてくれました。|Quando mi sono perso, una persona gentile mi ha accompagnato alla stazione.|When I got lost, a kind person guided me to the station.
忙しい日でも、彼女は誰にでも優しく接します。|いそがしいひでも、かのじょはだれにでもやさしくせっします。|Anche nei giorni impegnativi, lei tratta tutti con gentilezza.|Even on busy days, she treats everyone kindly.
この先生は優しいですが、宿題には厳しいです。|このせんせいはやさしいですが、しゅくだいにはきびしいです。|Questo insegnante è gentile, ma è severo sui compiti.|This teacher is kind, but strict about homework.
弟が落ち込んでいたので、優しく声をかけました。|おとうとがおちこんでいたので、やさしくこえをかけました。|Mio fratello minore era giù di morale, così gli ho parlato con dolcezza.|My younger brother was feeling down, so I spoke to him gently.
優しい言葉だけでは、問題が解決しないこともあります。|やさしいことばだけでは、もんだいがかいけつしないこともあります。|A volte le sole parole gentili non bastano a risolvere un problema.|Kind words alone don't always solve a problem.
祖母の声は昔から優しくて、聞くと安心します。|そぼのこえはむかしからやさしくて、きくとあんしんします。|La voce di mia nonna è sempre stata dolce, e sentirla mi rassicura.|My grandmother's voice has always been gentle, and hearing it reassures me.
疲れているときほど、自分にも優しくしたいです。|つかれているときほど、じぶんにもやさしくしたいです。|Proprio quando sono stanco, voglio essere gentile anche con me stesso.|Especially when I'm tired, I want to be kind to myself too.
見た目は怖そうでしたが、話すととても優しい人でした。|みためはこわそうでしたが、はなすととてもやさしいひとでした。|Sembrava una persona spaventosa, ma parlando era molto gentile.|They looked intimidating, but turned out to be very kind when we talked.
優しく注意すれば、子どもも理由を理解してくれます。|やさしくちゅういすれば、こどももりゆうをりかいしてくれます。|Se lo richiami con gentilezza, anche un bambino capirà il motivo.|If you correct them gently, children can understand the reason too.
みんなに優しくしようとして、自分の予定を後回しにしました。|みんなにやさしくしようとして、じぶんのよていをあとまわしにしました。|Nel tentativo di essere gentile con tutti, ho messo da parte i miei impegni.|Trying to be kind to everyone, I put my own plans aside.
@i|正しい|ただしい|corretto / giusto|correct / right|副詞形=正しく;て形=正しくて;否定形=正しくない;過去形=正しかった;否定過去=正しくなかった;条件形=正しければ
辞書で調べて、漢字の正しい読み方を確認しました。|じしょでしらべて、かんじのただしいよみかたをかくにんしました。|Ho controllato sul dizionario la lettura corretta del kanji.|I checked the correct reading of the kanji in a dictionary.
正しい答えでも、理由を説明できることが大切です。|ただしいこたえでも、りゆうをせつめいできることがたいせつです。|Anche con la risposta giusta, è importante saperne spiegare il motivo.|Even with the correct answer, it's important to be able to explain why.
機械を正しく使わないと、危険な場合があります。|きかいをただしくつかわないと、きけんなばあいがあります。|Se non usi correttamente il macchinario, in certi casi può essere pericoloso.|If you don't use the machine correctly, it can be dangerous.
昨日の説明は一部正しくありませんでした。|きのうのせつめいはいちぶただしくありませんでした。|Una parte della spiegazione di ieri non era corretta.|Part of yesterday's explanation was incorrect.
自分が正しいと思っても、相手の意見を聞きましょう。|じぶんがただしいとおもっても、あいてのいけんをききましょう。|Anche se pensi di avere ragione, ascolta l'opinione dell'altro.|Even if you think you're right, listen to the other person's opinion.
正しい順番に並べれば、機械は動きます。|ただしいじゅんばんにならべれば、きかいはうごきます。|Se metti i pezzi nell'ordine giusto, la macchina funziona.|If you arrange the parts in the correct order, the machine works.
その情報が正しいかどうか、別の資料でも確かめました。|そのじょうほうがただしいかどうか、べつのしりょうでもたしかめました。|Ho verificato anche con un'altra fonte se quell'informazione fosse corretta.|I checked another source to see whether that information was correct.
正しく伝えたつもりでも、誤解されることがあります。|ただしくつたえたつもりでも、ごかいされることがあります。|Anche quando credi di esserti spiegato correttamente, a volte vieni frainteso.|Even when you think you've explained it correctly, you can be misunderstood.
答えは正しかったのに、計算の途中を間違えました。|こたえはただしかったのに、けいさんのとちゅうをまちがえました。|La risposta era giusta, eppure ho sbagliato un passaggio del calcolo.|The answer was correct, yet I made a mistake during the calculation.
正しい発音を覚えるために、何度も音声を聞きました。|ただしいはつおんをおぼえるために、なんどもおんせいをききました。|Ho ascoltato molte volte l'audio per imparare la pronuncia corretta.|I listened to the audio many times to learn the correct pronunciation.
@i|珍しい|めずらしい|raro / insolito|rare / unusual|副詞形=珍しく;て形=珍しくて;否定形=珍しくない;過去形=珍しかった;否定過去=珍しくなかった;条件形=珍しければ
この町では、雪が積もるのは珍しいことです。|このまちでは、ゆきがつもるのはめずらしいことです。|In questa città è raro che la neve si accumuli.|It's unusual for snow to accumulate in this town.
旅行中に珍しい鳥を見つけて、写真を撮りました。|りょこうちゅうにめずらしいとりをみつけて、しゃしんをとりました。|Durante il viaggio ho trovato un uccello raro e l'ho fotografato.|I spotted a rare bird while traveling and took a photo.
彼が朝早く来るなんて、今日は珍しいですね。|かれがあさはやくくるなんて、きょうはめずらしいですね。|È insolito che lui arrivi così presto la mattina.|It's unusual for him to arrive so early in the morning.
この料理には、珍しい香辛料が使われています。|このりょうりには、めずらしいこうしんりょうがつかわれています。|In questo piatto si usa una spezia insolita.|An unusual spice is used in this dish.
珍しく父が夕食を作ってくれたので、驚きました。|めずらしくちちがゆうしょくをつくってくれたので、おどろきました。|Mi ha sorpreso che, insolitamente, mio padre avesse preparato la cena.|I was surprised because my father cooked dinner for once.
外国では普通でも、日本では珍しい習慣があります。|がいこくではふつうでも、にほんではめずらしいしゅうかんがあります。|Alcune usanze comuni all'estero sono rare in Giappone.|Some customs common abroad are unusual in Japan.
祖父からもらった珍しい時計を、大切にしています。|そふからもらっためずらしいとけいを、たいせつにしています。|Conservo con cura un raro orologio ricevuto da mio nonno.|I treasure an unusual watch my grandfather gave me.
最近は珍しくなくなった技術も、昔は夢のようでした。|さいきんはめずらしくなくなったぎじゅつも、むかしはゆめのようでした。|Anche tecnologie ormai comuni sembravano un sogno in passato.|Even technology that's common now once seemed like a dream.
珍しい形の雲が出ていたので、空を見上げました。|めずらしいかたちのくもがでていたので、そらをみあげました。|Ho alzato gli occhi al cielo perché c'era una nuvola dalla forma insolita.|I looked up because there was an unusually shaped cloud.
そんな経験は珍しくないと聞いて、少し安心しました。|そんなけいけんはめずらしくないときいて、すこしあんしんしました。|Sapere che un'esperienza del genere non è rara mi ha rassicurato un po'.|I felt a little reassured to hear that such experiences aren't rare.
'''
items=[]
cur=None
for line_no,line in enumerate(raw.strip().splitlines(),1):
    line=line.strip()
    if not line: continue
    if line.startswith('@'):
        s=line[1:].split('|')
        assert len(s)==6,(line_no,line)
        if cur: items.append(cur)
        pos,jp,kana,it,en,forms=s
        cur=dict(id=len(items)+1,pos=pos,jp=jp,kana=kana,meaning={'it':it,'en':en},forms=[{'label':x.split('=')[0],'jp':x.split('=')[1]} for x in forms.split(';')],examples=[])
    else:
        s=line.split('|')
        assert len(s)==4,(line_no,len(s),line)
        jp,kana,it,en=s
        assert jp.endswith('。') or jp.endswith('か。') or jp.endswith('？'),(line_no,jp)
        cur['examples'].append(dict(jp=jp,kana=kana,it=it,en=en))
if cur: items.append(cur)
assert len(items)==25,len(items)
from collections import Counter
assert Counter(i['pos'] for i in items)=={'verb':10,'noun':5,'na':5,'i':5}
assert all(len(i['examples'])==10 for i in items),[(i['jp'],len(i['examples'])) for i in items]
assert sum(len(i['examples']) for i in items)==250
(root/'vocab.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
print('Wrote',len(items),'terms /',sum(len(x['examples']) for x in items),'examples;', (root/'vocab.json').stat().st_size,'bytes')
