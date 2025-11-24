import React, { useState } from "react";
import axios from "axios";

interface TestCase {
  input_data: string;
  expected_output: string;
  run_only?: boolean;
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

const Runner: React.FC<RunnerProps> = ({
  filename,
  testCases,
  externalResult,
}) => {
  const [results, setResults] = useState<{ [key: number]: ExecutionResult }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // Update results when externalResult changes
  React.useEffect(() => {
    if (externalResult && externalResult.filename === filename) {
      const newResults: { [key: number]: ExecutionResult } = {};

      // Check if results array exists (it might not if status is NO_TESTS or NOT_FOUND)
      if (externalResult.results && Array.isArray(externalResult.results)) {
        externalResult.results.forEach((r) => {
          // Map batch result to ExecutionResult format
          // Note: batch result uses 1-based index for test_case
          newResults[r.test_case - 1] = {
            filename: filename,
            status: r.status,
            output: r.output || "",
            error: r.error || "",
            execution_time: r.execution_time,
            diff: r.diff,
          };
        });
      }
      setResults(newResults);
    }
  }, [externalResult, filename]);

  // Reset results when filename changes (if not handled by externalResult)
  React.useEffect(() => {
    if (!externalResult || externalResult.filename !== filename) {
      setResults({});
    }
  }, [filename]);

  const runSingle = async (index: number, tc: TestCase) => {
    setLoading(true);
    try {
      const response = await axios.post<ExecutionResult>(
        "http://localhost:8000/api/grade",
        {
          filename: filename,
          input_data: tc.input_data,
          expected_output: tc.expected_output,
          run_only: tc.run_only,
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
            run_only: testCases[i].run_only,
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
