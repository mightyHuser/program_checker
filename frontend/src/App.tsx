import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import FileViewer from "./components/FileViewer";
import TestManager from "./components/TestManager";
import Runner from "./components/Runner";
import PdfViewer from "./components/PdfViewer";

interface TestCase {
  input_data: string;
  expected_output: string;
  run_only?: boolean;
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [currentDir, setCurrentDir] = useState<string>("");
  const [viewMode, setViewMode] = useState<"code" | "doc">("code");

  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);

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
    if (selectedFile) {
      if (viewMode === "code") {
        fetchFileContent(selectedFile);
        fetchTestCases(selectedFile);
      } else if (viewMode === "doc") {
        if (selectedFile.toLowerCase().endsWith(".txt")) {
          fetchFileContent(selectedFile);
        } else {
          // PDF or other types, no content fetch needed here (handled by PdfViewer or ignored)
          setFileContent("");
        }
        setTestCases([]);
      }
    } else {
      setFileContent("");
      setTestCases([]);
    }
  }, [selectedFile, viewMode]);

  const checkDirectoryStatus = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/select-directory/status"
      );
      if (res.data.status === "success" && res.data.path) {
        if (res.data.path !== currentDir) {
          setCurrentDir(res.data.path);
          // fetchFiles will be triggered by useEffect
        }
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
      alert("ディレクトリ選択の開始に失敗しました。");
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
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  const fetchFileContent = async (filename: string) => {
    if (filename === "__COMMON__") return;
    try {
      const res = await axios.get(
        `http://localhost:8000/api/files/${filename}`
      );
      setFileContent(res.data.content);
    } catch (err) {
      console.error("Failed to fetch content", err);
    }
  };

  const fetchTestCases = async (filename: string) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/config/${filename}`
      );
      setTestCases(res.data.test_cases);
    } catch (err) {
      console.error("Failed to fetch config", err);
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
      setBatchResults(res.data.batch_results);
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
    <div className="flex h-screen bg-gray-100 overflow-hidden flex-col">
      {/* Header / Directory Selection */}
      <div className="bg-gray-900 text-white p-2 flex items-center gap-4 shadow-md z-10">
        <div className="font-bold text-lg">Program Checker</div>
        <div className="flex-1 flex gap-2 items-center">
          <div className="text-sm text-gray-300 truncate max-w-xl">
            現在: {currentDir}
          </div>
          <button
            onClick={handleSelectDirectory}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold whitespace-nowrap"
          >
            ディレクトリ選択 (エクスプローラー)
          </button>

          <div className="flex items-center gap-2 ml-4 border-l border-gray-600 pl-4">
            {/* Mode Switcher */}
            <div className="flex bg-gray-700 rounded p-1">
              <button
                className={`px-3 py-1 rounded text-sm font-bold ${
                  viewMode === "code"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => setViewMode("code")}
              >
                コード
              </button>
              <button
                className={`px-3 py-1 rounded text-sm font-bold ${
                  viewMode === "doc"
                    ? "bg-white shadow text-red-600"
                    : "text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => setViewMode("doc")}
              >
                資料
              </button>
            </div>

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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          viewMode={viewMode}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {viewMode === "code" ? (
            selectedFile ? (
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
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
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
                    <div className="bg-white border-b border-gray-200 px-4 py-2">
                      <h1 className="font-bold text-lg">{selectedFile}</h1>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <FileViewer content={fileContent} language="text" />
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
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
