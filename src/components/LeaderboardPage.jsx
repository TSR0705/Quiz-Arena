import React, { useState, useEffect } from "react";
import { styles } from "../styles";
import { Trophy, Calendar, Filter, Star, ShieldAlert, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, zoomIn, staggerContainer } from "../utils/motion";

const LeaderboardPage = () => {
  const [categories, setCategories] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [period, setPeriod] = useState("all-time"); // daily | weekly | all-time
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");

  // Load catalog for filter options
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Fetch leaderboard based on filters
  useEffect(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (period !== "all-time") params.append("period", period);
    if (selectedCategoryId) params.append("categoryId", selectedCategoryId);
    if (selectedTopicId) params.append("topicId", selectedTopicId);
    if (difficulty) params.append("difficulty", difficulty);

    fetch(`/api/leaderboard?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not retrieve global leaderboard.");
        return res.json();
      })
      .then((data) => {
        setLeaderboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load rankings. Please try again.");
        setLoading(false);
      });
  }, [period, selectedCategoryId, selectedTopicId, difficulty]);

  // Find topics for selected category
  const activeCategory = categories.find(c => c.id === parseInt(selectedCategoryId));
  const availableTopics = activeCategory ? activeCategory.topics : [];

  return (
    <motion.div 
      variants={staggerContainer(0.04, 0.05)}
      initial="hidden"
      animate="show"
      className="space-y-8 select-none"
    >
      {/* Filters Area */}
      <motion.div 
        variants={zoomIn(0, 0.2)}
        className={`${styles.card} grid grid-cols-1 md:grid-cols-4 gap-4 p-5 items-end`}
      >
        {/* Period Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#915EFF]" />
            <span>Time Horizon</span>
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={styles.input}
          >
            <option value="all-time">All Time</option>
            <option value="weekly">This Week</option>
            <option value="daily">Today (24h)</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#915EFF]" />
            <span>Category</span>
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedTopicId(""); // Reset topic
            }}
            className={styles.input}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Topic Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#915EFF]" />
            <span>Topic</span>
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={!selectedCategoryId}
            className={`${styles.input} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">All Topics</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#915EFF]" />
            <span>Difficulty</span>
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={styles.input}
          >
            <option value="">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </motion.div>

      {/* Ranks Panel */}
      <motion.div 
        variants={fadeIn("up", "tween", 0.05, 0.2)}
        className={styles.card}
      >
        <div className="flex items-center gap-3 border-b border-[#2a2a40] pb-4 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />
          <div>
            <h2 className={styles.h2}>Global Rankings</h2>
            <p className={styles.subtext}>Top quiz submissions for the selected criteria</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#915EFF] mx-auto mb-4"></div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 space-y-2">
            <ShieldAlert className="w-10 h-10 mx-auto" />
            <p className="text-sm">{error}</p>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No submissions recorded yet for these filters. Be the first to secure a spot!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead>
                <tr className="text-xs uppercase text-gray-500 border-b border-[#2a2a40]">
                  <th className="py-3 px-4 font-semibold text-center w-16">Rank</th>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Category / Topic</th>
                  <th className="py-3 px-4 font-semibold text-center">Score</th>
                  <th className="py-3 px-4 font-semibold text-center">Time</th>
                  <th className="py-3 px-4 font-semibold text-center">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a40]/30">
                {leaderboardData.map((row) => {
                  return (
                    <tr key={row.attemptId} className="hover:bg-[#202038]/30 transition duration-150">
                      <td className="py-3.5 px-4 text-center font-black">
                        {row.rank <= 3 ? (
                          <span className="inline-flex justify-center items-center w-8 h-8 rounded-lg text-sm font-black shadow-sm bg-opacity-20 uppercase">
                            {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">{row.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${row.displayName}`}
                          alt="avatar"
                          className="w-7 h-7 rounded-lg bg-[#202038] border border-[#2a2a40]"
                        />
                        <span>{row.displayName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-white font-medium text-xs">{row.topicName}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{row.categoryName} • <span className="capitalize">{row.difficulty}</span></p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        <span className="text-white">{row.score}/{row.maxScore}</span>
                        <span className="text-[10px] text-gray-400 block">({row.percentage}%)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-gray-400">
                        {row.timeTakenSeconds}s
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-green-400">
                        +{row.xpEarned}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LeaderboardPage;
