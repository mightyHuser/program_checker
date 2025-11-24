import React from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("python", python);

interface FileViewerProps {
  content: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ content }) => {
  return (
    <div className="h-full overflow-auto bg-[#1e1e1e]">
      <SyntaxHighlighter
        language="python"
        style={vs2015}
        showLineNumbers={true}
        customStyle={{ margin: 0, height: "100%" }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

export default FileViewer;
