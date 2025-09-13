import { BrowserRouter, Route, Routes } from "react-router-dom";

import About from "./components/About";
import Feedbacks from "./components/Feedbacks";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import Auth from "./components/Auth";
import QuizSelectionPage from "./components/QuizSelectionPage";
import QuizPage from "./components/QuizPage"; // Import your QuizPage
import QuizCompletionPage from "./components/QuizCompletionPage";
import StarsCanvas from './components/canvas/Stars';


const App = () => {
  return (
    <BrowserRouter>
      <div className="relative z-0 bg-primary">
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar />
          <Hero />
          
        </div>
        <About />
        <div classname ="relative z-0">
 
        {/* Define your routes here */}
        <Routes>
          {/* Home page - Show Navbar, Hero, About, QuizSelectionPage */}
          <Route path="/" element={<QuizSelectionPage />} />
          {/* Quiz page - Show Navbar, Hero, About, QuizPage */}
          <Route path="/quizpage" element={<QuizPage />} />
          <Route path="/quiz-completion" element={<QuizCompletionPage />} />
          
        </Routes>
        </div>

        <Feedbacks />
        {/* Always show Auth, StarsCanvas, Footer */}
        <div className="relative z-0">
          
          <Auth />
          <StarsCanvas />
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
