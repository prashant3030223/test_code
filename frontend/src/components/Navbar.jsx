import { Link, useLocation } from "react-router";
import { BookOpenIcon, LayoutDashboardIcon, LogOutIcon, SparklesIcon, UserIcon } from "lucide-react";
import { useAuth } from "../hooks/useSupabaseAuth";

function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
        {/* LOGO */}
        <Link
          to="/"
          className="group flex items-center gap-3 hover:scale-105 transition-transform duration-200"
        >
          <div className="size-10 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center shadow-lg ">
            <SparklesIcon className="size-6 text-white" />
          </div>

          <div className="flex flex-col">
            <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
              TestCode
            </span>
            <span className="text-xs text-base-content/60 font-medium -mt-1">Code Together</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* PROBLEMS PAGE LINK */}
          <Link
            to={"/problems"}
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 
              ${isActive("/problems")
                ? "bg-primary text-primary-content"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
              }
              
              `}
          >
            <div className="flex items-center gap-x-2.5">
              <BookOpenIcon className="size-4" />
              <span className="font-medium hidden sm:inline">Problems</span>
            </div>
          </Link>

          <Link
            to={"/contest"}
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 
              ${isActive("/contest")
                ? "bg-primary text-primary-content"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
              }`}
          >
            <div className="flex items-center gap-x-2.5">
              <span className="font-medium hidden sm:inline">Contest</span>
            </div>
          </Link>

          {/* DASHBOARD PAGE LINK */}
          <Link
            to={"/dashboard"}
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 
              ${isActive("/dashboard")
                ? "bg-primary text-primary-content"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
              }
              
              `}
          >
            <div className="flex items-center gap-x-2.5">
              <LayoutDashboardIcon className="size-4" />
              <span className="font-medium hidden sm:inline">Dashboard</span>
            </div>
          </Link>

          {/* USER MENU */}
          <div className="dropdown dropdown-end ml-4">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar border border-primary/20 shadow-sm">
              <div className="w-10 rounded-full">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" />
                ) : (
                  <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                    <UserIcon className="size-5 text-primary" />
                  </div>
                )}
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-primary/10">
              <li className="px-4 py-2 text-xs font-bold text-base-content/50 uppercase tracking-widest">
                Account
              </li>
              <li className="mb-2">
                <div className="flex flex-col items-start gap-0.5 pointer-events-none px-4">
                  <span className="font-bold text-sm truncate max-w-full">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] opacity-60 truncate max-w-full">{user?.email}</span>
                </div>
              </li>
              <li>
                <Link to="/profile" className="flex items-center gap-2 py-2">
                  <UserIcon className="size-4" /> Profile
                </Link>
              </li>
              <div className="divider my-0 opacity-50"></div>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    console.log("Navbar: Sign Out clicked");
                    signOut();
                  }}
                  className="text-error hover:bg-error/10 flex items-center w-full gap-2 py-3 px-4 rounded-lg transition-colors"
                >
                  <LogOutIcon className="size-4" />
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
