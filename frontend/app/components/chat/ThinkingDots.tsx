"use client";

import { motion } from "motion/react";

export function ThinkingDots() {
    return (
        <div className="flex items-center gap-1">
            {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                    animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, delay, repeat: Infinity }}
                />
            ))}
        </div>
    );
}
