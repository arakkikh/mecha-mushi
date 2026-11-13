'use strict';
// ===== 戦闘ロジック（画面に依存しない純粋な処理） =====
const Engine = (() => {
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const key = (x, y) => x + ',' + y;
  const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
  const MAX_LV = 20;

  // 相性：+1=有利, -1=不利, 0=普通
  function affinity(a, d) {
    if (TYPES[a].strong === d) return 1;
    if (TYPES[d].strong === a) return -1;
    return 0;
  }

  // 成長ぶん（敵は期待値で固定、味方は gain を使う）
  function defaultGain(cls, lv) {
    const g = CLASSES[cls].grow;
    return {
      hp: Math.floor(g.hp * (lv - 1)),
      atk: Math.floor(g.atk * (lv - 1)),
      def: Math.floor(g.def * (lv - 1)),
    };
  }

  // 装備込みの能力値
  function calcStats(spec) {
    const c = CLASSES[spec.cls];
    const lv = spec.lv || 1;
    const g = spec.gain || defaultGain(spec.cls, lv);
    const w = WEAPONS[spec.weapon] || WEAPONS[c.weapon];
    const s = {
      maxhp: c.base.hp + g.hp,
      atk: c.base.atk + g.atk + w.pow,
      def: c.base.def + g.def,
      mov: c.base.mov,
      rmin: w.rmin, rmax: w.rmax,
      hit: w.hit + (c.hit || 0),
      avo: c.avo || 0,
      heal: w.heal || 0,
      regen: 0,
    };
    for (const pid of spec.parts || []) {
      const p = PARTS[pid];
      if (!p) continue;
      for (const k in p.mod) {
        if (k === 'rmax' && s.rmax < 2) continue; // 射程延長は遠距離武器のみ
        s[k] = (s[k] || 0) + p.mod[k];
      }
    }
    s.maxhp = Math.max(1, s.maxhp);
    s.atk = Math.max(1, s.atk);
    s.def = Math.max(0, s.def);
    s.mov = Math.max(1, s.mov);
    return s;
  }

  function makeUnit(spec, side, x, y, uid) {
    const c = CLASSES[spec.cls];
    const st = calcStats(spec);
    return Object.assign({
      uid, side, x, y,
      cls: spec.cls, name: spec.name || c.name,
      lv: spec.lv || 1, exp: spec.exp || 0,
      gain: spec.gain ? Object.assign({}, spec.gain) : null,
      weapon: spec.weapon || c.weapon, parts: (spec.parts || []).slice(),
      type: c.type, move: c.move, ai: spec.ai || 'aggressive',
      rosterId: spec.id, acted: false, boss: !!spec.boss,
    }, st, { hp: st.maxhp });
  }

  // extra: { chestsTaken: [取得済みの宝箱番号], noChests: true で宝箱なし }
  function createBattle(stage, playerSpecs, enemySpecs, extra) {
    extra = extra || {};
    const taken = extra.chestsTaken || [];
    const b = {
      w: stage.rows[0].length, h: stage.rows.length,
      tiles: stage.rows.map(r => r.split('')),
      units: [], turn: 1, phase: 'player', nextUid: 1,
      // 宝箱：state = closed（未開封）/ opened（味方が取得）/ stolen（敵が取得）/ done（以前に取得済み）
      chests: extra.noChests ? [] : (stage.chests || []).map((c, i) => ({
        i, x: c.x, y: c.y, get: c.get, state: taken.includes(i) ? 'done' : 'closed',
      })),
    };
    playerSpecs.forEach((sp, i) => {
      const [x, y] = stage.start[i];
      b.units.push(makeUnit(sp, 'player', x, y, b.nextUid++));
    });
    for (const e of enemySpecs || stage.enemies) {
      b.units.push(makeUnit(e, 'enemy', e.x, e.y, b.nextUid++));
    }
    return b;
  }

  const alive = (b, side) => b.units.filter(u => u.hp > 0 && (!side || u.side === side));
  const unitAt = (b, x, y) => b.units.find(u => u.hp > 0 && u.x === x && u.y === y) || null;
  const byUid = (b, uid) => b.units.find(u => u.uid === uid);
  const terrain = (b, x, y) => TERRAIN[b.tiles[y][x]];
  const inside = (b, x, y) => x >= 0 && y >= 0 && x < b.w && y < b.h;
  const chestAt = (b, x, y) => (b.chests || []).find(c => c.state === 'closed' && c.x === x && c.y === y) || null;

  // ユニットが止まったマスの宝箱を開ける。開けたらイベントを返す
  function openChest(b, u) {
    if (u.hp <= 0) return null;
    const c = chestAt(b, u.x, u.y);
    if (!c) return null;
    c.state = u.side === 'player' ? 'opened' : 'stolen';
    return { kind: 'chest', uid: u.uid, side: u.side, idx: c.i, get: c.get };
  }

  // 移動範囲（ダイクストラ）。味方はすり抜け可・敵は通れない。
  function reachable(b, u, limit) {
    const mov = limit === undefined ? u.mov : limit;
    const all = new Map();
    all.set(key(u.x, u.y), { x: u.x, y: u.y, cost: 0, prev: null });
    const q = [{ x: u.x, y: u.y, cost: 0 }];
    while (q.length) {
      q.sort((a, c) => a.cost - c.cost);
      const cur = q.shift();
      if (cur.cost > all.get(key(cur.x, cur.y)).cost) continue;
      for (const [dx, dy] of DIRS) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!inside(b, nx, ny)) continue;
        const nc = cur.cost + terrain(b, nx, ny).cost[u.move];
        if (nc > mov) continue;
        const o = unitAt(b, nx, ny);
        if (o && o.side !== u.side) continue;
        const k = key(nx, ny);
        const old = all.get(k);
        if (!old || old.cost > nc) {
          all.set(k, { x: nx, y: ny, cost: nc, prev: key(cur.x, cur.y) });
          q.push({ x: nx, y: ny, cost: nc });
        }
      }
    }
    // 止まれるマス（他ユニットがいないマス）
    const stops = new Map();
    for (const [k, v] of all) {
      const o = unitAt(b, v.x, v.y);
      if (!o || o === u) stops.set(k, v);
    }
    return { all, stops };
  }

  function pathTo(res, x, y) {
    const path = [];
    let k = key(x, y);
    while (k) {
      const n = res.all.get(k);
      if (!n) break;
      path.unshift({ x: n.x, y: n.y });
      k = n.prev;
    }
    return path;
  }

  // (x,y) から攻撃できる敵
  function targetsFrom(b, u, x, y) {
    return alive(b).filter(t => t.side !== u.side && inRange(u, x, y, t));
  }
  function inRange(u, x, y, t) {
    const d = dist(x, y, t.x, t.y);
    return d >= u.rmin && d <= u.rmax;
  }
  // (x,y) から回復できる味方
  function healTargetsFrom(b, u, x, y) {
    if (!u.heal) return [];
    return alive(b).filter(t => t.side === u.side && t !== u && t.hp < t.maxhp &&
      dist(x, y, t.x, t.y) >= 1 && dist(x, y, t.x, t.y) <= Math.max(1, u.rmax));
  }

  // 移動＋攻撃で届く範囲（赤表示用）
  function threatTiles(b, u, res) {
    const set = new Set();
    for (const v of res.stops.values()) {
      for (let dy = -u.rmax; dy <= u.rmax; dy++) {
        for (let dx = -u.rmax; dx <= u.rmax; dx++) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < u.rmin || d > u.rmax) continue;
          const nx = v.x + dx, ny = v.y + dy;
          if (inside(b, nx, ny)) set.add(key(nx, ny));
        }
      }
    }
    return set;
  }

  function defBonus(b, d) {
    if (d.move === 'fly') return { def: 0, avo: 0 }; // 飛行は地形効果なし
    const t = terrain(b, d.x, d.y);
    return { def: t.def, avo: t.avo };
  }

  function calcHit(b, a, d) {
    const af = affinity(a.type, d.type);
    const h = a.hit + af * 15 - d.avo - defBonus(b, d).avo;
    return Math.max(5, Math.min(100, Math.round(h)));
  }
  function calcDmg(b, a, d) {
    const af = affinity(a.type, d.type);
    const raw = a.atk - (d.def + defBonus(b, d).def);
    const mult = af > 0 ? 1.3 : af < 0 ? 0.8 : 1;
    return Math.max(1, Math.round(Math.max(0, raw) * mult));
  }
  const canCounter = (d, a) => inRange(d, d.x, d.y, a);

  // 攻撃予測（攻撃側が (ax,ay) にいる想定）
  function forecast(b, a, d, ax, ay) {
    const ox = a.x, oy = a.y;
    if (ax !== undefined) { a.x = ax; a.y = ay; }
    const r = {
      hit: calcHit(b, a, d), dmg: calcDmg(b, a, d),
      aff: affinity(a.type, d.type), counter: null,
    };
    if (canCounter(d, a)) r.counter = { hit: calcHit(b, d, a), dmg: calcDmg(b, d, a) };
    a.x = ox; a.y = oy;
    return r;
  }

  // 経験値とレベルアップ（味方のみ）
  function gainExp(u, amount, rng) {
    if (u.side !== 'player' || u.lv >= MAX_LV) return null;
    u.exp += Math.max(1, Math.round(amount));
    if (u.exp < 100) return null;
    u.exp -= 100;
    u.lv++;
    if (u.lv >= MAX_LV) u.exp = 0;
    const g = CLASSES[u.cls].grow;
    const up = {};
    for (const k of ['hp', 'atk', 'def']) {
      let n = Math.floor(g[k]);
      if (rng() < g[k] - n) n++;
      up[k] = n;
    }
    if (up.hp + up.atk + up.def === 0) up.hp = 1; // 何も上がらないのは寂しいので保証
    u.gain = u.gain || defaultGain(u.cls, u.lv - 1);
    for (const k in up) u.gain[k] += up[k];
    const st = calcStats(u);
    const dhp = st.maxhp - u.maxhp;
    Object.assign(u, st);
    u.hp = Math.min(u.maxhp, u.hp + dhp);
    return { lv: u.lv, up };
  }

  // 攻撃を実行してイベント列を返す
  function doAttack(b, a, d, rng) {
    rng = rng || Math.random;
    const ev = [];
    const strike = (x, y, counter) => {
      const hit = calcHit(b, x, y), dmg = calcDmg(b, x, y);
      const ok = rng() * 100 < hit;
      if (ok) y.hp = Math.max(0, y.hp - dmg);
      ev.push({ kind: 'strike', att: x.uid, def: y.uid, hit: ok, dmg: ok ? dmg : 0, counter, killed: y.hp <= 0 });
      // 経験値
      const diff = y.lv - x.lv;
      let exp = ok ? Math.max(1, 10 + diff * 3) : 1;
      if (y.hp <= 0) exp += Math.max(5, 30 + diff * 8);
      const lvup = gainExp(x, exp, rng);
      if (lvup) ev.push({ kind: 'levelup', uid: x.uid, info: lvup });
    };
    strike(a, d, false);
    if (d.hp > 0 && canCounter(d, a)) strike(d, a, true);
    return ev;
  }

  function doHeal(b, h, t, rng) {
    const before = t.hp;
    t.hp = Math.min(t.maxhp, t.hp + h.heal);
    const ev = [{ kind: 'heal', att: h.uid, def: t.uid, amount: t.hp - before }];
    const lvup = gainExp(h, 12, rng || Math.random);
    if (lvup) ev.push({ kind: 'levelup', uid: h.uid, info: lvup });
    return ev;
  }

  // フェイズ開始時の処理（自動回復・行動済み解除）
  function startPhase(b, side) {
    b.phase = side;
    const ev = [];
    for (const u of alive(b, side)) {
      u.acted = false;
      if (u.regen && u.hp < u.maxhp) {
        const before = u.hp;
        u.hp = Math.min(u.maxhp, u.hp + u.regen);
        ev.push({ kind: 'heal', att: u.uid, def: u.uid, amount: u.hp - before });
      }
    }
    return ev;
  }

  function result(b) {
    if (alive(b, 'enemy').length === 0) return 'win';
    if (alive(b, 'player').length === 0) return 'lose';
    return null;
  }

  // ===== 敵AI =====
  // 行動計画 { to:{x,y}, path, action:{type:'attack'|'heal', target} | null }
  function planAI(b, u) {
    const res = u.ai === 'boss' ? reachable(b, u, 0) : reachable(b, u);
    let best = null;
    const consider = (score, v, action) => {
      if (!best || score > best.score) best = { score, to: { x: v.x, y: v.y }, action };
    };
    // 宝箱への関心：味方CPUは積極的に、敵は「ついでに」取る（どろぼう型は最優先）
    const greed = u.ai === 'boss' || u.ai === 'hold' ? 0 : u.side === 'player' ? 30 : u.ai === 'thief' ? 40 : 7;
    for (const v of res.stops.values()) {
      const tb = u.move === 'fly' ? { def: 0 } : TERRAIN[b.tiles[v.y][v.x]];
      const cb = greed && chestAt(b, v.x, v.y) ? greed : 0;
      if (cb) consider(cb - v.cost * 0.05, v, null);
      for (const t of targetsFrom(b, u, v.x, v.y)) {
        const f = forecast(b, u, t, v.x, v.y);
        let s = f.hit / 100 * f.dmg * 2;
        if (f.dmg >= t.hp) s += 40 * f.hit / 100;   // 倒せるなら優先
        if (f.counter) s -= f.counter.hit / 100 * f.counter.dmg * 0.8;
        if (t.heal) s += 4;                          // 回復役を狙う
        s += tb.def * 1.5 - v.cost * 0.05 + cb;
        consider(s, v, { type: 'attack', target: t });
      }
      for (const t of healTargetsFrom(b, u, v.x, v.y)) {
        const amt = Math.min(u.heal, t.maxhp - t.hp);
        if (amt < 4) continue;
        consider(amt * 1.5 + tb.def, v, { type: 'heal', target: t });
      }
    }
    if (best) return { to: best.to, path: pathTo(res, best.to.x, best.to.y), action: best.action };

    // 攻撃できない場合：待ち伏せ型・ボスはその場で待機
    if (u.ai === 'hold' || u.ai === 'boss') return { to: { x: u.x, y: u.y }, path: [], action: null };

    // どろぼう型は一番近い宝箱へ、それ以外は一番近い相手ユニットへ向かう
    const far = reachable(b, u, 999);
    let goal = null;
    if (u.ai === 'thief') {
      for (const c of b.chests) {
        if (c.state !== 'closed') continue;
        const v = far.stops.get(key(c.x, c.y));
        if (v && (!goal || v.cost < goal.cost)) goal = v;
      }
    }
    if (!goal) for (const p of alive(b, u.side === 'enemy' ? 'player' : 'enemy')) {
      for (const v of far.stops.values()) {
        const d = dist(v.x, v.y, p.x, p.y);
        if (d < u.rmin || d > u.rmax) continue;
        if (!goal || v.cost < goal.cost) goal = v;
      }
    }
    if (!goal) return { to: { x: u.x, y: u.y }, path: [], action: null };
    const full = pathTo(far, goal.x, goal.y);
    // 移動力の範囲で、パスに沿ってできるだけ進む
    let to = { x: u.x, y: u.y };
    for (const step of full) {
      const s = res.stops.get(key(step.x, step.y));
      if (far.all.get(key(step.x, step.y)).cost > u.mov) break;
      if (s) to = step;
    }
    return { to, path: pathTo(res, to.x, to.y), action: null };
  }

  return {
    key, dist, affinity, calcStats, chestAt, openChest, makeUnit, createBattle, alive, unitAt, byUid, terrain,
    reachable, pathTo, targetsFrom, healTargetsFrom, threatTiles, forecast, calcHit, calcDmg,
    doAttack, doHeal, startPhase, result, planAI, gainExp, defaultGain, MAX_LV,
  };
})();
