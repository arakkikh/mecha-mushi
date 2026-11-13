// カードのテスト：データ・効果・状態異常・ミニゲーム判定・デッキ・旧セーブ・CPU対戦
(async () => {
  try {
    // ---- データ ----
    const ids = Object.keys(CARDS);
    ok(ids.length >= 40, 'カード40種以上 ' + ids.length);
    for (const id of ids) {
      const c = CARDS[id];
      ok(CARD_KINDS[c.kind] && c.name && c.icon && c.desc && c.rank >= 1 && c.rank <= 4, 'カード形式 ' + id);
      ok(c.self || c.range >= 1, '射程 ' + id);
      if (c.kind === 'attack') ok(c.pow > 0, '威力 ' + id);
      if (c.kind === 'heal') ok(c.heal > 0, '回復量 ' + id);
      if (c.kind === 'buff') ok(c.buff && BUFF_NAMES[c.buff.k] && c.buff.v > 0, '強化 ' + id);
      if (c.kind === 'status') ok(c.status || (c.buff && c.buff.v < 0), '状態異常 ' + id);
    }
    for (const k of Object.keys(CARD_KINDS)) ok(ids.some(id => CARDS[id].kind === k), '種類がある ' + k);
    ok(ids.some(id => CARDS[id].area && CARDS[id].kind === 'attack'), '範囲攻撃がある');
    ok(Object.values(STARTER_CARDS).reduce((a, b) => a + b, 0) === DECK_SIZE, '最初のカードは20枚');

    // ---- 効果 ----
    const st = { rows: ['GGGGGGGG', 'GGGGGGGG', 'GGGGGGGG', 'GGGGGGGG', 'GGGGGGGG', 'GGGGGGGG'], start: [[1, 5], [2, 5], [3, 5]], enemies: [] };
    const mk = (deck, foes) => Engine.createBattle(st, [{ cls: 'kabuto', lv: 5 }, { cls: 'chou', lv: 5 }, { cls: 'tentou', lv: 5 }], foes || [
      { cls: 'ari', lv: 3, x: 1, y: 3 }, { cls: 'ari', lv: 3, x: 2, y: 3 }, { cls: 'kamakiri', lv: 3, x: 6, y: 0, boss: true },
    ], { deck });
    let b = mk(['hari_dan', 'tsubu_bomb', 'shibire_kona', 'doku_bari', 'power_jushi', 'mitsu', 'warp_pod', 'irekae', 'sabi_eki']);
    const [kab, chou, ten] = b.units;
    const [a1, a2, boss] = b.units.slice(3);
    // 攻撃：ダメージは予測どおり・必ず命中・反撃なし
    const hp0 = a1.hp, khp = kab.hp;
    const dm = Engine.cardDamage(b, kab, a1, CARDS.hari_dan, 1);
    let ev = Engine.useCard(b, kab, 0, a1.x, a1.y, 1);
    ok(a1.hp === Math.max(0, hp0 - dm) && kab.hp === khp, '攻撃カードのダメージ・反撃なし');
    ok(b.deck[0].used, '使ったカードは使用済み');
    ok(Engine.useCard(b, kab, 0, a1.x, a1.y, 1).length === 0, '同じカードは2回使えない');
    ok(Engine.cardDamage(b, kab, a2, CARDS.hari_dan, 1.5) > Engine.cardDamage(b, kab, a2, CARDS.hari_dan, 0.6), 'ミニゲームの倍率で威力が変わる');
    // 範囲
    a1.hp = a1.maxhp;
    const h1 = a1.hp, h2 = a2.hp;
    Engine.useCard(b, chou, 1, 1, 3, 1);
    ok(a1.hp < h1 && a2.hp < h2, '範囲攻撃で2体にダメージ');
    // マヒ：次の敵フェイズは行動できない・ボスには効かない
    a1.hp = a1.maxhp;
    Engine.useCard(b, kab, 2, a1.x, a1.y, 1);
    ok(a1.st.para === 1, 'マヒ');
    let pe = Engine.startPhase(b, 'enemy');
    ok(a1.acted && !a2.acted && pe.some(e => e.kind === 'para'), 'マヒ中は行動済み');
    Engine.startPhase(b, 'player');
    pe = Engine.startPhase(b, 'enemy');
    ok(!a1.acted, 'マヒは1ターンで治る');
    const bb = mk(['shibire_kona']);
    bb.units[0].x = 6; bb.units[0].y = 2;
    ev = Engine.useCard(bb, bb.units[0], 0, 6, 0, 1);
    ok(ev.some(e => e.kind === 'resist') && bb.units[5].st.para === 0, 'ボスにマヒは効かない');
    // 毒
    Engine.startPhase(b, 'player');
    const hpp = a2.hp;
    Engine.useCard(b, kab, 3, a2.x, a2.y, 1);
    Engine.startPhase(b, 'enemy');
    ok(a2.hp === Math.max(1, hpp - 4), '毒で4ダメージ');
    a2.hp = 2; Engine.startPhase(b, 'player'); Engine.startPhase(b, 'enemy');
    ok(a2.hp === 1, '毒では倒れない');
    // 能力アップ：2ターンで元に戻る・レベルアップしても残る
    Engine.startPhase(b, 'player');
    const atk0 = chou.atk;
    Engine.useCard(b, kab, 4, chou.x, chou.y, 1);
    ok(chou.atk === atk0 + 4, '攻撃+4');
    Engine.gainExp(chou, 100, () => 0);
    ok(chou.atk >= atk0 + 4, 'レベルアップ後も効果が残る');
    const atkL = chou.atk;
    Engine.startPhase(b, 'enemy'); Engine.startPhase(b, 'player');
    ok(chou.atk === atkL, '1ターン目はまだ有効');
    Engine.startPhase(b, 'enemy');
    ok(chou.atk === atkL - 4 && chou.buffs.length === 0, '2ターンで元に戻る');
    // 弱体（敵の防御-5）
    Engine.startPhase(b, 'player');
    const d0 = a2.def;
    Engine.useCard(b, chou, 8, a2.x, a2.y, 1);
    ok(a2.def === Math.max(0, d0 - 5), '防御ダウン');
    // 回復
    kab.hp = 5;
    Engine.useCard(b, ten, 5, kab.x, kab.y, 1);
    ok(kab.hp === 17, '12回復');
    // ワープ・入れ替え
    const tiles = Engine.cardTiles(b, ten, 'warp_pod');
    ok(tiles.length > 0 && tiles.every(p => !Engine.unitAt(b, p.x, p.y)), 'ワープ先は空きマス');
    Engine.useCard(b, ten, 6, 7, 5, 1);
    ok(ten.x === 7 && ten.y === 5, 'ワープした');
    const kx = kab.x, ky = kab.y;
    Engine.useCard(b, ten, 7, kx, ky, 1);
    ok(ten.x === kx && ten.y === ky && kab.x === 7 && kab.y === 5, '入れ替え');
    // 陸ユニットは水へワープできない
    const wst = { rows: ['GGWW', 'GGWW'], start: [[0, 0]], enemies: [] };
    const wb = Engine.createBattle(wst, [{ cls: 'kabuto' }], [{ cls: 'ari', x: 1, y: 1 }], { deck: ['jikuu_tunnel'] });
    ok(Engine.cardTiles(wb, wb.units[0], 'jikuu_tunnel').every(p => wst.rows[p.y][p.x] !== 'W'), '水にはワープしない');

    // ---- ミニゲームの判定 ----
    ok(MiniGame.judge(1.0).s === 1 && MiniGame.judge(1.2).s === 0.6 && MiniGame.judge(2).s === 0, '判定');
    ok(MiniGame.scaleAt(MiniGame.DUR / 1.8 * 1.4) > 0.99 && MiniGame.scaleAt(MiniGame.DUR / 1.8 * 1.4) < 1.01, 'ちょうど重なる時間がある');
    ok(MiniGame.mult(0) === 0.6 && MiniGame.mult(1) === 1.5, '倍率0.6〜1.5');
    const pr = MiniGame.play(CARDS.hari_dan);
    MiniGame.tap(); // すぐ押す → MISS
    const sc = await pr;
    ok(sc >= 0 && sc < 0.5, 'ミニゲームが終わる score=' + sc);

    // ---- デッキ・セーブ ----
    Save.reset();
    const d = Save.data;
    ok(d.deck.length === 20 && d.settings.minigame === true, '新規データはデッキ20枚');
    ok(!Save.deckAdd('hari_dan'), '21枚目は入らない');
    Save.deckRemove('hari_dan');
    ok(d.deck.length === 19 && Save.inDeck('hari_dan') === 2, '外す');
    ok(!Save.deckAdd('raimei'), '持っていないカードは入れられない');
    Save.addCard('hari_dan', 5);
    Save.deckAdd('hari_dan'); ok(!Save.deckAdd('hari_dan'), '同じカードは3枚まで');
    Save.removeCard('mitsu', 3);
    ok(Save.inDeck('mitsu') === 0, '手放したカードはデッキから外れる');
    Save.autoDeck();
    const lim = Object.keys(d.cards).reduce((a, id) => a + Save.deckLimit(id), 0);
    ok(d.deck.length === Math.min(DECK_SIZE, lim), 'おまかせで入れられるだけ入れる ' + d.deck.length);
    Save.addCard('hinoko', 3); Save.addCard('kazekiri', 3); Save.autoDeck();
    ok(d.deck.length === DECK_SIZE, 'おまかせで20枚');
    d.money = 10000;
    const got = Save.buyPack('normal');
    ok(got && got.length === 3 && got.every(id => !CARDS[id].only) && d.money === 9700, 'パック購入');
    ok(!Save.buyPack('gold'), 'ゴールドパックは未解放');
    Save.load();
    ok(Save.data.deck.length === DECK_SIZE && Save.data.seen.hari_dan, 'デッキ・図鑑がセーブされる');
    // 旧セーブ（カード導入前）：最初のカード＋クリア済みの報酬カード
    const old = { v: 1, money: 300, roster: [{ id: 1, cls: 'kabuto', name: 'ツノマル', lv: 12, exp: 0, gain: { hp: 9, atk: 4, def: 6 }, weapon: 'iron_horn', parts: [null, null], recruit: true }], inv: {}, cleared: 10, nextId: 2, freeWins: 0, chests: { s1: [0] } };
    localStorage.setItem('mechamushi_save_v1', JSON.stringify(old));
    Save.load();
    const o = Save.data;
    ok(o.roster[0].lv === 12 && o.cleared === 10 && o.chests.s1[0] === 0, '旧セーブを引き継ぐ');
    ok(o.deck.length === 20 && Save.cardCount('tsuno_hou') === 1 && Save.cardCount('mitsu') === 4, '旧セーブにカードが配られる');

    // ---- 画面：カードを使う ----
    Save.reset();
    let res = null;
    BattleUI.start(st, Save.data.roster, [{ cls: 'ari', lv: 1, x: 1, y: 2 }, { cls: 'ari', lv: 1, x: 7, y: 0 }], r => { res = r; }, { deck: ['hari_dan', 'katai_koura'], minigame: false });
    const B = BattleUI.state, u0 = B.units[0];
    BattleUI.tapCell(u0.x, u0.y); BattleUI.tapCell(u0.x, u0.y);
    ok(sheetHtml().includes('カード'), '行動メニューにカード');
    pressSheet('card');
    ok(sheetHtml().includes('ハリ弾'), 'カード一覧');
    pressSheet('pick', '0');
    ok(BattleUI.mode === 'card', '対象を選ぶ');
    await BattleUI.tapCell(1, 2);
    pressSheet('use');
    for (let i = 0; i < 300 && BattleUI.mode === 'busy'; i++) await sleep();
    ok(B.deck[0].used && u0.acted && B.units[3].hp < B.units[3].maxhp, '画面からカードを使えた');

    // ---- 画面を一通り開く ----
    App.init(); App.cardsPage('deck'); App.cardsPage('book'); App.shop('card'); App.settings();
    App.prep({ stage: STAGES[0], enemies: STAGES[0].enemies, mode: 'story', index: 0, back: App.storyList });

    // ---- CPU対戦：カードあり／なしで比べる ----
    const party = ['kabuto', 'kuwagata', 'chou', 'hachi', 'tentou'].map((c, i) => ({ id: i + 1, cls: c, lv: 13 }));
    for (const withCards of [false, true]) {
      let w = 0, turns = 0;
      autoPlay.cardsUsed = 0;
      for (let i = 0; i < 5; i++) {
        const r = await autoPlay(STAGES[8], party, STAGES[8].enemies, withCards ? { deck: Object.keys(STARTER_CARDS).flatMap(id => Array(STARTER_CARDS[id]).fill(id)), noChests: true } : { noChests: true });
        if (r.result === 'win') { w++; turns += r.turns; }
      }
      print(`  S9（味方Lv13）カード${withCards ? 'あり' : 'なし'}: 勝率 ${w}/5 平均${w ? (turns / w).toFixed(1) : '-'}ターン${withCards ? ' 使用' + autoPlay.cardsUsed + '枚' : ''}`);
    }
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
