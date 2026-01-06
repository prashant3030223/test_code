import { supabase } from "../lib/supabase";

export const problemApi = {
    getAllProblems: async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch Problems
        const { data: problems, error } = await supabase
            .from("problems")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // 2. Fetch Solved Status if logged in
        if (user) {
            const { data: submissions } = await supabase
                .from("submissions")
                .select("problem_id")
                .eq("user_id", user.id)
                .eq("status", "Accepted");

            const solvedSet = new Set(submissions?.map(s => s.problem_id));
            return problems.map(p => ({
                ...p,
                isSolved: solvedSet.has(p.id)
            }));
        }

        return problems;
    },

    getProblemById: async (id) => {
        const { data, error } = await supabase
            .from("problems")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },

    submitSolution: async (submissionData) => {
        // submissionData: { problemId, status, language, runtime, code }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to submit");

        const { problemId, status, language, runtime, code } = submissionData;

        const { data, error } = await supabase
            .from("submissions")
            .insert({
                user_id: user.id,
                problem_id: problemId,
                status,
                language,
                runtime,
                code
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getSubmissionsForProblem: async (problemId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("submissions")
            .select("*")
            .eq("user_id", user.id)
            .eq("problem_id", problemId)
            .order("created_at", { ascending: false });


        if (error) throw error;
        return data;
    },

    getUserStats: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { totalSubmissions: 0, solvedCount: 0, easy: 0, medium: 0, hard: 0, recent: [], submissionCalendar: {} };

        // 1. Fetch all submissions for user
        const { data: submissions, error } = await supabase
            .from("submissions")
            .select(`
            *,
            problem:problems(difficulty)
        `)
            .eq("user_id", user.id);

        if (error) throw error;

        const totalSubmissions = submissions.length;
        const solvedProbs = new Set();
        let easy = 0, medium = 0, hard = 0;
        const calendar = {};

        submissions.forEach(s => {
            // Calendar
            const date = new Date(s.created_at).toISOString().split('T')[0];
            calendar[date] = (calendar[date] || 0) + 1;

            if (s.status === "Accepted") {
                if (!solvedProbs.has(s.problem_id)) {
                    solvedProbs.add(s.problem_id);
                    // Difficulty
                    const diff = s.problem?.difficulty || "Medium";
                    if (diff === "Easy") easy++;
                    else if (diff === "Medium") medium++;
                    else if (diff === "Hard") hard++;
                }
            }
        });

        return {
            totalSubmissions,
            solvedCount: solvedProbs.size,
            easy,
            medium,
            hard,
            recent: submissions.slice(0, 10), // simplified
            submissionCalendar: calendar
        };
    },

    // Interactions
    getInteractionState: async (problemId) => {
        const { data: { user } } = await supabase.auth.getUser();

        let isLiked = false;
        let isStarred = false;

        // Get Likes Count
        const { count } = await supabase.from("problem_likes").select("*", { count: 'exact', head: true }).eq("problem_id", problemId);

        if (user) {
            const { data: like } = await supabase.from("problem_likes").select("id").eq("problem_id", problemId).eq("user_id", user.id).single();
            isLiked = !!like;

            const { data: star } = await supabase.from("problem_stars").select("id").eq("problem_id", problemId).eq("user_id", user.id).single();
            isStarred = !!star;
        }

        return { isLiked, isStarred, likes: count || 0 };
    },

    toggleLike: async (problemId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Login required");

        const { data: existing } = await supabase.from("problem_likes").select("id").eq("problem_id", problemId).eq("user_id", user.id).single();

        if (existing) {
            await supabase.from("problem_likes").delete().eq("id", existing.id);
            return { liked: false };
        } else {
            await supabase.from("problem_likes").insert({ problem_id: problemId, user_id: user.id });
            return { liked: true };
        }
    },

    toggleStar: async (problemId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Login required");

        const { data: existing } = await supabase.from("problem_stars").select("id").eq("problem_id", problemId).eq("user_id", user.id).single();

        if (existing) {
            await supabase.from("problem_stars").delete().eq("id", existing.id);
            return { starred: false };
        } else {
            await supabase.from("problem_stars").insert({ problem_id: problemId, user_id: user.id });
            return { starred: true };
        }
    },

    getSolutions: async (problemId) => {
        const { data, error } = await supabase
            .from("problem_solutions")
            .select(`
            *,
            user:users!user_id(name, avatar_url)
        `)
            .eq("problem_id", problemId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    },

    postSolution: async (problemId, { title, content, language }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Login required");

        const { data, error } = await supabase
            .from("problem_solutions")
            .insert({
                problem_id: problemId,
                user_id: user.id,
                title,
                content,
                language
            })
            .select(`
            *,
            user:users!user_id(name, avatar_url)
        `)
            .single();

        if (error) throw error;
        return data;
    },

    getProblemsPaginated: async ({ page = 1, pageSize = 20, search = "", difficulty = "All", company = "All" } = {}) => {
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase.from("problems").select("*", { count: "exact" });

        // Apply Filters
        if (search) query = query.ilike("title", `%${search}%`);
        if (difficulty !== "All") query = query.eq("difficulty", difficulty);
        if (company !== "All") query = query.contains("companies", [company]);

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Sorting (Stable sort)
        query = query.order("created_at", { ascending: true }).range(from, to);

        const { data: problems, count, error } = await query;
        if (error) throw error;

        // Fetch Solved Status if logged in
        if (user && problems.length > 0) {
            const { data: submissions } = await supabase
                .from("submissions")
                .select("problem_id")
                .eq("user_id", user.id)
                .eq("status", "Accepted")
                .in("problem_id", problems.map(p => p.id));

            const solvedSet = new Set(submissions?.map(s => s.problem_id));
            problems.forEach(p => p.isSolved = solvedSet.has(p.id));
        }

        return { problems, count: count || 0 };
    },

    getGlobalStats: async () => {
        // Lightweight fetch for stats and filters
        const { data, error } = await supabase
            .from("problems")
            .select("difficulty, companies");

        if (error) throw error;

        return data;
    }
};
