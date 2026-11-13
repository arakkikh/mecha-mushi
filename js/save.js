'use strict';
// ===== セーブデータ（localStorage） =====
const Save = (() => {
  const KEY = 'mechamushi_save_v1';
  let d = null;

  function newUnit(cls, name, recruit) {
    return {
      id: d.nextId++, cls, name, lv: 1, exp: 0,
      gain: { hp: 0, atk: 0, def: 0 },
      weapon: CLASSES[cls].weapon, parts: [null, null], recruit: !!recruit,
    };
  }

  function fresh() {
    d = { v: 1, money: 500, roster: [], inv: {}, cleared: 0, nextId: 1, freeWins: 0 };
    upgrade();
    syncRecruits();
    return d;
  }

  // ストーリーの進行に応じて仲間を加える。新しく加わった仲間を返す
  function syncRecruits() {
    const added = [];
    for (const r of RECRUITS) {
      if (r.join <= d.cleared && !d.roster.some(u => u.recruit && u.cls === r.cls)) {
        // 途中から加わる仲間は、今の仲間の平均レベル-1で加入
        const avg = d.roster.length ? Math.round(d.roster.reduce((a, x) => a + x.lv, 0) / d.roster.length) : 1;
        const u = newUnit(r.cls, r.name, true);
        if (r.join > 0 && avg > 2) { u.lv = Math.min(Engine.MAX_LV, avg - 1); u.gain = Engine.defaultGain(r.cls, u.lv); }
        d.roster.push(u);
        added.push(u);
      }
    }
    return added;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.v === 1 && Array.isArray(o.roster)) {
          d = o;
          // 壊れたデータの補正
          for (const u of d.roster) {
            if (!CLASSES[u.cls]) continue;
            if (!WEAPONS[u.weapon]) u.weapon = CLASSES[u.cls].weapon;
            if (!Array.isArray(u.parts)) u.parts = [null, null];
            u.parts = [0, 1].map(i => (PARTS[u.parts[i]] ? u.parts[i] : null));
            u.gain = u.gain || { hp: 0, atk: 0, def: 0 };
          }
          d.roster = d.roster.filter(u => CLASSES[u.cls]);
          d.inv = d.inv || {};
          upgrade();
          syncRecruits();
          return d;
        }
      }
    } catch (e) { /* 読み込み失敗時は新規作成 */ }
    fresh();
    write();
    return d;
  }

  // 古いセーブに新しい項目を足す（以前のデータはそのまま引き継ぐ）
  function upgrade() {
    if (!d.chests || typeof d.chests !== 'object') d.chests = {}; // { ステージキー: [取得済みの宝箱番号] }
    if (!d.settings || typeof d.settings !== 'object') d.settings = {};
    if (d.settings.minigame === undefined) d.settings.minigame = true;  // 攻撃カードのミニゲーム
    if (!d.cards || typeof d.cards !== 'object') {
      // カード導入前のセーブ：最初のカードと、クリア済みステージの報酬カードを配る
      d.cards = {}; d.seen = {};
      for (const id in STARTER_CARDS) addCard(id, STARTER_CARDS[id]);
      for (let i = 0; i < Math.min(d.cleared || 0, STAGES.length); i++) for (const id of STAGES[i].reward.cards || []) addCard(id);
      d.deck = [];
      for (const id in STARTER_CARDS) for (let k = 0; k < STARTER_CARDS[id]; k++) d.deck.push(id);
    }
    if (!d.seen || typeof d.seen !== 'object') d.seen = {};
    if (!d.recipes || typeof d.recipes !== 'object') d.recipes = {}; // 知っているレシピ
    if (!d.wild || typeof d.wild !== 'object') d.wild = {};       // 荒野モード { key: クリア回数 }
    for (const id in RECIPES) if (RECIPES[id].known) d.recipes[id] = true;
    for (const id in d.cards) if (!CARDS[id]) delete d.cards[id];
    if (!Array.isArray(d.deck)) d.deck = [];
    fixDeck();
  }

  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 容量不足など */ }
  }

  function reset() { localStorage.removeItem(KEY); fresh(); write(); }

  // ---------- アイテム ----------
  function item(id) {
    if (WEAPONS[id]) return Object.assign({ id, kind: 'weapon' }, WEAPONS[id]);
    if (PARTS[id]) return Object.assign({ id, kind: 'part' }, PARTS[id]);
    return null;
  }
  const count = id => d.inv[id] || 0;
  function addItem(id, n) { d.inv[id] = count(id) + (n || 1); }
  function removeItem(id) {
    if (!count(id)) return false;
    d.inv[id]--;
    if (!d.inv[id]) delete d.inv[id];
    return true;
  }
  const isDefaultWeapon = id => WEAPONS[id] && WEAPONS[id].price === 0;
  const canEquip = (u, wid) => {
    const w = WEAPONS[wid];
    return !!w && !w.enemyOnly && CLASSES[u.cls].cats.includes(w.cat);
  };

  // 武器の付け替え（初期武器は何本でも使える）
  function equipWeapon(u, wid) {
    if (!canEquip(u, wid)) return false;
    if (!isDefaultWeapon(wid) && !removeItem(wid)) return false;
    if (!isDefaultWeapon(u.weapon)) addItem(u.weapon);
    u.weapon = wid;
    write();
    return true;
  }
  function equipPart(u, slot, pid) {
    if (pid && !removeItem(pid)) return false;
    if (u.parts[slot]) addItem(u.parts[slot]);
    u.parts[slot] = pid || null;
    write();
    return true;
  }

  function buy(id) {
    const it = item(id);
    if (!it || !it.price || d.money < it.price) return false;
    d.money -= it.price;
    addItem(id);
    write();
    return true;
  }
  const sellPrice = id => Math.floor((item(id).price || 0) / 2);
  function sell(id) {
    if (!removeItem(id)) return false;
    d.money += sellPrice(id);
    write();
    return true;
  }

  // ---------- 宝箱 ----------
  const stageKey = st => st.key || 's' + st.id;
  const chestsTaken = st => (d.chests[stageKey(st)] || []).slice();
  function chestCount(st) {
    const total = (st.chests || []).length;
    const got = chestsTaken(st).filter(i => i < total).length;
    return { got, total };
  }
  // 宝箱の中身を受け取る（お金・武器・パーツ）
  function grant(get) {
    if (get.money) d.money += get.money;
    if (get.item && item(get.item)) addItem(get.item);
    if (get.card) addCard(get.card);
    if (get.recipe && RECIPES[get.recipe]) d.recipes[get.recipe] = true;
  }
  function getLabel(get) {
    if (get.money) return `💰${get.money}`;
    if (get.item) { const it = item(get.item); return it ? (it.kind === 'weapon' ? '🗡 ' : '⚙️ ') + it.name : '？'; }
    if (get.recipe) return RECIPES[get.recipe] ? `📜 レシピ「${CARDS[RECIPES[get.recipe].out].name}」` : '？';
    if (get.card) return CARDS[get.card] ? `🃏 ${CARDS[get.card].name}${'★'.repeat(CARDS[get.card].rank)}` : '？';
    return '？';
  }
  // 宝箱を開けた：中身を受け取って記録
  function takeChest(st, idx, get) {
    const k = stageKey(st);
    d.chests[k] = d.chests[k] || [];
    if (!d.chests[k].includes(idx)) d.chests[k].push(idx);
    grant(get);
    write();
  }

  // ---------- カード ----------
  const cardCount = id => (d.cards[id] || 0);
  function addCard(id, n) {
    if (!CARDS[id]) return;
    d.cards[id] = cardCount(id) + (n || 1);
    d.seen[id] = true;
  }
  function removeCard(id, n) {
    if (cardCount(id) < (n || 1)) return false;
    d.cards[id] -= (n || 1);
    if (!d.cards[id]) delete d.cards[id];
    fixDeck();
    return true;
  }
  const inDeck = id => d.deck.filter(x => x === id).length;
  const deckLimit = id => Math.min(DECK_MAX_SAME, cardCount(id));
  // 持っていないカード・入れすぎを取り除く
  function fixDeck() {
    const n = {};
    d.deck = d.deck.filter(id => CARDS[id] && (n[id] = (n[id] || 0) + 1) <= deckLimit(id)).slice(0, DECK_SIZE);
  }
  function deckAdd(id) {
    if (d.deck.length >= DECK_SIZE || inDeck(id) >= deckLimit(id)) return false;
    d.deck.push(id); write(); return true;
  }
  function deckRemove(id) {
    const i = d.deck.lastIndexOf(id);
    if (i < 0) return false;
    d.deck.splice(i, 1); write(); return true;
  }
  function deckClear() { d.deck = []; write(); }
  // おまかせ：強いカードから、種類のバランスを見ながら20枚
  function autoDeck() {
    const ids = Object.keys(d.cards).sort((a, b) => CARDS[b].rank - CARDS[a].rank || (CARDS[b].pow || CARDS[b].heal || 0) - (CARDS[a].pow || CARDS[a].heal || 0));
    const want = { attack: 9, heal: 5, buff: 2, status: 3, warp: 1 };
    const deck = [];
    const put = (id, max) => { while (deck.filter(x => x === id).length < Math.min(max, deckLimit(id)) && deck.length < DECK_SIZE) deck.push(id); };
    for (const k in want) {
      for (const id of ids.filter(x => CARDS[x].kind === k)) {
        if (deck.filter(x => CARDS[x].kind === k).length >= want[k]) break;
        put(id, Math.min(DECK_MAX_SAME, want[k] - deck.filter(x => CARDS[x].kind === k).length));
      }
    }
    for (const id of ids) put(id, DECK_MAX_SAME);
    d.deck = deck; write();
  }
  // カードパックを買う → 出たカードの配列
  function buyPack(packId, rng) {
    rng = rng || Math.random;
    const pk = CARD_PACKS.find(p => p.id === packId);
    if (!pk || d.money < pk.price || (pk.unlock && d.cleared < pk.unlock)) return null;
    d.money -= pk.price;
    const got = [];
    for (let i = 0; i < pk.count; i++) {
      let r = rng() * 100, rank = 1;
      for (let k = 0; k < 4; k++) { if (r < pk.rate[k]) { rank = k + 1; break; } r -= pk.rate[k]; }
      const pool = Object.keys(CARDS).filter(id => CARDS[id].rank === rank && !CARDS[id].only);
      const id = pool[Math.floor(rng() * pool.length)];
      addCard(id); got.push(id);
    }
    write();
    return got;
  }

  // ---------- カード合成 ----------
  // 材料の配列（例: ['hari_dan','hari_dan','hari_dan']）→ 合うレシピID
  function countList(list) { const n = {}; for (const id of list) n[id] = (n[id] || 0) + 1; return n; }
  function findRecipe(list) {
    const n = countList(list);
    for (const rid in RECIPES) {
      const r = RECIPES[rid].in;
      const keys = Object.keys(r);
      if (keys.length === Object.keys(n).length && keys.every(k => n[k] === r[k])) return rid;
    }
    return null;
  }
  // 今の材料が、まだ知らないレシピの「途中」になっているか（ヒント用）
  function nearRecipe(list) {
    if (!list.length) return false;
    const n = countList(list);
    return Object.keys(RECIPES).some(rid => !d.recipes[rid] && Object.keys(n).every(k => (RECIPES[rid].in[k] || 0) >= n[k]));
  }
  const canCraft = rid => Object.entries(RECIPES[rid].in).every(([k, v]) => cardCount(k) >= v);
  // 合成する → { ok, out, recipe, isNew } / 失敗時 { ok: false, near }
  function synth(list) {
    const n = countList(list);
    if (!list.length || Object.keys(n).some(k => cardCount(k) < n[k])) return { ok: false, near: false, lack: true };
    const rid = findRecipe(list);
    if (!rid) return { ok: false, near: nearRecipe(list) };
    for (const k in n) removeCard(k, n[k]);
    const out = RECIPES[rid].out;
    addCard(out);
    const isNew = !d.recipes[rid];
    d.recipes[rid] = true;
    d.synthCount = (d.synthCount || 0) + 1;
    write();
    return { ok: true, out, recipe: rid, isNew };
  }
  function recipeList(rid) {
    return Object.entries(RECIPES[rid].in).flatMap(([k, v]) => Array(v).fill(k));
  }

  // 戦闘結果（レベル・経験値）をロスターに反映
  function applyBattle(b) {
    for (const u of b.units) {
      if (u.side !== 'player') continue;
      const r = d.roster.find(x => x.id === u.rosterId);
      if (!r) continue;
      r.lv = u.lv; r.exp = u.exp;
      if (u.gain) r.gain = Object.assign({}, u.gain);
    }
    write();
  }

  return {
    load, write, reset, item, count, addItem, removeItem, canEquip, equipWeapon, equipPart,
    buy, sell, sellPrice, applyBattle, syncRecruits, isDefaultWeapon,
    stageKey, chestsTaken, chestCount, grant, getLabel, takeChest,
    findRecipe, nearRecipe, canCraft, synth, recipeList,
    cardCount, addCard, removeCard, inDeck, deckLimit, deckAdd, deckRemove, deckClear, autoDeck, buyPack, fixDeck,
    get data() { return d; },
  };
})();
