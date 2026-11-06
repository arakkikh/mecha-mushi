// テスト用の簡易DOM（JavaScriptCoreで画面コードを動かすため）
(function () {
  const g = globalThis;
  const realST = g.setTimeout;
  g.setTimeout = (fn, ms) => realST(fn, 0); // 待ち時間をなくして高速化
  g.clearTimeout = () => {};
  g.requestAnimationFrame = fn => realST(fn, 0);

  class ClassList {
    constructor() { this.s = new Set(); }
    add(...c) { c.forEach(x => this.s.add(x)); }
    remove(...c) { c.forEach(x => this.s.delete(x)); }
    toggle(c, f) { if (f === undefined) f = !this.s.has(c); f ? this.s.add(c) : this.s.delete(c); return f; }
    contains(c) { return this.s.has(c); }
  }
  class El {
    constructor(tag) {
      this.tag = tag; this.children = []; this.parent = null; this.dataset = {};
      this.classList = new ClassList(); this._q = {}; this._html = ''; this.textContent = '';
      this.style = { setProperty() {} }; this.listeners = {}; this.disabled = false; this.offsetWidth = 0;
    }
    set className(v) { this.classList = new ClassList(); String(v).split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c)); }
    get className() { return [...this.classList.s].join(' '); }
    set innerHTML(v) { this._html = v; if (v === '') this.children = []; this._q = {}; }
    get innerHTML() { return this._html; }
    appendChild(c) { c.parent = this; this.children.push(c); return c; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
    querySelector(sel) { return this._q[sel] || (this._q[sel] = new El('q')); }
    querySelectorAll() { return []; }
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
    closest() { return this; }
  }
  const byId = {};
  g.document = {
    getElementById: id => byId[id] || (byId[id] = new El('div')),
    createElement: t => new El(t),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  g.window = { innerWidth: 390, innerHeight: 844, addEventListener() {} };
  g.innerWidth = 390; g.innerHeight = 844;
  g.localStorage = (() => {
    const m = {};
    return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
  })();
  g.console = g.console || { log: print };
  // 下部シート/モーダルのボタンを押す
  g.pressSheet = act => {
    const s = document.getElementById('sheet');
    if (!s.onclick) throw new Error('シートが開いていない: ' + act);
    s.onclick({ target: { closest: () => ({ dataset: { act }, disabled: false }) } });
  };
  g.pressModal = act => {
    const s = document.getElementById('modalBox');
    s.onclick({ target: { closest: () => ({ dataset: { act }, disabled: false }) } });
  };
  g.sheetHtml = () => document.getElementById('sheet')._html;
  g.sleep = () => new Promise(r => realST(r, 0));
})();
