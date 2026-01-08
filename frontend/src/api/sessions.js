import { supabase } from "../lib/supabase";

export const sessionApi = {
  createSession: async (data) => {
    const { problem, difficulty, is_private, password, max_participants, problems } = data;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 2. Fetch the actual profile from the 'users' table
    // We try to find by clerk_id first
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    // Fallback: If not found by clerk_id, try finding where ID matches the Auth ID
    if (!profile) {
      const { data: profileById } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      profile = profileById;
    }

    if (!profile) {
      console.error("User profile not found for Auth ID:", user.id);
      throw new Error("Your user profile was not found. Please try refreshing the page or logging out and back in.");
    }

    // Generate call_id
    const callId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const sessionData = {
      problem: problem || (problems && problems[0]?.title) || "Untitled Session",
      difficulty: difficulty || (problems && problems[0]?.difficulty) || "Medium",
      host_id: profile.id,
      call_id: callId,
      is_private: !!is_private,
      password: password || null,
      max_participants: max_participants || 2,
      problems: problems || [],
      status: 'active'
    };

    console.log("Attempting to create session with data:", sessionData);

    const { data: session, error } = await supabase
      .from("sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error("Critical: Supabase Session Creation Error!", error);
      throw new Error(`Database Error: ${error.message} (Code: ${error.code})`);
    }
    return { session };
  },

  getActiveSessions: async () => {
    const fetchPromise = (async () => {
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select(`
          *,
          host:users!host_id(id, name, profile_image, email, clerk_id),
          participant:users!participant_id(id, name, profile_image, email, clerk_id)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return { sessions };
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Active Sessions Fetch Timeout")), 10000)
    );

    return Promise.race([fetchPromise, timeoutPromise]);
  },

  getMyRecentSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { sessions: [] };

    // Resolve internal profile ID
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();

    const profileId = profile?.id || user.id;

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(`
        *,
        host:users!host_id(id, name, profile_image, email, clerk_id),
        participant:users!participant_id(id, name, profile_image, email, clerk_id)
      `)
      .eq("status", "completed")
      .or(`host_id.eq.${profileId},participant_id.eq.${profileId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching recent sessions:", error);
      throw error;
    }
    return { sessions };
  },

  getSessionById: async (id) => {
    const { data: session, error } = await supabase
      .from("sessions")
      .select(`
        *,
        host:users!host_id(id, name, profile_image, email, clerk_id),
        participant:users!participant_id(id, name, profile_image, email, clerk_id)
      `)
      .eq("id", id)
      .single();

    if (error) throw error; // Handle 404/others in hook
    return { session };
  },

  joinSession: async (id, { password: joinPassword } = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    // 1. Fetch Session to validate
    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !session) throw new Error("Session not found");

    // Validations (Moved from backend)
    if (session.status !== "active") throw new Error("Cannot join a completed session");
    if (session.host_id === user.id) throw new Error("Host cannot join their own session as participant");

    if (session.is_private && session.password) {
      if (joinPassword !== session.password) {
        throw new Error("Incorrect password for this private session");
      }
    }

    if (session.participant_id && session.participant_id !== user.id) {
      throw new Error("Session is already full");
    }

    // 2. Update Session
    const { data: updatedSession, error: updateError } = await supabase
      .from("sessions")
      .update({ participant_id: user.id })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return { session: updatedSession };
  },

  endSession: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Attempt to end the session. RLS should handle permission.
    // We check the result to ensure it actually happened.
    const { data, error } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase Error ending session:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      // If no rows were updated, check if it's because of permissions
      const { data: checkSession } = await supabase.from("sessions").select("host_id").eq("id", id).single();
      if (!checkSession) throw new Error("Session not found");
      throw new Error("Only the host can end this session");
    }

    return { session: data[0], message: "Session ended successfully" };
  },

  finalizeSession: async (id, payload) => {
    const { problemScores, interviewMarks } = payload;

    const { data, error } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        problem_scores: problemScores,
        interview_marks: String(interviewMarks),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Failed to finalize session: Permission denied or session not found");
    }

    return { message: "Session finalized. Results saved to DB." };
  }
};
