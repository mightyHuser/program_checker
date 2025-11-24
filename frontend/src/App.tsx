import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import FileViewer from "./components/FileViewer";
import TestManager from "./components/TestManager";
import Runner from "./components/Runner";

interface TestCase {
  input_data: string;
  expected_output: string;
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTab, setActiveTab] = useState<"code" | "tests">("code");
  const [currentDir, setCurrentDir] = useState<string>("");

  useEffect(() => {
    fetchDirectory();
  }, []);

  useEffect(() => {
    if (currentDir) {
      fetchFiles();
    }
  }, [currentDir]);

  useEffect(() => {
    if (selectedFile) {
      fetchFileContent(selectedFile);
      fetchTestCases(selectedFile);
    } else {
      setFileContent("");
      setTestCases([]);
    }
  }, [selectedFile]);

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
        // Poll for status
        const intervalId = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              "http://localhost:8000/api/select-directory/status"
            );
            const status = statusRes.data.status;

            if (status === "success") {
              clearInterval(intervalId);
              setCurrentDir(statusRes.data.path);
              setSelectedFile(null);
            } else if (status === "cancelled") {
              clearInterval(intervalId);
              // Do nothing or show message
            } else if (status === "error") {
              clearInterval(intervalId);
              alert(`エラーが発生しました: ${statusRes.data.error}`);
            }
            // If "running" or "idle", continue polling
          } catch (err) {
            console.error("Polling error", err);
            clearInterval(intervalId);
          }
        }, 1000); // Poll every 1 second
      }
    } catch (err) {
      console.error("Failed to start directory selection", err);
      alert("ディレクトリ選択の開始に失敗しました。");
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/files");
      setFiles(res.data.files);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  const fetchFileContent = async (filename: string) => {
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
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {selectedFile ? (
            <>
              <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <h1 className="font-bold text-lg">{selectedFile}</h1>
                <div className="space-x-2">
                  <button
                    className={`px-3 py-1 rounded ${
                      activeTab === "code"
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("code")}
                  >
                    コード
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${
                      activeTab === "tests"
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("tests")}
                  >
                    テスト設定
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden relative">
                  {activeTab === "code" ? (
                    <FileViewer content={fileContent} />
                  ) : (
                    <TestManager
                      testCases={testCases}
                      onUpdate={handleUpdateTestCases}
                    />
                  )}
                </div>

                <Runner filename={selectedFile} testCases={testCases} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              ファイルを選択して採点を開始してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
