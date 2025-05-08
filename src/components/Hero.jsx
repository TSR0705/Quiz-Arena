import { motion } from "framer-motion";
import { styles } from "../styles";

const Hero = () => {
  return (
    <section className={`relative w-full h-screen mx-auto`}>
      <div
        className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
      >
        <div className='flex flex-col justify-center items-center mt-28 md:mt-5 lg:5'>
          <div className='w-5 h-5 rounded-full bg-[#915EFF]' />
          <div className='w-1 sm:h-80 h-40 violet-gradient' />
        </div>

        <div className="mt-28 md:mt-5 lg:5">
          <h1 className={`${styles.heroHeadText} text-white`}>
            Challenge Your Knowledge with <span className='text-[#915EFF]'>QuizArena</span>
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-white-100`}>
            Test your knowledge across various topics, compete with others, and see how you rank on the leaderboard.
          </p>

          {/* Button with link */}
          <a href="http://localhost:5173/#Quizzes">
            <button className="mt-4 px-6 py-3 bg-[#915EFF] text-white rounded-lg hover:bg-[#7A4ED9] transition-colors">
              Start Quiz
            </button>
          </a>

          <p className="mt-4 text-white-100 text-[14px]">
            Join over 10,000 quiz enthusiasts!
          </p>
        </div>
      </div>

      <div className='absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center'>
        <a href='#about'>
          <div className='w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2'>
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className='w-3 h-3 rounded-full bg-secondary mb-1'
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
