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
