import React, { useState } from "react";
import { motion } from "framer-motion";
import { slideIn } from "../utils/motion";
import { styles } from "../styles";
import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";

const Auth = () => {
  const [mode, setMode] = useState("login"); // login | signup | forgot | contact
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup" && form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      if (mode === "contact") {
        alert("Message sent successfully!");
      } else {
        alert(
          `${mode === "login"
            ? "Logged in"
            : mode === "signup"
              ? "Account created"
              : mode === "forgot"
                ? "Reset email sent"
                : ""
          } successfully!`
        );
      }
    }, 1000);
  };

  const toggleLoginSignup = () => {
    setMode((prevMode) => (prevMode === "signup" ? "login" : "signup"));
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      message: "",
    });
  };

  const titles = {
    login: ["Welcome back!", "Login"],
    signup: ["Register and join the fun!", "Sign Up"],
    forgot: ["Forgot something?", "Reset Password"],
    contact: ["Contact Us", "Send a Message"],
  };

  return (
    <section className="xl:mt-12 flex xl:flex-row flex-col-reverse gap-10 overflow-hidden min-h-[700px]">
      {/* Left: Form Section */}
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className="flex-[0.75] bg-black-100 p-8 rounded-2xl flex flex-col justify-center"
      >
        <p className={styles.sectionSubText}>{titles[mode][0]}</p>
        <h3 className={styles.sectionHeadText}>{titles[mode][1]}</h3>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          {mode === "signup" && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Username</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          {(mode === "login" || mode === "signup" || mode === "forgot" || mode === "contact") && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          {(mode === "login" || mode === "signup") && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="●●●●●●●●"
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          {mode === "signup" && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="●●●●●●●●"
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          {mode === "contact" && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Message</span>
              <textarea
                rows="5"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Type your message here..."
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          <button
            type="submit"
            className="bg-[#915EFF] py-3 px-8 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary"
          >
            {loading
              ? "Processing..."
              : mode === "login"
              ? "Login"
              : mode === "signup"
              ? "Sign Up"
              : mode === "forgot"
              ? "Send Reset Link"
              : "Send Message"}
          </button>
        </form>

        {(mode === "login" || mode === "signup") && (
          <div className="text-white text-sm mt-4">
            {mode === "login" ? (
              <>
                Don’t have an account?
                <button onClick={toggleLoginSignup} className="text-purple-400 ml-1 underline">
                  Sign up here
                </button>
                <br />
                <button onClick={() => setMode("forgot")} className="text-purple-400 underline mt-2">
                  Forgot Password?
                </button>
                <br />
                <button onClick={() => setMode("contact")} className="text-purple-400 underline mt-2">
                  Contact Us
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button onClick={toggleLoginSignup} className="text-purple-400 ml-1 underline">
                  Login here
                </button>
              </>
            )}
          </div>
        )}

        {(mode === "forgot" || mode === "contact") && (
          <p className="text-white text-sm mt-6">
            Back to{" "}
            <button onClick={() => setMode("login")} className="text-purple-400 underline ml-1">
              Login
            </button>
          </p>
        )}
      </motion.div>

      {/* Right: Earth Animation */}
      <motion.div
        variants={slideIn("right", "tween", 0.2, 1)}
        className="xl:flex-1 flex items-center justify-center xl:h-auto md:h-[550px] h-[350px]"
      >
        <EarthCanvas />
      </motion.div>
    </section>
  );
};

export default SectionWrapper(Auth, "Login");
