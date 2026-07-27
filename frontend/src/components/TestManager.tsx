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
