import { motion } from "framer-motion";
import { slideIn } from "../utils/motion"; // your custom animation variant
import EarthCanvas from "./canvas/Earth"; // your Earth animation component
import { styles } from "../styles"; // tailwind style constants
import { useState } from "react";

const AuthSection = () => {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <section className={`xl:mt-12 flex xl:flex-row flex-col-reverse gap-10 overflow-hidden min-h-[700px]`}>
      {/* Left Form Section */}
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className="flex-[0.75] bg-black-100 p-8 rounded-2xl flex flex-col justify-center"
      >
        <p className={styles.sectionSubText}>
          {isSignup ? "Register and join the fun!" : "Welcome back!"}
        </p>
        <h3 className={styles.sectionHeadText}>
          {isSignup ? "Sign Up" : "Login"}
        </h3>

        <form className="mt-10 flex flex-col gap-5">
          {isSignup && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Username</span>
              <input
                type="text"
                name="username"
                placeholder="Your username"
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          <label className="flex flex-col">
            <span className="text-white font-medium mb-4">Email</span>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-white font-medium mb-4">Password</span>
            <input
              type="password"
              name="password"
              placeholder="Your password"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
            />
          </label>

          {isSignup && (
            <label className="flex flex-col">
              <span className="text-white font-medium mb-4">Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </label>
          )}

          <button
            type="submit"
            className="bg-[#915EFF] py-3 px-8 rounded-xl outline-none w-fit text-white font-bold shadow-md shadow-primary"
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>

          <p className="text-white text-sm mt-4">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              type="button"
              className="text-[#915EFF] ml-1 underline"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup ? "Login here" : "Sign up here"}
            </button>
          </p>
        </form>
      </motion.div>

      {/* Right Earth Canvas Section */}
      <motion.div
        variants={slideIn("right", "tween", 0.2, 1)}
        className="xl:flex-1 flex items-center justify-center xl:h-auto md:h-[550px] h-[350px]"
      >
        <EarthCanvas />
      </motion.div>
    </section>
  );
};

export default AuthSection;
