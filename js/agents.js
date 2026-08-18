// js/agents.js
// Sarideo uchun serversiz, xatoga chidamli agentlar oqimi.

(function (root) {
  'use strict';

  const AGENT_NAMES = ['director', 'imagesmith', 'choreographer', 'subtitler', 'publisher', 'rewriter'];

  function cleanTopic(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  }

  function errorText(error) {
    return error && error.message ? error.message : 'Noma’lum xatolik';
  }

  function settingsFrom(options) {
    const opts = options && typeof options === 'object' ? options : {};
    let saved = {};
    try {
      if (root.Store && typeof root.Store.getSettings === 'function') saved = root.Store.getSettings() || {};
    } catch (_) { /* Sozlamalar buzilgan bo‘lsa ham demo ishlashi kerak. */ }
    return Object.assign({}, saved, opts, opts.api || {});
  }

  function getKey(settings, provider) {
    if (provider === 'openai') return settings.openaiKey || settings.apiKey || '';
    return settings.geminiKey || settings.googleKey || settings.apiKey || '';
  }

  // Gemini va OpenAI javoblaridan matnni bir xil ko‘rinishda oladi.
  function responseText(response) {
    if (!response || response.error) return '';
    if (typeof response === 'string') return response;
    if (response.choices && response.choices[0]) {
      const content = response.choices[0].message && response.choices[0].message.content;
      return typeof content === 'string' ? content : '';
    }
    const parts = response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts;
    return Array.isArray(parts) ? parts.map(p => p && p.text || '').join('') : '';
  }

  function balancedObject(text) {
    const source = String(text || '').replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try { return JSON.parse(source); } catch (_) { /* Pastdagi qidiruv fallback. */ }
    const start = source.search(/[\[{]/);
    if (start < 0) return null;
    const opening = source[start];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0; let quoted = false; let escaped = false;
    for (let i = start; i < source.length; i += 1) {
      const ch = source[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') quoted = false;
        continue;
      }
      if (ch === '"') quoted = true;
      else if (ch === opening) depth += 1;
      else if (ch === closing && --depth === 0) {
        try { return JSON.parse(source.slice(start, i + 1)); } catch (_) { return null; }
      }
    }
    return null;
  }

  function demoScenes(topic, duration) {
    const length = Number(duration) || 60;
    return [
      { id: 1, duration: 6, title: 'Kirish', narration: `${topic} haqida qisqa va qiziqarli hikoya.`, visual: 'Mavzuga mos kuchli ochilish kadri', transition: 'Tezkor fade' },
      { id: 2, duration: 12, title: 'Kontekst', narration: 'Avval uning mazmuni va ahamiyatini tushunib olaylik.', visual: 'Muhim joy yoki detalning yaqin plani', transition: 'Match cut' },
      { id: 3, duration: 16, title: 'Asosiy g‘oya', narration: 'Eng muhim faktlar sodda misollar va jonli tasvirlar bilan beriladi.', visual: 'Harakatdagi qahramonlar, faktlar uchun grafikalar', transition: 'Panorama' },
      { id: 4, duration: 16, title: 'Kashfiyot', narration: 'Bu mavzuni boshqalardan ajratib turadigan jihat aynan shunda.', visual: 'Kinematik keng plan va tabiiy yorug‘lik', transition: 'Dissolve' },
      { id: 5, duration: Math.max(4, length - 50), title: 'Yakun', narration: 'Sizningcha, bu mavzudagi eng qiziq jihat qaysi? Fikr qoldiring.', visual: 'Yakuniy ramz va chaqiriq matni', transition: 'Fade out' }
    ];
  }

  function normalizeScenes(value, topic, duration) {
    const list = Array.isArray(value) ? value : (value && Array.isArray(value.scenes) ? value.scenes : []);
    if (!list.length) return demoScenes(topic, duration);
    return list.slice(0, 12).map((scene, index) => Object.assign({
      id: index + 1, duration: 8, title: `Sahna ${index + 1}`, narration: '', visual: '', transition: 'Oddiy kesish'
    }, scene || {}, { id: index + 1 }));
  }

  function directorPrompt(topic, options) {
    return `Sen Sarideo uchun o‘zbekcha video rejissyorisan. Mavzu: "${topic}". Format: ${options.format || 'Shorts'}, davomiylik: ${options.duration || 60} soniya. Qahramon: ${options.hero || 'Avtomatik'}. Ovoz: ${options.voice || 'O‘zbekcha — erkak'}. Vizual uslub: ${options.visualStyle || 'Kinematik, realistik'}. Subtitr: ${options.subtitles || 'O‘zbekcha'}. Faqat JSON qaytar, markdown ishlatma. Ko‘rinish: {"title":"...","hook":"...","scenes":[{"title":"...","duration":10,"narration":"...","visual":"...","transition":"..."}]}. 4-8 ta sahna yarat, fakt uydirma qilma, ovoz matni tabiiy va qisqa bo‘lsin.`;
  }

  async function askDirector(topic, options, settings) {
    const provider = String(settings.provider || settings.apiProvider || (settings.openaiKey ? 'openai' : 'gemini')).toLowerCase();
    const key = getKey(settings, provider === 'openai' ? 'openai' : 'gemini');
    if (!key || !root.Api) return null;
    const prompt = directorPrompt(topic, options);
    let response;
    if (provider === 'openai' && typeof root.Api.openaiChat === 'function') {
      response = await root.Api.openaiChat(prompt, key, settings.openaiEndpoint || settings.endpoint);
    } else if (typeof root.Api.gemini === 'function') {
      response = await root.Api.gemini(prompt, key, settings.geminiEndpoint);
    }
    return balancedObject(responseText(response));
  }

  function imagesmith(scenes, topic, options) {
    const style = options.visualStyle || 'Kinematik, realistik';
    const hero = options.hero || 'Avtomatik';
    const heroReference = options.heroImage ? 'user-provided character reference image, preserve identity and costume' : 'consistent character design across every scene';
    const ratio = options.format === 'Landscape · 16:9' ? 'horizontal 16:9' : options.format === 'Square · 1:1' ? 'square 1:1' : 'vertical 9:16';
    return scenes.map(scene => Object.assign({}, scene, {
      imagePrompt: `${ratio} ${style} frame, ${hero}, ${heroReference}, ${scene.visual || scene.title}, mavzu: ${topic}, tabiiy ranglar, no text, high detail`
    }));
  }

  function choreographer(scenes) {
    return scenes.map((scene, index) => Object.assign({}, scene, {
      shot: index % 3 === 0 ? 'Keng plan' : index % 3 === 1 ? 'O‘rta plan' : 'Yaqin plan',
      camera: index % 2 ? 'Sekin kamera harakati' : 'Barqaror kamera',
      transition: scene.transition || 'Oddiy kesish'
    }));
  }

  function subtitler(scenes) {
    return scenes.map(scene => Object.assign({}, scene, {
      subtitle: scene.narration || scene.title,
      subtitleStyle: 'Oq matn, qora yarim shaffof fon'
    }));
  }

  function publisher(topic, director, options) {
    return {
      title: director.title || topic,
      description: `"${topic}" mavzusida Sarideo tayyorlagan qisqa video.`,
      hashtags: ['#Sarideo', '#video', '#shorts'],
      format: options.format || 'Shorts · 9:16',
      duration: Number(options.duration) || 60
    };
  }

  function rewriter(scenes) {
    return scenes.map(scene => Object.assign({}, scene, {
      finalNarration: scene.narration || scene.subtitle || scene.title,
      voiceNote: 'O‘zbekcha, ravon va ishonchli ohangda o‘qilsin.'
    }));
  }

  async function create(topic, options) {
    const subject = cleanTopic(topic);
    if (!subject) throw new Error('Mavzu bo‘sh bo‘lishi mumkin emas.');
    const opts = Object.assign({ format: 'Shorts · 9:16', duration: 60 }, options || {});
    const settings = settingsFrom(opts);
    const agents = {};
    AGENT_NAMES.forEach(name => { agents[name] = { status: 'pending', error: null }; });
    const selectedProvider = String(settings.provider || settings.apiProvider || (settings.openaiKey ? 'openai' : 'gemini')).toLowerCase();
    const result = { topic: subject, createdAt: new Date().toISOString(), agents, scenes: [], metadata: null, demo: !getKey(settings, selectedProvider === 'openai' ? 'openai' : 'gemini'), media: { heroImage: opts.heroImage || '', images: [], voice: opts.voice === 'Ovozsiz' ? 'off' : 'pending', subtitles: opts.subtitles === 'O‘chirilgan' ? 'off' : 'ready', video: 'not-created', note: 'Rasm va ovoz provider API’si ulanmaguncha prompt va preview holatida.' } };
    let director = {};
    const run = async (name, task) => {
      agents[name].status = 'running';
      try { const value = await task(); agents[name].status = 'done'; return value; }
      catch (error) { agents[name].status = 'error'; agents[name].error = errorText(error); return null; }
    };

    const remote = await run('director', () => askDirector(subject, opts, settings));
    director = remote || { title: subject, hook: `Bugun ${subject} haqida bilib olamiz.` };
    let scenes = normalizeScenes(director.scenes, subject, opts.duration);
    scenes = await run('imagesmith', () => imagesmith(scenes, subject, opts)) || scenes;
    scenes = await run('choreographer', () => choreographer(scenes)) || scenes;
    scenes = await run('subtitler', () => subtitler(scenes)) || scenes;
    result.metadata = await run('publisher', () => publisher(subject, director, opts)) || publisher(subject, director, opts);
    scenes = await run('rewriter', () => rewriter(scenes)) || scenes;
    result.scenes = scenes;
    result.director = director;
    return result;
  }

  root.AgentPipeline = { create };
})(typeof window !== 'undefined' ? window : globalThis);
