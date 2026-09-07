// Lógica do Gravador de Sincronia Karaokê
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("syncAudio");
  const streamContainer = document.getElementById("streamContainer");
  const studioViewport = document.getElementById("studioViewport");

  // Controles
  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnPlayIcon = document.getElementById("btnPlayIcon");
  const btnTapWord = document.getElementById("btnTapWord");
  const btnUndo = document.getElementById("btnUndo");
  const btnSlowSpeed = document.getElementById("btnSlowSpeed");
  const lblSpeedBtn = document.getElementById("lblSpeedBtn");
  const lblSpeed = document.getElementById("lblSpeed");

  const btnResetSync = document.getElementById("btnResetSync");
  const btnExportJson = document.getElementById("btnExportJson");

  // Progresso
  const audioProgressBar = document.getElementById("audioProgressBar");
  const audioProgressFill = document.getElementById("audioProgressFill");
  const lblCurTime = document.getElementById("lblCurTime");
  const lblDuration = document.getElementById("lblDuration");

  // Contadores & Doca
  const currentWordNum = document.getElementById("currentWordNum");
  const totalWordsNum = document.getElementById("totalWordsNum");
  const dockTargetText = document.getElementById("dockTargetText");
  const dockContextText = document.getElementById("dockContextText");

  // Velocidades: 1.0x, 0.75x (ótimo para marcar com calma), 0.5x
  const speeds = [1.0, 0.75, 0.5];
  let curSpeedIdx = 0;

  // Lista linear de todas as palavras para marcação sequencial
  // Cada item: { blockIdx, lineName, wordIdx, text, start, end, synced }
  let flattenedWords = [];
  let currentTargetIndex = 0;

  // 1. Achatar as palavras a partir do LYRICS_DATA
  function initWords() {
    flattenedWords = [];
    LYRICS_DATA.forEach((block, bIdx) => {
      // Português
      const ptWords = block.pt.trim().split(/\s+/);
      ptWords.forEach((w, wIdx) => {
        flattenedWords.push({
          blockIdx: bIdx,
          lineName: 'pt',
          wordIdx: wIdx,
          text: w,
          start: null,
          end: null,
          synced: false
        });
      });

      // Inglês 1
      const en1Words = block.en1.trim().split(/\s+/);
      en1Words.forEach((w, wIdx) => {
        flattenedWords.push({
          blockIdx: bIdx,
          lineName: 'en1',
          wordIdx: wIdx,
          text: w,
          start: null,
          end: null,
          synced: false
        });
      });

      // Inglês 2 (se houver)
      if (block.en2) {
        const en2Words = block.en2.trim().split(/\s+/);
        en2Words.forEach((w, wIdx) => {
          flattenedWords.push({
            blockIdx: bIdx,
            lineName: 'en2',
            wordIdx: wIdx,
            text: w,
            start: null,
            end: null,
            synced: false
          });
        });
      }
    });

    totalWordsNum.textContent = flattenedWords.length;
  }

  // 2. Renderizar estrutura na tela
  function renderStudio() {
    streamContainer.innerHTML = "";

    LYRICS_DATA.forEach((block, bIdx) => {
      const blockBox = document.createElement("div");
      blockBox.className = "block-box";
      blockBox.id = `studio-block-${bIdx}`;

      blockBox.innerHTML = `
        <div class="block-title-tag">Frase ${bIdx + 1} de ${LYRICS_DATA.length}</div>
        
        <!-- Linha PT -->
        <div class="studio-line pt-line" id="studio-line-${bIdx}-pt">
          <span class="line-indicator">▶</span>
          <div class="words-wrapper" id="wrapper-${bIdx}-pt"></div>
        </div>

        <!-- Linha EN 1 -->
        <div class="studio-line en-line" id="studio-line-${bIdx}-en1">
          <span class="line-indicator">▶</span>
          <div class="words-wrapper" id="wrapper-${bIdx}-en1"></div>
        </div>

        <!-- Linha EN 2 -->
        ${block.en2 ? `
        <div class="studio-line en-line" id="studio-line-${bIdx}-en2">
          <span class="line-indicator">▶</span>
          <div class="words-wrapper" id="wrapper-${bIdx}-en2"></div>
        </div>
        ` : ''}
      `;

      streamContainer.appendChild(blockBox);
    });

    // Inserir os spans de palavras
    flattenedWords.forEach((item, flatIdx) => {
      const wrapper = document.getElementById(`wrapper-${item.blockIdx}-${item.lineName}`);
      if (!wrapper) return;

      const wordSpan = document.createElement("span");
      wordSpan.className = `studio-word ${item.lineName === 'pt' ? 'pt-line-word' : ''}`;
      wordSpan.id = `flat-word-${flatIdx}`;
      wordSpan.innerHTML = `
        <span class="word-chars">${item.text}</span>
        <span class="word-ts-badge" id="ts-badge-${flatIdx}">--</span>
      `;

      // Clique na palavra para navegar o alvo para ela
      wordSpan.addEventListener("click", () => {
        setTargetIndex(flatIdx);
        if (item.start !== null) {
          audio.currentTime = Math.max(0, item.start - 0.5);
        }
      });

      wrapper.appendChild(wordSpan);
    });

    updateUI();
  }

  // 3. Marcar a palavra atual no tempo corrente
  function tapCurrentWord() {
    if (audio.paused) {
      audio.play();
    }

    if (currentTargetIndex >= flattenedWords.length) {
      console.log("Todas as palavras já foram marcadas!");
      exportJson();
      return;
    }

    const t = audio.currentTime;
    const item = flattenedWords[currentTargetIndex];
    item.start = Math.round(t * 100) / 100;
    item.synced = true;

    // Se a palavra anterior não tinha end definido, define agora
    if (currentTargetIndex > 0) {
      const prev = flattenedWords[currentTargetIndex - 1];
      if (prev.end === null || prev.end > t) {
        prev.end = Math.round(t * 100) / 100;
      }
    }

    // Avança para a próxima palavra
    setTargetIndex(currentTargetIndex + 1);
  }

  // Definir qual palavra é o alvo atual
  function setTargetIndex(newIdx) {
    if (newIdx < 0) newIdx = 0;
    if (newIdx > flattenedWords.length) newIdx = flattenedWords.length;

    currentTargetIndex = newIdx;
    updateUI();
    scrollToTarget();
  }

  // Desfazer última marcação
  function undoLastWord() {
    if (currentTargetIndex > 0) {
      const prevIdx = currentTargetIndex - 1;
      const prev = flattenedWords[prevIdx];
      prev.start = null;
      prev.end = null;
      prev.synced = false;
      setTargetIndex(prevIdx);
      if (prevIdx > 0 && flattenedWords[prevIdx - 1].start !== null) {
        audio.currentTime = Math.max(0, flattenedWords[prevIdx - 1].start - 0.2);
      }
    }
  }

  // Atualizar visual da interface
  function updateUI() {
    currentWordNum.textContent = currentTargetIndex;

    // Atualizar cada palavra
    flattenedWords.forEach((item, idx) => {
      const el = document.getElementById(`flat-word-${idx}`);
      const badge = document.getElementById(`ts-badge-${idx}`);
      if (!el) return;

      el.classList.toggle("synced", item.synced);
      el.classList.toggle("target-next", idx === currentTargetIndex);

      if (item.start !== null) {
        badge.textContent = `${item.start.toFixed(1)}s`;
      } else {
        badge.textContent = "--";
      }
    });

    // Atualizar Linhas e Blocos ativos
    if (currentTargetIndex < flattenedWords.length) {
      const cur = flattenedWords[currentTargetIndex];
      
      document.querySelectorAll(".studio-line").forEach(l => l.classList.remove("line-active"));
      document.querySelectorAll(".block-box").forEach(b => b.classList.remove("active-block"));

      const activeLine = document.getElementById(`studio-line-${cur.blockIdx}-${cur.lineName}`);
      if (activeLine) activeLine.classList.add("line-active");

      const activeBlock = document.getElementById(`studio-block-${cur.blockIdx}`);
      if (activeBlock) activeBlock.classList.add("active-block");

      // Atualizar Doca Flutuante
      dockTargetText.textContent = cur.text;
      const block = LYRICS_DATA[cur.blockIdx];
      dockContextText.textContent = `${cur.lineName === 'pt' ? 'Português' : 'Inglês'}: "${cur.lineName === 'pt' ? block.pt : (cur.lineName === 'en1' ? block.en1 : block.en2)}"`;
    } else {
      dockTargetText.textContent = "CONCLUÍDO! 🎉";
      dockContextText.textContent = "Todas as palavras foram sincronizadas. Clique em Baixar JSON!";
    }
  }

  // Rolar para a palavra alvo
  function scrollToTarget() {
    if (currentTargetIndex >= flattenedWords.length) return;
    const targetEl = document.getElementById(`flat-word-${currentTargetIndex}`);
    if (targetEl) {
      const vRect = studioViewport.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      const targetScroll = tRect.top - vRect.top - (vRect.height * 0.35) + studioViewport.scrollTop;

      studioViewport.scrollTo({
        top: targetScroll,
        behavior: "smooth"
      });
    }
  }

  // 4. Exportar JSON Completo Formatado
  function exportJson() {
    // Reconstruir a estrutura completa do LYRICS_DATA atualizado
    const updatedData = JSON.parse(JSON.stringify(LYRICS_DATA));

    updatedData.forEach((block, bIdx) => {
      const blockWords = flattenedWords.filter(w => w.blockIdx === bIdx);
      
      // Montar array de words do bloco
      block.words = blockWords.map(w => {
        const start = w.start !== null ? w.start : 0.0;
        const end = w.end !== null ? w.end : (start + 0.6);
        return {
          text: w.text,
          start: Math.round(start * 100) / 100,
          end: Math.round(end * 100) / 100,
          line: w.lineName
        };
      });

      // Calcular tempos das linhas
      const ptWords = block.words.filter(w => w.line === 'pt');
      const en1Words = block.words.filter(w => w.line === 'en1');
      const en2Words = block.words.filter(w => w.line === 'en2');

      if (ptWords.length > 0) {
        block.pt_start = ptWords[0].start;
        block.pt_end = ptWords[ptWords.length - 1].end;
      }

      if (en1Words.length > 0) {
        block.en1_start = en1Words[0].start;
        block.en1_end = en1Words[en1Words.length - 1].end;
      }

      if (en2Words.length > 0) {
        block.en2_start = en2Words[0].start;
        block.en2_end = en2Words[en2Words.length - 1].end;
      }

      // Início e Fim do bloco
      block.start = block.pt_start || (blockWords[0] ? blockWords[0].start : block.start);
      const allEnds = [block.pt_end, block.en1_end, block.en2_end].filter(Boolean);
      block.end = allEnds.length > 0 ? Math.max(...allEnds) : block.end;
    });

    const jsonStr = JSON.stringify(updatedData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sincronizacao_karaoke.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("✅ Arquivo 'sincronizacao_karaoke.json' baixado com sucesso! Agora basta me enviar ou colar o conteúdo aqui que eu aplico imediatamente no site!");
  }

  // 5. Loop de Tempo do Áudio
  function timeLoop() {
    const cur = audio.currentTime;
    const dur = audio.duration || 180.87;
    const pct = (cur / dur) * 100;
    audioProgressFill.style.width = `${pct}%`;

    const m = Math.floor(cur / 60);
    const s = (cur % 60).toFixed(1);
    lblCurTime.textContent = `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;

    requestAnimationFrame(timeLoop);
  }

  // 6. Controles de Reprodução e Teclas
  btnPlayPause.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    btnPlayIcon.textContent = "⏸ Pausar Música";
  });

  audio.addEventListener("pause", () => {
    btnPlayIcon.textContent = "▶ Tocar Música";
  });

  // Botão Tocar Palavra
  btnTapWord.addEventListener("click", () => {
    tapCurrentWord();
  });

  // Botão Desfazer
  btnUndo.addEventListener("click", () => {
    undoLastWord();
  });

  // Alterar velocidade para marcar mais fácil
  btnSlowSpeed.addEventListener("click", () => {
    curSpeedIdx = (curSpeedIdx + 1) % speeds.length;
    const spd = speeds[curSpeedIdx];
    audio.playbackRate = spd;
    lblSpeedBtn.textContent = `Vel: ${spd}x`;
    lblSpeed.textContent = `${spd}x`;
  });

  // Clique na barra de progresso
  audioProgressBar.addEventListener("click", (e) => {
    const rect = audioProgressBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = audio.duration || 180.87;
    audio.currentTime = Math.max(0, Math.min(dur, ratio * dur));
  });

  // Resetar
  btnResetSync.addEventListener("click", () => {
    if (confirm("Deseja realmente zerar todas as marcações e começar do zero?")) {
      audio.currentTime = 0;
      audio.pause();
      initWords();
      renderStudio();
      setTargetIndex(0);
    }
  });

  // Baixar JSON
  btnExportJson.addEventListener("click", exportJson);

  // 7. Eventos de Teclado (Espaço ou Seta Direita)
  window.addEventListener("keydown", (e) => {
    // Espaço ou Seta para a Direita = MARCAR PALAVRA
    if (e.code === "Space" || e.code === "ArrowRight") {
      e.preventDefault();
      tapCurrentWord();
    } 
    // Ctrl+Z ou Backspace ou Seta Esquerda = DESFAZER
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undoLastWord();
    } else if (e.code === "ArrowLeft" || e.code === "Backspace") {
      e.preventDefault();
      undoLastWord();
    }
    // Tecla P = Play/Pause
    else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (audio.paused) audio.play();
      else audio.pause();
    }
  });

  // Inicialização
  initWords();
  renderStudio();
  requestAnimationFrame(timeLoop);
});
