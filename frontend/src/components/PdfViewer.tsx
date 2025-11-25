import React from "react";

interface PdfViewerProps {
  filename: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ filename }) => {
  const pdfUrl = `http://localhost:8000/api/pdfs/${filename}`;

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="p-2 bg-white border-b border-gray-300 flex justify-between items-center">
        <span className="font-bold text-gray-700">{filename}</span>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          新しいタブで開く
        </a>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <iframe
          src={pdfUrl}
          className="w-full h-full border border-gray-300 rounded shadow-sm bg-white"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
};

export default PdfViewer;
