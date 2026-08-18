// Sarideo UI: ekranlarni chizish va foydalanuvchi holatini boshqarish.
(function (root) {
  'use strict';
  const labels = { director: 'Director · ssenariy', imagesmith: 'Imagesmith · rasmlar', choreographer: 'Choreographer · sahna', subtitler: 'Subtitler · subtitr', publisher: 'Publisher · metadata', rewriter: 'Rewriter · yakunlash' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const el = id => document.getElementById(id);
  const UI = {
    state: { screen: 'create', project: null },
    toast(message) { const node = el('toast'); node.textContent = message; node.classList.add('is-visible'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2600); },
    showScreen(name) { this.state.screen = name; document.querySelectorAll('.screen').forEach(s => s.classList.toggle('is-active', s.dataset.screen === name)); document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.nav === name)); el('app-main').scrollTop = 0; if (name === 'library') this.renderLibrary(); if (name === 'create') this.renderRecent(); if (name === 'settings') this.loadSettings(); },
    renderRecent() { const list = Store.listProjects().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3); el('recent-projects').innerHTML = list.length ? list.map(p => `<article class="project-card" data-project="${esc(p.id)}"><div class="project-card-title">${esc(p.title || p.topic)}</div><div class="project-card-meta">${esc(p.format || 'Shorts · 9:16')} · ${p.scenes?.length || 0} sahna</div></article>`).join('') : '<div class="muted-note">Hali loyiha yo‘q. Birinchi videongizni yarating.</div>'; },
    renderLibrary() { const list = Store.listProjects().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); el('library-list').innerHTML = list.length ? list.map(p => `<article class="library-item" data-project="${esc(p.id)}"><div class="project-card-title">${esc(p.title || p.topic)}</div><div class="project-card-meta">${new Date(p.createdAt).toLocaleDateString('uz-UZ')} · ${p.scenes?.length || 0} sahna · ${p.demo ? 'Demo' : 'API'}</div></article>`).join('') : '<div class="empty-state"><div class="empty-icon">▤</div><h2>Arxiv bo‘sh</h2><p>Yaratilgan loyihalar shu yerda telefonda saqlanadi.</p></div>'; },
    renderStudio(project) { this.state.project = project; el('studio-empty').classList.toggle('is-hidden', !!project); const content = el('studio-content'); content.classList.toggle('is-hidden', !project); if (!project) return; const agents = Object.entries(project.agents || {}).map(([key, value]) => `<div class="pipeline-step"><span class="pipeline-step-title">${labels[key] || key}</span><span class="pipeline-badge ${esc(value.status)}">${value.status === 'done' ? 'Tayyor' : value.status === 'error' ? 'Xato' : value.status === 'running' ? 'Ishlamoqda' : 'Navbatda'}</span></div>`).join(''); const scenes = (project.scenes || []).map((s, i) => `<article class="scene-item"><div class="scene-header"><span class="scene-number">${String(i+1).padStart(2,'0')}</span><span class="scene-duration">${esc(s.duration)} sek</span></div><div class="scene-title">${esc(s.title)}</div><p class="scene-narration">${esc(s.finalNarration || s.narration)}</p><div class="scene-meta">▧ Rasm: ${project.media?.images?.[i] ? 'tayyor' : 'prompt tayyor'} · ${project.media?.voice === 'off' ? 'Ovoz o‘chirilgan' : '◌ Ovoz API navbatida'} · ${project.media?.subtitles === 'off' ? 'Subtitr o‘chirilgan' : 'Aa Subtitr tayyor'}</div></article>`).join(''); content.innerHTML = `<div class="studio-hero"><button class="preview-frame" type="button" data-action="play-preview" aria-label="Previewni ishga tushirish"><span>▶</span><small>PREVIEWNI KO‘RISH</small></button><div><h2>${esc(project.title || project.topic)}</h2><p>${esc(project.metadata?.description || 'AI agentlar tayyorlagan video loyihasi')}</p><div class="chosen-options"><span>${esc(project.format || 'Shorts · 9:16')}</span><span>${esc(project.duration || 60)} sek</span><span>${esc(project.voice || 'Ovoz')}</span><span>${esc(project.visualStyle || 'Uslub')}</span></div></div></div><div class="pipeline-card"><div class="card-heading"><strong>Agentlar oqimi</strong><span class="status-text">${project.demo ? 'Demo rejim' : 'API rejim'}</span></div>${agents}</div><div class="section-heading"><h2>${project.scenes?.length || 0} ta sahna</h2><button class="secondary-button" data-action="export">MP4 eksport</button></div><div class="scenes-grid">${scenes}</div><div class="notice"><span>◌</span><p>Rasm, ovoz va MP4 montaj telefondagi WebView imkoniyatiga bog‘liq. Preview tayyor; codec qo‘llanmasa, sabab shu yerda ko‘rsatiladi.</p></div>`; },
    loadSettings() { const s = Store.getSettings(); el('gemini-key').value = s.geminiKey || ''; el('openai-key').value = s.openaiKey || ''; el('openai-endpoint').value = s.openaiEndpoint || 'https://api.openai.com/v1/chat/completions'; el('gemini-status').textContent = s.geminiKey ? 'Ulangan' : 'Ulanmagan'; },
    openProject(id) { const p = Store.getProject(id); if (p) { this.renderStudio(p); this.showScreen('studio'); } },
    playPreview() {
      const project = this.state.project;
      if (!project || !project.scenes?.length) return this.toast('Preview uchun sahnalar topilmadi');
      const frame = document.querySelector('.preview-frame');
      const label = frame?.querySelector('small');
      let index = 0;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const show = () => {
        if (index >= project.scenes.length) { if (label) label.textContent = 'PREVIEW TAYYOR'; if (frame) frame.classList.remove('is-playing'); return; }
        const scene = project.scenes[index];
        if (label) label.textContent = `${String(index + 1).padStart(2, '0')} / ${project.scenes.length} · SUBTITR`;
        if (frame) { frame.classList.add('is-playing'); frame.querySelector('span').textContent = '❚❚'; }
        if (project.voice !== 'Ovozsiz' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(scene.finalNarration || scene.narration || scene.title);
          utterance.lang = (project.voice || '').includes('Inglizcha') ? 'en-US' : 'uz-UZ';
          utterance.rate = 0.92;
          utterance.onend = () => { index += 1; show(); };
          window.speechSynthesis.speak(utterance);
        } else {
          window.setTimeout(() => { index += 1; show(); }, Math.max(1200, Number(scene.duration || 4) * 180));
        }
      };
      show();
      this.toast('Preview ishga tushdi — subtitr va ovoz navbat bilan ijro etiladi');
    },
    async createProject(topic, formOptions) {
      const options = Object.assign({ format: 'Shorts · 9:16', duration: 60, hero: 'Avtomatik', voice: 'O‘zbekcha — erkak', visualStyle: 'Kinematik, realistik', subtitles: 'O‘zbekcha', music: 'Mos fon musiqa' }, formOptions || {});
      const id = `p_${Date.now()}`;
      const pendingAgents = { director: { status: 'running' }, imagesmith: { status: 'pending' }, choreographer: { status: 'pending' }, subtitler: { status: 'pending' }, publisher: { status: 'pending' }, rewriter: { status: 'pending' } };
      const pending = { id, topic, title: topic, format: options.format, duration: options.duration, hero: options.hero, voice: options.voice, visualStyle: options.visualStyle, subtitles: options.subtitles, music: options.music, heroImage: options.heroImage || '', status: 'running', agents: pendingAgents, scenes: [], media: { heroImage: options.heroImage || '', voice: options.voice === 'Ovozsiz' ? 'off' : 'pending', subtitles: options.subtitles === 'O‘chirilgan' ? 'off' : 'pending', video: 'not-created' }, createdAt: new Date().toISOString() };
      Store.setProject(id, pending); this.renderStudio(pending); this.showScreen('studio'); this.toast('Jarayon boshlandi — agentlar ishlayapti…');
      try {
        const result = await AgentPipeline.create(topic, options);
        const project = Object.assign(pending, result, { id, status: 'ready' });
        Store.setProject(id, project); this.renderStudio(project); this.toast(result.demo ? 'Demo ssenariy tayyor' : 'Ssenariy va sahnalar tayyor');
      } catch (error) { pending.status = 'error'; Store.setProject(id, pending); this.renderStudio(pending); throw error; }
    }
  };
  root.SarideoUI = UI;
})(window);
