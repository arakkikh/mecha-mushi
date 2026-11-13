'use strict';
// ===== 攻撃カードのミニゲーム（約3秒）=====
// 外側の輪が縮んで、真ん中の円と重なった瞬間にタップ。3回の成功度で威力が 0.6〜1.5倍 になる
const MiniGame = (() => {
  const ROUNDS = 3;
  const DUR = 1000;          // 1回あたりの時間（ミリ秒）
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const scaleAt = ms => 2.4 - 1.8 * Math.min(1, ms / DUR); // 2.4倍 → 0.6倍まで縮む（1.0 で重なる）
  function judge(scale) {
    const d = Math.abs(scale - 1);
    if (d <= 0.1) return { s: 1, text: 'PERFECT!', cls: 'perfect' };
    if (d <= 0.25) return { s: 0.6, text: 'GOOD', cls: 'good' };
    return { s: 0, text: 'MISS', cls: 'miss' };
  }
  const mult = score => Math.round((0.6 + 0.9 * score) * 100) / 100; // 0.6〜1.5

  let cur = null; // 実行中のゲーム

  function play(card) {
    return new Promise(resolve => {
      const el = document.getElementById('minigame');
      el.innerHTML = `<div class="mg-box">
        <div class="mg-title">${card.icon} ${card.name}</div>
        <div class="mg-hint">輪が重なった瞬間にタップ！</div>
        <div class="mg-stage"><div class="mg-target"></div><div class="mg-ring"></div><div class="mg-judge"></div></div>
        <div class="mg-dots"><i></i><i></i><i></i></div>
        <div class="mg-result"></div></div>`;
      el.classList.remove('hidden');
      const ring = el.querySelector('.mg-ring');
      const jd = el.querySelector('.mg-judge');
      const dots = el.querySelectorAll('.mg-dots i');
      cur = { round: 0, start: now(), scores: [], done: false };
      const g = cur;

      function next(res) {
        g.scores.push(res.s);
        if (dots[g.round]) dots[g.round].className = res.cls;
        jd.textContent = res.text;
        jd.className = 'mg-judge show ' + res.cls;
        g.round++;
        g.start = now() + 250; // 少し間をあける
        if (g.round >= ROUNDS) finish();
      }
      function finish() {
        g.done = true;
        const score = g.scores.reduce((a, b) => a + b, 0) / ROUNDS;
        el.querySelector('.mg-result').innerHTML = `威力 <b>×${mult(score).toFixed(1)}</b>`;
        setTimeout(() => { el.classList.add('hidden'); el.onpointerdown = null; cur = null; resolve(score); }, 700);
      }
      g.tap = () => {
        if (g.done) return;
        const t = now() - g.start;
        if (t < 0) return;
        next(judge(scaleAt(t)));
      };
      el.onpointerdown = e => { if (e.preventDefault) e.preventDefault(); g.tap(); };
      (function loop() {
        if (g.done) return;
        const t = now() - g.start;
        if (t > DUR + 150) { next({ s: 0, text: 'MISS', cls: 'miss' }); }
        if (g.done) return;
        ring.style.transform = `translate(-50%, -50%) scale(${t < 0 ? 2.4 : scaleAt(t)})`;
        requestAnimationFrame(loop);
      })();
    });
  }
  const tap = () => cur && cur.tap && cur.tap();

  return { play, judge, scaleAt, mult, tap, DUR, get running() { return !!cur; } };
})();
