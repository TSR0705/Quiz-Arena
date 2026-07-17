import React, { useState, useEffect } from "react";
import { styles } from "../styles";
import { ChevronRight, ArrowLeft, Play, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuizSelectionPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizMode, setQuizMode] = useState("assessment"); 
  const navigate = useNavigate();

  // 1. Fetch categories and topics from server
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load catalog:", err);
        setError('Failed to load quiz catalog. Please try again.');
        setLoading(false);
      });
  }, []);

  // Handle category selected
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedTopicId(""); // Reset topic selection
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedTopicId("");
  };

  // 3. Start attempt API call (FR-030)
  const handleStartQuiz = async () => {
    if (!selectedCategory || !selectedTopicId) return;

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          topicId: parseInt(selectedTopicId),
          difficulty,
          questionCount: numQuestions,
          quizMode
        }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/quiz/${data.attemptId}`);
      } else {
        alert(data.error?.message || "Failed to start quiz attempt.");
      }
    } catch (err) {
      console.error("Start quiz error:", err);
      alert("Failed to start quiz due to a network error.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#915EFF] mx-auto mb-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.card} p-8 text-center text-red-400 space-y-4`}>
        <p className="text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.btnPrimary}
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category List view */}
      {!selectedCategory ? (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className={styles.h2}>Select Quiz Category</h2>
            <p className={styles.subtext}>Choose a domain to view topics and start testing</p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No quiz categories are currently available. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`${styles.card} hover:border-[#915EFF]/40 hover:shadow-violet-500/5 hover:-translate-y-1 cursor-pointer flex flex-col justify-between`}
                >
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2 group-hover:text-[#915EFF] transition duration-150">
                      {cat.name}
                    </h3>
                    <p className="text-gray-400 text-xs leading-normal">{cat.description}</p>
                  </div>
                  <div className="mt-6 flex justify-between items-center text-xs text-gray-500">
                    <span>{cat.topics?.length || 0} topics available</span>
                    <ChevronRight className="w-4 h-4 text-[#915EFF]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Configuration View (Category selected)
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={handleBackToCategories}
            className="flex items-center gap-2 text-xs font-semibold text-[#915EFF] hover:underline bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Categories</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Selections & Config */}
            <div className={`${styles.card} lg:col-span-2 space-y-6`}>
              <div className="border-b border-[#2a2a40] pb-3">
                <h3 className={styles.h3}>Configure Quiz Parameters</h3>
                <p className={styles.subtext}>Category: <strong className="text-white">{selectedCategory.name}</strong></p>
              </div>

              <div className="space-y-5">
                {/* Topic select */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400">Choose Topic</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className={styles.input}
                  >
                    <option value="">Select a topic</option>
                    {selectedCategory.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode select */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400">Quiz Mode</label>
                  <select
                    value={quizMode}
                    onChange={(e) => setQuizMode(e.target.value)}
                    className={styles.input}
                  >
                    <option value="assessment">Assessment Mode (Timer limit, free navigation, graded at end)</option>
                    <option value="practice">Practice Mode (Immediate answer explanation, sequential nav)</option>
                  </select>
                </div>

                {/* Difficulty select */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400">Select Difficulty</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["easy", "medium", "hard"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`py-2.5 rounded-xl text-xs font-bold capitalize transition duration-150 border cursor-pointer ${
                          difficulty === level
                            ? "bg-[#915EFF]/15 border-[#915EFF] text-white"
                            : "bg-[#2e2e4d]/40 border-[#3e3e5f] text-gray-400 hover:text-white"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question count */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400">Number of Questions (1-50)</label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                    className={styles.input}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={25}>25 Questions</option>
                  </select>
                </div>

                {/* Start Button */}
                <button
                  onClick={() => {
                    if (!selectedTopicId) {
                      alert("Please select a topic first.");
                      return;
                    }
                    handleStartQuiz();
                  }}
                  disabled={!selectedTopicId}
                  className={`${styles.btnPrimary} w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Challenge</span>
                </button>
              </div>
            </div>

            {/* Right side: Helper hints */}
            <div className="space-y-6">
              <div className={`${styles.card} border-yellow-500/10`}>
                <h4 className="font-semibold text-yellow-500 text-sm flex items-center gap-1.5 mb-2">
                  <Info className="w-4 h-4" />
                  <span>Mode Guidance</span>
                </h4>
                <div className="space-y-3.5 text-xs text-gray-400 leading-normal">
                  <div>
                    <p className="font-bold text-white mb-0.5">Practice Mode</p>
                    <p>Designed for learning. You get immediate correctness feedback and explanations for each option after selecting your answer.</p>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-0.5">Assessment Mode</p>
                    <p>Designed for testing. A global countdown timer enforces speed. You submit your entire paper at the end for grading and streak/XP credits.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSelectionPage;
