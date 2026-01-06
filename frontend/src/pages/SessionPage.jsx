
import { useAuth } from "../hooks/useSupabaseAuth";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { useQuery } from "@tanstack/react-query";
import { problemApi } from "../api/problems";
import { sessionApi } from "../api/sessions";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import {
    Check as CheckIcon,
    Loader2 as Loader2Icon,
    Share2 as Share2Icon,
    BookOpen as BookOpenIcon,
    Users2 as Users2Icon,
    Trophy as TrophyIcon,
    X as XIcon,
    Lock as LockIcon,
    Key as KeyIcon,
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    Eye as EyeIcon,
    LogOut as LogOutIcon,
    MessageSquare as MessageSquareIcon,
    CheckCircle2 as CheckCircle2Icon,
    XCircle as XCircleIcon,
    Play as PlayIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import SupabaseChat from "../components/SupabaseChat";
import VideoCall from "../components/VideoCall";
import { supabase } from "../lib/supabase";

function SessionPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, isLoaded: authLoaded } = useAuth();

    // UI State
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [problemSolved, setProblemSolved] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(() => {
        const saved = localStorage.getItem(`session_${id}_currentProblemIndex`);
        return saved ? parseInt(saved, 10) : 0;
    });
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [testResult, setTestResult] = useState(null);
    const [activeTestCaseId, setActiveTestCaseId] = useState(0);
    const [interviewPhase, setInterviewPhase] = useState(() => {
        const saved = localStorage.getItem(`session_${id}_interviewPhase`);
        return saved === "true";
    });
    const [problemScores, setProblemScores] = useState(() => {
        const saved = localStorage.getItem(`session_${id}_problemScores`);
        return saved ? JSON.parse(saved) : {};
    });
    const [interviewMarks, setInterviewMarks] = useState(() => {
        return localStorage.getItem(`session_${id}_interviewMarks`) || "";
    });
    const [isFinishing, setIsFinishing] = useState(false);

    const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);
    const session = sessionData?.session;

    const isHost = useMemo(() => {
        if (!session || !user) return false;
        return session.host?.clerk_id === user.id || session.host_id === user.id;
    }, [session, user]);

    const isParticipant = useMemo(() => {
        if (!session || !user) return false;
        return session.participant?.clerk_id === user.id || session.participant_id === user.id;
    }, [session, user]);

    const { data: allProblemsData = [] } = useQuery({
        queryKey: ["problems"],
        queryFn: problemApi.getAllProblems
    });

    // Session Problems - sorted by difficulty and numbered
    const sessionProblems = useMemo(() => {
        let problems = [];
        if (session?.problems && session.problems.length > 0) {
            problems = [...session.problems];
        } else if (session?.problem) {
            problems = [{ title: session.problem, difficulty: session.difficulty }];
        }

        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return problems.sort((a, b) => {
            const orderA = difficultyOrder[a.difficulty] || 99;
            const orderB = difficultyOrder[b.difficulty] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.title.localeCompare(b.title);
        });
    }, [session]);

    const activeProblem = sessionProblems[currentProblemIndex];

    const globalRankMap = useMemo(() => {
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const sorted = [...allProblemsData].sort((a, b) => {
            const orderA = difficultyOrder[a.difficulty] || 99;
            const orderB = difficultyOrder[b.difficulty] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.title.localeCompare(b.title);
        });
        const map = {};
        sorted.forEach((p, idx) => {
            map[p.title] = idx + 1; // map by title as session problems use title
        });
        return map;
    }, [allProblemsData]);

    const problemData = useMemo(() => {
        if (!activeProblem) return null;
        return allProblemsData.find((p) => p.title === activeProblem.title);
    }, [activeProblem, allProblemsData]);

    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        return localStorage.getItem(`session_${id}_selectedLanguage`) || "javascript";
    });
    const [code, setCode] = useState(() => {
        // Hydrated in effect
        return "";
    });

    const joinSessionMutation = useJoinSession();
    const endSessionMutation = useEndSession();

    // Check Authentication (Privacy)
    useEffect(() => {
        if (!session) return;
        if (isHost || isParticipant || !session.is_private) {
            setIsAuthenticated(true);
        }
    }, [session, isHost, isParticipant]);

    // Code Synchronization
    useEffect(() => {
        if (!session?.call_id || !isAuthenticated) return;

        const channel = supabase.channel(`code:${session.call_id}`, {
            config: { broadcast: { self: false } },
        });

        channel
            .on("broadcast", { event: "code-change" }, ({ payload }) => {
                if (payload.language === selectedLanguage) {
                    setCode(payload.code);
                }
            })
            .on("broadcast", { event: "language-change" }, ({ payload }) => {
                setSelectedLanguage(payload.language);
                if (payload.code) setCode(payload.code);
            })
            .on("broadcast", { event: "problem-switch" }, ({ payload }) => {
                setCurrentProblemIndex(payload.index);
                setInterviewPhase(false); // Reset if switching back
            })
            .on("broadcast", { event: "interview-phase" }, () => {
                setInterviewPhase(true);
            })
            .on("broadcast", { event: "interview-marks-update" }, ({ payload }) => {
                setInterviewMarks(payload.marks);
            })
            .on("broadcast", { event: "session-finalized" }, () => {
                toast.success("Final evaluation submitted!");
            })
            .on("broadcast", { event: "code-run-status" }, ({ payload }) => {
                setIsRunning(payload.isRunning);
                if (payload.isRunning) {
                    setOutput(null);
                    setTestResult(null);
                }
            })
            .on("broadcast", { event: "code-run-result" }, ({ payload }) => {
                setOutput(payload.output);
                setTestResult(payload.testResult);
                setIsRunning(false);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.call_id, selectedLanguage, isHost, isAuthenticated]);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        // Persist local code with language specificity
        if (activeProblem?.title) {
            localStorage.setItem(`session_${id}_code_${activeProblem.title}_${selectedLanguage}`, newCode);
        }

        // Participants/Candidate broadcast code to Host
        if (session?.call_id && !isHost) {
            supabase.channel(`code:${session.call_id}`).send({
                type: "broadcast",
                event: "code-change",
                payload: { code: newCode, language: selectedLanguage },
            });
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        localStorage.setItem(`session_${id}_selectedLanguage`, newLang);

        // Restore code for this specific lang or fallback
        const saved = localStorage.getItem(`session_${id}_code_${activeProblem?.title}_${newLang}`);
        if (saved) {
            setCode(saved);
        } else {
            const starter = problemData?.starter_code?.[newLang];
            if (starter) setCode(starter);
        }

        if (session?.call_id) {
            supabase.channel(`code:${session.call_id}`).send({
                type: "broadcast",
                event: "language-change",
                payload: { language: newLang, code: starter },
            });
        }
    };

    const handleProblemSwitch = (index) => {
        setCurrentProblemIndex(index);
        setInterviewPhase(false);
        localStorage.setItem(`session_${id}_currentProblemIndex`, index);

        if (session?.call_id) {
            supabase.channel(`code:${session.call_id}`).send({
                type: "broadcast",
                event: "problem-switch",
                payload: { index },
            });
        }
    };

    // Auto-join
    useEffect(() => {
        if (!session || !user || loadingSession || !isAuthenticated) return;
        if (isHost || isParticipant) return;

        // Redirect if session is full
        if (session.participant_id && session.participant?.clerk_id !== user.id) {
            toast.error("Session is already full");
            navigate("/dashboard");
            return;
        }

        joinSessionMutation.mutate({ id, password: passwordInput }, {
            onSuccess: () => refetch(),
            onError: (err) => {
                if (err.response?.status === 403) {
                    setIsAuthenticated(false);
                }
            }
        });
    }, [session, user, loadingSession, isHost, isParticipant, id, isAuthenticated]);

    // End redirection
    useEffect(() => {
        if (session?.status === "completed") navigate("/dashboard");
    }, [session, navigate]);

    // Default code on problem load
    useEffect(() => {
        if (!activeProblem?.title) return;

        // 1. Try to restore specific lang from localStorage
        const savedCode = localStorage.getItem(`session_${id}_code_${activeProblem.title}_${selectedLanguage}`);
        if (savedCode) {
            setCode(savedCode);
        } else if (problemData?.starter_code?.[selectedLanguage]) {
            // 2. Fallback to starter code
            setCode(problemData.starter_code[selectedLanguage]);
        }

        // Reset results when problem or language changes
        setOutput(null);
        setTestResult(null);
        // Show as solved if it exists in our scores record
        setProblemSolved(!!problemScores[activeProblem?.title]);
        setActiveTestCaseId(0);
    }, [activeProblem?.title, problemData, selectedLanguage, problemScores, id]);

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem(`session_${id}_problemScores`, JSON.stringify(problemScores));
        localStorage.setItem(`session_${id}_interviewPhase`, interviewPhase);
        localStorage.setItem(`session_${id}_interviewMarks`, interviewMarks);
    }, [id, problemScores, interviewPhase, interviewMarks]);

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);

        // Broadcast status
        if (session?.call_id) {
            supabase.channel(`code:${session.call_id}`).send({
                type: "broadcast",
                event: "code-run-status",
                payload: { isRunning: true },
            });
        }

        let codeToExecute = code;
        const driver = problemData?.expected_output?.driver_code?.[selectedLanguage];

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

        setIsRunning(false);
        setOutput(result);

        // Parse structured result
        let parsedResult = null;
        if (result.success && problemData) {
            try {
                const outputStr = result.output.trim();
                const jsonStart = outputStr.indexOf('{"stats":');
                const jsonStartAlt = outputStr.indexOf('{ "stats":');
                const start = jsonStart !== -1 ? jsonStart : jsonStartAlt;

                if (start !== -1) {
                    const jsonStr = outputStr.substring(start);
                    const driverResult = JSON.parse(jsonStr);
                    const { passed, total } = driverResult.stats;

                    parsedResult = {
                        status: passed === total ? "Accepted" : "Wrong Answer",
                        passed,
                        total,
                        cases: driverResult.results,
                        runtime: runtimeMs
                    };

                    if (passed === total) {
                        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                    }
                }
            } catch (e) {
                console.warn("Could not parse test results", e);
            }
        }
        setTestResult(parsedResult);

        // Broadcast result
        if (session?.call_id) {
            supabase.channel(`code:${session.call_id}`).send({
                type: "broadcast",
                event: "code-run-result",
                payload: { output: result, testResult: parsedResult },
            });
        }
    };

    const handleSubmit = async () => {
        setIsRunning(true);
        // Explicitly ensure the current version is saved on submit
        if (activeProblem?.title) {
            localStorage.setItem(`session_${id}_code_${activeProblem.title}_${selectedLanguage}`, code);
            toast.success("Submission snapshot saved locally", {
                icon: '💾',
                style: {
                    borderRadius: '12px',
                    background: '#080808',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }
            });
        }
        await handleRunCode();
    };

    // Effect to monitor testResult and set problemSolved
    useEffect(() => {
        if (testResult?.status === "Accepted") {
            setProblemSolved(true);

            // Track score
            const score = Math.round((testResult.passed / testResult.total) * 100);
            setProblemScores(prev => ({
                ...prev,
                [activeProblem?.title || "Problem"]: score
            }));
        }
    }, [testResult, activeProblem?.title]);

    // Separate effect to trigger interview phase when ALL problems are solved
    useEffect(() => {
        const solvedCount = Object.keys(problemScores).length;
        if (sessionProblems.length > 0 && solvedCount === sessionProblems.length) {
            const timer = setTimeout(() => {
                setInterviewPhase(true);
                if (session?.call_id) {
                    supabase.channel(`code:${session.call_id}`).send({
                        type: "broadcast",
                        event: "interview-phase",
                        payload: {},
                    });
                }
            }, 2500); // Give time for confetti/celebration
            return () => clearTimeout(timer);
        }
    }, [problemScores, sessionProblems.length, session?.call_id]);

    const handleFinalizeSession = async () => {
        if (!interviewMarks) return;
        setIsFinishing(true);
        try {
            await sessionApi.finalizeSession(id, {
                problemScores,
                interviewMarks
            });

            if (session?.call_id) {
                supabase.channel(`code:${session.call_id}`).send({
                    type: "broadcast",
                    event: "session-finalized",
                    payload: {},
                });
            }

            toast.success("Interview completed and results sent!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to finalize session:", error);
            toast.error("Failed to send results email");
        } finally {
            setIsFinishing(false);
        }
    };

    const handleEndSession = () => {
        if (confirm("Are you sure you want to end this interview session for everyone?")) {
            endSessionMutation.mutate(id, {
                onSuccess: () => {
                    toast.success("Session ended");
                    navigate("/dashboard");
                }
            });
        }
    };

    const handleChatMessage = (msg) => {
        if (!isChatVisible && msg.senderId !== user?.id) {
            setUnreadCount(prev => prev + 1);
            toast(`New message from ${msg.senderName}`, {
                icon: '💬',
                style: {
                    borderRadius: '1rem',
                    background: '#111',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)'
                },
            });
        }
    };

    const handleJoinWithPassword = () => {
        joinSessionMutation.mutate({ id, password: passwordInput }, {
            onSuccess: () => {
                setIsAuthenticated(true);
                refetch();
            }
        });
    };

    if (loadingSession || !authLoaded) {
        return (
            <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-white">
                <Loader2Icon className="size-16 animate-spin text-primary" />
                <p className="font-black text-xs uppercase tracking-[0.5em] opacity-50">Link Established...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-base-100 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                            <LockIcon className="size-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">Private Session</h2>
                        <p className="text-base-content/50 font-medium">This session is restricted. Please enter the access password provided by the host.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-base-content/30" />
                            <input
                                type="password"
                                placeholder="Access Password"
                                className="input input-bordered w-full pl-12 h-14 rounded-2xl bg-base-200 border-none font-bold text-lg"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinWithPassword()}
                            />
                        </div>
                        <button
                            onClick={handleJoinWithPassword}
                            disabled={joinSessionMutation.isPending}
                            className="btn btn-primary w-full h-14 rounded-2xl font-black gap-2 shadow-2xl shadow-primary/20"
                        >
                            {joinSessionMutation.isPending ? <Loader2Icon className="size-5 animate-spin" /> : <ChevronRightIcon className="size-5" />}
                            ENTER SESSION
                        </button>
                        <button onClick={() => navigate("/dashboard")} className="btn btn-ghost w-full rounded-2xl font-bold opacity-50">
                            BACK TO DASHBOARD
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#080808] text-white flex flex-col font-sans selection:bg-primary/30 overflow-hidden">
            {/* ─── PREMIUM UNIFIED HEADER ─── */}
            <header className="h-16 shrink-0 bg-black/40 backdrop-blur-2xl border-b border-white/[0.05] flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-8">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/dashboard")}>
                        <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                            <TrophyIcon className="size-5 text-white" />
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-sm font-black tracking-tighter leading-none">TESTCODE</h1>
                            <p className="text-[9px] font-bold text-white/30 tracking-[0.2em] mt-0.5">SESSION_LIVEROCK</p>
                        </div>
                    </div>

                    <div className="h-4 w-px bg-white/10 hidden md:block" />

                    {/* Session Vital Info */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black truncate max-w-[200px]">
                                {globalRankMap[activeProblem?.title] || currentProblemIndex + 1}. {activeProblem?.title || "Untitled Session"}
                            </h2>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/5 ${getDifficultyBadgeClass(activeProblem?.difficulty)}`}>
                                {activeProblem?.difficulty}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                <Users2Icon className="size-3" />
                                {session?.participant_id ? "CONNECTED" : "WAITING FOR PEER"}
                            </div>
                            <div className="size-1 rounded-full bg-white/20" />
                            <div className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                {isHost ? "HOSTING" : "CANDIDATE"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTRAL CONTROL GROUP */}
                <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center bg-white/[0.03] border border-white/[0.05] p-1.5 rounded-2xl shadow-inner backdrop-blur-md">
                    {sessionProblems.length > 1 && (
                        <>
                            <button
                                disabled={currentProblemIndex === 0}
                                onClick={() => handleProblemSwitch(currentProblemIndex - 1)}
                                className="p-2.5 hover:bg-white/5 rounded-xl disabled:opacity-20 transition-all active:scale-95"
                            >
                                <ChevronLeftIcon className="size-4" />
                            </button>
                            <div className="px-5">
                                <select
                                    className="bg-transparent border-none text-xs font-black focus:outline-none cursor-pointer hover:text-primary transition-colors appearance-none text-center"
                                    value={currentProblemIndex}
                                    onChange={(e) => handleProblemSwitch(parseInt(e.target.value))}
                                >
                                    {sessionProblems.map((p, idx) => (
                                        <option key={idx} value={idx} className="bg-[#080808] text-white">
                                            {globalRankMap[p.title] ? `#${globalRankMap[p.title]}` : `CHALLENGE ${idx + 1}`} - {p.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                disabled={currentProblemIndex === sessionProblems.length - 1}
                                onClick={() => handleProblemSwitch(currentProblemIndex + 1)}
                                className="p-2.5 hover:bg-white/5 rounded-xl disabled:opacity-20 transition-all active:scale-95"
                            >
                                <ChevronRightIcon className="size-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Invite link copied!");
                        }}
                        className="h-10 px-5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/[0.08] flex items-center gap-2 transition-all active:scale-95 text-xs font-black tracking-widest hover:text-primary"
                    >
                        <Share2Icon className="size-4" />
                        INVITE
                    </button>

                    {isHost ? (
                        <button
                            onClick={handleEndSession}
                            className="h-10 px-5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 flex items-center gap-2 transition-all active:scale-95 text-xs font-black tracking-widest shadow-lg shadow-red-500/5"
                        >
                            <XIcon className="size-4" />
                            END SESSION
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="h-10 px-5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/[0.08] flex items-center gap-2 transition-all active:scale-95 text-xs font-black tracking-widest opacity-50 hover:opacity-100"
                        >
                            <LogOutIcon className="size-4 font-black" />
                            EXIT
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 min-h-0 relative">
                <PanelGroup direction="horizontal">
                    {interviewPhase ? (
                        <Panel defaultSize={75} minSize={50} className="relative overflow-hidden bg-[#080808]">
                            {/* Animated Background for Interview Phase */}
                            <div className="absolute inset-0 z-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[80px] rounded-full" />
                            </div>

                            <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="size-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary p-0.5 shadow-2xl shadow-primary/20 mb-12"
                                >
                                    <div className="w-full h-full bg-[#080808] rounded-[2.4rem] flex items-center justify-center">
                                        <TrophyIcon className="size-16 text-primary" />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-6 max-w-2xl"
                                >
                                    <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
                                        Coding Phase <span className="text-primary NOT-italic">Complete</span>
                                    </h2>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="h-[1px] w-24 bg-white/10" />
                                        <span className="text-[14px] font-black text-white/40 uppercase tracking-[0.5em]">Now Transitioning</span>
                                        <div className="h-[1px] w-24 bg-white/10" />
                                    </div>
                                    <h3 className="text-5xl font-black tracking-tight text-white/90">
                                        NOW INTERVIEW TIME
                                    </h3>

                                    {isHost ? (
                                        <div className="mt-12 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-8 max-w-md mx-auto">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Interview Evaluation</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter Marks (0-100)"
                                                    value={interviewMarks}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setInterviewMarks(val);
                                                        // Sync marks with candidate
                                                        if (session?.call_id) {
                                                            supabase.channel(`code:${session.call_id}`).send({
                                                                type: "broadcast",
                                                                event: "interview-marks-update",
                                                                payload: { marks: val },
                                                            });
                                                        }
                                                    }}
                                                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 font-black text-center text-xl hover:border-primary/50 focus:border-primary focus:outline-none transition-all placeholder:text-white/10"
                                                />
                                            </div>

                                            <button
                                                onClick={handleFinalizeSession}
                                                disabled={isFinishing || !interviewMarks}
                                                className="w-full h-14 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-primary/10 disabled:opacity-50 disabled:grayscale"
                                            >
                                                {isFinishing ? "SENDING EVALUATION..." : "SUBMIT FINAL MARKS & END SESSION"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-8 space-y-4">
                                            {interviewMarks ? (
                                                <div className="px-12 py-8 rounded-[2rem] bg-white/[0.03] border border-white/5 animate-in zoom-in-95 duration-500">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2 text-center">Interviewer Rating</div>
                                                    <div className="text-6xl font-black text-primary text-center italic">{interviewMarks}</div>
                                                </div>
                                            ) : (
                                                <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 inline-flex items-center gap-3">
                                                    <Loader2Icon className="size-4 animate-spin text-primary" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Evaluation in progress...</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-white/30 text-lg font-medium max-w-lg mx-auto mt-8">
                                        All technical challenges have been addressed. The floor is now open for discussion, system design, and behavioral evaluation.
                                    </p>
                                </motion.div>

                                {isHost && (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        onClick={() => setInterviewPhase(false)}
                                        className="mt-16 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 text-white/40 hover:text-white"
                                    >
                                        Revisit Coding Workspace
                                    </motion.button>
                                )}
                            </div>
                        </Panel>
                    ) : (
                        <>
                            {/* ──── LEFT PANEL: PROBLEM CONTENT ──── */}
                            <Panel defaultSize={30} minSize={20} className="bg-black/20 flex flex-col relative">
                                <AnimatePresence mode="wait">
                                    {problemSolved ? (
                                        <motion.div
                                            key="solved"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.05 }}
                                            className="absolute inset-0 z-40 bg-[#080808] flex flex-col items-center justify-center p-8 text-center"
                                        >
                                            <div className="relative mb-8">
                                                <div className="absolute inset-0 bg-success/20 blur-3xl rounded-full animate-pulse" />
                                                <div className="relative size-24 rounded-3xl bg-success/10 border border-success/20 flex items-center justify-center">
                                                    <TrophyIcon className="size-12 text-success" />
                                                </div>
                                            </div>

                                            <h3 className="text-3xl font-black tracking-tight mb-2">Challenge Conquered!</h3>
                                            <p className="text-white/40 font-medium mb-12 max-w-xs">
                                                Outstanding work. Your solution passed all test scenarios with flying colors.
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
                                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Time</div>
                                                    <div className="text-xl font-black text-white">{testResult?.runtime}ms</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Score</div>
                                                    <div className="text-xl font-black text-success">100/100</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                                <button
                                                    onClick={() => setProblemSolved(false)}
                                                    className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                                                >
                                                    Review Description
                                                </button>

                                                {currentProblemIndex < sessionProblems.length - 1 && (
                                                    <button
                                                        onClick={() => handleProblemSwitch(currentProblemIndex + 1)}
                                                        className="h-14 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-primary/20"
                                                    >
                                                        Next Challenge
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="description"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex-1 overflow-y-auto custom-scrollbar"
                                        >
                                            <div className="p-8 max-w-3xl mx-auto space-y-12 pb-24">
                                                {/* Title & Meta */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <BookOpenIcon className="size-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Requirement v1.0</span>
                                                    </div>
                                                    <h2 className="text-4xl font-black tracking-tight leading-tight">
                                                        {currentProblemIndex + 1}. {activeProblem?.title}
                                                    </h2>
                                                    <div className="flex flex-wrap gap-2">
                                                        {activeProblem?.tags?.map(tag => (
                                                            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Main Description Card */}
                                                <div className="group relative">
                                                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative bg-white/[0.03] border border-white/[0.05] p-8 rounded-[2.5rem] leading-relaxed text-white/70 text-base whitespace-pre-wrap font-medium shadow-2xl">
                                                        {problemData?.description?.text}
                                                    </div>
                                                </div>

                                                {/* Examples Section */}
                                                {problemData?.description?.examples && (
                                                    <div className="space-y-6">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Test Scenarios</h3>
                                                        <div className="space-y-4">
                                                            {problemData.description.examples.slice(0, 3).map((ex, i) => (
                                                                <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-[2rem] space-y-3 hover:bg-white/[0.04] transition-colors">
                                                                    <div className="flex items-center justify-between text-[9px] font-black text-white/20 tracking-widest">
                                                                        <span>EXAMPLE 0{i + 1}</span>
                                                                        <span className="text-primary/30">VALIDATED</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-4 font-mono text-sm">
                                                                        <div className="flex gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
                                                                            <span className="text-[10px] font-black text-primary/50 w-12 shrink-0">INPUT</span>
                                                                            <span className="text-white/60 truncate">{ex.input}</span>
                                                                        </div>
                                                                        <div className="flex gap-4 p-3 bg-black/40 rounded-xl border border-white/5">
                                                                            <span className="text-[10px] font-black text-success/50 w-12 shrink-0">OUTPUT</span>
                                                                            <span className="text-white/60 truncate">{ex.output}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Panel>

                            <PanelResizeHandle className="w-1.5 hover:bg-primary/20 transition-all flex items-center justify-center group">
                                <div className="w-[1px] h-10 bg-white/10 group-hover:bg-primary/40 rounded-full" />
                            </PanelResizeHandle>

                            {/* ──── CENTER PANEL: CODE REALM ──── */}
                            <Panel defaultSize={45} minSize={30} className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] z-20">
                                <PanelGroup direction="vertical">
                                    <Panel defaultSize={75} minSize={40} className="relative">
                                        {/* Editor Status Strip */}
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
                                            <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_100px_rgba(34,197,94,0.5)]" />
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/80">
                                                        {isHost ? "REVIEW" : "READY"}
                                                    </span>
                                                </div>
                                                <div className="h-3 w-px bg-white/10" />
                                                <span className="text-[10px] font-black tracking-widest uppercase text-white/40">
                                                    {selectedLanguage}
                                                </span>
                                            </div>
                                        </div>

                                        {isHost && (
                                            <div className="absolute bottom-6 right-6 z-30 animate-bounce">
                                                <div className="px-4 py-2 bg-primary/20 backdrop-blur-2xl border border-primary/30 rounded-xl flex items-center gap-2 shadow-2xl">
                                                    <EyeIcon className="size-4 text-primary" />
                                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Observing Live</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="h-full border-x border-white/[0.05]">
                                            <CodeEditorPanel
                                                selectedLanguage={selectedLanguage}
                                                code={code}
                                                readOnly={isHost}
                                                isRunning={isRunning}
                                                onLanguageChange={handleLanguageChange}
                                                onCodeChange={handleCodeChange}
                                                onRunCode={handleRunCode}
                                                onSubmit={handleSubmit}
                                            />
                                        </div>
                                    </Panel>

                                    <PanelResizeHandle className="h-1.5 hover:bg-primary/20 transition-all flex items-center justify-center group">
                                        <div className="h-[1px] w-10 bg-white/10 group-hover:bg-primary/40 rounded-full" />
                                    </PanelResizeHandle>

                                    <Panel defaultSize={25} minSize={10} className="bg-black/60 backdrop-blur-3xl">
                                        <div className="h-full flex flex-col">
                                            <div className="h-10 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Output Console</span>
                                                {output && (
                                                    <button
                                                        onClick={() => setOutput(null)}
                                                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                                                    >
                                                        CLEAR
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex-1 min-h-0 bg-black/40 overflow-auto custom-scrollbar">
                                                {isRunning ? (
                                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-white/20">
                                                        <Loader2Icon className="size-8 animate-spin text-primary" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Executing Engine...</span>
                                                    </div>
                                                ) : testResult ? (
                                                    <div className="p-6 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <h2 className={`text-2xl font-black uppercase tracking-tight ${testResult.status === "Accepted" ? "text-success" : "text-red-500"}`}>
                                                                    {testResult.status}
                                                                </h2>
                                                                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black text-white/40 tracking-widest">
                                                                    {testResult.passed}/{testResult.total} PASSED
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{testResult.runtime}ms</span>
                                                        </div>

                                                        {/* Case Tabs */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {testResult.cases?.map((c, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setActiveTestCaseId(i)}
                                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${activeTestCaseId === i
                                                                        ? "bg-white/[0.08] border-white/20 text-white"
                                                                        : "bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/[0.04]"
                                                                        }`}
                                                                >
                                                                    <div className={`size-1.5 rounded-full ${c.passed ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"}`} />
                                                                    CASE {i + 1}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Active Case Detail */}
                                                        {testResult.cases?.[activeTestCaseId] && (
                                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                <div className="space-y-2">
                                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Input</span>
                                                                    <pre className="p-4 bg-black/40 rounded-2xl border border-white/5 text-xs font-mono text-white/60 overflow-x-auto">
                                                                        {testResult.cases[activeTestCaseId].input}
                                                                    </pre>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Expected</span>
                                                                        <pre className="p-4 bg-black/40 rounded-2xl border border-white/5 text-xs font-mono text-success/60 overflow-x-auto">
                                                                            {testResult.cases[activeTestCaseId].expected}
                                                                        </pre>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Actual</span>
                                                                        <pre className={`p-4 rounded-2xl border text-xs font-mono overflow-x-auto ${testResult.cases[activeTestCaseId].passed
                                                                            ? "bg-black/40 border-white/5 text-white/60"
                                                                            : "bg-red-500/10 border-red-500/20 text-red-500/80"
                                                                            }`}>
                                                                            {testResult.cases[activeTestCaseId].actual}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : output ? (
                                                    <div className="p-6">
                                                        <OutputPanel output={output} />
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-white/10">
                                                        <PlayIcon className="size-12 opacity-5" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Standby</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Panel>
                                </PanelGroup>
                            </Panel>
                        </>
                    )}

                    <PanelResizeHandle className="w-1.5 hover:bg-primary/20 transition-all flex items-center justify-center group">
                        <div className="w-[1px] h-10 bg-white/10 group-hover:bg-primary/40 rounded-full" />
                    </PanelResizeHandle>

                    {/* ──── RIGHT PANEL: INTERACTION ──── */}
                    <Panel defaultSize={25} minSize={20} className="bg-[#0a0a0a] flex flex-col p-4 gap-4">
                        {/* Video Section */}
                        <div className="relative aspect-video flex-shrink-0">
                            <VideoCall roomId={session?.call_id} userId={user?.id} />
                        </div>

                        {/* Chat Terminal - Persistent Container */}
                        <div className="flex-1 min-h-0 flex flex-col relative">
                            {/* Hidden Trigger State */}
                            <div className={`h-full flex flex-col items-center justify-center gap-4 ${isChatVisible ? 'hidden' : 'flex'}`}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative group"
                                >
                                    <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <button
                                        onClick={() => {
                                            setIsChatVisible(true);
                                            setUnreadCount(0);
                                        }}
                                        className="relative size-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-primary/50 flex items-center justify-center transition-all active:scale-95 group shadow-2xl"
                                    >
                                        <MessageSquareIcon className="size-7 text-white/50 group-hover:text-primary transition-colors" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-2 -right-2 size-6 rounded-full bg-primary border-4 border-[#0a0a0a] flex items-center justify-center text-[10px] font-black shadow-lg">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </motion.div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Chat Hidden</p>
                            </div>

                            {/* Active Chat Panel (Always Mounted to preserve messages) */}
                            <div className={`h-full flex flex-col rounded-3xl bg-white/[0.02] border border-white/[0.05] overflow-hidden shadow-inner ${!isChatVisible ? 'hidden' : 'flex'}`}>
                                <div className="h-12 px-6 border-b border-white/[0.05] flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Collaboration Chat</span>
                                    </div>
                                    <button
                                        onClick={() => setIsChatVisible(false)}
                                        className="p-1 hover:bg-white/5 rounded-lg transition-colors text-white/30 hover:text-white"
                                    >
                                        <XIcon className="size-4" />
                                    </button>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <SupabaseChat
                                        roomId={session?.call_id}
                                        onMessageReceived={handleChatMessage}
                                    />
                                </div>
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </main>
        </div>
    );
}

export default SessionPage;
