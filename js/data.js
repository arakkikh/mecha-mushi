'use strict';
// ===== ゲームデータ（地形・相性・兵種・武器・パーツ・ステージ） =====

// 地形：移動コスト（移動タイプ別）・防御補正・回避補正
const TERRAIN = {
  G: { name: '草地', cost: { ground: 1, light: 1, fly: 1 }, def: 0, avo: 0 },
  F: { name: '森',   cost: { ground: 2, light: 1, fly: 1 }, def: 1, avo: 20 },
  R: { name: '岩場', cost: { ground: 3, light: 2, fly: 1 }, def: 3, avo: 10 },
  W: { name: '水',   cost: { ground: 99, light: 99, fly: 1 }, def: 0, avo: 0 },
};
const MOVE_NAMES = { ground: '陸', light: '軽量', fly: '飛行' };

// 相性（じゃんけん）：牙 → 甲 → 翅 → 牙
const TYPES = {
  KOU:  { name: '甲', strong: 'HANE', color: '#e0a030' },
  KIBA: { name: '牙', strong: 'KOU',  color: '#e05050' },
  HANE: { name: '翅', strong: 'KIBA', color: '#40b0e0' },
};

// 兵種（昆虫ロボ）。enemyOnly は敵専用
const CLASSES = {
  kabuto: {
    name: 'カブト型', type: 'KOU', move: 'ground', role: '硬い近接',
    base: { hp: 30, atk: 8, def: 8, mov: 4 }, grow: { hp: 0.9, atk: 0.4, def: 0.6 },
    hit: 0, avo: 0, cats: ['melee'], weapon: 'iron_horn',
  },
  kuwagata: {
    name: 'クワガタ型', type: 'KIBA', move: 'ground', role: '高火力近接',
    base: { hp: 26, atk: 11, def: 5, mov: 4 }, grow: { hp: 0.8, atk: 0.65, def: 0.35 },
    hit: 0, avo: 5, cats: ['melee'], weapon: 'scissor_arm',
  },
  chou: {
    name: 'チョウ型', type: 'HANE', move: 'fly', role: '遠距離・飛行',
    base: { hp: 20, atk: 8, def: 3, mov: 5 }, grow: { hp: 0.6, atk: 0.5, def: 0.25 },
    hit: 0, avo: 10, cats: ['ranged'], weapon: 'rinpun_shot',
  },
  hachi: {
    name: 'ハチ型', type: 'HANE', move: 'light', role: '素早い・高回避',
    base: { hp: 22, atk: 9, def: 4, mov: 6 }, grow: { hp: 0.65, atk: 0.5, def: 0.3 },
    hit: 10, avo: 20, cats: ['melee'], weapon: 'needle',
  },
  tentou: {
    name: 'テントウ型', type: 'KOU', move: 'ground', role: '回復役',
    base: { hp: 26, atk: 5, def: 7, mov: 4 }, grow: { hp: 0.8, atk: 0.3, def: 0.5 },
    hit: 0, avo: 5, cats: ['support'], weapon: 'care_spray',
  },
  // --- 敵専用 ---
  ari: {
    name: 'アリ型', type: 'KIBA', move: 'ground', role: '量産型', enemyOnly: true,
    base: { hp: 18, atk: 7, def: 4, mov: 4 }, grow: { hp: 0.7, atk: 0.45, def: 0.35 },
    hit: 0, avo: 0, cats: ['melee'], weapon: 'ant_jaw',
  },
  kamakiri: {
    name: 'カマキリ型', type: 'KIBA', move: 'ground', role: '指揮官', enemyOnly: true,
    base: { hp: 34, atk: 11, def: 6, mov: 4 }, grow: { hp: 1.0, atk: 0.6, def: 0.4 },
    hit: 5, avo: 10, cats: ['melee'], weapon: 'mantis_scythe',
  },
  ga: {
    name: 'ガ型', type: 'HANE', move: 'fly', role: '遠距離・飛行', enemyOnly: true,
    base: { hp: 20, atk: 7, def: 3, mov: 5 }, grow: { hp: 0.6, atk: 0.45, def: 0.25 },
    hit: 0, avo: 5, cats: ['ranged'], weapon: 'dark_powder',
  },
};

// 武器：pow=威力, hit=命中, rmin/rmax=射程, heal=回復量, price=0 は初期装備（非売品）
const WEAPONS = {
  // 近接
  iron_horn:    { name: 'アイアンホーン',   cat: 'melee', pow: 4,  hit: 90,  rmin: 1, rmax: 1, price: 0,    desc: '標準的な角型ブレード' },
  scissor_arm:  { name: 'シザーアーム',     cat: 'melee', pow: 6,  hit: 80,  rmin: 1, rmax: 1, price: 0,    desc: '挟み込む大あご' },
  needle:       { name: 'ニードル',         cat: 'melee', pow: 3,  hit: 95,  rmin: 1, rmax: 1, price: 0,    desc: '細く鋭い針' },
  drill_horn:   { name: 'ドリルホーン',     cat: 'melee', pow: 7,  hit: 85,  rmin: 1, rmax: 1, price: 600,  desc: '回転して装甲をえぐる' },
  stun_needle:  { name: 'スタンニードル',   cat: 'melee', pow: 5,  hit: 100, rmin: 1, rmax: 1, price: 800,  desc: '絶対に外さない電撃針' },
  boomerang:    { name: 'ブーメランブレード', cat: 'melee', pow: 5, hit: 85,  rmin: 1, rmax: 2, price: 900,  desc: '投げても戻る刃。射程1-2' },
  giga_scissor: { name: 'ギガシザー',       cat: 'melee', pow: 10, hit: 75,  rmin: 1, rmax: 1, price: 1100, desc: '超大型の大あご。当たれば強烈' },
  thunder_horn: { name: 'サンダーホーン',   cat: 'melee', pow: 12, hit: 85,  rmin: 1, rmax: 1, price: 1800, desc: '雷をまとった伝説の角' },
  // 遠距離
  rinpun_shot:  { name: 'リンプンショット', cat: 'ranged', pow: 4,  hit: 90, rmin: 1, rmax: 2, price: 0,    desc: '鱗粉弾を飛ばす' },
  snipe_powder: { name: 'スナイプパウダー', cat: 'ranged', pow: 5,  hit: 90, rmin: 2, rmax: 3, price: 800,  desc: '遠くを狙える。近くは撃てない' },
  blast_spore:  { name: 'ブラストスポア',   cat: 'ranged', pow: 8,  hit: 80, rmin: 1, rmax: 2, price: 1400, desc: '炸裂する胞子弾' },
  meteor_scale: { name: 'メテオスケイル',   cat: 'ranged', pow: 11, hit: 80, rmin: 2, rmax: 3, price: 2000, desc: '鱗を流星のように降らせる' },
  // 支援
  care_spray:   { name: 'ケアスプレー',     cat: 'support', pow: 1, hit: 90, rmin: 1, rmax: 1, heal: 10, price: 0,    desc: '味方を10回復' },
  medi_mist:    { name: 'メディミスト',     cat: 'support', pow: 2, hit: 90, rmin: 1, rmax: 2, heal: 14, price: 900,  desc: '射程2・味方を14回復' },
  royal_jelly:  { name: 'ロイヤルゼリー砲', cat: 'support', pow: 4, hit: 90, rmin: 1, rmax: 2, heal: 20, price: 1800, desc: '射程2・味方を20回復' },
  // 敵専用
  ant_jaw:       { name: 'アリアゴ',     cat: 'melee',  pow: 4, hit: 90, rmin: 1, rmax: 1, price: 0, enemyOnly: true, desc: '' },
  mantis_scythe: { name: 'デスサイズ',   cat: 'melee',  pow: 7, hit: 85, rmin: 1, rmax: 1, price: 0, enemyOnly: true, desc: '' },
  dark_powder:   { name: 'ダークパウダー', cat: 'ranged', pow: 4, hit: 85, rmin: 1, rmax: 2, price: 0, enemyOnly: true, desc: '' },
};
const CAT_NAMES = { melee: '近接', ranged: '遠距離', support: '支援' };

// 強化パーツ：mod の値が能力値に加算される
const PARTS = {
  armor_plate: { name: 'アーマープレート', mod: { def: 2 },          price: 400,  desc: '防御+2' },
  heavy_armor: { name: 'ヘビーアーマー',   mod: { def: 5, mov: -1 }, price: 900,  desc: '防御+5 / 移動-1' },
  power_motor: { name: 'パワーモーター',   mod: { atk: 2 },          price: 500,  desc: '攻撃+2' },
  overdrive:   { name: 'オーバードライブ', mod: { atk: 5, def: -2 }, price: 1000, desc: '攻撃+5 / 防御-2' },
  energy_cell: { name: 'エナジーセル',     mod: { maxhp: 6 },        price: 400,  desc: 'HP+6' },
  big_battery: { name: 'ビッグバッテリー', mod: { maxhp: 12 },       price: 1000, desc: 'HP+12' },
  turbo_leg:   { name: 'ターボレッグ',     mod: { mov: 1 },          price: 1200, desc: '移動+1' },
  lockon:      { name: 'ロックオン照準',   mod: { hit: 15 },         price: 600,  desc: '命中+15' },
  stealth:     { name: 'ステルス膜',       mod: { avo: 15 },         price: 700,  desc: '回避+15' },
  repair_nano: { name: 'リペアナノ',       mod: { regen: 4 },        price: 900,  desc: '毎ターンHP4回復' },
  long_barrel: { name: 'ロングバレル',     mod: { rmax: 1 },         price: 1000, desc: '射程+1（射程2以上の武器のみ）' },
};

// 味方の初期メンバーと加入タイミング（ストーリーのクリア数）
const RECRUITS = [
  { cls: 'kabuto',   name: 'ツノマル', join: 0 },
  { cls: 'kuwagata', name: 'キバオ',   join: 0 },
  { cls: 'chou',     name: 'ヒラリ',   join: 0 },
  { cls: 'hachi',    name: 'ビービ',   join: 2 },
  { cls: 'tentou',   name: 'テンコ',   join: 3 },
];

// ステージ（マップ 8×10）。G=草地 F=森 R=岩場 W=水
// start=味方の出撃位置, enemies=敵配置（ai: aggressive=突撃 / hold=待ち伏せ / boss=動かない / thief=宝箱どろぼう）
// chests=宝箱（get: { money: 数 } / { item: 武器・パーツID }）。取得記録は配列の順番で保存するので、追加は末尾へ

const STAGES = [
  {
    id: 1, name: 'はじまりの草原',
    story: 'ガラクタ軍団のロボが草原にあらわれた！\nツノマル「よし、オレたちで追いはらうぞ！」',
    rows: ['GGFGGRGG', 'GFGGGGFG', 'GGGWWGGG', 'GRGWWGFG', 'GGGGGGGG', 'FGGGRGGG', 'GGFGGGWW', 'GGGGFGWG', 'GRGGGGGG', 'GGGGGFGG'],
    start: [[2, 9], [4, 9], [3, 8], [5, 8], [1, 8]],
    enemies: [
      { cls: 'ari', lv: 1, x: 2, y: 1 }, { cls: 'ari', lv: 1, x: 5, y: 1 }, { cls: 'kuwagata', lv: 1, x: 4, y: 0 },
    ],
    reward: { money: 300, items: ['energy_cell'] },
    chests: [{ x: 7, y: 7, get: { money: 150 } }, { x: 0, y: 0, get: { item: 'armor_plate' } }],
  },
  {
    id: 2, name: '森のこみち',
    story: '森の奥へ逃げたガラクタ軍団を追え！\nヒラリ「森の中は回避が上がるよ。うまく使ってね」',
    rows: ['FFGGGFFG', 'FGGFGGFF', 'GGFFGGGF', 'GFGGGFGG', 'FFGRGGFF', 'GGGFFGGG', 'FGGGGFGF', 'GGFGGGGG', 'FGGGFGGF', 'GGGGGGFF'],
    start: [[2, 9], [4, 9], [3, 8], [5, 9], [1, 9]],
    enemies: [
      { cls: 'ari', lv: 2, x: 1, y: 1 }, { cls: 'ari', lv: 2, x: 6, y: 2, ai: 'thief' }, { cls: 'ga', lv: 2, x: 3, y: 0 }, { cls: 'kabuto', lv: 2, x: 5, y: 0 },
    ],
    reward: { money: 400, items: ['power_motor'] },
    chests: [{ x: 0, y: 4, get: { money: 200 } }, { x: 7, y: 1, get: { item: 'energy_cell' } }, { x: 6, y: 0, get: { item: 'lockon' } }],
  },
  {
    id: 3, name: '川辺の戦い',
    story: '川の向こうに敵の見張りがいる。\nビービ「わたしも手伝う！ 橋は1本だけ、気をつけて！」',
    rows: ['GGFGGGRG', 'GRGGFGGG', 'GGGGGGFG', 'WWWGWWWW', 'WWWGWWWW', 'GGFGGGGG', 'GGGGRGFG', 'FGGGGGGG', 'GGRGGFGG', 'GGGGGGGG'],
    start: [[2, 9], [4, 9], [3, 8], [5, 8], [1, 9]],
    enemies: [
      { cls: 'ga', lv: 4, x: 1, y: 0 }, { cls: 'ga', lv: 4, x: 6, y: 0, ai: 'thief' }, { cls: 'ari', lv: 4, x: 2, y: 1 },
      { cls: 'ari', lv: 4, x: 5, y: 1 }, { cls: 'kuwagata', lv: 4, x: 3, y: 2, ai: 'hold' },
    ],
    reward: { money: 500, items: ['armor_plate'] },
    chests: [{ x: 7, y: 4, get: { money: 300 } }, { x: 6, y: 2, get: { item: 'power_motor' } }],
  },
  {
    id: 4, name: '岩山の砦',
    story: '岩山に敵の砦を発見！\nテンコ「ケガをしたら私が直します。岩場は守りが固くなるよ」',
    rows: ['RRGGGGRR', 'RGGFFGGR', 'GGRGGRGG', 'GRRGGRRG', 'GGGGGGGG', 'GFGRRGFG', 'GGGGGGGG', 'FGRGGRGF', 'GGGGGGGG', 'GGGFGGGG'],
    start: [[2, 9], [4, 9], [3, 8], [5, 9], [1, 9]],
    enemies: [
      { cls: 'kabuto', lv: 5, x: 1, y: 1, ai: 'hold' }, { cls: 'kabuto', lv: 5, x: 6, y: 1, ai: 'hold' }, { cls: 'chou', lv: 5, x: 3, y: 1 },
      { cls: 'ari', lv: 5, x: 2, y: 0 }, { cls: 'tentou', lv: 5, x: 4, y: 0 },
    ],
    reward: { money: 600, items: ['lockon'] },
    chests: [{ x: 0, y: 0, get: { item: 'power_motor' } }, { x: 7, y: 0, get: { money: 300 } }, { x: 7, y: 7, get: { money: 150 } }],
  },
  {
    id: 5, name: 'ぬかるみの湿地',
    story: 'ガラクタ軍団の隊長「カマキリ型」が現れた！\nキバオ「あいつの鎌は強烈だ。囲んで一気にたたこう！」',
    rows: ['GWWGGWWG', 'GWGGGGWG', 'GGGFFGGG', 'WGGGGGGW', 'WWGFGGWW', 'GGGGGFGG', 'GFGWWGGG', 'GGGWWGFG', 'WGGGGGGW', 'GGGGGGGG'],
    start: [[2, 9], [4, 9], [3, 9], [5, 9], [1, 8]],
    enemies: [
      { cls: 'kamakiri', lv: 8, x: 3, y: 1, ai: 'boss', boss: true, name: 'カマキリ隊長' },
      { cls: 'ga', lv: 7, x: 1, y: 0 }, { cls: 'ga', lv: 7, x: 6, y: 0 }, { cls: 'ari', lv: 7, x: 2, y: 2 }, { cls: 'ari', lv: 7, x: 5, y: 2 },
    ],
    reward: { money: 800, items: ['drill_horn'] },
    chests: [{ x: 0, y: 0, get: { item: 'boomerang' } }, { x: 1, y: 1, get: { money: 400 } }, { x: 6, y: 7, get: { item: 'energy_cell' } }],
  },
  {
    id: 6, name: '夜の森',
    story: '真っ暗な森で、すばやい敵が待ちぶせている。\nビービ「ハチ型の敵…！ 相性を考えて戦って！」',
    rows: ['FFFGGFFF', 'FGFFGFGF', 'GGGFFGGG', 'FFGGGGFF', 'GFGFFGFG', 'GGGGGGGG', 'FGFGGFGF', 'FFGGGGFF', 'GGGFFGGG', 'GGGGGGGG'],
    start: [[2, 9], [4, 9], [3, 9], [5, 9], [1, 9]],
    enemies: [
      { cls: 'hachi', lv: 9, x: 1, y: 1 }, { cls: 'hachi', lv: 9, x: 6, y: 1, ai: 'thief' }, { cls: 'ga', lv: 9, x: 3, y: 0 },
      { cls: 'ga', lv: 9, x: 4, y: 0 }, { cls: 'tentou', lv: 9, x: 4, y: 1 }, { cls: 'kuwagata', lv: 9, x: 2, y: 2 },
    ],
    reward: { money: 900, items: ['stealth'] },
    chests: [{ x: 0, y: 0, get: { item: 'repair_nano' } }, { x: 7, y: 0, get: { money: 400 } }, { x: 0, y: 7, get: { item: 'armor_plate' } }],
  },
  {
    id: 7, name: '大河の渡し',
    story: '大きな川をはさんで敵が陣取っている。\nヒラリ「浅瀬は2か所だけ。飛べる私が先に行くね！」',
    rows: ['GGFGGFGG', 'GRGGGGRG', 'GGGGFGGG', 'WGWWWWGW', 'WGWWWWGW', 'WGWWWWGW', 'GGGGGGGG', 'GFGRGGFG', 'GGGGGGGG', 'GGFGGGGG'],
    start: [[2, 9], [4, 9], [3, 8], [5, 9], [1, 9]],
    enemies: [
      { cls: 'chou', lv: 11, x: 2, y: 2 }, { cls: 'chou', lv: 11, x: 5, y: 2 }, { cls: 'ga', lv: 11, x: 3, y: 1, ai: 'thief' },
      { cls: 'ga', lv: 11, x: 4, y: 1 }, { cls: 'kabuto', lv: 11, x: 1, y: 2, ai: 'hold' }, { cls: 'kabuto', lv: 11, x: 6, y: 2, ai: 'hold' },
    ],
    reward: { money: 1000, items: ['snipe_powder'] },
    chests: [{ x: 3, y: 4, get: { item: 'blast_spore' } }, { x: 0, y: 0, get: { money: 500 } }, { x: 7, y: 0, get: { item: 'heavy_armor' } }],
  },
  {
    id: 8, name: '鉄の谷',
    story: '岩に囲まれた谷に、重装備の部隊が待っている。\nツノマル「正面からぶつかるしかない…！」',
    rows: ['RRGGGGRR', 'RGGGGGGR', 'RGFGGFGR', 'RRGGGGRR', 'RGGRRGGR', 'RGGGGGGR', 'RRGFFGRR', 'RGGGGGGR', 'RGGGGGGR', 'RRGGGGRR'],
    start: [[2, 9], [3, 9], [4, 9], [5, 9], [3, 8]],
    enemies: [
      { cls: 'kabuto', lv: 10, x: 2, y: 1 }, { cls: 'kabuto', lv: 10, x: 5, y: 1 }, { cls: 'kuwagata', lv: 10, x: 3, y: 2 },
      { cls: 'kuwagata', lv: 10, x: 4, y: 2 }, { cls: 'tentou', lv: 10, x: 3, y: 0 }, { cls: 'kamakiri', lv: 11, x: 4, y: 0, ai: 'hold', boss: true, name: 'カマキリ副長' },
    ],
    reward: { money: 1200, items: ['turbo_leg'] },
    chests: [{ x: 0, y: 0, get: { item: 'overdrive' } }, { x: 7, y: 9, get: { money: 300 } }, { x: 7, y: 0, get: { item: 'big_battery' } }],
  },
  {
    id: 9, name: '嵐の高原',
    story: '要塞の手前、ガラクタ軍団の精鋭が総出で迎え撃つ！\nテンコ「みんな、あと少しだよ！」',
    rows: ['GGRGGRGG', 'GFGGGGFG', 'GGGWGGGG', 'RGGWGRGG', 'GGGGGGGG', 'GGRGGGGR', 'GFGGWGFG', 'GGGGWGGG', 'GRGGGGRG', 'GGGGGGGG'],
    start: [[2, 9], [4, 9], [3, 9], [5, 9], [1, 9]],
    enemies: [
      { cls: 'kuwagata', lv: 14, x: 1, y: 0 }, { cls: 'hachi', lv: 14, x: 3, y: 0, ai: 'thief' }, { cls: 'ga', lv: 14, x: 4, y: 0 }, { cls: 'chou', lv: 14, x: 6, y: 0 },
      { cls: 'kabuto', lv: 14, x: 0, y: 1 }, { cls: 'tentou', lv: 14, x: 4, y: 1 }, { cls: 'ari', lv: 15, x: 7, y: 1 },
    ],
    reward: { money: 1400, items: ['medi_mist'] },
    chests: [{ x: 3, y: 2, get: { money: 600 } }, { x: 7, y: 5, get: { item: 'stun_needle' } }, { x: 2, y: 0, get: { item: 'giga_scissor' } }],
  },
  {
    id: 10, name: 'ガラクタ要塞',
    story: 'ついに要塞の最深部。親玉「キング・マンティス」が待つ！\nキバオ「これで最後だ。いくぞ、みんな！」',
    rows: ['RRGGGGRR', 'RGGGGGGR', 'GGRFFRGG', 'GGGGGGGG', 'WWGRRGWW', 'GGGGGGGG', 'GFGGGGFG', 'GGGRRGGG', 'GGGGGGGG', 'GGGGGGGG'],
    start: [[2, 9], [4, 9], [3, 9], [5, 9], [3, 8]],
    enemies: [
      { cls: 'kamakiri', lv: 18, x: 3, y: 1, ai: 'boss', boss: true, name: 'キング・マンティス', parts: ['big_battery'] },
      { cls: 'kabuto', lv: 16, x: 2, y: 1, ai: 'hold' }, { cls: 'tentou', lv: 16, x: 4, y: 0 }, { cls: 'ga', lv: 16, x: 1, y: 2 },
      { cls: 'ga', lv: 16, x: 6, y: 2 }, { cls: 'kuwagata', lv: 16, x: 3, y: 3 }, { cls: 'hachi', lv: 16, x: 5, y: 3 },
    ],
    reward: { money: 2000, items: ['thunder_horn'] },
    chests: [{ x: 0, y: 4, get: { item: 'meteor_scale' } }, { x: 7, y: 0, get: { money: 1000 } }, { x: 0, y: 0, get: { item: 'turbo_leg' } }],
  },
];
