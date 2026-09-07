// Motor Oficial de Karaokê com Sincronia Real, Bandeiras e Setinha Fluida (Multimúsica)
document.addEventListener("DOMContentLoaded", async () => {
  await window.CustomSongs.ready;
  const audio = document.getElementById("audioTrack");
  const lyricsViewport = document.getElementById("lyricsViewport");
  const lyricsStream = document.getElementById("lyricsStream");
  const karaokePointer = document.getElementById("karaokePointer");
  const appContainer = document.querySelector(".mobile-app");
  const songHeaderTitle = document.getElementById("songHeaderTitle");
  const linkSyncCurrent = document.getElementById("linkSyncCurrent");

  // Controles
  const btnPlay = document.getElementById("btnPlay");
  const svgPlay = btnPlay.querySelector(".svg-play");
  const svgPause = btnPlay.querySelector(".svg-pause");
  const btnBack = document.getElementById("btnBack");
  const btnFwd = document.getElementById("btnFwd");

  // Barra de Progresso
  const timelineHitbox = document.getElementById("timelineHitbox");
  const timelineFill = document.getElementById("timelineFill");
  const labelCurrent = document.getElementById("labelCurrent");
  const labelRemaining = document.getElementById("labelRemaining");

  let activeBlockIndex = -1;
  let userScrolling = false;
  let scrollTimeout = null;
  let scrollAnimationFrame = null;
  let scrollBehaviorBeforeAnimation = null;

  // Catálogo linear de todas as palavras da música ativa
  let wordCatalog = [];
  let blockCueTimes = [];
  let currentLyrics = [];
  let currentSong = null;
  let currentSongId = 'viagens';

  // Catálogo central
  const catalog = window.SONGS_CATALOG || {
    viagens: {
      id: "viagens",
      title: "Frases de Viagem",
      durationSec: 180.87,
      durationText: "3:00",
      audioFile: "audio.mp3",
      lyrics: window.LYRICS_DATA || []
    }
  };

  // SVGs Nítidos e Oficiais das Bandeiras
  const FLAG_BRAZIL = `
    <svg class="flag-icon" viewBox="0 0 32 22" width="26" height="18">
      <rect width="32" height="22" rx="3" fill="#009c3b"/>
      <polygon points="16,3 29,11 16,19 3,11" fill="#ffdf00"/>
      <circle cx="16" cy="11" r="5" fill="#002776"/>
      <path d="M11.5,12 C13,10 19,10 20.5,12" stroke="#ffffff" stroke-width="0.9" fill="none"/>
    </svg>
  `;

  const FLAG_USA = `
    <svg class="flag-icon" viewBox="0 0 32 22" width="26" height="18">
      <defs>
        <clipPath id="flag-clip"><rect width="32" height="22" rx="3"/></clipPath>
      </defs>
      <g clip-path="url(#flag-clip)">
        <rect width="32" height="22" fill="#ffffff"/>
        <rect y="0" width="32" height="1.69" fill="#b22234"/>
        <rect y="3.38" width="32" height="1.69" fill="#b22234"/>
        <rect y="6.76" width="32" height="1.69" fill="#b22234"/>
        <rect y="10.14" width="32" height="1.69" fill="#b22234"/>
        <rect y="13.52" width="32" height="1.69" fill="#b22234"/>
        <rect y="16.9" width="32" height="1.69" fill="#b22234"/>
        <rect y="20.28" width="32" height="1.72" fill="#b22234"/>
        <rect width="13.5" height="11.83" fill="#3c3b6e"/>
        <circle cx="2.5" cy="2.2" r="0.75" fill="#ffffff"/>
        <circle cx="5.5" cy="2.2" r="0.75" fill="#ffffff"/>
        <circle cx="8.5" cy="2.2" r="0.75" fill="#ffffff"/>
        <circle cx="11.5" cy="2.2" r="0.75" fill="#ffffff"/>
        <circle cx="4" cy="4.2" r="0.75" fill="#ffffff"/>
        <circle cx="7" cy="4.2" r="0.75" fill="#ffffff"/>
        <circle cx="10" cy="4.2" r="0.75" fill="#ffffff"/>
        <circle cx="2.5" cy="6.2" r="0.75" fill="#ffffff"/>
        <circle cx="5.5" cy="6.2" r="0.75" fill="#ffffff"/>
        <circle cx="8.5" cy="6.2" r="0.75" fill="#ffffff"/>
        <circle cx="11.5" cy="6.2" r="0.75" fill="#ffffff"/>
        <circle cx="4" cy="8.2" r="0.75" fill="#ffffff"/>
        <circle cx="7" cy="8.2" r="0.75" fill="#ffffff"/>
        <circle cx="10" cy="8.2" r="0.75" fill="#ffffff"/>
        <circle cx="2.5" cy="10.2" r="0.75" fill="#ffffff"/>
        <circle cx="5.5" cy="10.2" r="0.75" fill="#ffffff"/>
        <circle cx="8.5" cy="10.2" r="0.75" fill="#ffffff"/>
        <circle cx="11.5" cy="10.2" r="0.75" fill="#ffffff"/>
      </g>
    </svg>
  `;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Carregar Música no Karaokê
  function loadKaraokeSong(songId) {
    if (!catalog[songId]) songId = Object.keys(catalog)[0];
    currentSongId = songId;
    currentSong = catalog[currentSongId];
    if (songHeaderTitle) songHeaderTitle.textContent = currentSong.title;

    localStorage.setItem('KARAOKE_ACTIVE_SONG', currentSongId);

    // Atualiza pills
    document.querySelectorAll('#karaokeSongPills .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-song') === currentSongId);
    });

    if (linkSyncCurrent) {
      linkSyncCurrent.href = `sincronizar.html?song=${currentSongId}`;
    }

    // Carrega áudio
    audio.pause();
    updatePlayPauseState(false);
    audio.src = currentSong.audioFile;
    audio.currentTime = 0;
    audio.load();

    currentLyrics = window.SyncStore.read(currentSongId, currentSong.lyrics);

    // Higieniza rigorosamente removendo todos os pontos finais de qualquer fonte (inclusive LocalStorage antigo)
    currentLyrics.forEach(b => {
      if (b.pt) b.pt = b.pt.replace(/[().]/g, "").trim();
      if (b.en1) b.en1 = b.en1.replace(/[().]/g, "").trim();
      if (b.en2) b.en2 = b.en2.replace(/[().]/g, "").trim();
      (b.words || []).forEach(w => {
        if (w.text) w.text = w.text.replace(/[().]/g, "").trim();
      });
    });

    activeBlockIndex = -1;
    timelineFill.style.width = '0%';
    labelCurrent.textContent = '0:00';
    labelRemaining.textContent = `-${formatTime(currentSong.durationSec || 180)}`;
    karaokePointer.classList.remove('pointer-visible');

    renderLyrics();
    buildWordCatalog();

    lyricsViewport.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 1. Renderizar as estrofes na tela
  function renderLyrics() {
    lyricsStream.innerHTML = "";

    currentLyrics.forEach((block, bIdx) => {
      const blockEl = document.createElement("div");
      blockEl.className = "karaoke-block";
      blockEl.id = `block-${bIdx}`;

      // Linha 1: Português (sem pontos finais)
      const ptWords = (block.words || []).filter(w => w.line === 'pt');
      const ptHtml = ptWords.map((w, wIdx) => 
        `<span class="word word-pt" id="word-${bIdx}-pt-${wIdx}">${CustomSongs.escapeHTML(w.text.replace(/\./g, ""))}</span>`
      ).join(" ");

      // Linha 2: Inglês 1ª vez (sem pontos finais)
      const en1Words = (block.words || []).filter(w => w.line === 'en1');
      const en1Html = en1Words.map((w, wIdx) => 
        `<span class="word word-en" id="word-${bIdx}-en1-${wIdx}">${CustomSongs.escapeHTML(w.text.replace(/\./g, ""))}</span>`
      ).join(" ");

      // Linha 3: Inglês 2ª vez (sem pontos finais)
      const en2Words = (block.words || []).filter(w => w.line === 'en2');
      const en2Html = en2Words.map((w, wIdx) => 
        `<span class="word word-en" id="word-${bIdx}-en2-${wIdx}">${CustomSongs.escapeHTML(w.text.replace(/\./g, ""))}</span>`
      ).join(" ");

      blockEl.innerHTML = `
        <div class="karaoke-line line-pt-wrapper" id="line-${bIdx}-pt">
          <div class="line-flag">${FLAG_BRAZIL}</div>
          <p class="line-text line-pt-text">${ptHtml || CustomSongs.escapeHTML(block.pt.replace(/\./g, ""))}</p>
        </div>

        <div class="karaoke-line line-en-wrapper" id="line-${bIdx}-en1">
          <div class="line-flag">${FLAG_USA}</div>
          <p class="line-text line-en-text">${en1Html || CustomSongs.escapeHTML(block.en1.replace(/\./g, ""))}</p>
        </div>

        ${block.en2 ? `
        <div class="karaoke-line line-en-wrapper" id="line-${bIdx}-en2">
          <div class="line-flag">${FLAG_USA}</div>
          <p class="line-text line-en-text">${en2Html || CustomSongs.escapeHTML(block.en2.replace(/\./g, ""))}</p>
        </div>
        ` : ''}
      `;

      lyricsStream.appendChild(blockEl);
    });
  }

  // Montar catálogo plano de palavras para indexação direta
  function buildWordCatalog() {
    wordCatalog = [];
    let catalogIdx = 0;

    currentLyrics.forEach((block, bIdx) => {
      ['pt', 'en1', 'en2'].forEach(lineKey => {
        const lineWords = (block.words || []).filter(w => w.line === lineKey);
        lineWords.forEach((w, wIdx) => {
          const el = document.getElementById(`word-${bIdx}-${lineKey}-${wIdx}`);
          wordCatalog.push({
            globalIdx: catalogIdx,
            blockIdx: bIdx,
            lineName: lineKey,
            wordIdx: wIdx,
            text: w.text,
            start: w.start,
            end: w.end,
            el: el
          });
          catalogIdx++;
        });
      });
    });

    // A troca visual usa o primeiro tempo real de cada bloco, e não apenas
    // o momento em que a palavra começa a ser destacada. Assim o próximo
    // conjunto de 3 linhas pode entrar na tela com antecedência.
    blockCueTimes = currentLyrics.map((block, blockIdx) => {
      const wordStarts = wordCatalog
        .filter(word => word.blockIdx === blockIdx && Number.isFinite(word.start))
        .map(word => word.start);
      const fallback = Number.isFinite(block.start) ? block.start : null;
      return wordStarts.length ? Math.min(...wordStarts) : fallback;
    });
  }

  // Prepara o próximo bloco um pouco antes da primeira palavra dele.
  // A seta continua sendo desenhada pelo tempo exato da palavra atual.
  const BLOCK_LEAD_SECONDS = 1;

  function visualBlockAt(time, activeWord = null) {
    if (activeWord) {
      const nextBlockIdx = activeWord.blockIdx + 1;
      const nextCue = blockCueTimes[nextBlockIdx];

      if (
        nextBlockIdx < currentLyrics.length &&
        Number.isFinite(nextCue) &&
        time >= nextCue - BLOCK_LEAD_SECONDS
      ) {
        return nextBlockIdx;
      }

      return activeWord.blockIdx;
    }

    // Durante uma pausa entre palavras, já posiciona o bloco que vem a seguir.
    for (let blockIdx = 0; blockIdx < blockCueTimes.length; blockIdx++) {
      const cue = blockCueTimes[blockIdx];
      if (
        Number.isFinite(cue) &&
        time >= cue - BLOCK_LEAD_SECONDS &&
        time < cue
      ) {
        return blockIdx;
      }
    }

    return -1;
  }

  // 2. Foco e centralização suave do bloco
  function focusBlock(bIdx, immediate = false) {
    if (bIdx === activeBlockIndex) {
      // Se a animação anterior não conseguiu trazer o card para a área de
      // leitura, tenta novamente sem reiniciar a animação a cada frame.
      const current = document.getElementById(`block-${bIdx}`);
      if (
        current &&
        !userScrolling &&
        !scrollAnimationFrame &&
        !isBlockFollowing(current)
      ) {
        scrollToElement(current);
      }
      return;
    }

    if (activeBlockIndex !== -1) {
      const prev = document.getElementById(`block-${activeBlockIndex}`);
      if (prev) prev.classList.remove("active-block");
    }

    activeBlockIndex = bIdx;
    const cur = document.getElementById(`block-${bIdx}`);

    if (cur) {
      cur.classList.add("active-block");
      if (!userScrolling || immediate) {
        scrollToElement(cur);
      }
    }
  }

  function isBlockFollowing(element) {
    const vRect = lyricsViewport.getBoundingClientRect();
    const eRect = element.getBoundingClientRect();
    const desiredTop = vRect.height * 0.28;
    const relativeTop = eRect.top - vRect.top;
    return Math.abs(relativeTop - desiredTop) <= 10;
  }

  function scrollToElement(element) {
    const vRect = lyricsViewport.getBoundingClientRect();
    const eRect = element.getBoundingClientRect();
    const rawTargetY = eRect.top - vRect.top - (vRect.height * 0.28) + lyricsViewport.scrollTop;
    const maxScrollTop = Math.max(0, lyricsViewport.scrollHeight - lyricsViewport.clientHeight);
    const targetY = Math.max(0, Math.min(maxScrollTop, rawTargetY));

    // A transição foi alongada para que a próxima parte entre na tela
    // devagar, dando tempo de acompanhar o bloco anterior.
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
      if (scrollBehaviorBeforeAnimation !== null) {
        lyricsViewport.style.scrollBehavior = scrollBehaviorBeforeAnimation;
        scrollBehaviorBeforeAnimation = null;
      }
    }
    const startY = lyricsViewport.scrollTop;
    const distance = targetY - startY;
    const duration = 700;
    const startedAt = performance.now();
    const previousScrollBehavior = lyricsViewport.style.scrollBehavior;
    scrollBehaviorBeforeAnimation = previousScrollBehavior;
    // Desativa o smooth nativo durante a animação manual para o navegador
    // não aplicar uma segunda animação por cima desta.
    lyricsViewport.style.scrollBehavior = "auto";
    const easeInOut = progress => progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const animateScroll = now => {
      const progress = Math.min(1, (now - startedAt) / duration);
      lyricsViewport.scrollTop = startY + distance * easeInOut(progress);
      if (progress < 1) {
        scrollAnimationFrame = requestAnimationFrame(animateScroll);
      } else {
        lyricsViewport.scrollTop = targetY;
        lyricsViewport.style.scrollBehavior = scrollBehaviorBeforeAnimation;
        scrollBehaviorBeforeAnimation = null;
        scrollAnimationFrame = null;
      }
    };

    scrollAnimationFrame = requestAnimationFrame(animateScroll);
  }

  // Detecção de toque/rolagem manual
  lyricsViewport.addEventListener("wheel", handleUserTouch, { passive: true });
  lyricsViewport.addEventListener("touchmove", handleUserTouch, { passive: true });

  function handleUserTouch() {
    userScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      userScrolling = false;
      if (activeBlockIndex !== -1) {
        const b = document.getElementById(`block-${activeBlockIndex}`);
        if (b) scrollToElement(b);
      }
    }, 3000);
  }

  // 3. Loop de Sincronização a 60 FPS
  function syncLoop() {
    if (currentSong) {
      const t = audio.currentTime;
      const dur = audio.duration || currentSong.durationSec || 180.87;

      // Barra de progresso
      const pct = (t / dur) * 100;
      timelineFill.style.width = `${pct}%`;
      labelCurrent.textContent = formatTime(t);
      labelRemaining.textContent = `-${formatTime(Math.max(0, dur - t))}`;

      // Encontrar o bloco atual
      let curBlockIdx = -1;
      for (let i = 0; i < currentLyrics.length; i++) {
        if (t >= currentLyrics[i].start && t < currentLyrics[i].end) {
          curBlockIdx = i;
          break;
        }
      }



      // Encontrar a palavra ativa
      let currentWord = null;
      let curWordIdx = -1;

      for (let i = 0; i < wordCatalog.length; i++) {
        const w = wordCatalog[i];
        if (Number.isFinite(w.start) && Number.isFinite(w.end) && t >= w.start && t < w.end) {
          currentWord = w;
          curWordIdx = i;
          break;
        }
      }

      if (currentWord) {
        focusBlock(visualBlockAt(t, currentWord));
        updateKaraokeVisuals(currentWord, curWordIdx, t);
      } else {
        focusBlock(visualBlockAt(t));
        wordCatalog.forEach(w => {
          w.el?.classList.remove("word-current");
          w.el?.classList.toggle("word-sung", Number.isFinite(w.end) && t >= w.end);
        });
        document.querySelectorAll(".line-singing").forEach(el => el.classList.remove("line-singing"));
        karaokePointer.classList.remove("pointer-visible");
      }
    }

    requestAnimationFrame(syncLoop);
  }

  // 4. Atualizar visual de cada palavra e posição fluida da seta
  function updateKaraokeVisuals(activeWord, activeIdx, currentTime) {
    if (!activeWord || !activeWord.el) return;

    // Atualizar classes das palavras
    wordCatalog.forEach((item, idx) => {
      if (!item.el) return;

      if (idx === activeIdx && currentTime >= item.start) {
        // Palavra sendo cantada agora: VERMELHO
        item.el.classList.add("word-current", "word-sung");
      } else if (idx <= activeIdx && currentTime >= item.start) {
        // Palavra já cantada: BRANCO
        item.el.classList.add("word-sung");
        item.el.classList.remove("word-current");
      } else {
        // Palavra futura: CINZA
        item.el.classList.remove("word-sung", "word-current");
      }
    });

    // Atualizar linha ativa
    document.querySelectorAll(".karaoke-line").forEach(l => l.classList.remove("line-singing"));
    const activeLine = document.getElementById(`line-${activeWord.blockIdx}-${activeWord.lineName}`);
    if (activeLine) {
      activeLine.classList.add("line-singing");
    }

    // Posicionar a setinha de cima no meio da palavra (deslizando suavemente)
    const wRect = activeWord.el.getBoundingClientRect();
    const appRect = appContainer.getBoundingClientRect();

    const wordCenterX = (wRect.left - appRect.left) + (wRect.width / 2);
    // Ponta da seta abaixada para ficar bem pertinho e colada na palavra
    const arrowTopY = (wRect.top - appRect.top) + 13;

    karaokePointer.style.left = `${wordCenterX}px`;
    karaokePointer.style.top = `${arrowTopY}px`;
    karaokePointer.classList.add("pointer-visible");
  }

  // 5. Controles de Reprodução
  function updatePlayPauseState(isPlaying) {
    if (isPlaying) {
      svgPlay.style.display = "none";
      svgPause.style.display = "block";
    } else {
      svgPlay.style.display = "block";
      svgPause.style.display = "none";
    }
  }

  btnPlay.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => {
        updatePlayPauseState(true);
      }).catch(err => {
        console.warn("Autoplay prevenido:", err);
      });
    } else {
      audio.pause();
      updatePlayPauseState(false);
    }
  });

  audio.addEventListener("play", () => updatePlayPauseState(true));
  audio.addEventListener("pause", () => updatePlayPauseState(false));
  audio.addEventListener("ended", () => {
    updatePlayPauseState(false);
    karaokePointer.classList.remove("pointer-visible");
  });

  btnBack.addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  });

  btnFwd.addEventListener("click", () => {
    const dur = audio.duration || currentSong.durationSec || 180;
    audio.currentTime = Math.min(dur, audio.currentTime + 5);
  });

  timelineHitbox.addEventListener("click", (e) => {
    const rect = timelineHitbox.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const dur = audio.duration || currentSong.durationSec || 180;
    audio.currentTime = ratio * dur;
  });

  // Atalhos de teclado
  window.addEventListener("keydown", (e) => {
    if (document.getElementById('appearanceSettings')?.open) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === "Space") {
      e.preventDefault();
      btnPlay.click();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      btnBack.click();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      btnFwd.click();
    }
  });

  // Listener para alternar de música nos pills do topo
  document.querySelectorAll('#karaokeSongPills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.getAttribute('data-song');
      if (sid && sid !== currentSongId) {
        history.replaceState(null, '', `?song=${sid}`);
        loadKaraokeSong(sid);
      }
    });
  });

  // Inicializar música ativa
  const urlParams = new URLSearchParams(window.location.search);
  const initialSong = urlParams.get('song') || localStorage.getItem('KARAOKE_ACTIVE_SONG') || 'viagens';
  loadKaraokeSong(initialSong);

  // Iniciar loop a 60 FPS
  requestAnimationFrame(syncLoop);
});
