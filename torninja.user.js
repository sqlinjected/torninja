// ==UserScript==
// @name         Torninja
// @namespace    https://github.com/sqlinjected/torninja
// @version      0.3
// @description  A draggable ninja war partner for Torn City.
// @author       sqlinjected
// @match        https://www.torn.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <path fill="#23233a" d="M6 0h4v1h-4zM4 1h8v1h-8zM3 2h10v1h-10zM2 4h1v1h-1zM13 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM11 5h1v1h-1zM13 5h1v1h-1zM2 6h12v1h-12zM3 7h10v1h-10zM5 8h6v1h-6zM2 9h12v1h-12zM1 10h2v1h-2zM4 10h3v1h-3zM9 10h3v1h-3zM13 10h2v1h-2zM2 11h1v1h-1zM4 11h8v1h-8zM13 11h1v1h-1zM4 12h8v1h-8zM4 13h3v1h-3zM9 13h3v1h-3zM4 14h3v1h-3zM9 14h3v1h-3zM3 15h4v1h-4zM9 15h4v1h-4z"/>
  <path fill="#f1c49b" d="M3 4h10v1h-10zM3 5h1v1h-1zM6 5h4v1h-4zM12 5h1v1h-1zM1 11h1v1h-1zM14 11h1v1h-1z"/>
  <path fill="#d84a3f" d="M2 3h12v1h-12zM15 4h1v1h-1zM14 5h2v1h-2zM7 10h2v1h-2z"/>
  <path fill="#fff" d="M4 5h1v1h-1zM10 5h1v1h-1z"/>
  <path fill="#3b3b58" d="M4 8h1v1h-1zM11 8h1v1h-1z"/>
</svg>`;

  let cfg = GM_getValue('settings', { apiKey: '', enemyFaction: '', chainSeconds: 60, hospSeconds: 30 });
  let pos = GM_getValue('pos', { x: 20, y: 120 });

  let style = document.createElement('style');
  style.textContent = `
#torninja{position:fixed;z-index:999999;width:56px;height:56px;user-select:none}
#tn-n{width:100%;height:100%;cursor:grab;touch-action:none}
#tn-n svg{width:100%;height:100%;display:block}
.jump{animation:jump .4s 3}
@keyframes jump{50%{transform:translateY(-14px)}}
#tn-b{display:none;position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:10px;
  background:#fff;color:#23233a;border:2px solid #23233a;border-radius:6px;padding:4px 8px;font:bold 12px sans-serif;white-space:nowrap}
#tn-p{display:none;position:absolute;top:100%;left:0;margin-top:6px;width:200px;
  background:#1f1f2e;color:#eee;border:1px solid #444;border-radius:6px;padding:10px;font:12px sans-serif}
#tn-p input{width:100%;box-sizing:border-box;margin:2px 0 6px;padding:4px;background:#2b2b40;color:#fff;border:1px solid #555;border-radius:4px}
#tn-p button{margin:6px 4px 0 0;padding:4px 10px;background:#d84a3f;color:#fff;border:0;border-radius:4px;cursor:pointer}`;
  document.head.append(style);

  let box = document.createElement('div');
  box.id = 'torninja';
  box.innerHTML = `<div id="tn-b"></div><div id="tn-n">${svg}</div>
<div id="tn-p"><b>Torninja v0.3</b><br><br>
API key<input id="tn-key" type="password">
Enemy faction ID<input id="tn-fac">
Chain alert (seconds)<input id="tn-chain" type="number">
Hosp alert (seconds)<input id="tn-hosp" type="number">
<button id="tn-save">Save</button><button id="tn-test">Test</button></div>`;
  document.body.append(box);

  let ninja = document.getElementById('tn-n');
  let bubble = document.getElementById('tn-b');
  let panel = document.getElementById('tn-p');
  document.getElementById('tn-key').value = cfg.apiKey;
  document.getElementById('tn-fac').value = cfg.enemyFaction;
  document.getElementById('tn-chain').value = cfg.chainSeconds;
  document.getElementById('tn-hosp').value = cfg.hospSeconds || 30;

  function move(x, y) {
    box.style.left = Math.max(0, Math.min(x, innerWidth - 56)) + 'px';
    box.style.top = Math.max(0, Math.min(y, innerHeight - 56)) + 'px';
  }
  move(pos.x, pos.y);

  let audio;
  function beep() {
    if (!audio) return;
    [780, 1040].forEach((f, i) => {
      let o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * 0.18;
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.16);
    });
  }

  let timer;
  function say(msg) {
    beep();
    bubble.textContent = msg;
    bubble.style.display = 'block';
    clearTimeout(timer);
    timer = setTimeout(() => bubble.style.display = 'none', 5000);
    ninja.classList.remove('jump');
    void ninja.offsetWidth;
    ninja.classList.add('jump');
  }

  let drag = null;
  ninja.onpointerdown = e => {
    drag = { sx: e.clientX, sy: e.clientY, ox: e.clientX - box.offsetLeft, oy: e.clientY - box.offsetTop, moved: false };
    ninja.setPointerCapture(e.pointerId);
  };
  ninja.onpointermove = e => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 4) drag.moved = true;
    if (drag.moved) move(e.clientX - drag.ox, e.clientY - drag.oy);
  };
  ninja.onpointerup = () => {
    if (!drag) return;
    if (drag.moved) GM_setValue('pos', { x: box.offsetLeft, y: box.offsetTop });
    else {
      if (!audio) audio = new AudioContext();
      audio.resume();
      panel.style.display = panel.style.display == 'block' ? 'none' : 'block';
    }
    drag = null;
  };

  document.getElementById('tn-save').onclick = () => {
    cfg.apiKey = document.getElementById('tn-key').value.trim();
    cfg.enemyFaction = document.getElementById('tn-fac').value.trim();
    cfg.chainSeconds = +document.getElementById('tn-chain').value || 60;
    cfg.hospSeconds = +document.getElementById('tn-hosp').value || 30;
    GM_setValue('settings', cfg);
    say('saved');
    check();
    checkEnemies();
  };
  document.getElementById('tn-test').onclick = () => say('chain under 60s!!');

  let chainEnd = 0, chainCount = 0, warned = false, lastErr = '';

  async function check() {
    if (!cfg.apiKey) return;
    try {
      let r = await fetch('https://api.torn.com/user/?selections=bars&key=' + cfg.apiKey);
      let data = await r.json();
      if (data.error) {
        if (data.error.error != lastErr) say('api: ' + data.error.error);
        lastErr = data.error.error;
        return;
      }
      lastErr = '';
      chainCount = data.chain.current;
      chainEnd = data.chain.timeout > 0 ? Date.now() + data.chain.timeout * 1000 : 0;
    } catch (e) {}
  }
  check();
  setInterval(check, 15000);

  setInterval(() => {
    if (!chainEnd || chainCount < 10) return;
    let left = Math.round((chainEnd - Date.now()) / 1000);
    if (left > cfg.chainSeconds) warned = false;
    else if (left > 0 && !warned) {
      warned = true;
      say('chain ' + chainCount + ' - ' + left + 's left!');
    }
  }, 1000);

  let enemies = {}, hospWarned = {};

  async function checkEnemies() {
    if (!cfg.apiKey || !cfg.enemyFaction) return;
    try {
      let r = await fetch('https://api.torn.com/faction/' + cfg.enemyFaction + '?selections=basic&key=' + cfg.apiKey);
      let data = await r.json();
      if (data.error) {
        if (data.error.error != lastErr) say('api: ' + data.error.error);
        lastErr = data.error.error;
        return;
      }
      enemies = {};
      for (let id in data.members) {
        let m = data.members[id];
        if (m.status.state == 'Hospital') enemies[id] = { name: m.name, until: m.status.until * 1000 };
      }
    } catch (e) {}
  }
  checkEnemies();
  setInterval(checkEnemies, 30000);

  setInterval(() => {
    let soon = [];
    for (let id in enemies) {
      let e = enemies[id];
      let left = Math.round((e.until - Date.now()) / 1000);
      let key = id + ':' + e.until;
      if (left <= (cfg.hospSeconds || 30) && left > -5 && !hospWarned[key]) {
        hospWarned[key] = true;
        soon.push(e.name + ' ' + Math.max(left, 0) + 's');
      }
    }
    if (soon.length) say(soon.join(', ') + ' - out of hosp!');
  }, 1000);

  addEventListener('resize', () => move(box.offsetLeft, box.offsetTop));
})();
