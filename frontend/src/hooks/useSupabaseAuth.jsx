import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
        // Safety timeout to prevent infinite loading if Supabase hangs
        const timeout = setTimeout(() => {
            if (!isLoaded) {
                console.warn("Auth initialization timed out. Forcing isLoaded to true.");
                setIsLoaded(true);
            }
        }, 5000);

        // Check active sessions and sets the user
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoaded(true);
                clearTimeout(timeout);
            })
            .catch(err => {
                console.error("Error getting session:", err);
                setIsLoaded(true); // Don't block the app even on error
                clearTimeout(timeout);
            });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth State Changed:", _event);
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoaded(true);
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);


    const signOut = () => supabase.auth.signOut();

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
