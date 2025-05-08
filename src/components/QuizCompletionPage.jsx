import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const QuizCompletionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from location state
  const {
    quizData,
    answers,
    points,
    xp,
    level,
    dailyStreak,
    badges,
    timeTakenPerQuestion,
    category,
    topic,
    numQuestions,
    difficulty,
  } = location.state || {};

  // State for leaderboard
  const [leaderboardType, setLeaderboardType] = useState("global");
  const [userLeaderboard, setUserLeaderboard] = useState(mockLeaderboards.global);

  // If data is missing, show an error message
  if (!quizData || !answers) {
    return <div className="text-center mt-10 text-white">Error: Quiz data not found.</div>;
  }

  // Calculate performance analysis
  const calculatePerformance = () => {
    const correctCount = Object.values(answers).filter(
      (ans, idx) => ans === quizData[idx].answer
    ).length;
    const percentage = (correctCount / quizData.length) * 100;

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

    return { correctCount, percentage, subTopicBreakdown };
  };

  const { correctCount, percentage, subTopicBreakdown } = calculatePerformance();

  // Share score on social media
  const handleShareScore = () => {
    const tweetText = `I scored ${points} points on a ${category} - ${topic} quiz! Can you beat my score? 🎉 #QuizChallenge`;
    const tweetUrl = encodeURIComponent("https://QuizArena.com");
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

  // Restart quiz
  const handleRestart = () => {
    navigate("/quizpage", {
      state: {
        category,
        topic,
        numQuestions,
        difficulty,
        xp,
        dailyStreak,
        badges,
      },
    });
  };

  return (
    <div className="p-8 text-white max-w-5xl mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <ToastContainer />
      <h2 className="text-3xl font-bold mb-4 text-center">Quiz Completed!</h2>
      <p className="text-xl mb-2 text-center">Total Points: {points}</p>
      <p className="text-xl mb-2 text-center">XP Earned: {xp}</p>
      <p className="text-xl mb-2 text-center">Level: {level}</p>
      <p className="text-xl mb-2 text-center">Daily Streak: {dailyStreak} days</p>
      <p className="text-xl mb-4 text-center">
        Score: {correctCount} / {quizData.length} ({percentage.toFixed(2)}%)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {badges.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Achievements Unlocked</h3>
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

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Performance Breakdown</h3>
          <div>
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

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Time-Taken Analytics</h3>
          <div>
            {quizData.map((_, idx) => (
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

        <div className="bg-gray-800 p-4 rounded-lg col-span-1 md:col-span-2">
          <h3 className="text-xl font-semibold mb-2">Review Wrong Answers</h3>
          <div>
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

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
          <div className="flex space-x-2 mb-2">
            {["global", "friends", "classroom"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setLeaderboardType(type);
                  setUserLeaderboard([
                    ...mockLeaderboards[type],
                    { name: "You", points },
                  ].sort((a, b) => b.points - a.points));
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
          <div>
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

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Share Your Achievement</h3>
          <div className="flex space-x-4">
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
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-6">
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
};

export default QuizCompletionPage;