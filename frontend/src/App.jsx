import { useAuth } from "./hooks/useSupabaseAuth";

import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import ProfilePage from "./pages/ProfilePage";
import ContestPage from "./pages/ContestPage";

function App() {
  const { isSignedIn, isLoaded } = useAuth();
  console.log("Auth State:", { isSignedIn, isLoaded });

  // DEMO MODE: Bypass auth to show UI immediately
  const DEMO_MODE = true;
  const effectiveSignedIn = DEMO_MODE || isSignedIn;

  // this will get rid of the flickering effect
  if (!isLoaded && !DEMO_MODE) {
    return (
      <div className="min-h-screen bg-[#1d232a] text-white flex flex-col items-center justify-center gap-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="font-mono text-sm opacity-50 uppercase tracking-widest">Initializing TestCode...</p>
      </div>
    );
  }


  return (
    <>
      <Routes>
        <Route path="/" element={!effectiveSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problem/:id" element={<ProblemPage />} />
        <Route path="/session/:id" element={<SessionPage />} />

        {/* New LeetCode Features */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/contest" element={<ContestPage />} />

        {/* Fallback for unknown routes like /login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>


      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
