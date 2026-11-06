// テスト共通の道具
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; print('  ✗ ' + msg); } };

// ---- 画面を通して最後まで遊ぶ ----
async function waitIdle() {
  for (let i = 0; i < 5000; i++) {
    const m = BattleUI.mode;
    if (m === 'over') return;
    if (m !== 'busy' && BattleUI.state.phase === 'player' && Engine.alive(BattleUI.state, 'player').some(u => !u.acted)) return;
    await sleep();
  }
  throw new Error('待機タイムアウト mode=' + BattleUI.mode);
}

async function autoPlay(stage, party, enemies) {
  let endResult = null;
  BattleUI.start(stage, party, enemies, r => { endResult = r; });
  const b = BattleUI.state;
  let guard = 0;
  while (!endResult && guard++ < 80) {
    await waitIdle();
    if (endResult || BattleUI.mode === 'over') break;
    for (const u of Engine.alive(b, 'player')) {
      if (u.acted || endResult || BattleUI.mode === 'over') continue;
      const plan = Engine.planAI(b, u);
      BattleUI.tapCell(u.x, u.y);                // 選択
      ok(BattleUI.mode === 'selected', '選択できる');
      if (plan.to.x !== u.x || plan.to.y !== u.y) await BattleUI.tapCell(plan.to.x, plan.to.y);
      else BattleUI.tapCell(u.x, u.y);
      ok(BattleUI.mode === 'moved', '移動後メニュー mode=' + BattleUI.mode);
      if (plan.action && plan.action.type === 'attack') {
        pressSheet('attack');
        await BattleUI.tapCell(plan.action.target.x, plan.action.target.y);
        ok(sheetHtml().includes('命中率'), '予測表示');
        pressSheet('go');
      } else if (plan.action && plan.action.type === 'heal') {
        pressSheet('heal');
        await BattleUI.tapCell(plan.action.target.x, plan.action.target.y);
      } else {
        pressSheet('wait');
      }
      for (let i = 0; i < 3000 && BattleUI.mode === 'busy'; i++) await sleep();
      if (endResult) break;
      await waitIdle();
    }
  }
  for (let i = 0; i < 3000 && !endResult; i++) await sleep();
  return { result: endResult, turns: b.turn, b };
}

