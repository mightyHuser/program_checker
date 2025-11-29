import React from "react";

interface SidebarProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
  viewMode: "code" | "doc";
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onSelectFile,
  viewMode,
}) => {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen overflow-y-auto flex-shrink-0">
      <div className="p-4 font-bold text-xl border-b border-gray-700">
        Program Checker
      </div>
      <ul>
        {viewMode === "code" && (
          <li
            className={`p-3 cursor-pointer border-b-2 border-gray-600 font-bold text-yellow-400 transition-colors ${
              selectedFile === "__COMMON__"
                ? ""
                : "bg-gray-800 hover:bg-gray-700"
            }`}
            style={{
              backgroundColor:
                selectedFile === "__COMMON__" ? "#4b5563" : undefined, // Force gray-600
            }}
            onClick={() => onSelectFile("__COMMON__")}
          >
            ★ 共通設定
          </li>
        )}
        {files.map((file) => (
          <li
            key={file}
            className={`p-3 cursor-pointer transition-colors ${
              selectedFile === file
                ? "font-bold text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
            style={{
              backgroundColor: selectedFile === file ? "#b2b8c2ff" : undefined, // Force gray-600
            }}
            onClick={() => onSelectFile(file)}
          >
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
