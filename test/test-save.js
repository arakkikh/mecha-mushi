// セーブ・装備・ショップのテスト
try {
  Save.reset();
  let d = Save.data;
  ok(d.roster.length === 3 && d.money === 500, '初期状態 ' + d.roster.length);
  const kab = d.roster.find(u => u.cls === 'kabuto');
  const s0 = Engine.calcStats(kab);
  ok(!Save.buy('thunder_horn'), 'お金が足りないと買えない');
  ok(Save.buy('power_motor') && d.money === 0, 'パーツ購入');
  ok(Save.equipPart(kab, 0, 'power_motor') && Save.count('power_motor') === 0, 'パーツ装備');
  ok(Engine.calcStats(kab).atk === s0.atk + 2, '攻撃+2');
  d.money = 5000;
  ok(Save.buy('drill_horn') && Save.equipWeapon(kab, 'drill_horn'), '武器購入・装備');
  ok(Engine.calcStats(kab).atk === s0.atk + 2 + 3, 'ドリルで攻撃+3');
  ok(!Save.canEquip(kab, 'rinpun_shot'), 'カブトは遠距離武器を持てない');
  ok(Save.equipWeapon(kab, 'iron_horn') && Save.count('drill_horn') === 1, '武器を戻すと在庫に戻る');
  const m = d.money;
  ok(Save.sell('drill_horn') && d.money === m + 300, '半額で売却');
  ok(Save.buy('long_barrel'), 'ロングバレル');
  Save.equipPart(kab, 1, 'long_barrel');
  ok(Engine.calcStats(kab).rmax === 1, '近接武器には射程延長が効かない');
  const chou = d.roster.find(u => u.cls === 'chou');
  Save.equipPart(kab, 1, null);
  Save.equipPart(chou, 0, 'long_barrel');
  ok(Engine.calcStats(chou).rmax === 3, 'チョウは射程3に');
  // 再読み込み
  Save.load();
  d = Save.data;
  ok(d.roster.find(u => u.cls === 'chou').parts[0] === 'long_barrel', 'セーブから復元');
  // 仲間の加入
  d.cleared = 3;
  const added = Save.syncRecruits();
  ok(added.length === 2 && d.roster.length === 5, '仲間加入 ' + added.length);
  // 戦闘結果の反映
  const b = Engine.createBattle(STAGES[0], d.roster.slice(0, 5));
  b.units[0].lv = 4; b.units[0].exp = 33; b.units[0].gain = { hp: 3, atk: 1, def: 2 };
  Save.applyBattle(b);
  ok(d.roster[0].lv === 4 && d.roster[0].gain.hp === 3, 'レベル反映');
  // 壊れたデータ
  localStorage.setItem('mechamushi_save_v1', '{broken');
  Save.load();
  ok(Save.data.roster.length === 3, '壊れたセーブは新規作成');
  // 全武器・パーツの能力計算でNaNが出ない
  for (const c of Object.keys(CLASSES)) for (const w of Object.keys(WEAPONS)) for (const p of Object.keys(PARTS)) {
    const s = Engine.calcStats({ cls: c, lv: 5, weapon: w, parts: [p, null] });
    for (const k in s) if (typeof s[k] === 'number' && isNaN(s[k])) { ok(false, `NaN ${c} ${w} ${p} ${k}`); }
  }
  ok(Object.keys(WEAPONS).filter(id => WEAPONS[id].price > 0).length >= 10, '武器10種以上');
  ok(Object.keys(PARTS).length >= 10, 'パーツ10種以上');
  // 画面を一通り開いてエラーが出ないか
  App.init(); App.storyList(); App.freeBattle(); App.unitsPage(); App.shop('weapon'); App.shop('part'); App.shop('sell');
  App.unitDetail(Save.data.roster[0], App.unitsPage);
  App.stageIntro(0); pressModal('go');
  print(fails === 0 ? 'ALL OK' : `FAILED: ${fails}`);
} catch (e) { print('ERROR: ' + e + '\n' + e.stack); }
