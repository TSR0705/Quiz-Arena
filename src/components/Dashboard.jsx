import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { motion } from "framer-motion";

// Sample quiz history data (simulated from localStorage)
const initialQuizHistory = [
  { id: "quiz-1", title: "General Knowledge Trivia", score: 85, dateCompleted: "2025-05-06", status: "Passed" },
  { id: "quiz-2", title: "Science Challenge", score: 60, dateCompleted: "2025-05-05", status: "Failed" },
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [quizHistory, setQuizHistory] = useState(initialQuizHistory);

  // Check if user is authenticated on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.isAuthenticated) {
      setUser(storedUser);
      // Load quiz history from localStorage (simulated)
      const storedQuizHistory = JSON.parse(localStorage.getItem("quizHistory")) || initialQuizHistory;
      setQuizHistory(storedQuizHistory);
    }
  }, []);

  // Calculate stats for progress overview
  const totalQuizzes = quizHistory.length;
  const averageScore = totalQuizzes > 0 ? (quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuizzes).toFixed(1) : 0;
  const highestScore = totalQuizzes > 0 ? Math.max(...quizHistory.map(quiz => quiz.score)) : 0;

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("quizHistory");
    window.location.href = "/"; // Redirect to home page after logout
  };

  // If user is not authenticated, show a message with a link to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <p className="text-gray-400 mb-6">
          You need to be logged in to access the dashboard.{" "}
          <Link to="/auth" className="text-blue-400 hover:underline">
            Log in or create an account
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header Section */}
      <header className="w-full py-6 bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaUserCircle size={40} />
            <div>
              <h1 className="text-2xl font-bold">{user.username}'s Dashboard</h1>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            aria-label="Logout"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Progress Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div
              className="p-6 bg-gray-800 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-medium text-gray-300">Total Quizzes Taken</h3>
              <p className="text-3xl font-bold mt-2">{totalQuizzes}</p>
            </motion.div>
            <motion.div
              className="p-6 bg-gray-800 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-medium text-gray-300">Average Score</h3>
              <p className="text-3xl font-bold mt-2">{averageScore}%</p>
            </motion.div>
            <motion.div
              className="p-6 bg-gray-800 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-medium text-gray-300">Highest Score</h3>
              <p className="text-3xl font-bold mt-2">{highestScore}%</p>
            </motion.div>
          </div>
        </section>

        {/* Quiz Completion History */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Quiz Completion History</h2>
          {quizHistory.length === 0 ? (
            <p className="text-gray-400">No quizzes completed yet. <Link to="/" className="text-blue-400 hover:underline">Take a quiz now!</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-4">Quiz Title</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Date Completed</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quizHistory.map((quiz) => (
                    <tr key={quiz.id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="p-4">{quiz.title}</td>
                      <td className="p-4">{quiz.score}%</td>
                      <td className="p-4">{quiz.dateCompleted}</td>
                      <td className={`p-4 ${quiz.status === "Passed" ? "text-green-400" : "text-red-400"}`}>
                        {quiz.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;