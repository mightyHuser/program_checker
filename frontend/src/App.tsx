import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import FileViewer from "./components/FileViewer";
import PdfViewer from "./components/PdfViewer";
import TestPanel from "./components/TestPanel";

interface TestCase {
  input_data: string;
  expected_output: string;
  run_only?: boolean;
}

// 一括実行(バッチ実行)1件分の結果。
// 対象ファイルが見つからない/テスト未設定の場合は results が無く、
// status と details だけが入る。
interface BatchFileResult {
  filename: string;
  status?: string; // "NOT_FOUND" | "NO_TESTS"
  details?: string;
  results?: {
    test_case: number;
    status: string;
    execution_time: number;
    output: string;
    error: string;
    diff?: string;
  }[];
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [currentDir, setCurrentDir] = useState<string>("");
  const [viewMode, setViewMode] = useState<"code" | "doc">("code");

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

  // ディレクトリ選択(エクスプローラー)関連の状態
  const [dirSelecting, setDirSelecting] = useState(false);
  const [manualPathInput, setManualPathInput] = useState("");
  const [showDirMenu, setShowDirMenu] = useState(false);
  // 直前に処理したステータスを覚えておくためのref。
  // ポーリングは1秒ごとに何度も同じステータスを受け取るため、
  // これが無いと「同じエラー」で何度もalertが出てしまう。
  const lastDirStatusRef = useRef<string>("idle");

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

  useEffect(() => {
    fetchDirectory();
    // Poll for directory status
    const pollInterval = setInterval(checkDirectoryStatus, 1000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (currentDir) {
      fetchFiles();
    }
  }, [currentDir, viewMode]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (selectedFile) {
        if (viewMode === "code") {
          const content = await fetchFileContent(selectedFile);
          if (active) setFileContent(content || "");

          const cases = await fetchTestCases(selectedFile);
          if (active) setTestCases(cases || []);
        } else if (viewMode === "doc") {
          if (selectedFile.toLowerCase().endsWith(".txt")) {
            const content = await fetchFileContent(selectedFile);
            if (active) setFileContent(content || "");
          } else {
            if (active) setFileContent("");
          }
          if (active) setTestCases([]);
        }
      } else {
        if (active) {
          setFileContent("");
          setTestCases([]);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [selectedFile, viewMode]);

  const checkDirectoryStatus = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/select-directory/status"
      );
      const status: string = res.data.status;

      // ステータスが前回と同じなら何もしない(重複alert防止)
      if (status === lastDirStatusRef.current) return;
      lastDirStatusRef.current = status;

      if (status === "success" && res.data.path) {
        setCurrentDir(res.data.path);
        setDirSelecting(false);
        // fetchFiles will be triggered by useEffect
      } else if (status === "error") {
        // ダイアログスクリプトが失敗した場合(例: tkinter未インストール等)、
        // 以前は何も表示されずボタンを押しても反応がないように見えていた。
        // ここでユーザーにエラー内容を伝える。
        setDirSelecting(false);
        alert(
          `ディレクトリ選択に失敗しました。\n${
            res.data.error || "詳細不明のエラーです。"
          }\n\n下の「手動でパスを入力」からディレクトリを指定できます。`
        );
      } else if (status === "cancelled") {
        setDirSelecting(false);
      } else if (status === "running") {
        setDirSelecting(true);
      }
    } catch (err) {
      console.error("Failed to check directory status", err);
    }
  };

  const fetchDirectory = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/directory");
      setCurrentDir(res.data.path);
    } catch (err) {
      console.error("Failed to fetch directory", err);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      // 新しい選択を開始する前に、前回のステータスを忘れさせておく。
      // こうしないと、以前も"success"だった場合に今回のsuccessが
      // 「変化なし」と判定されてハンドリングされないことがある。
      lastDirStatusRef.current = "idle";
      setDirSelecting(true);

      // Start the selection process
      const startRes = await axios.post(
        "http://localhost:8000/api/select-directory/start"
      );
      if (
        startRes.data.status === "started" ||
        startRes.data.status === "already_running"
      ) {
        // Polling is handled by useEffect
      }
    } catch (err) {
      console.error("Failed to start directory selection", err);
      setDirSelecting(false);
      alert("ディレクトリ選択の開始に失敗しました。");
    }
  };

  // GUIダイアログ(tkinter)が環境によって使えない場合の手動入力フォールバック。
  // バックエンドの POST /api/directory は元から実装されていたが、
  // フロントエンドから呼び出す手段が無かったため追加する。
  const handleManualDirectorySubmit = async () => {
    const path = manualPathInput.trim();
    if (!path) return;
    try {
      const res = await axios.post("http://localhost:8000/api/directory", {
        path,
      });
      setCurrentDir(res.data.path);
      setManualPathInput("");
      setShowDirMenu(false);
    } catch (err) {
      console.error("Failed to set directory manually", err);
      alert(
        "ディレクトリの設定に失敗しました。パスが正しいか確認してください。"
      );
    }
  };

  const fetchFiles = async () => {
    try {
      const extension = viewMode === "code" ? "py" : "pdf,txt";
      const res = await axios.get(
        `http://localhost:8000/api/files?extension=${extension}`
      );
      setFiles(res.data.files);
      setSelectedFile(null); // Reset selection when file list changes
      setFileContent("");
      setTestCases([]);
      // ディレクトリ切替時、前のディレクトリのPASS/FAILバッジと
      // 一括実行結果が新しいディレクトリの同名ファイルに誤って残らないようリセットする。
      setFileStatuses({});
      setBatchResults([]);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  const fetchFileContent = async (filename: string): Promise<string | null> => {
    if (filename === "__COMMON__") return null;
    try {
      const res = await axios.get(
        `http://localhost:8000/api/files/${filename}`
      );
      return res.data.content;
    } catch (err) {
      console.error("Failed to fetch content", err);
      return null;
    }
  };

  const fetchTestCases = async (
    filename: string
  ): Promise<TestCase[] | null> => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/config/${filename}`
      );
      return res.data.test_cases;
    } catch (err) {
      console.error("Failed to fetch config", err);
      return null;
    }
  };

  const handleUpdateTestCases = async (newCases: TestCase[]) => {
    setTestCases(newCases);
    if (selectedFile) {
      if (selectedFile === "__COMMON__") {
        setCommonTestCases(newCases);
      }
      try {
        await axios.post(
          `http://localhost:8000/api/config/${selectedFile}`,
          newCases
        );
      } catch (err) {
        console.error("Failed to save config", err);
      }
    }
  };

  const [useCommonTests, setUseCommonTests] = useState(false);
  const [commonTestCases, setCommonTestCases] = useState<TestCase[]>([]);

  useEffect(() => {
    if (useCommonTests) {
      fetchCommonTestCases();
    }
  }, [useCommonTests]);

  const fetchCommonTestCases = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/config/__COMMON__"
      );
      setCommonTestCases(res.data.test_cases);
    } catch (err) {
      console.error("Failed to fetch common config", err);
    }
  };

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

  // Find result for selected file
  const currentBatchResult = batchResults.find(
    (r) => r.filename === selectedFile
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 overflow-hidden flex-col">
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
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold whitespace-nowrap disabled:bg-gray-500"
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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          viewMode={viewMode}
          fileStatuses={fileStatuses}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {viewMode === "code" ? (
            selectedFile ? (
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
                        <FileViewer content={fileContent} theme={theme} />
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
                      onResult={handleFileResult}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                ファイルを選択して採点を開始してください
              </div>
            )
          ) : (
            /* Document Mode */
            <div className="w-full h-full">
              {selectedFile ? (
                selectedFile.toLowerCase().endsWith(".pdf") ? (
                  <PdfViewer filename={selectedFile} />
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#3c3c3c] px-4 py-2">
                      <h1 className="font-bold text-lg">{selectedFile}</h1>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <FileViewer
                        content={fileContent}
                        language="text"
                        theme={theme}
                      />
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  左側のリストから資料ファイルを選択してください
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
