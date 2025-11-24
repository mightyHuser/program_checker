import React, { useState } from "react";
import axios from "axios";

interface TestCase {
  input_data: string;
  expected_output: string;
}

interface ExecutionResult {
  filename: string;
  status: string;
  output: string;
  error: string;
  execution_time: number;
  expected_output?: string;
  diff?: string;
}

interface RunnerProps {
  filename: string;
  testCases: TestCase[];
}

const Runner: React.FC<RunnerProps> = ({ filename, testCases }) => {
  const [results, setResults] = useState<{ [key: number]: ExecutionResult }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const runSingle = async (index: number, tc: TestCase) => {
    setLoading(true);
    try {
      const response = await axios.post<ExecutionResult>(
        "http://localhost:8000/api/grade",
        {
          filename: filename,
          input_data: tc.input_data,
          expected_output: tc.expected_output,
        }
      );
      setResults((prev) => ({ ...prev, [index]: response.data }));
    } catch (error) {
      console.error("Error running code:", error);
      alert("Error running code");
    } finally {
      setLoading(false);
    }
  };

  const runAll = async () => {
    setLoading(true);
    const newResults: { [key: number]: ExecutionResult } = {};
    for (let i = 0; i < testCases.length; i++) {
      try {
        const response = await axios.post<ExecutionResult>(
          "http://localhost:8000/api/grade",
          {
            filename: filename,
            input_data: testCases[i].input_data,
            expected_output: testCases[i].expected_output,
          }
        );
        newResults[i] = response.data;
      } catch (error) {
        console.error("Error running code:", error);
      }
    }
    setResults(newResults);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white border-t border-gray-300 h-1/3 overflow-y-auto">
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
                        <span className="text-gray-500">出力:</span>{" "}
                        {res.output}
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
