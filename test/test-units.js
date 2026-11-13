// ユニット・武器・パーツのテスト
(async () => {
  try {
    const playable = Object.keys(CLASSES).filter(k => !CLASSES[k].enemyOnly);
    ok(playable.length >= 15, '味方にできるユニット15種以上 ' + playable.length);
    for (const k of ['ari', 'kamakiri', 'tonbo', 'kumo', 'hotaru', 'batta', 'dangomushi']) ok(playable.includes(k), '指定ユニット ' + k);
    for (const k of Object.keys(CLASSES)) {
      const c = CLASSES[k];
      ok(WEAPONS[c.weapon] && c.cats.includes(WEAPONS[c.weapon].cat), '標準武器 ' + k);
      ok(MOVE_NAMES[c.move] && TYPES[c.type], '移動・相性 ' + k);
      ok(Art.svg(k, 'player').length > 300 && !Art.svg(k, 'player').includes('undefined'), '絵がある ' + k);
      for (const t in TERRAIN) ok(TERRAIN[t].cost[c.move] > 0, `地形コスト ${t} ${k}`);
    }
    // 全員が仲間になる（重複なし）
    ok(playable.every(k => RECRUITS.some(r => r.cls === k)), '全ユニットが仲間になる');
    ok(new Set(RECRUITS.map(r => r.cls)).size === RECRUITS.length, '仲間の重複なし');
    const pw = Object.keys(WEAPONS).filter(id => !WEAPONS[id].enemyOnly);
    ok(pw.length >= 30, '武器30種以上 ' + pw.length);
    ok(Object.keys(PARTS).length >= 30, 'パーツ30種以上 ' + Object.keys(PARTS).length);
    for (const id of pw) ok(playable.some(k => CLASSES[k].cats.includes(WEAPONS[id].cat)), '装備できるユニットがいる ' + id);
    for (const id in WEAPONS) if (WEAPONS[id].fx) ok(FX_NAMES[WEAPONS[id].fx], '効果名 ' + id);

    const field = { rows: ['GFRWG', 'GGGGG', 'GGGGG', 'GGGGG'], start: [[0, 3], [1, 3], [2, 3], [3, 3]], enemies: [] };
    const mk = (a, d, ax, ay, dx, dy) => {
      const b = Engine.createBattle(field, [a], [Object.assign({ x: dx, y: dy }, d)]);
      b.units[0].x = ax; b.units[0].y = ay;
      return b;
    };
    // 移動タイプ
    let b = Engine.createBattle(field, [{ cls: 'batta' }, { cls: 'kumo' }, { cls: 'gengorou' }, { cls: 'kabuto' }], []);
    const cost = (u, x, y) => Engine.terrain(b, x, y).cost[u.move];
    ok(cost(b.units[0], 2, 0) === 1 && cost(b.units[0], 3, 0) === 99, 'バッタは岩コスト1・水は不可');
    ok(cost(b.units[1], 1, 0) === 1 && cost(b.units[1], 2, 0) === 1, 'クモは森・岩コスト1');
    ok(cost(b.units[2], 3, 0) === 1, 'ゲンゴロウは水コスト1');
    // パーツで移動タイプが変わる
    ok(Engine.calcStats({ cls: 'kabuto', parts: ['aqua_fin'] }).move === 'swim', 'アクアフィンで水中');
    ok(Engine.calcStats({ cls: 'chou', parts: ['all_terrain'] }).move === 'fly', '飛行は変わらない');
    // 2回攻撃
    b = mk({ cls: 'kuwagata', lv: 5, weapon: 'twin_blade' }, { cls: 'dangomushi', lv: 5 }, 1, 2, 1, 1);
    let ev = Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(ev.filter(e => e.kind === 'strike' && e.att === b.units[0].uid).length === 2, '2回攻撃');
    // 防御半減
    b = mk({ cls: 'kabuto', lv: 5 }, { cls: 'dangomushi', lv: 5 }, 1, 2, 1, 1);
    const normal = Engine.calcDmg(b, b.units[0], b.units[1]);
    b.units[0].fx = 'pierce';
    ok(Engine.calcDmg(b, b.units[0], b.units[1]) > normal, '防御半減でダメージ増');
    // 対空
    b = mk({ cls: 'kabuto', lv: 5, weapon: 'sky_hook' }, { cls: 'chou', lv: 5 }, 1, 2, 1, 1);
    const aa = Engine.calcDmg(b, b.units[0], b.units[1]);
    b.units[0].fx = null;
    ok(aa > Engine.calcDmg(b, b.units[0], b.units[1]), '対空で飛行にダメージ増');
    // 毒・マヒ・足止め・吸収
    b = mk({ cls: 'kuwagata', lv: 5, weapon: 'poison_fang' }, { cls: 'dangomushi', lv: 8 }, 1, 2, 1, 1);
    Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(b.units[1].st.poison, '毒の武器');
    b = mk({ cls: 'kuwagata', lv: 5, weapon: 'poison_fang' }, { cls: 'dangomushi', lv: 8, parts: ['poison_guard'] }, 1, 2, 1, 1);
    Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(!b.units[1].st.poison, 'どくけしフィルター');
    b = mk({ cls: 'kuwagata', lv: 5, weapon: 'para_claw' }, { cls: 'dangomushi', lv: 8 }, 1, 2, 1, 1);
    Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(b.units[1].st.para === 1, 'マヒの武器（30%）');
    b = mk({ cls: 'kumo', lv: 5 }, { cls: 'dangomushi', lv: 8 }, 1, 3, 1, 1);
    const mv = b.units[1].mov;
    Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(b.units[1].mov === Math.max(1, mv - 2), 'クモの糸で移動ダウン');
    b = mk({ cls: 'kuwagata', lv: 5, weapon: 'vampire_jaw' }, { cls: 'ari', lv: 1 }, 1, 2, 1, 1);
    b.units[0].hp = 5;
    Engine.doAttack(b, b.units[0], b.units[1], () => 0.99);
    ok(b.units[0].hp > 5 || b.units[1].hp === b.units[1].maxhp, '吸収');
    // ふんばり
    b = mk({ cls: 'kuwagata', lv: 20, weapon: 'thunder_horn' }, { cls: 'ari', lv: 1, parts: ['endure'] }, 1, 2, 1, 1);
    Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(b.units[1].hp === 1, 'ふんばり装置でHP1');
    Engine.doAttack(b, b.units[0], b.units[1], () => 0);
    ok(b.units[1].hp === 0, 'ふんばりは1回だけ');
    // 状態回復の回復武器
    b = Engine.createBattle(field, [{ cls: 'hotaru' }, { cls: 'kabuto' }], []);
    b.units[1].st.poison = { dmg: 3, t: 2 }; b.units[1].x = 0; b.units[1].y = 1; b.units[0].x = 0; b.units[0].y = 3;
    ok(Engine.healTargetsFrom(b, b.units[0], 0, 3).includes(b.units[1]), 'HP満タンでも毒なら回復対象');
    Engine.doHeal(b, b.units[0], b.units[1]);
    ok(!b.units[1].st.poison, 'ホタルで毒が治る');
    // 経験値アップ
    const u = Engine.makeUnit({ cls: 'ari', parts: ['exp_chip'] }, 'player', 0, 0, 1);
    Engine.gainExp(u, 40, () => 0);
    ok(u.exp === 60, '経験値+50%');
    // 店の解放
    Save.reset();
    App.init();
    App.shop('weapon');
    ok(!document.getElementById('pageBody')._html.includes('タイタンホーン'), '序盤は強い武器が並ばない');
    Save.data.cleared = 30; App.shop('weapon');
    ok(document.getElementById('pageBody')._html.includes('タイタンホーン') && !document.getElementById('pageBody')._html.includes('キングシザー'), '進むと並ぶ・宝箱限定は並ばない');
    // 旧セーブ（10面クリア）→ 新しい仲間が加わる
    localStorage.setItem('mechamushi_save_v1', JSON.stringify({ v: 1, money: 0, roster: [], inv: {}, cleared: 10, nextId: 1 }));
    Save.load();
    ok(['ari', 'tonbo', 'kamakiri'].every(k => Save.data.roster.some(r => r.cls === k)) && !Save.data.roster.some(r => r.cls === 'batta'), '旧セーブに新しい仲間');
    // 新ユニット入りのCPU対戦
    const party = ['tonbo', 'kumo', 'hotaru', 'batta', 'dangomushi', 'semi', 'gengorou'].map((k, i) => ({ id: i + 1, cls: k, lv: 11 }));
    let w = 0;
    for (let i = 0; i < 4; i++) { const r = await autoPlay(STAGES[6], i % 2 ? party.slice(2) : party.slice(0, 5), STAGES[6].enemies, { noChests: true }); if (r.result === 'win') w++; }
    print(`  新ユニット5体(Lv11) vs S7(敵Lv11): 勝率 ${w}/4`);
    const foes = [{ cls: 'sasori', lv: 6, x: 2, y: 0, boss: true }, { cls: 'mukade', lv: 6, x: 4, y: 1 }, { cls: 'junk_titan', lv: 6, x: 5, y: 0 }, { cls: 'emperor', lv: 6, x: 3, y: 0, boss: true, ai: 'boss' }];
    const r2 = await autoPlay(STAGES[0], party.slice(0, 5), foes, { noChests: true });
    ok(r2.result, '敵専用ユニットとの対戦が決着');
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
