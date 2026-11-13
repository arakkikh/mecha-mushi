# メカムシ・タクティクス

スマホのブラウザで遊べる、昆虫ロボのターン制シミュレーションRPGです。
HTML / CSS / JavaScript のみ（ライブラリなし）。セーブはブラウザの localStorage に保存されます。

## 遊び方
- `index.html` をブラウザで開くだけで遊べます（ローカルなら `python3 -m http.server` で起動して `http://localhost:8000` を開くのがおすすめ）。
- ユニットをタップ → 青いマスへ移動 → 攻撃 / 回復 / 待機。
- 相性：牙 ▶ 甲 ▶ 翅 ▶ 牙（有利でダメージ1.3倍・命中+15）。
- カード：行動メニューの「🃏カード」でデッキ（20枚）から1枚使える（使うと行動終了・1戦に1回ずつ・戦闘後に全部戻る）。攻撃カードはタップのミニゲームで威力0.6〜1.5倍（設定でオフ可）。タイトルの「🃏カード」でデッキ編集と図鑑。
- 宝箱：🎁のマスで行動を終えると開く。敵（特に「どろぼう型」）に先に止まられると取られる。取った宝箱はセーブされ、ステージ選択に「宝箱 2/3」と表示。

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
| `js/art.js` | ユニット・宝箱の絵（SVG） |
| `js/minigame.js` | 攻撃カードのミニゲーム |
| `js/battle.js` | 戦闘画面の操作と演出 |
| `js/main.js` | タイトル・ストーリー・フリーバトル・編成・ショップ画面 |
| `test/` | 自動テスト（macOS: `sh test/run.sh test/test-battle.js` など） |

## データの追加方法（js/data.js）
- 宝箱：ステージの `chests` に `{ x, y, get: { money: 300 } }` や `{ x, y, get: { item: 'drill_horn' } }` を足す。
  取得記録は配列の順番で保存するので、**新しい宝箱は末尾に追加**してください。
- カード：`CARDS` に1行足すだけで追加できます（`kind`/`rank`/`range`/`area`/`pow`/`heal`/`buff`/`status`/`warp` の意味は data.js のコメント参照）。
  ステージ初回クリアの報酬カードは `reward.cards`、宝箱は `get: { card: 'ID' }`。
- 敵の `ai`：`aggressive`（突撃）/ `hold`（待ち伏せ）/ `boss`（動かない）/ `thief`（宝箱どろぼう）。
