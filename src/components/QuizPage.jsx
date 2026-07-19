import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  CloudLightning,
  AlertTriangle
} from "lucide-react";
import { styles } from "../styles";

const QuizTakingPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // State management
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [answers, setAnswers] = useState({}); // Stores draft selection IDs
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false); // practice mode answer submission
  const [feedback, setFeedback] = useState("");
  const [explanation, setExplanation] = useState("");
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  
  // Immersive state modifiers
  const [userProfile, setUserProfile] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved", "saving", "offline", "error"
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submissionPhase, setSubmissionPhase] = useState(""); // "", "submitting", "calculating", "insights"
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeIndex, setResumeIndex] = useState(null);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  // Fetch current attempt state and user profile stats on mount
  const loadAttemptState = async (targetIndex = null) => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      if (!res.ok) throw new Error("Failed to load attempt.");
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
        const selectedId = data.currentQuestion.selectedOptionId || "";
        setSelectedOptionId(selectedId);
        
        // Track answered states for the navigation grid
        if (selectedId) {
          setAnswers(prev => ({ ...prev, [data.currentQuestionIndex]: selectedId }));
        }

        // Session Recovery check
        const storedResumeIdx = localStorage.getItem(`quiz_resume_idx_${attemptId}`);
        if (storedResumeIdx !== null && targetIndex === null) {
          const idx = parseInt(storedResumeIdx);
          if (idx !== data.currentQuestionIndex) {
            setResumeIndex(idx);
            setShowResumeModal(true);
          }
        }
      } else {
        setSelectedOptionId("");
        setIsSubmitted(data.currentQuestion.hintUsed || data.currentQuestion.fiftyFiftyUsed);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quiz question.");
    }
  };

  useEffect(() => {
    loadAttemptState();

    // Fetch user dashboard profile details for streak HUD
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(data => {
        if (data && data.profile) {
          setUserProfile(data.profile);
        }
      })
      .catch(err => console.error("Error loading dashboard profile for streaks:", err));
  }, [attemptId]);

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically sync offline queue if reconnected
      const queue = JSON.parse(localStorage.getItem(`offline_queue_${attemptId}`) || "{}");
      const keys = Object.keys(queue);
      if (keys.length > 0) {
        setSaveStatus("saving");
        Promise.all(keys.map(async (idx) => {
          const optId = queue[idx];
          await fetch(`/api/attempts/${attemptId}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedOptionId: optId }),
          });
        })).then(() => {
          localStorage.removeItem(`offline_queue_${attemptId}`);
          setSaveStatus("saved");
          toast.success("Connection restored: local answers synced!");
        }).catch(() => setSaveStatus("error"));
      } else {
        setSaveStatus("saved");
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [attemptId]);

  // Keyboard Navigation Shortcuts & Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showReviewScreen || submissionPhase) return;
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
      
      const key = e.key.toLowerCase();
      if (key >= "1" && key <= "4") {
        const optionIndex = parseInt(key) - 1;
        if (currentQuestion && currentQuestion.options[optionIndex]) {
          const opt = currentQuestion.options[optionIndex];
          const isEliminated = eliminatedOptions.includes(opt.id);
          if (!isSubmitted && !isEliminated) {
            handleSelectOption(opt.id);
          }
        }
      } else if (e.key === "ArrowLeft") {
        handlePrevQuestion();
      } else if (e.key === "ArrowRight") {
        handleNextQuestion();
      } else if (key === "f") {
        toggleFlagQuestion();
      } else if (e.key === "Enter") {
        if (attempt?.quizMode === "practice") {
          if (!isSubmitted) {
            if (selectedOptionId) handleSubmitAnswer();
          } else {
            handleNextQuestion();
          }
        } else {
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attempt, currentQuestion, selectedOptionId, isSubmitted, eliminatedOptions, flaggedQuestions, showReviewScreen, submissionPhase]);

  // Timer Logic
  useEffect(() => {
    if (!attempt || showReviewScreen || submissionPhase) return;
    if (timerRef.current) clearInterval(timerRef.current);

    if (attempt.quizMode === "practice") {
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
  }, [attempt, currentQuestion, showReviewScreen, submissionPhase]);

  // Exit Protection warning alert
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure? Your active quiz progress will be lost.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Practice Mode timeout
  const handleTimeout = async () => {
    toast.error("Time ran out for this question!");
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

  // Assessment Mode timeout
  const handleGlobalTimeout = async () => {
    toast.error("Time limit reached! Submitting quiz...", { position: "top-center" });
    try {
      await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      navigate(`/results/${attemptId}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Selection auto-saves drafts
  const handleSelectOption = async (optionId) => {
    if (isSubmitted) return;
    setSelectedOptionId(optionId);

    if (attempt.quizMode === "assessment") {
      setSaveStatus("saving");
      setAnswers(prev => ({ ...prev, [attempt.currentQuestionIndex]: optionId }));
      
      if (!navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem(`offline_queue_${attemptId}`) || "{}");
        queue[attempt.currentQuestionIndex] = optionId;
        localStorage.setItem(`offline_queue_${attemptId}`, JSON.stringify(queue));
        setSaveStatus("offline");
        return;
      }

      try {
        const res = await fetch(`/api/attempts/${attemptId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedOptionId: optionId }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error(err);
        setSaveStatus("error");
      }
    }
  };

  // Practice Mode Manual Answer submission
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

      setIsSubmitted(true);
      if (data.isCorrect) {
        setFeedback("Correct!");
        // Practice Mode correct-selection celebration toast
        toast.success("✓ Nice! +10 XP", { position: "top-right", autoClose: 1500 });
      } else {
        setFeedback("Wrong Answer!");
      }
      setExplanation(data.explanation || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save answer.");
    }
  };

  // Lifelines
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
        toast.info("Two incorrect options removed!");
      } else {
        toast.error(data.error?.message || "Failed to execute 50/50.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation Index Jumps
  const handleJumpToQuestion = async (index) => {
    // Record current active index for session restoration
    localStorage.setItem(`quiz_resume_idx_${attemptId}`, String(index));
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
        loadAttemptState(index);
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

  const toggleFlagQuestion = () => {
    const idx = attempt.currentQuestionIndex;
    if (flaggedQuestions.includes(idx)) {
      setFlaggedQuestions(flaggedQuestions.filter((i) => i !== idx));
    } else {
      setFlaggedQuestions([...flaggedQuestions, idx]);
    }
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit this assessment? Your current session progress is auto-saved, but the clock will continue to run for Assessment Mode.")) {
      navigate("/dashboard");
    }
  };

  // Final submit quiz with multi-stage progress loaders
  const handleFinalSubmit = async () => {
    setSubmissionPhase("submitting");
    try {
      await new Promise(r => setTimeout(r, 600));
      setSubmissionPhase("calculating");
      const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      if (res.ok) {
        await new Promise(r => setTimeout(r, 600));
        setSubmissionPhase("insights");
        await new Promise(r => setTimeout(r, 500));
        localStorage.removeItem(`quiz_resume_idx_${attemptId}`);
        localStorage.removeItem(`offline_queue_${attemptId}`);
        navigate(`/results/${attemptId}`);
      } else {
        setSubmissionPhase("");
        toast.error("Failed to submit quiz.");
      }
    } catch (err) {
      console.error(err);
      setSubmissionPhase("");
      toast.error("An error occurred during submission.");
    }
  };

  // Rate/Report
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
        toast.success(`Question rated as ${rating}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportIssue = async (reportType, message) => {
    try {
      const res = await fetch("/api/feedback/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.questionId,
          attemptId,
          reportType,
          message
        })
      });
      if (res.ok) {
        toast.success("Issue reported successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!attempt || !currentQuestion) {
    // Premium Skeleton Loading States
    return (
      <div className="w-full min-h-screen bg-[#0d0d19] text-white flex flex-col justify-start p-6 md:p-12 space-y-8 animate-pulse select-none">
        <div className="h-10 w-2/5 rounded bg-[#18182b]" />
        <div className="h-2 w-full rounded bg-[#18182b]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 rounded-2xl bg-[#18182b]" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-[#18182b]" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-24 rounded-2xl bg-[#18182b]" />
            <div className="h-44 rounded-2xl bg-[#18182b]" />
          </div>
        </div>
      </div>
    );
  }

  // Session Recovery Resume Dialogue Modal
  if (showResumeModal) {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
        <div className="bg-[#18182b] border border-[#915EFF]/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 text-center">
          <Sparkles className="w-10 h-10 text-yellow-500 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">Welcome Back!</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We found an unfinished session from your last run. Do you want to resume where you left off?
            </p>
          </div>
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => {
                localStorage.removeItem(`quiz_resume_idx_${attemptId}`);
                setShowResumeModal(false);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#2a2a4c] text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer bg-[#20203a]/40"
            >
              Start Over
            </button>
            <button
              onClick={() => {
                setShowResumeModal(false);
                if (resumeIndex !== null) {
                  handleJumpToQuestion(resumeIndex);
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#915EFF] hover:bg-[#a27eff] text-xs font-black text-white transition shadow-md shadow-[#915EFF]/20 cursor-pointer border-none"
            >
              Resume Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Submission overlay transition stages
  if (submissionPhase) {
    return (
      <div className="fixed inset-0 bg-[#0d0d19] z-50 flex flex-col items-center justify-center space-y-4 select-none">
        <div className="w-10 h-10 border-4 border-[#915EFF] border-t-transparent rounded-full animate-spin shadow-lg shadow-[#915EFF]/20" />
        <h3 className="text-sm font-bold text-gray-300 animate-pulse capitalize">
          {submissionPhase === "submitting" && "Submitting quiz response..."}
          {submissionPhase === "calculating" && "Calculating score and ranking..."}
          {submissionPhase === "insights" && "Analyzing performance and preparing insights..."}
        </h3>
      </div>
    );
  }

  // 6. Review Screen before final submission (FR-070)
  if (showReviewScreen) {
    return (
      <div className="w-full min-h-screen bg-[#0d0d19] text-white flex flex-col justify-center p-6 md:p-8 select-none">
        <ToastContainer />
        <div className="bg-[#18182b] border border-[#2a2a4c]/50 p-6 md:p-8 rounded-2xl max-w-3xl mx-auto w-full shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#2a2a40]/60 pb-4">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-lg font-black text-white">Review Your Answers</h2>
              <p className="text-xs text-gray-500">Check flagged or unanswered questions before submitting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-2 no-scrollbar">
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
                    className="w-full py-2 rounded-xl bg-[#20203a] hover:bg-[#2e2e4f] border border-[#2a2a4c] text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
                  >
                    Jump to Question
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 border-t border-[#2a2a40]/60 pt-6">
            <button
              onClick={() => setShowReviewScreen(false)}
              className="px-6 py-2.5 rounded-xl border border-[#2a2a4c] text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer bg-transparent"
            >
              Back to Quiz
            </button>
            <button
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-xs font-black text-white transition shadow-md shadow-green-600/10 cursor-pointer border-none"
            >
              Submit Quiz Paper
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. Quiz taking main page (Fullscreen focused workspace)
  return (
    <div className="w-full min-h-screen bg-[#0d0d19] text-white flex flex-col font-sans select-none overflow-x-hidden">
      <ToastContainer />
      
      {/* Top Assessment Header HUD */}
      <header className="h-16 px-4 md:px-6 border-b border-[#1c1c30] flex items-center justify-between bg-[#0f0f20]/95 backdrop-blur-md sticky top-0 z-40">
        {/* Left header group */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExit} 
            className="flex items-center gap-1 text-xs font-extrabold text-gray-400 hover:text-white transition bg-transparent border-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit</span>
          </button>
          <div className="w-[1px] h-4 bg-[#2a2a40]" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider text-[#915EFF] uppercase px-1.5 py-0.5 rounded bg-[#915EFF]/10 border border-[#915EFF]/20">
              {attempt.quizMode === "practice" ? "Practice" : "Assessment"}
            </span>
          </div>
        </div>

        {/* Center progress HUD */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 select-none">
          <span className="font-extrabold text-white">Q{attempt.currentQuestionIndex + 1} of {attempt.questionsCount}</span>
          <span className="text-gray-600">•</span>
          <span className="font-semibold text-gray-500">{attempt.questionsCount - (attempt.currentQuestionIndex + 1)} Remaining</span>
        </div>

        {/* Right HUD metrics: Streaks, XP, connection & auto-save alerts */}
        <div className="flex items-center gap-3.5">
          {/* Auto-save visual feedback */}
          {attempt.quizMode === "assessment" && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500 font-bold select-none uppercase">
              {saveStatus === "saving" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-green-500">Auto-saved</span>
                </>
              )}
              {saveStatus === "offline" && (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-orange-400">Offline Queue</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-red-400">Save Error</span>
                </>
              )}
            </div>
          )}

          {/* User network connection status */}
          <div className="flex items-center" title={isOnline ? "Online" : "Offline"}>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            )}
          </div>

          {/* Gamification Streak & XP chips */}
          {userProfile && (
            <div className="flex items-center gap-2 shrink-0 select-none">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-[10px] font-black uppercase">
                <span>🔥</span>
                <span>{userProfile.currentStreak}d</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-[10px] font-black uppercase">
                <span>⚡</span>
                <span>{userProfile.totalXp} XP</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Top Progress bar slider */}
      <div className="w-full bg-[#1c1c30] h-1 sticky top-16 z-40">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((attempt.currentQuestionIndex) / attempt.questionsCount) * 100}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[#915EFF] to-indigo-500 shadow-[0_0_8px_rgba(145,94,255,0.5)]"
        />
      </div>

      {/* Main Dual-Column workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-24">
        
        {/* Left Column Workspace (col-span-2) */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Question Metadata Header */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 select-none pb-2.5 border-b border-[#1c1c30]">
            <span className="font-extrabold text-[#915EFF] uppercase tracking-wider">Question {attempt.currentQuestionIndex + 1}</span>
            <span>•</span>
            <span className="capitalize px-2 py-0.5 rounded bg-[#20203a] border border-[#2a2a4c] text-[10px] font-bold text-gray-400">
              {attempt.difficulty}
            </span>
            <span>•</span>
            <span className="text-gray-400 font-semibold">Single Choice</span>
            <span>•</span>
            <span className="text-yellow-500 font-bold">+10 XP</span>
            <span>•</span>
            <span className="text-gray-500 font-medium">Est. 30s</span>
          </div>

          {/* Animated Question Card container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={attempt.currentQuestionIndex}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Solid Surface Hero Question Card */}
              <div className="bg-[#18182b] border border-[#2a2a4c]/50 rounded-2xl p-6 md:p-8 shadow-xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 select-none">Question Statement</p>
                <div className="text-base md:text-lg font-bold text-white tracking-tight leading-relaxed select-text">
                  {currentQuestion.questionText}
                </div>
              </div>

              {/* Options list cards */}
              <div className="flex flex-col gap-3.5">
                {currentQuestion.options.map((option, oIdx) => {
                  const isEliminated = eliminatedOptions.includes(option.id);
                  const isSel = selectedOptionId === option.id;
                  const isCorr = currentQuestion.correctOptionIds?.includes(option.id) || feedback === "Correct!";
                  const optionLabel = String.fromCharCode(65 + oIdx);

                  let optionStyle = "bg-[#18182b] border-[#2a2a4c]/60 text-gray-300 hover:border-[#915EFF]/40 hover:bg-[#202038]/30 hover:text-white";
                  
                  if (isEliminated) {
                    optionStyle = "bg-[#0d0d19]/40 border-[#1c1c30] text-gray-600 cursor-not-allowed line-through opacity-25";
                  } else if (isSubmitted) {
                    if (isSel) {
                      optionStyle = isCorr 
                        ? "bg-green-500/10 border-green-500 text-green-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]" 
                        : "bg-red-500/10 border-red-500 text-red-400 font-bold shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                    } else if (currentQuestion.correctOptionIds?.includes(option.id)) {
                      optionStyle = "bg-green-500/10 border-green-500/40 text-green-400";
                    } else {
                      optionStyle = "bg-[#18182b]/50 border-[#1c1c30] text-gray-600";
                    }
                  } else if (isSel) {
                    optionStyle = "bg-[#915EFF]/10 border-[#915EFF] text-white shadow-[0_0_15px_rgba(145,94,255,0.2)] font-semibold scale-[1.005]";
                  }

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => !isSubmitted && !isEliminated && handleSelectOption(option.id)}
                      whileHover={!isSubmitted && !isEliminated ? { y: -0.5 } : {}}
                      whileTap={!isSubmitted && !isEliminated ? { scale: 0.995 } : {}}
                      className={`w-full p-4.5 text-left rounded-xl border transition-all duration-150 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#915EFF]/50 ${optionStyle}`}
                      disabled={isSubmitted || isEliminated}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`flex w-6 h-6 rounded-lg border items-center justify-center text-xs shrink-0 font-extrabold transition ${
                          isSel ? "bg-[#915EFF] border-[#915EFF] text-white" : "border-gray-600 text-gray-400"
                        }`}>
                          {optionLabel}
                        </span>
                        <span className="leading-relaxed">{option.text}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanations & Ratings for Practice Mode */}
              {isSubmitted && attempt.quizMode === "practice" && (
                <div className="p-5 bg-[#18182b] border border-[#2a2a4c]/50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2a2a40]/60 pb-3">
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
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 select-none">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Explanation Details</span>
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium bg-[#0f0f20] p-3.5 rounded-xl border border-[#2a2a4c]/50 select-text">
                      {explanation}
                    </p>
                  </div>
                  
                  {/* Rating / Report issues */}
                  <div className="border-t border-[#2a2a40]/60 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-semibold">Rate Question:</span>
                      <button onClick={() => handleRateQuestion("helpful")} className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 font-semibold cursor-pointer border-none text-[10px] uppercase">👍 Helpful</button>
                      <button onClick={() => handleRateQuestion("confusing")} className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 hover:bg-yellow-500/20 font-semibold cursor-pointer border-none text-[10px] uppercase">😕 Confused</button>
                      <button onClick={() => handleRateQuestion("incorrect")} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 font-semibold cursor-pointer border-none text-[10px] uppercase">👎 Bad</button>
                    </div>

                    <div className="flex items-center gap-2 bg-[#0f0f20] border border-[#2a2a4c]/50 p-1 rounded-xl shrink-0 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Report typo..."
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
          </AnimatePresence>
        </section>

        {/* Right Column Sidebar (col-span-1) */}
        <aside className="space-y-6 lg:sticky lg:top-24 select-none">
          {/* Timer Card */}
          <div className="bg-[#18182b] border border-[#2a2a4c]/50 rounded-2xl p-5 text-center space-y-2 shadow-lg">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Time Remaining</span>
            <div className="flex items-center justify-center gap-2">
              <Timer className={`w-4 h-4 ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-[#915EFF]"}`} />
              <span className={`text-xl font-mono font-black ${
                timeLeft <= 10 
                  ? "text-red-500 animate-pulse" 
                  : timeLeft <= 60 
                  ? "text-orange-400" 
                  : "text-white"
              }`}>
                {attempt.quizMode === "practice" 
                  ? `${timeLeft}s` 
                  : `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}
              </span>
            </div>
          </div>

          {/* Question Palette Card */}
          <div className="bg-[#18182b] border border-[#2a2a4c]/50 rounded-2xl p-5 space-y-4 shadow-lg">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Question Map</span>
            
            <div className="grid grid-cols-5 gap-2">
              {[...Array(attempt.questionsCount)].map((_, index) => {
                const isCurrent = index === attempt.currentQuestionIndex;
                const isFlagged = flaggedQuestions.includes(index);
                const isAnswered = answers[index] !== undefined || (index === attempt.currentQuestionIndex && selectedOptionId);

                let btnStyle = "bg-[#20203a] border-[#2a2a4c]/80 text-gray-400 hover:text-white";
                let labelSymbol = "";
                
                if (isCurrent) {
                  btnStyle = "bg-[#915EFF] border-[#915EFF] text-white shadow-md shadow-[#915EFF]/20 scale-105 z-10";
                  labelSymbol = "●";
                } else if (isFlagged) {
                  btnStyle = "bg-yellow-500/10 border-yellow-500 text-yellow-400";
                  labelSymbol = "⚑";
                } else if (isAnswered) {
                  btnStyle = "bg-green-500/10 border-green-500/30 text-green-400";
                  labelSymbol = "✓";
                } else {
                  labelSymbol = "○";
                }

                return (
                  <button
                    key={index}
                    onClick={() => (attempt.quizMode === "assessment" || index <= attempt.currentQuestionIndex) && handleJumpToQuestion(index)}
                    className={`h-10 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#915EFF] ${btnStyle}`}
                    disabled={attempt.quizMode === "practice" && index > attempt.currentQuestionIndex}
                    title={`Question ${index + 1}`}
                  >
                    <span>{index + 1}</span>
                    <span className="text-[7px] leading-none">{labelSymbol}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Legend guide */}
            <div className="border-t border-[#2a2a40]/60 pt-3 grid grid-cols-2 gap-y-2 gap-x-2 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="text-green-400">✓</span> <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400">⚑</span> <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#915EFF]">●</span> <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600">○</span> <span>Unanswered</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Sticky Bottom Action Controls Nav */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-[#0f0f20]/95 backdrop-blur-md border-t border-[#1c1c30] z-40 flex items-center shadow-[0_-8px_24px_rgba(0,0,0,0.5)] select-none">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <button
            onClick={handlePrevQuestion}
            className={`${styles.btnSecondary} text-xs py-2.5 flex items-center gap-1`}
            disabled={attempt.currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFlagQuestion}
              className={`text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer ${
                flaggedQuestions.includes(attempt.currentQuestionIndex)
                  ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 font-extrabold"
                  : "bg-[#2e2e4d]/30 border-[#3e3e5f] text-gray-400 hover:text-white"
              }`}
            >
              ⚑ {flaggedQuestions.includes(attempt.currentQuestionIndex) ? "Unflag" : "Flag"}
            </button>

            {attempt.quizMode === "practice" && !isSubmitted && (
              <>
                <button
                  onClick={handleHint}
                  className="text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={hintUsed}
                >
                  Hint
                </button>
                <button
                  onClick={handleFiftyFifty}
                  className="text-xs px-4 py-2.5 rounded-xl border font-bold transition duration-200 cursor-pointer bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={fiftyFiftyUsed}
                >
                  50/50
                </button>
              </>
            )}

            {attempt.quizMode === "practice" ? (
              !isSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  className={`${styles.btnPrimary} text-xs py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!selectedOptionId}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className={`${styles.btnPrimary} text-xs py-2.5 px-6 bg-blue-600 hover:bg-blue-700 flex items-center gap-1`}
                >
                  <span>{attempt.currentQuestionIndex + 1 < attempt.questionsCount ? "Next Question" : "Review Paper"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
            ) : (
              attempt.currentQuestionIndex + 1 < attempt.questionsCount ? (
                <button
                  onClick={handleNextQuestion}
                  className={`${styles.btnPrimary} text-xs py-2.5 px-6 flex items-center gap-1`}
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowReviewScreen(true)}
                  className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-xs font-black text-white transition shadow-md shadow-green-600/10 cursor-pointer border-none"
                >
                  Review Paper
                </button>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuizTakingPage;