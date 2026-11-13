// 荒野モードのテスト
(async () => {
  try {
    ok(WILDS.length === 40, '荒野マップ40個');
    const keys = new Set();
    const storyMax = Math.max(...STAGES.flatMap(s => s.enemies.concat(...(s.waves || []).map(w => w.enemies)).map(e => e.lv)));
    WILDS.forEach((w, i) => {
      const tag = '荒野' + (i + 1);
      ok(w.key && !keys.has(w.key), tag + ' key'); keys.add(w.key);
      const W = w.rows[0].length, H = w.rows.length;
      ok(W <= 12 && H <= 12 && w.rows.every(r => r.length === W && [...r].every(c => TERRAIN[c])), tag + ' 小さめのマップ');
      const used = new Set();
      for (const [x, y] of w.start) { ok(TERRAIN[w.rows[y][x]].cost.ground < 99 && !used.has(x + ',' + y), tag + ' 出撃'); used.add(x + ',' + y); }
      for (const e of w.enemies) {
        ok(CLASSES[e.cls] && TERRAIN[w.rows[e.y][e.x]].cost[CLASSES[e.cls].move] < 99, `${tag} 敵の位置 ${e.cls}`);
        ok(!used.has(e.x + ',' + e.y), tag + ' 重複'); used.add(e.x + ',' + e.y);
      }
      for (const c of w.chests) {
        ok(!used.has(c.x + ',' + c.y) && w.rows[c.y][c.x] !== 'X', tag + ' 宝箱'); used.add(c.x + ',' + c.y);
        ok(c.get.money > 0 || Save.item(c.get.item) || CARDS[c.get.card] || RECIPES[c.get.recipe], tag + ' 宝箱の中身');
      }
      for (const dr of w.reward.drops) ok(CARDS[dr.card] && dr.rate > 0 && dr.rate < 1, tag + ' ドロップ');
      if (w.goal && w.goal.type === 'boss') ok(w.enemies.some(e => e.boss), tag + ' ボス');
      if (i) ok(w.lv >= WILDS[i - 1].lv - 2 && w.lv >= WILDS[Math.max(0, i - 5)].lv, tag + ' だんだん強くなる（ボスマップは推奨Lv+2）');
    });
    ok(WILDS.slice(-5).every(w => w.lv > storyMax), `後半はストーリー（最大Lv${storyMax}）より強い`);
    const wildCards = Object.keys(CARDS).filter(id => CARDS[id].only === 'wild');
    ok(wildCards.length >= 5, '荒野限定のレアカード');
    for (const id of wildCards) ok(WILDS.some(w => w.reward.drops.some(d => d.card === id) || w.chests.some(c => c.get.card === id)), '荒野で手に入る ' + id);
    // 宝箱以外では手に入らないレシピも荒野にある
    const storyRecipes = new Set(STAGES.flatMap(s => (s.chests || []).map(c => c.get.recipe)).filter(Boolean));
    const wildRecipes = new Set(WILDS.flatMap(w => w.chests.map(c => c.get.recipe)).filter(Boolean));
    for (const r in RECIPES) if (!RECIPES[r].known) ok(storyRecipes.has(r) || wildRecipes.has(r), '宝箱で見つかるレシピ ' + r);

    // ---- セーブ・報酬 ----
    Save.reset();
    const d = Save.data;
    ok(d.wild && Object.keys(d.wild).length === 0, '荒野の記録');
    const w0 = WILDS[0];
    Save.takeChest(w0, 0, w0.chests[0].get);
    ok(Save.chestCount(w0).got === 1 && d.chests.w1, '荒野の宝箱は別に記録');
    ok(Save.chestCount(STAGES[0]).got === 0, 'ストーリーと混ざらない');
    // 勝利時の報酬（初回2倍・ドロップ）
    App.init();
    const d2 = Save.data;
    const realRandom = Math.random;
    Math.random = () => 0; // ドロップ全部当たり
    const b = Engine.createBattle(w0, d2.roster, w0.enemies);
    const m0 = d2.money;
    App.onBattleEnd({ stage: w0, enemies: w0.enemies, mode: 'wild', index: 0, back: App.wildList }, 'win', b, new Map(), []);
    ok(d2.money === m0 + w0.reward.money * 2 && d2.wild.w1 === 1, '初回はお金2倍');
    ok(w0.reward.drops.every(dr => Save.cardCount(dr.card) > 0), 'ドロップを受け取る');
    App.onBattleEnd({ stage: w0, enemies: w0.enemies, mode: 'wild', index: 0, back: App.wildList }, 'win', b, new Map(), []);
    Math.random = realRandom;
    ok(d2.wild.w1 === 2, 'クリア回数');
    pressModal('menu');
    App.wildIntro(39);
    // 旧セーブ
    localStorage.setItem('mechamushi_save_v1', JSON.stringify({ v: 1, money: 0, roster: [], inv: {}, cleared: 3, nextId: 1 }));
    Save.load();
    ok(Save.data.wild && typeof Save.data.wild === 'object', '旧セーブに荒野の記録を追加');

    // ---- CPU対戦：推奨Lvのパーティで挑む ----
    const starter = Object.keys(STARTER_CARDS).flatMap(id => Array(STARTER_CARDS[id]).fill(id));
    const kinds = ['kabuto', 'kuwagata', 'chou', 'hachi', 'tentou', 'tonbo'];
    const res = [];
    for (const i of [0, 9, 19, 29, 39]) {
      const w = WILDS[i];
      let win = 0;
      for (let k = 0; k < 3; k++) {
        const party = kinds.slice(0, w.start.length).map((c, j) => ({ id: j + 1, cls: c, lv: w.lv, gain: Engine.defaultGain(c, w.lv), parts: ['power_motor', 'armor_plate'] }));
        const r = await autoPlay(w, party, w.enemies, { noChests: true, deck: starter });
        if (r.result === 'win') win++;
      }
      res.push(`荒野${i + 1}(Lv${w.lv}) ${win}/3`);
    }
    print('  推奨Lvのパーティ: ' + res.join(' / '));
    // ストーリークリア直後（Lv44・装備あり）で 荒野40 と ストーリー30 を比べる
    const strong = ['kabuto', 'kuwagata', 'chou', 'semi', 'hotaru', 'tonbo', 'kamakiri', 'kamikiri'].map((c, j) => ({ id: j + 1, cls: c, lv: 46, gain: Engine.defaultGain(c, 46), parts: ['hyper_motor', 'hard_plate'] }));
    const deck = ['tsuno_hou', 'tsuno_hou', 'tsuno_hou', 'hoshifuri', 'hoshifuri', 'hoshifuri', 'royal_nectar', 'royal_nectar', 'megumi', 'megumi', 'rinpun_storm', 'rinpun_storm', 'rinpun_storm', 'kakusei', 'kakusei', 'teppeki', 'moudoku', 'moudoku', 'giga_slash', 'giga_slash'];
    let ws = 0, ww = 0, ts = 0, tw = 0;
    for (let k = 0; k < 3; k++) {
      const a = await autoPlay(STAGES[29], strong, STAGES[29].enemies, { noChests: true, deck });
      if (a.result === 'win') { ws++; ts += a.turns; }
      const c = await autoPlay(WILDS[39], strong.slice(0, WILDS[39].start.length), WILDS[39].enemies, { noChests: true, deck });
      if (c.result === 'win') { ww++; tw += c.turns; }
    }
    print(`  Lv46パーティ（カードあり）: ストーリー30 ${ws}/3勝${ws ? '・平均' + (ts / ws).toFixed(0) + 'T' : ''} ／ 荒野40 ${ww}/3勝${ww ? '・平均' + (tw / ww).toFixed(0) + 'T' : ''}`);
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
