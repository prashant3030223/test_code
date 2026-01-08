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

  // this will get rid of the flickering effect
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-6 p-4">
        <div className="relative">
          <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="font-black text-xs uppercase tracking-[0.5em] text-white/40">Initializing Session</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest">Bridging Quest Database...</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn btn-ghost btn-xs text-white/20 mt-8 hover:text-white"
        >
          Taking too long? Click to Refresh
        </button>
      </div>
    );
  }


  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />

        {/* Public Problems Browsing */}
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problem/:id" element={<ProblemPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to="/" />} />
        <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={isSignedIn ? <ProfilePage /> : <Navigate to="/" />} />
        <Route path="/contest" element={isSignedIn ? <ContestPage /> : <Navigate to="/" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isSignedIn ? "/dashboard" : "/"} replace />} />
      </Routes>


      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
