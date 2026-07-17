import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    return <div className="text-center mt-10 text-white">Loading results...</div>;
  }

  if (!results) {
    return <div className="text-center mt-10 text-white">Error: Results not found.</div>;
  }

  // Segment answers
  const correctAnswers = results.answers.filter((a) => a.isCorrect);
  const incorrectAnswers = results.answers.filter((a) => !a.isCorrect && !a.timedOut);
  const timedOutAnswers = results.answers.filter((a) => a.timedOut);

  return (
    <div className="p-8 text-white max-w-5xl mx-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <ToastContainer />
      <h2 className="text-3xl font-bold mb-4 text-center text-[#915EFF]">Quiz Completed!</h2>
      <p className="text-xl mb-2 text-center">Score: {results.totalScore} / {results.maxScore} ({results.percentage}%)</p>
      <p className="text-xl mb-2 text-center">XP Earned: {results.xpEarned}</p>
      <p className="text-xl mb-2 text-center">Quiz Mode: {results.quizMode === "practice" ? "Practice" : "Assessment"}</p>
      <p className="text-xl mb-6 text-center">Time Taken: {results.timeTakenSeconds} seconds</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Performance Breakdown */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-2">Performance Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Correct Answers</span>
              <span className="text-green-400 font-bold">{correctAnswers.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Incorrect Answers</span>
              <span className="text-red-400 font-bold">{incorrectAnswers.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Timed Out/Unanswered</span>
              <span className="text-yellow-400 font-bold">{timedOutAnswers.length}</span>
            </div>
          </div>
        </div>

        {/* Share & Certificate */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-3">Share & Certificates</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                className="bg-purple-700 hover:bg-purple-900 text-white px-4 py-2 rounded text-sm transition"
                onClick={handleShareScore}
              >
                Share Score
              </button>
              {results.percentage === 100 && results.maxScore >= 5 && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition"
                  onClick={handleGetCertificate}
                >
                  Generate Certificate
                </button>
              )}
            </div>

            {certCode && (
              <div className="p-3 bg-gray-900 rounded border border-purple-500 text-xs">
                <p className="font-semibold text-purple-400 mb-1">Your Certificate ID:</p>
                <code className="block bg-black p-1 rounded text-green-400 mb-2">{certCode}</code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/verify-certificate?code=${certCode}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Certificate link copied!");
                  }}
                  className="text-purple-400 underline hover:text-white"
                >
                  Copy Verification Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Leaderboard for this Quiz Setup */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 md:col-span-2">
          <h3 className="text-xl font-semibold mb-2">Topic Leaderboard ({results.difficulty})</h3>
          {leaderboard.length === 0 ? (
            <p className="text-gray-400 text-sm">No leaderboard entries found for this topic yet.</p>
          ) : (
            <div className="divide-y divide-gray-700 max-h-60 overflow-y-auto">
              {leaderboard.map((entry) => (
                <div
                  key={entry.attemptId}
                  className={`flex justify-between py-2.5 px-2 text-sm ${
                    entry.attemptId === attemptId ? "bg-purple-900/40 rounded border border-purple-500" : ""
                  }`}
                >
                  <span>
                    {entry.rank}. {entry.displayName} {entry.attemptId === attemptId && "(You)"}
                  </span>
                  <span>
                    {entry.score} pts ({entry.percentage}%) in {entry.timeTakenSeconds}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Incorrect/Wrong Answers */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 col-span-1 md:col-span-2">
          <h3 className="text-xl font-semibold mb-3">Review Explanations</h3>
          <div className="space-y-4">
            {results.answers.map((a, idx) => (
              <div key={idx} className="p-3 bg-gray-900 rounded border border-gray-700 text-sm">
                <p className="font-semibold mb-1">
                  Question {idx + 1}: {a.questionText}
                </p>
                <div className="text-xs space-y-1 mb-2">
                  <p>
                    Your Selection:{" "}
                    <span className={a.isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {a.selectedOptionId ? a.options.find((o) => o.id === a.selectedOptionId)?.text : "None"}
                    </span>
                  </p>
                  {!a.isCorrect && (
                    <p>
                      Correct Selection:{" "}
                      <span className="text-green-400 font-bold">
                        {a.options.find((o) => a.correctOptionIds.includes(o.id))?.text || "None"}
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400 italic">Explanation: {a.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-8">
        <button
          className="bg-purple-700 hover:bg-purple-900 text-white px-6 py-2 rounded font-bold transition"
          onClick={() => navigate("/")}
        >
          Take Another Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizCompletionPage;