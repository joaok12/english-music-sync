// Audio and metadata are committed together; object URLs are recreated on each visit.
window.CustomSongs = (() => {
  let connection;
  const urls = [];
  const INDEX_KEY = 'KARAOKE_CUSTOM_SONG_INDEX';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cleanText = value => String(value ?? '').replace(/[()]/g, '').replace(/[.…。]+$/u, '').replace(/\s+/g, ' ').trim();
  const cleanLyrics = lyrics => JSON.parse(JSON.stringify(lyrics || [])).map(block => {
    for (const line of ['pt','en1','en2']) if (block[line] != null) block[line] = cleanText(block[line]);
    if (Array.isArray(block.words)) block.words.forEach(word => { if (word.text != null) word.text = cleanText(word.text); });
    return block;
  });
  function readIndex() {
    try {
      const value = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }
  function remember(record) {
    try {
      const entry = {id:record.id,title:record.title,icon:record.icon || '🎵',durationSec:record.durationSec,durationText:record.durationText,audioName:record.audioName,lyrics:cleanLyrics(record.lyrics)};
      const entries = readIndex().filter(item => item.id !== record.id);
      entries.push(entry);
      localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
    } catch (error) { console.warn('A cópia de segurança da lista não pôde ser atualizada.', error); }
  }
  function database() {
    if (!connection) connection = new Promise((resolve, reject) => {
      const request = indexedDB.open('karaoke-user-songs', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('songs', {keyPath:'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Feche as outras abas e tente novamente.'));
    });
    return connection;
  }
  async function all() {
    const db = await database();
    return new Promise((resolve,reject) => {
      const request = db.transaction('songs').objectStore('songs').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function add(record) {
    const db = await database();
    await new Promise((resolve,reject) => {
      const tx = db.transaction('songs','readwrite');
      tx.objectStore('songs').add(record);
      tx.oncomplete = resolve;
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Não foi possível salvar a música.'));
    });
    remember(record);
  }
  async function get(id) {
    const db = await database();
    return new Promise((resolve,reject) => {
      const request = db.transaction('songs').objectStore('songs').get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async function update(record) {
    const db = await database();
    await new Promise((resolve,reject) => {
      const tx = db.transaction('songs','readwrite');
      tx.objectStore('songs').put(record);
      tx.oncomplete = resolve;
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Não foi possível atualizar a música.'));
    });
    remember(record);
  }
  const ready = all().then(records => {
    const catalog = window.SONGS_CATALOG || (window.SONGS_CATALOG = {});
    const byId = new Map(records.map(record => [record.id, record]));
    for (const entry of readIndex()) if (!byId.has(entry.id)) records.push({...entry, audio:null, recoveredFromIndex:true});
    for (const record of records) {
      remember(record);
      const lyrics = cleanLyrics(record.lyrics);
      if (JSON.stringify(lyrics) !== JSON.stringify(record.lyrics)) {
        update({...record, lyrics}).catch(error => console.warn('Letra antiga limpa na tela, mas não pôde ser atualizada no armazenamento.', error));
      }
      let audioFile = '';
      try {
        if (record.audio && typeof record.audio.size === 'number') {
          audioFile = URL.createObjectURL(record.audio);
          urls.push(audioFile);
        }
      } catch (error) { console.warn('O áudio salvo não pôde gerar uma URL nesta sessão.', error); }
      const {audio, ...metadata} = record;
      catalog[record.id] = {...metadata, lyrics, audioFile};
      for (const [id, className] of [['syncSongTabs','song-tab-btn'],['karaokeSongPills','pill-btn']]) {
        const container = document.getElementById(id);
        if (!container) continue;
        const button = document.createElement('button');
        button.type = 'button'; button.className = className;
        button.dataset.song = record.id; button.textContent = `🎵 ${record.title}`;
        container.append(button);
      }
      const list = document.querySelector('.song-cards-list');
      if (list) {
        const card = document.createElement('article'); card.className = 'song-card';
        const audioNotice = audioFile ? '' : '<small class="custom-card-warning">Áudio precisa ser selecionado novamente</small>';
        card.innerHTML = `<div class="card-top"><div class="card-icon">${escapeHTML(record.icon || '🎵')}</div><div class="card-info"><h2 class="card-title">${escapeHTML(record.title)}</h2><p class="card-subtitle">Sua música • ${lyrics.length} partes</p>${audioNotice}</div></div><div class="card-actions"><a class="btn-card-sing" href="karaoke.html?song=${encodeURIComponent(record.id)}">🎤 Cantar Karaokê</a><a class="btn-card-sync" href="sincronizar.html?song=${encodeURIComponent(record.id)}">⚙️ Sincronizar</a></div><a class="btn-card-edit" href="editar.html?song=${encodeURIComponent(record.id)}">✎ Editar música e letra</a>`;
        list.prepend(card);
      }
    }
  }).catch(error => {
    const notice = document.createElement('p');
    notice.setAttribute('role','alert'); notice.textContent = 'Não foi possível carregar suas músicas salvas: ' + error.message;
    (document.querySelector('header') || document.body).append(notice);
  });
  window.addEventListener('pagehide', event => { if (!event.persisted) urls.forEach(url => URL.revokeObjectURL(url)); });
  return {ready, all, get, add, update, escapeHTML};
})();
