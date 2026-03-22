"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, FileText, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function Home() {
  return (
    <div
      className="min-h-screen text-white relative overflow-hidden font-sans bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* 🔥 LIGHTER OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-indigo-900/30"></div>

      {/* 🔝 NAVBAR */}
      <div className="relative z-10 flex justify-between items-center px-10 py-6">
        <h1 className="text-xl font-bold">HIRE AI</h1>

        <div className="flex gap-6 text-zinc-300 text-sm">
          <span className="hover:text-white cursor-pointer">Features</span>
          <span className="hover:text-white cursor-pointer">Services</span>
          <span className="hover:text-white cursor-pointer">Pricing</span>
          <span className="hover:text-white cursor-pointer">Contact</span>
        </div>

        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 rounded-full text-sm font-semibold hover:scale-105 transition">
          Contact Us
        </button>
      </div>

      {/* 🌈 FLOATING BLOBS */}
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-600/30 blur-[150px] rounded-full"
      />

      <motion.div
        animate={{ y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-emerald-600/20 blur-[150px] rounded-full"
      />

      {/* 🔥 MAIN CONTENT (LEFT ALIGNED) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl ml-16 text-left mt-20 px-6"
      >
        <motion.div variants={itemVariants} className="mb-6 text-sm text-zinc-300">
          <Sparkles className="inline w-4 h-4 mr-2 text-emerald-400" />
          AI Hiring Platform
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-6xl font-bold mb-6">
          Hiring Intelligence System
        </motion.h1>

        <motion.p variants={itemVariants} className="text-zinc-300 mb-12">
          Smart AI-based hiring for candidates & recruiters
        </motion.p>

        {/* 👇 CARDS (UPDATED) */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-6 max-w-md"
        >
          <Link href="/auth?role=CANDIDATE">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition duration-300"
            >
              <FileText className="mb-4" />
              <h2 className="text-xl font-bold">Candidate</h2>
              <p className="text-zinc-300 mt-2">
                Upload resume & get AI insights
              </p>
            </motion.div>
          </Link>

          <Link href="/auth?role=RECRUITER">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition duration-300"
            >
              <Briefcase className="mb-4" />
              <h2 className="text-xl font-bold">Recruiter</h2>
              <p className="text-zinc-300 mt-2">
                Find best candidates instantly
              </p>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>

      {/* ✨ EXTRA INFO */}
      <div className="relative z-10 mt-24 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">Why Choose HIRE AI?</h2>
        <p className="text-zinc-300 max-w-2xl mx-auto">
          AI-powered matching, real-time analytics, and smart hiring decisions.
        </p>
      </div>

      {/* 📞 FOOTER */}
      <div className="relative z-10 mt-24 border-t border-white/10 px-10 py-12 grid md:grid-cols-3 gap-8 text-sm text-zinc-300">
        <div>
          <h3 className="text-white font-bold mb-3">HIRE AI</h3>
          <p>Next-gen hiring platform using AI.</p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-3">Contact</h3>
          <p>Email: hireai@gmail.com</p>
          <p>Phone: +91 98765xxxx</p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-3">Social</h3>
          <p>LinkedIn</p>
          <p>Instagram</p>
          <p>Twitter</p>
        </div>
      </div>

      <div className="relative z-10 text-center text-xs text-zinc-400 pb-6">
        © 2026 HIRE AI. All rights reserved.
      </div>
    </div>
  );
}
