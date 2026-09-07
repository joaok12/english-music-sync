const form = document.getElementById('addSongForm');
const lyricsInput = document.getElementById('songLyrics');
const submit = document.getElementById('createSong');
const errorLabel = document.getElementById('saveError');
let busy = false;
let navigating = false;
let editableParts = [];

function draftFromParts() {
  const blocks = SongImport.fromEditableParts(editableParts);
  return {
    blocks,
    lineCount: editableParts.reduce((total, part) => total + (part.rows || []).filter(row => String(row.text || '').trim()).length, 0),
    remaining: 0,
    wordCount: blocks.reduce((total, block) => total + block.words.length, 0)
  };
}

function refreshPreviewStatus() {
  const parsed = draftFromParts();
  const status = document.getElementById('parseStatus');
  status.textContent = !parsed.lineCount ? 'Cole sua letra para ver a divisão automática.' : parsed.remaining
    ? `${parsed.lineCount} linhas encontradas. ${parsed.remaining} linha(s) não formam uma parte completa de 3.`
    : `${parsed.blocks.length} partes · ${parsed.lineCount} linhas · ${parsed.wordCount} palavras. Ajuste PT / Inglês nos menus se precisar.`;
  submit.disabled = busy || !parsed.blocks.length || parsed.wordCount === 0;
  return parsed;
}

function preview(reset = true) {
  if (reset) {
    const parsed = SongImport.parse(lyricsInput.value);
    editableParts = SongImport.toEditableParts(parsed.blocks);
  }
  const container = document.getElementById('lyricsPreview');
  SongImport.renderEditablePreview(container, editableParts, (partIndex, rowIndex, field, value) => {
    editableParts[partIndex].rows[rowIndex][field] = value;
    refreshPreviewStatus();
  }, partIndex => {
    editableParts[partIndex].rows.push(...editableParts[partIndex + 1].rows);
    editableParts.splice(partIndex + 1, 1);
    preview(false);
  });
  return refreshPreviewStatus();
}
lyricsInput.addEventListener('input',preview);
function audioDuration(file) {
  return new Promise((resolve,reject) => {
    const audio = new Audio(), url = URL.createObjectURL(file);
    const cleanup = () => { clearTimeout(timer); audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('O áudio demorou para carregar. Tente outro arquivo.')); },15000);
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      audio.onloadedmetadata = audio.onerror = null; cleanup();
      if (Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(new Error('Não foi possível identificar a duração do áudio.'));
    };
    audio.onerror = () => { audio.onerror = null; cleanup(); reject(new Error('Este áudio não pôde ser aberto. Tente MP3, M4A ou WAV.')); };
    audio.preload = 'metadata'; audio.src = url;
  });
}
form.addEventListener('submit',async event => {
  event.preventDefault();
  if (busy) return;
  const parsed = preview(false), title = document.getElementById('songName').value.trim();
  const audio = document.getElementById('songAudio').files[0];
  if (!title || !audio || !parsed.blocks.length || parsed.remaining) return;
  busy = true; submit.disabled = true; errorLabel.textContent = ''; submit.textContent = 'Salvando música e áudio…';
  try {
    const durationSec = await audioDuration(audio);
    const id = 'custom_' + crypto.randomUUID();
    await CustomSongs.add({id,title,audio,durationSec,durationText:`${Math.floor(durationSec/60)}:${Math.floor(durationSec%60).toString().padStart(2,'0')}`,lyrics:parsed.blocks,icon:'🎵'});
    navigating = true;
    location.href = `sincronizar.html?song=${encodeURIComponent(id)}`;
  } catch (error) {
    errorLabel.textContent = `Não foi possível salvar: ${error.message}. Sua letra continua aqui para tentar novamente.`;
    busy = false; submit.textContent = '🎛️ Salvar e começar a sincronizar'; preview();
  }
});
window.addEventListener('beforeunload',event => { if (busy && !navigating) { event.preventDefault(); event.returnValue = ''; } });
