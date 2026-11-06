# メカムシ・タクティクス

スマホのブラウザで遊べる、昆虫ロボのターン制シミュレーションRPGです。
HTML / CSS / JavaScript のみ（ライブラリなし）。セーブはブラウザの localStorage に保存されます。

## 遊び方
- `index.html` をブラウザで開くだけで遊べます（ローカルなら `python3 -m http.server` で起動して `http://localhost:8000` を開くのがおすすめ）。
- ユニットをタップ → 青いマスへ移動 → 攻撃 / 回復 / 待機。
- 相性：牙 ▶ 甲 ▶ 翅 ▶ 牙（有利でダメージ1.3倍・命中+15）。

## GitHub Pages で公開する
1. このフォルダの中身を GitHub のリポジトリにアップロード（push）する
2. リポジトリの Settings → Pages → Source を「Deploy from a branch」、Branch を `main` / `(root)` にして Save
3. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で遊べます

## ファイル構成
| ファイル | 内容 |
|---|---|
| `index.html` | 画面の骨組み |
| `css/style.css` | 見た目 |
| `js/data.js` | 地形・兵種・武器・パーツ・ステージのデータ（調整はここ） |
| `js/engine.js` | 戦闘ルール・ダメージ計算・敵AI（画面に依存しない） |
| `js/save.js` | セーブ・装備・ショップ処理 |
| `js/art.js` | ユニットの絵（SVG） |
| `js/battle.js` | 戦闘画面の操作と演出 |
| `js/main.js` | タイトル・ストーリー・フリーバトル・編成・ショップ画面 |
| `test/` | 自動テスト（macOS: `sh test/run.sh test/test-battle.js` など） |
