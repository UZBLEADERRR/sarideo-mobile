// js/api.js
// Gemini / OpenAI compatible wrapper

const Api = {
  async _fetch(url, body, key) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { Authorization: `Bearer ${key}` } : {})
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Xatolik ${res.status}: ${err}`);
      }
      return await res.json();
    } catch (e) {
      console.error(e);
      return { error: e.message || 'Tarmoq xatosi' };
    }
  },

  async gemini(prompt, key, endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent') {
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    const separator = endpoint.includes('?') ? '&' : '?';
    try {
      const res = await fetch(`${endpoint}${separator}key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) return { error: `Gemini ${res.status}: ${await res.text()}` };
      return await res.json();
    } catch (error) { return { error: error.message || 'Gemini tarmoq xatosi' }; }
  },

  async openaiChat(prompt, key, endpoint = 'https://api.openai.com/v1/chat/completions') {
    const body = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    };
    return await this._fetch(endpoint, body, key);
  }
};

window.Api = Api;
