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
            onResult={onResult}
          />
        )}
      </div>
    </div>
  );
};

export default TestPanel;
