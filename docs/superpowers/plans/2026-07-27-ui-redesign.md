# Program Checker UI 再設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `frontend/` の UI を VSCode/IDE 風の見た目・レイアウトに再設計し、ダーク/ライトテーマ切替とサイドバーへの実行結果バッジ表示を追加する。

**Architecture:** バックエンド(`backend/`)は一切変更しない。フロントエンドは既存の5コンポーネント(App, Sidebar, FileViewer, TestManager, Runner, PdfViewer)を土台に、新規コンポーネント `TestPanel`(テスト設計/実行結果のタブラッパー)を1つ追加する。状態管理は引き続き `App.tsx` のトップレベル `useState` のみで行い、新規の状態管理ライブラリは導入しない。

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4(`@tailwindcss/postcss`)。新規npm依存は追加しない。

## Global Constraints

- 新規npm依存を追加しない(アイコンはインラインSVG、タブ/ポップオーバーは自作)
- バックエンドAPIの契約(リクエスト/レスポンス形状)を変更しない
- 既存のURL `http://localhost:8000` へのハードコードされたアクセス方法は変更しない(既存コードの踏襲)
- 各タスックの最後に `npm run build` と `npm run lint` が通ることを確認してからコミットする
- Tailwind v4 のダークモードは **`tailwind.config.js` の `darkMode` キーではなく**、`src/index.css` に `@custom-variant dark (&:where(.dark, .dark *));` を書く方式を使う(v3の設定方法は効かないことを実機検証済み)

---

## 事前検証済みの事実(実装者向け注記)

このプロジェクトは `tailwindcss@4.1.17` を使っているが、`src/index.css` は v3 形式の `@tailwind base; @tailwind components; @tailwind utilities;` のままになっている。この状態でも見た目は動くが、`@custom-variant` によるダークモード拡張が効かないことを実機ビルドで確認済み。Task 1 で `@import "tailwindcss";` 形式に書き換える。

---

### Task 1: Tailwind v4 ダーク基盤の切替 + テーマ切替の状態管理

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: `theme: "light" | "dark"` state と `toggleTheme()` 関数(以降の全タスクが `theme` を参照する)。`<html>` 要素に `dark` クラスが付け外しされることで、以降のタスクで追加する `dark:` バリアントのクラスが機能するようになる。

- [ ] **Step 1: `index.css` を Tailwind v4 の書式に変更する**

`frontend/src/index.css` の内容を丸ごと以下に置き換える:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

- [ ] **Step 2: ビルドしてエラーが出ないことを確認**

Run: `cd frontend && npm run build`
Expected: エラーなく `✓ built in ...` が出力される

- [ ] **Step 3: `App.tsx` にテーマの state と永続化ロジックを追加する**

`frontend/src/App.tsx` の `const lastDirStatusRef = useRef<string>("idle");` の直後、`useEffect(() => { fetchDirectory(); ...` の直前に以下を追加する:

```tsx
  // 画面のダーク/ライトテーマ。localStorageに保存し次回起動時も復元する。
  // 保存値が無ければOSの設定(prefers-color-scheme)に従う。
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };
```

- [ ] **Step 4: Appシェルのルート要素にダーク対応クラスを追加する**

`frontend/src/App.tsx` の return 文冒頭を変更する。

old:
```tsx
    <div className="flex h-screen bg-gray-100 overflow-hidden flex-col">
```
new:
```tsx
    <div className="flex h-screen bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden flex-col">
```

- [ ] **Step 5: ヘッダー右端にテーマ切替ボタンを追加する**

ヘッダー内、`{viewMode === "code" && (...)}` ブロックの直後、ヘッダー全体を閉じる `</div>` の前に以下を挿入する(挿入位置は「共通テストで実行」チェックボックスと「全ファイル一括実行」ボタンを含むブロックの直後、`flex-1 flex gap-2 items-center` を閉じる `</div>` の直前)。

old:
```tsx
            {viewMode === "code" && (
              <>
                <label className="flex items-center gap-1 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useCommonTests}
                    onChange={(e) => setUseCommonTests(e.target.checked)}
                    className="mr-1"
                  />
                  共通テストで実行
                </label>
                <button
                  onClick={handleBatchRun}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold whitespace-nowrap disabled:bg-gray-500"
                  disabled={!files.length || batchRunning}
                >
                  {batchRunning ? "実行中..." : "全ファイル一括実行"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
```
new:
```tsx
            {viewMode === "code" && (
              <>
                <label className="flex items-center gap-1 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useCommonTests}
                    onChange={(e) => setUseCommonTests(e.target.checked)}
                    className="mr-1"
                  />
                  共通テストで実行
                </label>
                <button
                  onClick={handleBatchRun}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold whitespace-nowrap disabled:bg-gray-500"
                  disabled={!files.length || batchRunning}
                >
                  {batchRunning ? "実行中..." : "全ファイル一括実行"}
                </button>
              </>
            )}
          </div>
          <button
            onClick={toggleTheme}
            aria-label="テーマ切替"
            title={theme === "light" ? "ダークモードに切替" : "ライトモードに切替"}
            className="p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white"
          >
            {theme === "light" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
```

(このボタンの配色 `hover:bg-gray-700 text-gray-300` はヘッダーがまだ常時ダーク配色のままである前提のもの。Task 2 でヘッダー全体をライト/ダーク両対応に書き換える際に、このボタンの配色も合わせて更新する。)

- [ ] **Step 6: ビルド・lintを実行**

Run: `npm run build && npm run lint`
Expected: 両方エラーなし(既存の2件のReact Hooks警告のみが残るのはOK)

- [ ] **Step 7: 実ブラウザで動作確認**

バックエンドを起動: `cd backend && source .venv/bin/activate && python main.py &`
フロントエンドを起動: `cd frontend && npm run dev &`

Playwrightで:
1. `http://localhost:5173` に navigate
2. `browser_snapshot` で `aria-label="テーマ切替"` のボタンを見つける
3. そのボタンを `browser_click`
4. `browser_evaluate` で `document.documentElement.classList.contains('dark')` が `true` になっていることを確認
5. `browser_evaluate` で `getComputedStyle(document.querySelector('.flex.h-screen')).backgroundColor` が `rgb(30, 30, 30)`(`#1e1e1e`)になっていることを確認
6. ページを `browser_navigate` で再読み込みし、`dark` クラスが保持されていることを再確認(localStorage永続化の確認)
7. もう一度クリックしてライトモードに戻ることも確認

確認後、起動したバックエンド・フロントエンドのプロセスを停止する。

- [ ] **Step 8: コミット**

```bash
cd /Users/hosonumamaito/program_checker
git add frontend/src/index.css frontend/src/App.tsx
git commit -m "feat(frontend): Tailwind v4ダーク基盤とテーマ切替ボタンを追加"
```

---

### Task 2: ヘッダーのディレクトリ関連コントロールをポップオーバーに集約 + ヘッダー全体のダーク対応

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: Task 1 の `theme` state, `toggleTheme()` (テーマボタンの配色をここで最終形にする)
- Produces: `showDirMenu` state(ポップオーバーの開閉)。後続タスクはこのタスクの見た目を変更しない。

- [ ] **Step 1: state宣言を変更する**

old:
```tsx
  const [showManualDirInput, setShowManualDirInput] = useState(false);
```
new:
```tsx
  const [showDirMenu, setShowDirMenu] = useState(false);
```

- [ ] **Step 2: `handleManualDirectorySubmit` 内の参照を更新する**

old:
```tsx
      setCurrentDir(res.data.path);
      setManualPathInput("");
      setShowManualDirInput(false);
```
new:
```tsx
      setCurrentDir(res.data.path);
      setManualPathInput("");
      setShowDirMenu(false);
```

- [ ] **Step 3: ヘッダーのJSXを丸ごと書き換える**

`{/* Header / Directory Selection */}` コメントから、ヘッダーの outer `<div>` を閉じる `</div>`(その直後に `<div className="flex flex-1 overflow-hidden">` が続く箇所)までを、以下で置き換える:

```tsx
      {/* Header */}
      <div className="bg-gray-200 dark:bg-[#252526] text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-[#3c3c3c] p-2 flex items-center gap-4 shadow-md z-20">
        <div className="font-bold text-lg">Program Checker</div>

        <div className="relative">
          <button
            onClick={() => setShowDirMenu((v) => !v)}
            title="作業ディレクトリを変更"
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-[#3c3c3c] text-sm max-w-xs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 flex-shrink-0"
            >
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            </svg>
            <span className="truncate">{currentDir || "ディレクトリ未選択"}</span>
          </button>

          {showDirMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowDirMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-96 bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-[#3c3c3c] rounded shadow-lg z-30 p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 break-all">
                  現在: {currentDir}
                </div>
                <button
                  onClick={handleSelectDirectory}
                  disabled={dirSelecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-3 py-1.5 rounded text-sm font-bold mb-2"
                >
                  {dirSelecting ? "選択中..." : "ディレクトリ選択 (エクスプローラー)"}
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  手動でパスを入力
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={manualPathInput}
                    onChange={(e) => setManualPathInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleManualDirectorySubmit();
                    }}
                    placeholder="/path/to/directory"
                    className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 dark:border-[#3c3c3c] bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={handleManualDirectorySubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
                  >
                    設定
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 flex gap-2 items-center justify-end">
          {/* Mode Switcher */}
          <div className="flex bg-gray-300 dark:bg-[#3c3c3c] rounded p-1">
            <button
              className={`px-3 py-1 rounded text-sm font-bold ${
                viewMode === "code"
                  ? "bg-white dark:bg-[#1e1e1e] shadow text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a4a4a]"
              }`}
              onClick={() => setViewMode("code")}
            >
              コード
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-bold ${
                viewMode === "doc"
                  ? "bg-white dark:bg-[#1e1e1e] shadow text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a4a4a]"
              }`}
              onClick={() => setViewMode("doc")}
            >
              資料
            </button>
          </div>

          {viewMode === "code" && (
            <div className="flex items-center gap-2 ml-2 border-l border-gray-300 dark:border-[#3c3c3c] pl-4">
              <label className="flex items-center gap-1 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useCommonTests}
                  onChange={(e) => setUseCommonTests(e.target.checked)}
                  className="mr-1"
                />
                共通テストで実行
              </label>
              <button
                onClick={handleBatchRun}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-bold whitespace-nowrap disabled:bg-gray-500"
                disabled={!files.length || batchRunning}
              >
                {batchRunning ? "実行中..." : "全ファイル一括実行"}
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            aria-label="テーマ切替"
            title={theme === "light" ? "ダークモードに切替" : "ライトモードに切替"}
            className="p-2 rounded hover:bg-gray-300 dark:hover:bg-[#3c3c3c] text-gray-600 dark:text-gray-300"
          >
            {theme === "light" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
```

- [ ] **Step 4: ビルド・lintを実行**

Run: `npm run build && npm run lint`
Expected: 両方エラーなし

- [ ] **Step 5: 実ブラウザで動作確認**

backend/frontendを起動し、Playwrightで:
1. navigate後、ヘッダーのフォルダアイコンボタンをクリック → ポップオーバーが開くことを `browser_snapshot` で確認
2. ポップオーバー内の手動パス入力欄に `/Users/hosonumamaito/program_checker` を入力しEnter → ディレクトリが切り替わり、ポップオーバーが自動的に閉じ、サイドバーのファイル一覧が更新されることを確認
3. 再度フォルダアイコンをクリックしてポップオーバーを開き、ポップオーバーの外側(例: サイドバー領域)をクリック → ポップオーバーが閉じることを確認
4. テーマ切替ボタンでダーク/ライト双方に切り替え、ヘッダーの背景色が theme に応じて変わることを目視確認(スクリーンショットを撮って確認してよい)

- [ ] **Step 6: コミット**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): ヘッダーのディレクトリ操作をポップオーバーに集約しダーク対応"
```

---

### Task 3: メインレイアウトを左右分割に変更 + 右ペインのタブ化(TestPanel新設)

**Files:**
- Create: `frontend/src/components/TestPanel.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: `TestPanel` コンポーネント。Props:
  ```ts
  interface TestPanelProps {
    filename: string;
    designTestCases: TestCase[];
    runTestCases: TestCase[];
    onUpdateTestCases: (testCases: TestCase[]) => void;
    isCommon?: boolean;
    externalResult?: BatchResult;
    extraLabel?: string;
  }
  ```
  (`TestCase` / `BatchResult` の形は既存の `TestManager` / `Runner` の props型と同じ)

- [ ] **Step 1: `TestPanel.tsx` を新規作成する**

`frontend/src/components/TestPanel.tsx`:

```tsx
import React, { useState } from "react";
import TestManager from "./TestManager";
import Runner from "./Runner";

interface TestCase {
  input_data: string;
  expected_output: string;
  run_only?: boolean;
}

interface BatchResult {
  filename: string;
  results?: {
    test_case: number;
    status: string;
    execution_time: number;
    output: string;
    error: string;
    diff?: string;
  }[];
}

interface TestPanelProps {
  filename: string;
  designTestCases: TestCase[];
  runTestCases: TestCase[];
  onUpdateTestCases: (testCases: TestCase[]) => void;
  isCommon?: boolean;
  externalResult?: BatchResult;
  extraLabel?: string;
}

const TestPanel: React.FC<TestPanelProps> = ({
  filename,
  designTestCases,
  runTestCases,
  onUpdateTestCases,
  isCommon = false,
  externalResult,
  extraLabel,
}) => {
  const [activeTab, setActiveTab] = useState<"design" | "result">("design");

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e]">
      {!isCommon && (
        <div className="flex border-b border-gray-300 dark:border-[#3c3c3c] bg-gray-100 dark:bg-[#252526]">
          <button
            onClick={() => setActiveTab("design")}
            className={`px-4 py-2 text-sm font-bold border-b-2 ${
              activeTab === "design"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            テスト設計
          </button>
          <button
            onClick={() => setActiveTab("result")}
            className={`px-4 py-2 text-sm font-bold border-b-2 ${
              activeTab === "result"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            実行結果 {extraLabel}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isCommon || activeTab === "design" ? (
          <TestManager
            testCases={designTestCases}
            onUpdate={onUpdateTestCases}
            isCommon={isCommon}
          />
        ) : (
          <Runner
            filename={filename}
            testCases={runTestCases}
            externalResult={externalResult}
          />
        )}
      </div>
    </div>
  );
};

export default TestPanel;
```

- [ ] **Step 2: `App.tsx` のimportを `TestPanel` に差し替える**

Step 3 でコードモードのJSXを書き換えると、`App.tsx` は `TestManager` / `Runner` を直接使わなくなる(`TestPanel` が内部でこの2つをimportして使う)。`tsconfig.app.json` で `noUnusedLocals: true` が設定されているため、未使用のimportを残すと `npm run build` の `tsc -b` がエラーになる。そのため、この時点で `TestManager` / `Runner` のimportを削除し `TestPanel` のimportに差し替える。

old:
```tsx
import TestManager from "./components/TestManager";
import Runner from "./components/Runner";
import PdfViewer from "./components/PdfViewer";
```
new:
```tsx
import PdfViewer from "./components/PdfViewer";
import TestPanel from "./components/TestPanel";
```

- [ ] **Step 3: コードモードの3分割レイアウトを左右分割+タブに置き換える**

`selectedFile ? (` から始まる、コードモードのファイル表示ブロック(「3-Pane Layout」コメントを含む部分)を、以下で置き換える。

old:
```tsx
              <div className="flex flex-col h-full">
                <div className="bg-white border-b border-gray-200 px-4 py-2">
                  <h1 className="font-bold text-lg">{selectedFile}</h1>
                </div>

                {/* 3-Pane Layout: Viewer (Top), TestManager (Middle), Runner (Bottom) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* File Viewer (35%) - Hide for Common Settings */}
                  {selectedFile !== "__COMMON__" && (
                    <div className="h-[35%] overflow-hidden border-b border-gray-200 flex flex-col">
                      <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        ソースコード
                      </div>
                      <div className="flex-1 overflow-auto">
                        <FileViewer content={fileContent} />
                      </div>
                    </div>
                  )}

                  {/* Test Manager (30% or 100% if Common) */}
                  <div
                    className={`${
                      selectedFile === "__COMMON__" ? "h-full" : "h-[30%]"
                    } overflow-hidden border-b border-gray-200 flex flex-col`}
                  >
                    <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                      {selectedFile === "__COMMON__"
                        ? "共通テスト設計"
                        : "テスト設計"}
                    </div>
                    <div className="flex-1 overflow-auto">
                      <TestManager
                        testCases={testCases}
                        onUpdate={handleUpdateTestCases}
                        isCommon={selectedFile === "__COMMON__"}
                      />
                    </div>
                  </div>

                  {/* Runner (35%) - Hide for Common Settings */}
                  {selectedFile !== "__COMMON__" && (
                    <div className="h-[35%] overflow-hidden flex flex-col">
                      <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        実行結果 {useCommonTests ? "(共通テスト)" : ""}
                      </div>
                      <div className="flex-1 overflow-auto">
                        <Runner
                          filename={selectedFile}
                          testCases={
                            useCommonTests ? commonTestCases : testCases
                          }
                          externalResult={currentBatchResult}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
```
new:
```tsx
              <div className="flex flex-col h-full">
                <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#3c3c3c] px-4 py-2">
                  <h1 className="font-bold text-lg">{selectedFile}</h1>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {selectedFile !== "__COMMON__" && (
                    <div className="w-1/2 min-w-0 overflow-hidden border-r border-gray-200 dark:border-[#3c3c3c] flex flex-col">
                      <div className="bg-gray-100 dark:bg-[#252526] px-2 py-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                        ソースコード
                      </div>
                      <div className="flex-1 overflow-auto">
                        <FileViewer content={fileContent} />
                      </div>
                    </div>
                  )}

                  <div
                    className={`${
                      selectedFile === "__COMMON__" ? "w-full" : "w-1/2"
                    } min-w-0 overflow-hidden flex flex-col`}
                  >
                    <TestPanel
                      filename={selectedFile}
                      designTestCases={testCases}
                      runTestCases={useCommonTests ? commonTestCases : testCases}
                      onUpdateTestCases={handleUpdateTestCases}
                      isCommon={selectedFile === "__COMMON__"}
                      externalResult={currentBatchResult}
                      extraLabel={useCommonTests ? "(共通テスト)" : ""}
                    />
                  </div>
                </div>
              </div>
```

- [ ] **Step 4: ビルド・lintを実行**

Run: `npm run build && npm run lint`
Expected: 両方エラーなし。ビルドエラーが出る場合、`TestManager` / `Runner` の未使用import(Step 2の注記)が原因の可能性が高いので確認する。

- [ ] **Step 5: 実ブラウザで動作確認**

backend/frontendを起動し、Playwrightで:
1. `.py` ファイルを1つ選択 → 左半分にソースコードが全高で表示され、右半分に「テスト設計」「実行結果」タブが表示されることを確認
2. 「実行結果」タブをクリック → Runnerの内容(全テスト実行ボタン等)に切り替わることを確認
3. 「テスト設計」タブに戻す → 元のテストケース編集画面に戻ることを確認
4. 実際にテストケースを1件実行し、「実行結果」タブでPASS/FAILが表示されることを確認(既存機能が壊れていないことの回帰確認)
5. サイドバーで「★ 共通設定」を選択 → ソースコード欄が非表示になり、タブも表示されず、テスト設計画面が全幅で表示されることを確認

- [ ] **Step 6: コミット**

```bash
git add frontend/src/components/TestPanel.tsx frontend/src/App.tsx
git commit -m "feat(frontend): メインレイアウトを左右分割にし右ペインをタブ化"
```

---

### Task 4: 実行結果のファイル単位集約とサイドバーへのバッジ表示

**Files:**
- Modify: `frontend/src/components/Runner.tsx`
- Modify: `frontend/src/components/TestPanel.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: Task 3 の `TestPanel` props
- Produces: `Runner` の新規 optional prop `onResult?: (filename: string, results: ExecutionResult[]) => void`。`Sidebar` の新規 optional prop `fileStatuses?: Record<string, string>`。`App.tsx` の `fileStatuses` state と `aggregateStatus()` ヘルパー(戻り値は `"PASS" | "FAIL" | "TIMEOUT" | undefined`)。

- [ ] **Step 1: `Runner.tsx` の props型に `onResult` を追加する**

old:
```tsx
interface RunnerProps {
  filename: string;
  testCases: TestCase[];
  externalResult?: {
    filename: string;
    results?: {
      test_case: number;
      status: string;
      execution_time: number;
      output: string;
      error: string;
      diff?: string;
    }[];
  };
}
```
new:
```tsx
interface RunnerProps {
  filename: string;
  testCases: TestCase[];
  externalResult?: {
    filename: string;
    results?: {
      test_case: number;
      status: string;
      execution_time: number;
      output: string;
      error: string;
      diff?: string;
    }[];
  };
  onResult?: (filename: string, results: ExecutionResult[]) => void;
}
```

- [ ] **Step 2: コンポーネントの分割代入に `onResult` を追加する**

old:
```tsx
const Runner: React.FC<RunnerProps> = ({
  filename,
  testCases,
  externalResult,
}) => {
```
new:
```tsx
const Runner: React.FC<RunnerProps> = ({
  filename,
  testCases,
  externalResult,
  onResult,
}) => {
```

- [ ] **Step 3: `runSingle` で結果確定後に `onResult` を呼ぶ**

old:
```tsx
      setResults((prev) => ({ ...prev, [index]: response.data }));
    } catch (error) {
      console.error("Error running code:", error);
      alert("Error running code");
    } finally {
      setLoading(false);
    }
  };
```
new:
```tsx
      const updated = { ...results, [index]: response.data };
      setResults(updated);
      onResult?.(filename, Object.values(updated));
    } catch (error) {
      console.error("Error running code:", error);
      alert("Error running code");
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: `runAll` で結果確定後に `onResult` を呼ぶ**

old:
```tsx
    setResults(newResults);
    setLoading(false);
  };

  return (
```
new:
```tsx
    setResults(newResults);
    setLoading(false);
    onResult?.(filename, Object.values(newResults));
  };

  return (
```

- [ ] **Step 5: `TestPanel.tsx` に `onResult` propを追加し `Runner` に渡す**

`frontend/src/components/TestPanel.tsx` の props型・分割代入・Runner呼び出しを変更する。

old:
```tsx
interface TestPanelProps {
  filename: string;
  designTestCases: TestCase[];
  runTestCases: TestCase[];
  onUpdateTestCases: (testCases: TestCase[]) => void;
  isCommon?: boolean;
  externalResult?: BatchResult;
  extraLabel?: string;
}

const TestPanel: React.FC<TestPanelProps> = ({
  filename,
  designTestCases,
  runTestCases,
  onUpdateTestCases,
  isCommon = false,
  externalResult,
  extraLabel,
}) => {
```
new:
```tsx
interface TestPanelProps {
  filename: string;
  designTestCases: TestCase[];
  runTestCases: TestCase[];
  onUpdateTestCases: (testCases: TestCase[]) => void;
  isCommon?: boolean;
  externalResult?: BatchResult;
  extraLabel?: string;
  onResult?: (filename: string, results: { status: string }[]) => void;
}

const TestPanel: React.FC<TestPanelProps> = ({
  filename,
  designTestCases,
  runTestCases,
  onUpdateTestCases,
  isCommon = false,
  externalResult,
  extraLabel,
  onResult,
}) => {
```

old:
```tsx
          <Runner
            filename={filename}
            testCases={runTestCases}
            externalResult={externalResult}
          />
```
new:
```tsx
          <Runner
            filename={filename}
            testCases={runTestCases}
            externalResult={externalResult}
            onResult={onResult}
          />
```

- [ ] **Step 6: `App.tsx` に `fileStatuses` state と集約ロジックを追加する**

old:
```tsx
  const [batchResults, setBatchResults] = useState<BatchFileResult[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
```
new:
```tsx
  const [batchResults, setBatchResults] = useState<BatchFileResult[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);

  // ファイルごとの最新実行結果("PASS" | "FAIL" | "TIMEOUT")。サイドバーのバッジ表示に使う。
  const [fileStatuses, setFileStatuses] = useState<
    Record<string, "PASS" | "FAIL" | "TIMEOUT">
  >({});

  // 複数テストケースの結果を1つのファイルステータスに集約する。
  // 優先順位: FAIL/ERRORが1つでもあればFAIL、次にTIMEOUT、全てPASSならPASS。
  const aggregateStatus = (
    statuses: string[]
  ): "PASS" | "FAIL" | "TIMEOUT" | undefined => {
    if (statuses.length === 0) return undefined;
    if (statuses.some((s) => s === "FAIL" || s === "ERROR")) return "FAIL";
    if (statuses.some((s) => s === "TIMEOUT")) return "TIMEOUT";
    if (statuses.every((s) => s === "PASS")) return "PASS";
    return undefined;
  };

  // Runnerで個別実行/全テスト実行した結果を、ファイル単位のステータスに反映する。
  const handleFileResult = (
    filename: string,
    results: { status: string }[]
  ) => {
    const agg = aggregateStatus(results.map((r) => r.status));
    if (agg) {
      setFileStatuses((prev) => ({ ...prev, [filename]: agg }));
    }
  };
```

- [ ] **Step 7: `handleBatchRun` で一括実行結果からもファイルステータスを更新する**

old:
```tsx
  const handleBatchRun = async () => {
    if (!files.length) return;
    setBatchRunning(true);
    try {
      const res = await axios.post("http://localhost:8000/api/batch", {
        filenames: files,
        use_common: useCommonTests,
      });
      setBatchResults(res.data.batch_results);
      alert("一括実行が完了しました。");
    } catch (err) {
      console.error("Batch run failed", err);
      alert("一括実行に失敗しました。");
    } finally {
      setBatchRunning(false);
    }
  };
```
new:
```tsx
  const handleBatchRun = async () => {
    if (!files.length) return;
    setBatchRunning(true);
    try {
      const res = await axios.post("http://localhost:8000/api/batch", {
        filenames: files,
        use_common: useCommonTests,
      });
      const batchFileResults: BatchFileResult[] = res.data.batch_results;
      setBatchResults(batchFileResults);

      const newStatuses: Record<string, "PASS" | "FAIL" | "TIMEOUT"> = {};
      for (const r of batchFileResults) {
        if (r.results && r.results.length > 0) {
          const agg = aggregateStatus(r.results.map((tr) => tr.status));
          if (agg) newStatuses[r.filename] = agg;
        }
      }
      setFileStatuses((prev) => ({ ...prev, ...newStatuses }));

      alert("一括実行が完了しました。");
    } catch (err) {
      console.error("Batch run failed", err);
      alert("一括実行に失敗しました。");
    } finally {
      setBatchRunning(false);
    }
  };
```

- [ ] **Step 8: `Sidebar` と `TestPanel` の呼び出しに新規propsを渡す**

old:
```tsx
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          viewMode={viewMode}
        />
```
new:
```tsx
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          viewMode={viewMode}
          fileStatuses={fileStatuses}
        />
```

old:
```tsx
                    <TestPanel
                      filename={selectedFile}
                      designTestCases={testCases}
                      runTestCases={useCommonTests ? commonTestCases : testCases}
                      onUpdateTestCases={handleUpdateTestCases}
                      isCommon={selectedFile === "__COMMON__"}
                      externalResult={currentBatchResult}
                      extraLabel={useCommonTests ? "(共通テスト)" : ""}
                    />
```
new:
```tsx
                    <TestPanel
                      filename={selectedFile}
                      designTestCases={testCases}
                      runTestCases={useCommonTests ? commonTestCases : testCases}
                      onUpdateTestCases={handleUpdateTestCases}
                      isCommon={selectedFile === "__COMMON__"}
                      externalResult={currentBatchResult}
                      extraLabel={useCommonTests ? "(共通テスト)" : ""}
                      onResult={handleFileResult}
                    />
```

- [ ] **Step 9: `Sidebar.tsx` を書き換えてバッジ表示 + クラスベースのハイライトに統一する**

`frontend/src/components/Sidebar.tsx` の内容を丸ごと以下に置き換える(既存の3箇所のinline style上書きを廃止する):

```tsx
import React from "react";

interface SidebarProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
  viewMode: "code" | "doc";
  fileStatuses?: Record<string, string>;
}

const statusBadgeClass: Record<string, string> = {
  PASS: "bg-green-500",
  FAIL: "bg-red-500",
  TIMEOUT: "bg-yellow-500",
};

const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onSelectFile,
  viewMode,
  fileStatuses = {},
}) => {
  return (
    <div className="w-64 bg-gray-100 dark:bg-[#252526] text-gray-800 dark:text-gray-200 h-screen overflow-y-auto flex-shrink-0 border-r border-gray-300 dark:border-[#3c3c3c]">
      <div className="p-4 font-bold text-xl border-b border-gray-300 dark:border-[#3c3c3c]">
        Program Checker
      </div>
      <ul>
        {viewMode === "code" && (
          <li
            className={`p-3 cursor-pointer border-b border-gray-300 dark:border-[#3c3c3c] font-bold text-yellow-600 dark:text-yellow-400 transition-colors ${
              selectedFile === "__COMMON__"
                ? "bg-gray-300 dark:bg-[#37373d]"
                : "hover:bg-gray-200 dark:hover:bg-[#2a2d2e]"
            }`}
            onClick={() => onSelectFile("__COMMON__")}
          >
            ★ 共通設定
          </li>
        )}
        {files.map((file) => (
          <li
            key={file}
            className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-2 ${
              selectedFile === file
                ? "bg-gray-300 dark:bg-[#37373d] font-bold text-gray-900 dark:text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2d2e]"
            }`}
            onClick={() => onSelectFile(file)}
          >
            <span className="truncate">{file}</span>
            {fileStatuses[file] && (
              <span
                title={fileStatuses[file]}
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  statusBadgeClass[fileStatuses[file]] || "bg-gray-400"
                }`}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
```

- [ ] **Step 10: ビルド・lintを実行**

Run: `npm run build && npm run lint`
Expected: 両方エラーなし

- [ ] **Step 11: 実ブラウザで動作確認**

backend/frontendを起動し、Playwrightで:
1. `test_pass.py` 相当のファイル(標準入力を2倍して出力するようなもの)を選択し、期待値を正しい値にしてテストケースを1件実行 → サイドバーの該当ファイル行に**緑のバッジ**が表示されることを確認
2. 期待値をわざと間違えて再実行(FAILさせる) → バッジが**赤**に変わることを確認
3. 別のファイル(テストケース未設定でも可)を選択し「全ファイル一括実行」を実行 → 一括実行対象になった複数ファイルのバッジが、それぞれの結果に応じて更新されることを確認(タブが「テスト設計」のままでもバッジは更新されること = Runnerが表示されていないファイルの結果もバッジに反映されることの確認)

- [ ] **Step 12: コミット**

```bash
git add frontend/src/components/Runner.tsx frontend/src/components/TestPanel.tsx frontend/src/App.tsx frontend/src/components/Sidebar.tsx
git commit -m "feat(frontend): 実行結果をファイル単位で集約しサイドバーにバッジ表示"
```

---

### Task 5: 残りコンポーネント(FileViewer / TestManager / Runner / PdfViewer)のダーク対応

**Files:**
- Modify: `frontend/src/components/FileViewer.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/TestManager.tsx`
- Modify: `frontend/src/components/Runner.tsx`
- Modify: `frontend/src/components/PdfViewer.tsx`

**Interfaces:**
- Consumes: Task 1 の `theme` state
- Produces: `FileViewer` の新規 optional prop `theme?: "light" | "dark"`(デフォルト `"dark"` で既存呼び出し元との後方互換を保つ)

- [ ] **Step 1: `FileViewer.tsx` に `theme` propを追加しシンタックスハイライトのテーマを切り替える**

`frontend/src/components/FileViewer.tsx` の内容を丸ごと以下に置き換える:

```tsx
import React from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import { vs2015, vs } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("python", python);

interface FileViewerProps {
  content: string;
  language?: string;
  theme?: "light" | "dark";
}

const FileViewer: React.FC<FileViewerProps> = ({
  content,
  language = "python",
  theme = "dark",
}) => {
  return (
    <div
      className={`h-full overflow-auto ${
        theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"
      }`}
    >
      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? vs2015 : vs}
        showLineNumbers={true}
        customStyle={{ margin: 0, height: "100%" }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

export default FileViewer;
```

- [ ] **Step 2: `App.tsx` の2箇所の `FileViewer` 呼び出しに `theme` を渡す**

old (コードモード側):
```tsx
                      <div className="flex-1 overflow-auto">
                        <FileViewer content={fileContent} />
                      </div>
```
new:
```tsx
                      <div className="flex-1 overflow-auto">
                        <FileViewer content={fileContent} theme={theme} />
                      </div>
```

old (資料モードのtxt表示側):
```tsx
                    <div className="flex-1 overflow-auto">
                      <FileViewer content={fileContent} language="text" />
                    </div>
```
new:
```tsx
                    <div className="flex-1 overflow-auto">
                      <FileViewer
                        content={fileContent}
                        language="text"
                        theme={theme}
                      />
                    </div>
```

- [ ] **Step 3: `App.tsx` の残りの素のライト色クラスにダーク対応を追加する**

old:
```tsx
                  <div className="flex flex-col h-full">
                    <div className="bg-white border-b border-gray-200 px-4 py-2">
                      <h1 className="font-bold text-lg">{selectedFile}</h1>
                    </div>
```
new:
```tsx
                  <div className="flex flex-col h-full">
                    <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#3c3c3c] px-4 py-2">
                      <h1 className="font-bold text-lg">{selectedFile}</h1>
                    </div>
```

old:
```tsx
              <div className="flex items-center justify-center h-full text-gray-500">
                ファイルを選択して採点を開始してください
              </div>
```
new:
```tsx
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                ファイルを選択して採点を開始してください
              </div>
```

old:
```tsx
                <div className="flex items-center justify-center h-full text-gray-500">
                  左側のリストから資料ファイルを選択してください
                </div>
```
new:
```tsx
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  左側のリストから資料ファイルを選択してください
                </div>
```

- [ ] **Step 4: `TestManager.tsx` をダーク対応で書き換える**

`frontend/src/components/TestManager.tsx` の内容を丸ごと以下に置き換える:

```tsx
import React, { useState, useEffect } from "react";

interface TestCase {
  input_data: string;
  expected_output: string;
  run_only?: boolean;
}

interface TestManagerProps {
  testCases: TestCase[];
  onUpdate: (testCases: TestCase[]) => void;
  isCommon?: boolean;
}

const TestManager: React.FC<TestManagerProps> = ({
  testCases,
  onUpdate,
  isCommon = false,
}) => {
  const [localTestCases, setLocalTestCases] = useState<TestCase[]>(testCases);

  useEffect(() => {
    setLocalTestCases(testCases);
  }, [testCases]);

  const handleAdd = () => {
    const newCases = [
      ...localTestCases,
      { input_data: "", expected_output: "" },
    ];
    setLocalTestCases(newCases);
    onUpdate(newCases);
  };

  const handleChange = (
    index: number,
    field: keyof TestCase,
    value: string | boolean
  ) => {
    const newCases = [...localTestCases];
    newCases[index] = { ...newCases[index], [field]: value };
    setLocalTestCases(newCases);
    onUpdate(newCases);
  };

  const handleDelete = (index: number) => {
    const newCases = localTestCases.filter((_, i) => i !== index);
    setLocalTestCases(newCases);
    onUpdate(newCases);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-[#1e1e1e] h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
        {isCommon ? "共通テストケース設定" : "テストケース設定"}
      </h2>
      {localTestCases.map((tc, index) => (
        <div
          key={index}
          className="mb-4 p-4 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3c3c3c] rounded shadow-sm"
        >
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ケース #{index + 1}
            </span>
            <button
              onClick={() => handleDelete(index)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
            >
              削除
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400">
                入力 (標準入力)
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 dark:border-[#3c3c3c] rounded text-sm font-mono h-24 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100"
                value={tc.input_data}
                onChange={(e) =>
                  handleChange(index, "input_data", e.target.value)
                }
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">
                  期待される出力 (標準出力)
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={tc.run_only || false}
                    onChange={(e) =>
                      handleChange(index, "run_only", e.target.checked)
                    }
                  />
                  検証しない (実行のみ)
                </label>
              </div>
              <textarea
                className={`w-full p-2 border border-gray-300 dark:border-[#3c3c3c] rounded text-sm font-mono h-24 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 ${
                  tc.run_only ? "opacity-50" : ""
                }`}
                value={tc.expected_output}
                onChange={(e) =>
                  handleChange(index, "expected_output", e.target.value)
                }
                disabled={tc.run_only}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
      >
        + テストケースを追加
      </button>
    </div>
  );
};

export default TestManager;
```

- [ ] **Step 5: `Runner.tsx` の描画部分をダーク対応で書き換える**

`frontend/src/components/Runner.tsx` の `return (` から、コンポーネント末尾の `);` までを、以下で置き換える(Task 4 で追加した `onResult` の呼び出しロジックより上の部分・ロジックは変更しない):

old:
```tsx
  return (
    <div className="p-4 bg-white border-t border-gray-300 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">実行結果</h2>
        <button
          onClick={runAll}
          disabled={loading || testCases.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "実行中..." : "全テスト実行"}
        </button>
      </div>

      <div className="space-y-4">
        {testCases.map((tc, index) => {
          const res = results[index];
          return (
            <div key={index} className="border rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">ケース #{index + 1}</span>
                <div className="flex items-center gap-2">
                  {res && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        res.status === "PASS"
                          ? "bg-green-100 text-green-800"
                          : res.status === "TIMEOUT"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {res.status}
                    </span>
                  )}
                  <button
                    onClick={() => runSingle(index, tc)}
                    disabled={loading}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    実行
                  </button>
                </div>
              </div>

              {res && (
                <div className="text-sm bg-gray-50 p-2 rounded font-mono whitespace-pre-wrap">
                  {res.error ? (
                    <div className="text-red-600">{res.error}</div>
                  ) : (
                    <>
                      <div>
                        <div className="text-gray-500 mb-1">出力:</div>
                        <div className="pl-2 border-l-2 border-gray-300">
                          {res.output}
                        </div>
                      </div>
                      {res.diff && (
                        <div className="mt-2">
                          <span className="text-gray-500">差分:</span>
                          <pre className="text-red-600 bg-red-50 p-1 mt-1">
                            {res.diff}
                          </pre>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-400">
                        時間: {res.execution_time.toFixed(4)}s
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Runner;
```
new:
```tsx
  return (
    <div className="p-4 bg-white dark:bg-[#1e1e1e] h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          実行結果
        </h2>
        <button
          onClick={runAll}
          disabled={loading || testCases.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "実行中..." : "全テスト実行"}
        </button>
      </div>

      <div className="space-y-4">
        {testCases.map((tc, index) => {
          const res = results[index];
          return (
            <div
              key={index}
              className="border border-gray-200 dark:border-[#3c3c3c] rounded p-3"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ケース #{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {res && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        res.status === "PASS"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : res.status === "TIMEOUT"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {res.status}
                    </span>
                  )}
                  <button
                    onClick={() => runSingle(index, tc)}
                    disabled={loading}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    実行
                  </button>
                </div>
              </div>

              {res && (
                <div className="text-sm bg-gray-50 dark:bg-[#252526] p-2 rounded font-mono whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                  {res.error ? (
                    <div className="text-red-600 dark:text-red-400">
                      {res.error}
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">
                          出力:
                        </div>
                        <div className="pl-2 border-l-2 border-gray-300 dark:border-[#3c3c3c]">
                          {res.output}
                        </div>
                      </div>
                      {res.diff && (
                        <div className="mt-2">
                          <span className="text-gray-500 dark:text-gray-400">
                            差分:
                          </span>
                          <pre className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-1 mt-1">
                            {res.diff}
                          </pre>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        時間: {res.execution_time.toFixed(4)}s
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Runner;
```

- [ ] **Step 6: `PdfViewer.tsx` をダーク対応で書き換える**

`frontend/src/components/PdfViewer.tsx` の内容を丸ごと以下に置き換える:

```tsx
import React from "react";

interface PdfViewerProps {
  filename: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ filename }) => {
  const pdfUrl = `http://localhost:8000/api/pdfs/${filename}`;

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-[#1e1e1e]">
      <div className="p-2 bg-white dark:bg-[#252526] border-b border-gray-300 dark:border-[#3c3c3c] flex justify-between items-center">
        <span className="font-bold text-gray-700 dark:text-gray-200">
          {filename}
        </span>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          新しいタブで開く
        </a>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <iframe
          src={pdfUrl}
          className="w-full h-full border border-gray-300 dark:border-[#3c3c3c] rounded shadow-sm bg-white"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
};

export default PdfViewer;
```

- [ ] **Step 7: ビルド・lintを実行**

Run: `npm run build && npm run lint`
Expected: 両方エラーなし

- [ ] **Step 8: 実ブラウザで動作確認**

backend/frontendを起動し、Playwrightで:
1. ライトモードで `.py` ファイルを表示し、ソースコードの背景が白系、右側のテストパネルも白系で統一されていることをスクリーンショットで確認
2. テーマ切替ボタンでダークモードに切り替え、ソースコード・テスト設計・実行結果の全パネルが `#1e1e1e`/`#252526` 系の暗い配色に統一され、白い要素が残っていないことをスクリーンショットで確認
3. ダークモードのまま「資料」モードに切り替え、txtファイル・PDFファイル(あれば)の表示も暗い配色になっていることを確認

- [ ] **Step 9: コミット**

```bash
git add frontend/src/components/FileViewer.tsx frontend/src/App.tsx frontend/src/components/TestManager.tsx frontend/src/components/Runner.tsx frontend/src/components/PdfViewer.tsx
git commit -m "feat(frontend): FileViewer/TestManager/Runner/PdfViewerをダーク対応"
```

---

### Task 6: 最終検証(ビルド・lint・E2E動作確認・バックエンド回帰確認)

**Files:** なし(検証のみ)

- [ ] **Step 1: フロントエンドのビルド・lintを最終確認**

Run: `cd frontend && npm run build && npm run lint`
Expected: ビルド成功、lintは既存の2件のReact Hooks警告のみでエラー0件

- [ ] **Step 2: バックエンドの既存検証スクリプトを再実行し回帰がないことを確認**

Run:
```bash
cd /Users/hosonumamaito/program_checker/backend
source .venv/bin/activate
python main.py &
sleep 2
cd /Users/hosonumamaito/program_checker
python verify_backend.py
python verify_directory_api.py
```
Expected: どちらも `PASSED` 系のメッセージで終了する

実行後、変更されてしまった `grading_config.json` があれば `git checkout -- grading_config.json` で元に戻す。バックエンドプロセスは `kill` で停止する。

- [ ] **Step 3: フロントエンドを起動し一連の操作をPlaywrightで通しで確認する**

backend/frontendを起動し、Playwrightで以下を順に確認する(golden path + 主要edge case):
1. 初期表示でライト/ダークいずれかのテーマで正しく描画される
2. テーマ切替ボタンでダーク⇄ライトを往復し、リロード後も直前のテーマが保持される
3. ヘッダーのフォルダアイコン→ポップオーバーで手動パス入力によりディレクトリを変更できる
4. ファイルを選択し、左にソース・右にタブ(テスト設計/実行結果)が表示される
5. テストケースを追加・編集し、「実行結果」タブで実行してPASSを確認、期待値を変えてFAILとdiffが出ることを確認
6. サイドバーの当該ファイルにバッジが表示・更新されることを確認
7. 「★ 共通設定」選択時はソース・タブなしで共通テスト設定のみが全幅表示される
8. 「資料」モードに切り替え、txt/PDFの表示が壊れていないことを確認
9. 「全ファイル一括実行」を実行し、複数ファイルのバッジが更新される

問題が見つかった場合は該当タスクに戻って修正する。

- [ ] **Step 4: 後片付け**

起動したバックエンド・フロントエンドのプロセスを停止し、`git status` で意図しない変更(テスト中に書き換わった `grading_config.json` など)が残っていないか確認する。

- [ ] **Step 5: 最終コミット(必要な場合のみ)**

Step 3で修正が発生した場合のみ、該当ファイルをコミットする。修正が無ければこのタスクにコミットは不要。
