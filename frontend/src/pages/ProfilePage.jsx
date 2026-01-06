
import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import { User, MapPin, Link as LinkIcon, Github, Calendar, Trophy, Zap, Star, LayoutGrid, Award } from "lucide-react";
import { useAuth } from "../hooks/useSupabaseAuth";
import { useQuery } from "@tanstack/react-query";
import { problemApi } from "../api/problems";

const ProfilePage = () => {
    const { user } = useAuth();

    // Remote Stats Fetching + LocalStorage Merge
    const { data: remoteStats } = useQuery({
        queryKey: ["my-stats"],
        queryFn: problemApi.getUserStats
    });

    // Merge/Use Default Data
    const stats = {
        solved: remoteStats?.solvedCount || 0,
        total: remoteStats?.totalSubmissions || 0, // In reality, total problems, but for now using submissions
        easy: remoteStats?.easy || 0,
        medium: remoteStats?.medium || 0,
        hard: remoteStats?.hard || 0,
        acceptance: remoteStats?.totalSubmissions > 0 ? ((remoteStats.solvedCount / remoteStats.totalSubmissions) * 100).toFixed(1) + "%" : "0%",
        calendar: remoteStats?.submissionCalendar || {}
    };

    // For visualization sake if 0, show some placeholders or keep 0
    // Actually keep 0 to show "Real Time" empty state if new user.

    const [isEditing, setIsEditing] = useState(false);

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        // Here you would call supabase.auth.updateUser({ data: { ... } })
        setIsEditing(false);
        alert("Profile updated successfully!");
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-blue-500/30">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-8 flex items-start gap-8">

                {/* LEFT: USER CARD */}
                <div className="w-1/4 space-y-4">
                    <div className="bg-[#262626] rounded-xl p-6 shadow-lg border border-[#333]">
                        <div className="flex gap-4 items-start mb-4">
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-tr from-green-400 to-blue-600 p-[2px]">
                                <div className="w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden flex items-center justify-center">
                                    {user?.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="size-10 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold truncate" title={user?.email}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}</h2>
                                <p className="text-gray-400 text-xs">Rank {remoteStats?.rank ? remoteStats.rank.toLocaleString() : "Unranked"}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-500 py-2 rounded font-medium text-sm transition-colors border border-green-600/20"
                        >
                            Edit Profile
                        </button>

                        <div className="mt-6 space-y-3 text-sm text-gray-400">
                            <div className="flex items-center gap-3">
                                <MapPin className="size-4" /> <span>India</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Award className="size-4" /> <span>TestCode Scholar</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Github className="size-4" /> <a href="#" className="hover:text-blue-400">github.com/prashant</a>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-[#333]">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Community Stats</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><Trophy className="size-4 text-yellow-500" /> Reputation</span>
                                    <span className="font-bold">0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><Zap className="size-4 text-orange-500" /> Streak</span>
                                    <span className="font-bold">1 Day</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SKILLS TAGS */}
                    <div className="bg-[#262626] rounded-xl p-4 shadow-lg border border-[#333]">
                        <h3 className="text-sm font-bold text-gray-300 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Java', 'React', 'System Design', 'DP', 'Graphs'].map(tag => (
                                <span key={tag} className="px-2 py-1 bg-[#333] text-xs text-gray-300 rounded hover:bg-[#444] cursor-pointer">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTENTS */}
                <div className="flex-1 space-y-6">

                    {/* 1. SOLVED PROBLEMS STATS */}
                    <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
                        <h3 className="text-gray-400 font-medium mb-4 flex items-center gap-2">
                            <LayoutGrid className="size-5" /> Solved Problems
                        </h3>

                        <div className="flex items-center gap-8">
                            {/* DONUT CHART PLACEHOLDER */}
                            <div className="relative size-32">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <path className="text-[#333]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    {/* Progress Circle (Easy - Cyan) */}
                                    {/* <path className="text-cyan-500" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" /> */}
                                    {/* Simplified for demo - Just a white ring */}
                                    <path className="text-orange-500" strokeDasharray={`${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{stats.solved}</span>
                                    <span className="text-[10px] text-gray-400">Solved</span>
                                </div>
                            </div>

                            {/* DETAILS */}
                            <div className="flex-1 space-y-3">
                                <div className="bg-[#1a1a1a] rounded-lg p-3 flex justify-between items-center border border-[#333]">
                                    <span className="text-cyan-500 text-sm font-medium">Easy</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{stats.easy}</span>
                                        <span className="text-gray-500 text-xs">/ {stats.total / 3 | 0}</span>
                                    </div>
                                </div>
                                <div className="bg-[#1a1a1a] rounded-lg p-3 flex justify-between items-center border border-[#333]">
                                    <span className="text-yellow-500 text-sm font-medium">Medium</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{stats.medium}</span>
                                        <span className="text-gray-500 text-xs">/ {stats.total / 3 | 0}</span>
                                    </div>
                                </div>
                                <div className="bg-[#1a1a1a] rounded-lg p-3 flex justify-between items-center border border-[#333]">
                                    <span className="text-red-500 text-sm font-medium">Hard</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{stats.hard}</span>
                                        <span className="text-gray-500 text-xs">/ {stats.total / 3 | 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. RECENT ACTIVITY (HEATMAP REAL) */}
                    <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400 font-medium flex items-center gap-2">
                                <Calendar className="size-5" /> Submission Calendar
                            </h3>
                            <span className="text-xs text-gray-500">Last 6 Months</span>
                        </div>

                        {/* Real Heatmap Grid */}
                        <div className="flex gap-1 h-32 overflow-hidden align-bottom items-end opacity-90 overflow-x-auto pb-2 scrollbar-hide">
                            {Array.from({ length: 26 }).map((_, weekIndex) => (
                                <div key={weekIndex} className="flex-1 flex flex-col gap-1 min-w-[12px]">
                                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                                        // Calculate Date: (Today - (26 weeks * 7)) + (weekIndex * 7) + dayIndex
                                        // Simplified: Just showing raw grid mapped to recent dates is common, 
                                        // but accurate mapping requires generating dates backwards from today.

                                        // Accurate Backward Date Generation:
                                        const today = new Date();
                                        const dayOfWeek = today.getDay(); // 0-6
                                        const daysToSubtract = (25 - weekIndex) * 7 + (dayOfWeek - dayIndex);
                                        const date = new Date();
                                        date.setDate(date.getDate() - daysToSubtract);
                                        const dateStr = date.toISOString().split('T')[0];

                                        // Get activity count from stats.calendar (merged backend/local)
                                        const count = stats.calendar?.[dateStr] || 0;

                                        // Color logic
                                        let bgClass = 'bg-[#333]'; // 0
                                        if (count > 0) bgClass = 'bg-green-900/40';
                                        if (count > 2) bgClass = 'bg-green-700/60';
                                        if (count > 4) bgClass = 'bg-green-500';

                                        return (
                                            <div
                                                key={dayIndex}
                                                title={`${dateStr}: ${count} submissions`}
                                                className={`w-full aspect-square rounded-[2px] ${bgClass} hover:opacity-80 transition-colors cursor-pointer`}
                                            ></div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. RECENT SUBMISSIONS LIST */}
                    <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
                        <h3 className="text-gray-400 font-medium mb-4 flex items-center gap-2">
                            Badges
                        </h3>
                        <div className="flex gap-4">
                            <div className="size-20 bg-[#333] rounded-full flex items-center justify-center border border-[#444] grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <Trophy className="size-8 text-yellow-500" />
                            </div>
                            <div className="size-20 bg-[#333] rounded-full flex items-center justify-center border border-[#444] grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <Star className="size-8 text-purple-500" />
                            </div>
                            <div className="size-20 bg-[#333] rounded-full flex items-center justify-center border border-[#444] grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <Zap className="size-8 text-orange-500" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* EDIT PROFILE MODAL */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-[#262626] w-full max-w-md rounded-xl border border-[#333] shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#333]">
                            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                            <p className="text-sm text-gray-400 mt-1">Update your personal details.</p>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.user_metadata?.full_name || ""}
                                    className="w-full bg-[#1a1a1a] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">GitHub URL</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#1a1a1a] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="https://github.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Location</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#1a1a1a] border border-[#444] rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                                    placeholder="e.g. San Francisco"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors shadow-lg shadow-green-900/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
