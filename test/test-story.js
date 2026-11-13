// ストーリー：データ検証 ＋ CPUによる通しプレイ（難易度カーブの確認）
// 通しプレイの回数は globalThis.RUNS（既定1）。sh test/run.sh test/test-story.js で実行
function autoEquip() {
  const d = Save.data;
  for (const u of d.roster) {
    const best = Object.keys(d.inv).filter(id => WEAPONS[id] && Save.canEquip(u, id) && Save.count(id) > 0)
      .sort((a, b) => WEAPONS[b].pow - WEAPONS[a].pow)[0];
    if (best && WEAPONS[best].pow > WEAPONS[u.weapon].pow && !WEAPONS[u.weapon].heal) Save.equipWeapon(u, best);
    for (const slot of [0, 1]) {
      if (u.parts[slot]) continue;
      const p = Object.keys(d.inv).find(id => PARTS[id] && Save.count(id) > 0 && !(PARTS[id].mod.rmax && Engine.calcStats(u).rmax < 2) && !PARTS[id].mod.move && !(PARTS[id].mod.heal && !Engine.calcStats(u).heal));
      if (p) Save.equipPart(u, slot, p);
    }
  }
}
function autoShop() {
  const d = Save.data;
  const wish = ['power_motor', 'armor_plate', 'energy_cell', 'hyper_motor', 'hard_plate', 'mega_cell', 'guard_core', 'balancer', 'power_motor', 'armor_plate', 'big_battery', 'lockon'];
  for (const id of wish) if (PARTS[id] && (!PARTS[id].unlock || d.cleared >= PARTS[id].unlock) && d.money >= PARTS[id].price + 500) Save.buy(id);
  // 強い武器
  for (const id of Object.keys(WEAPONS)) {
    const w = WEAPONS[id];
    if (w.price > 0 && w.shop !== false && !w.enemyOnly && (!w.unlock || d.cleared >= w.unlock) && w.pow >= 9 && Save.count(id) === 0 && d.money >= w.price + 1500) Save.buy(id);
  }
  if (d.money > 4000) Save.buyPack(d.cleared >= 5 ? 'gold' : 'normal');
}
// できる合成はしておく（★の高いものから）
function autoSynth() {
  for (let k = 0; k < 6; k++) {
    const rid = Object.keys(Save.data.recipes).filter(Save.canCraft).sort((a, b) => CARDS[RECIPES[b].out].rank - CARDS[RECIPES[a].out].rank)[0];
    if (!rid) return;
    Save.synth(Save.recipeList(rid));
  }
}

(async () => {
  try {
    // ---- データ検証 ----
    ok(STAGES.length === 30, 'ステージ30個');
    ok(CHAPTERS.length === 6 && CHAPTERS[CHAPTERS.length - 1].to === STAGES.length, '章が全ステージを覆う');
    const seenTerrain = new Set(), seenEnemy = new Set();
    const ids = new Set();
    STAGES.forEach((st, i) => {
      const tag = `S${i + 1}`;
      ok(!ids.has(st.id), tag + ' idの重複'); ids.add(st.id);
      const w = st.rows[0].length, h = st.rows.length;
      ok(w <= 16 && h <= 20 && st.rows.every(r => r.length === w), tag + ' マップ形式');
      ok(st.rows.every(r => [...r].every(c => TERRAIN[c])), tag + ' 地形の文字');
      const ch = CHAPTERS.findIndex(c => i + 1 <= c.to);
      const newT = [...new Set(st.rows.join(''))].filter(c => !seenTerrain.has(c));
      newT.forEach(c => seenTerrain.add(c));
      const used = new Set();
      for (const [x, y] of st.start) { ok(TERRAIN[st.rows[y][x]].cost.ground < 99, `${tag} 出撃位置`); ok(!used.has(x + ',' + y), tag + ' 出撃重複'); used.add(x + ',' + y); }
      const all = st.enemies.concat(...(st.waves || []).map(wv => wv.enemies));
      for (const e of all) {
        ok(CLASSES[e.cls], `${tag} 兵種 ${e.cls}`);
        ok(e.lv >= 1 && e.lv <= Engine.MAX_LV, `${tag} Lv`);
        ok(e.x < w && e.y < h, `${tag} 範囲`);
        for (const p of e.parts || []) ok(PARTS[p], `${tag} パーツ ${p}`);
        if (e.weapon) ok(WEAPONS[e.weapon], `${tag} 武器 ${e.weapon}`);
        seenEnemy.add(e.cls);
      }
      for (const e of st.enemies) {
        ok(TERRAIN[st.rows[e.y][e.x]].cost[CLASSES[e.cls].move] < 99, `${tag} 敵が通れないマス ${e.cls} ${e.x},${e.y}`);
        ok(!used.has(e.x + ',' + e.y), `${tag} 位置の重複 ${e.x},${e.y}`); used.add(e.x + ',' + e.y);
      }
      for (const id of st.reward.items || []) ok(Save.item(id), `${tag} 報酬 ${id}`);
      for (const id of st.reward.cards || []) ok(CARDS[id], `${tag} 報酬カード ${id}`);
      const g = st.goal || { type: 'rout' };
      ok(['rout', 'boss', 'reach', 'defend'].includes(g.type), tag + ' 勝利条件');
      if (g.type === 'boss') ok(st.enemies.some(e => e.boss), tag + ' ボスがいる');
      if (g.type === 'reach') ok(TERRAIN[st.rows[g.y][g.x]].cost.ground < 99, tag + ' 拠点');
      if (g.type === 'defend') ok(g.turns > 0 && g.base, tag + ' 防衛');
    });
    // 章ごとに新しい地形と新しい敵
    for (const [c, terr, foe] of [[2, 'S', 'sasori'], [3, 'M', 'mukade'], [4, 'P', 'junk_titan'], [5, 'L', 'emperor']]) {
      const from = CHAPTERS[c - 1].to, to = CHAPTERS[c].to;
      const before = STAGES.slice(0, from).map(s => s.rows.join('')).join('');
      ok(!before.includes(terr) && STAGES.slice(from, to).some(s => s.rows.join('').includes(terr)), `${CHAPTERS[c].name} で新しい地形 ${terr}`);
    }
    ok(['boss', 'reach', 'defend'].every(t => STAGES.some(s => s.goal && s.goal.type === t)), '勝利条件4種類');
    ok(STAGES.some(s => s.rows[0].length === 16 && s.rows.length === 20), '16×20のマップ');
    // 宝箱限定の装備は、どこかの宝箱に入っている
    const chestItems = new Set(STAGES.flatMap(s => (s.chests || []).map(c => c.get.item).filter(Boolean)));
    for (const id of Object.keys(WEAPONS).concat(Object.keys(PARTS))) {
      const it = WEAPONS[id] || PARTS[id];
      if (it.shop === false) ok(chestItems.has(id), '宝箱限定の装備が置かれている ' + id);
    }

    // ---- 通しプレイ ----
    const RUNS = globalThis.RUNS || 1;
    for (let run = 0; run < RUNS; run++) {
      Save.reset();
      const d = Save.data;
      const log = [];
      let chestN = 0, total = 0;
      autoPlay.cardsUsed = 0;
      for (let i = 0; i < STAGES.length; i++) {
        const st = STAGES[i];
        let tries = 0, won = false, turns = 0;
        while (!won && tries < 8) {
          tries++;
          autoShop(); autoSynth(); Save.autoDeck(); autoEquip();
          const party = d.roster.slice().sort((a, b) => b.lv - a.lv).slice(0, st.start.length);
          const r = await autoPlay(st, party, st.enemies, {
            deck: d.deck.slice(), chestsTaken: Save.chestsTaken(st),
            onChest: ev => { Save.takeChest(st, ev.idx, ev.get); chestN++; },
          });
          Save.applyBattle(r.b);
          turns = r.turns;
          if (r.result === 'win') {
            won = true;
            d.money += st.reward.money;
            for (const id of st.reward.items) Save.addItem(id);
            for (const id of st.reward.cards || []) Save.addCard(id);
            d.cleared = Math.max(d.cleared, i + 1);
            Save.syncRecruits();
          }
        }
        total += tries;
        const top = d.roster.map(u => u.lv).sort((a, b) => b - a).slice(0, st.start.length);
        log.push(`S${i + 1}:${won ? tries + '回' : '断念'}/${turns}T(Lv${top[top.length - 1]}-${top[0]})`);
        if (!won) break;
      }
      print(`  通し${run + 1}: ` + log.join(' '));
      print(`    合計${total}戦 宝箱${chestN}個 カード${autoPlay.cardsUsed}枚 仲間${d.roster.length}体 お金${d.money}`);
    }
    // フリーバトル設定の生成
    Save.data.cleared = 30;
    for (let k = 0; k < 20; k++) {
      const cfg = App.makeFreeCfg();
      ok(cfg.enemies.length >= 3, 'フリーバトル敵数');
      for (const e of cfg.enemies) ok(TERRAIN[cfg.stage.rows[e.y][e.x]].cost[CLASSES[e.cls].move] < 99, 'フリー敵の位置');
    }
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
