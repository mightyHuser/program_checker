import React, { useState, useEffect } from "react";

interface TestCase {
  input_data: string;
  expected_output: string;
}

interface TestManagerProps {
  testCases: TestCase[];
  onUpdate: (testCases: TestCase[]) => void;
}

const TestManager: React.FC<TestManagerProps> = ({ testCases, onUpdate }) => {
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
    value: string
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
    <div className="p-4 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">テストケース設定</h2>
      {localTestCases.map((tc, index) => (
        <div key={index} className="mb-4 p-4 bg-white rounded shadow">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">ケース #{index + 1}</span>
            <button
              onClick={() => handleDelete(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              削除
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                入力 (標準入力)
              </label>
              <textarea
                className="w-full p-2 border rounded text-sm font-mono h-24"
                value={tc.input_data}
                onChange={(e) =>
                  handleChange(index, "input_data", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                期待される出力 (標準出力)
              </label>
              <textarea
                className="w-full p-2 border rounded text-sm font-mono h-24"
                value={tc.expected_output}
                onChange={(e) =>
                  handleChange(index, "expected_output", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        + テストケースを追加
      </button>
    </div>
  );
};

export default TestManager;
