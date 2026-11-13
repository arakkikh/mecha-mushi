'use strict';
// ===== 画面遷移・メニュー・ショップ・編成 =====
const App = (() => {
  const $ = id => document.getElementById(id);
  const D = () => Save.data;
  const rangeText = s => (s.rmin === s.rmax ? String(s.rmin) : `${s.rmin}-${s.rmax}`);
  const typeBadge = cls => { const t = TYPES[CLASSES[cls].type]; return `<span class="tybadge" style="background:${t.color}">${t.name}</span>`; };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  let pageBack = null, pageHandler = null;
  let sortie = null;   // 出撃メンバー（ロスターIDの配列）
  let freeSel = { map: 0, diff: 1 };

  function show(id) {
    for (const s of document.querySelectorAll('.screen')) s.classList.remove('active');
    $(id).classList.add('active');
  }

  function modal(html, onAct) {
    const m = $('modal');
    $('modalBox').innerHTML = html;
    m.classList.remove('hidden');
    $('modalBox').onclick = e => {
      const btn = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!btn || btn.disabled) return;
      m.classList.add('hidden');
      if (onAct) onAct(btn.dataset.act, btn.dataset.arg);
    };
  }

  function toast(text, ms) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), ms || 1500);
  }

  // keep=true ならスクロール位置を保つ（同じ画面の更新用）
  function page(title, html, onBack, handler, keep) {
    show('scr-page');
    const top = $('pageBody').scrollTop;
    $('pageTitle').textContent = title;
    $('pageBody').innerHTML = html;
    $('pageBody').scrollTop = keep ? top : 0;
    $('pageMoney').textContent = `💰${D().money}`;
    pageBack = onBack; pageHandler = handler;
  }

  // ---------- タイトル ----------
  function title() {
    show('scr-title');
    const d = D();
    $('titleArt').innerHTML = d.roster.slice(0, 5).map(u => Art.icon(u.cls, 'player')).join('');
    $('titleMenu').innerHTML = `
      <button class="btn" data-act="story">📖 ストーリー <small>(${Math.min(d.cleared, STAGES.length)}/${STAGES.length})</small></button>
      <button class="btn red" data-act="free">⚔️ フリーバトル</button>
      <button class="btn green" data-act="units">🔧 ユニット・装備</button>
      <button class="btn purple" data-act="cards">🃏 カード <small>デッキ${d.deck.length}/${DECK_SIZE}</small></button>
      <button class="btn gold" data-act="shop">🛒 ショップ <small>💰${d.money}</small></button>
      <div class="btnrow"><button class="btn gray small" data-act="help">❓ あそびかた</button><button class="btn gray small" data-act="settings">⚙️ 設定</button></div>
      <button class="btn gray small" data-act="reset">🗑 データを消す</button>`;
    $('titleMenu').onclick = e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const a = btn.dataset.act;
      if (a === 'story') storyList();
      else if (a === 'free') freeBattle();
      else if (a === 'units') unitsPage();
      else if (a === 'cards') cardsPage('deck');
      else if (a === 'settings') settings(title);
      else if (a === 'shop') shop('weapon');
      else if (a === 'help') help();
      else if (a === 'reset') {
        modal(`<h3>データを消す</h3><p>ストーリーの進行・ユニット・お金がすべて最初に戻ります。本当に消しますか？</p>
          <div class="btnrow"><button class="btn red" data-act="yes">消す</button><button class="btn gray" data-act="no">やめる</button></div>`,
        act => { if (act === 'yes') { Save.reset(); sortie = null; title(); toast('データを消しました'); } });
      }
    };
  }

  function help() {
    modal(`<h3>あそびかた</h3><div class="help">
      <p>① 味方ユニットをタップ → <b class="c-blue">青いマス</b>が移動できる範囲、<b class="c-red">赤いマス</b>が攻撃が届く範囲。</p>
      <p>② 青いマスをタップして移動 → 「攻撃」「回復」「待機」を選ぶ。もう一度自分をタップするとその場で行動。</p>
      <p>③ 攻撃する前に「与ダメージ・命中率・反撃」の予測が出ます。</p>
      <p>④ 全員が行動するか「ターン終了」で敵のターン。敵を全滅させれば勝ち！</p>
      <p><b>相性</b>：牙 ▶ 甲 ▶ 翅 ▶ 牙（有利だとダメージ1.3倍・命中+15）</p>
      <p><b>地形</b>：森＝回避+20、岩場＝防御+3、水＝飛行ユニットのみ通れる。飛行ユニットは地形の効果を受けません。</p>
      <p>敵をタップすると、その敵が動ける範囲（オレンジ）を確認できます。</p>
      <p><b>カード</b>：行動メニューの「🃏カード」で、デッキ（20枚）のカードを1枚使えます（使うとそのユニットは行動終了）。各カードは1戦に1回だけ。戦闘が終わると全部戻ります。攻撃カードは必ず命中・反撃なし。輪が重なった瞬間にタップするミニゲームで威力が0.6〜1.5倍に変わります（設定でオフにすると常に1.0倍）。</p>
      <p><b>宝箱</b>：🎁のマスで行動を終えると開きます。中身はお金・武器・パーツなど。<b>敵が先に止まると取られてしまう</b>ので急ごう！ 取った宝箱は記録され、ステージ選択に「宝箱 2/3」のように表示されます。</p>
      </div><div class="btnrow"><button class="btn" data-act="ok">OK</button></div>`);
  }

  // ---------- ストーリー ----------
  function storyList() {
    const d = D();
    const html = STAGES.map((st, i) => {
      const locked = i > d.cleared;
      const cleared = i < d.cleared;
      const lv = Math.max(...st.enemies.map(e => e.lv));
      const cc = Save.chestCount(st);
      return `<button class="stage ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''}" data-act="stage" data-arg="${i}" ${locked ? 'disabled' : ''}>
        <div class="stage-no">${locked ? '🔒' : cleared ? '★' : 'NEW'}<br><small>STAGE ${i + 1}</small></div>
        <div class="grow"><div class="stage-name">${locked ? '？？？' : st.name}</div>
        <div class="muted">${locked ? '前のステージをクリアすると解放' : `敵 ${st.enemies.length}体 / 最大Lv${lv} / 報酬 💰${st.reward.money}`}</div>
        ${!locked && cc.total ? `<div class="chestinfo ${cc.got === cc.total ? 'done' : ''}">🎁 宝箱 ${cc.got}/${cc.total}${cc.got === cc.total ? ' コンプリート！' : ''}</div>` : ''}</div>
        ${locked ? '' : miniMap(st)}
      </button>`;
    }).join('');
    page('ストーリー', html + (d.cleared >= STAGES.length ? '<div class="card center">🏆 全ステージクリア！おめでとう！<br><span class="muted">フリーバトルでさらに鍛えよう</span></div>' : ''), title, (a, arg) => {
      if (a === 'stage') stageIntro(Number(arg));
    });
  }

  function enemyIcons(list) {
    return `<div class="foes">${list.map(e => `<div class="foe ${e.boss ? 'boss' : ''}">${Art.icon(e.cls, 'enemy')}<small>Lv${e.lv}</small></div>`).join('')}</div>`;
  }

  function stageIntro(i) {
    const st = STAGES[i];
    const first = i >= D().cleared;
    const items = first ? (st.reward.items || []).map(id => Save.item(id).name).concat((st.reward.cards || []).map(id => '🃏' + CARDS[id].name)).join('・') : '';
    modal(`<h3>STAGE ${i + 1}<br>${st.name}</h3>
      <div class="story">${st.story.replace(/\n/g, '<br>')}</div>
      <div class="muted">敵の編成</div>${enemyIcons(st.enemies)}
      ${chestLine(st)}
      <div class="reward"><span>報酬</span><b>💰${first ? st.reward.money : Math.floor(st.reward.money / 2)}${items ? ' ＋ ' + items : ''}</b></div>
      <div class="btnrow"><button class="btn" data-act="go">出撃準備へ</button><button class="btn gray" data-act="no">やめる</button></div>`,
    act => {
      if (act !== 'go') return;
      prep({ stage: st, enemies: st.enemies, mode: 'story', index: i, back: storyList });
    });
  }

  function chestLine(st) {
    const cc = Save.chestCount(st);
    if (!cc.total) return '';
    return `<div class="reward"><span>宝箱</span><b class="chestinfo ${cc.got === cc.total ? 'done' : ''}">🎁 ${cc.got}/${cc.total}${cc.got === cc.total ? ' 全部取った！' : ''}</b></div>`;
  }

  // ---------- 出撃準備 ----------
  function prep(cfg) {
    const d = D();
    const slots = cfg.stage.start.length;
    if (!sortie) sortie = d.roster.slice(0, slots).map(u => u.id);
    sortie = sortie.filter(id => d.roster.some(u => u.id === id)).slice(0, slots);
    if (!sortie.length) sortie = d.roster.slice(0, slots).map(u => u.id);
    const html = `<div class="muted center">出撃するユニットをタップで選択（最大${slots}体）</div>` +
      d.roster.map(u => {
        const on = sortie.includes(u.id);
        return `<div class="ucard selectable ${on ? 'on' : ''}" data-act="toggle" data-arg="${u.id}">
          <div class="check">${on ? '✔' : ''}</div>${unitInner(u)}
          <button class="btn small gray" data-act="equip" data-arg="${u.id}">装備</button></div>`;
      }).join('') +
      `<div class="muted">敵の編成</div>${enemyIcons(cfg.enemies)}
      <button class="slot" data-act="deck"><span class="slot-k">デッキ</span><span class="grow"><b>🃏 ${d.deck.length}/${DECK_SIZE}枚</b>${d.deck.length < DECK_SIZE ? ' <small class="down">（まだ入れられます）</small>' : ''}<br><small>${deckSummary()}</small></span><span class="chev">›</span></button>
      <button class="btn red big" data-act="go" ${sortie.length ? '' : 'disabled'}>⚔️ 出撃！（${sortie.length}体）</button>`;
    page('出撃準備', html, cfg.back, (a, arg) => {
      const id = Number(arg);
      if (a === 'equip') { unitDetail(d.roster.find(u => u.id === id), () => prep(cfg)); return; }
      if (a === 'toggle') {
        if (sortie.includes(id)) sortie = sortie.filter(x => x !== id);
        else if (sortie.length < slots) sortie.push(id);
        else toast(`出撃できるのは${slots}体までです`);
        prep(cfg);
      }
      if (a === 'deck') cardsPage('deck', () => prep(cfg));
      if (a === 'go') startBattle(cfg);
    });
  }
  function deckSummary() {
    const n = {};
    for (const id of D().deck) n[CARDS[id].kind] = (n[CARDS[id].kind] || 0) + 1;
    return Object.keys(CARD_KINDS).filter(k => n[k]).map(k => `${CARD_KINDS[k].icon}${CARD_KINDS[k].name}${n[k]}`).join(' ') || 'カードが入っていません';
  }

  // ---------- 戦闘 ----------
  function startBattle(cfg) {
    const d = D();
    const party = sortie.map(id => d.roster.find(u => u.id === id)).filter(Boolean);
    const before = new Map(party.map(u => [u.id, u.lv]));
    show('scr-battle');
    const got = [];
    const extra = cfg.mode === 'story' ? {
      chestsTaken: Save.chestsTaken(cfg.stage),
      onChest: ev => { Save.takeChest(cfg.stage, ev.idx, ev.get); got.push(ev.get); },
    } : { noChests: true };
    extra.deck = D().deck.slice();
    extra.minigame = D().settings.minigame;
    BattleUI.start(cfg.stage, party, cfg.enemies, (r, b) => onBattleEnd(cfg, r, b, before, got), extra);
  }

  function onBattleEnd(cfg, r, b, before, got) {
    const d = D();
    Save.applyBattle(b); // 経験値は負けても残る
    const lines = [];
    // 宝箱の中身は勝ち負けに関係なく持ち帰れる
    for (const g of got || []) lines.push(`<div class="reward"><span>🎁 宝箱</span><b>${Save.getLabel(g)}</b></div>`);
    const stolen = b.chests.filter(c => c.state === 'stolen').length;
    if (stolen) lines.push(`<div class="reward"><span>宝箱</span><b class="down">敵に${stolen}個取られた…</b></div>`);
    let recruits = [];
    if (r === 'win') {
      let money = 0, items = [], cards = [];
      if (cfg.mode === 'story') {
        const first = cfg.index >= d.cleared;
        money = first ? cfg.stage.reward.money : Math.floor(cfg.stage.reward.money / 2);
        if (first) {
          items = (cfg.stage.reward.items || []).slice();
          cards = (cfg.stage.reward.cards || []).slice();
          d.cleared = cfg.index + 1;
          recruits = Save.syncRecruits();
        }
      } else {
        money = cfg.reward.money;
        items = cfg.reward.items;
        cards = cfg.reward.cards || [];
        d.freeWins = (d.freeWins || 0) + 1;
      }
      // ラッキーコイン：出撃中のユニットの装備ぶんお金が増える
      const gold = b.units.filter(u => u.side === 'player').reduce((a, u) => a + (u.gold || 0), 0);
      if (gold) money = Math.round(money * (1 + gold / 100));
      d.money += money;
      for (const id of items) Save.addItem(id);
      lines.push(`<div class="reward"><span>お金</span><b>💰 +${money}</b></div>`);
      for (const id of items) lines.push(`<div class="reward"><span>入手</span><b>🎁 ${Save.item(id).name}</b></div>`);
      for (const id of cards) { Save.addCard(id); lines.push(`<div class="reward"><span>カード</span><b>${Save.getLabel({ card: id })}</b></div>`); }
    }
    for (const u of d.roster) {
      if (before.has(u.id) && u.lv > before.get(u.id)) {
        lines.push(`<div class="reward"><span>${u.name}</span><b>⬆ Lv${before.get(u.id)} → Lv${u.lv}</b></div>`);
      }
    }
    for (const u of recruits) {
      lines.push(`<div class="reward new"><span>新しい仲間！</span><b>${Art.icon(u.cls, 'player')} ${u.name}（${CLASSES[u.cls].name}）</b></div>`);
    }
    Save.write();
    const win = r === 'win';
    const hasNext = cfg.mode === 'story' && win && cfg.index + 1 < STAGES.length;
    modal(`<h3 class="${win ? 'result-win' : 'result-lose'}">${win ? '🏆 勝利！' : '💥 敗北…'}</h3>
      ${win ? '' : '<p class="center muted">経験値は持ち帰りました。装備を見直して再挑戦しよう！</p>'}
      ${lines.join('')}
      ${cfg.mode === 'story' && win && cfg.index + 1 === STAGES.length ? '<p class="center">ガラクタ軍団をやっつけた！<br>草原に平和が戻った。<br><b>— ストーリークリア！ —</b></p>' : ''}
      <div class="btnrow">
        ${hasNext ? '<button class="btn" data-act="next">次のステージへ</button>' : ''}
        <button class="btn ${hasNext ? 'gray' : ''}" data-act="retry">${win ? 'もう一度' : '再挑戦'}</button>
        <button class="btn gray" data-act="menu">${cfg.mode === 'story' ? 'ステージ選択' : 'フリーバトル'}</button>
      </div>`,
    act => {
      if (act === 'next') stageIntro(cfg.index + 1);
      else if (act === 'retry') prep(cfg.mode === 'free' ? makeFreeCfg() : cfg);
      else cfg.mode === 'story' ? storyList() : freeBattle();
    });
  }

  // ---------- フリーバトル ----------
  const DIFFS = [
    { name: 'やさしい', dl: -2, n: 3, mult: 0.6, drop: 0.3 },
    { name: 'ふつう', dl: 0, n: 4, mult: 1, drop: 0.5 },
    { name: 'むずかしい', dl: 2, n: 5, mult: 1.5, drop: 0.7 },
    { name: 'おに', dl: 4, n: 6, mult: 2.2, drop: 0.9 },
  ];

  function avgLv() {
    const r = D().roster;
    return Math.max(1, Math.round(r.reduce((s, u) => s + u.lv, 0) / r.length));
  }

  // 敵の編成をランダムに作る
  function genEnemies(stage, diff) {
    const df = DIFFS[diff];
    const base = avgLv() + df.dl;
    // これまでに出会った敵の種類から選ぶ
    const met = new Set(['ari', 'ga', 'kabuto', 'kuwagata', 'chou', 'hachi', 'tentou']);
    for (const st of STAGES.slice(0, Math.max(1, D().cleared))) for (const e of st.enemies) met.add(e.cls);
    met.delete('emperor');
    const pool = ['ari'].concat([...met]);
    const spots = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < stage.rows[0].length; x++) spots.push([x, y]);
    const list = [];
    for (let i = 0; i < df.n && spots.length; i++) {
      let cls = pick(pool);
      if (i === 0 && diff >= 2) cls = 'kamakiri';
      const ok = spots.filter(([x, y]) => stage.rows[y][x] !== 'W' || CLASSES[cls].move === 'fly');
      if (!ok.length) continue;
      const [x, y] = pick(ok);
      spots.splice(spots.findIndex(s => s[0] === x && s[1] === y), 1);
      const lv = Math.max(1, Math.min(Engine.MAX_LV, base + Math.floor(Math.random() * 3) - 1 + (cls === 'kamakiri' ? 1 : 0)));
      list.push({ cls, lv, x, y, boss: cls === 'kamakiri', ai: Math.random() < 0.25 ? 'hold' : 'aggressive' });
    }
    return list;
  }

  function makeFreeCfg() {
    const stage = STAGES[freeSel.map];
    const df = DIFFS[freeSel.diff];
    const enemies = genEnemies(stage, freeSel.diff);
    const lvSum = enemies.reduce((s, e) => s + e.lv, 0);
    const money = Math.round((60 + lvSum * 25) * df.mult / 10) * 10;
    const shopItems = Object.keys(WEAPONS).filter(id => inShop(WEAPONS[id])).concat(Object.keys(PARTS).filter(id => inShop(PARTS[id])));
    const items = Math.random() < df.drop ? [pick(shopItems)] : [];
    const pool = Object.keys(CARDS).filter(id => !CARDS[id].only && CARDS[id].rank <= Math.min(3, 1 + Math.floor(freeSel.diff / 1.5)));
    const cards = Math.random() < df.drop ? [pick(pool)] : [];
    return { stage, enemies, mode: 'free', reward: { money, items, cards }, back: freeBattle };
  }

  function freeBattle() {
    const maps = STAGES.map((st, i) => `<button class="mapcard ${freeSel.map === i ? 'on' : ''}" data-act="map" data-arg="${i}">
      ${miniMap(st)}<div class="mapname">${st.name}</div></button>`).join('');
    const diffs = DIFFS.map((df, i) => `<button class="btn small ${freeSel.diff === i ? '' : 'gray'}" data-act="diff" data-arg="${i}">${df.name}</button>`).join('');
    page('フリーバトル', `
      <div class="card"><h3>敵の強さ</h3><div class="btnrow">${diffs}</div>
      <div class="muted" style="margin-top:6px">味方の平均Lv${avgLv()} → 敵 Lv${Math.max(1, avgLv() + DIFFS[freeSel.diff].dl)}前後・${DIFFS[freeSel.diff].n}体（敵の顔ぶれは毎回ランダム）</div></div>
      <div class="card"><h3>マップ</h3><div class="mapgrid">${maps}</div></div>
      <button class="btn red big" data-act="go">出撃準備へ</button>`, title, (a, arg) => {
      if (a === 'map') { freeSel.map = Number(arg); freeBattle(); }
      if (a === 'diff') { freeSel.diff = Number(arg); freeBattle(); }
      if (a === 'go') prep(makeFreeCfg());
    });
  }

  function miniMap(st) {
    const cells = st.rows.join('').split('').map(c => `<i class="t-${c}"></i>`).join('');
    return `<div class="mini" style="--c:${st.rows[0].length}">${cells}</div>`;
  }

  // ---------- ユニット・装備 ----------
  function unitInner(u) {
    const s = Engine.calcStats(u);
    return `<div class="uicon">${Art.icon(u.cls, 'player')}</div>
      <div class="grow"><div class="uname">${u.name} <small>${CLASSES[u.cls].name} Lv${u.lv}</small> ${typeBadge(u.cls)}</div>
      <div class="ustats">HP${s.maxhp} 攻${s.atk} 防${s.def} 移${s.mov} 射${rangeText(s)}${s.heal ? ' 回' + s.heal : ''}</div>
      <div class="expbar"><i style="width:${u.lv >= Engine.MAX_LV ? 100 : u.exp}%"></i></div></div>`;
  }

  function unitsPage() {
    const html = D().roster.map(u => `<div class="ucard" data-act="unit" data-arg="${u.id}">${unitInner(u)}<span class="chev">›</span></div>`).join('') +
      `<div class="card muted">相性：<b style="color:#e05050">牙</b> ▶ <b style="color:#e0a030">甲</b> ▶ <b style="color:#40b0e0">翅</b> ▶ <b style="color:#e05050">牙</b>　（有利だとダメージ1.3倍・命中+15）</div>`;
    page('ユニット・装備', html, title, (a, arg) => {
      if (a === 'unit') unitDetail(D().roster.find(u => u.id === Number(arg)), unitsPage);
    });
  }

  function weaponLine(w) {
    return `${CAT_NAMES[w.cat]} 威力${w.pow} 命中${w.hit} 射程${w.rmin === w.rmax ? w.rmin : w.rmin + '-' + w.rmax}${w.heal ? ' 回復' + w.heal : ''}${w.fx ? ` <span class="fxbadge">${FX_NAMES[w.fx]}</span>` : ''}${w.cleanse ? ' <span class="fxbadge">状態回復</span>' : ''}`;
  }
  // 店に並んでいるか
  const inShop = it => it.price > 0 && it.shop !== false && !it.enemyOnly && (!it.unlock || D().cleared >= it.unlock);

  function unitDetail(u, back) {
    const c = CLASSES[u.cls];
    const s = Engine.calcStats(u);
    const w = WEAPONS[u.weapon];
    const stat = (n, v) => `<div class="st"><span>${n}</span><b>${v}</b></div>`;
    const html = `
      <div class="card row"><div class="bigicon">${Art.icon(u.cls, 'player')}</div>
        <div class="grow"><div class="uname big">${u.name}</div>
        <div>${c.name} ${typeBadge(u.cls)} <span class="muted">${c.role}・${MOVE_NAMES[s.move]}</span></div>
        <div>Lv${u.lv} <span class="muted">EXP ${u.exp}/100</span></div>
        <div class="expbar"><i style="width:${u.lv >= Engine.MAX_LV ? 100 : u.exp}%"></i></div></div></div>
      <div class="card stats">${stat('HP', s.maxhp)}${stat('攻撃', s.atk)}${stat('防御', s.def)}${stat('移動', s.mov)}${stat('射程', rangeText(s))}${stat('命中', s.hit)}${stat('回避', s.avo)}${s.heal ? stat('回復', s.heal) : ''}${s.regen ? stat('自動回復', s.regen) : ''}</div>
      <div class="card"><h3>装備</h3>
        <button class="slot" data-act="slot" data-arg="w"><span class="slot-k">武器</span><span class="grow"><b>${w.name}</b><br><small>${weaponLine(w)}</small></span><span class="chev">›</span></button>
        ${[0, 1].map(i => {
          const p = u.parts[i] ? PARTS[u.parts[i]] : null;
          return `<button class="slot" data-act="slot" data-arg="${i}"><span class="slot-k">パーツ${i + 1}</span><span class="grow">${p ? `<b>${p.name}</b><br><small>${p.desc}</small>` : '<span class="muted">（空き）</span>'}</span><span class="chev">›</span></button>`;
        }).join('')}
      </div>`;
    page(u.name, html, back, (a, arg) => {
      if (a !== 'slot') return;
      if (arg === 'w') chooseWeapon(u, () => unitDetail(u, back));
      else choosePart(u, Number(arg), () => unitDetail(u, back));
    });
  }

  // 装備変更後の能力値の差分を文字で
  function diffText(u, change) {
    const a = Engine.calcStats(u);
    const b = Engine.calcStats(Object.assign({}, u, change));
    const out = [];
    const names = { maxhp: 'HP', atk: '攻', def: '防', mov: '移', hit: '命中', avo: '回避', heal: '回復', regen: '自動回復', expRate: '経験値%', gold: 'お金%', cardPow: 'カード威力%' };
    for (const k in names) {
      const dv = (b[k] || 0) - (a[k] || 0);
      if (dv) out.push(`<span class="${dv > 0 ? 'up' : 'down'}">${names[k]}${dv > 0 ? '+' : ''}${dv}</span>`);
    }
    if (a.rmin !== b.rmin || a.rmax !== b.rmax) out.push(`<span class="up">射程${rangeText(b)}</span>`);
    if (a.move !== b.move) out.push(`<span class="up">移動タイプ:${MOVE_NAMES[b.move]}</span>`);
    if (a.fx !== b.fx && b.fx) out.push(`<span class="up">${FX_NAMES[b.fx]}</span>`);
    for (const [k, n] of [['nopoison', '毒無効'], ['nopara', 'マヒ無効'], ['endure', 'ふんばり'], ['antiair', '対空']]) if (!a[k] && b[k]) out.push(`<span class="up">${n}</span>`);
    return out.join(' ') || '<span class="muted">変化なし</span>';
  }

  function chooseWeapon(u, done) {
    const c = CLASSES[u.cls];
    const ids = Object.keys(WEAPONS).filter(id => Save.canEquip(u, id) && (Save.isDefaultWeapon(id) || Save.count(id) > 0 || id === u.weapon));
    const rows = ids.map(id => {
      const w = WEAPONS[id];
      const cur = id === u.weapon;
      return `<button class="opt ${cur ? 'cur' : ''}" data-act="pick" data-arg="${id}" ${cur ? 'disabled' : ''}>
        <div><b>${w.name}</b> ${cur ? '<small>（装備中）</small>' : Save.isDefaultWeapon(id) ? '<small>（標準）</small>' : `<small>×${Save.count(id)}</small>`}</div>
        <div class="muted">${weaponLine(w)}</div><div class="diff">${cur ? '' : diffText(u, { weapon: id })}</div></button>`;
    }).join('');
    modal(`<h3>武器を選ぶ</h3><div class="muted center">${c.name}は「${c.cats.map(k => CAT_NAMES[k]).join('・')}」武器を装備できます</div>
      <div class="opts">${rows}</div><div class="muted center">ショップで新しい武器が買えます</div>
      <div class="btnrow"><button class="btn gray" data-act="close">閉じる</button></div>`,
    (act, id) => { if (act === 'pick') { Save.equipWeapon(u, id); } done(); });
  }

  function choosePart(u, slot, done) {
    const cur = u.parts[slot];
    const ids = Object.keys(PARTS).filter(id => Save.count(id) > 0);
    const rows = ids.map(id => {
      const p = PARTS[id];
      const ch = { parts: u.parts.map((x, i) => (i === slot ? id : x)) };
      return `<button class="opt" data-act="pick" data-arg="${id}"><div><b>${p.name}</b> <small>×${Save.count(id)}</small></div>
        <div class="muted">${p.desc}</div><div class="diff">${diffText(u, ch)}</div></button>`;
    }).join('');
    modal(`<h3>パーツ${slot + 1}を選ぶ</h3>
      <div class="opts">${cur ? `<button class="opt" data-act="remove"><b>外す</b>（${PARTS[cur].name}）</button>` : ''}${rows || '<div class="muted center">持っているパーツがありません。<br>ショップで買うか、バトルで手に入れよう。</div>'}</div>
      <div class="btnrow"><button class="btn gray" data-act="close">閉じる</button></div>`,
    (act, id) => {
      if (act === 'pick') Save.equipPart(u, slot, id);
      else if (act === 'remove') Save.equipPart(u, slot, null);
      done();
    });
  }

  // ---------- カード（デッキ編集・図鑑） ----------
  let cardFilter = 'all';
  let cardsBack = null;
  function cardFace(id, known) {
    const c = CARDS[id];
    if (!known) return `<div class="cface unknown"><div class="cf-icon">？</div><div class="cf-name">？？？</div><div class="stars">${'★'.repeat(c.rank)}</div></div>`;
    return `<div class="cface k-${c.kind}" data-act="cinfo" data-arg="${id}"><div class="cf-kind">${CARD_KINDS[c.kind].name}</div><div class="cf-icon">${c.icon}</div>
      <div class="cf-name">${c.name}</div><div class="stars">${'★'.repeat(c.rank)}</div></div>`;
  }
  function cardSpecText(c) {
    const r = c.self ? '自分中心' : c.range >= 99 ? '射程∞' : '射程' + c.range;
    return [CARD_KINDS[c.kind].name, r, c.area ? '範囲' + c.area : '', c.pow ? '威力' + c.pow : '', c.heal ? '回復' + (c.heal >= 999 ? '全' : c.heal) : ''].filter(Boolean).join('・');
  }
  function cardInfo(id) {
    const c = CARDS[id];
    modal(`<div class="cgrid one">${cardFace(id, true)}</div><h3>${c.name}</h3>
      <div class="center">${cardSpecText(c)}</div><p class="center">${c.desc}</p>
      <div class="center muted">所持 ${Save.cardCount(id)}枚 / デッキに${Save.inDeck(id)}枚${c.only === 'synth' ? '<br>※合成でしか作れない' : c.only === 'wild' ? '<br>※荒野の宝箱でしか見つからない' : ''}</div>
      <div class="btnrow"><button class="btn" data-act="ok">閉じる</button></div>`);
  }
  function cardTabs(tab) {
    return `<div class="tabs">${[['deck', 'デッキ編集'], ['synth', '合成'], ['book', '図鑑']].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="ctab" data-arg="${k}">${n}</button>`).join('')}</div>`;
  }
  function cardsPage(tab, back, keep) {
    if (back) cardsBack = back;
    if (!back && !keep) cardsBack = title;
    const d = D();
    let html = cardTabs(tab);
    if (tab === 'deck') {
      const kinds = [['all', 'すべて']].concat(Object.keys(CARD_KINDS).map(k => [k, CARD_KINDS[k].icon + CARD_KINDS[k].name]));
      const ids = Object.keys(d.cards).filter(id => cardFilter === 'all' || CARDS[id].kind === cardFilter)
        .sort((a, b) => Object.keys(CARD_KINDS).indexOf(CARDS[a].kind) - Object.keys(CARD_KINDS).indexOf(CARDS[b].kind) || CARDS[a].rank - CARDS[b].rank);
      html += `<div class="deckbar"><div class="deckcount ${d.deck.length === DECK_SIZE ? 'full' : ''}">デッキ <b>${d.deck.length}</b>/${DECK_SIZE}</div>
        <button class="btn small" data-act="auto">おまかせ</button><button class="btn small gray" data-act="clear">全部外す</button></div>
        <div class="muted small center">${deckSummary()}</div>
        <div class="chips">${kinds.map(([k, n]) => `<button class="chip ${cardFilter === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${n}</button>`).join('')}</div>` +
        ids.map(id => {
          const c = CARDS[id], n = Save.inDeck(id), lim = Save.deckLimit(id);
          return `<div class="crow k-${c.kind} ${n ? 'in' : ''}"><span class="bc-icon" data-act="cinfo" data-arg="${id}">${c.icon}</span>
            <span class="grow" data-act="cinfo" data-arg="${id}"><b>${c.name}</b> <small class="stars">${'★'.repeat(c.rank)}</small><br><small>${cardSpecText(c)}</small><br><small class="muted">${c.desc}</small></span>
            <span class="stepper"><button data-act="minus" data-arg="${id}" ${n ? '' : 'disabled'}>−</button><b>${n}</b><small>/${lim}</small>
            <button data-act="plus" data-arg="${id}" ${n < lim && d.deck.length < DECK_SIZE ? '' : 'disabled'}>＋</button></span></div>`;
        }).join('') + `<div class="muted center small">同じカードは${DECK_MAX_SAME}枚まで（持っている枚数まで）入れられます</div>`;
    } else if (tab === 'synth') {
      html += synthHtml();
    } else {
      const all = Object.keys(CARDS);
      const seen = all.filter(id => d.seen[id]).length;
      html += `<div class="card center">見つけたカード <b>${seen}</b> / ${all.length}</div>
        <div class="cgrid">${all.map(id => cardFace(id, d.seen[id])).join('')}</div>`;
    }
    page('カード', html, cardsBack, (a, arg) => {
      if (a === 'ctab') cardsPage(arg, null, true);
      else if (a === 'filter') { cardFilter = arg; cardsPage('deck', null, true); }
      else if (a === 'plus') { Save.deckAdd(arg); cardsPage('deck', null, true); }
      else if (a === 'minus') { Save.deckRemove(arg); cardsPage('deck', null, true); }
      else if (a === 'auto') { Save.autoDeck(); toast('おまかせでデッキを組みました'); cardsPage('deck', null, true); }
      else if (a === 'clear') { Save.deckClear(); cardsPage('deck', null, true); }
      else if (a === 'cinfo') cardInfo(arg);
      else if (a === 'potadd') { if (pot.length < SYNTH_SLOTS && potLeft(arg) > 0) pot.push(arg); cardsPage('synth', null, true); }
      else if (a === 'potdel') { pot.splice(Number(arg), 1); cardsPage('synth', null, true); }
      else if (a === 'potclear') { pot = []; cardsPage('synth', null, true); }
      else if (a === 'potfill') { pot = Save.recipeList(arg); cardsPage('synth', null, true); }
      else if (a === 'synth') doSynth();
    }, keep);
  }

  // ---------- カード合成 ----------
  let pot = []; // なべに入れた材料
  const potLeft = id => Save.cardCount(id) - pot.filter(x => x === id).length;
  function potMessage() {
    if (!pot.length) return '<span class="muted">下の手持ちカードをタップして、なべに入れよう（最大' + SYNTH_SLOTS + '枚）</span>';
    const rid = Save.findRecipe(pot);
    if (rid && D().recipes[rid]) return `→ <b>${CARDS[RECIPES[rid].out].icon} ${CARDS[RECIPES[rid].out].name}</b> ができる！`;
    if (rid) return '<b class="c-gold">✨ 何かが起こりそう…！</b>';
    if (Save.nearRecipe(pot)) return '<span class="c-gold">あと少しで何かできそう…</span>';
    return '<span class="muted">この組み合わせでは何もできなさそう</span>';
  }
  function synthHtml() {
    const d = D();
    pot = pot.filter(id => Save.cardCount(id) > 0);
    while (pot.some(id => potLeft(id) < 0)) pot.splice(pot.findIndex(id => potLeft(id) < 0), 1);
    const slots = [];
    for (let i = 0; i < SYNTH_SLOTS; i++) {
      const id = pot[i];
      slots.push(id ? `<button class="potslot k-${CARDS[id].kind}" data-act="potdel" data-arg="${i}"><span>${CARDS[id].icon}</span><small>${CARDS[id].name}</small><i>×</i></button>` : '<div class="potslot empty">＋</div>');
    }
    const rids = Object.keys(RECIPES);
    const known = rids.filter(r => d.recipes[r]);
    const recipes = known.map(rid => {
      const r = RECIPES[rid], o = CARDS[r.out];
      const mats = Object.entries(r.in).map(([k, v]) => `<span class="mat ${Save.cardCount(k) >= v ? 'ok' : 'ng'}">${CARDS[k].icon}${CARDS[k].name}×${v} <small>(${Save.cardCount(k)})</small></span>`).join('');
      return `<div class="recipe"><div class="row"><span class="bc-icon">${o.icon}</span><span class="grow"><b>${o.name}</b> <small class="stars">${'★'.repeat(o.rank)}</small></span>
        <button class="btn small ${Save.canCraft(rid) ? 'purple' : 'gray'}" data-act="potfill" data-arg="${rid}" ${Save.canCraft(rid) ? '' : 'disabled'}>材料を入れる</button></div><div class="mats">${mats}</div></div>`;
    }).join('');
    const own = Object.keys(d.cards).sort((a, b) => Object.keys(CARD_KINDS).indexOf(CARDS[a].kind) - Object.keys(CARD_KINDS).indexOf(CARDS[b].kind) || CARDS[a].rank - CARDS[b].rank)
      .map(id => `<button class="ownchip k-${CARDS[id].kind}" data-act="potadd" data-arg="${id}" ${potLeft(id) > 0 && pot.length < SYNTH_SLOTS ? '' : 'disabled'}>${CARDS[id].icon}<span>${CARDS[id].name}</span><b>${potLeft(id)}</b></button>`).join('');
    return `<div class="card pot"><div class="pot-title">🧪 合成なべ</div><div class="potslots">${slots.join('')}</div>
      <div class="potmsg">${potMessage()}</div>
      <div class="btnrow"><button class="btn purple" data-act="synth" ${pot.length ? '' : 'disabled'}>合成する</button><button class="btn gray" data-act="potclear" ${pot.length ? '' : 'disabled'}>空にする</button></div>
      <div class="muted small center">合わないときは何も起きません（カードは減りません）</div></div>
      <div class="card"><h3>手持ちのカード <small class="muted">タップでなべへ</small></h3><div class="ownchips">${own}</div></div>
      <div class="card"><h3>📜 レシピ帳 <small class="muted">${known.length} / ${rids.length}</small></h3>
      ${recipes}<div class="muted small center">新しいレシピは宝箱で見つかるほか、いろいろな組み合わせを試すと発見できます</div></div>`;
  }
  function doSynth() {
    const deckBefore = D().deck.length;
    const r = Save.synth(pot);
    if (!r.ok) {
      modal(`<h3>💨 何も起きなかった…</h3><p class="center">${r.near ? 'でも、あと少しで何かできそうな気がする…！<br><small class="muted">材料を足してみよう</small>' : 'この組み合わせではカードはできないようだ。'}</p>
        <p class="center muted small">カードは減っていません</p><div class="btnrow"><button class="btn" data-act="ok">OK</button></div>`);
      return;
    }
    pot = [];
    const lost = deckBefore - D().deck.length;
    modal(`<h3>${r.isNew ? '✨ 新レシピ発見！' : '🧪 合成成功！'}</h3><div class="cgrid one">${cardFace(r.out, true)}</div>
      <p class="center"><b>${CARDS[r.out].name}</b> ${'★'.repeat(CARDS[r.out].rank)}<br><small>${CARDS[r.out].desc}</small></p>
      ${lost > 0 ? `<p class="center down small">材料に使ったカードがデッキから${lost}枚外れました</p>` : ''}
      <div class="btnrow"><button class="btn" data-act="ok">OK</button></div>`, () => cardsPage('synth', null, true));
  }

  // ---------- 設定 ----------
  function settings(back) {
    const st = D().settings;
    modal(`<h3>⚙️ 設定</h3>
      <div class="setrow"><div class="grow"><b>攻撃カードのミニゲーム</b><div class="muted">オフにすると威力はいつも1.0倍</div></div>
      <button class="btn small ${st.minigame ? 'green' : 'gray'}" data-act="mg">${st.minigame ? 'オン' : 'オフ'}</button></div>
      <div class="btnrow"><button class="btn gray" data-act="close">閉じる</button></div>`, act => {
      if (act === 'mg') { st.minigame = !st.minigame; Save.write(); settings(back); }
      else if (back) back();
    });
  }

  // ---------- ショップ ----------
  function shop(tab) {
    const d = D();
    const tabs = [['weapon', '武器'], ['part', 'パーツ'], ['card', 'カード'], ['sell', '売る']].map(([k, n]) =>
      `<button class="tab ${tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${n}</button>`).join('');
    let list = '';
    if (tab === 'weapon' || tab === 'part') {
      const src = tab === 'weapon' ? WEAPONS : PARTS;
      const ids = Object.keys(src).filter(id => inShop(src[id]));
      const soon = Object.keys(src).filter(id => src[id].price > 0 && src[id].shop !== false && !inShop(src[id])).length;
      list = ids.map(id => {
        const it = src[id];
        const who = tab === 'weapon' ? Object.keys(CLASSES).filter(k => !CLASSES[k].enemyOnly && CLASSES[k].cats.includes(it.cat)).map(k => CLASSES[k].name.replace('型', '')).join('・') : '';
        return `<div class="item"><div class="grow"><b>${it.name}</b> <small class="muted">所持${Save.count(id)}</small>
          <div class="muted">${tab === 'weapon' ? weaponLine(it) : it.desc}</div>
          ${tab === 'weapon' ? `<div class="muted small">${it.desc}／装備：${who}</div>` : ''}</div>
          <button class="btn small gold" data-act="buy" data-arg="${id}" ${d.money < it.price ? 'disabled' : ''}>💰${it.price}</button></div>`;
      }).join('') + (soon ? `<div class="muted center">ストーリーを進めると、あと${soon}種類が店に並びます</div>` : '');
    } else if (tab === 'card') {
      list = CARD_PACKS.map(pk => {
        const locked = pk.unlock && d.cleared < pk.unlock;
        return `<div class="item"><div class="grow"><b>🃏 ${pk.name}</b> <small class="muted">${pk.count}枚入り</small>
          <div class="muted">${locked ? `ストーリー${pk.unlock}ステージクリアで解放` : pk.desc}</div></div>
          <button class="btn small gold" data-act="pack" data-arg="${pk.id}" ${locked || d.money < pk.price ? 'disabled' : ''}>💰${pk.price}</button></div>`;
      }).join('') + '<div class="muted center">★4のカードはパックからは出ません（合成で作ろう）</div>';
    } else {
      const ids = Object.keys(d.inv).filter(id => d.inv[id] > 0);
      list = ids.length ? ids.map(id => {
        const it = Save.item(id);
        return `<div class="item"><div class="grow"><b>${it.name}</b> <small class="muted">×${d.inv[id]}</small><div class="muted">${it.kind === 'weapon' ? weaponLine(it) : it.desc}</div></div>
          <button class="btn small" data-act="sell" data-arg="${id}">売る 💰${Save.sellPrice(id)}</button></div>`;
      }).join('') : '<div class="card muted center">売れるアイテムがありません<br><small>（装備中のものは外すと売れます）</small></div>';
    }
    page('ショップ', `<div class="tabs">${tabs}</div>${list}`, title, (a, arg) => {
      if (a === 'tab') shop(arg);
      else if (a === 'buy') { if (Save.buy(arg)) toast(`${Save.item(arg).name} を買った！`); shop(tab); }
      else if (a === 'sell') { if (Save.sell(arg)) toast(`${Save.item(arg).name} を売った`); shop(tab); }
      else if (a === 'pack') {
        const got = Save.buyPack(arg);
        if (!got) return;
        modal(`<h3>🃏 パックを開けた！</h3><div class="cgrid">${got.map(id => cardFace(id, true)).join('')}</div>
          <div class="btnrow"><button class="btn" data-act="ok">OK</button></div>`, () => shop('card'));
      }
    }, true);
  }

  // ---------- 初期化 ----------
  function init() {
    Save.load();
    BattleUI.init();
    $('pageBack').onclick = () => { if (pageBack) pageBack(); };
    $('pageBody').addEventListener('click', e => {
      const btn = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!btn || btn.disabled || !pageHandler) return;
      e.stopPropagation();
      pageHandler(btn.dataset.act, btn.dataset.arg);
    });
    $('btnMenu').onclick = () => modal(`<h3>メニュー</h3>
      <div class="btnrow"><button class="btn" data-act="help">あそびかた</button></div>
      <div class="muted center">ミニゲームの設定はタイトルの「⚙️設定」で変えられます<br>（次の戦闘から反映）</div>
      <div class="btnrow"><button class="btn gray" data-act="close">続ける</button><button class="btn red" data-act="quit">あきらめる</button></div>`,
    act => { if (act === 'help') help(); if (act === 'quit') title(); });
    title();
  }

  return { init, show, modal, title, storyList, freeBattle, unitsPage, shop, prep, stageIntro, unitDetail, makeFreeCfg, cardsPage, settings, doSynth, get pot() { return pot; }, set pot(v) { pot = v; }, get sortie() { return sortie; } };
})();

window.addEventListener('DOMContentLoaded', App.init);
