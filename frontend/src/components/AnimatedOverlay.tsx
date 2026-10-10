'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

interface AnimatedOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function AnimatedOverlay({ isOpen, onClose, onContinue }: AnimatedOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  // Optimized spring transition
  const springTransition = {
    type: 'spring' as const,
    damping: 25,
    stiffness: 300
  };

  // Ensure GPU acceleration with willChange
  const cardStyle = { willChange: "transform, opacity" as const };
  const backdropStyle = { willChange: "opacity" as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            style={backdropStyle}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          />

          {/* Modal Overlay */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 20 }}
              transition={shouldReduceMotion ? { duration: 0 } : springTransition}
              style={cardStyle}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 pointer-events-auto relative"
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Content with staggered entrance */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: shouldReduceMotion ? 0 : 0.1,
                      delayChildren: shouldReduceMotion ? 0 : 0.1
                    }
                  }
                }}
                className="space-y-6 pt-2"
              >
                <motion.div variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
                  visible: { opacity: 1, y: 0 }
                }}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles w-6 h-6"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Ready to investigate your data?
                  </h2>
                </motion.div>

                <motion.div variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
                  visible: { opacity: 1, y: 0 }
                }}>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    You're about to unleash 8 specialized AI agents on your dataset. They will automatically clean, profile, and find hidden causal patterns without a single line of code.
                  </p>
                </motion.div>

                <motion.div variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
                  visible: { opacity: 1, y: 0 }
                }}>
                  <button
                    onClick={onContinue}
                    className="w-full mt-4 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    Yes, continue to upload
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
