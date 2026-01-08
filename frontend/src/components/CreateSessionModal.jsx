import { Code2Icon, LoaderIcon, PlusIcon, LockIcon, UnlockIcon, Users2Icon, CheckIcon, SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { problemApi } from "../api/problems";
import { useState, useMemo } from "react";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: problems = [] } = useQuery({
    queryKey: ["problemsLite"],
    queryFn: problemApi.getAllProblemsLite,
    enabled: isOpen
  });

  const filteredProblems = useMemo(() => {
    return problems.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [problems, searchTerm]);

  const toggleProblem = (problem) => {
    const isSelected = (roomConfig.problems || []).some(p => p.id === problem.id);
    let newProblems = [];
    if (isSelected) {
      newProblems = roomConfig.problems.filter(p => p.id !== problem.id);
    } else {
      newProblems = [...(roomConfig.problems || []), problem];
    }

    setRoomConfig({
      ...roomConfig,
      problems: newProblems,
      // Default primary problem for legacy reasons if only one is expected in some views
      problem: newProblems[0]?.title || "",
      difficulty: newProblems[0]?.difficulty || ""
    });
  };

  if (!isOpen) return null;

  const handleCreate = () => {
    if ((roomConfig.problems || []).length === 0) return;
    onCreateRoom();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl bg-base-100 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden border border-white/5">
        <div className="flex h-[600px]">
          {/* LEFT SIDE - PROBLEM SELECTION */}
          <div className="w-1/2 flex flex-col border-r border-white/5 bg-base-200/50">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-black text-xl mb-4 tracking-tight">Select Problems</h3>
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-base-content/30" />
                <input
                  type="text"
                  placeholder="Search problems..."
                  className="input input-bordered w-full pl-11 h-12 rounded-xl bg-base-100 border-none font-bold text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
              {filteredProblems.map((problem) => {
                const isSelected = (roomConfig.problems || []).some(p => p.id === problem.id);
                return (
                  <div
                    key={problem.id}
                    onClick={() => toggleProblem(problem)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-base-100 border-transparent hover:bg-base-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{problem.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{problem.difficulty}</span>
                      </div>
                      {isSelected && <CheckIcon className="size-4 text-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE - CONFIGURATION */}
          <div className="w-1/2 flex flex-col p-8">
            <div className="flex-1 space-y-8">
              <div>
                <h3 className="font-black text-2xl mb-2 tracking-tight">Session Config</h3>
                <p className="text-sm text-base-content/40 font-medium">Fine-tune your interview room environment.</p>
              </div>

              {/* PRIVACY SETTINGS */}
              <div className="space-y-4">
                <label className="label p-0">
                  <span className="label-text font-black text-[10px] uppercase tracking-[0.2em] text-base-content/40">Privacy & Access</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRoomConfig({ ...roomConfig, is_private: false })}
                    className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${!roomConfig.is_private ? 'border-primary bg-primary/5 text-primary' : 'border-base-300 opacity-50'}`}
                  >
                    <UnlockIcon className="size-4" />
                    <span className="font-black text-xs uppercase tracking-widest">Public</span>
                  </button>
                  <button
                    onClick={() => setRoomConfig({ ...roomConfig, is_private: true })}
                    className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${roomConfig.is_private ? 'border-primary bg-primary/5 text-primary' : 'border-base-300 opacity-50'}`}
                  >
                    <LockIcon className="size-4" />
                    <span className="font-black text-xs uppercase tracking-widest">Private</span>
                  </button>
                </div>

                {roomConfig.is_private && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                      type="password"
                      placeholder="Access Password"
                      className="input input-bordered w-full h-12 rounded-xl bg-base-200 border-none font-bold"
                      value={roomConfig.password || ""}
                      onChange={(e) => setRoomConfig({ ...roomConfig, password: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* PARTICIPANT LIMIT */}
              <div className="space-y-4">
                <label className="label p-0">
                  <span className="label-text font-black text-[10px] uppercase tracking-[0.2em] text-base-content/40">Participant Limit</span>
                </label>
                <div className="relative">
                  <Users2Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-base-content/30" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Max Participants (Default: 2)"
                    className="input input-bordered w-full pl-11 h-14 rounded-2xl bg-base-200 border-none font-black text-lg"
                    value={roomConfig.max_participants || 2}
                    onChange={(e) => setRoomConfig({ ...roomConfig, max_participants: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* SUMMARY */}
              {(roomConfig.problems || []).length > 0 && (
                <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 flex gap-4 items-center">
                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Code2Icon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase tracking-widest text-primary/60 mb-0.5">Selected</p>
                    <p className="text-sm font-black">{(roomConfig.problems || []).length} Challenges</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-8">
              <button className="flex-1 btn btn-ghost h-14 rounded-2xl font-bold" onClick={onClose}>
                CANCEL
              </button>
              <button
                className="flex-[2] btn btn-primary h-14 rounded-2xl font-black gap-2 shadow-2xl shadow-primary/20"
                onClick={handleCreate}
                disabled={isCreating || (roomConfig.problems || []).length === 0}
              >
                {isCreating ? <LoaderIcon className="size-5 animate-spin" /> : <PlusIcon className="size-5" />}
                {isCreating ? "LAUNCHING..." : "CREATE SESSION"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/80 backdrop-blur-md" onClick={onClose}></div>
    </div>
  );
}
export default CreateSessionModal;
