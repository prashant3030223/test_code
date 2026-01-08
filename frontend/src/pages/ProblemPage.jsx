import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { problemApi } from "../api/problems";
import { PROBLEMS } from "../data/problems";
import Navbar from "../components/Navbar";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription";
import OutputPanel from "../components/OutputPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import { executeCode } from "../lib/piston";

import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { Loader2Icon } from "lucide-react";

// ... existing imports
import { Play, Send, ChevronUp, ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import { generateDriverCode } from "../lib/driverGenerator";
// We need to create a simple Console Component inline or separate. For speed, inline first.

function ProblemPage() {
  // Force refresh for driver update v3
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("testcases"); // 'testcases' | 'result'
  const [testResult, setTestResult] = useState(null); // specific structured result
  const [activeTestCaseId, setActiveTestCaseId] = useState(0);

  // New States for Description Panel Control
  const [descriptionTab, setDescriptionTab] = useState("description");
  const [submissions, setSubmissions] = useState([]);

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ["problem", id],
    queryFn: async () => {
      return problemApi.getProblemById(id);
    },
    enabled: !!id
  });

  const { data: allProblems = [] } = useQuery({
    queryKey: ["problems"],
    queryFn: problemApi.getAllProblems
  });

  // Load persisted language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(`lang_${id}`);
    if (savedLang) setSelectedLanguage(savedLang);
  }, [id]);

  // Handle code initialization and persistence
  useEffect(() => {
    if (problem) {
      // 1. Try to find local auto-save for this problem + language
      const savedCode = localStorage.getItem(`code_${id}_${selectedLanguage}`);

      if (savedCode) {
        setCode(savedCode);
      } else {
        // Fallback to starter code
        // Priority: DB starter_code -> DB code_snippets -> Local file starterCode
        const dbStarter = problem.starter_code?.[selectedLanguage];
        const dbSnippet = problem.code_snippets?.[selectedLanguage];
        const localStarter = PROBLEMS[id]?.starterCode?.[selectedLanguage];

        setCode(dbStarter || dbSnippet || localStarter || "");
      }

      setOutput(null);
      setTestResult(null);
      setActiveTab("testcases");
      setDescriptionTab("description");

      // Save language choice
      localStorage.setItem(`lang_${id}`, selectedLanguage);
    }
  }, [problem, selectedLanguage, id]);

  // Auto-save code to local storage on change
  useEffect(() => {
    if (id && code) {
      localStorage.setItem(`code_${id}_${selectedLanguage}`, code);
    }
  }, [code, id, selectedLanguage]);

  // Calculate global rank for sorting consistency
  const problemRank = useMemo(() => {
    if (!problem || !allProblems.length) return null;
    const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const sorted = [...allProblems].sort((a, b) => {
      const orderA = difficultyOrder[a.difficulty] || 99;
      const orderB = difficultyOrder[b.difficulty] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
    const index = sorted.findIndex(p => p.id === problem.id);
    return index !== -1 ? index + 1 : null;
  }, [problem, allProblems]);

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleResetCode = () => {
    if (!problem) return;
    // Clearing local storage
    localStorage.removeItem(`code_${id}_${selectedLanguage}`);

    // Priority re-fetch logic
    const dbStarter = problem.starter_code?.[selectedLanguage];
    const dbSnippet = problem.code_snippets?.[selectedLanguage];
    const localStarter = PROBLEMS[id]?.starterCode?.[selectedLanguage];

    const freshCode = dbStarter || dbSnippet || localStarter || "";
    setCode(freshCode);

    toast.success("Code reset to default", {
      icon: "🔄",
      style: { background: "#333", color: "#fff", fontSize: "12px" },
    });
  };

  const handleProblemChange = (newProblemId) => navigate(`/problem/${newProblemId}`);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.2, y: 0.6 } });
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.8, y: 0.6 } });
  };

  // Reuse existing execute logic but populate 'testResult' state instead of just output
  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleOpen(true);
    setActiveTab("result");
    setTestResult(null);

    let codeToExecute = code;
    // START: Dynamic Driver Injection
    // We prefer generating a fresh driver client-side because the DB one might be stale or generic.
    // Import normally at top, but for now we can import dynamically or assume it's available if we did a top-level import.
    // Since we can't easily add top-level imports in this specific tool call cleanly without reading the whole file,
    // we will rely on the fact that I (the agent) will add the import in a separate step or I can inline the logic if simple.
    // actually, let's just use the DB driver if it exists, BUT for JS, let's try to generate one if the DB one is the "placeholder".

    // BETTER APPROACH: Add the import to the top of the file in a separate edit, then use it here.
    // For this Replace, I will assume `generateDriverCode` is available (I will add the import next).

    let driver = problem?.expected_output?.driver_code?.[selectedLanguage];

    // Attempt to generate a robust driver client-side for ALL languages
    // The generator will return null if it doesn't support the language yet.
    if (problem?.examples) {
      const snippet = problem.starter_code?.[selectedLanguage] || problem.code_snippets?.[selectedLanguage];
      const generated = generateDriverCode(selectedLanguage, code, problem.examples, snippet);
      if (generated) driver = generated;
    }

    if (driver) {
      // The generator now returns the COMPLETE executable file for ALL languages (including JS/TS/Py).
      // This includes the user code injected into the driver.
      // So we just use it directly.
      const isGenerated = !!generateDriverCode(selectedLanguage, code, problem.examples, problem.starter_code?.[selectedLanguage]);

      if (isGenerated) {
        codeToExecute = driver;
      } else if (selectedLanguage === "java") {
        // Legacy fallback for non-generated Java (should happen rarely now)
        const lines = code.split("\n");
        const imports = lines.filter(l => l.trim().startsWith("import ") || l.trim().startsWith("package ")).join("\n");
        const body = lines.filter(l => !l.trim().startsWith("import ") && !l.trim().startsWith("package ")).join("\n");
        codeToExecute = `${imports}\n\n${driver}\n\n${body}`;
      } else {
        // Fallback for languages where generator returns null (if any left) -> Append strategy
        codeToExecute = code + "\n" + driver;
      }
    }
    // END: Dynamic Driver Injection

    const startTime = performance.now();
    const result = await executeCode(selectedLanguage, codeToExecute);
    const endTime = performance.now();
    const runtimeMs = Math.round(endTime - startTime);

    setOutput(result); // Raw output
    setIsRunning(false);

    // Parse specific result
    let parsedResult = { status: "Error", passed: 0, total: 0, cases: [], runtime: 0, error: result.error };

    if (result.success && problem) {
      // Parse Driver JSON
      let driverResult = null;
      try {
        // Helper to find JSON start
        const output = result.output.trim();
        // We look for the signature key "stats" to be safe
        const jsonStartIndex = output.indexOf('{ "stats":');
        const jsonStartIndexAlternative = output.indexOf('{"stats":');

        const start = jsonStartIndex !== -1 ? jsonStartIndex : jsonStartIndexAlternative;

        if (start !== -1) {
          const jsonStr = output.substring(start);
          driverResult = JSON.parse(jsonStr);
        } else {
          // Fallback: Try line by line (legacy for JS/Py if they don't match strict pattern but are valid lines)
          const lines = output.split("\n");
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const j = JSON.parse(lines[i]);
              if (j.stats && j.results) { driverResult = j; break; }
            } catch { }
          }
        }
      } catch (e) { console.error("JSON Parse Error", e); }

      if (driverResult && driverResult.results?.length > 0) {
        const { passed, total } = driverResult.stats;
        parsedResult.status = passed === total ? "Accepted" : "Wrong Answer";
        parsedResult.passed = passed;
        parsedResult.total = total;
        parsedResult.cases = driverResult.results;
        parsedResult.runtime = runtimeMs;
        parsedResult.error = null;

        if (passed === total) triggerConfetti();
      } else {
        // Fallback Logic
        if (driver) {
          // We had a driver but got no results -> Runtime Error
          parsedResult.status = "Runtime Error";
          parsedResult.error = result.error || result.stderr || "Execution Error (No output from code)";
          parsedResult.cases = [];
        } else {
          // No driver (unsupported language or legacy problem)
          // If output is generated, mark as Accepted for now to avoid blocking, or Wrong Answer if empty
          const hasOutput = result.output && result.output.trim().length > 0;
          parsedResult.status = hasOutput ? "Accepted" : "Wrong Answer";
          parsedResult.passed = hasOutput ? 1 : 0;
          parsedResult.total = 1;
          parsedResult.cases = [];
        }
      }
    } else {
      parsedResult.status = "Runtime Error";
      parsedResult.error = result.error || result.stderr || "Unknown Error";
    }

    setTestResult(parsedResult);
    return parsedResult;
  };

  const handleSubmitCode = async () => {
    // Simulate submission by running code against test cases
    // In a real app, this would verify against hidden cases on backend
    const result = await handleRunCode();

    if (!result) return;

    // Visual feedback for persistence
    localStorage.setItem(`code_${id}_${selectedLanguage}`, code);
    toast.success("Progress saved locally", {
      icon: "💾",
      style: { background: "#333", color: "#fff", fontSize: "12px" },
      duration: 2000
    });

    // Create a submission record
    const newSubmission = {
      status: result.status,
      runtime: result.runtime,
      timestamp: new Date().toISOString(),
      language: selectedLanguage,
      code: code
    };

    // Save to backend
    // Save to backend using Supabase Client
    try {
      await problemApi.submitSolution({
        problemId: id,
        status: result.status,
        language: selectedLanguage,
        runtime: result.runtime || 0,
        code
      });

      // Force refresh problems list so the 'Solved' tick appears immediately
      queryClient.invalidateQueries(["problems"]);
      queryClient.invalidateQueries(["submissions", id]);

      setSubmissions(prev => [newSubmission, ...prev]);
    } catch (e) {
      console.error("Failed to save submission, using fallback", e);
      // Fallback: save to localStorage
      const localSubs = JSON.parse(localStorage.getItem("local_submissions") || "[]");
      const localItem = { ...newSubmission, problem_id: id };
      localStorage.setItem("local_submissions", JSON.stringify([localItem, ...localSubs]));

      setSubmissions(prev => [newSubmission, ...prev]);
    }

    setDescriptionTab("submissions");

    if (result && result.status === "Accepted") {
      toast.dismiss();
      toast.success("Submission Accepted!", { icon: "🏆", duration: 5000 });
    }
  };

  // Fetch previous submissions
  useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        return await problemApi.getSubmissionsForProblem(id);
      } catch (e) {
        console.warn("Fetch failed");
        return [];
      }
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
        <Loader2Icon className="size-12 animate-spin text-green-500" />
        <p className="text-gray-500 font-mono tracking-widest text-xs uppercase">Connecting to Database...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-6 p-4">
        <div className="size-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <XCircle className="size-10 text-red-500 opacity-50" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Problem Missing</h2>
          <p className="text-white/40 max-w-md mx-auto">
            {error?.message || "This problem doesn't exist or we couldn't fetch it from Supabase."}
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-outline px-8 rounded-2xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden text-sm">
      <Navbar />

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">

          {/* LEFT: DESCRIPTION */}
          <Panel defaultSize={40} minSize={30} className="bg-[#1a1a1a] border-r border-[#333]">
            <ProblemDescription
              problem={{
                ...problem,
                description: typeof problem.description === 'string'
                  ? { text: problem.description, notes: [] }
                  : { ...problem.description, notes: problem.description?.notes || [] }
              }}
              currentProblemId={id}
              onProblemChange={handleProblemChange}
              allProblems={allProblems}
              submissions={submissions}
              _activeTab={descriptionTab}
              _setActiveTab={setDescriptionTab}
              problemRank={problemRank}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#262626] hover:bg-blue-600 transition-colors" />

          {/* RIGHT: EDITOR + CONSOLE */}
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">

              {/* TOP: EDITOR */}
              <Panel defaultSize={60} minSize={30} className="flex flex-col">
                <div className="flex-1">
                  <CodeEditorPanel
                    selectedLanguage={selectedLanguage}
                    code={code}
                    onCodeChange={setCode}
                    onLanguageChange={handleLanguageChange}
                    onRunCode={handleRunCode}
                    onReset={handleResetCode}
                    onSubmit={handleSubmitCode}
                    isRunning={isRunning}
                    theme="vs-dark"
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-[#262626] hover:bg-blue-600 transition-colors" />

              {/* BOTTOM: CONSOLE */}
              <Panel defaultSize={40} minSize={10} className="bg-[#1a1a1a] flex flex-col">
                <div className="bg-[#262626] flex items-center gap-4 px-4 py-1 border-b border-[#333] text-gray-400 text-xs font-medium">
                  <button
                    onClick={() => setActiveTab("testcases")}
                    className={`py-2 px-1 border-b-2 transition-colors ${activeTab === "testcases" ? "text-white border-white" : "border-transparent hover:text-gray-200"}`}
                  >
                    Testcase
                  </button>
                  <button
                    onClick={() => setActiveTab("result")}
                    className={`flex items-center gap-1 py-1 px-1 border-b-2 transition-colors ${activeTab === "result" ? "text-white border-white" : "border-transparent hover:text-gray-200"} ${!testResult && "opacity-50 pointer-events-none"}`}
                  >
                    Test Result
                    {testResult && (
                      <span className={`size-1.5 rounded-full ${testResult.status === "Accepted" ? "bg-green-500" : "bg-red-500"}`} />
                    )}
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => setConsoleOpen(!consoleOpen)}>
                    {consoleOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                  </button>
                </div>

                {consoleOpen && activeTab === "testcases" && (
                  <div className="p-4 flex-1 overflow-auto">
                    <div className="flex gap-2 mb-4">
                      {problem.examples?.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTestCaseId(i)}
                          className={`px-3 py-1 rounded text-xs transition-colors ${activeTestCaseId === i ? "bg-[#333] text-white" : "text-gray-400 hover:text-gray-200"}`}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>
                    {/* Dynamic Inputs Display */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Input</p>
                        <div className="bg-[#262626] p-2 rounded text-gray-300 font-mono text-xs">
                          {problem.examples?.[activeTestCaseId]?.input || "Loading..."}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Output</p>
                        <div className="bg-[#262626] p-2 rounded text-gray-300 font-mono text-xs">
                          {problem.examples?.[activeTestCaseId]?.output || "Loading..."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {consoleOpen && activeTab === "result" && testResult && (
                  <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
                    <div className="flex flex-col gap-4">

                      <h2 className={`text-2xl font-bold ${testResult.status === "Accepted" ? "text-green-500" : "text-red-500"}`}>
                        {testResult.status}
                      </h2>

                      {testResult.status !== "Runtime Error" && testResult.status !== "Format Error" && (
                        <div className="flex gap-12 p-4 bg-[#262626] rounded-lg border border-white/5">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Runtime</p>
                            <p className="text-white font-mono font-bold text-xl">{testResult.runtime} <span className="text-sm font-normal text-gray-500">ms</span></p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Testcases</p>
                            <p className="text-white font-mono font-bold text-xl">
                              {testResult.passed}/{testResult.total} <span className="text-sm font-normal text-gray-500">passed</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Case Results Tabs */}
                    {testResult.cases && testResult.cases.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                          {testResult.cases.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveTestCaseId(i)}
                              className={`px-4 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${activeTestCaseId === i ? "bg-[#333]" : ""} ${c.passed ? "text-green-500" : "text-red-500"}`}
                            >
                              <span className={`size-1.5 rounded-full ${c.passed ? "bg-green-500" : "bg-red-500"}`} />
                              Case {i + 1}
                            </button>
                          ))}
                        </div>
                        {/* Detailed view for active case in result */}
                        <div className="bg-[#262626] p-4 rounded-lg space-y-3">
                          <div className="text-xs text-gray-500">Input</div>
                          <div className="bg-[#333] p-2 rounded font-mono text-gray-300 text-xs">
                            {testResult.cases[activeTestCaseId]?.input}
                          </div>
                          <div className="text-xs text-gray-500">Output</div>
                          <div className={`p-2 rounded font-mono text-xs ${testResult.cases[activeTestCaseId]?.passed ? "bg-[#333] text-gray-300" : "bg-red-900/20 text-red-400"}`}>
                            {typeof testResult.cases[activeTestCaseId]?.actual === 'object'
                              ? JSON.stringify(testResult.cases[activeTestCaseId]?.actual)
                              : String(testResult.cases[activeTestCaseId]?.actual)}
                          </div>
                          <div className="text-xs text-gray-500">Expected</div>
                          <div className="bg-[#333] p-2 rounded font-mono text-gray-300 text-xs">
                            {testResult.cases[activeTestCaseId]?.expected}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-400 font-mono text-xs bg-[#262626] p-4 rounded-lg whitespace-pre-wrap border border-red-500/20">
                        {testResult.error || "Unknown Error"}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State / Loading */}
                {consoleOpen && activeTab === "result" && !testResult && isRunning && (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <Loader2Icon className="animate-spin size-6 mr-2" /> Running...
                  </div>
                )}
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default ProblemPage;
