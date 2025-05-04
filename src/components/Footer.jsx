import React from "react";
import { FaInstagram, FaXTwitter, FaLinkedin } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="w-full py-4 bg-black-100/55 text-white flex flex-col items-center gap-2">
      <div className="flex gap-6">
        <a
          href="https://www.instagram.com/quizarena/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram size={24} />
        </a>
        <a
          href="https://x.com/quizarena"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaXTwitter size={24} />
        </a>
        <a
          href="https://www.linkedin.com/company/quizarena"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
      <p className="text-sm">&copy; {new Date().getFullYear()} QuizArena. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
