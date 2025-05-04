import React, { useState, useEffect } from "react";
import { styles } from "../styles";
import { motion } from "framer-motion";
import { SectionWrapper } from "../hoc";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";




const quizzes = [

    { 
        title: "Computer Science", 
        description: "Challenge your CS fundamentals.", 
        topics: ["Data Structures", "Algorithms", "Computer Networks", "Operating Systems", "DBMS", "Cybersecurity", "Theory of Computation"] 
      },
      { 
        title: "Web Development", 
        description: "Dive into the world of frontend and backend.", 
        topics: ["HTML/CSS", "JavaScript", "React", "Node.js", "MongoDB", "APIs", "Full Stack"] 
      },
      { 
        title: "Software Engineering", 
        description: "Test your software development knowledge.", 
        topics: ["SDLC", "Agile", "Version Control", "Testing", "UML Diagrams", "DevOps", "Design Patterns"] 
      },
      { 
        title: "Artificial Intelligence", 
        description: "Explore smart systems and AI logic.", 
        topics: ["Machine Learning", "Deep Learning", "Neural Networks", "NLP", "Reinforcement Learning", "AI Ethics", "Computer Vision"] 
      },
      { 
        title: "Cybersecurity", 
        description: "Understand digital security and protection.", 
        topics: ["Cryptography", "Network Security", "Ethical Hacking", "Firewalls", "Authentication", "OWASP", "Forensics"] 
      },
      { 
        title: "Operating Systems", 
        description: "Master the heart of computing systems.", 
        topics: ["Processes", "Threads", "Memory Management", "File Systems", "Scheduling", "Virtualization", "System Calls"] 
      },
      { 
        title: "Database Systems", 
        description: "Explore data modeling and SQL queries.", 
        topics: ["SQL", "NoSQL", "Normalization", "Transactions", "ER Diagrams", "Indexing", "Distributed Databases"] 
      },
      { 
        title: "Electrical Engineering", 
        description: "Learn about electrical circuits and signals.", 
        topics: ["Circuits", "Signals and Systems", "Digital Electronics", "Control Systems", "Microprocessors", "Embedded Systems", "VLSI"] 
      },
      { 
        title: "Mechanical Engineering", 
        description: "Test your mechanics and thermodynamics knowledge.", 
        topics: ["Kinematics", "Fluid Mechanics", "Thermodynamics", "Machine Design", "Heat Transfer", "Materials Science", "Vibrations"] 
      },
      { 
        title: "Civil Engineering", 
        description: "Study structures, materials, and infrastructure.", 
        topics: ["Structural Analysis", "Concrete Technology", "Soil Mechanics", "Transportation Engineering", "Surveying", "Hydraulics", "Construction Planning"] 
      },

];

const itemsPerPage = 6;

const QuizSelectionPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
const [difficulty, setDifficulty] = useState("easy");
const [numQuestions, setNumQuestions] = useState(5);

  const totalPages = Math.ceil(quizzes.length / itemsPerPage);


  const navigate = useNavigate();

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev < totalPages ? prev + 1 : 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPages]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };


  const handleStartQuiz = () => {
    navigate("/quizpage", {
      state: {
        category: selectedCategory.title,
        topic: selectedTopic,
        numQuestions,
        difficulty,
      },
    });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 after filtering
  };

  

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.topics.some((topic) =>
        topic.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const currentItems = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section className={`w-full min-h-screen ${styles.padding}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Choose Your <span className="text-[#915EFF]">Quiz</span>
        </h2>
        <p className={`${styles.sectionSubText} text-center mt-4 mb-10`}>
          Select a category and start playing
        </p>

        {/* Search Box */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder="Search quizzes or topics..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="p-3 rounded-xl w-1/3 text-white bg-[#2e2e4d] border border-[#3e3e5f] focus:outline-none focus:ring-2 focus:ring-[#915EFF]"
          />
        </div>

        {filteredQuizzes.length === 0 ? (
          <p className="text-center text-white">No results found</p>
        ) : (
          <>
            {/* Quiz Selection Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentItems.map((quiz, index) => (
                <motion.div
                  key={index}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(145, 94, 255, 0.5)",
                  }}
                  className="bg-[#1a1a2e] rounded-2xl p-6 shadow-lg hover:shadow-violet-500/40 transition-all duration-300 border border-[#2a2a40] cursor-pointer"
                  onClick={() => handleCategoryClick(quiz)}
                >
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-[#dfd9ff] text-sm">{quiz.description}</p>
                  <button className="mt-4 px-4 py-2 bg-[#915EFF] text-white rounded-md hover:bg-[#a27eff] transition duration-200">
                    Select Topic 
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12 gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={`px-4 py-2 rounded-full border text-white flex items-center gap-2 ${
                  currentPage === 1
                    ? "border-gray-600 text-gray-500 cursor-not-allowed"
                    : "border-[#915EFF] hover:bg-[#915EFF] hover:text-white"
                }`}
                disabled={currentPage === 1}
              >
                <ChevronLeft /> Prev
              </button>

              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-10 h-10 rounded-full text-sm font-semibold ${
                    currentPage === idx + 1
                      ? "bg-[#915EFF] text-white"
                      : "bg-transparent text-white border border-[#2e2e4d] hover:bg-[#2e2e4d]"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={`px-4 py-2 rounded-full border text-white flex items-center gap-2 ${
                  currentPage === totalPages
                    ? "border-gray-600 text-gray-500 cursor-not-allowed"
                    : "border-[#915EFF] hover:bg-[#915EFF] hover:text-white"
                }`}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedCategory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div className="bg-[#1a1a2e] p-8 rounded-xl w-[90%] max-w-md text-white relative">
      <button
        onClick={handleCloseModal}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        ✕
      </button>

      <h2 className="text-2xl font-bold mb-4">{selectedCategory.title}</h2>

      {/* Topic Dropdown */}
      <label className="block mb-2">Choose Topic:</label>
      <select
        value={selectedTopic}
        onChange={(e) => setSelectedTopic(e.target.value)}
        className="w-full p-2 mb-4 bg-[#2e2e4d] rounded-md text-white"
      >
        <option value="">Select a topic</option>
        {selectedCategory.topics.map((topic, index) => (
          <option key={index} value={topic}>
            {topic}
          </option>
        ))}
      </select>

      {/* Difficulty Dropdown */}
      <label className="block mb-2">Select Difficulty:</label>
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="w-full p-2 mb-4 bg-[#2e2e4d] rounded-md text-white"
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      {/* Number of Questions Input */}
      <label className="block mb-2">Number of Questions:</label>
      <input
        type="number"
        value={numQuestions}
        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
        className="w-full p-2 mb-6 bg-[#2e2e4d] rounded-md text-white"
        min={1}
        max={50}
      />

      {/* Start Quiz Button */}
      <button
        onClick={() => {
          if (numQuestions > 50) {
            alert("Please select 50 or fewer questions.");
            return;
          }
          if (numQuestions < 1) {
            alert("Please select at least 1 question.");
            return;
          }
          if (!selectedTopic) {
            alert("Please select a topic.");
            return;
          }
        
          navigate("/quizpage", {
            state: {
              category: selectedCategory.title,
              topic: selectedTopic,
              difficulty,
              numQuestions,
            },
          });
        }}
        
        disabled={!selectedTopic}
        className={`w-full py-2 rounded-md ${
          selectedTopic
            ? "bg-[#915EFF] hover:bg-[#a27eff]"
            : "bg-gray-600 cursor-not-allowed"
        } transition duration-200`}
      >
        Start Quiz
      </button>
    </div>
  </div>
)}
    </section>
  );
}

export default SectionWrapper(QuizSelectionPage, "Quizzes");
