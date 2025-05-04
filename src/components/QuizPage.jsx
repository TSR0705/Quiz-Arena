import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Mock function to generate sample questions based on topic and difficulty
const generateQuizData = (topic, numQuestions, difficulty) => {
  const subTopics = ["Scheduling", "Memory Management", "File Systems"];
  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
    const subTopic = subTopics[i % subTopics.length];
    questions.push({
      question: `Sample question ${i + 1} for ${topic} (${difficulty})`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
      hint: `Hint: This concept is related to ${subTopic}`,
      explanation: `Explanation: The correct answer is Option A because it aligns with ${subTopic} principles. For example, in scheduling, Option A represents the most efficient approach.`,
      subTopic,
    });
  }
  return questions;
};

// Mock leaderboard data
const mockLeaderboards = {
  global: [
    { name: "User1", points: 150 },
    { name: "User2", points: 120 },
    { name: "User3", points: 100 },
  ],
  friends: [
    { name: "Friend1", points: 130 },
    { name: "Friend2", points: 110 },
  ],
  classroom: [
    { name: "Student1", points: 140 },
    { name: "Student2", points: 90 },
  ],
};

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract selected options from location state with defaults
  const { category, topic, numQuestions, difficulty } = location.state || {
    category: "General",
    topic: "General",
    numQuestions: 5,
    difficulty: "easy",
  };

  // State management
  const [quizData, setQuizData] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [answers, setAnswers] = useState({}); // Track answers
  const [points, setPoints] = useState(0); // Points instead of score
  const [xp, setXP] = useState(0); // XP for leveling
  const [level, setLevel] = useState(1); // User level
  const [streak, setStreak] = useState(0); // Streak counter
  const [dailyStreak, setDailyStreak] = useState(0); // Daily quiz streak
  const [badges, setBadges] = useState([]); // Achievements
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false); // Review screen
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [timeTaken, setTimeTaken] = useState(0); // Track time per question
  const [timeTakenPerQuestion, setTimeTakenPerQuestion] = useState({}); // Track time for all questions
  const [hintUsed, setHintUsed] = useState(false); // Track if hint is used
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false); // Track 50/50 lifeline
  const [flaggedQuestions, setFlaggedQuestions] = useState([]); // Flagged questions
  const [questionRatings, setQuestionRatings] = useState({}); // Question ratings
  const [comments, setComments] = useState({}); // Mock comments per question
  const [reportedIssues, setReportedIssues] = useState([]); // Reported issues
  const [leaderboardType, setLeaderboardType] = useState("global"); // Leaderboard type
  const [userLeaderboard, setUserLeaderboard] = useState(mockLeaderboards.global); // Leaderboard
  const [quizCount, setQuizCount] = useState(0); // Track number of quizzes completed

  // Generate quiz data on mount or when selections change
  useEffect(() => {
    const questions = generateQuizData(topic, numQuestions, difficulty);
    setQuizData(questions);
  }, [topic, numQuestions, difficulty]);

  // Timer logic: countdown and auto-submit when time runs out
  useEffect(() => {
    if (!isSubmitted && timeLeft > 0 && !showReviewScreen) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setTimeTaken(timeTaken + 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      handleSubmitAnswer();
    }
  }, [timeLeft, isSubmitted, timeTaken, showReviewScreen]);

  // Reset timer and states when moving to a new question
  useEffect(() => {
    setTimeLeft(30);
    setTimeTaken(0);
    setHintUsed(false);
    setFiftyFiftyUsed(false);
    setSelectedOption(answers[currentQIndex] || "");
    setIsSubmitted(!!answers[currentQIndex]);
    setFeedback("");
  }, [currentQIndex, answers]);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key >= "1" && e.key <= "4" && !isSubmitted) {
        const index = parseInt(e.key) - 1;
        if (index < quizData[currentQIndex].options.length) {
          setSelectedOption(quizData[currentQIndex].options[index]);
        }
      } else if (e.key === "Enter" && selectedOption && !isSubmitted) {
        handleSubmitAnswer();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedOption, isSubmitted, currentQIndex, quizData]);

  // Handle answer submission
  const handleSubmitAnswer = () => {
    const correct = quizData[currentQIndex].answer;
    let newPoints = points;
    let newXP = xp;

    // Update answers and time taken
    setAnswers({ ...answers, [currentQIndex]: selectedOption });
    setTimeTakenPerQuestion({ ...timeTakenPerQuestion, [currentQIndex]: timeTaken });

    // Calculate points and XP
    if (selectedOption === correct) {
      newPoints += 1; // Base point for correct answer
      newXP += 10; // 10 XP per correct answer
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 3) newPoints += 1; // Bonus for streak
      if (timeTaken < 10 && !badges.includes("Speedy Thinker")) {
        setBadges([...badges, "Speedy Thinker"]);
        newPoints += 0.5; // Bonus for speed
      }
      setFeedback("Correct!");
      toast.success("Great job!", { position: "top-right", autoClose: 2000 });
    } else {
      setStreak(0); // Reset streak on wrong answer
      setFeedback(`Wrong! Correct answer: ${correct}`);
      toast.error("Try again next time!", { position: "top-right", autoClose: 2000 });
    }

    // Apply penalties
    if (hintUsed) newPoints -= 0.5;
    if (fiftyFiftyUsed) newPoints -= 0.5;

    setPoints(Math.max(0, newPoints));
    setXP(newXP);
    setLevel(Math.floor(newXP / 50) + 1); // Level up every 50 XP
    setIsSubmitted(true);
  };

  // Handle hint request
  const handleHint = () => {
    if (!hintUsed) {
      toast.info(quizData[currentQIndex].hint, { position: "top-center", autoClose: 5000 });
      setHintUsed(true);
    }
  };

  // Handle 50/50 lifeline
  const handleFiftyFifty = () => {
    if (!fiftyFiftyUsed) {
      const correct = quizData[currentQIndex].answer;
      const incorrectOptions = quizData[currentQIndex].options
        .map((opt, idx) => ({ opt, idx }))
        .filter(({ opt }) => opt !== correct);
      const toRemove = incorrectOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map(({ idx }) => idx);
      const newOptions = quizData[currentQIndex].options.map((opt, idx) =>
        toRemove.includes(idx) ? null : opt
      );
      setQuizData(
        quizData.map((q, idx) =>
          idx === currentQIndex ? { ...q, options: newOptions } : q
        )
      );
      setFiftyFiftyUsed(true);
      toast.info("Two incorrect options removed!", { position: "top-center", autoClose: 2000 });
    }
  };

  // Toggle flag for review
  const toggleFlagQuestion = () => {
    if (flaggedQuestions.includes(currentQIndex)) {
      setFlaggedQuestions(flaggedQuestions.filter((idx) => idx !== currentQIndex));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQIndex]);
    }
  };

  // Move to previous question
  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  // Move to next question or go to review screen
  const handleNextQuestion = () => {
    setIsSubmitted(false);
    setFeedback("");
    if (currentQIndex + 1 < quizData.length) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setShowReviewScreen(true);
    }
  };

  // Jump to a specific question
  const handleJumpToQuestion = (index) => {
    setCurrentQIndex(index);
    setShowReviewScreen(false);
  };

  // Final submission
  const handleFinalSubmit = () => {
    setShowReviewScreen(false);
    setQuizCompleted(true);
    setQuizCount(quizCount + 1);
    setDailyStreak(dailyStreak + 1); // Increment daily streak (mock implementation)

    // Award badges for milestones
    if (quizCount + 1 >= 10 && !badges.includes("Quiz Master")) {
      setBadges([...badges, "Quiz Master"]);
    }

    // Update leaderboard
    const updatedLeaderboard = [
      ...mockLeaderboards[leaderboardType],
      { name: "You", points },
    ].sort((a, b) => b.points - a.points);
    setUserLeaderboard(updatedLeaderboard);
  };

  // Restart quiz
  const handleRestart = () => {
    setCurrentQIndex(0);
    setPoints(0);
    setXP(xp); // Retain XP across quizzes
    setStreak(0);
    setAnswers({});
    setFlaggedQuestions([]);
    setTimeTakenPerQuestion({});
    setSelectedOption("");
    setIsSubmitted(false);
    setQuizCompleted(false);
    setShowReviewScreen(false);
    setTimeLeft(30);
    setTimeTaken(0);
    setQuizData(generateQuizData(topic, numQuestions, difficulty));
    setUserLeaderboard(mockLeaderboards[leaderboardType]); // Reset leaderboard
  };

  // Share score on social media
  const handleShareScore = () => {
    const tweetText = `I scored ${points} points on a ${category} - ${topic} quiz! Can you beat my score? 🎉 #QuizChallenge`;
    const tweetUrl = encodeURIComponent("https://your-quiz-app.com");
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${tweetUrl}`,
      "_blank"
    );
  };

  // Generate shareable certificate link
  const generateCertificateLink = () => {
    return `https://your-quiz-app.com/certificate?user=You&points=${points}&topic=${encodeURIComponent(
      topic
    )}`;
  };

  // Rate question
  const handleRateQuestion = (rating) => {
    setQuestionRatings({ ...questionRatings, [currentQIndex]: rating });
    toast.success(`Question rated as ${rating}!`, { position: "top-right", autoClose: 2000 });
  };

  // Add comment
  const handleAddComment = (comment) => {
    const questionComments = comments[currentQIndex] || [];
    setComments({
      ...comments,
      [currentQIndex]: [...questionComments, { user: "You", text: comment }],
    });
  };

  // Report issue
  const handleReportIssue = (issue) => {
    setReportedIssues([...reportedIssues, { question: currentQIndex, issue }]);
    toast.success("Issue reported successfully!", { position: "top-right", autoClose: 2000 });
  };

  // Calculate performance analysis
  const calculatePerformance = () => {
    const correctCount = Object.values(answers).filter(
      (ans, idx) => ans === quizData[idx].answer
    ).length;
    const percentage = (correctCount / quizData.length) * 100;

    // Topic-wise breakdown
    const subTopicBreakdown = {};
    quizData.forEach((q, idx) => {
      const subTopic = q.subTopic;
      if (!subTopicBreakdown[subTopic]) {
        subTopicBreakdown[subTopic] = { correct: 0, total: 0 };
      }
      subTopicBreakdown[subTopic].total += 1;
      if (answers[idx] === q.answer) {
        subTopicBreakdown[subTopic].correct += 1;
      }
    });

    // Strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    Object.entries(subTopicBreakdown).forEach(([subTopic, { correct, total }]) => {
      const subTopicPercentage = (correct / total) * 100;
      if (subTopicPercentage >= 75) strengths.push(subTopic);
      if (subTopicPercentage <= 25) weaknesses.push(subTopic);
    });

    return { correctCount, percentage, subTopicBreakdown, strengths, weaknesses };
  };

  // Loading state
  if (quizData.length === 0) {
    return <div className="text-center mt-10 text-white">Loading quiz...</div>;
  }

  // Review screen before final submission
  if (showReviewScreen) {
    return (
      <div className="p-8 text-white max-w-3xl mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Review Your Answers</h1>
        <p className="mb-4">Review flagged or unanswered questions before submitting.</p>
        <div className="space-y-4">
          {quizData.map((q, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                flaggedQuestions.includes(idx) ? "bg-yellow-900" : "bg-gray-800"
              } ${!answers[idx] ? "border-2 border-red-500" : ""}`}
            >
              <p className="font-semibold">
                Question {idx + 1}: {q.question}
              </p>
              <p className="mt-2">
                Your Answer: {answers[idx] || "Not answered"}
                {flaggedQuestions.includes(idx) && (
                  <span className="ml-2 text-yellow-400"> (Flagged)</span>
                )}
              </p>
              <button
                onClick={() => handleJumpToQuestion(idx)}
                className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Review Question
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={handleFinalSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz completion screen
  if (quizCompleted) {
    const { correctCount, percentage, subTopicBreakdown, strengths, weaknesses } =
      calculatePerformance();

    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white p-10 bg-gradient-to-b from-gray-900 to-black">
        <h2 className="text-3xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-xl mb-2">Total Points: {points}</p>
        <p className="text-xl mb-2">XP Earned: {xp}</p>
        <p className="text-xl mb-2">Level: {level}</p>
        <p className="text-xl mb-2">Daily Streak: {dailyStreak} days</p>
        <p className="text-xl mb-4">
          Score: {correctCount} / {quizData.length} ({percentage.toFixed(2)}%)
        </p>

        {/* Achievements */}
        {badges.length > 0 && (
          <div className="mb-4">
            <p className="text-lg font-semibold">Achievements Unlocked:</p>
            {badges.map((badge, index) => (
              <span
                key={index}
                className="inline-block bg-yellow-500 text-black px-2 py-1 rounded mr-2"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Topic-wise Breakdown */}
        <div className="w-full max-w-md mb-4">
          <h3 className="text-xl font-semibold mb-2">Performance Breakdown</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            {Object.entries(subTopicBreakdown).map(([subTopic, { correct, total }]) => (
              <div key={subTopic} className="flex justify-between py-2">
                <span>{subTopic}</span>
                <span>
                  {correct}/{total} ({((correct / total) * 100).toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="w-full max-w-md mb-4">
          <h3 className="text-xl font-semibold mb-2">Analysis</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            {strengths.length > 0 && (
              <p>
                <strong>Strengths:</strong> {strengths.join(", ")}
              </p>
            )}
            {weaknesses.length > 0 && (
              <p>
                <strong>Areas to Improve:</strong> {weaknesses.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Time-Taken Analytics */}
        <div className="w-full max-w-md mb-4">
          <h3 className="text-xl font-semibold mb-2">Time-Taken Analytics</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            {quizData.map((q, idx) => (
              <div key={idx} className="flex justify-between py-2">
                <span>Question {idx + 1}</span>
                <span
                  className={
                    timeTakenPerQuestion[idx] > 20 ? "text-red-500" : "text-white"
                  }
                >
                  {timeTakenPerQuestion[idx] || 0} seconds
                  {timeTakenPerQuestion[idx] > 20 && " (Slow)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wrong Answers Explanation */}
        <div className="w-full max-w-md mb-4">
          <h3 className="text-xl font-semibold mb-2">Review Wrong Answers</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            {quizData.map(
              (q, idx) =>
                answers[idx] &&
                answers[idx] !== q.answer && (
                  <div key={idx} className="py-2 border-b border-gray-600">
                    <p className="font-semibold">
                      Question {idx + 1}: {q.question}
                    </p>
                    <p>Your Answer: {answers[idx]}</p>
                    <p>Correct Answer: {q.answer}</p>
                    <p>{q.explanation}</p>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-md mb-4">
          <h3 className="text-xl font-semibold mb-2">Leaderboar</h3>
          <div className="flex space-x-2 mb-2">
            {["global", "friends", "classroom"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setLeaderboardType(type);
                  setUserLeaderboard(mockLeaderboards[type]);
                }}
                className={`px-3 py-1 rounded ${
                  leaderboardType === type
                    ? "bg-purple-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            {userLeaderboard.map((entry, index) => (
              <div
                key={index}
                className={`flex justify-between py-2 ${
                  entry.name === "You" ? "bg-purple-600 rounded" : ""
                }`}
              >
                <span>{index + 1}. {entry.name}</span>
                <span>{entry.points} points</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sharing Options */}
        <div className="flex space-x-4 mb-4">
          <button
            className="bg-purple-700 hover:bg-purple-900 text-white px-4 py-2 rounded"
            onClick={handleShareScore}
          >
            Share Your Score
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => {
              navigator.clipboard.writeText(generateCertificateLink());
              toast.success("Certificate link copied to clipboard!", {
                position: "top-right",
                autoClose: 2000,
              });
            }}
          >
            Get Certificate
          </button>
        </div>

        <div className="flex space-x-4">
          <button
            className="bg-purple-700 hover:bg-purple-900 text-white px-4 py-2 rounded"
            onClick={handleRestart}
          >
            Restart Quiz
          </button>
          <button
            className="underline text-purple-400"
            onClick={() => navigate("/")}
          >
            Back to Selection
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData[currentQIndex];

  // Quiz in progress
  return (
    <div className="p-8 text-white max-w-3xl mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">
        Quiz: {category} - {topic} ({difficulty})
      </h1>
      {/* Progress Navigation */}
      <div className="flex justify-center mb-4 space-x-2">
        {quizData.map((_, index) => (
          <button
            key={index}
            onClick={() => handleJumpToQuestion(index)}
            className={`w-8 h-8 rounded-full ${
              index === currentQIndex
                ? "bg-purple-500 text-white"
                : answers[index]
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-white"
            } ${flaggedQuestions.includes(index) ? "border-2 border-yellow-400" : ""}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 h-2 mb-4 rounded">
        <div
          className="bg-purple-500 h-2 rounded"
          style={{ width: `${((currentQIndex + 1) / quizData.length) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Question {currentQIndex + 1} of {quizData.length}
        </h2>
        <p className="text-lg">Points: {points} | Level: {level}</p>
      </div>
      <motion.div
        key={currentQIndex}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-lg mb-4">{currentQuestion.question}</p>
        <div className="flex justify-between mb-4">
          <p className={`text-lg ${timeLeft <= 10 ? "text-red-500" : "text-white"}`}>
            Time left: {timeLeft} seconds
          </p>
          {streak > 0 && (
            <p className="text-lg text-yellow-400">{streak} correct in a row!</p>
          )}
        </div>
        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !isSubmitted && option && setSelectedOption(option)}
              className={`w-full p-3 text-left rounded-lg border border-gray-600 transition-colors duration-200 ${
                !option
                  ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                  : isSubmitted
                  ? option === currentQuestion.answer
                    ? "bg-green-600 text-white border-green-500"
                    : selectedOption === option
                    ? "bg-red-600 text-white border-red-500"
                    : "bg-gray-800 text-white border-gray-600"
                  : selectedOption === option
                  ? "bg-purple-600 text-white border-purple-500"
                  : "bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
              }`}
              disabled={isSubmitted || !option}
            >
              {option || "Removed"}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevQuestion}
            className={`px-4 py-2 rounded-lg text-white ${
              currentQIndex === 0
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={currentQIndex === 0}
          >
            Previous
          </button>
          <div className="flex space-x-4">
            <button
              onClick={toggleFlagQuestion}
              className={`px-4 py-2 rounded-lg text-white ${
                flaggedQuestions.includes(currentQIndex)
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              {flaggedQuestions.includes(currentQIndex) ? "Unflag" : "Flag for Review"}
            </button>
            {!isSubmitted && (
              <>
                <button
                  onClick={handleHint}
                  className={`px-4 py-2 rounded-lg text-white ${
                    hintUsed
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                  disabled={hintUsed}
                >
                  Hint (-0.5 points)
                </button>
                <button
                  onClick={handleFiftyFifty}
                  className={`px-4 py-2 rounded-lg text-white ${
                    fiftyFiftyUsed
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                  disabled={fiftyFiftyUsed}
                >
                  50/50 (-0.5 points)
                </button>
              </>
            )}
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedOption
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
                disabled={!selectedOption}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {currentQIndex + 1 < quizData.length ? "Next Question" : "Review Answers"}
              </button>
            )}
          </div>
        </div>
        {isSubmitted && (
          <div className="mt-4">
            <p className="text-lg font-medium text-center">{feedback}</p>
            <p className="text-md mt-2">{currentQuestion.explanation}</p>

            {/* Question Feedback & QA */}
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Question Feedback</h3>
              <div className="flex space-x-4 mb-2">
                <button
                  onClick={() => handleRateQuestion("Thumbs Up")}
                  className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
                >
                  👍 Thumbs Up
                </button>
                <button
                  onClick={() => handleRateQuestion("Thumbs Down")}
                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                >
                  👎 Thumbs Down
                </button>
              </div>
              <div className="mb-2">
                <h4 className="font-semibold">Discussion</h4>
                {(comments[currentQIndex] || []).map((comment, idx) => (
                  <p key={idx} className="text-sm">
                    <strong>{comment.user}:</strong> {comment.text}
                  </p>
                ))}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full p-2 bg-gray-700 rounded text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && e.target.value) {
                        handleAddComment(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Report an Issue</h4>
                <input
                  type="text"
                  placeholder="Describe the issue..."
                  className="w-full p-2 bg-gray-700 rounded text-white"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && e.target.value) {
                      handleReportIssue(e.target.value);
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

export default QuizPage;