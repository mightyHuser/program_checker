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
