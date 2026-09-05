"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    bodymovin?: any;
    lottie?: any;
  }
}

interface GoogleLogoAnimationProps {
  className?: string;
  size?: number;
  scale?: number;
}

export default function GoogleLogoAnimation({
  className = "w-7 h-7",
  size,
  scale = 1.65,
}: GoogleLogoAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const initAnimation = () => {
      if (isCancelled || !containerRef.current) return;
      const lottieInstance = window.lottie || window.bodymovin;
      if (!lottieInstance) return;

      if (animRef.current) {
        animRef.current.destroy();
      }

      animRef.current = lottieInstance.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/assets/google-logo.json",
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      });

      animRef.current.addEventListener("DOMLoaded", () => {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      });
    };

    // Check if lottie-web is already available
    if (window.lottie || window.bodymovin) {
      initAnimation();
    } else {
      // Dynamically load the self-hosted lottie player script
      const existingScript = document.querySelector('script[src="/assets/lottie.min.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", initAnimation);
      } else {
        const script = document.createElement("script");
        script.src = "/assets/lottie.min.js";
        script.async = true;
        script.onload = () => {
          initAnimation();
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      isCancelled = true;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

  const customStyle = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={customStyle}
    >
      {/* Fallback Google icon while lottie script is initializing */}
      {!isLoaded && (
        <img
          src="/assets/googleicon.png"
          alt="Google"
          className="w-5 h-5 object-contain absolute inset-0 m-auto transition-opacity duration-200"
        />
      )}
      <div
        ref={containerRef}
        style={{ transform: `scale(${scale})` }}
        className={`w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:block transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
