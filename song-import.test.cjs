const test = require('node:test');
const assert = require('node:assert/strict');
const {parse} = require('./song-import.js');

test('groups pasted lines into Portuguese and two English lines', () => {
  const result = parse('Eu preciso de ajuda.\nI need help.\nI need help.\n\nOnde fica?\nWhere is it?\nWhere is it?');
  assert.equal(result.blocks.length,2);
  assert.equal(result.blocks[0].pt,'Eu preciso de ajuda');
  assert.equal(result.blocks[0].en1,'I need help');
  assert.equal(result.blocks[0].en2,'I need help');
  assert.equal(result.blocks[1].pt,'Onde fica?');
  assert.equal(result.remaining,0);
  assert.deepEqual(result.blocks[0].words.map(w=>w.line),['pt','pt','pt','pt','en1','en1','en1','en2','en2','en2']);
  assert.ok(result.blocks.flatMap(b=>b.words).every(w=>w.start === null && w.end === null));
});
test('groups two-line parts as Portuguese and English and keeps single lines in English', () => {
  const result = parse('Eu moro aqui.\nI live here.\n\nI work here.');
  assert.deepEqual(result.blocks.map(block => [block.pt, block.en1, block.en2]), [
    ['Eu moro aqui', 'I live here', ''], ['', 'I work here', '']
  ]);
});
test('uses a blank line as the only stanza separator', () => {
  const result = parse('Eu moro aqui.\nI live here.\n\nEu trabalho aqui.\nI work here.');
  assert.deepEqual(result.blocks.map(block => [block.pt, block.en1, block.en2]), [
    ['Eu moro aqui', 'I live here', ''], ['Eu trabalho aqui', 'I work here', '']
  ]);
});
test('keeps a two-line English stanza together for manual role editing', () => {
  const result = parse('I live here.\nI work here.');
  assert.deepEqual(result.blocks.map(block => [block.pt, block.en1, block.en2]), [
    ['', 'I live here', 'I work here']
  ]);
});
test('handles Windows, old Mac and Unicode newlines, blanks and repeated spaces', () => {
  const result = parse('  Bom\t dia...\r\n\r\n Good   morning… \rGood morning.\u2028Até logo.\u2029See you.\nSee you。');
  assert.equal(result.lineCount,6);
  assert.equal(result.blocks[0].en1,'Bom dia');
  assert.equal(result.blocks[1].en1,'Good morning');
  assert.equal(result.blocks.length,2);
  assert.ok(result.blocks[1].en2.includes('See you'));
});
test('short English-only sections are preserved for later editing', () => {
  assert.equal(parse('Uma linha').remaining,0);
  assert.equal(parse('Uma\nDuas').remaining,0);
  assert.equal(parse('Uma\nDuas\nTrês\nQuatro').remaining,0);
  assert.equal(parse('Português\n(English)').remaining,0);
  assert.equal(parse(' \n...\n').lineCount,0);
});
test('preserves contractions and question marks, without splitting long lines', () => {
  const result = parse("Eu não sei, pode me ajudar?\nI don't know, can you help me?\nI don't know, can you help me?");
  assert.equal(result.blocks.length,1);
  assert.ok(result.blocks[0].words.some(w=>w.text === "don't"));
  assert.ok(result.blocks[0].words.some(w=>w.text === 'me?'));
});
test('removes wrapping parentheses and final dots from the supplied format', () => {
  const result = parse(`Eu moro aqui.\n(I live here.)\nI live here.\n\nEu estou pronto.\n(I am ready.)\nI am ready.`);
  assert.equal(result.remaining,0);
  assert.equal(result.blocks[0].pt,'Eu moro aqui');
  assert.equal(result.blocks[0].en1,'I live here');
  assert.equal(result.blocks[0].en2,'I live here');
  assert.ok(result.blocks.flatMap(block => block.words).every(word => !/[().]/.test(word.text)));
});
test('keeps a trailing English-only section instead of dropping it', () => {
  const result = parse(`Eu moro aqui.\n(I live here.)\nI live here.\n\nI live here.\nI work here.\nI can wait.\nI can pay.`);
  assert.equal(result.remaining,0);
  assert.equal(result.blocks.length,2);
  assert.equal(result.blocks[1].en1,'I live here');
  assert.ok(result.blocks[1].en2.includes('I can pay'));
});
