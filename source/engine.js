/* Kotoba Drive v0.4 alpha 1 - testable, framework-free audio core. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (root) root.KotobaCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TYPES = ['word', 'meaning', 'forms', 'exampleJP', 'exampleNative'];
  const PARAMS = {rate: [0.1, 10], pitch: [0, 2], volume: [0, 1]};
  const MASTER_DEFAULTS = Object.freeze({
    'ja-JP': {rate: 1, pitch: 1, volume: 1},
    'it-IT': {rate: 1, pitch: 1, volume: 1},
    'en-US': {rate: 1, pitch: 1, volume: 1}
  });
  const clamp = (value, min, max, fallback) => {
    const n = Number(value);
    return value !== '' && value !== null && value !== undefined && Number.isFinite(n)
      ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const milliseconds = (value, fallback = 0) => Math.round(clamp(value, 0, 60000, fallback));
  const secondsToMs = (value) => Math.round(clamp(value, 0, 60, 0) * 1000);
  const copy = value => JSON.parse(JSON.stringify(value));
  let nextId = 0;
  const makeId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(++nextId).toString(36)}`;
  const audioMasters = (incoming) => {
    const out = {};
    for (const lang of Object.keys(MASTER_DEFAULTS)) {
      out[lang] = {};
      for (const [param, limits] of Object.entries(PARAMS)) {
        out[lang][param] = clamp(incoming?.[lang]?.[param], ...limits, MASTER_DEFAULTS[lang][param]);
      }
    }
    return out;
  };
  const overrides = o => {
    const result = {};
    if (!o || typeof o !== 'object') return result;
    for (const [param, [min, max]] of Object.entries(PARAMS)) {
      if (o[param] !== undefined && o[param] !== null && o[param] !== '') {
        result[param] = clamp(o[param], min, max, 1);
      }
    }
    return result;
  };
  function resolveSpeechSettings(language, groupPath, element, masters) {
    const master = audioMasters(masters);
    const lang = master[language] ? language : 'ja-JP';
    const values = {...master[lang]};
    const sources = {rate: 'master', pitch: 'master', volume: 'master'};
    for (const group of groupPath || []) {
      for (const [key, val] of Object.entries(overrides(group.audioOverrides))) {
        values[key] = val;
        sources[key] = `group:${group.id || '?'}`;
      }
    }
    for (const [key, val] of Object.entries(overrides(element?.audioOverrides))) {
      values[key] = val;
      sources[key] = `element:${element.id || '?'}`;
    }
    return {lang, ...values, sources};
  }
  function normalizeItem(raw = {}) {
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : makeId('element'),
      type: TYPES.includes(raw.type) ? raw.type : 'word',
      enabled: raw.enabled !== false,
      repeat: clamp(raw.repeat ?? raw.repeats, 1, 10, 1),
      pauseBetweenRepeatsMs: raw.pauseBetweenRepeatsMs == null ? null : milliseconds(raw.pauseBetweenRepeatsMs),
      pauseAfterElementMs: milliseconds(raw.pauseAfterElementMs, secondsToMs(raw.after)),
      audioOverrides: overrides(raw.audioOverrides)
    };
  }
  function normalizeGroup(raw = {}) {
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : makeId('group'),
      name: String(raw.name || 'Gruppo').slice(0, 60),
      enabled: raw.enabled !== false,
      repeat: clamp(raw.repeat ?? raw.repeats, 1, 10, 1),
      pauseBetweenGroupRepeatsMs: raw.pauseBetweenGroupRepeatsMs === undefined ? secondsToMs(raw.after) : milliseconds(raw.pauseBetweenGroupRepeatsMs),
      pauseAfterGroupMs: milliseconds(raw.pauseAfterGroupMs, secondsToMs(raw.after)),
      audioOverrides: overrides(raw.audioOverrides),
      items: (Array.isArray(raw.items) ? raw.items : Array.isArray(raw.elements) ? raw.elements : []).slice(0, 30).map(normalizeItem)
    };
  }
  function normalizeSequence(raw = {}, direction = 'jp-native') {
    return {
      schemaVersion: 2,
      sequenceId: String(raw.sequenceId || makeId('sequence')),
      direction: ['jp-native', 'native-jp'].includes(raw.direction) ? raw.direction : direction,
      name: String(raw.name || (direction === 'jp-native' ? 'Base · JP → lingua madre' : 'Base · lingua madre → JP')).slice(0, 60),
      description: String(raw.description || '').slice(0, 200),
      groups: (Array.isArray(raw.groups) ? raw.groups : []).slice(0, 25).map(normalizeGroup)
    };
  }
  function makeDefault(direction) {
    const first = direction === 'jp-native' ? 'word' : 'meaning';
    const second = direction === 'jp-native' ? 'meaning' : 'word';
    const group = (name, types, afterMs) => ({id: makeId('group'), name, repeat: 1, pauseAfterGroupMs: afterMs,
      items: types.map(type => ({id: makeId('element'), type, repeat: 1}))});
    return normalizeSequence({name: direction === 'jp-native' ? 'Base · giapponese prima' : 'Base · lingua madre prima',
      direction, groups: [group('01 · Domanda', [first], 4000), group('02 · Risposta', [second], 750),
        group('03 · Forme', ['forms'], 600), group('04 · Esempi', ['exampleJP', 'exampleNative'], 650)]}, direction);
  }
  function makeRepeat(direction) {
    const base = makeDefault(direction);
    base.name = 'Ripasso intensivo · ×3';
    base.groups[0].name = 'Ripasso · parola ×2, gruppo ×3';
    base.groups[0].repeat = 3;
    base.groups[0].items = [normalizeItem({type: 'word', repeat: 2}), normalizeItem({type: 'meaning'})];
    base.groups[0].pauseBetweenGroupRepeatsMs = 1000;
    base.groups[0].pauseAfterGroupMs = 1000;
    base.groups.splice(1, 1);
    return base;
  }
  class SequenceRepository {
    constructor(raw, legacy) {
      this.sequences = [];
      this.activeByDirection = {};
      if (raw && Array.isArray(raw.sequences)) {
        this.sequences = raw.sequences.slice(0, 100).map(s => normalizeSequence(s, s.direction));
        this.activeByDirection = {...raw.activeByDirection};
      } else if (legacy && typeof legacy === 'object') {
        for (const direction of ['jp-native', 'native-jp']) {
          if (Array.isArray(legacy[direction]?.groups)) {
            const migrated = normalizeSequence(legacy[direction], direction);
            this.sequences.push(migrated);
            this.activeByDirection[direction] = migrated.sequenceId;
          }
        }
      }
      for (const direction of ['jp-native', 'native-jp']) {
        if (!this.sequences.some(s => s.direction === direction)) this.sequences.push(makeDefault(direction));
        if (!this.sequences.some(s => s.direction === direction && s.sequenceId === this.activeByDirection[direction])) {
          this.activeByDirection[direction] = this.sequences.find(s => s.direction === direction).sequenceId;
        }
      }
    }
    list(direction) { return this.sequences.filter(s => s.direction === direction); }
    active(direction) { return this.sequences.find(s => s.sequenceId === this.activeByDirection[direction] && s.direction === direction) || this.list(direction)[0]; }
    select(direction, id) { if (!this.list(direction).some(s => s.sequenceId === id)) return false; this.activeByDirection[direction] = id; return true; }
    create(direction, raw = null) {
      const seq = raw ? normalizeSequence(raw, direction) : makeDefault(direction);
      seq.sequenceId = makeId('sequence'); seq.direction = direction;
      this.sequences.push(seq); this.select(direction, seq.sequenceId); return seq;
    }
    duplicate(direction, id) {
      const src = this.list(direction).find(s => s.sequenceId === id); if (!src) return null;
      const cloned = copy(src); cloned.name = `${src.name} · copia`.slice(0, 60);
      cloned.sequenceId = makeId('sequence');
      cloned.groups.forEach(g => { g.id = makeId('group'); g.items.forEach(el => { el.id = makeId('element'); }); });
      return this.create(direction, cloned);
    }
    remove(direction, id) {
      if (this.list(direction).length <= 1) return false;
      if (!this.list(direction).some(s => s.sequenceId === id)) return false;
      this.sequences = this.sequences.filter(s => s.sequenceId !== id);
      if (this.activeByDirection[direction] === id) this.activeByDirection[direction] = this.list(direction)[0].sequenceId;
      return true;
    }
    reset(direction, repeat = false) {
      const preset = repeat ? makeRepeat(direction) : makeDefault(direction);
      const target = this.active(direction); preset.sequenceId = target.sequenceId;
      const idx = this.sequences.indexOf(target); this.sequences[idx] = preset; return preset;
    }
    serialize() { return copy({schemaVersion: 2, sequences: this.sequences, activeByDirection: this.activeByDirection}); }
  }
  /* A compiled event plan is immutable in practice: the UI never changes it while playing. */
  function compileSequence(word, sequence, opts = {}) {
    const plan = [];
    const chapters = [];
    const native = opts.nativeLanguage === 'en' ? 'en' : 'it';
    const nativeLang = native === 'it' ? 'it-IT' : 'en-US';
    const maxExamples = Math.round(clamp(opts.exampleCount, 0, 10, 1));
    const forms = opts.formCount === 'all' || opts.formCount === undefined ? (word.forms || []) : (word.forms || []).slice(0, clamp(opts.formCount, 0, 30, 1));
    const startExample = ((Number(opts.startExample) || 0) % (word.examples?.length || 1) + (word.examples?.length || 1)) % (word.examples?.length || 1);
    const betweenMs = milliseconds(opts.pauseBetweenElementsMs, 400);
    const masters = audioMasters(opts.audioMasters);
    let sayCount = 0; let pendingMs = 0; let pendingReasons = []; let prevElementKey = null;
    const pending = (ms, reason) => { if (ms > 0) { pendingMs += ms; pendingReasons.push(reason); } };
    const push = (kind, fields = {}) => plan.push({eventId: `event-${String(plan.length + 1).padStart(5, '0')}`, kind, ...fields});
    const flush = () => { if (pendingMs > 0 && sayCount > 0) push('pause', {ms: pendingMs, seconds: pendingMs / 1000, description: pendingReasons.join(' + '), reasons: [...pendingReasons]}); pendingMs = 0; pendingReasons = []; };
    function speak(text, lang, type, label, group, token, groupRepeat, elementRepeat, exIndex = null, formIndex = null) {
      if (typeof text !== 'string' || !text.trim()) return;
      flush();
      const audio = resolveSpeechSettings(lang, [group], token, masters);
      push('say', {text, lang, type, label, exIndex, formIndex, settings: audio,
        path: {groupId: group.id, elementId: token.id, groupRepeat, elementRepeat, exIndex, formIndex}});
      sayCount++;
    }
    function emit(token, group, gr, er, index) {
      const speakType = (text, lang, type, label, exIndex = null, formIndex = null) => {
        speak(text, lang, type, label, group, token, gr, er, exIndex, formIndex);
      };
      switch (token.type) {
        case 'word': speakType(word.jp, 'ja-JP', 'word', word.jp); break;
        case 'meaning': speakType(word.meaning?.[native], nativeLang, 'meaning', word.meaning?.[native]); break;
        case 'forms': {
          forms.forEach((f, fi) => {
            if (fi > 0) pending(betweenMs, 'inside-forms');
            if (opts.announceForms !== false) {
              const label = typeof opts.formName === 'function' ? opts.formName(f.label, word, native) : f.label;
              speakType(label, nativeLang, 'formLabel', label, null, fi);
              pending(betweenMs, 'inside-forms');
            }
            speakType(f.jp, 'ja-JP', 'form', f.jp, null, fi);
          });
          break;
        }
        case 'exampleJP': {
          const ex = word.examples?.[index];
          if (ex) speakType(ex.jp, 'ja-JP', 'exampleJP', `例${index + 1}: ${ex.jp}`, index);
          break;
        }
        case 'exampleNative': {
          const ex = word.examples?.[index];
          if (ex) speakType(ex[native], nativeLang, 'exampleNative', `E${index + 1}: ${ex[native]}`, index);
          break;
        }
      }
    }
    const emitToken = (token, group, gr, idx) => {
      const count = Math.round(clamp(token.repeat, 1, 10, 1));
      for (let r = 0; r < count; r++) {
        const key = `${group.id}/${token.id}/${gr}/${idx}`;
        if (r > 0) pending(token.pauseBetweenRepeatsMs === null ? betweenMs : milliseconds(token.pauseBetweenRepeatsMs), 'between-element-repeats');
        else if (prevElementKey !== null && prevElementKey !== key) pending(betweenMs, 'between-elements');
        emit(token, group, gr, r, idx);
        prevElementKey = key;
      }
      pending(milliseconds(token.pauseAfterElementMs), 'after-element');
    };
    for (const group of (sequence?.groups || []).slice(0, 25)) {
      if (group.enabled === false) continue;
      const playable = token => {
        if (token.type === 'word') return !!word.jp;
        if (token.type === 'meaning') return !!word.meaning?.[native];
        if (token.type === 'forms') return forms.some(f => !!f.jp);
        if (['exampleJP','exampleNative'].includes(token.type)) return maxExamples > 0 && (word.examples || []).some(e => !!(token.type === 'exampleJP' ? e.jp : e[native]));
        return false;
      };
      const items = (group.items || []).filter(item => item.enabled !== false && TYPES.includes(item.type) && playable(item));
      if (!items.length || !items.some(x => !['exampleJP', 'exampleNative'].includes(x.type) || maxExamples > 0)) continue;
      if (sayCount > 0) { pending(betweenMs, 'between-elements'); flush(); }
      prevElementKey = null;
      const startPos = plan.length; const previousCount = sayCount;
      // Pending pauses from previous chapter are only flushed when this chapter actually speaks.
      const chapter = {id: group.id, title: group.name, groupId: group.id, startEventIndex: plan.length, endEventIndex: -1};
      push('chapterStart', {chapterId: group.id, title: group.name, path: {groupId: group.id}});
      for (let gr = 0; gr < Math.round(clamp(group.repeat, 1, 10, 1)); gr++) {
        if (gr > 0) pending(milliseconds(group.pauseBetweenGroupRepeatsMs), 'between-group-repeats');
        for (let j = 0; j < items.length;) {
          if (['exampleJP', 'exampleNative'].includes(items[j].type)) {
            const tokens = [];
            while (j < items.length && ['exampleJP', 'exampleNative'].includes(items[j].type)) tokens.push(items[j++]);
            const count = Math.min(maxExamples, word.examples?.length || 0);
            for (let k = 0; k < count; k++) {
              const idx = (startExample + k) % word.examples.length;
              for (const token of tokens) emitToken(token, group, gr, idx);
            }
          } else { emitToken(items[j], group, gr, null); j++; }
        }
      }
      if (sayCount === previousCount) {
        // Do not create empty chapters even for elements without realizable speech.
        plan.splice(startPos); continue;
      }
      chapter.endEventIndex = plan.length;
      push('chapterEnd', {chapterId: group.id, title: group.name, path: {groupId: group.id}});
      chapters.push(chapter);
      pending(milliseconds(group.pauseAfterGroupMs), 'after-group');
    }
    // Intentionally discard tail pauses: don't leave residual silence after the final chapter.
    if (sayCount) push('cardComplete', {cardId: word.id});
    return {plan, chapters, sayCount};
  }
  class SequenceCompiler {
    compile(word, sequence, options) { return compileSequence(word, sequence, options); }
  }
  class SpeechAdapter {
    constructor(synth, Utterance, voiceSelector = () => null, report = () => {}, scheduler = globalThis) {
      this.synth = synth; this.Utterance = Utterance; this.voiceSelector = voiceSelector; this.report = report;
      this.scheduler = scheduler; this.pending = null;
    }
    cancel() {
      const p = this.pending; if (p) p.finish('canceled');
      if (this.synth?.cancel) { try { this.synth.cancel(); } catch (_) {} }
    }
    speak(event, onStarted = () => {}) {
      return new Promise(resolve => {
        if (!this.synth || !this.Utterance) { this.report('unavailable'); resolve('unavailable'); return; }
        const utterance = new this.Utterance(String(event.text));
        const settings = event.settings || {rate: 1, pitch: 1, volume: 1};
        utterance.lang = event.lang;
        utterance.rate = settings.rate; utterance.pitch = settings.pitch; utterance.volume = settings.volume;
        const voice = this.voiceSelector(event.lang); if (voice) utterance.voice = voice;
        let finished = false; let timer = null;
        const obj = {finish: status => {
          if (finished) return;
          finished = true;
          if (timer !== null) this.scheduler.clearTimeout(timer);
          if (this.pending === obj) this.pending = null;
          resolve(status);
        }};
        this.pending = obj;
        utterance.onstart = () => { if (!finished) onStarted(event); };
        utterance.onend = () => obj.finish('done');
        utterance.onerror = e => { if (e.error && !['canceled', 'interrupted'].includes(e.error)) this.report(`TTS: ${e.error}`); obj.finish('error'); };
        const maxWait = Math.min(60000, Math.max(6500, (3000 + String(event.text).length * 250) / Math.max(0.5, utterance.rate)));
        timer = this.scheduler.setTimeout(() => {
          if (this.pending !== obj) return;
          this.report(`TTS timeout: ${event.lang}`);
          obj.finish('timeout');
          try { this.synth.cancel?.(); } catch (_) {}
        }, maxWait);
        try { this.synth.resume?.(); this.synth.speak(utterance); }
        catch (e) { this.report(`TTS error: ${e.message}`); obj.finish('error'); }
      });
    }
  }
  class PlaybackController {
    constructor({speech, scheduler = globalThis, onEvent = () => {}, onComplete = () => {}, onState = () => {}, onSpeechResult = () => {}, onSpeechStart = () => {}, onFailure = () => {}}) {
      this.speech = speech; this.scheduler = scheduler; this.onEvent = onEvent; this.onComplete = onComplete; this.onState = onState; this.onSpeechResult = onSpeechResult; this.onSpeechStart = onSpeechStart; this.onFailure = onFailure;
      this.plan = null; this.index = 0; this.status = 'idle'; this.generation = 0; this.waiter = null; this.pausedPauseRemainingMs = null;
    }
    clear() {
      this.generation++;
      if (this.waiter) { const w = this.waiter; this.waiter = null; this.scheduler.clearTimeout(w.timer); w.resolve(); }
      this.speech.cancel();
    }
    clockNow() { return typeof this.scheduler.now === 'function' ? this.scheduler.now() : Date.now(); }
    stop() { this.clear(); this.plan = null; this.index = 0; this.pausedPauseRemainingMs = null; this.status = 'idle'; this.onState('idle'); }
    pause() { if (this.status !== 'playing') return; this.pausedPauseRemainingMs = this.waiter ? Math.max(0, this.waiter.endsAt - this.clockNow()) : null; this.clear(); this.status = 'paused'; this.onState('paused'); }
    start(plan, startIndex = 0) {
      this.clear(); this.pausedPauseRemainingMs = null; this.plan = plan;
      this.index = Math.max(0, Math.min(plan.length, startIndex)); this.status = 'playing'; this.onState('playing');
      this.run(this.generation); return true;
    }
    resume() { if (this.status !== 'paused' || !this.plan) return false; this.status = 'playing'; this.onState('playing'); this.run(this.generation); return true; }
    wait(ms) { return new Promise(resolve => { const w = {resolve, timer: null, endsAt: this.clockNow() + ms}; w.timer = this.scheduler.setTimeout(() => { if (this.waiter === w) this.waiter = null; resolve(); }, ms); this.waiter = w; }); }
    async run(token) {
      while (this.status === 'playing' && token === this.generation && this.index < this.plan.length) {
        const event = this.plan[this.index]; this.onEvent(event, this.index);
        if (event.kind === 'say') {
          let result;
          try { result = await this.speech.speak(event, step => {
            if (token === this.generation && this.status === 'playing') this.onSpeechStart(step);
          }); } catch (_) { result = 'error'; }
          if (token !== this.generation || this.status !== 'playing') return;
          this.onSpeechResult(event, result);
          if (result !== 'done') {
            this.status = 'failed'; this.plan = null; this.onState('failed');
            this.onFailure(result, event, this.index);
            return;
          }
        }
        if (event.kind === 'pause') { const remaining = this.pausedPauseRemainingMs; this.pausedPauseRemainingMs = null; await this.wait(remaining === null ? event.ms : remaining); }
        if (token !== this.generation || this.status !== 'playing') return;
        this.index++;
      }
      if (token === this.generation && this.status === 'playing') {
        this.status = 'idle'; this.plan = null; this.onState('idle'); this.onComplete();
      }
    }
  }
  class NavigationController {
    static move(chapters, index, direction) {
      if (!chapters?.length) return {deltaCard: 0, chapterIndex: 0};
      const next = index + (direction > 0 ? 1 : -1);
      if (next < 0) return {deltaCard: -1, chapterIndex: -1};
      if (next >= chapters.length) return {deltaCard: 1, chapterIndex: 0};
      return {deltaCard: 0, chapterIndex: next};
    }
  }
  class MediaSessionAdapter {
    constructor(session, notify) { this.session = session; this.notify = notify || (() => {}); }
    install(handlers) {
      if (!this.session?.setActionHandler) return false;
      for (const [action, handler] of Object.entries(handlers)) {
        try { this.session.setActionHandler(action, info => { this.notify(action, info); handler(info || {}); }); }
        catch (e) { this.notify(`unsupported:${action}`, e); }
      }
      return true;
    }
  }
  return {TYPES, PARAMS, MASTER_DEFAULTS, audioMasters, overrides, resolveSpeechSettings,
    normalizeItem, normalizeGroup, normalizeSequence, makeDefault, makeRepeat,
    SequenceRepository, SequenceCompiler, compileSequence, SpeechAdapter, PlaybackController,
    NavigationController, MediaSessionAdapter, makeId, milliseconds};
});
