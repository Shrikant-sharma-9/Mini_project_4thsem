"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") as
    | "CANDIDATE"
    | "RECRUITER"
    | null;

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">(
    urlRole || "CANDIDATE"
  );

  useEffect(() => {
    if (urlRole && (urlRole === "CANDIDATE" || urlRole === "RECRUITER")) {
      setRole(urlRole);
    }
  }, [urlRole]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch(
          "http://localhost:8000/api/v1/auth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          }
        );

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Invalid credentials");
        }

        if (data.role !== role) {
          throw new Error(
            `Account not registered as ${role.toLowerCase()}.`
          );
        }

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user_id", data.user_id);

        router.push(
          data.role === "RECRUITER"
            ? "/recruiter"
            : "/candidate/dashboard"
        );
      } else {
        const payload = {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role,
        };

        const res = await fetch(
          "http://localhost:8000/api/v1/auth/signup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.detail || "Registration failed");

        setIsLogin(true);
        setError("Account created successfully. Please sign in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white flex items-center justify-between px-6 md:px-20 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/bgg.jpg')" }}
    >
      {/* 🔥 Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>

      {/* LEFT: Auth Form */}
      <div className="w-full max-w-lg z-10">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center text-zinc-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>

        {/* Welcome Text */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome to <span className="text-green-400">HIRE AI</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            Smart AI-powered hiring platform
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a]/80 border border-white/10 rounded-2xl p-10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,255,150,0.15)]"
        >
          {/* Title */}
          <div className="flex items-center justify-center gap-3 mb-8 text-xl font-bold">
            <ShieldCheck className="w-7 h-7 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
            Sign In required
          </div>

          {/* Tabs */}
          <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                isLogin ? "bg-green-500 text-black" : "text-zinc-400"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                !isLogin ? "bg-green-500 text-black" : "text-zinc-400"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 py-3 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!urlRole && (
              <div>
                <p className="text-sm text-zinc-400 mb-2">
                  {isLogin
                    ? "I am signing in as:"
                    : "I am registering as:"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("CANDIDATE")}
                    className={`py-3 rounded-xl border ${
                      role === "CANDIDATE"
                        ? "border-green-400 bg-green-500/10 text-green-400"
                        : "border-white/10 text-zinc-400"
                    }`}
                  >
                    <FileText className="inline w-4 h-4 mr-1" />
                    Candidate
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("RECRUITER")}
                    className={`py-3 rounded-xl border ${
                      role === "RECRUITER"
                        ? "border-purple-400 bg-purple-500/10 text-purple-400"
                        : "border-white/10 text-zinc-400"
                    }`}
                  >
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Recruiter
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 py-3 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 py-3 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] font-semibold flex justify-center items-center"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* RIGHT: AI Info Panel */}
      <div className="hidden md:flex flex-col max-w-xl text-white space-y-6 z-10 -ml-8">
        <h2 className="text-4xl font-bold leading-tight">
          Hire Smarter with <span className="text-green-400">AI</span>
        </h2>

        <p className="text-white-400 text-lg">
          Streamline your hiring process with intelligent resume screening, automated interviews, and powerful data-driven insights.
        </p>

        <div className="pt-4">
          <h2 className="text-xl font-semibold mb-4 text-white/90">
            Why <span className="text-green-400">Choose Us ?</span>
          </h2>

          <div className="space-y-3 text-zinc-300 text-base">
            <p>▸ <span className="font-semibold text-white">10,000+ Candidates Processed</span></p>
            <p>▸ <span className="font-semibold text-white">Reduce Hiring Time by 70%</span></p>
            <p>▸ <span className="font-semibold text-white">95% Recruiter Satisfaction</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}