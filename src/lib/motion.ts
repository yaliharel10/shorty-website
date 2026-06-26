/** Shared Framer Motion variants — respects prefers-reduced-motion via components. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.45, ease: easeOut },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.05,
    y: -6,
    transition: { type: "spring" as const, stiffness: 420, damping: 28 },
  },
};

export const rowItem = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.35, ease: easeOut },
};
