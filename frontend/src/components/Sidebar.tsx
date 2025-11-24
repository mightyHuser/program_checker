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
