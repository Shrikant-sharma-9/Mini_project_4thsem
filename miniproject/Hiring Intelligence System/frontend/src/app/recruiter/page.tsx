"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Target, Award, BookOpen, Clock, Briefcase, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define Types
type Job = {
    job_id: string;
    title: string;
    description: string;
    status: string;
};

type CandidateMatch = {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    match_score: number;
    semantic_similarity: number;
    matched_skills: string[];
    missing_skills: string[];
    explanation: string;
    experience_years: number;
    resume_summary: string;
};

export default function RecruiterDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<"CREATE" | "JOBS">("JOBS");

    // Create Job State
    const [jobTitle, setJobTitle] = useState("");
    const [jobDesc, setJobDesc] = useState("");
    const [jobSkills, setJobSkills] = useState("");
    const [minExp, setMinExp] = useState(0);
    const [minEdu, setMinEdu] = useState(0);
    const [creatingJob, setCreatingJob] = useState(false);

    // Jobs List & Candidates State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "RECRUITER") {
            router.push("/auth");
        } else {
            setIsAuthenticated(true);
            fetchJobs();
        }
    }, [router]);

    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/jobs/", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (!res.ok) throw new Error("Failed to fetch jobs");
            const data = await res.json();
            setJobs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingJobs(false);
        }
    };

    const handleCreateJob = async () => {
        setCreatingJob(true);
        setError("");

        const payload = {
            title: jobTitle,
            description: jobDesc,
            required_skills: jobSkills,
            min_experience_years: minExp,
            min_education_level: minEdu
        };

        try {
            const res = await fetch("http://localhost:8000/api/v1/jobs/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to create job.");
            }

            // Reset form and refresh jobs
            setJobTitle("");
            setJobDesc("");
            setJobSkills("");
            setMinExp(0);
            setMinEdu(0);
            setActiveTab("JOBS");
            fetchJobs();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreatingJob(false);
        }
    };

    const handleSelectJob = async (jobId: string) => {
        setSelectedJobId(jobId);
        setLoadingCandidates(true);
        setCandidates([]);
        setError("");

        try {
            const res = await fetch(`http://localhost:8000/api/v1/jobs/${jobId}/candidates`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });

            if (!res.ok) throw new Error("Failed to load candidates.");

            const data = await res.json();
            setCandidates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingCandidates(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto z-10 relative">
                <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Target className="text-purple-400" />
                            Recruiter ATS Dashboard
                        </h1>
                        <p className="text-zinc-400">Post jobs and instantly view AI-ranked candidate leaderboards.</p>
                    </div>

                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 w-fit">
                        <button
                            onClick={() => { setActiveTab("JOBS"); setSelectedJobId(null); setError(""); }}
                            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "JOBS" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Briefcase className="w-4 h-4" /> My Ranked Jobs
                        </button>
                        <button
                            onClick={() => { setActiveTab("CREATE"); setError(""); }}
                            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "CREATE" ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Plus className="w-4 h-4" /> Create Position
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {activeTab === "CREATE" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h2 className="text-xl font-semibold mb-6 text-purple-400">Define Job Requirements</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Job Title</label>
                                <input
                                    type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    placeholder="e.g. Senior Machine Learning Engineer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Required Skills (comma separated)</label>
                                <input
                                    type="text" value={jobSkills} onChange={e => setJobSkills(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    placeholder="e.g. python, tensorflow, aws"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Min. Exp (Years)</label>
                                    <input
                                        type="number" value={minExp} onChange={e => setMinExp(parseFloat(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Min. Edu (1=BSc, 2=MSc)</label>
                                    <input
                                        type="number" value={minEdu} onChange={e => setMinEdu(parseInt(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Job Description context</label>
                                <textarea
                                    rows={4} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                                    placeholder="Detailed description of the role..."
                                />
                            </div>

                            <button
                                onClick={handleCreateJob}
                                disabled={creatingJob || !jobTitle}
                                className="w-full mt-6 bg-purple-600 text-white rounded-xl py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {creatingJob ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Job to Database"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "JOBS" && !selectedJobId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {loadingJobs ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                        ) : jobs.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-3xl min-h-[300px] flex flex-col items-center justify-center text-center p-12">
                                <Briefcase className="w-12 h-12 text-zinc-600 mb-4" />
                                <h3 className="text-xl font-medium text-zinc-300 mb-2">No active jobs</h3>
                                <p className="text-zinc-500 max-w-sm mb-6">Create a new position to start testing and ranking candidates against its requirements.</p>
                                <button onClick={() => setActiveTab("CREATE")} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-medium transition-colors">Create Job</button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map(job => (
                                    <motion.div
                                        key={job.job_id}
                                        whileHover={{ y: -5 }}
                                        onClick={() => handleSelectJob(job.job_id)}
                                        className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer group transition-all relative overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl group-hover:bg-purple-500/10 transition-all" />

                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">{job.status}</span>
                                        </div>

                                        <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                                        <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-grow">{job.description}</p>

                                        <div className="flex items-center text-purple-400 text-sm font-medium gap-2 group-hover:gap-3 transition-all pt-4 border-t border-white/5">
                                            <Users className="w-4 h-4" /> View Ranked Candidates
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "JOBS" && selectedJobId && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">Leaderboard: {jobs.find(j => j.job_id === selectedJobId)?.title}</h2>
                                <p className="text-zinc-400 text-sm">Candidates are automatically scored via Semantic Cosine Similarity & exact criteria matches.</p>
                            </div>
                            <button onClick={() => setSelectedJobId(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                                View All Jobs
                            </button>
                        </div>

                        {loadingCandidates ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-white/5 border border-white/10 rounded-3xl">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
                                <p className="text-zinc-400">AI Engine is vectorizing and scoring candidates...</p>
                            </div>
                        ) : candidates.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-3xl min-h-[300px] flex flex-col items-center justify-center text-center p-12">
                                <Users className="w-12 h-12 text-zinc-600 mb-4" />
                                <h3 className="text-xl font-medium text-zinc-300 mb-2">No Candidates Found</h3>
                                <p className="text-zinc-500 max-w-sm">No candidates have uploaded their resumes into the ATS yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {candidates.map((candidate, index) => (
                                    <div key={candidate.user_id} className={`bg-white/5 border rounded-2xl p-6 transition-colors ${index === 0 ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10'}`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                            <div className="flex items-center gap-4 flex-grow">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg text-zinc-300 shrink-0">
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                                        {candidate.first_name} {candidate.last_name}
                                                        {index === 0 && <Award className="w-4 h-4 text-purple-400" />}
                                                    </h3>
                                                    <div className="text-sm text-zinc-400 mt-1 flex gap-3">
                                                        <span>{candidate.email}</span>
                                                        <span className="text-zinc-600">•</span>
                                                        <span>{candidate.experience_years} yrs exp.</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:items-end">
                                                <div className="text-sm text-zinc-400 mb-1">AI Match Score</div>
                                                <div className={`text-3xl font-black ${candidate.match_score >= 0.8 ? 'text-emerald-400' : candidate.match_score >= 0.5 ? 'text-blue-400' : 'text-zinc-400'}`}>
                                                    {Math.round(candidate.match_score * 100)}<span className="text-xl">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-6">
                                            <div>
                                                <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-2 font-bold">Matched Skills</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {candidate.matched_skills.length > 0 ? (
                                                        candidate.matched_skills.map((s: string) => (
                                                            <span key={s} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium">{s}</span>
                                                        ))
                                                    ) : <span className="text-xs text-zinc-600">None detected</span>}
                                                </div>

                                                <span className="text-xs uppercase tracking-widest text-zinc-500 block mt-4 mb-2 font-bold">Missing Skills</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {candidate.missing_skills.length > 0 ? (
                                                        candidate.missing_skills.map((s: string) => (
                                                            <span key={s} className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/10 rounded text-xs font-medium">{s}</span>
                                                        ))
                                                    ) : <span className="text-xs text-zinc-600">None</span>}
                                                </div>
                                            </div>

                                            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                                <span className="text-purple-400 text-xs uppercase tracking-widest font-bold block mb-2">Engine Explanation</span>
                                                <p className="text-sm text-zinc-300 font-medium">{candidate.explanation}</p>

                                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-zinc-500">
                                                    <span>Semantic Range: {Math.round(candidate.semantic_similarity * 100)}%</span>
                                                    <span className="text-zinc-400 truncate max-w-[150px]">{candidate.resume_summary}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
