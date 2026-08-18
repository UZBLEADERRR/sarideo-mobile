// js/store.js
// LocalStorage + IndexedDB adapter for Sarideo

const Store = {
  // Settings CRUD
  getSettings() {
    const s = localStorage.getItem('sarideo_settings');
    return s ? JSON.parse(s) : {};
  },
  setSettings(obj) {
    localStorage.setItem('sarideo_settings', JSON.stringify(obj));
  },

  // Projects CRUD
  getProject(id) {
    const p = localStorage.getItem(`sarideo_project_${id}`);
    return p ? JSON.parse(p) : null;
  },
  setProject(id, data) {
    localStorage.setItem(`sarideo_project_${id}`, JSON.stringify(data));
  },
  deleteProject(id) {
    localStorage.removeItem(`sarideo_project_${id}`);
  },
  listProjects() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sarideo_project_'));
    return keys.map(k => JSON.parse(localStorage.getItem(k)));
  },

  // Media metadata CRUD
  getMediaMeta(id) {
    const m = localStorage.getItem(`sarideo_media_${id}`);
    return m ? JSON.parse(m) : null;
  },
  setMediaMeta(id, data) {
    localStorage.setItem(`sarideo_media_${id}`, JSON.stringify(data));
  },
  deleteMediaMeta(id) {
    localStorage.removeItem(`sarideo_media_${id}`);
  },
  listMediaMeta() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sarideo_media_'));
    return keys.map(k => JSON.parse(localStorage.getItem(k)));
  },

  // IndexedDB blob adapter (simple)
  async _db() {
    if (!this._dbInstance) {
      this._dbInstance = await new Promise((res, rej) => {
        const request = indexedDB.open('sarideo_media', 1);
        request.onupgradeneeded = e => {
          const db = e.target.result;
          db.createObjectStore('blobs');
        };
        request.onsuccess = e => res(e.target.result);
        request.onerror = e => rej(e);
      });
    }
    return this._dbInstance;
  },
  async putBlob(key, blob) {
    const db = await this._db();
    return new Promise((res, rej) => {
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').put(blob, key);
      tx.oncomplete = () => res();
      tx.onerror = e => rej(e);
    });
  },
  async getBlob(key) {
    const db = await this._db();
    return new Promise((res, rej) => {
      const tx = db.transaction('blobs', 'readonly');
      const request = tx.objectStore('blobs').get(key);
      request.onsuccess = e => res(e.target.result);
      request.onerror = e => rej(e);
    });
  },
  async deleteBlob(key) {
    const db = await this._db();
    return new Promise((res, rej) => {
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').delete(key);
      tx.oncomplete = () => res();
      tx.onerror = e => rej(e);
    });
  }
};

window.Store = Store;
