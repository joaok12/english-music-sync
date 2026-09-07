const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const storage = new Map();
const context = {window:{},console,localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}};
vm.runInNewContext(fs.readFileSync('sync-store.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('songs-data.js','utf8'),context);
const api = context.window.SyncStore;
test('existing song timings survive loading and export unchanged', () => {
  storage.clear();
  for (const song of Object.values(context.window.SONGS_CATALOG)) {
    const lyrics = api.read(song.id,song.lyrics);
    const words = lyrics.flatMap((block,blockIdx)=>block.words.map(w=>({...w,blockIdx,lineName:w.line})));
    const compiled = api.compile(lyrics,words);
    assert.equal(JSON.stringify(compiled),JSON.stringify(lyrics));
  }
});
test('saved synchronization has priority and is never deleted', () => {
  storage.clear();
  const value = JSON.stringify([{words:[{text:'Hi',line:'en1',start:1.123456,end:2.654321}]}]);
  storage.set('KARAOKE_SYNC_viagens',value);
  assert.equal(JSON.stringify(api.read('viagens',[])),value);
  assert.equal(storage.get('KARAOKE_SYNC_viagens'),value);
});
test('old saved lyrics are cleaned without changing their timestamps', () => {
  storage.clear();
  const value = JSON.stringify([{pt:'Eu moro aqui.',en1:'(I live here.)',en2:'I live here.',words:[{text:'(I',line:'en1',start:1.125,end:1.75}]}]);
  storage.set('KARAOKE_SYNC_viagens',value);
  const cleaned = api.read('viagens',[]);
  assert.equal(cleaned[0].en1,'I live here');
  assert.equal(cleaned[0].words[0].text,'I');
  assert.equal(cleaned[0].words[0].start,1.125);
  assert.equal(JSON.parse(storage.get('KARAOKE_SYNC_viagens'))[0].en1,'I live here');
});
test('incomplete or inverted timing cannot overwrite the player', () => {
  for (const [start,end] of [[null,null],[3,2],[1,null],[-1,2]]) {
    assert.throws(()=>api.compile([{words:[]}],[{text:'Hi',lineName:'en1',blockIdx:0,start,end}]));
  }
});
test('imports a completed JSON file and keeps exact times while cleaning text', () => {
  const imported = api.importLyrics(JSON.stringify([{pt:'Eu moro aqui.',en1:'(I live here.)',en2:'I live here.',words:[
    {text:'Eu',line:'pt',start:7.123456,end:7.8},
    {text:'(I',line:'en1',start:8.25,end:8.75},
    {text:'live',line:'en1',start:8.75,end:9.1},
    {text:'here.)',line:'en1',start:9.1,end:9.8},
    {text:'I',line:'en2',start:10,end:10.4},
    {text:'live',line:'en2',start:10.4,end:10.8},
    {text:'here.',line:'en2',start:10.8,end:11.3}
  ]}]));
  assert.equal(imported[0].en1,'I live here');
  assert.deepEqual(Array.from(imported[0].words.slice(1,4).map(word=>word.text)),['I','live','here']);
  assert.equal(imported[0].words[1].start,8.25);
});
test('rejects a JSON file that has text but no synchronized words', () => {
  assert.throws(() => api.importLyrics([{pt:'Oi',en1:'Hi',en2:'Hi'}]), /palavras sincronizadas/);
});
