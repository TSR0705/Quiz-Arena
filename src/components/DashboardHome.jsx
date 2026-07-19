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
import { motion } from "framer-motion";
import { fadeIn, zoomIn, staggerContainer } from "../utils/motion";
import { GithubCalendar } from "./ui/retro-space-shooter-git-hub-calendar";

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
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
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
    <div className="space-y-8 select-none">
      {/* Welcome Banner */}
      <motion.div 
        variants={zoomIn(0, 0.2)}
        initial="hidden"
        animate="show"
        className={`${styles.card} relative overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#251b3d] p-8 border-[#915EFF]/25`}
      >
        <motion.div 
          variants={staggerContainer(0.05, 0.02)}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-xl space-y-4"
        >
          <motion.span 
            variants={fadeIn("up", "tween", 0, 0.15)}
            className="px-3 py-1 rounded-full text-xs font-bold bg-[#915EFF]/20 text-[#a27eff] border border-[#915EFF]/30 inline-block"
          >
            Welcome Back
          </motion.span>
          <motion.h2 
            variants={fadeIn("up", "tween", 0.05, 0.15)}
            className="text-3xl font-black text-white"
          >
            Hello, {profile.displayName}! 👋
          </motion.h2>
          <motion.p 
            variants={fadeIn("up", "tween", 0.1, 0.15)}
            className={`${styles.body} text-gray-400`}
          >
            Ready to test your skills? Try a practice run or step up to a timed assessment to earn XP and level up.
          </motion.p>
          <motion.div 
            variants={fadeIn("up", "tween", 0.15, 0.15)}
            className="flex flex-wrap gap-4 pt-2"
          >
            <motion.button
              whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(145, 94, 255, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/quizzes")}
              className={`${styles.btnPrimary} flex items-center gap-2`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Explore Quizzes</span>
            </motion.button>
            <motion.button
              whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/profile")}
              className={styles.btnSecondary}
            >
              Manage Profile
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Abstract background gradient circle */}
        <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-[#915EFF]/10 blur-3xl pointer-events-none" />
      </motion.div>

      {/* Overview Stat Cards Grid */}
      <motion.div 
        variants={staggerContainer(0.03, 0.08)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Total XP */}
        <motion.div 
          variants={fadeIn("up", "tween", 0, 0.18)}
          whileHover={{ y: -2, border: "1px solid rgba(145, 94, 255, 0.25)", boxShadow: "0 6px 16px rgba(145, 94, 255, 0.04)" }}
          className={styles.card}
        >
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
        </motion.div>

        {/* Streak */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.04, 0.18)}
          whileHover={{ y: -2, border: "1px solid rgba(249, 115, 22, 0.25)", boxShadow: "0 6px 16px rgba(249, 115, 22, 0.04)" }}
          className={styles.card}
        >
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
        </motion.div>

        {/* Total Attempts */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.08, 0.18)}
          whileHover={{ y: -2, border: "1px solid rgba(59, 130, 246, 0.25)", boxShadow: "0 6px 16px rgba(59, 130, 246, 0.04)" }}
          className={styles.card}
        >
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
        </motion.div>

        {/* Leaderboard Position preview */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.12, 0.18)}
          whileHover={{ y: -2, border: "1px solid rgba(234, 179, 8, 0.25)", boxShadow: "0 6px 16px rgba(234, 179, 8, 0.04)" }}
          className={styles.card}
        >
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
        </motion.div>
      </motion.div>

      {/* SaaS Dashboard Additions: Velocity & Progress Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* XP LEVEL PROGRESS & NEXT LEVEL TARGET */}
        <motion.div
          variants={fadeIn("up", "tween", 0.1, 0.2)}
          initial="hidden"
          animate="show"
          whileHover={{ y: -1 }}
          className={`${styles.card} md:col-span-1 space-y-4`}
        >
          <div className="flex justify-between items-center border-b border-[#2a2a40] pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#915EFF]">Level Progression</h4>
            <span className="text-[10px] text-gray-500 font-mono">Rank Tier 1</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black text-white">Level {profile.currentLevel}</span>
              <span className="text-xs text-gray-400 font-semibold">{profile.totalXp} / {profile.currentLevel * 300 + 500} XP</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#202038] h-2 rounded-full overflow-hidden border border-[#2a2a40]">
              <div 
                className="bg-gradient-to-r from-[#915EFF] to-[#a27eff] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((profile.totalXp / (profile.currentLevel * 300 + 500)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              Earn another {Math.max((profile.currentLevel * 300 + 500) - profile.totalXp, 0)} XP to rank up and claim your next certificate badge.
            </p>
          </div>
        </motion.div>

        {/* WEEKLY ACTIVITY HEATMAP CONTAINER */}
        <motion.div
          variants={fadeIn("up", "tween", 0.12, 0.2)}
          initial="hidden"
          animate="show"
          whileHover={{ y: -1 }}
          className={`${styles.card} md:col-span-2 space-y-4`}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#2a2a40]/60 pb-3">
            <div>
              <h4 className="text-sm font-black text-white">Learning Activity</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Track your daily learning consistency throughout the year.</p>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] select-none text-right shrink-0">
              <div className="hidden sm:block">
                <span className="text-gray-500 block uppercase font-bold tracking-wider">Current Streak</span>
                <span className="text-orange-400 font-extrabold">{profile.currentStreak} Days</span>
              </div>
              <div className="hidden sm:block border-l border-[#2a2a40]/60 pl-4">
                <span className="text-gray-500 block uppercase font-bold tracking-wider">Longest Streak</span>
                <span className="text-yellow-500 font-extrabold">{profile.longestStreak} Days</span>
              </div>
              <div className="border-l border-[#2a2a40]/60 pl-4">
                <span className="text-gray-500 block uppercase font-bold tracking-wider">Level / XP</span>
                <span className="text-[#915EFF] font-extrabold">Lvl {profile.currentLevel} ({profile.totalXp} XP)</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto no-scrollbar py-1">
            <GithubCalendar 
              cellSize={9} 
              cellGap={3} 
              showMonthLabels={true} 
              showStats={true} 
              showLegend={true} 
              className="border-none bg-transparent"
            />
          </div>
        </motion.div>
      </div>

      {/* CONTINUOUS WORKSPACE RUNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RECOMMENDED QUIZ & CONTINUE TARGET */}
        <motion.div
          variants={fadeIn("up", "tween", 0.14, 0.2)}
          initial="hidden"
          animate="show"
          className={styles.card}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500 mb-3">Recommended For You</h4>
          <div className="bg-[#202038]/50 p-4 rounded-xl border border-yellow-500/10 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h5 className="font-bold text-white text-sm">Data Structures Challenge</h5>
              <p className="text-xs text-gray-400">Category: Software Engineering • 5 Questions</p>
              <p className="text-[10px] text-[#915EFF] font-bold">Unlocks Lvl {profile.currentLevel + 1} Certificate Badge</p>
            </div>
            <motion.button
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/quizzes")}
              className={`${styles.btnPrimary} text-xs py-1.5 px-3 bg-yellow-600 hover:bg-yellow-700`}
            >
              Start Run
            </motion.button>
          </div>
        </motion.div>

        {/* QUICK ACTION SHORTCUTS */}
        <motion.div
          variants={fadeIn("up", "tween", 0.16, 0.2)}
          initial="hidden"
          animate="show"
          className={styles.card}
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#915EFF] mb-3">Quick Shortcut Actions</h4>
          <div className="grid grid-cols-2 gap-3.5">
            <motion.button
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/quizzes")}
              className={`${styles.btnSecondary} text-xs py-2`}
            >
              🚀 Select Category
            </motion.button>
            <motion.button
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/profile")}
              className={`${styles.btnSecondary} text-xs py-2`}
            >
              👤 Update Settings
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Main Content Split: Recent Activity vs. Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attempts (2/3 width on desktop) */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.16, 0.2)}
          initial="hidden"
          animate="show"
          className={`${styles.card} lg:col-span-2 space-y-4`}
        >
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
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/results/${attempt.attemptId}`)}
                          className="p-1 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer flex items-center justify-end w-full"
                          title="View detailed results"
                        >
                          <ExternalLink className="w-4.5 h-4.5" />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Sidebar Panel: Weak Topics & Stats Overview */}
        <motion.div 
          variants={staggerContainer(0.04, 0.2)}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Weak Topics */}
          <motion.div 
            variants={fadeIn("up", "tween", 0, 0.2)}
            className={`${styles.card} border-red-500/20`}
          >
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
          </motion.div>

          {/* Quick Start Card */}
          <motion.div 
            variants={fadeIn("up", "tween", 0.05, 0.2)}
            className={`${styles.card} border-yellow-500/20 bg-gradient-to-b from-[#1a1a2e] to-[#201830]`}
          >
            <h3 className="text-base font-semibold text-yellow-500 mb-2">Did You Know?</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Taking tests in <strong>Assessment Mode</strong> awards full XP and Streak increments, while <strong>Practice Mode</strong> lets you learn step-by-step with explanation tips.
            </p>
            <motion.button
              whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(202, 138, 4, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/quizzes")}
              className={`${styles.btnPrimary} w-full text-xs py-2 bg-yellow-600 hover:bg-yellow-700`}
            >
              Start Custom Quiz
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHome;
