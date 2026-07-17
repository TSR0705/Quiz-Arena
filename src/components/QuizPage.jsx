import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      <div className="p-8 text-white max-w-3xl mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Review Your Answers</h1>
        <p className="mb-4">Review flagged or unanswered questions before final submission.</p>
        <div className="space-y-4">
          {[...Array(attempt.questionsCount)].map((_, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg bg-gray-800 border ${
                flaggedQuestions.includes(idx) ? "border-yellow-400" : "border-gray-700"
              }`}
            >
              <p className="font-semibold">Question {idx + 1}</p>
              <p className="mt-2 text-sm text-gray-300">
                Status: {answers[idx] || (idx === attempt.currentQuestionIndex && selectedOptionId) ? "Draft Answered" : "Unanswered"}
                {flaggedQuestions.includes(idx) && <span className="ml-2 text-yellow-400"> (Flagged)</span>}
              </p>
              <button
                onClick={() => handleJumpToQuestion(idx)}
                className="mt-2 px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
              >
                Review Question
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setShowReviewScreen(false)}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Back to Quiz
          </button>
          <button
            onClick={handleFinalSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    );
  }

  // 7. Quiz taking main page
  return (
    <div className="p-8 text-white max-w-3xl mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">
        Quiz Attempt - {attempt.quizMode === "practice" ? "Practice" : "Assessment"} Mode
      </h1>

      {/* Navigator panel (FR-041, FR-042) */}
      <div className="flex overflow-x-auto space-x-2 mb-4 p-2 bg-gray-800 rounded">
        {[...Array(attempt.questionsCount)].map((_, index) => (
          <button
            key={index}
            onClick={() => (attempt.quizMode === "assessment" || index <= attempt.currentQuestionIndex) && handleJumpToQuestion(index)}
            className={`w-8 h-8 rounded-full flex-shrink-0 font-semibold transition ${
              index === attempt.currentQuestionIndex
                ? "bg-purple-500 text-white ring-2 ring-white"
                : index < attempt.currentQuestionIndex
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            } ${flaggedQuestions.includes(index) ? "border-2 border-yellow-400" : ""}`}
            disabled={attempt.quizMode === "practice" && index > attempt.currentQuestionIndex}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="w-full bg-gray-700 h-2 mb-4 rounded">
        <div
          className="bg-purple-500 h-2 rounded transition-all duration-300"
          style={{ width: `${((attempt.currentQuestionIndex + 1) / attempt.questionsCount) * 100}%` }}
        ></div>
      </div>

      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Question {attempt.currentQuestionIndex + 1} of {attempt.questionsCount}
        </h2>
        <p className={`text-lg font-bold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-white"}`}>
          {attempt.quizMode === "practice" ? `Time Left: ${timeLeft}s` : `Total Time: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`}
        </p>
      </div>

      <motion.div
        key={attempt.currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-lg mb-6 p-4 bg-gray-800 rounded border border-gray-700">
          {currentQuestion.questionText}
        </p>

        {/* Options grid */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isEliminated = eliminatedOptions.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => !isSubmitted && !isEliminated && setSelectedOptionId(option.id)}
                className={`w-full p-4 text-left rounded-lg border transition duration-200 ${
                  isEliminated
                    ? "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed line-through"
                    : isSubmitted
                    ? option.id === selectedOptionId
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                    : selectedOptionId === option.id
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
                }`}
                disabled={isSubmitted || isEliminated}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {/* Action buttons (FR-043, FR-051, FR-052) */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevQuestion}
            className={`px-6 py-2 rounded-lg text-white font-semibold transition ${
              attempt.currentQuestionIndex === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={attempt.currentQuestionIndex === 0}
          >
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={toggleFlagQuestion}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
                flaggedQuestions.includes(attempt.currentQuestionIndex)
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {flaggedQuestions.includes(attempt.currentQuestionIndex) ? "Unflag" : "Flag"}
            </button>

            {!isSubmitted && (
              <>
                <button
                  onClick={handleHint}
                  className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
                    hintUsed ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                  disabled={hintUsed}
                >
                  Hint
                </button>
                <button
                  onClick={handleFiftyFifty}
                  className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
                    fiftyFiftyUsed ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                  disabled={fiftyFiftyUsed}
                >
                  50/50
                </button>
              </>
            )}

            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                className={`px-6 py-2 rounded-lg font-bold transition ${
                  selectedOptionId ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!selectedOptionId}
              >
                {attempt.quizMode === "practice" ? "Submit Answer" : "Save Answer"}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                {attempt.currentQuestionIndex + 1 < attempt.questionsCount ? "Next" : "Review"}
              </button>
            )}
          </div>
        </div>

        {/* Feedback area for Practice Mode */}
        {isSubmitted && attempt.quizMode === "practice" && (
          <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-700 animate-fadeIn">
            <p className="text-xl font-bold text-center mb-2">{feedback}</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{explanation}</p>
            
            {/* Rating & Reports (FR-120, FR-121) */}
            <div className="border-t border-gray-700 pt-4 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                <span>Rate:</span>
                <button onClick={() => handleRateQuestion("helpful")} className="px-2 py-1 bg-green-900 rounded hover:bg-green-800">👍 Helpful</button>
                <button onClick={() => handleRateQuestion("confusing")} className="px-2 py-1 bg-yellow-950 rounded hover:bg-yellow-900">😕 Confusing</button>
                <button onClick={() => handleRateQuestion("incorrect")} className="px-2 py-1 bg-red-950 rounded hover:bg-red-900">👎 Incorrect</button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Report issue..."
                  className="bg-gray-900 text-white text-xs p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 w-40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value) {
                      handleReportIssue("content_error", e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizTakingPage;