import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { problemApi } from "../api/problems";
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
// We need to create a simple Console Component inline or separate. For speed, inline first.

function ProblemPage() {
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
        setCode(problem.starter_code?.[selectedLanguage] || "");
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
    const driver = problem?.expected_output?.driver_code?.[selectedLanguage];
    if (driver) {
      if (selectedLanguage === "java") {
        const lines = code.split("\n");
        const imports = lines.filter(l => l.trim().startsWith("import ") || l.trim().startsWith("package ")).join("\n");
        const body = lines.filter(l => !l.trim().startsWith("import ") && !l.trim().startsWith("package ")).join("\n");
        codeToExecute = `${imports}\n\n${driver}\n\n${body}`;
      } else {
        codeToExecute = code + "\n" + driver;
      }
    }

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

      if (driverResult) {
        const { passed, total } = driverResult.stats;
        parsedResult.status = passed === total ? "Accepted" : "Wrong Answer";
        parsedResult.passed = passed;
        parsedResult.total = total;
        parsedResult.cases = driverResult.results;
        parsedResult.runtime = runtimeMs;

        if (passed === total) triggerConfetti();
      } else {
        // If we expected a driver result (because driver exists) but didn't get one,
        // it means something went wrong with the driver execution or output.
        // Don't use fallback if driver was used.
        const driver = problem?.expected_output?.driver_code?.[selectedLanguage];

        if (driver) {
          console.warn("Driver Output Parsing Failed:", result.output);
          parsedResult.status = "Format Error";
          parsedResult.error = "Could not parse test results. Raw Output:\n" + (result.output ? result.output.substring(0, 300) : "No Output");
          // Add a fake failed case to make the UI show the error
          parsedResult.cases = [];
        } else {
          // Legacy fallback (only if no driver exists)
          const expectedOutput = problem.expected_output[selectedLanguage];
          const passed = result.output.includes(expectedOutput);
          parsedResult.status = passed ? "Accepted" : "Wrong Answer";
          parsedResult.runtime = runtimeMs;
          if (passed) triggerConfetti();
        }
      }
    } else {
      parsedResult.status = "Runtime Error";
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
        <p className="text-gray-500 font-mono tracking-widest text-xs">LOADING PROBLEMs...</p>
      </div>
    );
  }

  if (error || !problem) return <div className="text-white p-10">Problem not found</div>;

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
                description: { ...problem.description, notes: problem.description.notes || [] }
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
                      {problem.description?.examples?.map((_, i) => (
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
                          {problem.description?.examples?.[activeTestCaseId]?.input || "Loading..."}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Output</p>
                        <div className="bg-[#262626] p-2 rounded text-gray-300 font-mono text-xs">
                          {problem.description?.examples?.[activeTestCaseId]?.output || "Loading..."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {consoleOpen && activeTab === "result" && testResult && (
                  <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <h2 className={`text-lg font-semibold ${testResult.status === "Accepted" ? "text-green-500" : "text-red-500"}`}>
                        {testResult.status}
                      </h2>
                      <span className="text-gray-500 text-xs">Runtime: {testResult.runtime}ms</span>
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
                            {testResult.cases[activeTestCaseId]?.actual}
                          </div>
                          <div className="text-xs text-gray-500">Expected</div>
                          <div className="bg-[#333] p-2 rounded font-mono text-gray-300 text-xs">
                            {testResult.cases[activeTestCaseId]?.expected}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-400 font-mono text-xs bg-[#262626] p-2 rounded">
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
