"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowLeft, BrainCircuit, Sparkles, Award, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CandidateDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "CANDIDATE") {
            router.push("/auth");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (!isAuthenticated) return null; // Prevent UI flash

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError("");
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:8000/api/v1/resumes/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Failed to parse resume.");
            }

            setResult(data);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden font-sans flex flex-col items-center">
            {/* Premium Deep Mesh Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-emerald-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="max-w-6xl w-full mx-auto z-10 relative mt-8">
                <div className="flex justify-between items-center mb-10 w-full">
                    <Link href="/candidate/dashboard" className="inline-flex items-center text-zinc-400 hover:text-indigo-400 transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium">
                        View Dashboard
                    </Link>
                    <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("user_id"); router.push("/"); }} className="inline-flex items-center text-zinc-400 hover:text-red-400 transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                </div>

                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Candidate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Portal</span></h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">Upload your resume to our AI engine. We will instantly parse your skills, infer your seniority, and sanitize bias identifiers.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] w-full sticky top-8"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Document Analysis</h2>
                        </div>

                        <label className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden mb-6 h-64 ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            {file ? (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center text-emerald-400">
                                    <CheckCircle2 className="w-12 h-12 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <p className="font-bold text-center text-white text-lg truncate w-full max-w-[250px]">{file.name}</p>
                                    <p className="text-sm mt-2 font-medium">Ready for extraction</p>
                                </motion.div>
                            ) : (
                                <>
                                    <UploadCloud className="w-12 h-12 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-4" />
                                    <p className="font-semibold text-center text-zinc-300">Click to browse or drag PDF here</p>
                                    <p className="text-sm text-zinc-500 mt-2">Maximum file size 10MB</p>
                                </>
                            )}
                        </label>

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <><Loader2 className="w-6 h-6 animate-spin" /> Deep Scanning...</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> Run AI Extraction</>
                            )}
                        </button>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Results Section */}
                    <div className="lg:col-span-7 w-full">
                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 md:p-10 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8 mb-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 border border-emerald-500/20">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Extraction Successful
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">Parsed Profile</h2>
                                        </div>

                                        {result.resume_data.seniority_level && (
                                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                                                <Award className="w-6 h-6 text-yellow-400" />
                                                <div>
                                                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Inferred Level</div>
                                                    <div className="text-lg font-black text-white">{result.resume_data.seniority_level}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                                <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest block mb-2">Total Experience</span>
                                                <div className="text-3xl font-black text-white">{result.resume_data.experience_years} <span className="text-sm font-bold text-zinc-500">YEARS</span></div>
                                            </div>
                                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest block mb-2">Education Level</span>
                                                <div className="text-3xl font-black text-white">{result.resume_data.education_level}<span className="text-xl text-zinc-600">/3</span></div>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-zinc-500 text-xs font-bold block mb-4 uppercase tracking-widest">Extracted Capabilities</span>
                                            <div className="flex flex-wrap gap-2.5">
                                                {result.resume_data.skills.length > 0 ? result.resume_data.skills.map((s: string) => (
                                                    <span key={s} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors cursor-default shadow-sm">{s}</span>
                                                )) : <span className="text-zinc-600 font-medium">No valid skills deciphered.</span>}
                                            </div>
                                        </div>

                                        {result.resume_data.certifications.length > 0 && (
                                            <div>
                                                <span className="text-purple-400 text-xs font-bold block mb-4 uppercase tracking-widest">Verified Certifications</span>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {result.resume_data.certifications.map((c: string) => (
                                                        <span key={c} className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.1)]">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-8 pt-8 border-t border-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Raw Sanitized Output</span>
                                                <span className="text-xs text-zinc-600 font-medium bg-black/50 px-2 py-1 rounded">Identifiers Redacted</span>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                                                <p className="text-sm text-zinc-400 leading-relaxed font-mono bg-[#050505] p-6 rounded-2xl border border-white/5 h-48 overflow-y-auto w-full whitespace-pre-wrap custom-scrollbar">
                                                    {result.extracted_text_preview}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
