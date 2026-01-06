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
      <div className="min-h-screen bg-[#1d232a] text-white flex flex-col items-center justify-center gap-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="font-mono text-sm opacity-50 uppercase tracking-widest">Initializing TestCode...</p>
      </div>
    );
  }


  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to={"/"} />} />

        <Route path="/problems" element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />} />
        <Route path="/problem/:id" element={isSignedIn ? <ProblemPage /> : <Navigate to={"/"} />} />
        <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to={"/"} />} />

        {/* New LeetCode Features */}
        <Route path="/profile" element={isSignedIn ? <ProfilePage /> : <Navigate to={"/"} />} />
        <Route path="/contest" element={isSignedIn ? <ContestPage /> : <Navigate to={"/"} />} />

        {/* Fallback for unknown routes like /login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>


      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
