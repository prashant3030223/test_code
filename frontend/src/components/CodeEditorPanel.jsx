import Editor from "@monaco-editor/react";
import {
  Loader2 as Loader2Icon,
  Play as PlayIcon,
  Check as CheckIcon,
  RotateCcw as RotateCcwIcon
} from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

function CodeEditorPanel({
  selectedLanguage,
  code,
  onCodeChange,
  onLanguageChange,
  onRunCode,
  onReset,
  isRunning,
  onSubmit,
  readOnly = false,
}) {
  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#1a1a1a] border-b border-white/5 p-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={onLanguageChange}
            disabled={readOnly}
            className="bg-white/[0.03] text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-2 border border-white/5 focus:ring-1 focus:ring-primary/50 cursor-pointer outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>

          </select>
          {readOnly && (
            <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Observer Mode</span>
            </div>

          )}
          {onReset && !readOnly && (
            <button
              onClick={onReset}
              className="ml-2 text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
              title="Reset Code"
            >
              <RotateCcwIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={isRunning}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-2xl ${isRunning
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-primary text-black hover:bg-primary/90 hover:scale-105 active:scale-95"
                }`}
            >
              {isRunning ? <Loader2Icon className="size-3 animate-spin" /> : <PlayIcon className="size-3" />}
              {isRunning ? "Running..." : "Run Code"}
            </button>
          )}

          {onSubmit && !readOnly && (
            <button
              onClick={onSubmit}
              disabled={isRunning}
              className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <CheckIcon className="size-3" /> Submit
            </button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="bg-primary/10 border-b border-primary/20 p-2 flex items-center gap-2 shrink-0">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Review Mode</span>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Editor
          height={"100%"}
          language={LANGUAGE_CONFIG[selectedLanguage]?.monacoLang || "javascript"}
          value={code}
          onChange={onCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            padding: { top: 16 },
            readOnly: readOnly,
            fontFamily: "Menlo, Monaco, 'Courier New', monospace"
          }}
        />
      </div>
    </div>
  );
}
export default CodeEditorPanel;
