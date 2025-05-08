import React, { useState, useEffect } from "react";
import { FaInstagram, FaXTwitter, FaLinkedin, FaEnvelope, FaPhone, FaArrowUp } from "react-icons/fa6";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { logo } from "../assets"; // Imported logo from assets (same as Navbar)

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubscribe = () => {
    if (!email) {
      setSubscriptionMessage("Please enter an email address.");
      setTimeout(() => setSubscriptionMessage(""), 3000);
      return;
    }

    if (!validateEmail(email)) {
      setSubscriptionMessage("Please enter a valid email address.");
      setTimeout(() => setSubscriptionMessage(""), 3000);
      return;
    }

    // Simulate API call with loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubscriptionMessage("Thank you for subscribing!");
      setEmail("");
      setTimeout(() => setSubscriptionMessage(""), 3000);
    }, 1000); // Simulated 1-second delay
  };

  // Scroll-triggered animation logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Trigger animation when the user is within 200px of the bottom of the page
      if (scrollPosition >= documentHeight - 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false); // Hide footer when scrolling back up (optional)
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.footer
      className="w-full py-8 bg-gray-900 text-white flex flex-col items-center gap-6 shadow-lg z-20"
      initial={{ y: 100, opacity: 0 }}
      animate={isVisible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 50, damping: 20 }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="QuizArena Logo" className="w-9 h-9 object-contain" />
              <p className="text-white text-[18px] font-bold">
                Quiz <span>Arena</span>
              </p>
            </div>
            <p className="text-sm leading-relaxed">
              QuizArena is your ultimate platform for interactive quizzes, designed to make learning fun and engaging.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
            <p className="text-sm flex items-center mb-2">
              <FaEnvelope className="mr-2" /> tanmaysingh8246@gmail.com
            </p>
            <p className="text-sm flex items-center">
              <FaPhone className="mr-2" /> +91 930 4444 091
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Stay Connected</h3>
            <div className="flex gap-4">
              <motion.a
                href="https://www.instagram.com/quizarena/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Follow QuizArena on Instagram"
              >
                <FaInstagram size={24} />
              </motion.a>
              <motion.a
                href="https://x.com/quizarena"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Follow QuizArena on X"
              >
                <FaXTwitter size={24} />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/company/quizarena"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Follow QuizArena on LinkedIn"
              >
                <FaLinkedin size={24} />
              </motion.a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-3 text-center">Join Our Newsletter</h3>
          <div className="flex justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-4 py-2 rounded-l-md bg-gray-700 text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
              aria-label="Email for newsletter subscription"
            />
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`px-4 py-2 rounded-r-md text-white transition-colors ${
                isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              aria-label="Subscribe to newsletter"
            >
              {isLoading ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
          {subscriptionMessage && (
            <motion.p
              className={`text-center text-sm mt-2 ${
                subscriptionMessage.includes("Thank") ? "text-green-400" : "text-red-400"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {subscriptionMessage}
            </motion.p>
          )}
        </div>
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>© {new Date().getFullYear()} QuizArena. All rights reserved.</p>
          <div className="mt-2 md:mt-0">
            <Link to="/privacy" className="hover:text-blue-400 mx-2">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-blue-400 mx-2">Terms of Service</Link>
          </div>
        </div>
      </div>
      <motion.button
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Scroll to top"
      >
        <FaArrowUp size={20} />
      </motion.button>
    </motion.footer>
  );
};

export default Footer;