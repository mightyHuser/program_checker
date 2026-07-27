import React from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import { vs2015, vs } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("python", python);

interface FileViewerProps {
  content: string;
  language?: string;
  theme?: "light" | "dark";
}

const FileViewer: React.FC<FileViewerProps> = ({
  content,
  language = "python",
  theme = "dark",
}) => {
  return (
    <div
      className={`h-full overflow-auto ${
        theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"
      }`}
    >
      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? vs2015 : vs}
        showLineNumbers={true}
        customStyle={{ margin: 0, height: "100%" }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

export default FileViewer;
