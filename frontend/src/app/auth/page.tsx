"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Briefcase, FileText, Loader2, ShieldCheck, Mail, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlRole = searchParams.get("role") as "CANDIDATE" | "RECRUITER" | null;

    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">(urlRole || "CANDIDATE");

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
                // FastAPI OAuth2PasswordRequestForm requires form-data
                const formData = new URLSearchParams();
                formData.append("username", email);
                formData.append("password", password);

                const res = await fetch("http://localhost:8000/api/v1/auth/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString()
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Invalid credentials");
                }

                if (data.role !== role) {
                    throw new Error(`Account not registered as ${role.toLowerCase()}.`);
                }

                localStorage.setItem("token", data.access_token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("user_id", data.user_id); // Ensure user_id is set if available

                router.push(data.role === "RECRUITER" ? "/recruiter" : "/candidate/dashboard");

            } else {
                // Registration Payload
                const payload = {
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    role
                };

                const res = await fetch("http://localhost:8000/api/v1/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Registration failed");

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
        <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md z-10">
                <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-center gap-3 mb-8 text-center text-2xl font-bold tracking-tight">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                        Sign In required
                    </div>

                    <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/5 relative">
                        <motion.div
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg"
                            animate={{ x: isLogin ? 0 : "100%" }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                        <button
                            type="button"
                            className={`w-1/2 py-2 text-sm font-medium relative z-10 transition-colors ${isLogin ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                            onClick={() => { setIsLogin(true); setError(""); }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`w-1/2 py-2 text-sm font-medium relative z-10 transition-colors ${!isLogin ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                            onClick={() => { setIsLogin(false); setError(""); }}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                            <>
                                <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                                            <input
                                                type="text" required placeholder="First Name"
                                                value={firstName} onChange={e => setFirstName(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text" required placeholder="Last Name"
                                                value={lastName} onChange={e => setLastName(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!urlRole && (
                            <div className="pt-2 pb-2">
                                <span className="text-sm text-zinc-400 block mb-2">{isLogin ? "I am signing in as a:" : "I am registering as a:"}</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole("CANDIDATE")}
                                        className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${role === "CANDIDATE" ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-white/10 bg-black/30 text-zinc-500 hover:text-zinc-300"
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" /> Candidate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("RECRUITER")}
                                        className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${role === "RECRUITER" ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-white/10 bg-black/30 text-zinc-500 hover:text-zinc-300"
                                            }`}
                                    >
                                        <Briefcase className="w-4 h-4" /> Recruiter
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                            <input
                                type="email" required placeholder="Email Address"
                                value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                            <input
                                type="password" required placeholder="Password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                            />
                        </div>

                            </>

                        
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${!isLogin && role === "RECRUITER"
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isLogin ? "Sign In" : "Create Account"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <AuthForm />
        </Suspense>
    );
}
