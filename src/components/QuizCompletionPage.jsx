import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  Trophy, 
  Award, 
  Share2, 
  Compass, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { styles } from "../styles";

const QuizCompletionPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // State management
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certCode, setCertCode] = useState(null);

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
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load completion details.");
        setLoading(false);
      }
    };

    fetchAllData();
  }, [attemptId]);

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

  // Segment answers
  const correctAnswers = results.answers.filter((a) => a.isCorrect);
  const incorrectAnswers = results.answers.filter((a) => !a.isCorrect && !a.timedOut);
  const timedOutAnswers = results.answers.filter((a) => a.timedOut);

  // SVG parameters for circular progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (results.percentage / 100) * circumference;

  return (
    <div className={`p-6 md:p-8 text-white max-w-5xl mx-auto min-h-screen space-y-8 ${styles.bgMain}`}>
      <ToastContainer />

      {/* Hero Performance Card */}
      <div className={`${styles.card} bg-gradient-to-r from-[#1a1a2e] to-[#201538] flex flex-col md:flex-row items-center justify-between gap-8 border-[#915EFF]/20`}>
        <div className="space-y-4 max-w-md text-center md:text-left">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#915EFF]/20 text-[#a27eff] border border-[#915EFF]/30">
            Performance Summary
          </span>
          <h2 className="text-3xl font-black text-white">
            Quiz Completed! 🎉
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Excellent effort! Your authoritative grade details have been securely logged. Let's analyze your results and claim any earned rewards below.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3.5 pt-2">
            <button
              onClick={() => navigate("/dashboard/quizzes")}
              className={styles.btnPrimary}
            >
              Play Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className={styles.btnSecondary}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Circular SVG Grade Progress */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-40 h-40 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-[#202038] stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Foreground Progress Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-[#915EFF] stroke-current transition-all duration-1000"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          {/* Central Label */}
          <div className="absolute text-center">
            <span className="text-3xl font-black text-white">{results.percentage}%</span>
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Metrics Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Score Card */}
        <div className={styles.card}>
          <p className={styles.subtext}>Final Score</p>
          <p className="text-3xl font-black text-white mt-1">{results.totalScore} / {results.maxScore}</p>
          <p className="text-xs text-green-400 mt-2 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{correctAnswers.length} correct answers</span>
          </p>
        </div>

        {/* XP earned card */}
        <div className={styles.card}>
          <p className={styles.subtext}>XP Earned</p>
          <p className="text-3xl font-black text-yellow-400 mt-1">+{results.xpEarned} XP</p>
          <p className="text-xs text-gray-500 mt-2">Added to Level progress</p>
        </div>

        {/* Time Taken */}
        <div className={styles.card}>
          <p className={styles.subtext}>Time Taken</p>
          <p className="text-3xl font-black text-white mt-1">{results.timeTakenSeconds}s</p>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Speed index verified</span>
          </p>
        </div>

        {/* Mode & Category info */}
        <div className={styles.card}>
          <p className={styles.subtext}>Quiz Mode</p>
          <p className="text-2xl font-black text-white mt-1.5 capitalize">{results.quizMode || "Assessment"}</p>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">Difficulty: {results.difficulty}</p>
        </div>
      </div>

      {/* Share / Certificate Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Share & Certificate (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Certificate eligibility */}
          <div className={`${styles.card} border-[#915EFF]/25 bg-gradient-to-b from-[#1a1a2e] to-[#201830] flex flex-col justify-between`}>
            <div>
              <h3 className="text-md font-bold text-white mb-2 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-yellow-500" />
                <span>Earned Certificates</span>
              </h3>
              <p className="text-xs text-gray-400 leading-normal">
                Registered users scoring 100% on assessments containing 5 or more questions earn verified credentials.
              </p>
            </div>

            {results.percentage === 100 && results.maxScore >= 5 ? (
              <div className="mt-6 space-y-4">
                {!certCode ? (
                  <button
                    onClick={handleGetCertificate}
                    className={`${styles.btnPrimary} w-full text-xs py-2`}
                  >
                    Generate Verified Certificate
                  </button>
                ) : (
                  <div className="p-4 bg-[#131326] rounded-xl border border-green-500/25 space-y-3">
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
                        toast.success("Certificate verification link copied!");
                      }}
                      className="text-xs text-[#915EFF] underline hover:text-[#a27eff] bg-transparent border-none cursor-pointer"
                    >
                      Copy Public Verification Link
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 p-4 bg-[#131326]/50 rounded-xl border border-[#2a2a40] text-center text-xs text-gray-400">
                Not eligible for certificate. Score 100% on 5+ questions to unlock!
              </div>
            )}
          </div>

          {/* Social Share card */}
          <div className={styles.card}>
            <h3 className="text-md font-bold text-white mb-2 flex items-center gap-1.5">
              <Share2 className="w-4.5 h-4.5 text-[#915EFF]" />
              <span>Share Score</span>
            </h3>
            <p className="text-xs text-gray-400 leading-normal mb-4">
              Brag about your accuracy and challenge your community!
            </p>
            <button
              onClick={handleShareScore}
              className={`${styles.btnSecondary} w-full text-xs py-2`}
            >
              Share on Twitter / X
            </button>
          </div>
        </div>

        {/* Real-time topic leaderboard (2/3) */}
        <div className={`${styles.card} lg:col-span-2 space-y-4`}>
          <div className="flex justify-between items-center border-b border-[#2a2a40] pb-3 mb-4">
            <h3 className={styles.h3}>Topic Leaderboard ({results.difficulty})</h3>
            <span className="text-xs font-semibold text-gray-500 uppercase">Top Submissions</span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-gray-400 text-xs py-6 text-center">
              No leaderboard entries found for this topic yet.
            </p>
          ) : (
            <div className="divide-y divide-[#2a2a40]/30 max-h-[280px] overflow-y-auto pr-2">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.attemptId === attemptId;
                return (
                  <div
                    key={entry.attemptId}
                    className={`flex justify-between items-center py-3 px-3 text-xs transition duration-150 rounded-xl ${
                      isCurrentUser 
                        ? "bg-[#915EFF]/10 border border-[#915EFF]/25 text-white font-bold" 
                        : "text-gray-300 hover:bg-[#202038]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-500 font-bold">#{entry.rank}</span>
                      <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${entry.displayName}`}
                        alt="avatar"
                        className="w-6 h-6 rounded bg-[#202038] border border-[#2a2a40]"
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
        </div>
      </div>

      {/* Question Explanations review */}
      <div className={styles.card}>
        <div className="border-b border-[#2a2a40] pb-3 mb-6">
          <h3 className={styles.h3}>Review Question Explanations</h3>
        </div>

        <div className="space-y-6">
          {results.answers.map((ans, idx) => {
            const isCorrect = ans.isCorrect;
            const selectedText = ans.selectedOptionId 
              ? ans.options.find((o) => o.id === ans.selectedOptionId)?.text 
              : "None (Timed Out / Unanswered)";
            const correctText = ans.options.find((o) => ans.correctOptionIds?.includes(o.id))?.text;

            return (
              <div 
                key={idx} 
                className={`p-5 rounded-xl border space-y-3.5 transition duration-150 ${
                  isCorrect 
                    ? "bg-green-500/5 border-green-500/20" 
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-sm text-white leading-relaxed">
                    Question {idx + 1}: {ans.questionText}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isCorrect 
                      ? "bg-green-500/10 text-green-400" 
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="bg-[#131326]/50 p-3 rounded-lg border border-[#2a2a40]">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Your Choice</p>
                    <p className={isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {selectedText}
                    </p>
                  </div>
                  {!isCorrect && (
                    <div className="bg-[#131326]/50 p-3 rounded-lg border border-green-500/15">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Correct Answer</p>
                      <p className="text-green-400 font-bold">{correctText}</p>
                    </div>
                  )}
                </div>

                {ans.explanation && (
                  <div className="bg-[#131326] p-3.5 rounded-lg border border-[#2a2a40] space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Explanation Details</p>
                    <p className="text-xs text-gray-300 leading-relaxed italic">{ans.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizCompletionPage;