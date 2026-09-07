// Shared timing helpers. Loading never deletes an existing synchronization.
function cleanLyricsText(value) {
  return String(value ?? '').replace(/[()]/g, '').replace(/[.…。]+$/u, '').replace(/\s+/g, ' ').trim();
}
function cleanLyricsData(lyrics) {
  return JSON.parse(JSON.stringify(lyrics || [])).map(block => {
    for (const line of ['pt','en1','en2']) if (block[line] != null) block[line] = cleanLyricsText(block[line]);
    if (Array.isArray(block.words)) block.words.forEach(word => { if (word.text != null) word.text = cleanLyricsText(word.text); });
    return block;
  });
}
function importLyricsData(input) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  const lyrics = Array.isArray(parsed) ? parsed : parsed?.lyrics;
  if (!Array.isArray(lyrics) || !lyrics.length) throw new Error('O JSON precisa conter uma lista de frases sincronizadas.');
  const cleaned = cleanLyricsData(lyrics);
  const words = cleaned.flatMap(block => Array.isArray(block.words) ? block.words : []);
  if (!words.length) throw new Error('Este JSON não tem palavras sincronizadas.');
  if (words.some(word => !word || typeof word.text !== 'string' || !['pt','en1','en2'].includes(word.line) || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.start < 0 || word.end <= word.start)) {
    throw new Error('O JSON tem palavras sem início e fim válidos. Escolha o arquivo exportado depois da sincronização.');
  }
  return cleaned;
}
window.SyncStore = {
  cleanLyrics: cleanLyricsData,
  importLyrics: importLyricsData,
  read(id, fallback) {
    try {
      const saved = localStorage.getItem(`KARAOKE_SYNC_${id}`) || (id === 'viagens' ? localStorage.getItem('KARAOKE_CUSTOM_SYNC') : null);
      const parsed = saved ? JSON.parse(saved) : fallback;
      if (Array.isArray(parsed) && parsed.length) {
        const cleaned = cleanLyricsData(parsed);
        if (saved && JSON.stringify(cleaned) !== JSON.stringify(parsed)) {
          try { localStorage.setItem(`KARAOKE_SYNC_${id}`, JSON.stringify(cleaned)); } catch (error) { console.warn('Texto limpo, mas a cópia salva não pôde ser atualizada.', error); }
        }
        return cleaned;
      }
    } catch (error) { console.warn('Sincronização salva não pôde ser lida; a cópia foi preservada.', error); }
    return cleanLyricsData(fallback);
  },
  compile(lyrics, words) {
    if (!words.length || words.some(w => !Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < 0 || w.end <= w.start)) {
      throw new Error('Há palavras sem início/fim válido. Complete a marcação antes de aplicar ou baixar. Seu rascunho continua salvo.');
    }
    return lyrics.map((source, i) => {
      const block = JSON.parse(JSON.stringify(source));
      const group = words.filter(w => w.blockIdx === i);
      const original = source.words || [];
      const changed = group.length !== original.length || group.some((w,j) => w.start !== original[j]?.start || w.end !== original[j]?.end);
      block.words = group.map(w => ({text:w.text,line:w.lineName,start:w.start,end:w.end}));
      if (changed && group.length) {
        for (const line of ['pt','en1','en2']) {
          const lw = group.filter(w => w.lineName === line);
          if (lw.length) {
            block[`${line}_start`] = Math.min(...lw.map(w => w.start));
            block[`${line}_end`] = Math.max(...lw.map(w => w.end));
          }
        }
        block.start = Math.min(...group.map(w => w.start));
        block.end = Math.max(...group.map(w => w.end));
      }
      return block;
    });
  }
};
