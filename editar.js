const form = document.getElementById('addSongForm');
const lyricsInput = document.getElementById('songLyrics');
const submit = document.getElementById('createSong');
const errorLabel = document.getElementById('saveError');
const params = new URLSearchParams(location.search);
const songId = params.get('song');
let songRecord, isCustom = false, busy = false, navigating = false;
let editableParts = [];

function lyricsToText(lyrics) {
  return lyrics.map(block => [block.pt, block.en1, block.en2].filter(Boolean).join('\n')).join('\n\n');
}
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
  status.textContent = !parsed.lineCount ? 'Cole uma letra para continuar.' : parsed.remaining
    ? `${parsed.remaining} linha(s) não formam uma parte completa.`
    : `${parsed.blocks.length} partes · ${parsed.lineCount} linhas · ${parsed.wordCount} palavras. Ajuste PT / Inglês nos menus se precisar.`;
  submit.disabled = busy || !parsed.blocks.length || parsed.wordCount === 0;
  return parsed;
}

function preview(reset = true) {
  if (reset) editableParts = SongImport.toEditableParts(SongImport.parse(lyricsInput.value).blocks);
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
lyricsInput.addEventListener('input', preview);
function audioDuration(file) {
  return new Promise((resolve,reject) => {
    const audio = new Audio(), url = URL.createObjectURL(file), timer = setTimeout(() => { cleanup(); reject(new Error('O áudio demorou para carregar.')); });
    function cleanup(){clearTimeout(timer);audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);}
    audio.onloadedmetadata=()=>{const duration=audio.duration;cleanup();Number.isFinite(duration)&&duration>0?resolve(duration):reject(new Error('Não foi possível identificar a duração do áudio.'));};
    audio.onerror=()=>{cleanup();reject(new Error('Este áudio não pôde ser aberto.'));}; audio.preload='metadata';audio.src=url;
  });
}
async function init() {
  await CustomSongs.ready;
  const custom = songId ? await CustomSongs.get(songId) : null;
  const catalogSong = window.SONGS_CATALOG?.[songId];
  if (!custom && !catalogSong) throw new Error('Música não encontrada.');
  isCustom = Boolean(custom); songRecord = custom || {...catalogSong, lyrics: SyncStore.read(songId,catalogSong.lyrics)};
  document.getElementById('songName').value = songRecord.title;
  document.getElementById('songName').readOnly = !isCustom;
  document.getElementById('audioHelp').textContent = isCustom ? `Áudio atual: ${songRecord.audio?.name || songRecord.audioName || 'salvo no navegador'}.` : 'Esta música faz parte do catálogo. O áudio atual será mantido.';
  lyricsInput.value = lyricsToText(songRecord.lyrics || []); preview();
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const parsed=preview(false), title=document.getElementById('songName').value.trim(), file=document.getElementById('songAudio').files[0];
  if (!title || !parsed.blocks.length || parsed.remaining) return;
  busy=true;submit.disabled=true;errorLabel.textContent='';submit.textContent='Salvando alterações…';
  try {
    if (isCustom) {
      const audio = file || songRecord.audio;
      let durationSec=songRecord.durationSec;
      if (file) durationSec=await audioDuration(file);
      await CustomSongs.update({...songRecord,title,lyrics:parsed.blocks,audio,durationSec,durationText:`${Math.floor(durationSec/60)}:${Math.floor(durationSec%60).toString().padStart(2,'0')}`,audioName:file?.name || songRecord.audioName});
    } else {
      localStorage.setItem(`KARAOKE_SYNC_${songId}`,JSON.stringify(parsed.blocks));
    }
    navigating=true;location.href=`sincronizar.html?song=${encodeURIComponent(songId)}`;
  } catch(error) { errorLabel.textContent=`Não foi possível salvar: ${error.message}`;busy=false;submit.textContent='💾 Salvar alterações';preview(); }
});
window.addEventListener('beforeunload',event=>{if(busy&&!navigating){event.preventDefault();event.returnValue='';}});
init().catch(error=>{errorLabel.textContent=error.message;document.getElementById('parseStatus').textContent='Não foi possível carregar esta música.';});
