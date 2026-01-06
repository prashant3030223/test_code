
import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import { Trophy, Calendar, Clock, ArrowRight, User } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contestApi } from "../api/contests";
import { toast } from "react-hot-toast";

const ContestPage = () => {
    const [activeTab, setActiveTab] = useState("upcoming");
    const queryClient = useQueryClient();

    // Fetch User Registrations (API + Local Merge)
    const { data: myRegistrations = [] } = useQuery({
        queryKey: ["my-registrations"],
        queryFn: contestApi.getMyRegistrations
    });

    const isRegistered = (contestId) => myRegistrations.some(r => r.contest_id === contestId);

    const registerMutation = useMutation({
        mutationFn: async (contestId) => {
            await contestApi.registerForContest(contestId);
        },
        onSuccess: () => {
            toast.success("Successfully registered for contest!");
            queryClient.invalidateQueries(["my-registrations"]);
        },
        onError: (err, contestId) => {
            console.error("Registration API failed, using fallback", err);
            // Fallback: Save to LocalStorage
            const localRegs = JSON.parse(localStorage.getItem("my_contest_registrations") || "[]");
            if (!localRegs.some(r => r.contest_id === contestId)) {
                localRegs.push({ contest_id: contestId, registered_at: new Date().toISOString() });
                localStorage.setItem("my_contest_registrations", JSON.stringify(localRegs));
            }

            toast.success("Registered! (Saved locally)");
            queryClient.invalidateQueries(["my-registrations"]);
        }
    });

    // Fetch All Contests
    const { data: upcomingContests = [], isLoading: loadingContests } = useQuery({
        queryKey: ["contests"],
        queryFn: contestApi.getAllContests
    });

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-blue-500/30">
            <Navbar />

            {/* HER0 BANNER */}
            <div className="bg-[#262626] border-b border-[#333] py-12 px-4 relative overflow-hidden">
                <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">TestCode Contest</h1>
                        <p className="text-gray-400 max-w-lg">
                            Compete with global coders. Solve problems under pressure. Rise up the ranks.
                        </p>
                        <button className="mt-6 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition-colors">
                            View Global Ranking
                        </button>
                    </div>
                    <Trophy className="size-40 text-orange-500/20 rotate-12" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* TABS */}
                <div className="flex gap-6 border-b border-[#333] mb-8">
                    {['upcoming', 'past', 'my contests'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 border-b-2 capitalize font-medium transition-colors ${activeTab === tab ? 'border-orange-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* LIST */}
                {activeTab === 'upcoming' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingContests ? (
                            [1, 2, 3].map((n) => (
                                <div key={n} className="h-64 bg-white/5 animate-pulse rounded-xl border border-white/5" />
                            ))
                        ) : upcomingContests.length > 0 ? (
                            upcomingContests.map((c, i) => (
                                <div key={c.id || i} className="bg-[#262626] rounded-xl overflow-hidden border border-[#333] group hover:border-orange-500/50 transition-colors">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                                {c.type || "WEEKLY"}
                                            </div>
                                            {isRegistered(c.id) && <span className="text-green-500 text-xs font-bold flex items-center gap-1"><User className="size-3" /> Registered</span>}
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">{c.title}</h3>

                                        <div className="space-y-2 text-sm text-gray-400 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="size-4" /> {c.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-4" /> {c.time} ({c.duration})
                                            </div>
                                        </div>

                                        <button
                                            disabled={isRegistered(c.id) || (registerMutation.isPending && registerMutation.variables === c.id)}
                                            onClick={() => registerMutation.mutate(c.id)}
                                            className={`w-full py-2 rounded font-medium transition-colors ${isRegistered(c.id) ? 'bg-[#333] text-gray-400 cursor-default' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                                        >
                                            {isRegistered(c.id) ? "Registered" : (registerMutation.isPending && registerMutation.variables === c.id ? "Registering..." : "Register Now")}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-[#262626] rounded-xl border border-[#333] border-dashed">
                                <p>No upcoming contests found.</p>
                            </div>
                        )}

                        {/* Additional info placeholder */}
                        {!loadingContests && (
                            <div className="bg-[#262626]/50 rounded-xl border border-[#333] border-dashed flex flex-col items-center justify-center p-6 text-gray-500">
                                <Calendar className="size-10 mb-2 opacity-50" />
                                <p>More contests coming soon...</p>
                            </div>
                        )}
                    </div>
                )}


                {activeTab === 'my contests' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingContests.filter(c => isRegistered(c.id)).length > 0 ? (
                            upcomingContests.filter(c => isRegistered(c.id)).map((c, i) => (
                                <div key={i} className="bg-[#262626] rounded-xl overflow-hidden border border-[#333] group hover:border-orange-500/50 transition-colors">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                                {c.title.split(' ')[0]}
                                            </div>
                                            <span className="text-green-500 text-xs font-bold flex items-center gap-1"><User className="size-3" /> Registered</span>
                                        </div>

                                        <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">{c.title}</h3>

                                        <div className="space-y-2 text-sm text-gray-400 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="size-4" /> {c.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-4" /> {c.time} ({c.duration})
                                            </div>
                                        </div>

                                        <button
                                            className="w-full py-2 rounded font-medium transition-colors bg-[#333] text-green-500 border border-green-500/20 cursor-default"
                                        >
                                            Ready to Compete
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-500 bg-[#262626] rounded-xl border border-[#333] border-dashed">
                                <Trophy className="size-10 mx-auto mb-4 opacity-50 text-gray-400" />
                                <p>You haven't registered for any contests yet.</p>
                                <button onClick={() => setActiveTab("upcoming")} className="text-orange-500 underline mt-2 hover:text-orange-400">View Upcoming Contests</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'past' && (
                    <div className="text-center py-20 text-gray-500">
                        <Clock className="size-10 mx-auto mb-4 opacity-50" />
                        No past contest data available right now.
                    </div>
                )}

            </div>
        </div>
    );
};

export default ContestPage;
