import React from "react";

interface SidebarProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onSelectFile,
}) => {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen overflow-y-auto flex-shrink-0">
      <div className="p-4 font-bold text-xl border-b border-gray-700">
        Program Checker
      </div>
      <ul>
        <li
          className={`p-3 cursor-pointer hover:bg-gray-700 border-b-2 border-gray-600 font-bold text-yellow-400 ${
            selectedFile === "__COMMON__" ? "bg-gray-700" : "bg-gray-800"
          }`}
          onClick={() => onSelectFile("__COMMON__")}
        >
          ★ 共通設定
        </li>
        {files.map((file) => (
          <li
            key={file}
            className={`p-3 cursor-pointer hover:bg-gray-700 ${
              selectedFile === file ? "bg-blue-600" : ""
            }`}
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
