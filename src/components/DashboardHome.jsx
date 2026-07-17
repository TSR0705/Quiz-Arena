import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { styles } from "../styles";
import { 
  Flame, 
  Award, 
  TrendingUp, 
  Play, 
  AlertTriangle,
  Clock,
  ExternalLink
} from "lucide-react";

const DashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard statistics.");
        return res.json();
      })
      .then((dashboardData) => {
        setData(dashboardData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#915EFF] mx-auto mb-4"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`${styles.card} p-8 text-center text-red-400`}>
        Failed to load dashboard metrics. Please reload or log in again.
      </div>
    );
  }

  const { profile, stats, recentAttempts, badges, weakTopics } = data;

  // Streak status text
  const streakMessage = profile.currentStreak > 0
    ? `You're on a ${profile.currentStreak}-day streak! Keep it up!`
    : "Start a quiz today to start a learning streak!";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className={`${styles.card} relative overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#251b3d] p-8 border-[#915EFF]/25`}>
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#915EFF]/20 text-[#a27eff] border border-[#915EFF]/30">
            Welcome Back
          </span>
          <h2 className="text-3xl font-black text-white">
            Hello, {profile.displayName}! 👋
          </h2>
          <p className={`${styles.body} text-gray-400`}>
            Ready to test your skills? Try a practice run or step up to a timed assessment to earn XP and level up.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate("/dashboard/quizzes")}
              className={`${styles.btnPrimary} flex items-center gap-2`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Explore Quizzes</span>
            </button>
            <button
              onClick={() => navigate("/dashboard/profile")}
              className={styles.btnSecondary}
            >
              Manage Profile
            </button>
          </div>
        </div>

        {/* Abstract background gradient circle */}
        <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-[#915EFF]/10 blur-3xl" />
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total XP */}
        <div className={styles.card}>
          <div className="flex justify-between items-start">
            <div>
              <p className={styles.subtext}>Total Experience</p>
              <p className="text-3xl font-black text-white mt-1.5">{profile.totalXp} XP</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md">
              Level {profile.currentLevel}
            </span>
            <span className="text-xs text-gray-500">Tier Progress</span>
          </div>
        </div>

        {/* Streak */}
        <div className={styles.card}>
          <div className="flex justify-between items-start">
            <div>
              <p className={styles.subtext}>Current Streak</p>
              <p className="text-3xl font-black text-white mt-1.5">{profile.currentStreak} Days</p>
            </div>
            <div className={`p-2.5 rounded-xl ${profile.currentStreak > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-gray-800 text-gray-500'}`}>
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 truncate">
            {streakMessage}
          </p>
        </div>

        {/* Total Attempts */}
        <div className={styles.card}>
          <div className="flex justify-between items-start">
            <div>
              <p className={styles.subtext}>Total Attempts</p>
              <p className="text-3xl font-black text-white mt-1.5">{stats.totalAttempts} runs</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Avg accuracy:</span>
            <span className="text-green-400 font-bold">{stats.averageScore}%</span>
          </div>
        </div>

        {/* Leaderboard Position preview */}
        <div className={styles.card}>
          <div className="flex justify-between items-start">
            <div>
              <p className={styles.subtext}>Best Accuracy</p>
              <p className="text-3xl font-black text-white mt-1.5">{stats.highestScore}%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Streak Peak:</span>
            <span className="text-yellow-500 font-bold">{profile.longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Activity vs. Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attempts (2/3 width on desktop) */}
        <div className={`${styles.card} lg:col-span-2 space-y-4`}>
          <div className="flex justify-between items-center border-b border-[#2a2a40] pb-3">
            <h3 className={styles.h3}>Recent Quiz Attempts</h3>
            <button
              onClick={() => navigate("/dashboard/quizzes")}
              className="text-xs text-[#915EFF] hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              Start New Quiz
            </button>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              You haven't attempted any quizzes yet. Make your first attempt!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead>
                  <tr className="text-xs uppercase text-gray-500 border-b border-[#2a2a40]">
                    <th className="py-2.5 font-semibold">Quiz Topic</th>
                    <th className="py-2.5 font-semibold">Difficulty</th>
                    <th className="py-2.5 font-semibold">Score</th>
                    <th className="py-2.5 font-semibold">XP</th>
                    <th className="py-2.5 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a40]/30">
                  {recentAttempts.map((attempt) => (
                    <tr key={attempt.attemptId} className="hover:bg-[#202038]/30 transition duration-150">
                      <td className="py-3 font-semibold text-white truncate max-w-[150px]">{attempt.topicName}</td>
                      <td className="py-3 capitalize text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          attempt.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                          attempt.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {attempt.difficulty}
                        </span>
                      </td>
                      <td className="py-3 font-medium">
                        {attempt.score}/{attempt.maxScore} <span className="text-xs text-gray-400">({attempt.percentage}%)</span>
                      </td>
                      <td className="py-3 text-green-400 font-bold">+{attempt.xpEarned}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate(`/results/${attempt.attemptId}`)}
                          className="p-1 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer"
                          title="View detailed results"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Panel: Weak Topics & Stats Overview */}
        <div className="space-y-8">
          {/* Weak Topics */}
          <div className={`${styles.card} border-red-500/20`}>
            <div className="flex items-center gap-2 border-b border-[#2a2a40] pb-3 mb-4">
              <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
              <h3 className="text-base font-semibold text-red-400">Topics Needing Work</h3>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-gray-400 text-xs py-4 text-center">
                Outstanding! No weak areas identified. Average scores are 80%+!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {weakTopics.map((topic) => (
                  <div key={topic.topicId} className="bg-[#202038]/40 p-3 rounded-xl border border-red-500/10 flex justify-between items-center">
                    <span className="text-xs font-semibold truncate max-w-[120px]">{topic.topicName}</span>
                    <span className="text-[10px] bg-red-950/50 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/25">
                      {topic.averagePercentage}% Avg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Start Card */}
          <div className={`${styles.card} border-yellow-500/20 bg-gradient-to-b from-[#1a1a2e] to-[#201830]`}>
            <h3 className="text-base font-semibold text-yellow-500 mb-2">Did You Know?</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Taking tests in <strong>Assessment Mode</strong> awards full XP and Streak increments, while <strong>Practice Mode</strong> lets you learn step-by-step with explanation tips.
            </p>
            <button
              onClick={() => navigate("/dashboard/quizzes")}
              className={`${styles.btnPrimary} w-full text-xs py-2 bg-yellow-600 hover:bg-yellow-700`}
            >
              Start Custom Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
