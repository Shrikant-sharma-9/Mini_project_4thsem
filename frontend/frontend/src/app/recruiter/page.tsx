"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Target, Award, BookOpen, Clock, Briefcase, Plus, Users, BarChart3, TrendingUp, AlertTriangle, Cpu, Sparkles, ArrowRight, LogOut } from "lucide-react";
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
    seniority_level: string;
    score_breakdown: {
        skills_pct: number;
        experience_pct: number;
        education_pct: number;
        certification_pct: number;
        keywords_pct: number;
    };
    threshold: number;
    status: string;
};

type JobAnalytics = {
    total_candidates: number;
    average_match_score: number;
    average_experience_years: number;
    top_missing_skills: { skill: string; count: number }[];
};

type ScheduledInterview = {
    candidate_id: string;
    job_id: string;
    scheduled_time: string;
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
    const [matchThreshold, setMatchThreshold] = useState(0.60);
    const [creatingJob, setCreatingJob] = useState(false);

    // Jobs List & Candidates State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [jobAnalytics, setJobAnalytics] = useState<JobAnalytics | null>(null);

    // Interview Scheduling State
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null);
    const [interviewTime, setInterviewTime] = useState("");
    const [schedulingInterview, setSchedulingInterview] = useState(false);
    const [scheduledInterviews, setScheduledInterviews] = useState<Record<string, ScheduledInterview>>({});

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
            min_education_level: minEdu,
            match_threshold: matchThreshold
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
            setMatchThreshold(0.60);
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
        setJobAnalytics(null);
        setError("");

        try {
            // Fetch Candidates
            const candRes = await fetch(`http://localhost:8000/api/v1/jobs/${jobId}/candidates`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (!candRes.ok) throw new Error("Failed to load candidates.");
            const candData = await candRes.json();
            setCandidates(candData);

            // Fetch Analytics
            const statRes = await fetch(`http://localhost:8000/api/v1/jobs/${jobId}/analytics`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (statRes.ok) {
                const statData = await statRes.json();
                setJobAnalytics(statData);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const handleScheduleInterview = async () => {
        if (!selectedCandidate || !selectedJobId) return;

        setSchedulingInterview(true);
        setError("");

        try {
            const payload = {
                candidate_id: selectedCandidate.user_id,
                job_id: selectedJobId,
                scheduled_time: interviewTime || null // if empty, backend handles auto-suggest
            };

            const res = await fetch("http://localhost:8000/api/v1/interviews/schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to schedule interview.");
            }

            const data = await res.json();
            
            // Track the newly scheduled interview in UI state map
            setScheduledInterviews(prev => ({
                ...prev,
                [selectedCandidate.user_id]: data
            }));

            // Close modal & Reset
            setIsInterviewModalOpen(false);
            setInterviewTime("");
            setSelectedCandidate(null);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSchedulingInterview(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden font-sans">
            {/* Premium Deep Mesh Background Gradients */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="max-w-7xl mx-auto z-10 relative">
                <div className="flex justify-end items-center mb-10 w-full">
                    <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("role"); router.push("/"); }} className="inline-flex items-center text-zinc-400 hover:text-red-400 transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                </div>

                <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/10 pb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            <Cpu className="w-3 h-3" /> Command Center
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Recruiter <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Dashboard</span></h1>
                        <p className="text-zinc-400 text-lg max-w-xl">Post job requirements and instantly view AI-ranked candidate leaderboards powered by specialized semantic matching.</p>
                    </div>

                    <div className="flex bg-white/[0.03] backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 w-fit shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <button
                            onClick={() => { setActiveTab("JOBS"); setSelectedJobId(null); setError(""); }}
                            className={`px-8 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-wide ${activeTab === "JOBS" ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Briefcase className="w-4 h-4" /> Ranked Jobs
                        </button>
                        <button
                            onClick={() => { setActiveTab("CREATE"); setError(""); }}
                            className={`px-8 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-wide ${activeTab === "CREATE" ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Plus className="w-4 h-4" /> Create Need
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">{error}</p>
                    </motion.div>
                )}

                {activeTab === "CREATE" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <Sparkles className="text-purple-400 w-6 h-6" /> Define AI Search Parameters
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Job Title</label>
                                <input
                                    type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-colors font-medium text-white placeholder-zinc-700"
                                    placeholder="e.g. Senior Machine Learning Engineer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Required Skills (Comma Separated)</label>
                                <input
                                    type="text" value={jobSkills} onChange={e => setJobSkills(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-colors font-medium text-white placeholder-zinc-700"
                                    placeholder="e.g. python, tensorflow, aws, pytorch"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Min. Experience</label>
                                    <div className="relative">
                                        <input
                                            type="number" value={minExp} onChange={e => setMinExp(parseFloat(e.target.value))}
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-colors font-bold text-white text-lg"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">YEARS</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Min. Education</label>
                                    <div className="relative">
                                        <input
                                            type="number" value={minEdu} onChange={e => setMinEdu(parseInt(e.target.value))}
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-colors font-bold text-white text-lg"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">LEVEL (1-3)</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex justify-between">
                                    <span>Minimum Match Threshold</span>
                                    <span className="text-purple-400">{matchThreshold.toFixed(2)}</span>
                                </label>
                                <div className="bg-black/50 border border-white/10 rounded-2xl px-5 py-6 focus-within:border-purple-500/50 transition-colors">
                                    <input
                                        type="range" min="0.0" max="1.0" step="0.05"
                                        value={matchThreshold}
                                        onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
                                        className="w-full accent-purple-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-500 mt-4 font-bold">
                                        <span>0.0 (Lenient)</span>
                                        <span>1.0 (Strict)</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Semantic Context Description</label>
                                <textarea
                                    rows={5} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-colors resize-none font-medium text-white placeholder-zinc-700"
                                    placeholder="Provide detailed context. The AI uses this for semantic (meaning-based) matching against candidate histories."
                                />
                            </div>

                            <button
                                onClick={handleCreateJob}
                                disabled={creatingJob || !jobTitle}
                                className="w-full mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl py-5 font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {creatingJob ? <><Loader2 className="w-5 h-5 animate-spin" /> Storing Parameters...</> : "Initialize Search Requirement"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "JOBS" && !selectedJobId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {loadingJobs ? (
                            <div className="flex flex-col justify-center items-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                <div className="text-zinc-400 font-medium tracking-widest uppercase text-sm">Syncing Database</div>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                                    <Briefcase className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Void Sector</h3>
                                <p className="text-zinc-500 max-w-sm mb-8 font-medium">Create a new position to initialize the AI engine and start ranking the candidate pool.</p>
                                <button onClick={() => setActiveTab("CREATE")} className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors text-white">Create Mission</button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {jobs.map(job => (
                                    <motion.div
                                        key={job.job_id}
                                        whileHover={{ y: -6, scale: 1.01 }}
                                        onClick={() => handleSelectJob(job.job_id)}
                                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-purple-500/50 rounded-[2rem] p-8 cursor-pointer group transition-all relative overflow-hidden flex flex-col h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] group-hover:bg-purple-500/20 group-hover:scale-150 transition-all duration-700 pointer-events-none" />

                                        <div className="flex items-start justify-between mb-6 relative">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/5 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-shadow">
                                                <Target className="w-6 h-6" />
                                            </div>
                                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">{job.status}</span>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-50 transition-colors">{job.title}</h3>
                                        <p className="text-zinc-400 text-sm line-clamp-3 mb-8 flex-grow leading-relaxed group-hover:text-zinc-300">{job.description}</p>

                                        <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase tracking-widest pt-5 border-t border-white/5 group-hover:border-purple-500/20 transition-colors">
                                            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> View Leaderboard</span>
                                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "JOBS" && selectedJobId && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] gap-6">
                            <div>
                                <div className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Target className="w-3 h-3" /> Active Leaderboard</div>
                                <h2 className="text-3xl font-black mb-2 text-white">{jobs.find(j => j.job_id === selectedJobId)?.title}</h2>
                                <p className="text-zinc-400 text-sm font-medium">Candidates are automatically scored via Semantic Cosine Similarity & exact criteria matches.</p>
                            </div>
                            <button onClick={() => setSelectedJobId(null)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap">
                                <ArrowLeft className="w-4 h-4" /> Exit Board
                            </button>
                        </div>

                        {/* Top Level Analytics Summary */}
                        {jobAnalytics && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid md:grid-cols-4 gap-6 mb-10">
                                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20"><Users className="w-6 h-6" /></div>
                                    <div className="text-4xl font-black text-white mb-1">{jobAnalytics.total_candidates}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Applicants</div>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20"><BarChart3 className="w-6 h-6" /></div>
                                    <div className="text-4xl font-black text-emerald-400 mb-1">{jobAnalytics.average_match_score}<span className="text-xl text-emerald-500/50">%</span></div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Avg Match</div>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20"><TrendingUp className="w-6 h-6" /></div>
                                    <div className="text-4xl font-black text-purple-400 mb-1">{jobAnalytics.average_experience_years}<span className="text-xl text-purple-500/50">Y</span></div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Avg Experience</div>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-all pointer-events-none" />
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mb-4 border border-red-500/20"><AlertTriangle className="w-6 h-6" /></div>
                                    {jobAnalytics.top_missing_skills.length > 0 ? (
                                        <div className="text-xl font-black text-red-400 capitalize truncate mb-1">{jobAnalytics.top_missing_skills[0].skill} <span className="text-red-500/50 text-base">({jobAnalytics.top_missing_skills[0].count})</span></div>
                                    ) : <div className="text-xl font-black text-zinc-600 mb-1">None</div>}
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Top Missing Skill</div>
                                </div>
                            </motion.div>
                        )}

                        {loadingCandidates ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem]">
                                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                <div className="text-zinc-400 font-bold tracking-widest uppercase text-sm">Engine Vectorizing Candidates...</div>
                            </div>
                        ) : candidates.length === 0 ? (
                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center text-center p-12">
                                <Users className="w-16 h-16 text-zinc-700 mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2">No Candidates Found</h3>
                                <p className="text-zinc-500 max-w-sm font-medium">No candidates have passed the filtering stage or uploaded their resumes into the ATS yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {candidates.map((candidate, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={candidate.user_id}
                                        className={`bg-white/[0.02] backdrop-blur-xl border rounded-[2rem] p-8 transition-all ${index === 0 ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.05)]' : 'border-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                            <div className="flex items-center gap-6 flex-grow">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 border ${index === 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-zinc-400 border-white/10'}`}>
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black flex items-center gap-3 text-white mb-1">
                                                        {candidate.first_name} {candidate.last_name}
                                                        {index === 0 && <Award className="w-5 h-5 text-amber-400" />}
                                                    </h3>
                                                    <div className="text-sm text-zinc-400 font-medium flex flex-wrap gap-x-4 gap-y-2 items-center">
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {candidate.experience_years} yrs exp.</span>
                                                        <span className="text-zinc-700">•</span>
                                                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-widest ${index === 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/10 text-zinc-300'}`}>{candidate.seniority_level}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start md:items-end bg-black/40 p-4 rounded-2xl border border-white/5 md:min-w-[180px] gap-2">
                                                <div className="flex items-center justify-between w-full mb-1">
                                                    <span className="text-xs uppercase tracking-widest font-bold text-zinc-500">AI Score</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${candidate.status === 'qualified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                        {candidate.status === 'qualified' ? 'Qualified' : 'Below Threshold'}
                                                    </span>
                                                </div>
                                                <div className={`text-5xl font-black ${candidate.status === 'qualified' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-red-400'}`}>
                                                    {Math.round(candidate.match_score * 100)}<span className="text-2xl opacity-50">%</span>
                                                </div>
                                                <div className="text-xs font-medium text-zinc-500 w-full text-right mt-1">
                                                    Threshold: <span className="text-zinc-300 font-bold">{Math.round((candidate.threshold || 0.6) * 100)}%</span>
                                                </div>
                                                
                                                {/* Scheduling Action */}
                                                <div className="w-full mt-3 pt-3 border-t border-white/10">
                                                    {scheduledInterviews[candidate.user_id] ? (
                                                        <div className="w-full py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                                            <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest block mb-1">Interview Scheduled</div>
                                                            <div className="text-xs text-emerald-500/80 font-medium">
                                                                {new Date(scheduledInterviews[candidate.user_id].scheduled_time).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedCandidate(candidate);
                                                                setIsInterviewModalOpen(true);
                                                            }}
                                                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                                                        >
                                                            Schedule Interview
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-white/5 grid lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-1">
                                                <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-4 font-bold flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> Pillar Breakdown</span>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-zinc-400 uppercase tracking-widest">Skills Core</span> <span className="text-emerald-400">{candidate.score_breakdown?.skills_pct || 0}%</span></div>
                                                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${candidate.score_breakdown?.skills_pct || 0}%` }} transition={{ duration: 1, ease: "easeOut" }} className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" /></div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-zinc-400 uppercase tracking-widest">Experience</span> <span className="text-blue-400">{candidate.score_breakdown?.experience_pct || 0}%</span></div>
                                                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${candidate.score_breakdown?.experience_pct || 0}%` }} transition={{ duration: 1, delay: 0.1, ease: "easeOut" }} className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" /></div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-zinc-400 uppercase tracking-widest">Education/Certs</span> <span className="text-purple-400">{(candidate.score_breakdown?.education_pct || 0) + (candidate.score_breakdown?.certification_pct || 0)}%</span></div>
                                                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${(candidate.score_breakdown?.education_pct || 0) + (candidate.score_breakdown?.certification_pct || 0)}%` }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" /></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="lg:col-span-1 border-l border-white/5 pl-8">
                                                <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-4 font-bold flex items-center gap-2"><Target className="w-3.5 h-3.5" /> NetworkX Skill Inference</span>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {candidate.matched_skills.length > 0 ? (
                                                        candidate.matched_skills.map((s: string) => (
                                                            <span key={s} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)] cursor-default">{s}</span>
                                                        ))
                                                    ) : <span className="text-xs text-zinc-600 font-medium">No verified matches</span>}
                                                </div>

                                                <span className="text-xs uppercase tracking-widest text-zinc-500 block mt-6 mb-4 font-bold flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Knowledge Gaps</span>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {candidate.missing_skills.length > 0 ? (
                                                        candidate.missing_skills.map((s: string) => (
                                                            <span key={s} className="px-3 py-1.5 bg-red-500/5 text-red-500/70 border border-red-500/10 rounded-lg text-xs font-bold">{s}</span>
                                                        ))
                                                    ) : <span className="text-xs text-zinc-600 font-medium">None detected</span>}
                                                </div>
                                            </div>

                                            <div className="bg-black/50 rounded-2xl p-6 border border-white/5 lg:col-span-1 flex flex-col relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[30px] group-hover:bg-purple-500/10 transition-all pointer-events-none" />
                                                <span className="text-purple-400 text-xs uppercase tracking-widest font-bold block mb-3 flex items-center gap-2"><Cpu className="w-3.5 h-3.5" /> Engine Explanation</span>
                                                <p className="text-sm text-zinc-300 font-medium flex-grow leading-relaxed relative z-10">{candidate.explanation}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Interview Scheduling Modal */}
            <AnimatePresence>
                {isInterviewModalOpen && selectedCandidate && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ y: 20, scale: 0.95 }} 
                            animate={{ y: 0, scale: 1 }} 
                            exit={{ y: 10, scale: 0.95 }}
                            className="bg-[#0A0A0B] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
                            
                            <h3 className="text-2xl font-bold mb-2 text-white">Schedule Interview</h3>
                            <p className="text-sm text-zinc-400 mb-6">Coordinate a meeting with your matched candidate.</p>
                            
                            <div className="space-y-4 mb-8">
                                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Candidate</div>
                                    <div className="font-medium text-white">{selectedCandidate.first_name} {selectedCandidate.last_name}</div>
                                </div>
                                
                                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Job Context</div>
                                    <div className="font-medium text-white">{jobs.find(j => j.job_id === selectedJobId)?.title}</div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 mt-6">Select Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={interviewTime}
                                        onChange={(e) => setInterviewTime(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors text-white [color-scheme:dark]"
                                    />
                                    <p className="text-[11px] text-zinc-500 mt-2 font-medium">Leave explicitly blank to leverage the Engine's auto-scheduler logic.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => {
                                        setIsInterviewModalOpen(false);
                                        setInterviewTime("");
                                        setSelectedCandidate(null);
                                    }} 
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleScheduleInterview}
                                    disabled={schedulingInterview}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {schedulingInterview ? <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting...</> : "Confirm Appointment"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
