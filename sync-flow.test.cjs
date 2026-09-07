const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {parse} = require('./song-import.js');

// Exercise the existing editor handlers without requiring a connected browser.
async function editor(storage = new Map()) {
  const elements = new Map(), callbacks = {};
  function element() {
    return {textContent:'',innerHTML:'',currentTime:0,paused:true,style:{},listeners:{},
      classList:{toggle(){},add(){},remove(){}},
      addEventListener(event,callback){this.listeners[event] = callback;},
      appendChild(){},pause(){this.paused = true;},play(){this.paused = false; return Promise.resolve();},load(){},
      getBoundingClientRect(){return {top:0,height:400};},scrollTop:0,scrollTo(){}};
  }
  const document = {addEventListener:(event,callback)=>{callbacks[event] = callback;},
    getElementById(id){if(!elements.has(id)) elements.set(id,element()); return elements.get(id);},
    createElement:element,querySelectorAll:()=>[]};
  const context = {document,console,URLSearchParams,requestAnimationFrame(){},
    history:{replaceState(){}},alert(message){throw new Error(message);},
    localStorage:{getItem:key=>storage.get(key) || null,setItem:(key,value)=>storage.set(key,value)},
    window:{location:{search:'?song=custom_test'},addEventListener(){},
      CustomSongs:{ready:Promise.resolve(),escapeHTML:text=>text},
      SONGS_CATALOG:{custom_test:{id:'custom_test',title:'Teste',audioFile:'blob:test',durationSec:10,lyrics:parse('Oi.\nHello.\nHello.').blocks}}}};
  context.CustomSongs = context.window.CustomSongs;
  vm.runInNewContext(fs.readFileSync('sync-store.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('sincronizar.js','utf8'),context);
  await callbacks.DOMContentLoaded();
  return {storage,elements,tap(time){elements.get('audioElement').currentTime = time; elements.get('btnTap').listeners.click();}};
}
test('pasted lyric reaches editor and complete marking automatically saves to player', async () => {
  const app = await editor();
  assert.equal(app.elements.get('lblWordTotal').textContent,3);
  [1,2,3,4].forEach(time=>app.tap(time));
  const saved = JSON.parse(app.storage.get('KARAOKE_SYNC_custom_test'));
  assert.deepEqual(saved[0].words.map(w=>[w.text,w.start,w.end]),[['Oi',1,2],['Hello',2,3],['Hello',3,4]]);
  assert.equal(app.elements.get('syncSaveStatus').textContent,'✓ Sincronização salva no karaokê');
});
test('reopening the editor resumes the saved draft and completes it', async () => {
  const first = await editor();
  first.tap(1); first.tap(2);
  assert.equal(first.storage.has('KARAOKE_SYNC_custom_test'),false);
  const resumed = await editor(first.storage);
  assert.equal(resumed.elements.get('syncSaveStatus').textContent,'✓ Rascunho recuperado');
  resumed.tap(3); resumed.tap(4);
  assert.equal(JSON.parse(resumed.storage.get('KARAOKE_SYNC_custom_test'))[0].words[0].start,1);
});
