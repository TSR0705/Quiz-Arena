import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  Trophy, 
  Award, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { styles } from "../styles";
import { motion } from "framer-motion";
import { fadeIn, zoomIn } from "../utils/motion";
import confetti from "canvas-confetti";

const QuizCompletionPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // State management
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certCode, setCertCode] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  // Fetch results and leaderboard on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Fetch attempt results
        const res = await fetch(`/api/attempts/${attemptId}/results`);
        if (!res.ok) {
          throw new Error("Failed to load attempt results.");
        }
        const attemptData = await res.json();
        setResults(attemptData);

        // 2. Fetch real leaderboard for the topic & difficulty
        const leaderRes = await fetch(
          `/api/leaderboard?topicId=${attemptData.answers[0]?.topicId || ""}&difficulty=${attemptData.difficulty || ""}`
        );
        if (leaderRes.ok) {
          const leaderboardData = await leaderRes.json();
          setLeaderboard(leaderboardData);
        }

        // 3. Fetch dashboard profile insights for gamification stats
        const dashboardRes = await fetch("/api/dashboard");
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setProfile(dashboardData.profile);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load completion details.");
        setLoading(false);
      }
    };

    fetchAllData();
  }, [attemptId]);

  // Trigger confetti celebration on perfect scores
  useEffect(() => {
    if (results && results.percentage === 100) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [results]);

  // Request/Generate Certificate (FR-140)
  const handleGetCertificate = async () => {
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });

      const data = await res.json();

      if (res.ok) {
        setCertCode(data.verificationCode);
        toast.success("Certificate generated successfully!");
      } else {
        toast.error(data.error?.message || "Failed to generate certificate. Must score 100% on a 5+ question quiz.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to request certificate.");
    }
  };

  // Share score on Twitter (FR-143)
  const handleShareScore = () => {
    if (!results) return;
    const tweetText = `I scored ${results.totalScore}/${results.maxScore} (${results.percentage}%) on the QuizArena quiz! Can you beat my score? 🎉 #QuizArena`;
    const tweetUrl = encodeURIComponent(window.location.origin);
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${tweetUrl}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#915EFF] mx-auto mb-4"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary text-white p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error: Results not found.</h1>
        <button onClick={() => navigate("/dashboard")} className={styles.btnSecondary}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // SVG parameters for circular progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (results.percentage / 100) * circumference;

  return (
    <div className="p-4 md:p-8 text-white max-w-4xl mx-auto min-h-screen space-y-8 select-none">
      <ToastContainer />

      {/* Hero Performance Card - Restrained dark theme */}
      <motion.div 
        variants={zoomIn(0, 0.2)}
        initial="hidden"
        animate="show"
        className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="space-y-4 max-w-md text-center md:text-left">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#915EFF]/10 text-[#a27eff] border border-[#915EFF]/20 uppercase tracking-widest">
            Assessment Complete
          </span>
          <h2 className="text-2xl font-black text-white">
            Quiz Results Logged! 🎉
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Excellent effort! Your results have been securely graded. Check your score metrics, claim credentials, and study explanations below.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1.5">
            <motion.button
              whileHover={{ y: -0.5, boxShadow: "0 4px 12px rgba(145, 94, 255, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard")}
              className={`${styles.btnPrimary} text-xs py-2 px-6`}
            >
              Back to Dashboard
            </motion.button>
          </div>
        </div>

        {/* Circular accuracy indicator */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-[#20203a]"
              strokeWidth="10"
              fill="transparent"
            />
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-[#915EFF]"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-white">{results.percentage}%</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
              {results.totalScore} / {results.maxScore} Pts
            </span>
          </div>
        </div>
      </motion.div>

      {/* Gamified streaks and level up display */}
      {profile && (
        <motion.div
          variants={fadeIn("up", "tween", 0.1, 0.2)}
          initial="hidden"
          animate="show"
          className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#2a2a40]/30 shadow-lg"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Streak</span>
            <span className="text-lg font-black text-orange-400 flex items-center justify-center gap-1">
              <span>🔥</span>
              <span>{profile.currentStreak} Days</span>
            </span>
          </div>
          <div className="space-y-1 pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">XP Gained</span>
            <span className="text-lg font-black text-yellow-500 flex items-center justify-center gap-1">
              <span>⚡</span>
              <span>+{results.xpEarned} XP</span>
            </span>
          </div>
          <div className="space-y-1 pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Completion Time</span>
            <span className="text-lg font-black text-white flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-[#915EFF]" />
              <span>{results.timeTakenSeconds}s</span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Strong vs Weak Recommendations */}
      {results && (
        <motion.div
          variants={fadeIn("up", "tween", 0.12, 0.2)}
          initial="hidden"
          animate="show"
          className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 rounded-2xl space-y-4 shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-[#2a2a40]/55 pb-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Concept Area Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10 space-y-1">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest block">✓ Strong Concept Areas</span>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                {results.percentage >= 80 
                  ? "Your performance indicates strong conceptual grasp of the selected topic's active competencies." 
                  : "Review correct options to build stronger mental models."}
              </p>
            </div>
            
            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">⚠️ Areas of Focus</span>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                {results.percentage < 80 
                  ? "We recommend studying timed-out/incorrect explanations. Re-running similar topics can boost confidence." 
                  : "Excellent coverage! No critical areas of review focus identified."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar credentials and share */}
        <div className="space-y-6">
          {/* Certificate generation */}
          <motion.div 
            variants={fadeIn("up", "tween", 0.12, 0.2)}
            initial="hidden"
            animate="show"
            className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 rounded-2xl shadow-lg"
          >
            <div>
              <h3 className="text-sm font-black text-white mb-2 flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-yellow-500" />
                <span>Earned Credentials</span>
              </h3>
              <p className="text-[10px] text-gray-400 leading-normal">
                Credentials verify high performance on assessments containing 5 or more questions.
              </p>
            </div>

            {results.percentage === 100 && results.maxScore >= 5 ? (
              <div className="mt-5 space-y-4">
                {!certCode ? (
                  <motion.button
                    whileHover={{ y: -0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGetCertificate}
                    className={`${styles.btnPrimary} w-full text-xs py-2`}
                  >
                    Generate Verified Certificate
                  </motion.button>
                ) : (
                  <div className="p-4 bg-[#0f0f20] rounded-xl border border-green-500/25 space-y-3">
                    <span className="text-[10px] font-bold text-green-400 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Security Validated</span>
                    </span>
                    <p className="text-[10px] text-gray-500 break-all font-mono">
                      Code: {certCode}
                    </p>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/verify-certificate?code=${certCode}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Verification link copied!");
                      }}
                      className="text-xs text-[#915EFF] underline hover:text-[#a27eff] bg-transparent border-none cursor-pointer"
                    >
                      Copy Public Link
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 p-3.5 bg-[#0f0f20] rounded-xl border border-[#2a2a4c]/50 text-center text-[10px] text-gray-500 font-medium select-none">
                Score 100% on 5+ questions to unlock credentials!
              </div>
            )}
          </motion.div>

          {/* Social share */}
          <motion.div 
            variants={fadeIn("up", "tween", 0.14, 0.2)}
            initial="hidden"
            animate="show"
            className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-1.5">
              <Share2 className="w-4 h-4.5 text-[#915EFF]" />
              <span>Share Score</span>
            </h3>
            <p className="text-[10px] text-gray-400 leading-normal mb-4">
              Brag about your accuracy and challenge your community!
            </p>
            <motion.button
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShareScore}
              className={`${styles.btnSecondary} w-full text-xs py-2`}
            >
              Share on Twitter / X
            </motion.button>
          </motion.div>
        </div>

        {/* Real-time topic leaderboard (col-span-2) */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.16, 0.2)}
          initial="hidden"
          animate="show"
          className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 rounded-2xl lg:col-span-2 space-y-4 shadow-lg"
        >
          <div className="flex justify-between items-center border-b border-[#2a2a40]/60 pb-3 mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Leaderboard ({results.difficulty})</h3>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Top Rankings</span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-gray-400 text-xs py-6 text-center">
              No entries logged for this topic yet.
            </p>
          ) : (
            <div className="divide-y divide-[#2a2a40]/30 max-h-[280px] overflow-y-auto pr-2 no-scrollbar">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.attemptId === attemptId;
                return (
                  <div
                    key={entry.attemptId}
                    className={`flex justify-between items-center py-2.5 px-3 text-xs transition duration-150 rounded-xl ${
                      isCurrentUser 
                        ? "bg-[#915EFF]/15 border border-[#915EFF]/30 text-white font-bold" 
                        : "text-gray-300 hover:bg-[#202038]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-500 font-bold">#{entry.rank}</span>
                      <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${entry.displayName}`}
                        alt="avatar"
                        className="w-5 h-5 rounded bg-[#202038] border border-[#2a2a40]"
                      />
                      <span>
                        {entry.displayName} {isCurrentUser && "(You)"}
                      </span>
                    </div>
                    <span>
                      {entry.score} pts ({entry.percentage}%) in {entry.timeTakenSeconds}s
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Paginated Question Corrections review */}
      <motion.div 
        variants={fadeIn("up", "tween", 0.18, 0.2)}
        initial="hidden"
        animate="show"
        className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 rounded-2xl shadow-lg"
      >
        <div className="border-b border-[#2a2a40]/60 pb-3 mb-5">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Review Question Explanations</h3>
        </div>

        {/* Tab Selection Row */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-[#2a2a40]/30 mb-6">
          {results.answers.map((ans, idx) => (
            <button
              key={idx}
              onClick={() => setActiveReviewIdx(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-black border transition cursor-pointer ${
                activeReviewIdx === idx
                  ? "bg-[#915EFF] border-[#915EFF] text-white shadow-md shadow-[#915EFF]/20"
                  : ans.isCorrect
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Selected Correction Detail Card */}
        {(() => {
          const ans = results.answers[activeReviewIdx];
          if (!ans) return null;
          const isCorrect = ans.isCorrect;
          const selectedText = ans.selectedOptionId 
            ? ans.options.find((o) => o.id === ans.selectedOptionId)?.text 
            : "None (Timed Out / Unanswered)";
          const correctText = ans.options.find((o) => ans.correctOptionIds?.includes(o.id))?.text;

          return (
            <motion.div
              key={activeReviewIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`p-5 rounded-2xl border bg-[#0d0d19]/40 space-y-4 ${
                isCorrect 
                  ? "border-l-4 border-l-green-500/80 border-[#2a2a4c]/50" 
                  : "border-l-4 border-l-red-500/80 border-[#2a2a4c]/50"
              }`}
            >
              <div className="flex justify-between items-start gap-4 pb-2 border-b border-[#2a2a40]/30">
                <h4 className="font-extrabold text-sm text-white leading-relaxed select-text">
                  Question {activeReviewIdx + 1}: {ans.questionText}
                </h4>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                  isCorrect 
                    ? "bg-green-500/10 text-green-400 border border-green-500/25" 
                    : "bg-red-500/10 text-red-400 border border-red-500/25"
                }`}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-[#0f0f20] p-4 rounded-xl border border-[#2a2a4c]/50">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Your Selected Option</p>
                  <p className={isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    {selectedText}
                  </p>
                </div>
                {!isCorrect && (
                  <div className="bg-[#0f0f20] p-4 rounded-xl border border-green-500/15">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Correct Answer</p>
                    <p className="text-green-400 font-bold">{correctText}</p>
                  </div>
                )}
              </div>

              {ans.explanation && (
                <div className="bg-[#0f0f20]/60 p-4 rounded-xl border border-[#2a2a4c]/50 space-y-1.5">
                  <p className="text-[10px] text-gray-500 uppercase font-black">Explanation details</p>
                  <p className="text-xs text-gray-300 leading-relaxed italic select-text">{ans.explanation}</p>
                </div>
              )}
            </motion.div>
          );
        })()}
      </motion.div>
    </div>
  );
};

export default QuizCompletionPage;