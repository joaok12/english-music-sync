// Lógica de Sincronização 100% WYSIWYG Multimúsica
document.addEventListener("DOMContentLoaded", async () => {
  await window.CustomSongs.ready;
  const audio = document.getElementById("audioElement");
  const blocksContainer = document.getElementById("blocksContainer");
  const syncViewport = document.getElementById("syncViewport");

  // Controles
  const btnPlayPause = document.getElementById("btnPlayPause");
  const playIcon = document.getElementById("playIcon");
  const btnTap = document.getElementById("btnTap");
  const btnUndo = document.getElementById("btnUndo");
  const btnSpeedToggle = document.getElementById("btnSpeedToggle");
  const lblSpeedText = document.getElementById("lblSpeedText");
  const lblPlaybackSpeed = document.getElementById("lblPlaybackSpeed");

  const btnReset = document.getElementById("btnReset");
  const btnDownload = document.getElementById("btnDownload");
  const btnImportJson = document.getElementById("btnImportJson");
  const syncJsonFile = document.getElementById("syncJsonFile");
  const btnApply = document.getElementById("btnApply");
  const editCurrent = document.getElementById("editCurrent");

  // Barra de Progresso
  const audioTrackBar = document.getElementById("audioTrackBar");
  const trackFill = document.getElementById("trackFill");
  const lblTimeCurrent = document.getElementById("lblTimeCurrent");
  const lblTimeTotal = document.getElementById("lblTimeTotal");

  // Informações da Doca
  const lblWordIndex = document.getElementById("lblWordIndex");
  const lblWordTotal = document.getElementById("lblWordTotal");
  const dockWord = document.getElementById("dockWord");
  const dockContext = document.getElementById("dockContext");

  // Catálogo de Músicas
  const catalog = window.SONGS_CATALOG || {
    viagens: {
      id: "viagens",
      title: "Frases de Viagem",
      durationSec: 180.87,
      durationText: "03:00.8",
      audioFile: "audio.mp3",
      lyrics: window.LYRICS_DATA || []
    }
  };

  // Identificar música inicial pela URL ou LocalStorage
  const urlParams = new URLSearchParams(window.location.search);
  let currentSongId = urlParams.get('song') || localStorage.getItem('KARAOKE_ACTIVE_SONG') || 'dia_a_dia';
  if (!catalog[currentSongId]) {
    currentSongId = Object.keys(catalog)[0];
  }
  let currentSong = catalog[currentSongId];

  // Velocidades
  const speedOptions = [1.0, 0.75, 0.5];
  let speedIdx = 0;

  // Lista plana de palavras: [{ blockIdx, lineName, wordIdx, text, start, end }]
  let flatWords = [];
  let currentActiveWordIdx = -1; // -1 significa esperando a primeira palavra começar

  // Trocar de Música
  function setSong(songId) {
    if (!catalog[songId]) return;
    currentSongId = songId;
    currentSong = {...catalog[currentSongId], lyrics: window.SyncStore.read(currentSongId, catalog[currentSongId].lyrics)};

    // Atualiza estado salvo e URL sem recarregar
    localStorage.setItem('KARAOKE_ACTIVE_SONG', currentSongId);
    history.replaceState(null, '', `?song=${currentSongId}`);
    if (editCurrent) editCurrent.href = `editar.html?song=${encodeURIComponent(currentSongId)}`;

    // Atualiza abas visuais
    document.querySelectorAll('#syncSongTabs .song-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-song') === currentSongId);
    });

    // Pausa e carrega novo áudio
    audio.pause();
    audio.src = currentSong.audioFile;
    audio.currentTime = 0;
    audio.load();

    // Reset de velocidade e tempo
    speedIdx = 0;
    audio.playbackRate = 1.0;
    lblSpeedText.textContent = '1.0x';
    lblPlaybackSpeed.textContent = 'Velocidade: 1.0x';
    lblTimeCurrent.textContent = '00:00.0';
    lblTimeTotal.textContent = currentSong.durationText || '02:13.0';

    currentActiveWordIdx = -1;
    document.getElementById('syncSaveStatus').textContent = '';

    // Inicializa palavras da música selecionada
    initWordList();
    renderView();
    updateVisuals();
  }

  // 1. Inicializar lista de palavras a partir da música ativa
  function initWordList(restore = true) {
    flatWords = [];
    const lyrics = currentSong.lyrics || [];

    lyrics.forEach((b, bIdx) => {
      // Português (sem pontos finais)
      const ptList = (b.pt || '').replace(/\./g, '').trim().split(/\s+/);
      ptList.forEach((w, wIdx) => {
        if (!w) return;
        flatWords.push({
          blockIdx: bIdx,
          lineName: 'pt',
          wordIdx: wIdx,
          text: w,
          start: null,
          end: null
        });
      });

      // Inglês 1 (sem pontos finais)
      const en1List = (b.en1 || '').replace(/\./g, '').trim().split(/\s+/);
      en1List.forEach((w, wIdx) => {
        if (!w) return;
        flatWords.push({
          blockIdx: bIdx,
          lineName: 'en1',
          wordIdx: wIdx,
          text: w,
          start: null,
          end: null
        });
      });

      // Inglês 2 (sem pontos finais)
      if (b.en2) {
        const en2List = (b.en2 || '').replace(/\./g, '').trim().split(/\s+/);
        en2List.forEach((w, wIdx) => {
          if (!w) return;
          flatWords.push({
            blockIdx: bIdx,
            lineName: 'en2',
            wordIdx: wIdx,
            text: w,
            start: null,
            end: null
          });
        });
      }
    });

    if (restore) {
      flatWords.forEach(w => {
        const saved = (currentSong.lyrics[w.blockIdx].words || []).filter(word => word.line === w.lineName)[w.wordIdx];
        if (saved) Object.assign(w, {text:saved.text, start:saved.start ?? null, end:saved.end ?? null});
      });
      try {
        const draft = JSON.parse(localStorage.getItem('KARAOKE_DRAFT_' + currentSongId));
        if (draft && draft.words.length === flatWords.length && draft.words.every((w,i) => w.text === flatWords[i].text && w.lineName === flatWords[i].lineName && w.blockIdx === flatWords[i].blockIdx)) {
          flatWords = draft.words;
          currentActiveWordIdx = Math.max(-1, Math.min(flatWords.length, draft.cursor));
          document.getElementById('syncSaveStatus').textContent = '✓ Rascunho recuperado';
        }
      } catch (error) { console.warn('Rascunho preservado, mas não pôde ser carregado.', error); }
    }
    lblWordTotal.textContent = flatWords.length;
  }

  function saveDraft() {
    try {
      if (currentActiveWordIdx === flatWords.length && flatWords.length) {
        repairCompletedTimings();
      }
      localStorage.setItem('KARAOKE_DRAFT_' + currentSongId, JSON.stringify({words:flatWords,cursor:currentActiveWordIdx}));
      document.getElementById('syncSaveStatus').textContent = '✓ Rascunho salvo';
      if (currentActiveWordIdx === flatWords.length && flatWords.length) {
        const compiled = window.SyncStore.compile(currentSong.lyrics, flatWords);
        localStorage.setItem('KARAOKE_SYNC_' + currentSongId, JSON.stringify(compiled));
        document.getElementById('syncSaveStatus').textContent = '✓ Sincronização salva no karaokê';
      }
    } catch (error) { alert('Não foi possível salvar o rascunho. Verifique o espaço disponível no navegador.'); }
  }

  // 2. Renderizar estrutura na tela
  function renderView() {
    blocksContainer.innerHTML = "";
    const lyrics = currentSong.lyrics || [];

    lyrics.forEach((b, bIdx) => {
      const blockEl = document.createElement("div");
      blockEl.className = "sync-block";
      blockEl.id = `sync-block-${bIdx}`;

      blockEl.innerHTML = `
        <div class="block-header">Frase ${bIdx + 1} de ${lyrics.length} • ${CustomSongs.escapeHTML(currentSong.title)}</div>
        
        <div class="line-row line-pt">
          <span class="line-badge pt">PT</span>
          <div class="line-words" id="line-words-pt-${bIdx}"></div>
        </div>

        <div class="line-row line-en">
          <span class="line-badge en">EN 1</span>
          <div class="line-words" id="line-words-en1-${bIdx}"></div>
        </div>

        ${b.en2 ? `
        <div class="line-row line-en">
          <span class="line-badge en">EN 2</span>
          <div class="line-words" id="line-words-en2-${bIdx}"></div>
        </div>
        ` : ''}
      `;

      blocksContainer.appendChild(blockEl);
    });

    // Anexar cada palavra interativa
    flatWords.forEach((item, globalIdx) => {
      const parent = document.getElementById(`line-words-${item.lineName}-${item.blockIdx}`);
      if (!parent) return;

      const span = document.createElement("span");
      span.className = "sync-word";
      span.id = `sword-${globalIdx}`;
      span.innerHTML = `
        ${CustomSongs.escapeHTML(item.text)}
        <span class="word-badge" id="sbadge-${globalIdx}">--</span>
      `;

      span.addEventListener("click", () => {
        jumpToWord(globalIdx);
      });

      parent.appendChild(span);
    });
  }

  // Pular para editar palavra clicada
  function jumpToWord(targetIdx) {
    if (targetIdx >= 0 && targetIdx < flatWords.length) {
      currentActiveWordIdx = targetIdx;
      const t = flatWords[targetIdx].start;
      if (t !== null) {
        audio.currentTime = Math.max(0, t - 0.2);
      }
      updateVisuals();
      scrollIntoWord(currentActiveWordIdx);
    }
  }

  // 3. Toque/Marcação de Palavra (Espaço ou Botão Vermelho)
  function handleWordTap() {
    if (!flatWords.length || currentActiveWordIdx >= flatWords.length) return;
    if (currentActiveWordIdx >= 0 && flatWords[currentActiveWordIdx].start !== null && audio.currentTime <= flatWords[currentActiveWordIdx].start) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    }

    const t = audio.currentTime;

    if (currentActiveWordIdx >= 0 && flatWords[currentActiveWordIdx].start === null) {
      flatWords[currentActiveWordIdx].start = round(t);
    } else if (currentActiveWordIdx === -1) {
      currentActiveWordIdx = 0;
      flatWords[0].start = round(t);
    } else if (currentActiveWordIdx < flatWords.length - 1) {
      // Fecha a palavra anterior exatamente agora:
      flatWords[currentActiveWordIdx].end = round(t);

      // Abre a próxima palavra exatamente agora:
      currentActiveWordIdx++;
      flatWords[currentActiveWordIdx].start = round(t);
    } else if (currentActiveWordIdx === flatWords.length - 1) {
      // Fechamento da última palavra
      flatWords[currentActiveWordIdx].end = round(t);
      currentActiveWordIdx = flatWords.length; // terminou
    }

    saveDraft();
    updateVisuals();
    if (currentActiveWordIdx < flatWords.length) {
      scrollIntoWord(currentActiveWordIdx);
    }
  }

  function round(val) {
    return Math.round(val * 100) / 100;
  }

  // Desfazer última palavra
  function handleUndo() {
    if (currentActiveWordIdx > 0) {
      if (currentActiveWordIdx < flatWords.length) {
        flatWords[currentActiveWordIdx].start = null;
        flatWords[currentActiveWordIdx].end = null;
      }
      currentActiveWordIdx--;
      flatWords[currentActiveWordIdx].end = null;

      if (flatWords[currentActiveWordIdx].start !== null) {
        audio.currentTime = Math.max(0, flatWords[currentActiveWordIdx].start - 0.3);
      }

      saveDraft();
      updateVisuals();
      scrollIntoWord(currentActiveWordIdx);
    } else if (currentActiveWordIdx === 0) {
      flatWords[0].start = null;
      flatWords[0].end = null;
      currentActiveWordIdx = -1;
      saveDraft();
      updateVisuals();
    }
  }

  // Atualizar visual da interface
  function updateVisuals() {
    lblWordIndex.textContent = currentActiveWordIdx >= 0 ? Math.min(flatWords.length, currentActiveWordIdx + 1) : 0;

    flatWords.forEach((item, idx) => {
      const el = document.getElementById(`sword-${idx}`);
      const badge = document.getElementById(`sbadge-${idx}`);
      if (!el) return;

      const isRecorded = item.start !== null;
      const isActive = idx === currentActiveWordIdx;

      el.classList.toggle("recorded", isRecorded);
      el.classList.toggle("active-target", isActive);

      if (item.start !== null && item.end !== null) {
        const dur = (item.end - item.start).toFixed(1);
        badge.textContent = `${dur}s`;
      } else if (item.start !== null) {
        badge.textContent = `▶ ${item.start.toFixed(1)}s`;
      } else {
        badge.textContent = "--";
      }
    });

    // Foco do bloco
    document.querySelectorAll(".sync-block").forEach(b => b.classList.remove("block-focused"));
    const lyrics = currentSong.lyrics || [];

    if (currentActiveWordIdx >= 0 && currentActiveWordIdx < flatWords.length) {
      const cur = flatWords[currentActiveWordIdx];
      const curBlockEl = document.getElementById(`sync-block-${cur.blockIdx}`);
      if (curBlockEl) curBlockEl.classList.add("block-focused");

      dockWord.textContent = cur.text;
      const blk = lyrics[cur.blockIdx];
      if (blk) {
        dockContext.textContent = `${cur.lineName === 'pt' ? 'Português' : 'Inglês'}: "${cur.lineName === 'pt' ? blk.pt : (cur.lineName === 'en1' ? blk.en1 : blk.en2)}"`;
      }
    } else if (currentActiveWordIdx >= flatWords.length && flatWords.length > 0) {
      dockWord.textContent = "CONCLUÍDO! 🎉";
      dockContext.textContent = `Todas as palavras de "${currentSong.title}" foram sincronizadas!`;
    } else {
      dockWord.textContent = "Aguardando início...";
      dockContext.textContent = `Dê Play na música "${currentSong.title}" e aperte Espaço quando a primeira palavra começar!`;
    }
  }

  function scrollIntoWord(idx) {
    const el = document.getElementById(`sword-${idx}`);
    if (el) {
      const vRect = syncViewport.getBoundingClientRect();
      const tRect = el.getBoundingClientRect();
      const scrollY = tRect.top - vRect.top - (vRect.height * 0.32) + syncViewport.scrollTop;

      syncViewport.scrollTo({
        top: scrollY,
        behavior: "smooth"
      });
    }
  }

  // 4. Montar os dados sincronizados finais
  function repairCompletedTimings() {
    if (currentActiveWordIdx < flatWords.length) return false;

    let repaired = false;
    let previousEnd = null;
    flatWords.forEach((word, index) => {
      if (!Number.isFinite(word.start)) {
        const nextStart = flatWords[index + 1]?.start;
        word.start = Number.isFinite(previousEnd)
          ? previousEnd
          : Number.isFinite(nextStart)
            ? Math.max(0, nextStart - 0.05)
            : index * 0.05;
        word.start = round(word.start);
        repaired = true;
      }

      if (Number.isFinite(word.end) && word.end > word.start) {
        previousEnd = word.end;
        return;
      }

      const nextStart = flatWords[index + 1]?.start;
      const inferredEnd = Number.isFinite(nextStart) && nextStart > word.start
        ? nextStart
        : word.start + 0.05;
      word.end = round(inferredEnd);
      previousEnd = word.end;
      repaired = true;
    });
    return repaired;
  }

  function compileSyncData() {
    try {
      repairCompletedTimings();
      return window.SyncStore.compile(currentSong.lyrics, flatWords);
    }
    catch (error) { alert(error.message); return null; }
  }

  // Baixar JSON
  btnDownload.addEventListener("click", () => {
    const data = compileSyncData();
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sincronizacao_${currentSongId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  btnImportJson.addEventListener("click", () => syncJsonFile.click());
  syncJsonFile.addEventListener("change", async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = window.SyncStore.importLyrics(await file.text());
      localStorage.setItem(`KARAOKE_SYNC_${currentSongId}`, JSON.stringify(imported));
      localStorage.setItem("KARAOKE_ACTIVE_SONG", currentSongId);
      localStorage.removeItem('KARAOKE_DRAFT_' + currentSongId);
      currentSong = {...currentSong, lyrics: imported};
      currentActiveWordIdx = -1;
      initWordList();
      renderView();
      updateVisuals();
      alert(`✅ JSON importado para "${currentSong.title}". Os tempos foram carregados; você não precisa sincronizar novamente.`);
    } catch (error) {
      alert(`Não foi possível importar este JSON: ${error.message}`);
    }
  });

  // Salvar direto no Karaokê
  btnApply.addEventListener("click", () => {
    const data = compileSyncData();
    if (!data) return;
    try {
      localStorage.setItem(`KARAOKE_SYNC_${currentSongId}`, JSON.stringify(data));
    } catch (error) { alert('Não foi possível salvar. Baixe o JSON para guardar seu trabalho.'); return; }
    localStorage.setItem("KARAOKE_ACTIVE_SONG", currentSongId);
    alert(`✅ Sincronização de "${currentSong.title}" salva com sucesso! Abrindo no Karaokê agora...`);
    window.location.href = `karaoke.html?song=${currentSongId}`;
  });

  // 5. Controles do Áudio
  btnPlayPause.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    playIcon.textContent = "⏸ Pausar Música";
  });

  audio.addEventListener("pause", () => {
    playIcon.textContent = "▶ Tocar Música";
  });

  btnTap.addEventListener("click", handleWordTap);
  btnUndo.addEventListener("click", handleUndo);

  // Alterar velocidade
  btnSpeedToggle.addEventListener("click", () => {
    speedIdx = (speedIdx + 1) % speedOptions.length;
    const spd = speedOptions[speedIdx];
    audio.playbackRate = spd;
    lblSpeedText.textContent = `${spd}x`;
    lblPlaybackSpeed.textContent = `Velocidade: ${spd}x`;
  });

  // Barra de tempo
  audioTrackBar.addEventListener("click", (e) => {
    const rect = audioTrackBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = audio.duration || currentSong.durationSec || 132.97;
    audio.currentTime = Math.max(0, Math.min(dur, ratio * dur));
  });

  function timeLoop() {
    const cur = audio.currentTime;
    const dur = audio.duration || currentSong.durationSec || 132.97;
    trackFill.style.width = `${(cur / dur) * 100}%`;

    const m = Math.floor(cur / 60);
    const s = (cur % 60).toFixed(1);
    lblTimeCurrent.textContent = `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;

    requestAnimationFrame(timeLoop);
  }

  // Teclado
  window.addEventListener("keydown", (e) => {
    if (e.repeat || e.target.closest("input, textarea, select, [contenteditable=true]")) return;
    if (e.code === "Space" || e.code === "ArrowRight") {
      e.preventDefault();
      handleWordTap();
    } else if (e.code === "Backspace" || e.code === "ArrowLeft" || ((e.ctrlKey || e.metaKey) && e.key === 'z')) {
      e.preventDefault();
      handleUndo();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (audio.paused) audio.play();
      else audio.pause();
    }
  });

  // Reset
  btnReset.addEventListener("click", () => {
    if (confirm(`Deseja recomeçar a sincronização de "${currentSong.title}" do zero?`)) {
      audio.currentTime = 0;
      audio.pause();
      currentActiveWordIdx = -1;
      initWordList(false);
      saveDraft();
      renderView();
      updateVisuals();
    }
  });

  // Listener para abas de troca de música
  document.querySelectorAll('#syncSongTabs .song-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.getAttribute('data-song');
      if (sid && sid !== currentSongId) {
        setSong(sid);
      }
    });
  });

  // Inicializar com a música atual
  setSong(currentSongId);
  requestAnimationFrame(timeLoop);
});
