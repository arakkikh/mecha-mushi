// 宝箱のテスト：ロジック・敵AI・セーブ・旧セーブ互換・画面操作
(async () => {
  try {
    // ---- データ検証：宝箱の位置 ----
    STAGES.forEach((st, i) => {
      const used = new Set(st.start.map(([x, y]) => x + ',' + y).concat(st.enemies.map(e => e.x + ',' + e.y)));
      for (const c of st.chests || []) {
        ok(c.x >= 0 && c.y >= 0 && c.y < st.rows.length && c.x < st.rows[0].length, `S${i + 1} 宝箱が範囲外`);
        ok(!used.has(c.x + ',' + c.y), `S${i + 1} 宝箱がユニットと重なる ${c.x},${c.y}`);
        used.add(c.x + ',' + c.y);
        ok(c.get && (c.get.money > 0 || Save.item(c.get.item)), `S${i + 1} 宝箱の中身 ${JSON.stringify(c.get)}`);
      }
      ok((st.chests || []).length >= 2, `S${i + 1} 宝箱2個以上`);
    });

    // ---- ロジック ----
    const st = STAGES[0];
    let b = Engine.createBattle(st, [{ cls: 'kabuto' }, { cls: 'chou' }]);
    ok(b.chests.length === st.chests.length && b.chests.every(c => c.state === 'closed'), '宝箱が置かれる');
    const c0 = st.chests[0];
    const kab = b.units[0];
    kab.x = c0.x; kab.y = c0.y;
    const ev = Engine.openChest(b, kab);
    ok(ev && ev.side === 'player' && ev.idx === 0, '味方が開ける');
    ok(!Engine.openChest(b, kab), '2回は開かない');
    // 取得済みは出てこない
    b = Engine.createBattle(st, [{ cls: 'kabuto' }], null, { chestsTaken: [0] });
    ok(b.chests[0].state === 'done' && !Engine.chestAt(b, c0.x, c0.y), '取得済みは置かれない');
    ok(Engine.createBattle(st, [{ cls: 'kabuto' }], null, { noChests: true }).chests.length === 0, '宝箱なしモード');

    // ---- 敵AI：どろぼう型は宝箱へ向かう / 普通の敵もついでに取る ----
    const thiefStage = { rows: st.rows, start: [[0, 9]], chests: [{ x: 7, y: 7, get: { money: 1 } }], enemies: [] };
    b = Engine.createBattle(thiefStage, [{ cls: 'kabuto' }], [{ cls: 'hachi', lv: 3, x: 7, y: 2, ai: 'thief' }]);
    const thief = b.units[1];
    let steps = 0;
    while (b.chests[0].state === 'closed' && steps++ < 5) {
      const plan = Engine.planAI(b, thief);
      thief.x = plan.to.x; thief.y = plan.to.y;
      Engine.openChest(b, thief);
    }
    ok(b.chests[0].state === 'stolen', 'どろぼう型が宝箱を取る steps=' + steps);
    b = Engine.createBattle(thiefStage, [{ cls: 'kabuto' }], [{ cls: 'ari', lv: 1, x: 7, y: 9 }]);
    const p = Engine.planAI(b, b.units[1]);
    ok(p.to.x === 7 && p.to.y === 7, '近くの宝箱は普通の敵も取る ' + JSON.stringify(p.to));
    b = Engine.createBattle(thiefStage, [{ cls: 'kabuto' }], [{ cls: 'ari', lv: 1, x: 7, y: 9, ai: 'hold' }]);
    ok(Engine.planAI(b, b.units[1]).to.y === 9, '待ち伏せ型は動かない');

    // ---- セーブ ----
    Save.reset();
    const d = Save.data;
    ok(Save.chestCount(STAGES[1]).got === 0 && Save.chestCount(STAGES[1]).total === 3, '宝箱 0/3');
    const m0 = d.money;
    Save.takeChest(STAGES[1], 0, STAGES[1].chests[0].get);
    Save.takeChest(STAGES[1], 1, STAGES[1].chests[1].get);
    ok(d.money === m0 + STAGES[1].chests[0].get.money, 'お金を受け取る');
    ok(Save.count(STAGES[1].chests[1].get.item) === 1, 'パーツを受け取る');
    Save.load();
    ok(Save.chestCount(STAGES[1]).got === 2, '宝箱 2/3 がセーブされる');
    ok(Save.getLabel({ money: 50 }) === '💰50' && Save.getLabel({ item: 'drill_horn' }).includes('ドリルホーン'), '中身の表示');

    // ---- 旧セーブ（宝箱の項目がない v1）を引き継げる ----
    const old = { v: 1, money: 1234, roster: [{ id: 1, cls: 'kabuto', name: 'ツノマル', lv: 7, exp: 40, gain: { hp: 5, atk: 2, def: 3 }, weapon: 'drill_horn', parts: ['armor_plate', null], recruit: true }], inv: { lockon: 2 }, cleared: 4, nextId: 2, freeWins: 3 };
    localStorage.setItem('mechamushi_save_v1', JSON.stringify(old));
    Save.load();
    const o = Save.data;
    ok(o.money === 1234 && o.cleared === 4 && o.roster[0].lv === 7 && o.roster[0].weapon === 'drill_horn' && o.inv.lockon === 2, '旧セーブの中身が残る');
    ok(o.chests && Save.chestCount(STAGES[0]).got === 0, '旧セーブに宝箱記録が追加される');

    // ---- 画面：CPUで遊んで宝箱を取る ----
    Save.reset();
    let gotN = 0;
    const party = Save.data.roster;
    let res = null;
    BattleUI.start(STAGES[0], party, STAGES[0].enemies, r => { res = r; }, {
      chestsTaken: [], onChest: e => { Save.takeChest(STAGES[0], e.idx, e.get); gotN++; },
    });
    // 味方を宝箱の隣に置いて、そこへ移動→待機
    const bs = BattleUI.state;
    const u = bs.units[0];
    const ch = STAGES[0].chests[0];
    u.x = ch.x; u.y = ch.y + 1;
    BattleUI.tapCell(u.x, u.y);
    await BattleUI.tapCell(ch.x, ch.y);
    ok(BattleUI.mode === 'moved', '宝箱マスへ移動');
    pressSheet('wait');
    for (let i = 0; i < 300 && BattleUI.mode === 'busy'; i++) await sleep();
    ok(gotN === 1 && Save.chestCount(STAGES[0]).got === 1, '画面操作で宝箱を取得 ' + gotN);

    // CPU同士の対戦：宝箱の取り合い（S2・どろぼう型あり）
    let pl = 0, en = 0;
    for (let i = 0; i < 4; i++) {
      Save.reset(); Save.data.cleared = 3; Save.syncRecruits();
      const r = await autoPlay(STAGES[1], Save.data.roster, STAGES[1].enemies);
      pl += r.b.chests.filter(c => c.state === 'opened').length;
      en += r.b.chests.filter(c => c.state === 'stolen').length;
    }
    print(`  S2 宝箱の取り合い（4戦）: 味方 ${pl}個 / 敵 ${en}個 / 残り ${12 - pl - en}個`);
    ok(pl > 0, '味方CPUも宝箱を取る');
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
