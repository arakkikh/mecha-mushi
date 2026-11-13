'use strict';
// ===== ゲームデータ（地形・相性・兵種・武器・パーツ・ステージ） =====

// 地形：移動コスト（移動タイプ別）・防御補正・回避補正
// 移動タイプ：ground=陸 / light=軽量（森が得意）/ fly=飛行（地形無視）/ climb=登はん（森・岩が得意）
//             hop=跳躍（水以外どこでも1）/ swim=水中（水が得意）
const TERRAIN = {
  G: { name: '草地', cost: { ground: 1, light: 1, fly: 1, climb: 1, hop: 1, swim: 1 }, def: 0, avo: 0 },
  F: { name: '森',   cost: { ground: 2, light: 1, fly: 1, climb: 1, hop: 1, swim: 2 }, def: 1, avo: 20 },
  R: { name: '岩場', cost: { ground: 3, light: 2, fly: 1, climb: 1, hop: 1, swim: 3 }, def: 3, avo: 10 },
  W: { name: '水',   cost: { ground: 99, light: 99, fly: 1, climb: 99, hop: 99, swim: 1 }, def: 0, avo: 0, swimDef: 3 },
};
const MOVE_NAMES = { ground: '陸', light: '軽量', fly: '飛行', climb: '登はん', hop: '跳躍', swim: '水中' };
// 武器の特殊効果
const FX_NAMES = { poison: '毒', para: 'マヒ', double: '2回攻撃', pierce: '防御半減', web: '移動ダウン', drain: 'HP吸収', antiair: '対空' };

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
  ari: {
    name: 'アリ型', type: 'KIBA', move: 'ground', role: '量産型・よく育つ',
    base: { hp: 18, atk: 7, def: 4, mov: 4 }, grow: { hp: 0.8, atk: 0.5, def: 0.45 },
    hit: 0, avo: 0, cats: ['melee'], weapon: 'ant_jaw',
  },
  kamakiri: {
    name: 'カマキリ型', type: 'KIBA', move: 'ground', role: '鋭い鎌・高命中',
    base: { hp: 34, atk: 11, def: 6, mov: 4 }, grow: { hp: 1.0, atk: 0.6, def: 0.4 },
    hit: 5, avo: 10, cats: ['melee'], weapon: 'mantis_scythe',
  },
  ga: {
    name: 'ガ型', type: 'HANE', move: 'fly', role: '遠距離・飛行・マヒ粉',
    base: { hp: 20, atk: 7, def: 3, mov: 5 }, grow: { hp: 0.6, atk: 0.45, def: 0.25 },
    hit: 0, avo: 5, cats: ['ranged'], weapon: 'dark_powder',
  },
  tonbo: {
    name: 'トンボ型', type: 'HANE', move: 'fly', role: '超高速の飛行',
    base: { hp: 20, atk: 9, def: 3, mov: 7 }, grow: { hp: 0.6, atk: 0.5, def: 0.25 },
    hit: 5, avo: 15, cats: ['melee'], weapon: 'wing_blade',
  },
  kumo: {
    name: 'クモ型', type: 'KIBA', move: 'climb', role: '糸で足止め・岩森が得意',
    base: { hp: 22, atk: 8, def: 4, mov: 4 }, grow: { hp: 0.7, atk: 0.45, def: 0.35 },
    hit: 5, avo: 5, cats: ['ranged'], weapon: 'web_shot',
  },
  hotaru: {
    name: 'ホタル型', type: 'HANE', move: 'fly', role: '飛べる回復役・状態異常を治す',
    base: { hp: 20, atk: 5, def: 4, mov: 5 }, grow: { hp: 0.65, atk: 0.3, def: 0.35 },
    hit: 0, avo: 10, cats: ['support'], weapon: 'glow_mist',
  },
  batta: {
    name: 'バッタ型', type: 'KIBA', move: 'hop', role: 'ジャンプで地形を無視',
    base: { hp: 24, atk: 10, def: 4, mov: 5 }, grow: { hp: 0.75, atk: 0.55, def: 0.3 },
    hit: 0, avo: 10, cats: ['melee'], weapon: 'kick_leg',
  },
  dangomushi: {
    name: 'ダンゴムシ型', type: 'KOU', move: 'ground', role: '鉄壁の守り',
    base: { hp: 30, atk: 6, def: 11, mov: 3 }, grow: { hp: 1.0, atk: 0.3, def: 0.75 },
    hit: 0, avo: 0, cats: ['melee'], weapon: 'roll_tackle',
  },
  semi: {
    name: 'セミ型', type: 'HANE', move: 'fly', role: '音波で防御を無視',
    base: { hp: 22, atk: 8, def: 4, mov: 4 }, grow: { hp: 0.7, atk: 0.5, def: 0.3 },
    hit: 5, avo: 0, cats: ['ranged'], weapon: 'sonic_wave',
  },
  gengorou: {
    name: 'ゲンゴロウ型', type: 'KOU', move: 'swim', role: '水中が得意',
    base: { hp: 28, atk: 9, def: 7, mov: 4 }, grow: { hp: 0.85, atk: 0.5, def: 0.5 },
    hit: 0, avo: 5, cats: ['melee'], weapon: 'water_fang',
  },
  kamikiri: {
    name: 'カミキリ型', type: 'KIBA', move: 'ground', role: '長い触角の剣・射程1-2',
    base: { hp: 24, atk: 11, def: 5, mov: 4 }, grow: { hp: 0.75, atk: 0.6, def: 0.35 },
    hit: 0, avo: 5, cats: ['melee'], weapon: 'antenna_saber',
  },
  // --- 敵専用 ---
  sasori: {
    name: 'サソリ型', type: 'KIBA', move: 'ground', role: '毒の尾', enemyOnly: true,
    base: { hp: 36, atk: 12, def: 8, mov: 4 }, grow: { hp: 1.0, atk: 0.6, def: 0.5 },
    hit: 5, avo: 5, cats: ['melee'], weapon: 'sasori_tail',
  },
  mukade: {
    name: 'ムカデ型', type: 'KIBA', move: 'ground', role: '連続攻撃', enemyOnly: true,
    base: { hp: 28, atk: 9, def: 5, mov: 5 }, grow: { hp: 0.8, atk: 0.5, def: 0.35 },
    hit: 0, avo: 5, cats: ['melee'], weapon: 'mukade_fang',
  },
  junk_titan: {
    name: 'ガラクタ巨兵', type: 'KOU', move: 'ground', role: '巨大ロボ', enemyOnly: true,
    base: { hp: 44, atk: 12, def: 12, mov: 3 }, grow: { hp: 1.2, atk: 0.6, def: 0.7 },
    hit: 0, avo: 0, cats: ['melee'], weapon: 'junk_hammer',
  },
  emperor: {
    name: 'ガラクタ大王', type: 'KOU', move: 'ground', role: '軍団の王', enemyOnly: true,
    base: { hp: 60, atk: 16, def: 12, mov: 4 }, grow: { hp: 1.4, atk: 0.7, def: 0.6 },
    hit: 10, avo: 10, cats: ['melee'], weapon: 'emperor_lance',
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
  // 各ユニットの標準武器（price: 0）
  ant_jaw:       { name: 'アリアゴ',       cat: 'melee',  pow: 4, hit: 90, rmin: 1, rmax: 1, price: 0, desc: '小さくても丈夫なあご' },
  mantis_scythe: { name: 'デスサイズ',     cat: 'melee',  pow: 7, hit: 85, rmin: 1, rmax: 1, price: 0, desc: '鋭い鎌' },
  dark_powder:   { name: 'ダークパウダー', cat: 'ranged', pow: 4, hit: 85, rmin: 1, rmax: 2, price: 0, fx: 'para', desc: 'まれにマヒさせる粉' },
  wing_blade:    { name: 'ウイングブレード', cat: 'melee', pow: 4, hit: 95, rmin: 1, rmax: 1, price: 0, desc: '翅のふちの刃' },
  web_shot:      { name: 'ウェブショット', cat: 'ranged', pow: 3, hit: 90, rmin: 1, rmax: 2, price: 0, fx: 'web', desc: '当たると移動-2（1ターン）' },
  glow_mist:     { name: 'グローミスト',   cat: 'support', pow: 1, hit: 90, rmin: 1, rmax: 2, heal: 8, cleanse: true, price: 0, desc: '射程2・8回復＋状態異常を治す' },
  kick_leg:      { name: 'キックレッグ',   cat: 'melee', pow: 5, hit: 85, rmin: 1, rmax: 1, price: 0, desc: '強い後ろ足のキック' },
  roll_tackle:   { name: 'ローリングタックル', cat: 'melee', pow: 4, hit: 90, rmin: 1, rmax: 1, price: 0, desc: '丸まって体当たり' },
  sonic_wave:    { name: 'ソニックウェーブ', cat: 'ranged', pow: 3, hit: 90, rmin: 2, rmax: 3, price: 0, fx: 'pierce', desc: '防御を半分無視する音波。近くは撃てない' },
  water_fang:    { name: 'ウォーターファング', cat: 'melee', pow: 5, hit: 90, rmin: 1, rmax: 1, price: 0, desc: '水をまとったキバ' },
  antenna_saber: { name: 'アンテナセイバー', cat: 'melee', pow: 4, hit: 85, rmin: 1, rmax: 2, price: 0, desc: '長い触角の剣。射程1-2' },
  // 店・宝箱の武器（unlock: ストーリーをこの数クリアすると店に並ぶ / shop: false は店に出ない）
  sky_hook:      { name: 'スカイフック',   cat: 'melee', pow: 6,  hit: 85, rmin: 1, rmax: 1, price: 900,  fx: 'antiair', unlock: 4, desc: '飛行ユニットに1.5倍' },
  poison_fang:   { name: 'ポイズンファング', cat: 'melee', pow: 6, hit: 85, rmin: 1, rmax: 1, price: 1000, fx: 'poison', unlock: 6, desc: '当たると毒' },
  para_claw:     { name: 'パラライズクロー', cat: 'melee', pow: 5, hit: 85, rmin: 1, rmax: 1, price: 1300, fx: 'para', unlock: 10, desc: '30%でマヒ（ボス以外）' },
  twin_blade:    { name: 'ツインブレード', cat: 'melee', pow: 4,  hit: 85, rmin: 1, rmax: 1, price: 1500, fx: 'double', unlock: 12, desc: '2回攻撃する' },
  vampire_jaw:   { name: 'ヴァンパイアジョー', cat: 'melee', pow: 7, hit: 85, rmin: 1, rmax: 1, price: 1600, fx: 'drain', unlock: 14, desc: '与えたダメージの半分回復' },
  pierce_horn:   { name: 'ピアスホーン',   cat: 'melee', pow: 9,  hit: 85, rmin: 1, rmax: 1, price: 2200, fx: 'pierce', unlock: 16, desc: '防御を半分無視する' },
  titan_horn:    { name: 'タイタンホーン', cat: 'melee', pow: 16, hit: 80, rmin: 1, rmax: 1, price: 3500, unlock: 22, desc: '巨大な鋼鉄の角' },
  king_scissor:  { name: 'キングシザー',   cat: 'melee', pow: 19, hit: 75, rmin: 1, rmax: 1, price: 0, shop: false, desc: '王者の大あご（宝箱でしか見つからない）' },
  anti_air_shot: { name: 'アンチエアショット', cat: 'ranged', pow: 7, hit: 85, rmin: 1, rmax: 2, price: 1100, fx: 'antiair', unlock: 8, desc: '飛行ユニットに1.5倍' },
  venom_shot:    { name: 'ベノムショット', cat: 'ranged', pow: 6,  hit: 85, rmin: 1, rmax: 2, price: 1200, fx: 'poison', unlock: 10, desc: '当たると毒' },
  para_shot:     { name: 'パラライズショット', cat: 'ranged', pow: 5, hit: 85, rmin: 2, rmax: 3, price: 1500, fx: 'para', unlock: 13, desc: '30%でマヒ。近くは撃てない' },
  rail_needle:   { name: 'レールニードル', cat: 'ranged', pow: 9,  hit: 85, rmin: 2, rmax: 3, price: 2500, fx: 'pierce', unlock: 17, desc: '防御を半分無視。近くは撃てない' },
  galaxy_spore:  { name: 'ギャラクシースポア', cat: 'ranged', pow: 15, hit: 80, rmin: 2, rmax: 4, price: 4200, unlock: 24, desc: '射程2-4の超長距離砲' },
  star_cannon:   { name: 'スターキャノン', cat: 'ranged', pow: 17, hit: 85, rmin: 1, rmax: 3, price: 0, shop: false, desc: '星の力を撃つ（宝箱でしか見つからない）' },
  big_mist:      { name: 'ビッグミスト',   cat: 'support', pow: 3, hit: 90, rmin: 1, rmax: 2, heal: 26, price: 2800, unlock: 18, desc: '射程2・味方を26回復' },
  phoenix_dew:   { name: 'フェニックスの露', cat: 'support', pow: 5, hit: 90, rmin: 1, rmax: 3, heal: 34, cleanse: true, price: 0, shop: false, desc: '射程3・34回復＋状態異常を治す（宝箱）' },
  // 敵専用
  sasori_tail:   { name: 'サソリテイル',   cat: 'melee', pow: 7,  hit: 85, rmin: 1, rmax: 1, price: 0, enemyOnly: true, fx: 'poison', desc: '' },
  mukade_fang:   { name: 'ムカデファング', cat: 'melee', pow: 4,  hit: 90, rmin: 1, rmax: 1, price: 0, enemyOnly: true, fx: 'double', desc: '' },
  junk_hammer:   { name: 'ガラクタハンマー', cat: 'melee', pow: 8, hit: 80, rmin: 1, rmax: 2, price: 0, enemyOnly: true, desc: '' },
  emperor_lance: { name: 'エンペラーランス', cat: 'melee', pow: 10, hit: 90, rmin: 1, rmax: 2, price: 0, enemyOnly: true, fx: 'pierce', desc: '' },
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
  balancer:    { name: 'バランサー',       mod: { atk: 2, def: 2 },  price: 1200, unlock: 5,  desc: '攻撃+2 / 防御+2' },
  poison_guard:{ name: 'どくけしフィルター', mod: { nopoison: 1 },   price: 600,  unlock: 6,  desc: '毒にならない' },
  para_guard:  { name: 'たいでんコート',   mod: { nopara: 1 },       price: 600,  unlock: 6,  desc: 'マヒにならない' },
  exp_chip:    { name: 'がくしゅうチップ', mod: { expRate: 50 },     price: 1000, unlock: 4,  desc: 'もらえる経験値+50%' },
  lucky_coin:  { name: 'ラッキーコイン',   mod: { gold: 15 },        price: 1200, unlock: 7,  desc: '勝利時のお金+15%（出撃中の合計）' },
  card_amp:    { name: 'カードアンプ',     mod: { cardPow: 25 },     price: 1500, unlock: 8,  desc: '攻撃カードの威力+25%' },
  heal_amp:    { name: 'ヒールアンプ',     mod: { heal: 6 },         price: 1200, unlock: 9,  desc: '回復量+6（回復武器のみ）' },
  hard_plate:  { name: 'ハードプレート',   mod: { def: 4 },          price: 1300, unlock: 10, desc: '防御+4' },
  hyper_motor: { name: 'ハイパワーモーター', mod: { atk: 4 },        price: 1400, unlock: 10, desc: '攻撃+4' },
  scope_eye:   { name: 'スコープアイ',     mod: { hit: 25 },         price: 1200, unlock: 11, desc: '命中+25' },
  mirage:      { name: 'ミラージュ膜',     mod: { avo: 25 },         price: 1500, unlock: 12, desc: '回避+25' },
  guard_core:  { name: 'ガードコア',       mod: { def: 3, maxhp: 6 }, price: 1600, unlock: 12, desc: '防御+3 / HP+6' },
  vital_gear:  { name: 'バイタルギア',     mod: { maxhp: 8, regen: 2 }, price: 1600, unlock: 13, desc: 'HP+8 / 毎ターンHP2回復' },
  sky_scope:   { name: 'たいくう照準',     mod: { antiair: 1 },      price: 1400, unlock: 13, desc: '飛行ユニットへのダメージ1.5倍' },
  aqua_fin:    { name: 'アクアフィン',     mod: { move: 'swim' },    price: 2000, unlock: 14, desc: '水の上を移動できる（飛行には効かない）' },
  all_terrain: { name: 'オールテレーン',   mod: { move: 'hop' },     price: 2400, unlock: 15, desc: '水以外の地形を移動コスト1で進める' },
  wing_boost:  { name: 'ウイングブースター', mod: { mov: 1, avo: 10 }, price: 2000, unlock: 16, desc: '移動+1 / 回避+10' },
  mega_cell:   { name: 'メガセル',         mod: { maxhp: 20 },       price: 1800, unlock: 16, desc: 'HP+20' },
  berserk:     { name: 'バーサクチップ',   mod: { atk: 8, def: -4 }, price: 2000, unlock: 18, desc: '攻撃+8 / 防御-4' },
  repair_dx:   { name: 'リペアナノDX',     mod: { regen: 8 },        price: 2200, unlock: 19, desc: '毎ターンHP8回復' },
  endure:      { name: 'ふんばり装置',     mod: { endure: 1 },       price: 2500, unlock: 20, desc: '1戦に1回、倒される攻撃をHP1でたえる' },
  jet_leg:     { name: 'ジェットレッグ',   mod: { mov: 2, def: -2 }, price: 0, shop: false, desc: '移動+2 / 防御-2（宝箱）' },
  super_barrel:{ name: 'スーパーバレル',   mod: { rmax: 2 },         price: 0, shop: false, desc: '射程+2（射程2以上の武器のみ・宝箱）' },
  king_core:   { name: 'キングコア',       mod: { atk: 5, def: 5, maxhp: 10 }, price: 0, shop: false, desc: '攻撃+5 / 防御+5 / HP+10（宝箱）' },
};

// 味方の初期メンバーと加入タイミング（ストーリーのクリア数）
const RECRUITS = [
  { cls: 'kabuto',   name: 'ツノマル', join: 0 },
  { cls: 'kuwagata', name: 'キバオ',   join: 0 },
  { cls: 'chou',     name: 'ヒラリ',   join: 0 },
  { cls: 'hachi',    name: 'ビービ',   join: 2 },
  { cls: 'tentou',   name: 'テンコ',   join: 3 },
  { cls: 'ari',      name: 'ギアリ',   join: 5 },
  { cls: 'tonbo',    name: 'スイスイ', join: 7 },
  { cls: 'kamakiri', name: 'カマジロウ', join: 10 },
  { cls: 'batta',    name: 'ピョンタ', join: 12 },
  { cls: 'kumo',     name: 'イトネ',   join: 14 },
  { cls: 'gengorou', name: 'ゲンタ',   join: 16 },
  { cls: 'hotaru',   name: 'ホノカ',   join: 18 },
  { cls: 'dangomushi', name: 'ゴロン', join: 20 },
  { cls: 'ga',       name: 'ヨルハ',   join: 22 },
  { cls: 'semi',     name: 'ミンミ',   join: 24 },
  { cls: 'kamikiri', name: 'キリマル', join: 26 },
];

// ステージ（マップ 8×10）。G=草地 F=森 R=岩場 W=水
// start=味方の出撃位置, enemies=敵配置（ai: aggressive=突撃 / hold=待ち伏せ / boss=動かない / thief=宝箱どろぼう）
// chests=宝箱（get: { money: 数 } / { item: 武器・パーツID } / { card: カードID } / { recipe: レシピID }）。取得記録は配列の順番で保存するので、追加は末尾へ

const STAGES = [
  {
    id: 1, name: 'はじまりの草原',
    story: 'ガラクタ軍団のロボが草原にあらわれた！\nツノマル「よし、オレたちで追いはらうぞ！」',
    rows: ['GGFGGRGG', 'GFGGGGFG', 'GGGWWGGG', 'GRGWWGFG', 'GGGGGGGG', 'FGGGRGGG', 'GGFGGGWW', 'GGGGFGWG', 'GRGGGGGG', 'GGGGGFGG'],
    start: [[2, 9], [4, 9], [3, 8], [5, 8], [1, 8]],
    enemies: [
      { cls: 'ari', lv: 1, x: 2, y: 1 }, { cls: 'ari', lv: 1, x: 5, y: 1 }, { cls: 'kuwagata', lv: 1, x: 4, y: 0 },
    ],
    reward: { money: 300, items: ['energy_cell'], cards: ['mitsu'] },
    chests: [{ x: 7, y: 7, get: { money: 150 } }, { x: 0, y: 0, get: { item: 'armor_plate' } }, { x: 3, y: 5, get: { card: 'hari_dan' } }],
  },
  {
    id: 2, name: '森のこみち',
    story: '森の奥へ逃げたガラクタ軍団を追え！\nヒラリ「森の中は回避が上がるよ。うまく使ってね」',
    rows: ['FFGGGFFG', 'FGGFGGFF', 'GGFFGGGF', 'GFGGGFGG', 'FFGRGGFF', 'GGGFFGGG', 'FGGGGFGF', 'GGFGGGGG', 'FGGGFGGF', 'GGGGGGFF'],
    start: [[2, 9], [4, 9], [3, 8], [5, 9], [1, 9]],
    enemies: [
      { cls: 'ari', lv: 2, x: 1, y: 1 }, { cls: 'ari', lv: 2, x: 6, y: 2, ai: 'thief' }, { cls: 'ga', lv: 2, x: 3, y: 0 }, { cls: 'kabuto', lv: 2, x: 5, y: 0 },
    ],
    reward: { money: 400, items: ['power_motor'], cards: ['hari_dan'] },
    chests: [{ x: 0, y: 4, get: { money: 200 } }, { x: 7, y: 1, get: { item: 'energy_cell' } }, { x: 6, y: 0, get: { item: 'lockon' } }, { x: 2, y: 5, get: { card: 'koishi' } }, { x: 7, y: 6, get: { recipe: 'r_suna' } }],
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
    reward: { money: 500, items: ['armor_plate'], cards: ['doku_bari'] },
    chests: [{ x: 7, y: 4, get: { money: 300 } }, { x: 6, y: 2, get: { item: 'power_motor' } }, { x: 0, y: 0, get: { card: 'shibire_kona' } }],
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
    reward: { money: 600, items: ['lockon'], cards: ['katai_koura'] },
    chests: [{ x: 0, y: 0, get: { item: 'power_motor' } }, { x: 7, y: 0, get: { money: 300 } }, { x: 7, y: 7, get: { money: 150 } }, { x: 3, y: 4, get: { card: 'inazuma_hari' } }, { x: 4, y: 1, get: { recipe: 'r_toome' } }],
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
    reward: { money: 800, items: ['drill_horn'], cards: ['hinoko'] },
    chests: [{ x: 0, y: 0, get: { item: 'boomerang' } }, { x: 1, y: 1, get: { money: 400 } }, { x: 6, y: 7, get: { item: 'energy_cell' } }, { x: 7, y: 0, get: { card: 'hana_mitsu' } }],
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
    reward: { money: 900, items: ['stealth'], cards: ['kazekiri'] },
    chests: [{ x: 0, y: 0, get: { item: 'repair_nano' } }, { x: 7, y: 0, get: { money: 400 } }, { x: 0, y: 7, get: { item: 'armor_plate' } }, { x: 3, y: 4, get: { card: 'kagerou' } }, { x: 7, y: 4, get: { recipe: 'r_kagerou' } }],
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
    reward: { money: 1000, items: ['snipe_powder'], cards: ['toomegane'] },
    chests: [{ x: 3, y: 4, get: { item: 'blast_spore' } }, { x: 0, y: 0, get: { money: 500 } }, { x: 7, y: 0, get: { item: 'heavy_armor' } }, { x: 5, y: 4, get: { card: 'hoshifuri' } }],
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
    reward: { money: 1200, items: ['turbo_leg'], cards: ['suna_arashi'] },
    chests: [{ x: 0, y: 0, get: { item: 'overdrive' } }, { x: 7, y: 9, get: { money: 300 } }, { x: 7, y: 0, get: { item: 'big_battery' } }, { x: 3, y: 4, get: { card: 'teppeki' } }, { x: 0, y: 5, get: { recipe: 'r_nemuri' } }],
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
    reward: { money: 1400, items: ['medi_mist'], cards: ['hanabi'] },
    chests: [{ x: 3, y: 2, get: { money: 600 } }, { x: 7, y: 5, get: { item: 'stun_needle' } }, { x: 2, y: 0, get: { item: 'giga_scissor' } }, { x: 0, y: 0, get: { card: 'rinpun_storm' } }],
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
    reward: { money: 2000, items: ['thunder_horn'], cards: ['tsuno_hou'] },
    chests: [{ x: 0, y: 4, get: { item: 'meteor_scale' } }, { x: 7, y: 0, get: { money: 1000 } }, { x: 0, y: 0, get: { item: 'turbo_leg' } }, { x: 3, y: 0, get: { card: 'royal_nectar' } }, { x: 7, y: 4, get: { recipe: 'r_raimei' } }],
  },
];

// ===== カード =====
// kind: attack=攻撃 / heal=回復 / buff=能力アップ / warp=ワープ / status=状態異常・弱体
// rank: 1〜4（★の数）, range: 使うユニットからの距離, area: 範囲の半径（0=1体だけ）, self: true=自分中心
// pow: 攻撃の威力, heal: 回復量, cleanse: 状態異常を治す, buff: { k: 能力, v: 増減, t: ターン数 }
// status: { para: マヒのターン数 } / { poison: [毎ターンのダメージ, ターン数] }
// warp: 'tile'（空きマスへ移動）/ 'swap'（味方と入れ替わる）
// only: 'synth'=合成でしか作れない / 'wild'=荒野モードの宝箱でしか出ない（パックからは出ない）
const CARD_KINDS = {
  attack: { name: '攻撃', icon: '💥', color: '#e0504a' },
  heal:   { name: '回復', icon: '💚', color: '#3ccf6e' },
  buff:   { name: '強化', icon: '⬆️', color: '#e0a030' },
  warp:   { name: 'ワープ', icon: '🌀', color: '#8a6cff' },
  status: { name: '状態異常', icon: '☠️', color: '#b05ad0' },
};
const BUFF_NAMES = { atk: '攻撃', def: '防御', mov: '移動', rmax: '射程', avo: '回避', hit: '命中' };
const CARDS = {
  // --- 攻撃（1体） ---
  hari_dan:     { name: 'ハリ弾',             kind: 'attack', rank: 1, range: 3, pow: 8,  icon: '📌', desc: '細い針を撃ち出す' },
  koishi:       { name: 'コイシ・ショット',   kind: 'attack', rank: 1, range: 2, pow: 10, icon: '🪨', desc: '小石をはじき飛ばす' },
  inazuma_hari: { name: 'イナズマ針',         kind: 'attack', rank: 2, range: 3, pow: 14, icon: '⚡', desc: '電気をまとった針' },
  kazekiri:     { name: 'カゼキリ刃',         kind: 'attack', rank: 2, range: 4, pow: 12, icon: '🍃', desc: '風の刃が遠くまで届く' },
  hinoko:       { name: 'ヒノコ玉',           kind: 'attack', rank: 2, range: 2, pow: 16, icon: '🔥', desc: '小さな火の玉' },
  tsuno_hou:    { name: 'ツノ砲',             kind: 'attack', rank: 3, range: 3, pow: 20, icon: '🦏', desc: '角からエネルギー弾を発射' },
  hoshifuri:    { name: 'ホシフリ',           kind: 'attack', rank: 3, range: 5, pow: 24, icon: '🌠', desc: '空から星くずを降らせる' },
  giga_slash:   { name: 'ギガハサミ斬り',     kind: 'attack', rank: 3, range: 1, pow: 28, icon: '✂️', desc: '目の前の敵を力いっぱい挟む' },
  raimei:       { name: 'ライメイ・ドライブ', kind: 'attack', rank: 4, range: 4, pow: 36, icon: '🌩', desc: '雷鳴とともに突撃する', only: 'synth' },
  sorawari:     { name: 'ソラワリ',           kind: 'attack', rank: 4, range: 6, pow: 44, icon: '☄️', desc: '空を割るほどの一撃', only: 'synth' },
  // --- 攻撃（範囲） ---
  tsubu_bomb:   { name: 'ツブツブ爆弾',       kind: 'attack', rank: 1, range: 3, area: 1, pow: 7,  icon: '💣', desc: '着弾点のまわりの敵にダメージ' },
  suna_arashi:  { name: 'スナアラシ',         kind: 'attack', rank: 2, self: true, area: 2, pow: 10, icon: '🌪', desc: '自分のまわり2マスの敵を巻き込む' },
  hanabi:       { name: 'ハナビ・スポア',     kind: 'attack', rank: 2, range: 4, area: 1, pow: 13, icon: '🎆', desc: '胞子がはじけて広がる' },
  rinpun_storm: { name: 'リンプン・ストーム', kind: 'attack', rank: 3, range: 3, area: 2, pow: 17, icon: '✨', desc: '鱗粉の嵐で広く攻撃' },
  daichi_yure:  { name: 'ダイチユレ',         kind: 'attack', rank: 4, self: true, area: 2, pow: 26, icon: '🌋', desc: '地面をゆらして周りの敵をなぎ倒す', only: 'synth' },
  // --- 回復 ---
  mitsu:        { name: 'ミツのしずく',       kind: 'heal', rank: 1, range: 1, heal: 12, icon: '🍯', desc: '味方1体を12回復' },
  repair_gel:   { name: 'リペアジェル',       kind: 'heal', rank: 1, range: 2, heal: 8, cleanse: true, icon: '🧴', desc: '8回復して状態異常も治す' },
  hana_mitsu:   { name: 'ハナミツ',           kind: 'heal', rank: 2, range: 2, heal: 20, icon: '🌼', desc: '味方1体を20回復' },
  asatsuyu:     { name: 'アサツユの輪',       kind: 'heal', rank: 2, self: true, area: 2, heal: 10, icon: '💧', desc: '自分のまわり2マスの味方を10回復' },
  royal_nectar: { name: 'ロイヤル・ネクター', kind: 'heal', rank: 3, range: 3, heal: 999, cleanse: true, icon: '👑', desc: '味方1体を全回復・状態異常も治す' },
  megumi:       { name: 'メグミの雨',         kind: 'heal', rank: 3, self: true, area: 3, heal: 20, cleanse: true, icon: '🌧', desc: 'まわり3マスの味方を20回復・状態異常も治す' },
  // --- 能力アップ ---
  power_jushi:  { name: 'ちからの樹液',       kind: 'buff', rank: 1, range: 1, buff: { k: 'atk', v: 4, t: 2 }, icon: '💪', desc: '攻撃+4（2ターン）' },
  katai_koura:  { name: 'カタイ甲羅',         kind: 'buff', rank: 1, range: 1, buff: { k: 'def', v: 4, t: 2 }, icon: '🛡', desc: '防御+4（2ターン）' },
  hayabane:     { name: 'ハヤバネ',           kind: 'buff', rank: 1, range: 1, buff: { k: 'mov', v: 2, t: 2 }, icon: '👟', desc: '移動+2（2ターン）' },
  toomegane:    { name: 'トオメガネ',         kind: 'buff', rank: 2, range: 1, buff: { k: 'rmax', v: 1, t: 3 }, icon: '🔭', desc: '射程+1（3ターン）' },
  kagerou:      { name: 'カゲロウ',           kind: 'buff', rank: 2, range: 1, buff: { k: 'avo', v: 30, t: 2 }, icon: '👻', desc: '回避+30（2ターン）' },
  ouen_uta:     { name: 'オウエン歌',         kind: 'buff', rank: 2, self: true, area: 2, buff: { k: 'atk', v: 3, t: 2 }, icon: '🎵', desc: 'まわり2マスの味方の攻撃+3（2ターン）' },
  kakusei:      { name: 'カクセイ',           kind: 'buff', rank: 3, range: 1, buff: { k: 'atk', v: 9, t: 3 }, icon: '🌟', desc: '攻撃+9（3ターン）' },
  teppeki:      { name: 'テッペキ',           kind: 'buff', rank: 3, range: 1, buff: { k: 'def', v: 9, t: 3 }, icon: '🏰', desc: '防御+9（3ターン）' },
  // --- ワープ ---
  warp_pod:     { name: 'ワープ・ポッド',     kind: 'warp', rank: 1, range: 5, warp: 'tile', icon: '🛸', desc: '5マス以内の空きマスへ瞬間移動' },
  irekae:       { name: 'イレカエ',           kind: 'warp', rank: 2, range: 99, warp: 'swap', icon: '🔄', desc: '好きな味方と場所を入れ替える' },
  jikuu_tunnel: { name: 'ジクウトンネル',     kind: 'warp', rank: 3, range: 99, warp: 'tile', icon: '🕳', desc: 'マップのどこへでも瞬間移動' },
  // --- 状態異常・弱体 ---
  shibire_kona: { name: 'シビレ粉',           kind: 'status', rank: 1, range: 3, status: { para: 1 }, icon: '💫', desc: '敵1体をマヒ（1ターン行動できない）。ボスには効かない' },
  doku_bari:    { name: 'ドクバリ',           kind: 'status', rank: 1, range: 2, status: { poison: [4, 3] }, icon: '🧪', desc: '毒：3ターンのあいだ毎ターン4ダメージ' },
  ashidome:     { name: 'アシドメ・ネット',   kind: 'status', rank: 1, range: 3, buff: { k: 'mov', v: -3, t: 2 }, icon: '🕸', desc: '敵の移動-3（2ターン）' },
  yowami:       { name: 'ヨワミ光線',         kind: 'status', rank: 2, range: 4, buff: { k: 'atk', v: -5, t: 2 }, icon: '📉', desc: '敵の攻撃-5（2ターン）' },
  sabi_eki:     { name: 'サビつき液',         kind: 'status', rank: 2, range: 3, buff: { k: 'def', v: -5, t: 2 }, icon: '🟤', desc: '敵の防御-5（2ターン）' },
  nemuri_kona:  { name: 'ネムリコナ',         kind: 'status', rank: 2, range: 3, area: 1, status: { para: 1 }, icon: '😴', desc: '着弾点のまわりの敵をマヒ（1ターン）' },
  moudoku:      { name: 'モウドクの霧',       kind: 'status', rank: 3, range: 3, area: 1, status: { poison: [7, 3] }, icon: '☠️', desc: 'まわりの敵に毒：毎ターン7ダメージ（3ターン）' },
  tokitome:     { name: 'トキトメ・ベル',     kind: 'status', rank: 4, self: true, area: 3, status: { para: 2 }, icon: '🔔', desc: 'まわり3マスの敵を2ターンマヒ', only: 'synth' },
};
// 新しく始めたとき（と以前のセーブ）に配る最初のカード（20枚）
const STARTER_CARDS = {
  hari_dan: 3, koishi: 2, tsubu_bomb: 2, mitsu: 3, repair_gel: 1, power_jushi: 2,
  katai_koura: 2, hayabane: 1, warp_pod: 1, shibire_kona: 2, doku_bari: 1,
};
const DECK_SIZE = 20;      // デッキの枚数
const DECK_MAX_SAME = 3;   // 同じカードは3枚まで
// ショップのカードパック（rate: ★1〜4が出る割合）
const CARD_PACKS = [
  { id: 'normal', name: 'ノーマルパック', price: 300,  count: 3, rate: [70, 27, 3, 0],  desc: '★1〜★2が中心。たまに★3' },
  { id: 'gold',   name: 'ゴールドパック', price: 1200, count: 3, rate: [0, 60, 40, 0],  desc: '★2〜★3だけが出る', unlock: 5 },
];

// ===== カード合成レシピ =====
// in: { 材料カードID: 枚数 }（合計2〜4枚）, out: できるカード, known: true=最初から知っている
// レシピは宝箱（get: { recipe: 'ID' }）で見つけるか、合成画面で材料を試して発見する
const RECIPES = {
  r_inazuma:  { in: { hari_dan: 3 }, out: 'inazuma_hari', known: true },
  r_hanamitsu:{ in: { mitsu: 3 }, out: 'hana_mitsu', known: true },
  r_kakusei:  { in: { power_jushi: 3 }, out: 'kakusei', known: true },
  r_teppeki:  { in: { katai_koura: 3 }, out: 'teppeki', known: true },
  r_hinoko:   { in: { koishi: 3 }, out: 'hinoko' },
  r_kazekiri: { in: { koishi: 2, hayabane: 1 }, out: 'kazekiri' },
  r_suna:     { in: { tsubu_bomb: 3 }, out: 'suna_arashi' },
  r_hanabi:   { in: { tsubu_bomb: 2, hinoko: 1 }, out: 'hanabi' },
  r_tsuno:    { in: { inazuma_hari: 2, power_jushi: 1 }, out: 'tsuno_hou' },
  r_hoshi:    { in: { kazekiri: 2, toomegane: 1 }, out: 'hoshifuri' },
  r_giga:     { in: { power_jushi: 2, hinoko: 2 }, out: 'giga_slash' },
  r_rinpun:   { in: { hanabi: 2, suna_arashi: 1 }, out: 'rinpun_storm' },
  r_raimei:   { in: { tsuno_hou: 2, inazuma_hari: 2 }, out: 'raimei' },
  r_sorawari: { in: { hoshifuri: 2, raimei: 1 }, out: 'sorawari' },
  r_daichi:   { in: { rinpun_storm: 2, suna_arashi: 2 }, out: 'daichi_yure' },
  r_repair:   { in: { mitsu: 1, doku_bari: 1 }, out: 'repair_gel' },
  r_asatsuyu: { in: { mitsu: 2, repair_gel: 1 }, out: 'asatsuyu' },
  r_royal:    { in: { hana_mitsu: 3 }, out: 'royal_nectar' },
  r_megumi:   { in: { asatsuyu: 2, royal_nectar: 1 }, out: 'megumi' },
  r_toome:    { in: { hayabane: 2, koishi: 1 }, out: 'toomegane' },
  r_kagerou:  { in: { hayabane: 2, katai_koura: 1 }, out: 'kagerou' },
  r_ouen:     { in: { power_jushi: 2, mitsu: 1 }, out: 'ouen_uta' },
  r_irekae:   { in: { warp_pod: 2 }, out: 'irekae' },
  r_jikuu:    { in: { warp_pod: 2, irekae: 1 }, out: 'jikuu_tunnel' },
  r_ashidome: { in: { tsubu_bomb: 1, shibire_kona: 1 }, out: 'ashidome' },
  r_nemuri:   { in: { shibire_kona: 3 }, out: 'nemuri_kona' },
  r_yowami:   { in: { ashidome: 2, shibire_kona: 1 }, out: 'yowami' },
  r_sabi:     { in: { doku_bari: 1, ashidome: 2 }, out: 'sabi_eki' },
  r_moudoku:  { in: { doku_bari: 2, nemuri_kona: 1 }, out: 'moudoku' },
  r_tokitome: { in: { nemuri_kona: 2, moudoku: 1 }, out: 'tokitome' },
};
const SYNTH_SLOTS = 4; // 合成で一度に入れられる枚数
