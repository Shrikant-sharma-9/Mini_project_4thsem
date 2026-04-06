"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CandidateFeedback() {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    
    // Auth token needed for the request
    const token = localStorage.getItem("token");
    if (!token) {
        setStatus("You must be logged in to submit feedback.");
        return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comments }),
      });

      if (res.ok) {
        setStatus("Feedback submitted successfully! Thank you.");
        setTimeout(() => router.push("/candidate/dashboard"), 2000);
      } else {
        setStatus("Failed to submit feedback.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to server.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">
          System Feedback
        </h1>
        <p className="text-slate-400 mb-6 text-sm">
          Rate your experience with our AI Job Matching models and overall platform usability.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rating (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comments / Suggestions
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us what you liked or what we can improve..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 rounded-lg font-medium shadow-lg hover:shadow-indigo-500/25 transition-all text-white"
          >
            Submit Feedback
          </button>
          
          {status && (
            <p className="text-center mt-4 text-sm text-indigo-300">
              {status}
            </p>
          )}
        </form>
        
        <div className="mt-6 text-center">
             <button onClick={() => router.push("/candidate/dashboard")} className="text-slate-500 hover:text-slate-300 text-sm">
                 Return to Dashboard
             </button>
        </div>
      </div>
    </div>
  );
}
