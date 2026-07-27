import React from "react";

interface PdfViewerProps {
  filename: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ filename }) => {
  const pdfUrl = `http://localhost:8000/api/pdfs/${filename}`;

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-[#1e1e1e]">
      <div className="p-2 bg-white dark:bg-[#252526] border-b border-gray-300 dark:border-[#3c3c3c] flex justify-between items-center">
        <span className="font-bold text-gray-700 dark:text-gray-200">
          {filename}
        </span>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          新しいタブで開く
        </a>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <iframe
          src={pdfUrl}
          className="w-full h-full border border-gray-300 dark:border-[#3c3c3c] rounded shadow-sm bg-white"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
};

export default PdfViewer;
