import React, { useRef, useEffect } from "react";
import { Tilt } from "react-tilt";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { styles } from "../styles";
import { services } from "../constants";
import { SectionWrapper } from "../hoc";

gsap.registerPlugin(ScrollTrigger);

const useGsap = (elementRef, animation, delay = 0) => {
  useEffect(() => {
    if (elementRef.current) {
      gsap.fromTo(
        elementRef.current,
        animation.from,
        {
          ...animation.to,
          delay,
          scrollTrigger: {
            trigger: elementRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, [elementRef, animation, delay]);
};

const ServiceCard = ({ index, title, icon }) => {
  const cardRef = useRef(null);
  useGsap(cardRef, {
    from: { opacity: 0, y: 100, scale: 0.8 },
    to: { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" },
  }, index * 0.2);

  return (
    <Tilt className="xs:w-[250px] w-full">
      <div ref={cardRef} className="w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card">
        <div className="bg-tertiary rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col">
          <img src={icon} alt={title} className="w-16 h-16 object-contain" />
          <h3 className="text-white text-[20px] font-bold text-center">{title}</h3>
        </div>
      </div>
    </Tilt>
  );
};

const About = () => {
  const introRef = useRef(null);
  const missionRef = useRef(null);
  const featuresRef = useRef(null);
  const audienceRef = useRef(null);
  const visionRef = useRef(null);
  const ctaRef = useRef(null);

  // Introduction Animation
  useGsap(introRef, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
  });

  // Mission Animation
  useGsap(missionRef, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
  }, 0.2);

  // Features Animation
  useGsap(featuresRef, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
  }, 0.4);

  // Audience Animation
  useGsap(audienceRef, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
  }, 0.6);

  // Vision Animation
  useGsap(visionRef, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
  }, 0.8);

  // CTA Animation
  useGsap(ctaRef, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
  }, 1);

  return (
    <>
      <div ref={introRef}>
        <p className={styles.sectionSubText}>Introduction</p>
        <h2 className={styles.sectionHeadText}>About QuizArena</h2>
        <p className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]">
          <span className="text-[#915EFF] font-bold">Unlock Knowledge. One Quiz at a Time.</span><br />
          Welcome to QuizArena – your interactive platform to learn, play, and grow through the power of quizzes. Whether you’re a student sharpening your skills, a trivia lover testing your knowledge, or a lifelong learner exploring new horizons, QuizArena is built for everyone.
        </p>
      </div>

      <div ref={missionRef} className="mt-10">
        <h3 className="text-white text-[24px] font-bold">Our Mission</h3>
        <p className="mt-2 text-secondary text-[17px] max-w-3xl leading-[30px]">
          We believe learning should be fun, accessible, and rewarding. At QuizArena, our mission is to transform everyday moments into engaging opportunities for growth. Answer questions, challenge yourself, track your progress, and uncover new interests—all in one place.
        </p>
      </div>

      <div ref={featuresRef} className="mt-10">
        <h3 className="text-white text-[24px] font-bold">What Makes QuizArena Unique?</h3>
        <p className="mt-2 text-secondary text-[17px] max-w-3xl leading-[30px]">
          Here’s why QuizArena stands out:
        </p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-items-center gap-10">
          {services.map((service, index) => (
            <ServiceCard key={service.title} index={index} {...service} />
          ))}
        </div>
      </div>

   

     
      <div ref={ctaRef} className="mt-10">
        <h3 className="text-white text-[24px] font-bold">Get Involved</h3>
        <p className="mt-2 text-secondary text-[17px] max-w-3xl leading-[30px]">
          Ready to dive in? <a href="#Quizzes" className="text-[#915EFF] hover:underline">Start quizzing now</a> or <a href="#Login" className="text-[#915EFF] hover:underline">share your feedback</a>. Join our community and help shape the future of QuizArena!
        </p>
      </div>
    </>
  );
};

export default SectionWrapper(About, "about");