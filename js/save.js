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
    syncRecruits();
    return d;
  }

  // ストーリーの進行に応じて仲間を加える。新しく加わった仲間を返す
  function syncRecruits() {
    const added = [];
    for (const r of RECRUITS) {
      if (r.join <= d.cleared && !d.roster.some(u => u.recruit && u.cls === r.cls)) {
        const u = newUnit(r.cls, r.name, true);
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
          syncRecruits();
          return d;
        }
      }
    } catch (e) { /* 読み込み失敗時は新規作成 */ }
    fresh();
    write();
    return d;
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
    get data() { return d; },
  };
})();
