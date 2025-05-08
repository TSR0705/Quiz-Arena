import {   StarsCanvas } from './canvas';
import Hero from "./Hero";
import Navbar from "./Navbar";
import About from "./About";
import Feedbacks from "./Feedbacks";
import CanvasLoader from "./Loader";
import Auth from "./Auth";
import QuizSelectionPage from "./QuizSelectionPage";
import QuizPage from "./QuizPage"; // Import your QuizPage
import QuizCompletionPage from "./QuizCompletionPage"; // Import your QuizCompletionPage
import Footer from "./Footer";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export {
  Hero,
  Navbar,
  About,
  QuizPage,
  QuizCompletionPage,
  QuizSelectionPage,
  Auth,
  Footer,
  ToastContainer,
  useLocation,
  useNavigate,
  toast,
  BrowserRouter,
  Route,
  Routes,
  Feedbacks,
  CanvasLoader, 
  StarsCanvas
};
