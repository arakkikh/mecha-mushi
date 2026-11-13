'use strict';
// ===== 戦闘画面（タップ操作と演出） =====
const BattleUI = (() => {
  const E = Engine;
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const SPEED = { step: 70, pause: 350 };

  let b = null;          // 戦闘状態
  let opts = null;       // { stage, onEnd }
  let mode = 'idle';     // idle / selected / moved / target / heal / busy / over
  let sel = null;        // 選択中ユニット
  let reach = null;      // 移動範囲
  let origin = null;     // 移動前の位置
  let cardSel = null;    // 選択中のカード { deckIdx, id, tiles }
  const unitEls = new Map();
  const chestEls = new Map();

  // extra: { chestsTaken, noChests, onChest(ev), deck: [カードID], minigame: true/false }
  function start(stage, playerSpecs, enemySpecs, onEnd, extra) {
    opts = Object.assign({ stage, onEnd }, extra || {});
    b = E.createBattle(stage, playerSpecs, enemySpecs, extra);
    mode = 'idle'; sel = null; reach = null;
    buildBoard();
    renderUnits();
    updateTop();
    showInfo(null);
    hideSheet();
    banner('自軍フェイズ', 'player');
    return b;
  }

  // ---------- 盤面の構築 ----------
  function buildBoard() {
    const board = $('board');
    board.innerHTML = '';
    board.style.setProperty('--cols', b.w);
    $('boardWrap').style.setProperty('--cols', b.w);
    $('boardWrap').style.setProperty('--rows', b.h);
    for (let y = 0; y < b.h; y++) {
      for (let x = 0; x < b.w; x++) {
        const c = document.createElement('div');
        c.className = 'cell t-' + b.tiles[y][x];
        c.dataset.x = x; c.dataset.y = y;
        board.appendChild(c);
      }
    }
    $('unitLayer').innerHTML = '';
    $('fxLayer').innerHTML = '';
    unitEls.clear();
    chestEls.clear();
    for (const c of b.chests) {
      if (c.state !== 'closed') continue;
      const el = document.createElement('div');
      el.className = 'chest';
      el.innerHTML = Art.chest();
      placeEl(el, c.x, c.y);
      $('unitLayer').appendChild(el);
      chestEls.set(c.i, el);
    }
    resize();
  }

  function resize() {
    if (!b) return;
    const wrap = $('boardWrap');
    const availH = window.innerHeight - 170; // 上部バー＋情報パネルぶん
    const cell = Math.floor(Math.min((window.innerWidth - 8) / b.w, availH / b.h, 60));
    wrap.style.setProperty('--cell', Math.max(28, cell) + 'px');
  }

  function cellEl(x, y) { return $('board').children[y * b.w + x]; }

  function renderUnits() {
    const layer = $('unitLayer');
    for (const u of b.units) {
      let el = unitEls.get(u.uid);
      if (!el) {
        el = document.createElement('div');
        el.className = 'unit ' + u.side + (u.boss ? ' boss' : '');
        el.innerHTML = `<div class="ubody">${Art.svg(u.cls, u.side)}</div><div class="hpbar"><i></i></div><div class="ulv">${u.lv}</div>`;
        layer.appendChild(el);
        unitEls.set(u.uid, el);
      }
      placeEl(el, u.x, u.y);
      el.classList.toggle('acted', u.acted && u.side === b.phase);
      el.classList.toggle('para', u.st.para > 0);
      el.classList.toggle('poison', !!u.st.poison);
      el.classList.toggle('buffed', u.buffs.some(x => x.v > 0));
      el.classList.toggle('debuffed', u.buffs.some(x => x.v < 0));
      el.classList.toggle('dead', u.hp <= 0);
      updateHp(u);
    }
  }
  function placeEl(el, x, y) {
    el.style.transform = `translate(calc(${x} * var(--cell)), calc(${y} * var(--cell)))`;
  }
  function updateHp(u) {
    const el = unitEls.get(u.uid);
    if (!el) return;
    const r = u.hp / u.maxhp;
    const bar = el.querySelector('.hpbar i');
    bar.style.width = (r * 100) + '%';
    bar.style.background = r > 0.5 ? '#4ee36a' : r > 0.25 ? '#f2c94c' : '#ff5a4f';
    el.querySelector('.ulv').textContent = u.lv;
  }

  function updateTop() {
    $('turnLabel').textContent = `ターン ${b.turn}`;
    $('phaseLabel').textContent = b.phase === 'player' ? '自軍フェイズ' : '敵フェイズ';
    $('phaseLabel').className = 'phase ' + b.phase;
    $('btnEnd').disabled = b.phase !== 'player';
  }

  // ---------- マスの強調表示 ----------
  function clearMarks() {
    for (const c of $('board').children) c.classList.remove('mv', 'atk', 'tgt', 'heal', 'danger', 'cur');
  }
  function markReach(u, res, cls) {
    const threat = E.threatTiles(b, u, res);
    for (const k of threat) {
      if (res.stops.has(k)) continue;
      const [x, y] = k.split(',').map(Number);
      cellEl(x, y).classList.add('atk');
    }
    for (const v of res.stops.values()) cellEl(v.x, v.y).classList.add(cls || 'mv');
  }

  // ---------- 入力 ----------
  function onTap(ev) {
    const t = ev.target.closest ? ev.target.closest('.cell') : null;
    if (!t || !b) return;
    tapCell(Number(t.dataset.x), Number(t.dataset.y));
  }

  async function tapCell(x, y) {
    if (mode === 'busy' || mode === 'over' || b.phase !== 'player') return;
    const u = E.unitAt(b, x, y);

    if (mode === 'moved') return; // メニュー表示中は盤面操作しない

    if (mode === 'card') {
      if (cardSel.tiles.some(p => p.x === x && p.y === y)) confirmCard(x, y);
      else { clearMarks(); hideSheet(); mode = 'moved'; showCardList(); }
      return;
    }

    if (mode === 'target' || mode === 'heal') {
      const list = mode === 'target' ? E.targetsFrom(b, sel, sel.x, sel.y) : E.healTargetsFrom(b, sel, sel.x, sel.y);
      if (u && list.includes(u)) {
        if (mode === 'target') showForecast(sel, u);
        else confirmHeal(sel, u);
      } else {
        clearMarks();
        mode = 'moved';
        showActionMenu();
      }
      return;
    }

    if (mode === 'selected') {
      if (u === sel) { mode = 'moved'; origin = { x: sel.x, y: sel.y }; clearMarks(); cellEl(sel.x, sel.y).classList.add('cur'); showActionMenu(); return; }
      const k = E.key(x, y);
      if (reach.stops.has(k)) { await moveSel(x, y); return; }
      // 他のマスをタップ → 選択し直し
    }

    deselect();
    if (u && u.side === 'player' && !u.acted) {
      select(u);
    } else if (u) {
      // 敵 or 行動済み：範囲を表示
      const res = E.reachable(b, u);
      markReach(u, res, u.side === 'enemy' ? 'danger' : 'mv');
      showInfo(u, x, y);
    } else {
      showInfo(null, x, y);
    }
  }

  function select(u) {
    sel = u; mode = 'selected';
    reach = E.reachable(b, u);
    markReach(u, reach);
    cellEl(u.x, u.y).classList.add('cur');
    showInfo(u, u.x, u.y);
  }
  function deselect() {
    sel = null; reach = null; mode = 'idle';
    clearMarks(); hideSheet();
  }

  async function moveSel(x, y) {
    mode = 'busy';
    origin = { x: sel.x, y: sel.y };
    const path = E.pathTo(reach, x, y);
    clearMarks();
    await animMove(sel, path);
    mode = 'moved';
    cellEl(sel.x, sel.y).classList.add('cur');
    showInfo(sel, sel.x, sel.y);
    showActionMenu();
  }

  async function animMove(u, path) {
    const el = unitEls.get(u.uid);
    for (let i = 1; i < path.length; i++) {
      placeEl(el, path[i].x, path[i].y);
      await wait(SPEED.step);
    }
    if (path.length) { u.x = path[path.length - 1].x; u.y = path[path.length - 1].y; }
    placeEl(el, u.x, u.y);
  }

  // ---------- 行動メニュー ----------
  function showActionMenu() {
    const targets = E.targetsFrom(b, sel, sel.x, sel.y);
    const heals = E.healTargetsFrom(b, sel, sel.x, sel.y);
    const html = [];
    html.push(`<div class="sheet-title">${sel.name} の行動</div><div class="btnrow">`);
    html.push(`<button class="btn red" data-act="attack" ${targets.length ? '' : 'disabled'}>⚔️ 攻撃</button>`);
    if (sel.heal) html.push(`<button class="btn green" data-act="heal" ${heals.length ? '' : 'disabled'}>💚 回復</button>`);
    const left = b.deck.filter(c => !c.used).length;
    if (b.deck.length) html.push(`<button class="btn purple" data-act="card" ${left ? '' : 'disabled'}>🃏 カード <small>${left}</small></button>`);
    html.push(`<button class="btn" data-act="wait">⏸ 待機</button>`);
    html.push(`<button class="btn gray" data-act="cancel">↩ 戻る</button></div>`);
    showSheet(html.join(''), act => {
      if (act === 'attack') {
        mode = 'target'; hideSheet(); clearMarks();
        for (const t of targets) cellEl(t.x, t.y).classList.add('tgt');
        toast('攻撃する相手をタップ');
      } else if (act === 'heal') {
        mode = 'heal'; hideSheet(); clearMarks();
        for (const t of heals) cellEl(t.x, t.y).classList.add('heal');
        toast('回復する味方をタップ');
      } else if (act === 'card') {
        showCardList();
      } else if (act === 'wait') {
        finishUnit(sel);
      } else if (act === 'cancel') {
        const u = sel;
        u.x = origin.x; u.y = origin.y;
        placeEl(unitEls.get(u.uid), u.x, u.y);
        hideSheet(); clearMarks();
        select(u);
      }
    });
  }

  // ---------- カード ----------
  function cardSpec(c) {
    const k = CARD_KINDS[c.kind];
    const r = c.self ? '自分中心' : c.range >= 99 ? '射程∞' : '射程' + c.range;
    const a = c.area ? `・範囲${c.area}` : '';
    const v = c.pow ? `・威力${c.pow}` : c.heal ? `・回復${c.heal >= 999 ? '全' : c.heal}` : '';
    return `${k.name}・${r}${a}${v}`;
  }
  function showCardList() {
    // 残っているカードを種類ごとにまとめる
    const groups = new Map();
    for (const slot of b.deck) {
      if (slot.used) continue;
      if (!groups.has(slot.id)) groups.set(slot.id, []);
      groups.get(slot.id).push(slot.i);
    }
    const rows = [...groups].sort((a, b2) => Object.keys(CARD_KINDS).indexOf(CARDS[a[0]].kind) - Object.keys(CARD_KINDS).indexOf(CARDS[b2[0]].kind)).map(([id, idxs]) => {
      const c = CARDS[id];
      const ok = E.cardTiles(b, sel, id).length > 0;
      return `<button class="bcard k-${c.kind}" data-act="pick" data-arg="${idxs[0]}" ${ok ? '' : 'disabled'}>
        <span class="bc-icon">${c.icon}</span><span class="grow"><b>${c.name}</b> <small class="stars">${'★'.repeat(c.rank)}</small> ${idxs.length > 1 ? `<small>×${idxs.length}</small>` : ''}
        <br><small>${cardSpec(c)}</small><br><small class="muted">${ok ? c.desc : 'ここからは使えない'}</small></span></button>`;
    }).join('');
    showSheet(`<div class="sheet-title">🃏 カードを使う <small class="muted">（1戦で1回ずつ・残り${b.deck.filter(c => !c.used).length}枚）</small></div>
      <div class="bcards">${rows || '<div class="muted center">カードが残っていません</div>'}</div>
      <div class="btnrow"><button class="btn gray" data-act="back">↩ 戻る</button></div>`, (act, arg) => {
      if (act === 'back') { showActionMenu(); return; }
      if (act === 'pick') pickCard(Number(arg));
    });
  }
  function pickCard(deckIdx) {
    const id = b.deck[deckIdx].id;
    const c = CARDS[id];
    cardSel = { deckIdx, id, tiles: E.cardTiles(b, sel, id) };
    if (c.self) { confirmCard(sel.x, sel.y); return; }
    hideSheet(); clearMarks();
    mode = 'card';
    cellEl(sel.x, sel.y).classList.add('cur');
    for (const p of cardSel.tiles) cellEl(p.x, p.y).classList.add(c.kind === 'heal' || c.kind === 'buff' ? 'heal' : c.kind === 'warp' ? 'mv' : 'tgt');
    toast(c.kind === 'warp' ? '移動先をタップ' : c.area ? '中心のマスをタップ' : '使う相手をタップ');
  }
  function confirmCard(x, y) {
    const c = CARDS[cardSel.id];
    mode = 'moved';
    clearMarks();
    const ts = E.cardAffected(b, sel, c, x, y);
    // 範囲を表示
    if (c.area) for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) if (E.dist(x, y, xx, yy) <= c.area) cellEl(xx, yy).classList.add('atk');
    for (const t of ts) cellEl(t.x, t.y).classList.add('tgt');
    if (c.kind === 'warp') cellEl(x, y).classList.add('mv');
    let info = '';
    if (c.kind === 'attack') {
      info = ts.map(t => {
        const lo = E.cardDamage(b, sel, t, c, 0.6), mid = E.cardDamage(b, sel, t, c, 1), hi = E.cardDamage(b, sel, t, c, 1.5);
        return `<div class="fc-row"><span>${t.name} <small>HP${t.hp}</small></span><b>${opts.minigame ? `${lo}〜${hi}` : mid}${mid >= t.hp ? ' 💀' : ''}</b></div>`;
      }).join('') + (opts.minigame ? '<div class="muted center small">ミニゲームの成功度で威力が変わる（必ず命中・反撃なし）</div>' : '<div class="muted center small">必ず命中・反撃なし</div>');
    } else if (ts.length) {
      info = `<div class="muted center">対象：${ts.map(t => t.name).join('・')}</div>`;
    }
    showSheet(`<div class="sheet-title">${c.icon} ${c.name}</div><div class="muted center">${c.desc}</div>${info}
      <div class="btnrow"><button class="btn purple big" data-act="use">使う！</button><button class="btn gray" data-act="back">やめる</button></div>`, async act => {
      if (act !== 'use') { clearMarks(); showCardList(); return; }
      hideSheet(); clearMarks();
      mode = 'busy';
      let mult = 1;
      if (c.kind === 'attack' && opts.minigame) mult = MiniGame.mult(await MiniGame.play(c));
      const u = sel;
      const ev = E.useCard(b, u, cardSel.deckIdx, x, y, mult);
      cardSel = null;
      await playEvents(ev);
      finishUnit(u);
    });
  }

  function affLabel(a) {
    return a > 0 ? '<span class="aff up">相性 有利▲</span>' : a < 0 ? '<span class="aff down">相性 不利▼</span>' : '<span class="aff">相性 普通</span>';
  }

  function showForecast(a, d) {
    const f = E.forecast(b, a, d);
    const hits = f.double ? 2 : 1;
    const dHpAfter = Math.max(0, d.hp - f.dmg * hits);
    const aHpAfter = Math.max(0, a.hp - (f.counter && dHpAfter > 0 ? f.counter.dmg * (f.counter.double ? 2 : 1) : 0));
    const side = (u, dmg, hit, hpAfter, isAtk) => `
      <div class="fc-side ${u.side}">
        <div class="fc-icon">${Art.icon(u.cls, u.side)}</div>
        <div class="fc-name">${u.name} <small>Lv${u.lv}</small></div>
        <div class="fc-hp">HP ${u.hp} → <b>${hpAfter}</b></div>
        <div class="fc-row"><span>与ダメージ</span><b>${dmg === null ? '−' : dmg}${dmg !== null && u.fx === 'double' ? '×2' : ''}</b></div>
        <div class="fc-row"><span>命中率</span><b>${hit === null ? '−' : hit + '%'}</b></div>
        ${isAtk ? '' : `<div class="fc-note">${dmg === null ? '反撃できない' : '反撃'}</div>`}
      </div>`;
    const html = `<div class="sheet-title">攻撃の予測</div>
      <div class="fc">${side(a, f.dmg, f.hit, aHpAfter, true)}<div class="fc-vs">VS</div>${side(d, f.counter ? f.counter.dmg : null, f.counter ? f.counter.hit : null, dHpAfter, false)}</div>
      <div class="fc-aff">${affLabel(f.aff)}${f.dmg * hits >= d.hp ? ' <span class="aff up">撃破チャンス！</span>' : ''}${a.fx ? ` <span class="aff">${FX_NAMES[a.fx]}</span>` : ''}</div>
      <div class="btnrow"><button class="btn red big" data-act="go">⚔️ 攻撃する</button><button class="btn gray" data-act="back">やめる</button></div>`;
    showSheet(html, async act => {
      if (act === 'go') {
        hideSheet(); clearMarks();
        mode = 'busy';
        const ev = E.doAttack(b, a, d);
        await playEvents(ev);
        finishUnit(a);
      } else {
        hideSheet();
      }
    });
  }

  async function confirmHeal(h, t) {
    hideSheet(); clearMarks();
    mode = 'busy';
    const ev = E.doHeal(b, h, t);
    await playEvents(ev);
    finishUnit(h);
  }

  // 止まったマスに宝箱があれば開ける
  async function openChestFor(u) {
    const ev = E.openChest(b, u);
    if (!ev) return;
    const el = chestEls.get(ev.idx);
    if (el) el.classList.add(ev.side === 'player' ? 'opening' : 'stolen');
    if (ev.side === 'player') {
      if (opts.onChest) opts.onChest(ev);
      popText(u, '宝箱!', 'lvup');
      toast(`宝箱を開けた！ ${Save.getLabel(ev.get)} を手に入れた`, 2000);
    } else {
      popText(u, '取られた!', 'kill');
      toast('敵に宝箱を取られてしまった…', 1800);
    }
    await wait(650);
    if (el) el.remove();
  }

  async function finishUnit(u) {
    mode = 'busy';
    await openChestFor(u);
    u.acted = true;
    sel = null; reach = null;
    hideSheet(); clearMarks();
    renderUnits();
    showInfo(null);
    if (await checkEnd()) return;
    mode = 'idle';
    if (E.alive(b, 'player').every(p => p.acted)) {
      await wait(250);
      endPlayerPhase();
    }
  }

  // ---------- 演出 ----------
  async function playEvents(evs) {
    for (const ev of evs) {
      if (ev.kind === 'strike') await animStrike(ev);
      else if (ev.kind === 'heal') await animHeal(ev);
      else if (ev.kind === 'levelup') await animLevelUp(ev);
      else if (ev.kind === 'card') await animCard(ev);
      else if (ev.kind === 'warp') await animWarp(ev);
      else await animStatus(ev);
    }
    renderUnits();
  }

  async function animStrike(ev) {
    const a = E.byUid(b, ev.att), d = E.byUid(b, ev.def);
    const ael = unitEls.get(a.uid).querySelector('.ubody');
    const del = unitEls.get(d.uid);
    const dx = Math.sign(d.x - a.x), dy = Math.sign(d.y - a.y);
    ael.style.setProperty('--lx', dx * 30 + '%');
    ael.style.setProperty('--ly', dy * 30 + '%');
    ael.classList.remove('lunge'); void ael.offsetWidth; ael.classList.add('lunge');
    if (Math.abs(a.x - d.x) + Math.abs(a.y - d.y) > 1) shot(a, d);
    await wait(180);
    if (ev.hit) {
      const body = del.querySelector('.ubody');
      body.classList.remove('shake', 'flash'); void body.offsetWidth; body.classList.add('shake', 'flash');
      popText(d, '-' + ev.dmg, 'dmg');
      if (ev.dmg >= 10) $('boardWrap').classList.add('quake');
      updateHp(d);
    } else {
      popText(d, 'MISS', 'miss');
    }
    await wait(SPEED.pause + 150);
    $('boardWrap').classList.remove('quake');
    ael.classList.remove('lunge');
    if (ev.killed) {
      del.classList.add('dying');
      popText(d, '撃破!', 'kill');
      await wait(500);
      del.classList.add('dead');
    }
  }

  async function animCard(ev) {
    const u = E.byUid(b, ev.uid), c = CARDS[ev.id];
    const p = document.createElement('div');
    p.className = 'cardfx k-' + c.kind;
    p.innerHTML = `<span>${c.icon}</span><b>${c.name}</b>${ev.mult !== 1 ? `<small>×${ev.mult.toFixed(1)}</small>` : ''}`;
    p.style.left = `calc(${u.x + 0.5} * var(--cell))`;
    p.style.top = `calc(${u.y} * var(--cell))`;
    $('fxLayer').appendChild(p);
    setTimeout(() => p.remove(), 900);
    await wait(450);
  }
  async function animWarp(ev) {
    const u = E.byUid(b, ev.uid);
    const el = unitEls.get(u.uid);
    el.classList.add('warping');
    await wait(200);
    placeEl(el, ev.x, ev.y);
    await wait(120);
    el.classList.remove('warping');
    await wait(200);
  }
  const STATUS_TEXT = { para: 'マヒ!', poison: '毒!' };
  async function animStatus(ev) {
    const t = E.byUid(b, ev.def);
    if (!t) return;
    if (ev.kind === 'buff') popText(t, `${BUFF_NAMES[ev.k]}${ev.v > 0 ? '+' : ''}${ev.v}`, ev.v > 0 ? 'lvup' : 'kill');
    else if (ev.kind === 'status') popText(t, STATUS_TEXT[ev.s], 'kill');
    else if (ev.kind === 'resist') popText(t, '効かない!', 'miss');
    else if (ev.kind === 'endure') popText(t, 'ふんばった!', 'lvup');
    else if (ev.kind === 'cleanse') popText(t, '状態回復', 'healnum');
    else if (ev.kind === 'poison') { popText(t, '毒 -' + ev.dmg, 'dmg'); updateHp(t); }
    else if (ev.kind === 'para') popText(t, 'マヒで動けない', 'miss');
    else if (ev.kind === 'buffend') { popText(t, BUFF_NAMES[ev.k] + ' 元に戻った', 'miss'); }
    else return;
    await wait(SPEED.pause + 150);
  }

  function shot(a, d) {
    const p = document.createElement('div');
    p.className = 'shot ' + a.side;
    p.style.transform = `translate(calc(${a.x + 0.5} * var(--cell)), calc(${a.y + 0.5} * var(--cell)))`;
    $('fxLayer').appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(${d.x + 0.5} * var(--cell)), calc(${d.y + 0.5} * var(--cell)))`;
    });
    setTimeout(() => p.remove(), 400);
  }

  async function animHeal(ev) {
    const t = E.byUid(b, ev.def);
    popText(t, '+' + ev.amount, 'healnum');
    const body = unitEls.get(t.uid).querySelector('.ubody');
    body.classList.remove('glow'); void body.offsetWidth; body.classList.add('glow');
    updateHp(t);
    await wait(SPEED.pause + 200);
  }

  async function animLevelUp(ev) {
    const u = E.byUid(b, ev.uid);
    popText(u, 'LEVEL UP!', 'lvup');
    updateHp(u);
    const up = ev.info.up;
    toast(`${u.name} が Lv${ev.info.lv} に！ HP+${up.hp} 攻撃+${up.atk} 防御+${up.def}`, 2200);
    await wait(700);
  }

  function popText(u, text, cls) {
    const p = document.createElement('div');
    p.className = 'pop ' + cls;
    p.textContent = text;
    p.style.left = `calc(${u.x + 0.5} * var(--cell))`;
    p.style.top = `calc(${u.y} * var(--cell))`;
    $('fxLayer').appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }

  function banner(text, side) {
    const el = $('banner');
    el.textContent = text;
    el.className = 'banner show ' + side;
    clearTimeout(banner.t);
    banner.t = setTimeout(() => { el.className = 'banner'; }, 1100);
  }

  function toast(text, ms) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), ms || 1400);
  }

  // ---------- 下部シート ----------
  function showSheet(html, onAct) {
    const s = $('sheet');
    s.innerHTML = html;
    s.classList.remove('hidden');
    s.onclick = e => {
      const btn = e.target.closest ? e.target.closest('[data-act]') : null;
      if (btn && !btn.disabled) onAct(btn.dataset.act, btn.dataset.arg);
    };
  }
  function hideSheet() { const s = $('sheet'); s.classList.add('hidden'); s.onclick = null; }

  function statusBadges(u) {
    const out = [];
    if (u.st.para) out.push('<span class="sbadge bad">マヒ</span>');
    if (u.st.poison) out.push(`<span class="sbadge bad">毒${u.st.poison.dmg}×${u.st.poison.t}</span>`);
    for (const bf of u.buffs) out.push(`<span class="sbadge ${bf.v > 0 ? 'good' : 'bad'}">${BUFF_NAMES[bf.k]}${bf.v > 0 ? '+' : ''}${bf.v}（${bf.t}）</span>`);
    return out.length ? `<div class="sbadges">${out.join('')}</div>` : '';
  }

  // ---------- 情報パネル ----------
  function showInfo(u, x, y) {
    const el = $('infoPanel');
    let t = '';
    if (x !== undefined) {
      const tr = E.terrain(b, x, y);
      t = `<div class="terrain">地形：<b>${tr.name}</b> 防御+${tr.def} 回避+${tr.avo}${E.chestAt(b, x, y) ? '　🎁<b>宝箱</b>（止まると開く）' : ''}</div>`;
    }
    if (!u) {
      const left = b.deck.filter(c => !c.used).length;
      el.innerHTML = t || `<div class="hint">${b.phase === 'player' ? 'ユニットをタップして選択' : '敵が行動中…'}${b.deck.length ? `<br><small>🃏 カード残り ${left}/${b.deck.length}枚</small>` : ''}</div>`;
      return;
    }
    const ty = TYPES[u.type];
    el.innerHTML = `<div class="info-unit ${u.side}">
      <div class="info-icon">${Art.icon(u.cls, u.side)}</div>
      <div class="info-main">
        <div class="info-name">${u.name} <small>Lv${u.lv}${u.side === 'player' ? ` EXP${u.exp}` : ''}</small> <span class="tybadge" style="background:${ty.color}">${ty.name}</span></div>
        <div class="info-hp"><div class="bar"><i style="width:${u.hp / u.maxhp * 100}%"></i></div>${u.hp}/${u.maxhp}</div>
        <div class="info-stats">攻${u.atk} 防${u.def} 移${u.mov} 射${u.rmin === u.rmax ? u.rmin : u.rmin + '-' + u.rmax} ${MOVE_NAMES[u.move]}${u.heal ? ' 回復' + u.heal : ''}${u.fx ? ` <span class="fxbadge">${FX_NAMES[u.fx]}</span>` : ''}</div>
        ${statusBadges(u)}
      </div></div>${t}`;
  }

  // ---------- フェイズ進行 ----------
  async function endPlayerPhase() {
    if (b.phase !== 'player' || mode === 'over') return;
    deselect();
    mode = 'busy';
    const ev = E.startPhase(b, 'enemy'); // 敵の行動済み解除・自動回復
    updateTop();
    renderUnits();
    banner('敵フェイズ', 'enemy');
    await wait(900);
    if (ev.length) await playEvents(ev);
    await enemyPhase();
  }

  async function enemyPhase() {
    const enemies = E.alive(b, 'enemy').slice();
    for (const u of enemies) {
      if (u.hp <= 0 || u.acted) continue; // マヒ中は行動しない
      const plan = E.planAI(b, u);
      showInfo(u, u.x, u.y);
      cellEl(u.x, u.y).classList.add('cur');
      await wait(200);
      clearMarks();
      if (plan.path.length > 1) await animMove(u, plan.path);
      await openChestFor(u);
      if (plan.action) {
        const t = plan.action.target;
        if (plan.action.type === 'attack') {
          cellEl(t.x, t.y).classList.add('tgt');
          await wait(250);
          clearMarks();
          await playEvents(E.doAttack(b, u, t));
        } else {
          await playEvents(E.doHeal(b, u, t));
        }
      }
      u.acted = true;
      renderUnits();
      if (await checkEnd()) return;
      await wait(150);
    }
    // 自軍フェイズへ
    b.turn++;
    const ev = E.startPhase(b, 'player');
    updateTop();
    renderUnits();
    banner('自軍フェイズ', 'player');
    if (ev.length) await playEvents(ev);
    showInfo(null);
    mode = 'idle';
    // 全員マヒなどで動けないときは自動でターン終了
    if (E.alive(b, 'player').every(p => p.acted)) {
      toast('動ける味方がいない…');
      await wait(600);
      endPlayerPhase();
    }
  }

  async function checkEnd() {
    const r = E.result(b);
    if (!r) return false;
    mode = 'over';
    await wait(500);
    banner(r === 'win' ? '勝利！' : '敗北…', r === 'win' ? 'player' : 'enemy');
    await wait(1300);
    if (opts.onEnd) opts.onEnd(r, b);
    return true;
  }

  function init() {
    $('board').addEventListener('click', onTap);
    $('btnEnd').addEventListener('click', () => {
      if (b && b.phase === 'player' && mode !== 'busy' && mode !== 'over') endPlayerPhase();
    });
    window.addEventListener('resize', resize);
  }

  return { init, start, resize, tapCell, endPlayerPhase, get state() { return b; }, get mode() { return mode; } };
})();
