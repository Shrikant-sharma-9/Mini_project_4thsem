"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, FileText, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          AI-Powered Smart Matching v1.0
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Hiring Intelligence <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            System
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-16">
          The next-generation semantic matching platform bridging the gap between top-tier candidates and elite opportunities using FAISS & Sentence Transformers.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Candidate Card */}
          <Link href="/auth">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 group text-left relative overflow-hidden h-full flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />

              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <FileText className="w-7 h-7" />
              </div>

              <h3 className="text-2xl font-bold mb-3">Im a Candidate</h3>
              <p className="text-zinc-400 mb-8 flex-grow">
                Upload your resume, parse your skills dynamically, and instantly see how you match against elite job descriptions.
              </p>

              <div className="flex items-center text-blue-400 font-medium group-hover:gap-3 gap-2 transition-all">
                Upload Resume <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>

          {/* Recruiter Card */}
          <Link href="/auth">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 group text-left relative overflow-hidden h-full flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all" />

              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7" />
              </div>

              <h3 className="text-2xl font-bold mb-3">Im a Recruiter</h3>
              <p className="text-zinc-400 mb-8 flex-grow">
                Post new job requirement definitions and instantly score the entire database of parsed candidate resumes against them.
              </p>

              <div className="flex items-center text-purple-400 font-medium group-hover:gap-3 gap-2 transition-all">
                Create Position <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
