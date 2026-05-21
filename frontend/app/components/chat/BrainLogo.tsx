"use client";

import { motion, AnimatePresence } from "motion/react";
import { Brain } from "lucide-react";

type ThinkingState = "idle" | "thinking" | "done";

export function BrainLogo({ state }: { state: ThinkingState }) {
    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Ripple animation */}
            <AnimatePresence>
                {state === "thinking" &&
                    [0, 0.7, 1.4].map((delay, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-indigo-500"
                            initial={{ scale: 0.3, opacity: 0.8 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ duration: 2.2, delay, repeat: Infinity, ease: "easeOut" }}
                        />
                    ))}
            </AnimatePresence>

            {/* Main brain icon */}
            <motion.div
                animate={
                    state === "thinking"
                        ? { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }
                        : state === "done"
                        ? { scale: [0.9, 1.05, 1] }
                        : { scale: 1, opacity: 0.4 }
                }
                transition={
                    state === "thinking"
                        ? { duration: 2, repeat: Infinity }
                        : { duration: 0.3 }
                }
            >
                <Brain size={26} className="text-indigo-400" />
            </motion.div>
        </div>
    );
}
