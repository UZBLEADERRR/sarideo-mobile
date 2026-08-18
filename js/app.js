// Sarideo ilovasini ishga tushiruvchi ulovchi qatlam.
(function () {
  'use strict';
  const UI = window.SarideoUI;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  document.addEventListener('DOMContentLoaded', () => {
    UI.renderRecent();
    UI.showScreen('create');

    document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => UI.showScreen(button.dataset.nav)));
    document.addEventListener('click', event => {
      const projectNode = event.target.closest('[data-project]');
      if (projectNode) return UI.openProject(projectNode.dataset.project);
      const actionNode = event.target.closest('[data-action]');
      if (!actionNode) return;
      const action = actionNode.dataset.action;
      if (action === 'open-settings') UI.showScreen('settings');
      if (action === 'open-library') UI.showScreen('library');
      if (action === 'new-project') { $('#topic').focus(); UI.showScreen('create'); }
      if (action === 'toggle-format') UI.toast('Format: Shorts · 9:16 (hozircha standart)');
      if (action === 'toggle-duration') UI.toast('Davomiylik: 60 soniya (hozircha standart)');
      if (action === 'export') UI.toast('MP4 eksport WebView codec’iga bog‘liq; preview hozir tayyor.');
      if (action === 'save-api') {
        const settings = Store.getSettings(); settings.geminiKey = $('#gemini-key').value.trim(); settings.openaiKey = $('#openai-key').value.trim(); settings.openaiEndpoint = $('#openai-endpoint').value.trim() || 'https://api.openai.com/v1/chat/completions'; Store.setSettings(settings); UI.loadSettings(); UI.toast('API sozlamalari telefonda saqlandi');
      }
    });
    $('#create-form').addEventListener('submit', async event => { event.preventDefault(); const topic = $('#topic').value.trim(); if (!topic) return UI.toast('Avval mavzuni yozing'); const button = $('#create-form button[type="submit"]'); button.disabled = true; button.innerHTML = '<span>◌</span> Tayyorlanmoqda…'; try { await UI.createProject(topic); $('#topic').value = ''; } catch (error) { UI.toast(error.message || 'Loyiha yaratilmadi'); } finally { button.disabled = false; button.innerHTML = '<span>✦</span> Video yaratishni boshlash'; } });
  });
})();
