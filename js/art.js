'use strict';
// ===== ユニットの絵（SVG・上から見た昆虫ロボ） =====
const Art = (() => {
  const PAL = {
    player: { m: '#3d8bff', d: '#1d4fa8', l: '#a9d0ff', e: '#7ffcff', metal: '#cfd8e3' },
    enemy:  { m: '#e8484a', d: '#8e1f2a', l: '#ffb0a8', e: '#ffe14a', metal: '#b9a9a9' },
  };

  // 6本脚（共通）
  const legs = (c, y1, y2, y3, spread) => {
    const s = spread || 0;
    return `<g stroke="${c.d}" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M24 ${y1} L${12 - s} ${y1 - 6} L${8 - s} ${y1 - 12}"/><path d="M40 ${y1} L${52 + s} ${y1 - 6} L${56 + s} ${y1 - 12}"/>
      <path d="M23 ${y2} L${9 - s} ${y2}"/><path d="M41 ${y2} L${55 + s} ${y2}"/>
      <path d="M24 ${y3} L${12 - s} ${y3 + 6} L${9 - s} ${y3 + 13}"/><path d="M40 ${y3} L${52 + s} ${y3 + 6} L${55 + s} ${y3 + 13}"/>
    </g>`;
  };
  const eyes = (c, y, gap) => `<circle cx="${32 - gap}" cy="${y}" r="2.6" fill="${c.e}"/><circle cx="${32 + gap}" cy="${y}" r="2.6" fill="${c.e}"/>`;
  const bolt = (x, y, c) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${c.metal}"/>`;

  const DRAW = {
    // カブト型：大きな角と分厚い装甲
    kabuto: c => `${legs(c, 30, 38, 46)}
      <path d="M32 21 L32 6" stroke="${c.metal}" stroke-width="5" stroke-linecap="round"/>
      <path d="M27 5 L32 9 L37 5" stroke="${c.metal}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="42" rx="15" ry="17" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <line x1="32" y1="28" x2="32" y2="58" stroke="${c.d}" stroke-width="2"/>
      <path d="M21 34 Q32 30 43 34" stroke="${c.l}" stroke-width="2" fill="none" opacity=".7"/>
      <rect x="21" y="18" width="22" height="12" rx="5" fill="${c.d}"/>
      ${eyes(c, 24, 6)}${bolt(25, 46, c)}${bolt(39, 46, c)}${bolt(25, 52, c)}${bolt(39, 52, c)}`,

    // クワガタ型：大あご
    kuwagata: c => `${legs(c, 30, 38, 46)}
      <path d="M27 20 Q14 12 22 2 Q22 10 29 15" fill="${c.metal}" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M37 20 Q50 12 42 2 Q42 10 35 15" fill="${c.metal}" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M20 10 l3 1 M44 10 l-3 1" stroke="${c.d}" stroke-width="2"/>
      <ellipse cx="32" cy="43" rx="12" ry="16" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <line x1="32" y1="30" x2="32" y2="58" stroke="${c.d}" stroke-width="2"/>
      <rect x="22" y="17" width="20" height="12" rx="4" fill="${c.d}"/>
      ${eyes(c, 23, 6)}${bolt(27, 48, c)}${bolt(37, 48, c)}`,

    // チョウ型：大きな翅
    chou: c => `
      <path d="M31 30 Q14 8 6 16 Q2 30 30 34 Z" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M33 30 Q50 8 58 16 Q62 30 34 34 Z" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M30 36 Q12 38 12 52 Q22 58 31 42 Z" fill="${c.l}" stroke="${c.d}" stroke-width="2"/>
      <path d="M34 36 Q52 38 52 52 Q42 58 33 42 Z" fill="${c.l}" stroke="${c.d}" stroke-width="2"/>
      <circle cx="17" cy="21" r="3.5" fill="${c.e}" opacity=".85"/><circle cx="47" cy="21" r="3.5" fill="${c.e}" opacity=".85"/>
      <path d="M29 20 Q24 10 22 6 M35 20 Q40 10 42 6" stroke="${c.d}" stroke-width="1.8" fill="none"/>
      <circle cx="22" cy="6" r="2" fill="${c.metal}"/><circle cx="42" cy="6" r="2" fill="${c.metal}"/>
      <rect x="29" y="18" width="6" height="36" rx="3" fill="${c.d}"/>
      ${eyes(c, 22, 2)}`,

    // ハチ型：しま模様と針
    hachi: c => `${legs(c, 28, 34, 38)}
      <ellipse cx="20" cy="28" rx="11" ry="6" fill="${c.l}" opacity=".7" stroke="${c.d}" stroke-width="1.2" transform="rotate(-25 20 28)"/>
      <ellipse cx="44" cy="28" rx="11" ry="6" fill="${c.l}" opacity=".7" stroke="${c.d}" stroke-width="1.2" transform="rotate(25 44 28)"/>
      <ellipse cx="32" cy="46" rx="10" ry="13" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M23 42 H41 M22.5 48 H41.5 M25 54 H39" stroke="#222" stroke-width="3"/>
      <path d="M30 58 L32 64 L34 58 Z" fill="${c.metal}"/>
      <circle cx="32" cy="30" r="6" fill="${c.d}"/>
      <ellipse cx="32" cy="19" rx="7" ry="6" fill="${c.d}"/>
      <path d="M28 14 L24 6 M36 14 L40 6" stroke="${c.d}" stroke-width="2"/>
      ${eyes(c, 18, 3.5)}`,

    // テントウムシ型：丸いドームと十字マーク
    tentou: c => `${legs(c, 30, 38, 46)}
      <circle cx="32" cy="39" r="17" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <line x1="32" y1="22" x2="32" y2="56" stroke="${c.d}" stroke-width="2"/>
      <circle cx="24" cy="34" r="3" fill="${c.d}"/><circle cx="40" cy="34" r="3" fill="${c.d}"/>
      <circle cx="23" cy="46" r="3" fill="${c.d}"/><circle cx="41" cy="46" r="3" fill="${c.d}"/>
      <rect x="29" y="38" width="6" height="14" fill="#fff"/><rect x="25" y="42" width="14" height="6" fill="#fff"/>
      <path d="M22 22 Q32 12 42 22 Z" fill="${c.d}"/>
      ${eyes(c, 19, 4)}`,

    // アリ型（敵専用）：3つの節
    ari: c => `${legs(c, 30, 34, 38, 2)}
      <ellipse cx="32" cy="49" rx="9" ry="11" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <ellipse cx="32" cy="33" rx="5" ry="6" fill="${c.d}"/>
      <ellipse cx="32" cy="20" rx="8" ry="7" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M27 14 Q22 8 18 6 M37 14 Q42 8 46 6" stroke="${c.d}" stroke-width="2" fill="none"/>
      <path d="M28 12 L30 9 M36 12 L34 9" stroke="${c.metal}" stroke-width="2.5"/>
      ${eyes(c, 19, 3.5)}${bolt(32, 49, c)}`,

    // カマキリ型（敵専用）：鎌
    kamakiri: c => `${legs(c, 36, 42, 48)}
      <path d="M26 24 L14 18 L12 4 L18 14" fill="none" stroke="${c.metal}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M38 24 L50 18 L52 4 L46 14" fill="none" stroke="${c.metal}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="32" cy="46" rx="8" ry="15" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <rect x="29" y="22" width="6" height="14" rx="3" fill="${c.d}"/>
      <path d="M24 16 L40 16 L32 26 Z" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      ${eyes(c, 17, 6)}`,

    // ガ型（敵専用）：ふさふさの翅
    ga: c => `
      <path d="M31 28 L4 18 Q2 40 30 40 Z" fill="${c.d}" stroke="${c.m}" stroke-width="2"/>
      <path d="M33 28 L60 18 Q62 40 34 40 Z" fill="${c.d}" stroke="${c.m}" stroke-width="2"/>
      <path d="M30 40 Q16 44 18 56 Q26 54 31 44 Z" fill="${c.m}"/>
      <path d="M34 40 Q48 44 46 56 Q38 54 33 44 Z" fill="${c.m}"/>
      <circle cx="16" cy="29" r="4" fill="none" stroke="${c.e}" stroke-width="2"/><circle cx="48" cy="29" r="4" fill="none" stroke="${c.e}" stroke-width="2"/>
      <path d="M29 20 Q20 12 18 4 M35 20 Q44 12 46 4" stroke="${c.metal}" stroke-width="2" fill="none" stroke-dasharray="2 1.5"/>
      <rect x="28" y="18" width="8" height="34" rx="4" fill="${c.m}" stroke="${c.d}" stroke-width="1.5"/>
      ${eyes(c, 22, 2.5)}`,

    // トンボ型：細長い体と4枚の長い翅
    tonbo: c => `
      <ellipse cx="17" cy="22" rx="15" ry="4.5" fill="${c.l}" opacity=".75" stroke="${c.d}" stroke-width="1.2" transform="rotate(-8 17 22)"/>
      <ellipse cx="47" cy="22" rx="15" ry="4.5" fill="${c.l}" opacity=".75" stroke="${c.d}" stroke-width="1.2" transform="rotate(8 47 22)"/>
      <ellipse cx="18" cy="31" rx="14" ry="4" fill="${c.l}" opacity=".6" stroke="${c.d}" stroke-width="1.2" transform="rotate(10 18 31)"/>
      <ellipse cx="46" cy="31" rx="14" ry="4" fill="${c.l}" opacity=".6" stroke="${c.d}" stroke-width="1.2" transform="rotate(-10 46 31)"/>
      <rect x="29.5" y="24" width="5" height="38" rx="2.5" fill="${c.m}" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M29.5 34 H34.5 M29.5 42 H34.5 M29.5 50 H34.5" stroke="${c.d}" stroke-width="1.5"/>
      <ellipse cx="32" cy="22" rx="5" ry="6" fill="${c.d}"/>
      <circle cx="27" cy="12" r="5" fill="${c.e}" stroke="${c.d}" stroke-width="1.5"/><circle cx="37" cy="12" r="5" fill="${c.e}" stroke="${c.d}" stroke-width="1.5"/>
      <rect x="29" y="12" width="6" height="6" rx="2" fill="${c.metal}"/>`,

    // クモ型：8本脚と丸いおなか
    kumo: c => `<g stroke="${c.d}" stroke-width="2.6" stroke-linecap="round" fill="none">
      <path d="M26 28 L12 18 L6 8"/><path d="M38 28 L52 18 L58 8"/><path d="M25 32 L10 28 L3 24"/><path d="M39 32 L54 28 L61 24"/>
      <path d="M25 36 L10 40 L4 46"/><path d="M39 36 L54 40 L60 46"/><path d="M27 39 L16 50 L12 60"/><path d="M37 39 L48 50 L52 60"/></g>
      <circle cx="32" cy="47" r="12" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M32 38 L28 46 L32 54 L36 46 Z" fill="${c.l}" opacity=".7"/>
      <ellipse cx="32" cy="30" rx="9" ry="9" fill="${c.d}"/>
      <circle cx="28" cy="25" r="2" fill="${c.e}"/><circle cx="36" cy="25" r="2" fill="${c.e}"/><circle cx="30" cy="22" r="1.5" fill="${c.e}"/><circle cx="34" cy="22" r="1.5" fill="${c.e}"/>
      <path d="M29 20 L27 15 M35 20 L37 15" stroke="${c.metal}" stroke-width="2.5" stroke-linecap="round"/>`,

    // ホタル型：光るしっぽ
    hotaru: c => `${legs(c, 26, 32, 38)}
      <circle cx="32" cy="52" r="11" fill="${c.e}" opacity=".35"/>
      <ellipse cx="22" cy="34" rx="9" ry="14" fill="${c.m}" stroke="${c.d}" stroke-width="1.5" transform="rotate(12 22 34)"/>
      <ellipse cx="42" cy="34" rx="9" ry="14" fill="${c.m}" stroke="${c.d}" stroke-width="1.5" transform="rotate(-12 42 34)"/>
      <ellipse cx="32" cy="51" rx="7" ry="8" fill="${c.e}" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M27 51 H37 M28 55 H36" stroke="#fff" stroke-width="1.5" opacity=".8"/>
      <ellipse cx="32" cy="18" rx="8" ry="6" fill="#e86a3a" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M27 14 Q22 6 18 5 M37 14 Q42 6 46 5" stroke="${c.d}" stroke-width="2" fill="none"/>
      ${eyes(c, 18, 4)}`,

    // バッタ型：大きな後ろ足
    batta: c => `<g stroke="${c.d}" stroke-width="2.6" stroke-linecap="round" fill="none">
      <path d="M26 24 L16 18 L12 12"/><path d="M38 24 L48 18 L52 12"/><path d="M26 30 L14 30"/><path d="M38 30 L50 30"/></g>
      <path d="M26 34 L12 46 L20 60" fill="none" stroke="${c.m}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M38 34 L52 46 L44 60" fill="none" stroke="${c.m}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 46 L20 60 M52 46 L44 60" stroke="${c.metal}" stroke-width="2"/>
      <ellipse cx="32" cy="40" rx="8" ry="18" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M25 34 Q32 40 39 34 M25 44 Q32 50 39 44" stroke="${c.l}" stroke-width="1.5" fill="none"/>
      <ellipse cx="32" cy="17" rx="7" ry="8" fill="${c.d}"/>
      <path d="M29 10 Q24 2 20 1 M35 10 Q40 2 44 1" stroke="${c.d}" stroke-width="1.8" fill="none"/>
      ${eyes(c, 15, 4)}`,

    // ダンゴムシ型：重なった装甲板
    dangomushi: c => `<g stroke="${c.d}" stroke-width="2.2" stroke-linecap="round">
      ${[22, 28, 34, 40, 46, 52].map(y => `<path d="M18 ${y} H11 M46 ${y} H53"/>`).join('')}</g>
      <ellipse cx="32" cy="38" rx="16" ry="22" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      ${[24, 30, 36, 42, 48, 54].map(y => `<path d="M${18 + Math.abs(y - 38) / 3} ${y} Q32 ${y - 4} ${46 - Math.abs(y - 38) / 3} ${y}" stroke="${c.d}" stroke-width="1.8" fill="none"/>`).join('')}
      <path d="M22 20 Q32 12 42 20" fill="${c.l}" opacity=".6"/>
      ${bolt(24, 38, c)}${bolt(40, 38, c)}
      <path d="M27 17 L23 9 M37 17 L41 9" stroke="${c.metal}" stroke-width="2" stroke-linecap="round"/>
      ${eyes(c, 19, 5)}`,

    // セミ型：横に広い頭と透明な翅
    semi: c => `${legs(c, 28, 33, 38)}
      <path d="M31 24 L10 50 Q14 58 30 50 Z" fill="${c.l}" opacity=".6" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M33 24 L54 50 Q50 58 34 50 Z" fill="${c.l}" opacity=".6" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M20 38 L28 30 M44 38 L36 30" stroke="${c.d}" stroke-width="1"/>
      <ellipse cx="32" cy="38" rx="8" ry="15" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <rect x="18" y="14" width="28" height="11" rx="5" fill="${c.d}"/>
      <circle cx="19" cy="19" r="4" fill="${c.e}" stroke="${c.d}" stroke-width="1.5"/><circle cx="45" cy="19" r="4" fill="${c.e}" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M28 36 Q32 33 36 36 M28 41 Q32 38 36 41" stroke="${c.metal}" stroke-width="1.5" fill="none"/>`,

    // ゲンゴロウ型：なめらかな甲羅とオールの足
    gengorou: c => `<g stroke="${c.d}" stroke-width="2.4" stroke-linecap="round" fill="none">
      <path d="M22 26 L12 20"/><path d="M42 26 L52 20"/><path d="M21 34 L10 34"/><path d="M43 34 L54 34"/></g>
      <path d="M22 44 L6 52" stroke="${c.d}" stroke-width="3" stroke-linecap="round"/><path d="M42 44 L58 52" stroke="${c.d}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="7" cy="53" rx="5" ry="2.5" fill="${c.metal}" transform="rotate(25 7 53)"/><ellipse cx="57" cy="53" rx="5" ry="2.5" fill="${c.metal}" transform="rotate(-25 57 53)"/>
      <ellipse cx="32" cy="38" rx="14" ry="21" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M19 38 Q32 46 45 38" stroke="${c.e}" stroke-width="2" fill="none" opacity=".8"/>
      <line x1="32" y1="24" x2="32" y2="58" stroke="${c.d}" stroke-width="1.6"/>
      <path d="M22 28 Q32 20 42 28" stroke="${c.l}" stroke-width="2" fill="none" opacity=".7"/>
      <ellipse cx="32" cy="19" rx="9" ry="5" fill="${c.d}"/>
      ${eyes(c, 18, 5)}`,

    // カミキリ型：体より長い触角
    kamikiri: c => `${legs(c, 30, 38, 46)}
      <path d="M28 18 Q14 10 10 28 Q8 44 4 60" stroke="${c.metal}" stroke-width="2.6" fill="none" stroke-dasharray="5 2"/>
      <path d="M36 18 Q50 10 54 28 Q56 44 60 60" stroke="${c.metal}" stroke-width="2.6" fill="none" stroke-dasharray="5 2"/>
      <rect x="22" y="27" width="20" height="33" rx="9" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <line x1="32" y1="29" x2="32" y2="59" stroke="${c.d}" stroke-width="1.6"/>
      <circle cx="27" cy="37" r="2" fill="${c.l}"/><circle cx="37" cy="45" r="2" fill="${c.l}"/><circle cx="27" cy="51" r="2" fill="${c.l}"/><circle cx="37" cy="35" r="2" fill="${c.l}"/>
      <rect x="25" y="14" width="14" height="13" rx="5" fill="${c.d}"/>
      ${eyes(c, 19, 4)}`,

    // サソリ型（敵）：はさみと毒の尾
    sasori: c => `${legs(c, 30, 36, 42, 2)}
      <path d="M24 22 L14 12" stroke="${c.d}" stroke-width="3.5" stroke-linecap="round"/><path d="M40 22 L50 12" stroke="${c.d}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M8 4 Q16 2 16 10 Q10 12 8 4 Z M12 14 Q8 8 6 10" fill="${c.metal}" stroke="${c.d}" stroke-width="1.5"/>
      <path d="M56 4 Q48 2 48 10 Q54 12 56 4 Z M52 14 Q56 8 58 10" fill="${c.metal}" stroke="${c.d}" stroke-width="1.5"/>
      <ellipse cx="32" cy="34" rx="11" ry="14" fill="${c.m}" stroke="${c.d}" stroke-width="2"/>
      <path d="M32 47 Q32 54 38 56 Q46 58 46 50" fill="none" stroke="${c.m}" stroke-width="6" stroke-linecap="round"/>
      <path d="M32 47 Q32 54 38 56 Q46 58 46 50" fill="none" stroke="${c.d}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <path d="M43 50 L46 42 L49 50 Z" fill="${c.e}" stroke="${c.d}" stroke-width="1.2"/>
      <path d="M23 30 H41 M22 36 H42" stroke="${c.d}" stroke-width="1.5"/>
      ${eyes(c, 24, 4)}`,

    // ムカデ型（敵）：たくさんの節と脚
    mukade: c => `<g stroke="${c.d}" stroke-width="2" stroke-linecap="round">
      ${[16, 23, 30, 37, 44, 51].map(y => `<path d="M24 ${y} L14 ${y + 3} M40 ${y} L50 ${y + 3}"/>`).join('')}</g>
      ${[16, 23, 30, 37, 44, 51].map(y => `<ellipse cx="32" cy="${y}" rx="9" ry="4.2" fill="${c.m}" stroke="${c.d}" stroke-width="1.6"/>`).join('')}
      <path d="M28 58 L26 63 M36 58 L38 63" stroke="${c.d}" stroke-width="2"/>
      <ellipse cx="32" cy="9" rx="8" ry="6" fill="${c.d}"/>
      <path d="M26 6 Q22 1 26 0 M38 6 Q42 1 38 0" stroke="${c.metal}" stroke-width="2.4" fill="none"/>
      ${eyes(c, 9, 4)}`,

    // ガラクタ巨兵（敵）：四角い大型ロボ
    junk_titan: c => `
      <rect x="4" y="22" width="12" height="26" rx="4" fill="${c.d}" stroke="${c.metal}" stroke-width="1.5"/>
      <rect x="48" y="22" width="12" height="26" rx="4" fill="${c.d}" stroke="${c.metal}" stroke-width="1.5"/>
      <rect x="2" y="46" width="16" height="10" rx="3" fill="${c.metal}"/><rect x="46" y="46" width="16" height="10" rx="3" fill="${c.metal}"/>
      <rect x="14" y="18" width="36" height="38" rx="6" fill="${c.m}" stroke="${c.d}" stroke-width="2.5"/>
      <rect x="20" y="30" width="24" height="18" rx="3" fill="${c.d}"/>
      <path d="M22 34 H42 M22 39 H42 M22 44 H42" stroke="${c.metal}" stroke-width="1.5"/>
      ${bolt(18, 22, c)}${bolt(46, 22, c)}${bolt(18, 52, c)}${bolt(46, 52, c)}
      <rect x="22" y="6" width="20" height="14" rx="4" fill="${c.d}" stroke="${c.metal}" stroke-width="1.5"/>
      <rect x="25" y="11" width="14" height="4" rx="2" fill="${c.e}"/>
      <path d="M32 6 V1" stroke="${c.metal}" stroke-width="2"/><circle cx="32" cy="1.5" r="1.8" fill="${c.e}"/>`,

    // ガラクタ大王（敵）：王冠とマント
    emperor: c => `
      <path d="M10 30 Q4 50 14 62 L50 62 Q60 50 54 30 Z" fill="${c.d}" stroke="${c.metal}" stroke-width="1.5"/>
      ${legs(c, 30, 38, 46, 3)}
      <path d="M32 22 L32 8" stroke="${c.metal}" stroke-width="5" stroke-linecap="round"/>
      <path d="M24 10 Q32 0 40 10" stroke="${c.metal}" stroke-width="3" fill="none"/>
      <ellipse cx="32" cy="42" rx="16" ry="18" fill="${c.m}" stroke="${c.d}" stroke-width="2.5"/>
      <line x1="32" y1="26" x2="32" y2="60" stroke="${c.d}" stroke-width="2"/>
      <path d="M20 36 Q32 30 44 36 M20 48 Q32 42 44 48" stroke="#ffd34d" stroke-width="2" fill="none"/>
      <rect x="20" y="17" width="24" height="12" rx="5" fill="${c.d}"/>
      <path d="M21 18 L23 11 L27 16 L32 9 L37 16 L41 11 L43 18 Z" fill="#ffd34d" stroke="#7a5600" stroke-width="1.2"/>
      ${eyes(c, 23, 6)}${bolt(26, 52, c)}${bolt(38, 52, c)}`,
  };

  function svg(cls, side) {
    const c = PAL[side] || PAL.player;
    const draw = DRAW[cls] || DRAW.ari;
    const flip = side === 'enemy' ? ' transform="rotate(180 32 32)"' : '';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g${flip}>${draw(c)}</g></svg>`;
  }
  // 敵も上向きで見せたいとき（図鑑・カードなど）
  function icon(cls, side) {
    const c = PAL[side] || PAL.player;
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${(DRAW[cls] || DRAW.ari)(c)}</svg>`;
  }
  // 宝箱（木と金具の箱）
  function chest() {
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="54" rx="20" ry="4" fill="rgba(0,0,0,.35)"/>
      <g class="lid"><path d="M12 30 Q12 16 32 16 Q52 16 52 30 Z" fill="#c9782f" stroke="#5a2f0c" stroke-width="2.5"/>
      <path d="M22 17.5 V30 M42 17.5 V30" stroke="#ffd34d" stroke-width="3"/></g>
      <rect x="12" y="30" width="40" height="22" rx="2" fill="#a85a1f" stroke="#5a2f0c" stroke-width="2.5"/>
      <path d="M22 30 V52 M42 30 V52" stroke="#ffd34d" stroke-width="3"/>
      <rect x="28" y="27" width="8" height="10" rx="2" fill="#ffd34d" stroke="#7a5600" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="1.6" fill="#5a2f0c"/></svg>`;
  }
  return { svg, icon, chest };
})();
