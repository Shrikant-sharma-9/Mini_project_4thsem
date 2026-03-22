"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  UserCircleIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  StarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  VideoCameraIcon
} from "@heroicons/react/24/outline";

// Types
interface CandidateProfile {
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  resume_url: string | null;
  skills: string[];
  experience_years: number;
  education_level: number;
  resume_updated_at: string | null;
}

interface Application {
  application_id: string;
  job_id: string;
  job_title: string;
  company: string;
  match_score: number;
  status: string;
  applied_at: string;
}

interface JobMatch {
  job_id: string;
  title: string;
  location: string;
  match_score: number;
  semantic_similarity: number;
  matched_skills: string[];
  missing_skills: string[];
  min_salary: number | null;
  max_salary: number | null;
  created_at: string;
}

interface Interview {
  interview_id: string;
  job_id: string;
  job_title: string;
  recruiter_name: string;
  scheduled_time: string;
  status: string;
}

export default function CandidateDashboard() {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");
        const role = localStorage.getItem("role");

        if (!token || !userId || role !== "CANDIDATE") {
          router.push("/auth");
          return;
        }

        // Fetch Profile
        const profileRes = await fetch(`http://localhost:8000/api/v1/candidates/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch Applications
        const appsRes = await fetch(`http://localhost:8000/api/v1/candidates/${userId}/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData);
        }

        // Fetch Matches
        const matchesRes = await fetch(`http://localhost:8000/api/v1/candidates/${userId}/matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData);
        }

        // Fetch Interviews
        const interviewsRes = await fetch(`http://localhost:8000/api/v1/candidates/${userId}/interviews`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          setInterviews(interviewsData);
        }

      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg max-w-md text-center">
          <p>{error || "Error loading profile"}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const avgMatchScore = matches.length > 0 
    ? Math.round(matches.reduce((acc, match) => acc + match.match_score, 0) / matches.length * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 p-6 md:p-8">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Welcome back, {profile.first_name}
          </h1>
          <p className="text-slate-400 mt-1">Here is your career overview and latest matches.</p>
        </div>
        
        <button 
          onClick={() => {
            localStorage.clear();
            router.push("/auth");
          }}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-sm transition-all"
        >
          Sign Out
        </button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        
        {/* Profile Summary Card */}
        <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile.first_name} {profile.last_name}</h2>
                <p className="text-slate-400 text-sm">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-slate-300">
                <BriefcaseIcon className="h-5 w-5 mr-3 text-indigo-400" />
                <span>{profile.experience_years} Years Experience</span>
              </div>
              <div className="flex items-center text-slate-300">
                <AcademicCapIcon className="h-5 w-5 mr-3 text-purple-400" />
                <span>Level {profile.education_level} Education</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/60">
              <h3 className="text-sm font-medium text-slate-400 mb-3 hover:text-indigo-400 transition-colors">Top Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 8).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
                {profile.skills.length > 8 && (
                   <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-full">
                   +{profile.skills.length - 8} more
                 </span>
                )}
              </div>
            </div>
          </div>

          {/* Resume Status Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-cyan-400" />
              Resume Status
            </h3>
            
            {profile.resume_updated_at ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center text-emerald-400">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Active & Parsed</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(profile.resume_updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <button 
                  onClick={() => router.push('/candidate')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Update Resume
                </button>
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-slate-700/50 rounded-xl">
                <p className="text-slate-400 mb-4 text-sm">No resume uploaded yet</p>
                <button 
                  onClick={() => router.push('/candidate')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/25"
                >
                  Upload Now
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5">
              <div className="text-slate-400 text-sm mb-1 flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Avg Match Score
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {avgMatchScore}%
              </div>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5">
              <div className="text-slate-400 text-sm mb-1 flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-2" />
                Applications
              </div>
              <div className="text-3xl font-bold text-indigo-400">
                {applications.length}
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 hidden lg:block">
              <div className="text-slate-400 text-sm mb-1 flex items-center">
                <StarIcon className="h-4 w-4 mr-2" />
                Top Opportunities
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {matches.filter(m => m.match_score > 0.8).length}
              </div>
            </div>
          </div>

          {/* Upcoming Interviews Section */}
          {interviews.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl mb-6">
              <div className="p-6 border-b border-slate-800/60 bg-slate-900/50 flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center">
                  <VideoCameraIcon className="h-5 w-5 mr-2 text-pink-400" />
                  Upcoming Interviews
                </h3>
                <span className="text-xs font-bold text-slate-900 bg-pink-400 px-2 py-1 rounded-md">{interviews.length} Scheduled</span>
              </div>
              
              <div className="divide-y divide-slate-800/60">
                {interviews.map((interview, idx) => (
                  <motion.div 
                    key={interview.interview_id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg text-slate-200 group-hover:text-pink-400 transition-colors">
                          {interview.job_title}
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest rounded">
                          {interview.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center"><UserCircleIcon className="h-4 w-4 mr-1" /> {interview.recruiter_name}</span>
                        <span className="flex items-center text-pink-300 font-medium">
                           <ClockIcon className="h-4 w-4 mr-1" /> {new Date(interview.scheduled_time).toLocaleString(undefined, {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: 'numeric', minute: '2-digit'
                           })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Matches Section */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800/60 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-yellow-400" />
                Recommended Jobs
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md">Based on your AI profile</span>
            </div>
            
            <div className="divide-y divide-slate-800/60">
              {matches.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>No matches found yet. Upload a resume to see recommendations.</p>
                </div>
              ) : (
                matches.slice(0, 4).map((match, idx) => (
                  <motion.div 
                    key={match.job_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {match.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                          <span className="flex items-center"><BuildingOfficeIcon className="h-4 w-4 mr-1" /> Tech Corp</span>
                          {match.location && <span className="flex items-center"><MapPinIcon className="h-4 w-4 mr-1" /> {match.location}</span>}
                          {match.min_salary && <span className="flex items-center"><CurrencyDollarIcon className="h-4 w-4 mr-1" /> {match.min_salary / 1000}k+</span>}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="relative h-12 w-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-700"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={`${match.match_score * 100 >= 80 ? 'text-emerald-400' : match.match_score * 100 >= 60 ? 'text-yellow-400' : 'text-slate-400'}`}
                              strokeLinecap="round"
                              strokeDasharray={`${match.match_score * 100}, 100`}
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-xs font-bold">{Math.round(match.match_score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {match.matched_skills.slice(0, 4).map((skill, i) => (
                           <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">
                           {skill}
                         </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {matches.length > 4 && (
              <div className="p-4 bg-slate-900/50 text-center border-t border-slate-800/60">
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                  View all {matches.length} matches
                </button>
              </div>
            )}
          </div>

          {/* Applications Table */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-slate-800/60 bg-slate-900/50">
              <h3 className="text-lg font-semibold flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-indigo-400" />
                Recent Applications
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/30">
                  <tr>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Company</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        You haven&apos;t applied to any jobs yet.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.application_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-200">{app.job_title}</td>
                        <td className="px-6 py-4 text-slate-400">{app.company}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            app.status === 'SHORTLISTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
