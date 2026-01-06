import { useState, useEffect } from "react";
import { getDifficultyBadgeClass } from "../lib/utils";
import { FileText, Clock, Tag, ThumbsUp, ThumbsDown, Star, Share2, Lock, CheckCircle2, Code2, Users, Search, MessageSquare, Send } from "lucide-react";
import { problemApi } from "../api/problems";
import toast from "react-hot-toast";

function ProblemDescription({ problem, currentProblemId, onProblemChange, allProblems, _activeTab, _setActiveTab, submissions = [], problemRank }) {
  const [internalActiveTab, setInternalActiveTab] = useState("description");
  const activeTab = _activeTab || internalActiveTab;
  const setActiveTab = _setActiveTab || setInternalActiveTab;

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [starred, setStarred] = useState(false);

  const [solutions, setSolutions] = useState([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [newSolution, setNewSolution] = useState({ title: "", content: "", language: "javascript" });

  // Fetch Real Stats & State
  useEffect(() => {
    if (problem?.id) {
      fetchInteractions();
      if (activeTab === 'solutions') fetchSolutions();
    }
  }, [problem?.id, activeTab]);

  const fetchInteractions = async () => {
    try {
      const data = await problemApi.getInteractionState(problem.id);
      setLiked(data.isLiked);
      setStarred(data.isStarred);
      setLikesCount(data.likes);
    } catch (e) {
      console.warn("Failed to fetch interactions, table might be missing.");
    }
  };

  const fetchSolutions = async () => {
    setLoadingSolutions(true);
    try {
      const data = await problemApi.getSolutions(problem.id);
      setSolutions(data);
    } catch (e) {
      console.warn("Failed to fetch solutions.");
    } finally {
      setLoadingSolutions(false);
    }
  };

  const handleLike = async () => {
    try {
      const data = await problemApi.toggleLike(problem.id);
      setLiked(data.liked);
      setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
      toast.success(data.liked ? "Problem Liked" : "Like Removed", { icon: "👍", style: { background: "#333", color: "#fff" } });
    } catch (e) {
      toast.error("Action failed.");
    }
  };

  const handleStar = async () => {
    try {
      const data = await problemApi.toggleStar(problem.id);
      setStarred(data.starred);
      toast.success(data.starred ? "Problem Saved" : "Removed from Saved", { icon: "⭐" });
    } catch (e) {
      toast.error("Action failed.");
    }
  };

  const handlePostSolution = async (e) => {
    e.preventDefault();
    if (!newSolution.title || !newSolution.content) return toast.error("Please fill all fields");

    try {
      const data = await problemApi.postSolution(problem.id, newSolution);
      setSolutions(prev => [data, ...prev]);
      setShowSolutionForm(false);
      setNewSolution({ title: "", content: "", language: "javascript" });
      toast.success("Solution posted successfully!");
    } catch (e) {
      toast.error("Failed to post solution.");
    }
  };

  if (!problem) return null;

  const isSolved = submissions.some(s => s.status === "Accepted");

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-white font-sans selection:bg-blue-500/30">
      {/* 1. TOP TABS */}
      <div className="flex items-center gap-1 bg-[#262626] px-2 py-1 border-b border-[#333] text-xs font-medium text-gray-400">
        <button
          onClick={() => setActiveTab("description")}
          className={`flex items-center gap-2 px-3 py-2 border-t-2 rounded-t-sm transition-colors ${activeTab === 'description' ? 'bg-[#1a1a1a] border-blue-500 text-white' : 'border-transparent hover:bg-[#333] hover:text-white'}`}
        >
          <FileText className="size-3.5" /> Description
        </button>
        <button
          onClick={() => setActiveTab("editorial")}
          className={`flex items-center gap-2 px-3 py-2 border-t-2 rounded-t-sm transition-colors ${activeTab === 'editorial' ? 'bg-[#1a1a1a] border-blue-500 text-white' : 'border-transparent hover:bg-[#333] hover:text-white'}`}
        >
          Editorial
        </button>
        <button
          onClick={() => setActiveTab("solutions")}
          className={`flex items-center gap-2 px-3 py-2 border-t-2 rounded-t-sm transition-colors ${activeTab === 'solutions' ? 'bg-[#1a1a1a] border-blue-500 text-white' : 'border-transparent hover:bg-[#333] hover:text-white'}`}
        >
          Solutions
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`flex items-center gap-2 px-3 py-2 border-t-2 rounded-t-sm transition-colors ${activeTab === 'submissions' ? 'bg-[#1a1a1a] border-blue-500 text-white' : 'border-transparent hover:bg-[#333] hover:text-white'}`}
        >
          Submissions
        </button>
      </div>

      {/* 2. MAIN SCROLL CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

        {activeTab === 'description' && (
          <>
            <div>
              <div className="flex items-center justify-between font-medium">
                <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  {problemRank && <span>{problemRank}. </span>}
                  {problem.title}
                  {isSolved && <CheckCircle2 className="size-6 text-green-500" />}
                </h1>
              </div>

              <div className="flex items-center gap-4 text-xs mt-1">
                <span className={`capitalize font-medium ${getDifficultyBadgeClass(problem.difficulty).replace('badge', '').trim() === 'badge-success' ? 'text-green-500' : problem.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                  {problem.difficulty}
                </span>
                <span className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer bg-[#262626] px-2 py-1 rounded-full">
                  <Tag className="size-3" /> {problem.category}
                </span>
              </div>

              {/* ACTIONS ROW */}
              <div className="flex items-center gap-4 mt-4 border-b border-[#333] pb-4">
                <div className="flex items-center bg-[#262626] rounded overflow-hidden">
                  <button
                    onClick={handleLike}
                    className={`px-3 py-1.5 hover:bg-[#333] flex items-center gap-1.5 text-sm border-r border-[#333] transition-colors ${liked ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
                  >
                    <ThumbsUp className={`size-4 ${liked ? 'fill-blue-500' : ''}`} /> {likesCount > 0 ? (likesCount / 1000 >= 1 ? (likesCount / 1000).toFixed(1) + 'K' : likesCount) : 'Like'}
                  </button>
                  <button className="px-3 py-1.5 hover:bg-[#333] flex items-center gap-1.5 text-gray-400 text-sm">
                    <ThumbsDown className="size-4" />
                  </button>
                </div>

                <button
                  onClick={handleStar}
                  className={`hover:scale-110 active:scale-95 transition-all ${starred ? 'text-yellow-500' : 'text-gray-400'}`}
                >
                  <Star className={`size-5 ${starred ? 'fill-yellow-500' : ''}`} />
                </button>
                <button className="hover:text-blue-500 text-gray-400">
                  <Share2 className="size-5" />
                </button>
              </div>
            </div>

            <div className="text-[15px] space-y-4 text-gray-300 leading-7">
              <p>{problem.description.text}</p>
              {problem.description.notes && problem.description.notes.map((note, idx) => (
                <p key={idx}>{note}</p>
              ))}
            </div>

            {/* EXAMPLES */}
            {problem.description.examples && problem.description.examples.length > 0 && (
              <div className="space-y-6 mt-8">
                {problem.description.examples.map((example, idx) => (
                  <div key={idx} className="space-y-2 group">
                    <p className="text-white font-semibold flex items-center gap-2">Example {idx + 1}:</p>
                    <div className="pl-4 border-l-2 border-[#333] group-hover:border-gray-500 transition-colors">
                      <div className="flex gap-2">
                        <span className="font-semibold text-white w-14">Input:</span>
                        <span className="font-mono text-gray-300 bg-[#262626] px-1.5 py-0.5 rounded text-sm">{example.input}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="font-semibold text-white w-14">Output:</span>
                        <span className="font-mono text-gray-300 bg-[#262626] px-1.5 py-0.5 rounded text-sm">{example.output}</span>
                      </div>
                      {example.explanation && (
                        <div className="flex gap-2 mt-1">
                          <span className="font-semibold text-white w-14">Expl:</span>
                          <span className="text-gray-400 text-sm max-w-[90%]">{example.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CONSTRAINTS */}
            {problem.description.constraints && problem.description.constraints.length > 0 && (
              <div className="mt-8">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">Constraints:</h3>
                <ul className="space-y-2 list-disc list-inside text-gray-300 ml-2">
                  {problem.description.constraints.map((constraint, idx) => (
                    <li key={idx} className="text-sm font-mono bg-[#262626]/50 w-fit px-2 py-0.5 rounded">{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">My Submissions</h3>
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                <div className="bg-[#262626] p-4 rounded-full mb-3"><Clock className="size-6" /></div>
                <p>No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub, idx) => (
                  <div key={idx} className="bg-[#262626] p-3 rounded flex items-center justify-between hover:bg-[#333] transition-colors group">
                    <div className="flex items-center gap-3">
                      {sub.status === "Accepted" ? <CheckCircle2 className="size-5 text-green-500" /> : <div className="size-5 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] text-red-500 font-bold">!</div>}
                      <div>
                        <p className={`font-medium ${sub.status === "Accepted" ? "text-green-500" : "text-red-500"}`}>{sub.status}</p>
                        <p className="text-xs text-gray-500">{new Date(sub.timestamp || sub.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-300 font-mono">{sub.runtime}ms</p>
                      <p className="text-xs text-gray-500 capitalize">{sub.language}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Community Solutions</h3>
              <button
                onClick={() => setShowSolutionForm(!showSolutionForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-500/20"
              >
                {showSolutionForm ? "Cancel" : "Post Solution"}
              </button>
            </div>

            {showSolutionForm && (
              <form onSubmit={handlePostSolution} className="bg-[#262626] p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  placeholder="Solution Title (e.g. Optimized O(n) Approach)"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  value={newSolution.title}
                  onChange={e => setNewSolution({ ...newSolution, title: e.target.value })}
                />
                <select
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  value={newSolution.language}
                  onChange={e => setNewSolution({ ...newSolution, language: e.target.value })}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
                <textarea
                  placeholder="Explain your logic and paste your code..."
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm h-32 focus:border-blue-500 outline-none font-mono"
                  value={newSolution.content}
                  onChange={e => setNewSolution({ ...newSolution, content: e.target.value })}
                />
                <button type="submit" className="w-full bg-blue-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"><Send className="size-4" /> Submit Solution</button>
              </form>
            )}

            {loadingSolutions ? (
              <div className="py-20 flex justify-center"><Clock className="animate-spin text-gray-500" /></div>
            ) : solutions.length > 0 ? (
              <div className="space-y-3">
                {solutions.map(sol => (
                  <div key={sol.id} className="p-4 bg-[#262626] rounded-xl flex gap-4 hover:bg-[#333] cursor-pointer transition-all group">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-lg">
                      {sol.user?.avatar_url ? <img src={sol.user.avatar_url} className="w-full h-full rounded-full" /> : (sol.user?.name?.[0] || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-100 text-sm mb-1 truncate">{sol.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="text-blue-400 font-bold uppercase tracking-wider">{sol.language}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Users className="size-3" /> {sol.user?.name || "Anonymous"}</span>
                        <span>•</span>
                        <span>{new Date(sol.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{sol.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <MessageSquare className="size-10 mx-auto mb-3 opacity-20" />
                <p>No solutions posted yet. Be the first!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'editorial' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-4">
              <h3 className="text-xl font-semibold">Editorial Solution</h3>
              <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest">Official</span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 leading-relaxed">
                This problem explores <strong>Dynamic Programming</strong> patterns. The most efficient approach targets a time complexity of O(N) and space complexity of O(1).
              </p>
              <h4 className="text-blue-500 font-bold mt-6 mb-2">Optimal Strategy</h4>
              <p className="text-gray-300 italic">"Use a sliding window or hash table to maintain state across iterations."</p>
              <div className="bg-[#262626] p-4 rounded-xl my-4 font-mono text-xs border-l-4 border-blue-500">
                <span className="text-blue-400">Time:</span> O(n)<br />
                <span className="text-purple-400">Space:</span> O(n) or O(1)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemDescription;
