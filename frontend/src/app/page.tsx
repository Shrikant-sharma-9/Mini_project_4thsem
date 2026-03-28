"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, FileText, ArrowRight, Sparkles, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Premium Deep Mesh Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-emerald-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl w-full text-center z-10 relative"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase mb-10 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-300">Phase 2 AI Match Engine Active</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
          Hiring Intelligence <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-300 to-purple-500 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            System
          </span>
        </h1>

        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
          The next-generation semantic matching platform bridging the gap between top-tier candidates and elite opportunities using FAISS & NetworkX Inference.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">

          {/* Candidate Card */}
          <Link href="/auth?role=CANDIDATE">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-10 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.05] transition-all duration-500 group text-left relative overflow-hidden h-full flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] group-hover:bg-indigo-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/5 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <FileText className="w-8 h-8" />
              </div>

              <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-indigo-50 transition-colors">I am a Candidate</h3>
              <p className="text-zinc-400 mb-10 flex-grow text-lg leading-relaxed group-hover:text-zinc-300 transition-colors">
                Upload your resume, parse your skills dynamically with Bias Mitigation, and instantly see how you rank against elite roles.
              </p>

              <div className="flex items-center text-indigo-400 font-bold group-hover:gap-4 gap-2 transition-all uppercase tracking-widest text-sm">
                Enter Portal <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>

          {/* Recruiter Card */}
          <Link href="/auth?role=RECRUITER">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-10 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 hover:bg-white/[0.05] transition-all duration-500 group text-left relative overflow-hidden h-full flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/30 group-hover:scale-150 transition-all duration-700 pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <Cpu className="w-8 h-8" />
              </div>

              <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-emerald-50 transition-colors">I am a Recruiter</h3>
              <p className="text-zinc-400 mb-10 flex-grow text-lg leading-relaxed group-hover:text-zinc-300 transition-colors">
                Define job requirements and instantly score your candidate database with exact mathematical breakdowns and seniority inference.
              </p>

              <div className="flex items-center text-emerald-400 font-bold group-hover:gap-4 gap-2 transition-all uppercase tracking-widest text-sm">
                Command Center <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
