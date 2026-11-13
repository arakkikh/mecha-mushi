// カード合成のテスト
(async () => {
  try {
    // ---- データ ----
    const rids = Object.keys(RECIPES);
    ok(rids.length >= 25, 'レシピ25種以上 ' + rids.length);
    const sigs = new Set();
    for (const rid of rids) {
      const r = RECIPES[rid];
      ok(CARDS[r.out], 'できるカードがある ' + rid);
      const n = Object.values(r.in).reduce((a, b) => a + b, 0);
      ok(n >= 2 && n <= SYNTH_SLOTS, '材料2〜4枚 ' + rid);
      for (const k in r.in) { ok(CARDS[k], '材料カード ' + rid + ' ' + k); ok(k !== r.out, '材料と完成品が同じ ' + rid); }
      const sig = Object.keys(r.in).sort().map(k => k + r.in[k]).join(',');
      ok(!sigs.has(sig), '同じ材料のレシピが重複 ' + rid);
      sigs.add(sig);
    }
    for (const id in CARDS) if (CARDS[id].only === 'synth') ok(rids.some(r => RECIPES[r].out === id), '合成限定カードにレシピがある ' + id);
    ok(rids.filter(r => RECIPES[r].known).length >= 3, '最初から知っているレシピ');
    // 合成限定の★4まで、最初のカードから辿り着けるか（材料の材料…をたどる）
    const reach = new Set(Object.keys(CARDS).filter(id => !CARDS[id].only));
    let grew = true;
    while (grew) { grew = false; for (const r of rids) if (!reach.has(RECIPES[r].out) && Object.keys(RECIPES[r].in).every(k => reach.has(k))) { reach.add(RECIPES[r].out); grew = true; } }
    ok(Object.keys(CARDS).every(id => reach.has(id)), '全カードが入手可能');

    // ---- 合成 ----
    Save.reset();
    const d = Save.data;
    ok(d.recipes.r_inazuma && !d.recipes.r_hinoko, '最初のレシピ');
    // 知っているレシピ
    let r = Save.synth(['hari_dan', 'hari_dan', 'hari_dan']);
    ok(r.ok && r.out === 'inazuma_hari' && !r.isNew && Save.cardCount('hari_dan') === 0 && Save.cardCount('inazuma_hari') === 1, '既知レシピで合成');
    ok(Save.inDeck('hari_dan') === 0 && d.deck.length === 17, '材料はデッキから外れる');
    ok(d.seen.inazuma_hari, '図鑑に載る');
    // 持っていない材料
    r = Save.synth(['hari_dan', 'hari_dan', 'hari_dan']);
    ok(!r.ok && r.lack, '材料が足りないと失敗');
    // 合わない組み合わせ：カードは減らない・ヒント
    const before = JSON.stringify(d.cards);
    r = Save.synth(['mitsu', 'warp_pod']);
    ok(!r.ok && JSON.stringify(d.cards) === before, '失敗してもカードは減らない');
    ok(Save.nearRecipe(['koishi', 'koishi']) && !Save.nearRecipe(['mitsu', 'warp_pod']), 'あと少しのヒント');
    // 試して発見
    Save.addCard('koishi', 1);
    r = Save.synth(['koishi', 'koishi', 'koishi']);
    ok(r.ok && r.isNew && d.recipes.r_hinoko && Save.cardCount('hinoko') === 1, '試して新レシピ発見');
    // 宝箱でレシピを見つける
    Save.takeChest(STAGES[1], 4, { recipe: 'r_suna' });
    ok(d.recipes.r_suna && Save.getLabel({ recipe: 'r_suna' }).includes('スナアラシ'), '宝箱でレシピ');
    ok(STAGES.some(st => (st.chests || []).some(c => c.get.recipe)), 'レシピ入りの宝箱がある');
    // ★4を作る（材料をそろえて）
    Save.addCard('tsuno_hou', 2); Save.addCard('inazuma_hari', 2);
    r = Save.synth(Save.recipeList('r_raimei'));
    ok(r.ok && r.out === 'raimei' && CARDS.raimei.rank === 4, '★4を合成');
    Save.load();
    ok(Save.data.recipes.r_raimei && Save.cardCount('raimei') === 1, 'レシピと合成結果がセーブされる');
    // 旧セーブ（レシピ項目なし）
    const old = JSON.parse(localStorage.getItem('mechamushi_save_v1'));
    delete old.recipes;
    localStorage.setItem('mechamushi_save_v1', JSON.stringify(old));
    Save.load();
    ok(Save.data.recipes.r_inazuma && Save.cardCount('raimei') === 1, '旧セーブにレシピ項目が追加される');

    // ---- 画面 ----
    App.init();
    App.cardsPage('synth');
    App.pot = ['mitsu', 'mitsu', 'mitsu'];
    Save.addCard('mitsu', 3);
    const n0 = Save.cardCount('hana_mitsu');
    App.doSynth();
    ok(Save.cardCount('hana_mitsu') === n0 + 1, '画面から合成');
    pressModal('ok');
    print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
  } catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
})();
