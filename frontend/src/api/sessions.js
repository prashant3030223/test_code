import { supabase } from "../lib/supabase";

export const sessionApi = {
  createSession: async (data) => {
    const { problem, difficulty, is_private, password, max_participants, problems } = data;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Generate call_id (Logic moved from backend)
    const callId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const sessionData = {
      problem,
      difficulty,
      host_id: user.id,
      call_id: callId,
      is_private: !!is_private,
      password: password || null,
      max_participants: max_participants || 2,
      problems: problems || [],
      status: 'active'
    };

    const { data: session, error } = await supabase
      .from("sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return { session };
  },

  getActiveSessions: async () => {
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
  },

  getMyRecentSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { sessions: [] };

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(`
        *,
        host:users!host_id(id, name, profile_image, email, clerk_id),
        participant:users!participant_id(id, name, profile_image, email, clerk_id)
      `)
      .eq("status", "completed")
      .or(`host_id.eq.${user.id},participant_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
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

    // Check if host (Optional security check on client, RLS should enforce strictly)
    const { data: session } = await supabase.from("sessions").select("host_id").eq("id", id).single();
    if (session && session.host_id !== user.id) {
      throw new Error("Only host can end session");
    }

    const { data, error } = await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { session: data, message: "Session ended successfully" };
  },

  finalizeSession: async (id, payload) => {
    // Replaces the backend finalize call. 
    // Email sending via Nodemailer IS REMOVED as it cannot run in browser.
    // We simply save the results to DB.

    const { problemScores, interviewMarks } = payload;

    const { error } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        problem_scores: problemScores,
        interview_marks: interviewMarks
      })
      .eq("id", id);

    if (error) throw error;
    return { message: "Session finalized. Results saved to DB." };
  }
};
