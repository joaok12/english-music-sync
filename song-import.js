(function (root) {
  function cleanLine(value) {
    let line = String(value || '').replace(/\s+/g, ' ').trim();
    // Copied translations often arrive as "(I live here.)". Parentheses are
    // formatting from the copied source, so remove them wherever they occur.
    line = line.replace(/[()]/g, '');
    return line.replace(/[.…。]+$/u, '').trim();
  }

  const portugueseWords = new Set(`
    a ao aos aquela aquele aquilo aqui ali amanhã agora ajuda algumas algum
    como com da das de demais depois do dos e ela elas ele eles em entrar está
    estamos estou eu fácil fazer fica foi para pagar pode podem por posso que
    quero sair sem seu sua também tenho tempo uma um você vocês vamos ver
  `.trim().split(/\s+/));
  const englishWords = new Set(`
    a about after again all am an and are as at be can do does enter for from
    good have he here how i in is it leave let like me my need no of on or pay
    ready say she start that the there this to wait was we what where who will
    work you your
  `.trim().split(/\s+/));

  function detectLanguage(line) {
    const text = cleanLine(line);
    const normalized = text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tokens = normalized.match(/[a-z]+/g) || [];
    let ptScore = /[ãõç]/i.test(text) ? 3 : 0;
    let enScore = 0;
    tokens.forEach(token => {
      if (portugueseWords.has(token)) ptScore += 1;
      if (englishWords.has(token)) enScore += 1;
    });
    if (ptScore > enScore && ptScore > 0) return 'pt';
    if (enScore > ptScore && enScore > 0) return 'en';
    return 'unknown';
  }

  function makeBlockValues(values, id) {
    const block = {
      id,
      pt: cleanLine(values.pt),
      en1: cleanLine(values.en1),
      en2: cleanLine(values.en2),
      words: []
    };
    for (const line of ['pt', 'en1', 'en2']) {
      block.words.push(...(block[line] ? block[line].split(' ') : [])
        .filter(Boolean).map(text => ({text, line, start: null, end: null})));
    }
    return block;
  }

  function makeBlock(lines, id, englishOnly = false) {
    return makeBlockValues(englishOnly
      ? {pt: '', en1: lines[0] || '', en2: ''}
      : {pt: lines[0] || '', en1: lines[1] || '', en2: lines[2] || ''}, id);
  }

  function makeLanguageBlock(lines, id) {
    const values = {pt: '', en1: '', en2: ''};
    lines.forEach((line, index) => {
      const language = detectLanguage(line);
      if (language === 'pt' && !values.pt) values.pt = line;
      else if (language === 'en' && !values.en1) values.en1 = line;
      else if (language === 'en' && !values.en2) values.en2 = line;
      else if (!values.pt && index === 0) values.pt = line;
      else if (!values.en1) values.en1 = line;
      else if (!values.en2) values.en2 = line;
      else values.en2 = `${values.en2} ${line}`;
    });
    return makeBlockValues(values, id);
  }

  function parseSection(section, nextId) {
    if (section.length === 1) return [makeBlock(section, nextId(), true)];
    // A linha em branco é o separador real: toda estrofe vira uma única parte,
    // independentemente de ter uma, duas ou três linhas em inglês/português.
    return [makeLanguageBlock(section, nextId())];
  }

  const api = {
    parse(text) {
      const sections = String(text || '').replace(/\r\n?/g, '\n').split(/[\n\u2028\u2029]/)
        .map(cleanLine).reduce((groups, line, index, source) => {
          if (line) groups[groups.length - 1].push(line);
          else if (index < source.length - 1 && groups[groups.length - 1].length) groups.push([]);
          return groups;
        }, [[]]).filter(group => group.length);
      const rows = sections.flat();
      const blocks = [];
      const leftovers = [];
      let nextBlockId = 1;
      const nextId = () => nextBlockId++;
      for (const section of sections) {
        if (section.length) blocks.push(...parseSection(section, nextId));
      }
      return {blocks, lineCount: rows.length, remaining: leftovers.length,
        leftovers,
        wordCount: blocks.reduce((total, block) => total + block.words.length, 0)};
    },
    toEditableParts(blocks) {
      return (blocks || []).map(block => ({
        rows: [
          block.pt && {role: 'pt', text: block.pt},
          block.en1 && {role: 'en1', text: block.en1},
          block.en2 && {role: 'en2', text: block.en2}
        ].filter(Boolean)
      }));
    },
    fromEditableParts(parts) {
      return (parts || []).map((part, index) => {
        const values = {pt: '', en1: '', en2: ''};
        (part.rows || []).forEach(row => {
          const text = cleanLine(row.text);
          if (!text) return;
          let role = ['pt', 'en1', 'en2'].includes(row.role) ? row.role : 'en1';
          if (values[role]) values[role] = `${values[role]} ${text}`;
          else values[role] = text;
        });
        return makeBlockValues(values, index + 1);
      }).filter(block => block.pt || block.en1 || block.en2);
    },
    renderEditablePreview(container, parts, onChange, onMerge) {
      const labels = {pt: 'Português', en1: 'Inglês 1', en2: 'Inglês 2'};
      container.replaceChildren();
      (parts || []).forEach((part, partIndex) => {
        const section = document.createElement('div');
        section.className = 'preview-part';
        const heading = document.createElement('strong');
        heading.textContent = `Parte ${partIndex + 1}`;
        section.append(heading);

        if (partIndex < parts.length - 1) {
          const merge = document.createElement('button');
          merge.type = 'button';
          merge.className = 'preview-merge';
          merge.textContent = '↕ Juntar com a próxima';
          merge.addEventListener('click', () => onMerge?.(partIndex));
          section.append(merge);
        }

        (part.rows || []).forEach((row, rowIndex) => {
          const line = document.createElement('div');
          line.className = 'preview-line';
          const role = document.createElement('select');
          role.className = 'preview-role';
          role.setAttribute('aria-label', `Tipo da linha ${rowIndex + 1} da parte ${partIndex + 1}`);
          Object.entries(labels).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            option.selected = row.role === value;
            role.append(option);
          });
          role.addEventListener('change', () => onChange(partIndex, rowIndex, 'role', role.value));

          const text = document.createElement('input');
          text.type = 'text';
          text.className = 'preview-text';
          text.value = row.text;
          text.setAttribute('aria-label', `Texto da linha ${rowIndex + 1} da parte ${partIndex + 1}`);
          text.addEventListener('input', () => onChange(partIndex, rowIndex, 'text', text.value));

          line.append(role, text);
          section.append(line);
        });
        container.append(section);
      });
    }
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.SongImport = api;
})(globalThis);
