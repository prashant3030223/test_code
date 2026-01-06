import { supabase } from "../lib/supabase";

export const contestApi = {
    getAllContests: async () => {
        const { data, error } = await supabase
            .from("contests")
            .select("*")
            .order("date", { ascending: true }); // Assume date column exists

        if (error) {
            console.warn("Error fetching contests:", error.message);
            return []; // Fail gracefully or stick with empty array if table missing
        }
        return data;
    },

    getMyRegistrations: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("contest_registrations")
            .select("*")
            .eq("user_id", user.id);

        if (error) {
            // console.warn("Error fetching registrations:", error);
            return [];
        }
        return data;
    },

    registerForContest: async (contestId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in");

        const { data, error } = await supabase
            .from("contest_registrations")
            .insert({
                user_id: user.id,
                contest_id: contestId,
                registered_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
