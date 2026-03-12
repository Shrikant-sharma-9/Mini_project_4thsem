"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
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
        <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 relative">
            <div className="max-w-4xl mx-auto z-10 relative">
                <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold mb-2">Candidate Portal</h1>
                    <p className="text-zinc-400">Upload your resume to instantly see how our AI engine structures your profile.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-fit">
                        <h2 className="text-xl font-semibold mb-6">Upload Resume (PDF)</h2>

                        <label className="border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group relative overflow-hidden">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-blue-400 transition-colors mb-4" />
                            <p className="font-medium text-center">
                                {file ? file.name : "Click to browse or drag and drop"}
                            </p>
                            <p className="text-sm text-zinc-500 mt-2">PDF files up to 10MB</p>
                        </label>

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="w-full mt-6 bg-blue-500 text-white rounded-xl py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Document...</>
                            ) : "Extract Profile"}
                        </button>

                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <AnimatePresence mode="popLayout">
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-8 h-fit"
                            >
                                <div className="flex items-center gap-3 mb-8 text-emerald-400 border-b border-white/10 pb-6">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <h2 className="text-xl font-semibold text-white">Extraction Successful</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <span className="text-zinc-500 text-sm block mb-2 uppercase tracking-wide">Detected Skills</span>
                                        <div className="flex flex-wrap gap-2">
                                            {result.resume_data.skills.length > 0 ? result.resume_data.skills.map((s: string) => (
                                                <span key={s} className="px-3 py-1 bg-white/10 rounded-md text-sm">{s}</span>
                                            )) : <span className="text-zinc-600 italic">No exact skill matches found.</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <span className="text-zinc-500 text-sm block mb-1">Experience</span>
                                            <span className="text-2xl font-bold">{result.resume_data.experience_years} <span className="text-sm font-normal text-zinc-400">yrs</span></span>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <span className="text-zinc-500 text-sm block mb-1">Edu Level</span>
                                            <span className="text-2xl font-bold">{result.resume_data.education_level}/3</span>
                                        </div>
                                    </div>

                                    {result.resume_data.certifications.length > 0 && (
                                        <div>
                                            <span className="text-zinc-500 text-sm block mb-2 uppercase tracking-wide">Certifications</span>
                                            <div className="flex flex-wrap gap-2">
                                                {result.resume_data.certifications.map((c: string) => (
                                                    <span key={c} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md text-sm">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <span className="text-zinc-500 text-sm block mb-2 uppercase tracking-wide">Raw Extracted Text (Preview)</span>
                                        <p className="text-sm text-zinc-400 leading-relaxed font-mono bg-black/50 p-4 rounded-xl border border-white/5 max-h-40 overflow-y-auto w-full whitespace-pre-wrap">
                                            {result.extracted_text_preview}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
