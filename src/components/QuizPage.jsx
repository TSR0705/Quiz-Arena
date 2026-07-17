import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  Flag, 
  HelpCircle, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Timer, 
  ThumbsUp, 
  CornerDownRight,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send
} from "lucide-react";
import { styles } from "../styles";

const QuizTakingPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // State management
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [answers, setAnswers] = useState({}); // Stores draft selection IDs for visual indicators
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false); // Indicates current question answered in Practice Mode
  const [feedback, setFeedback] = useState("");
  const [explanation, setExplanation] = useState("");
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  // 1. Fetch current attempt state and active question
  const loadAttemptState = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      if (!res.ok) {
        throw new Error("Failed to load attempt.");
      }
      const data = await res.json();

      if (data.status === "submitted") {
        navigate(`/results/${attemptId}`);
        return;
      }

      setAttempt(data);
      setCurrentQuestion(data.currentQuestion);
      setHintUsed(data.currentQuestion.hintUsed);
      setFiftyFiftyUsed(data.currentQuestion.fiftyFiftyUsed);
      setEliminatedOptions(data.currentQuestion.eliminatedOptionIds);

      // In Assessment Mode, track locally selected option
      if (data.quizMode === "assessment") {
        const preselected = data.currentQuestion.options.find(
          (o) => o.id === data.currentQuestion.selectedOptionId
        );
        setSelectedOptionId(data.currentQuestion.selectedOptionId || "");
      } else {
        setSelectedOptionId("");
        setIsSubmitted(data.currentQuestion.hintUsed || data.currentQuestion.fiftyFiftyUsed); // placeholder
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quiz question.");
    }
  };

  useEffect(() => {
    loadAttemptState();
  }, [attemptId]);

  // 2. Timer Logic (Practice Mode vs Assessment Mode)
  useEffect(() => {
    if (!attempt || showReviewScreen) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (attempt.quizMode === "practice") {
      // Practice Mode: 30s per-question timer
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Assessment Mode: Global timer based on expiresAt
      const calculateGlobalTime = () => {
        const remaining = Math.max(
          0,
          Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          handleGlobalTimeout();
        }
      };

      calculateGlobalTime();
      timerRef.current = setInterval(calculateGlobalTime, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, currentQuestion, showReviewScreen]);

  // Handles Practice Mode question timeout
  const handleTimeout = async () => {
    toast.error("Time ran out for this question!", { position: "top-right" });
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedOptionId: null }),
      });
      const data = await res.json();
      setFeedback("Timed out!");
      setExplanation(data.explanation || "");
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Handles Assessment Mode global timeout
  const handleGlobalTimeout = async () => {
    toast.error("Time limit reached! Submitting quiz...", { position: "top-center" });
    try {
      await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      navigate(`/results/${attemptId}`);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Submit Answer
  const handleSubmitAnswer = async () => {
    if (!selectedOptionId) {
      toast.warning("Please select an option first.");
      return;
    }

    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedOptionId }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Failed to submit answer.");
        return;
      }

      if (attempt.quizMode === "practice") {
        setIsSubmitted(true);
        if (data.isCorrect) {
          setFeedback("Correct!");
          toast.success("Great job!", { position: "top-right", autoClose: 2000 });
        } else {
          setFeedback("Wrong Answer!");
          toast.error("Better luck next time!", { position: "top-right", autoClose: 2000 });
        }
        setExplanation(data.explanation || "");
      } else {
        // Assessment Mode: Update drafts locally
        setAnswers({ ...answers, [attempt.currentQuestionIndex]: selectedOptionId });
        toast.success("Draft saved.", { position: "top-right", autoClose: 1000 });
        handleNextQuestion();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save answer.");
    }
  };

  // 4. Lifelines
  const handleHint = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/lifelines/hint`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.info(`Hint: ${data.hintText}`, { position: "top-center", autoClose: 6000 });
        setHintUsed(true);
      } else {
        toast.error(data.error?.message || "Failed to retrieve hint.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFiftyFifty = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/lifelines/fifty-fifty`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEliminatedOptions(data.eliminatedOptionIds);
        setFiftyFiftyUsed(true);
        toast.info("Two incorrect options removed!", { position: "top-center", autoClose: 2000 });
      } else {
        toast.error(data.error?.message || "Failed to execute 50/50.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Jump/Navigate Index (FR-043, FR-044)
  const handleJumpToQuestion = async (index) => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      if (res.ok) {
        setShowReviewScreen(false);
        setIsSubmitted(false);
        setFeedback("");
        setExplanation("");
        loadAttemptState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = attempt.currentQuestionIndex + 1;
    if (nextIdx < attempt.questionsCount) {
      handleJumpToQuestion(nextIdx);
    } else {
      setShowReviewScreen(true);
    }
  };

  const handlePrevQuestion = () => {
    const prevIdx = attempt.currentQuestionIndex - 1;
    if (prevIdx >= 0) {
      handleJumpToQuestion(prevIdx);
    }
  };

  // Flag/Unflag (FR-045)
  const toggleFlagQuestion = () => {
    const idx = attempt.currentQuestionIndex;
    if (flaggedQuestions.includes(idx)) {
      setFlaggedQuestions(flaggedQuestions.filter((i) => i !== idx));
    } else {
      setFlaggedQuestions([...flaggedQuestions, idx]);
    }
  };

  // Final submit quiz
  const handleFinalSubmit = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      if (res.ok) {
        navigate(`/results/${attemptId}`);
      } else {
        toast.error("Failed to submit quiz.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rate a question (FR-120)
  const handleRateQuestion = async (rating) => {
    try {
      const res = await fetch("/api/feedback/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptQuestionId: currentQuestion.attemptQuestionId,
          rating
        })
      });
      if (res.ok) {
        toast.success(`Question rated as ${rating}!`, { position: "top-right" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Report an issue (FR-121)
  const handleReportIssue = async (reportType, message) => {
    try {
      const res = await fetch("/api/feedback/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.questionId, // Wait! We need the source question ID. Let's make sure it is added or fetch it from activeQ
          attemptId,
          reportType,
          message
        })
      });
      if (res.ok) {
        toast.success("Issue reported successfully!", { position: "top-right" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!attempt || !currentQuestion) {
    return <div className="text-center mt-10 text-white">Loading quiz attempt...</div>;
  }

  // 6. Review Screen before final submission (FR-070)
  if (showReviewScreen) {
    return (
      <div className={`p-6 md:p-8 text-white max-w-3xl mx-auto min-h-screen flex flex-col justify-center space-y-6 ${styles.bgMain}`}>
        <ToastContainer />
        <div className={styles.card}>
          <div className="flex items-center gap-3 border-b border-[#2a2a40] pb-4 mb-6">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className={styles.h2}>Review Your Answers</h2>
              <p className={styles.subtext}>Check flagged or unanswered questions before submitting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-2">
            {[...Array(attempt.questionsCount)].map((_, idx) => {
              const isAnswered = answers[idx] !== undefined || (idx === attempt.currentQuestionIndex && selectedOptionId);
              const isFlagged = flaggedQuestions.includes(idx);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition duration-150 ${
                    isFlagged 
                      ? "border-yellow-500 bg-yellow-500/5" 
                      : isAnswered
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-[#2a2a40] bg-[#202038]/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-white">Question {idx + 1}</p>
                    <div className="flex gap-1.5">
                      {isFlagged && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                          Flagged
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAnswered 
                          ? "bg-green-500/10 text-green-400 border border-green-500/25" 
                          : "bg-red-500/10 text-red-400 border border-red-500/25"
                      }`}>
                        {isAnswered ? "Draft Saved" : "Unanswered"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`${styles.btnSecondary} text-xs py-1.5 w-full`}
                  >
                    Jump to Question
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 border-t border-[#2a2a40] pt-6">
            <button
              onClick={() => setShowReviewScreen(false)}
              className={styles.btnSecondary}
            >
              Back to Quiz
            </button>
            <button
              onClick={handleFinalSubmit}
              className={`${styles.btnPrimary} bg-green-600 hover:bg-green-700`}
            >
              Submit Quiz Paper
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. Quiz taking main page
  return (
    <div className={`p-4 md:p-8 text-white max-w-2xl mx-auto min-h-[80vh] flex flex-col justify-start space-y-6 select-none`}>
      <ToastContainer />
      
      <div>
        {/* Header Title info */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#2a2a40]/60 pb-5 mb-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white capitalize">
              {attempt.quizMode === "practice" ? "⚡ Practice Session" : "🏆 Assessment Run"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Answer carefully and watch the timer</p>
          </div>
          {/* Global / Local Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#202038]/40 border border-[#2a2a4c]/50 rounded-xl self-start sm:self-auto">
            <Timer className={`w-3.5 h-3.5 ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-[#915EFF]"}`} />
            <span className={`text-xs font-mono font-bold ${timeLeft <= 10 ? "text-red-400" : "text-gray-300"}`}>
              {attempt.quizMode === "practice" 
                ? `${timeLeft}s` 
                : `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`}
            </span>
          </div>
        </div>

        {/* Navigator Circles */}
        <div className="space-y-1.5 mb-6">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Navigation Map</label>
          <div className="flex flex-wrap gap-1.5 py-1">
            {[...Array(attempt.questionsCount)].map((_, index) => {
              const isCurrent = index === attempt.currentQuestionIndex;
              const isFlagged = flaggedQuestions.includes(index);
              const isPracticeCompleted = attempt.quizMode === "practice" && index < attempt.currentQuestionIndex;
              const isAssessmentCompleted = attempt.quizMode === "assessment" && answers[index] !== undefined;

              return (
                <button
                  key={index}
                  onClick={() => (attempt.quizMode === "assessment" || index <= attempt.currentQuestionIndex) && handleJumpToQuestion(index)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all duration-150 border cursor-pointer ${
                    isCurrent
                      ? "bg-[#915EFF] border-[#915EFF] text-white shadow-md shadow-[#915EFF]/15 scale-105 z-10"
                      : isPracticeCompleted || isAssessmentCompleted
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-[#202038]/40 border-[#2a2a40] text-gray-400 hover:text-white"
                  } ${isFlagged ? "border-yellow-500" : ""}`}
                  disabled={attempt.quizMode === "practice" && index > attempt.currentQuestionIndex}
                  title={`Question ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Progress Bar Timer for Practice Mode */}
        {attempt.quizMode === "practice" && !isSubmitted && (
          <div className="w-full bg-[#202038] h-1 rounded-full overflow-hidden mb-6 border border-[#2a2a40]/30">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : 'bg-[#915EFF]'}`} 
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
        )}

        {/* Question Header */}
        <div className="flex justify-between items-center mb-4 text-xs font-semibold text-gray-400">
          <span>QUESTION {attempt.currentQuestionIndex + 1} OF {attempt.questionsCount}</span>
          <span className="capitalize px-2 py-0.5 rounded bg-[#202038] text-gray-400 border border-[#2a2a40]">
            {attempt.difficulty}
          </span>
        </div>

        {/* Animated Question Body */}
        <motion.div
          key={attempt.currentQuestionIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="text-xl font-bold text-white tracking-tight leading-relaxed py-3">
            {currentQuestion.questionText}
          </div>

          {/* Options Grid */}
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option) => {
              const isEliminated = eliminatedOptions.includes(option.id);
              
              // Correctness state mappings for Practice Mode Feedback
              let cardStyle = "bg-[#202038]/15 border-[#2a2a40]/70 text-gray-400 hover:border-[#915EFF]/40 hover:bg-[#202038]/30 hover:text-white";
              
              if (isEliminated) {
                cardStyle = "bg-gray-900/40 border-gray-800/40 text-gray-600 cursor-not-allowed line-through";
              } else if (isSubmitted) {
                if (option.id === selectedOptionId) {
                  // User selected this option
                  const isCorrect = currentQuestion.correctOptionIds?.includes(option.id) || feedback === "Correct!";
                  cardStyle = isCorrect 
                    ? "bg-green-500/5 border-green-500 text-green-400 font-bold" 
                    : "bg-red-500/5 border-red-500 text-red-400 font-bold";
                } else if (currentQuestion.correctOptionIds?.includes(option.id)) {
                  // Correct option that user did NOT select
                  cardStyle = "bg-green-500/5 border-green-500/40 text-green-400";
                } else {
                  cardStyle = "bg-[#202038]/5 border-[#2a2a40]/30 text-gray-500";
                }
              } else if (selectedOptionId === option.id) {
                // Draft selection
                cardStyle = "bg-[#915EFF]/5 border-[#915EFF] text-white shadow-md shadow-[#915EFF]/5 font-semibold";
              }

              return (
                <motion.button
                  key={option.id}
                  onClick={() => !isSubmitted && !isEliminated && setSelectedOptionId(option.id)}
                  whileHover={!isSubmitted && !isEliminated ? { y: -0.5, borderColor: "rgba(145, 94, 255, 0.45)" } : {}}
                  whileTap={!isSubmitted && !isEliminated ? { scale: 0.995 } : {}}
                  className={`w-full p-4.5 text-left rounded-xl border transition-colors duration-150 text-sm cursor-pointer ${cardStyle}`}
                  disabled={isSubmitted || isEliminated}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex w-5 h-5 rounded-full border border-current items-center justify-center text-[10px] shrink-0 opacity-60">
                      {option.id.replace("opt_", "")}
                    </span>
                    <span>{option.text}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-4 mt-8 border-t border-[#2a2a40] pt-6">
            <motion.button
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevQuestion}
              className={`${styles.btnSecondary} flex items-center justify-center gap-1 text-xs`}
              disabled={attempt.currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </motion.button>

            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ y: -0.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleFlagQuestion}
                className={`text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer ${
                  flaggedQuestions.includes(attempt.currentQuestionIndex)
                    ? "bg-yellow-500/10 border-yellow-500 text-yellow-400"
                    : "bg-[#2e2e4d]/30 border-[#3e3e5f] text-gray-400 hover:text-white"
                }`}
              >
                {flaggedQuestions.includes(attempt.currentQuestionIndex) ? "Unflag" : "Flag"}
              </motion.button>

              {!isSubmitted && (
                <>
                  <motion.button
                    whileHover={{ y: -0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleHint}
                    className={`text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={hintUsed}
                  >
                    Hint
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -0.5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFiftyFifty}
                    className={`text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={fiftyFiftyUsed}
                  >
                    50/50
                  </motion.button>
                </>
              )}

              {!isSubmitted ? (
                <motion.button
                  whileHover={{ y: -0.5, boxShadow: "0 4px 12px rgba(145, 94, 255, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitAnswer}
                  className={`${styles.btnPrimary} text-xs py-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!selectedOptionId}
                >
                  {attempt.quizMode === "practice" ? "Submit Answer" : "Save Answer"}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ y: -0.5, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextQuestion}
                  className={`${styles.btnPrimary} text-xs py-2.5 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1`}
                >
                  <span>{attempt.currentQuestionIndex + 1 < attempt.questionsCount ? "Next Question" : "Review Paper"}</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Feedback area for Practice Mode */}
          {isSubmitted && attempt.quizMode === "practice" && (
            <div className="mt-6 p-5 bg-[#202038]/40 border border-[#2a2a40] rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[#2a2a40]/50 pb-2.5">
                {feedback === "Correct!" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <h4 className={`text-md font-bold ${feedback === "Correct!" ? "text-green-400" : "text-red-400"}`}>
                  {feedback}
                </h4>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Explanation Details</span>
                </span>
                <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium bg-[#131326] p-3 rounded-lg border border-[#2a2a40]">
                  {explanation}
                </p>
              </div>
              
              {/* Rating & Reports (FR-120, FR-121) */}
              <div className="border-t border-[#2a2a40]/50 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-semibold">Rate Question:</span>
                  <button onClick={() => handleRateQuestion("helpful")} className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 font-medium transition cursor-pointer border-none">👍 Helpful</button>
                  <button onClick={() => handleRateQuestion("confusing")} className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 hover:bg-yellow-500/20 font-medium transition cursor-pointer border-none">😕 Confusing</button>
                  <button onClick={() => handleRateQuestion("incorrect")} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 font-medium transition cursor-pointer border-none">👎 Bad</button>
                </div>

                <div className="flex items-center gap-2 bg-[#131326] border border-[#2a2a40] p-1 rounded-xl shrink-0 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Report content typo..."
                    className="bg-transparent text-white text-[10px] px-2 py-1 outline-none border-none w-full sm:w-36 placeholder:text-gray-600"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value) {
                        handleReportIssue("content_error", e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />
                  <span className="text-[10px] text-gray-500 px-2 select-none">Enter</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuizTakingPage;