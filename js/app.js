// Sarideo ilovasini ishga tushiruvchi ulovchi qatlam.
(function () {
  'use strict';
  const UI = window.SarideoUI;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  document.addEventListener('DOMContentLoaded', () => {
    UI.renderRecent();
    UI.showScreen('create');

    document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => UI.showScreen(button.dataset.nav)));
    $('#hero-image')?.addEventListener('change', event => { const file = event.target.files?.[0]; if (file) { const label = $('#hero-image-label'); if (label) label.textContent = `✓ ${file.name}`; UI.toast('Qahramon rasmi tanlandi'); } });
    document.addEventListener('click', event => {
      const projectNode = event.target.closest('[data-project]');
      if (projectNode) return UI.openProject(projectNode.dataset.project);
      const actionNode = event.target.closest('[data-action]');
      if (!actionNode) return;
      const action = actionNode.dataset.action;
      if (action === 'open-settings') UI.showScreen('settings');
      if (action === 'open-library') UI.showScreen('library');
      if (action === 'new-project') { $('#topic').focus(); UI.showScreen('create'); }
      if (action === 'export') UI.toast('MP4 eksport WebView codec’iga bog‘liq; preview hozir tayyor.');
      if (action === 'play-preview') UI.playPreview();
      if (action === 'save-api') {
        const settings = Store.getSettings(); settings.geminiKey = $('#gemini-key').value.trim(); settings.openaiKey = $('#openai-key').value.trim(); settings.openaiEndpoint = $('#openai-endpoint').value.trim() || 'https://api.openai.com/v1/chat/completions'; Store.setSettings(settings); UI.loadSettings(); UI.toast('API sozlamalari telefonda saqlandi');
      }
    });
    $('#create-form').addEventListener('submit', async event => { event.preventDefault(); const topic = $('#topic').value.trim(); if (!topic) return UI.toast('Avval mavzuni yozing'); const heroFile = $('#hero-image')?.files?.[0]; const heroImage = heroFile ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(heroFile); }) : ''; const formOptions = { format: $('#format').value, duration: Number($('#duration').value), hero: $('#hero').value, heroImage, voice: $('#voice').value, visualStyle: $('#visual-style').value, subtitles: $('#subtitles').value, music: $('#music').value }; const button = $('#create-form button[type="submit"]'); button.disabled = true; button.innerHTML = '<span>◌</span> Tayyorlanmoqda…'; try { await UI.createProject(topic, formOptions); $('#topic').value = ''; } catch (error) { UI.toast(error.message || 'Loyiha yaratilmadi'); } finally { button.disabled = false; button.innerHTML = '<span>✦</span> Video yaratishni boshlash'; } });
  });
})();
