export const pageTransition = {
  initial: { opacity: 0, y: 16, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(8px)" },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
} as const;

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const revealItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 }
};
