// 戦闘のテスト：ロジック単体 ＋ 画面操作でCPU同士に最後まで戦わせる

// ---- ロジック単体 ----
(function logic() {
  const st = STAGES[0];
  const b = Engine.createBattle(st, [{ cls: 'kabuto' }, { cls: 'kuwagata' }, { cls: 'chou' }]);
  ok(b.units.length === 3 + st.enemies.length, 'ユニット数');
  const kab = b.units[0];
  const res = Engine.reachable(b, kab);
  ok(res.stops.size > 3, '移動範囲がある');
  for (const v of res.stops.values()) ok(st.rows[v.y][v.x] !== 'W', '陸ユニットは水に止まれない');
  // 相性
  ok(Engine.affinity('KIBA', 'KOU') === 1 && Engine.affinity('KOU', 'KIBA') === -1, '相性 牙>甲');
  ok(Engine.affinity('KOU', 'HANE') === 1 && Engine.affinity('HANE', 'KIBA') === 1, '相性 甲>翅, 翅>牙');
  // 飛行は水を越えられる
  const chou = b.units[2];
  chou.x = 3; chou.y = 4;
  const r2 = Engine.reachable(b, chou);
  ok([...r2.stops.values()].some(v => st.rows[v.y][v.x] === 'W'), '飛行は水に止まれる');
  // 予測と実際のダメージが一致
  const e = b.units.find(u => u.side === 'enemy');
  const f = Engine.forecast(b, kab, e, e.x, e.y + 1);
  kab.x = e.x; kab.y = e.y + 1;
  const hp0 = e.hp;
  const ev = Engine.doAttack(b, kab, e, () => 0); // 必ず命中
  ok(ev[0].hit && hp0 - e.hp === f.dmg, '予想ダメージどおり');
  ok(f.hit >= 5 && f.hit <= 100, '命中率の範囲');
  // レベルアップ
  const u = Engine.makeUnit({ cls: 'kuwagata', lv: 1 }, 'player', 0, 0, 99);
  const lv = Engine.gainExp(u, 120, () => 0);
  ok(lv && u.lv === 2 && u.exp === 20, 'レベルアップ');
})();

(async () => {
  try {
    const party = [{ id: 1, cls: 'kabuto' }, { id: 2, cls: 'kuwagata' }, { id: 3, cls: 'chou' }];
    let wins = 0;
    for (let i = 0; i < 6; i++) {
      const r = await autoPlay(STAGES[0], party);
      ok(r.result === 'win' || r.result === 'lose', '決着がつく');
      if (r.result === 'win') wins++;
      print(`  対戦${i + 1}: ${r.result} (${r.turns}ターン)`);
    }
    print(`  勝率 ${wins}/6`);
    // 5種類のユニット vs 敵専用ユニット入り
    const party5 = ['kabuto', 'kuwagata', 'chou', 'hachi', 'tentou'].map((c, i) => ({ id: i + 1, cls: c, lv: 3 }));
    const foes = [
      { cls: 'ari', lv: 3, x: 1, y: 0 }, { cls: 'ga', lv: 3, x: 6, y: 0 }, { cls: 'kamakiri', lv: 4, x: 4, y: 0, ai: 'boss', boss: true },
      { cls: 'tentou', lv: 3, x: 3, y: 0 }, { cls: 'hachi', lv: 3, x: 0, y: 1, ai: 'hold' },
    ];
    let w5 = 0;
    for (let i = 0; i < 6; i++) {
      const r = await autoPlay(STAGES[0], party5, foes);
      ok(r.result === 'win' || r.result === 'lose', '決着がつく(5種)');
      if (r.result === 'win') w5++;
    }
    print(`  5種類パーティ 勝率 ${w5}/6`);
    // 回復の動作
    const b = Engine.createBattle(STAGES[0], party5);
    const ten = b.units[4], kab = b.units[0];
    kab.hp = 5; ten.x = kab.x + 1; ten.y = kab.y;
    if (Engine.unitAt(b, ten.x, ten.y) !== ten) { ten.x = kab.x; ten.y = kab.y - 1; }
    ok(Engine.healTargetsFrom(b, ten, ten.x, ten.y).includes(kab), '回復対象になる');
    Engine.doHeal(b, ten, kab);
    ok(kab.hp === 15, '10回復する hp=' + kab.hp);
    // ハチは森コスト1
    ok(TERRAIN.F.cost[CLASSES.hachi.move] === 1, 'ハチは森を素早く移動');
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) {
    print('ERROR: ' + e + '\n' + e.stack);
  }
})();
