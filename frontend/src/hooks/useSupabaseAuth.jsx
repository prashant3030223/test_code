import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

const AuthContext = createContext({
    user: null,
    session: null,
    isSignedIn: false,
    isLoaded: false,
    signOut: () => { },
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            console.log("Auth: Initializing...");
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoaded(true);
                    console.log("Auth: Initial session loaded", !!session);
                }
            } catch (err) {
                console.error("Auth: Initial session error", err);
                if (mounted) setIsLoaded(true);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth: State Change ->", _event);
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoaded(true);
            }
        });

        initAuth();

        const timeout = setTimeout(() => {
            if (mounted && !isLoaded) {
                console.warn("Auth: Initialization threshold reached. Forcing load state.");
                setIsLoaded(true);
            }
        }, 3000); // 3 seconds is enough for auth

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    // Separated Profile Sync Effect
    useEffect(() => {
        if (!user) return;

        const syncProfile = async () => {
            try {
                const { data: existingUser } = await supabase
                    .from("users")
                    .select("id")
                    .eq("clerk_id", user.id)
                    .maybeSingle();

                if (!existingUser) {
                    console.log("Auth: Syncing new profile...");
                    const newUser = {
                        id: user.id,
                        clerk_id: user.id,
                        email: user.email,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
                        profile_image: user.user_metadata?.avatar_url || "",
                    };
                    const { error } = await supabase.from("users").insert(newUser);
                    if (error) console.error("Auth: Sync Error", error);
                }
            } catch (err) {
                console.error("Auth: Sync Failed", err);
            }
        };

        syncProfile();
    }, [user?.id]);


    const signOut = async () => {
        console.log("AuthProvider: signOut starting...");
        try {
            // 1. CLEAR LOCAL STATE IMMEDIATELY (Don't wait for server)
            setSession(null);
            setUser(null);

            // 2. Clear session specific local storage
            Object.keys(localStorage).forEach(key => {
                if (key.includes('session_') || key.includes('interview')) {
                    localStorage.removeItem(key);
                }
            });

            // 3. Close dropdowns
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            toast.success("Logging out...");

            // 4. Background sign out from Supabase (Don't await it if we want instant UI)
            supabase.auth.signOut().catch(e => console.error("Supabase signOut error:", e));

            console.log("AuthProvider: Sign out cleanup complete");
        } catch (error) {
            console.error("Sign Out Error:", error);
            setSession(null);
            setUser(null);
        }
    };

    const value = {
        user,
        session,
        isSignedIn: !!user,
        isLoaded,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Mock useUser for compatibility with Clerk-heavy codebases if needed
export const useUser = () => {
    const { user, isLoaded, isSignedIn } = useAuth();
    return { user, isLoaded, isSignedIn };
};
