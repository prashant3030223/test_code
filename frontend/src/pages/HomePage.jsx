import { Link } from "react-router";
import {
  ArrowRightIcon,
  CheckIcon,
  Code2Icon,
  MailIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useState } from "react";
import toast from "react-hot-toast";

function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the login link!");
      // Open the modal if using a modal system, or just show success
      document.getElementById("auth_modal").close();
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + "/dashboard",
      }
    });
    if (error) {
      toast.error(`${provider} login error: ${error.message}. Please enable it in Supabase dashboard.`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-base-100 via-base-200 to-base-300 min-h-screen">
      {/* NAVBAR */}
      <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link
            to={"/"}
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <SparklesIcon className="size-6 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
                TestCode
              </span>
              <span className="text-xs text-base-content/60 font-medium -mt-1">Code Together</span>
            </div>
          </Link>

          <button
            onClick={() => document.getElementById("auth_modal").showModal()}
            className="group px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="badge badge-primary badge-lg">
              <ZapIcon className="size-4" />
              Real-time Collaboration
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Code Together,
              </span>
              <br />
              <span className="text-base-content">Learn Together</span>
            </h1>

            <p className="text-xl text-base-content/70 leading-relaxed max-w-xl">
              The ultimate platform for collaborative coding interviews and pair programming.
              Connect face-to-face, code in real-time, and ace your technical interviews.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById("auth_modal").showModal()}
                className="btn btn-primary btn-lg rounded-2xl"
              >
                Start Coding Now
                <ArrowRightIcon className="size-5" />
              </button>

              <button className="btn btn-outline btn-lg rounded-2xl">
                <VideoIcon className="size-5" />
                Watch Demo
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img
              src="/hero.png"
              alt="TestCode"
              className="relative w-full h-auto rounded-3xl shadow-2xl border border-base-content/10"
            />
          </div>
        </div>
      </div>

      {/* AUTH MODAL */}
      <dialog id="auth_modal" className="modal">
        <div className="modal-box bg-base-100 border border-primary/20 shadow-2xl rounded-3xl p-8">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
          </form>

          <div className="text-center mb-8">
            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="size-8 text-primary" />
            </div>
            <h3 className="text-3xl font-black">Welcome Back</h3>
            <p className="text-base-content/60 mt-2">Sign in to start your session</p>
          </div>

          <div className="space-y-4">
            {/* EMAIL LOGIN */}
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <div className="form-control">
                <div className="relative">
                  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-base-content/40" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="input input-bordered w-full pl-12 h-14 bg-base-200 border-none focus:ring-2 focus:ring-primary/50 transition-all rounded-2xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-14 rounded-2xl text-lg font-bold"
              >
                {loading ? <span className="loading loading-spinner"></span> : "Send Magic Link"}
              </button>
            </form>

            <div className="divider text-xs font-bold opacity-30">OR CONTINUE WITH</div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin('github')}
                className="btn btn-outline h-14 rounded-2xl gap-3 border-base-content/10 hover:bg-base-content/5"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                Github
              </button>
              <button
                onClick={() => handleSocialLogin('google')}
                className="btn btn-outline h-14 rounded-2xl gap-3 border-base-content/10 hover:bg-base-content/5"
              >
                <svg className="size-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.9 0 3.61.65 4.95 1.93l3.71-3.71C18.41 1.14 15.42 0 12 0 7.31 0 3.3 2.68 1.23 6.64l4.24 3.29C6.46 7.03 9 5.04 12 5.04z" /><path fill="#4285F4" d="M23.52 12.27c0-.88-.08-1.74-.23-2.58H12v4.88h6.45c-.28 1.5-1.13 2.76-2.39 3.62l3.75 2.91c2.19-2.02 3.47-5 3.47-8.83z" /><path fill="#FBBC05" d="M5.47 14.33c-.26-.77-.4-1.59-.4-2.33s.14-1.56.4-2.33L1.23 6.64C.44 8.19 0 9.94 0 12s.44 3.81 1.23 5.36l4.24-3.03z" /><path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.95-2.91l-3.75-2.91c-1.09.73-2.48 1.16-4.2 1.16-3 0-5.54-1.99-6.45-4.66L1.23 17.36C3.3 21.32 7.31 24 12 24z" /></svg>
                Google
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center text-base-content/40 mt-8 uppercase tracking-widest font-bold">
            Secure Authentication by Supabase
          </p>
        </div>
      </dialog>
    </div>
  );
}
export default HomePage;
