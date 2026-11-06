// ストーリー：データ検証 ＋ CPUによる通しプレイ（難易度カーブの確認）
// 手持ちアイテムを自動で装備（武器は威力が高いもの、パーツは空きに入れる）
function autoEquip() {
  for (const u of Save.data.roster) {
    const best = Object.keys(Save.data.inv).filter(id => Save.canEquip(u, id) && Save.count(id) > 0)
      .sort((a, b) => WEAPONS[b].pow - WEAPONS[a].pow)[0];
    if (best && WEAPONS[best].pow > WEAPONS[u.weapon].pow) Save.equipWeapon(u, best);
    for (const slot of [0, 1]) {
      if (u.parts[slot]) continue;
      const p = Object.keys(Save.data.inv).find(id => PARTS[id] && Save.count(id) > 0 && !(id === 'long_barrel' && Engine.calcStats(u).rmax < 2));
      if (p) Save.equipPart(u, slot, p);
    }
  }
}
function autoShop() {
  const wish = ['power_motor', 'armor_plate', 'energy_cell', 'power_motor', 'armor_plate', 'lockon', 'big_battery', 'overdrive'];
  for (const id of wish) if (Save.data.money >= PARTS[id].price + 300) Save.buy(id);
}

(async () => {
  try {
    // データ検証
    STAGES.forEach((st, i) => {
      ok(st.rows.length === 10 && st.rows.every(r => r.length === 8 && /^[GFRW]+$/.test(r)), `S${i + 1} マップ形式`);
      const used = new Set();
      for (const [x, y] of st.start) { ok(st.rows[y][x] !== 'W', `S${i + 1} 出撃位置が水`); used.add(x + ',' + y); }
      for (const e of st.enemies) {
        ok(CLASSES[e.cls], `S${i + 1} 兵種 ${e.cls}`);
        ok(st.rows[e.y][e.x] !== 'W' || CLASSES[e.cls].move === 'fly', `S${i + 1} 敵が水の上 ${e.cls} ${e.x},${e.y}`);
        ok(!used.has(e.x + ',' + e.y), `S${i + 1} 位置の重複 ${e.x},${e.y}`);
        used.add(e.x + ',' + e.y);
        for (const p of e.parts || []) ok(PARTS[p], `S${i + 1} パーツ ${p}`);
      }
      for (const id of st.reward.items || []) ok(Save.item(id), `S${i + 1} 報酬 ${id}`);
    });
    ok(STAGES.length === 10, 'ステージ10個');

    // 通しプレイ
    const RUNS = 4;
    for (let run = 0; run < RUNS; run++) {
      Save.reset();
      const d = Save.data;
      let total = 0;
      const log = [];
      for (let i = 0; i < STAGES.length; i++) {
        let tries = 0, won = false;
        while (!won && tries < 12) {
          tries++;
          autoShop(); autoEquip();
          const party = d.roster.slice(0, STAGES[i].start.length);
          const r = await autoPlay(STAGES[i], party, STAGES[i].enemies);
          Save.applyBattle(r.b);
          if (r.result === 'win') {
            won = true;
            d.money += STAGES[i].reward.money;
            for (const id of STAGES[i].reward.items) Save.addItem(id);
            d.cleared = i + 1;
            Save.syncRecruits();
          }
        }
        total += tries;
        const lvs = d.roster.map(u => u.lv).join('/');
        log.push(`S${i + 1}:${won ? tries + '回' : '断念'}(Lv ${lvs})`);
        if (!won) break;
      }
      print(`  通し${run + 1}: ` + log.join(' '));
    }
    // フリーバトル設定の生成
    for (let k = 0; k < 20; k++) {
      const cfg = App.makeFreeCfg();
      ok(cfg.enemies.length >= 3, 'フリーバトル敵数');
      for (const e of cfg.enemies) ok(cfg.stage.rows[e.y][e.x] !== 'W' || CLASSES[e.cls].move === 'fly', 'フリー敵が水上');
    }
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
