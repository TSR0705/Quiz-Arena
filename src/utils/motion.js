export const textVariant = (delay = 0) => {
  return {
    hidden: {
      y: 8,
      opacity: 0,
    },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: "tween",
        ease: [0.16, 1, 0.3, 1],
        duration: 0.2,
        delay: delay,
      },
    },
  };
};

export const fadeIn = (direction, type, delay = 0, duration = 0.2) => {
  return {
    hidden: {
      x: direction === "left" ? 8 : direction === "right" ? -8 : 0,
      y: direction === "up" ? 8 : direction === "down" ? -8 : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "tween",
        ease: [0.16, 1, 0.3, 1],
        delay: delay,
        duration: Math.min(duration, 0.25),
      },
    },
  };
};

export const zoomIn = (delay = 0, duration = 0.2) => {
  return {
    hidden: {
      scale: 0.98,
      opacity: 0,
    },
    show: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "tween",
        ease: [0.16, 1, 0.3, 1],
        delay: delay,
        duration: Math.min(duration, 0.25),
      },
    },
  };
};

export const slideIn = (direction, type, delay = 0, duration = 0.2) => {
  return {
    hidden: {
      x: direction === "left" ? "-10%" : direction === "right" ? "10%" : 0,
      y: direction === "up" ? "10%" : direction === "down" ? "10%" : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "tween",
        ease: [0.16, 1, 0.3, 1],
        delay: delay,
        duration: Math.min(duration, 0.25),
      },
    },
  };
};

export const staggerContainer = (staggerChildren = 0.05, delayChildren = 0) => {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: staggerChildren,
        delayChildren: delayChildren,
      },
    },
  };
};
