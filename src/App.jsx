import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import About from "./components/About";
import Feedbacks from "./components/Feedbacks";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import Auth from "./components/Auth";
import QuizSelectionPage from "./components/QuizSelectionPage";
import QuizPage from "./components/QuizPage";
import QuizCompletionPage from "./components/QuizCompletionPage";
import VerifyCertificate from "./components/VerifyCertificate";
import StarsCanvas from './components/canvas/Stars';
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import LeaderboardPage from "./components/LeaderboardPage";
import CertificatesPage from "./components/CertificatesPage";
import ProfilePage from "./components/ProfilePage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// The Landing Page layout enclosing marketing & selection components (marketing only)
const Home = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-primary text-white">
        <p className="text-xl">Loading QuizArena...</p>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative z-0 bg-primary">
      <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
        <Navbar />
        <Hero />
      </div>
      <About />
      <Feedbacks />
      <div className="relative z-0">
        <Auth />
        <StarsCanvas />
        <Footer />
      </div>
    </div>
  );
};

// Route Guard for Protected Routes
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-primary text-white">
        <p className="text-xl">Checking authorization...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 404 Page (FR-003)
const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary text-white p-4">
      <h1 className="text-6xl font-bold text-secondary mb-4">404</h1>
      <p className="text-xl mb-6 text-slate-300">Oops! The page you are looking for does not exist.</p>
      <a href="/" className="px-6 py-3 bg-secondary text-primary font-bold rounded-lg hover:bg-white transition">
        Go Back Home
      </a>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page (Public Marketing Only) */}
          <Route path="/" element={<Home />} />

          {/* SaaS Authenticated Dashboard Layout & Sub-views */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DashboardLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="quizzes" element={<QuizSelectionPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Timed Quiz Taking Flow (Clean Page / Protected - FR-002) */}
          <Route
            path="/quiz/:attemptId"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <QuizPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Timed Quiz Completion Flow (Clean Page / Protected) */}
          <Route
            path="/results/:attemptId"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <QuizCompletionPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Public Certificate Verification (FR-141) */}
          <Route path="/verify-certificate" element={<VerifyCertificate />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
