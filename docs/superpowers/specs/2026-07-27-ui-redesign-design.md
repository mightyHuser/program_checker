# Program Checker UI 再設計

## 背景・目的

現在のUIは以下の点で「使いづらい」と感じられている:

- 見た目・デザインが古い(ヘッダー/サイドバーは暗い灰色、メインエリアは白、色使いに一貫性がない)
- 画面レイアウトが窮屈(右ペインを「ソース(35%)/テスト設計(30%)/実行結果(35%)」に縦3分割固定しており、各エリアが狭い)

目指す方向性は **VSCode・IDE風** の見た目・操作感。既存のバックエンドAPI・データモデルは変更せず、フロントエンドのレイアウトとスタイリングのみを再設計する。

## スコープ

対象は `frontend/` 配下のみ。バックエンド(`backend/`)の変更は無し。

## 実装アプローチ

新規npm依存を追加しない。理由:

- コンポーネント数(5個)・総行数(約700行)の規模を考えると、Tabs/Popover専用ライブラリ(Radix UI等)やアイコンライブラリ(lucide-react等)を導入するのはオーバースペック
- Tailwind v4 が既に導入済みで `dark:` バリアントによるテーマ切替が標準機能として使える
- タブ・ポップオーバーは、既存の「手動でパスを入力」トグル(state で表示/非表示を切り替えるパターン)を流用すれば自作で十分
- アイコンは使用箇所が少数(フォルダ・歯車・太陽/月・チェック/バツ・時計程度)なので、手描きのインラインSVGで賄う

## 設計詳細

### 1. レイアウト構造 (`App.tsx`)

コードモード時、メインエリアを左右分割に変更する:

```
App (flex-col h-screen)
├─ Header (高さ固定)
└─ Body (flex flex-1)
   ├─ Sidebar (幅256px固定)
   └─ Main (flex-1 flex flex-col)
      ├─ ファイル名見出し (既存のまま)
      └─ Content (flex flex-1 min-h-0)
         ├─ 左: FileViewer (flex-1, 常に全高)
         └─ 右: TestPanel (幅固定 or flex基準、タブ切替)
```

「資料」モードのレイアウトは変更しない(PdfViewer/テキスト単独表示のまま)。

`selectedFile === "__COMMON__"` のときは FileViewer を表示せず、右側のテストタブのみを全幅で表示する(現行の挙動を踏襲)。

### 2. ヘッダー再設計

- 左: タイトル + 現在のディレクトリパス(`truncate`で省略表示、既存のまま)
- ディレクトリ関連コントロールをフォルダアイコン1つのボタンに集約する。クリックでポップオーバー(絶対配置のパネル)を開き、その中に:
  - 現在のパス表示
  - 「ディレクトリ選択 (エクスプローラー)」ボタン(既存のロジック・状態管理はそのまま)
  - 手動パス入力欄 + 「設定」ボタン(既存のロジックはそのまま)

  ポップオーバーの開閉は既存の `showManualDirInput` のような boolean state を1つ(`showDirMenu`)に統合し、外側クリックで閉じる処理を追加する。
- 右側: コード/資料切替(既存のセグメントコントロール)、共通テストチェック・一括実行ボタン(コードモード時のみ、既存のまま)、**テーマ切替ボタン(☀/🌙のインラインSVG)** を新設

### 3. サイドバー (`Sidebar.tsx`)

- 各ファイル行の右端に実行結果バッジを表示する:
  - PASS → 緑の丸
  - FAIL / ERROR → 赤の丸
  - TIMEOUT → 黄の丸
  - 未実行 → バッジなし
- バッジ用のデータは `App.tsx` 側で新たに `fileStatuses: Record<string, string>` という state を持ち、以下のタイミングで更新する:
  - `/api/grade` の実行結果を受け取ったとき(Runner内の runSingle/runAll の結果を親に伝播させる必要があるため、Runnerに `onResult` コールバックpropsを追加する)
  - `/api/batch` の一括実行結果を受け取ったとき(既存の `batchResults` から集計)
  - ファイル内に複数テストケースがある場合、そのファイルの「全テストがPASSならPASS、1つでもFAIL/ERRORがあればそちらを優先、TIMEOUTはFAIL/ERRORの次に優先」というルールでファイル単位のステータスに集約する
- 選択中ファイルのハイライトは、現状 `Sidebar.tsx` にある3箇所のinline style上書き(`style={{backgroundColor: ...}}`)を廃止し、Tailwindのクラス(`dark:`対応)に統一する

### 4. 右ペインのタブ化 (新規コンポーネント `TestPanel.tsx`)

`App.tsx` に直接書かれている「テスト設計」「実行結果」の描画を、新規コンポーネント `TestPanel.tsx` に切り出す。中身は既存の `TestManager` / `Runner` をそのまま呼び出すラッパーで、上部にタブヘッダー(「テスト設計」「実行結果」の2ボタン、アクティブ側を下線+文字色で強調)を持ち、選択中のタブに応じてどちらか一方だけを描画する。

タブの選択状態はファイル切り替えをまたいで保持してよい(ファイルを変えても直前に見ていたタブのまま)。

### 5. テーマ(ダーク/ライト)

- `frontend/tailwind.config.js` に `darkMode: 'class'` を設定
- `App.tsx` にテーマ用 state (`theme: "light" | "dark"`) を持ち、`<html>` 要素に `dark` クラスを付け外しする。初期値は `localStorage` に保存された値、無ければ `prefers-color-scheme` を見て決定
- 配色方針:
  - ダーク: 背景 `#1e1e1e` 系、パネル `#252526` 系、ボーダー `#3c3c3c`、アクセント青 `#007acc` 系(VSCode Dark+ 相当)
  - ライト: 現行の白ベースを踏襲しつつ、ヘッダー/サイドバーの暗い灰色をライトテーマでは明るいグレー系に統一
- 各コンポーネントのクラスに `dark:` バリアントを追加していく。ハードコードされた `style={{backgroundColor: ...}}` (Sidebarの選択ハイライト等)はこの作業と合わせてクラスベースに置き換える
- `FileViewer.tsx` のシンタックスハイライトテーマ(`vs2015`)はダークモード時はそのまま、ライトモード時は明るいテーマ(例: `vs`)に切り替える

## 影響範囲・変更ファイル

- `frontend/tailwind.config.js` — `darkMode: 'class'` 追加
- `frontend/src/App.tsx` — レイアウト再構成、ヘッダー再設計、テーマstate、fileStatuses state
- `frontend/src/components/Sidebar.tsx` — バッジ表示、ハイライトのクラス化、dark対応
- `frontend/src/components/TestPanel.tsx` — 新規(TestManager/Runnerのタブラッパー)
- `frontend/src/components/Runner.tsx` — `onResult` コールバックprops追加、dark対応
- `frontend/src/components/TestManager.tsx` — dark対応
- `frontend/src/components/FileViewer.tsx` — テーマに応じたシンタックスハイライトテーマ切替
- `frontend/src/components/PdfViewer.tsx` — dark対応(最小限)

バックエンド(`backend/`)は変更なし。API契約(リクエスト/レスポンスの形)も変更なし。

## テスト・検証方針

- `npm run build` / `npm run lint` が通ることを確認
- Playwright (Chrome) で以下を実機ブラウザ操作により確認:
  - テーマ切替ボタンでダーク/ライトが切り替わり、リロード後も保持される
  - ヘッダーのフォルダアイコン → ポップオーバー展開 → 手動パス入力でディレクトリ変更ができる
  - 右ペインの「テスト設計」⇔「実行結果」タブ切替が機能する
  - テストケースを実行後、サイドバーの該当ファイルにPASS/FAILバッジが表示される
  - 一括実行後、複数ファイルのバッジが結果に応じて更新される
- バックエンドAPIは変更しないため、`verify_backend.py` / `verify_directory_api.py` は念のため1回だけ再実行して回帰がないことを確認する
