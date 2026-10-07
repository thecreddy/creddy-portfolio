import React, { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { FallbackVisual } from './components/FallbackVisual';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#FAF9F5] select-text">
      {/* Editorial paper grain & soft studio illumination background */}
      <div className="absolute inset-0 pointer-events-none studio-gradient" />
      <div className="absolute inset-0 pointer-events-none bg-grain mix-blend-multiply" />

      {/* 3D Visual Centerpiece with Graceful Fallback */}
      <ErrorBoundary fallback={<FallbackVisual isMobile={isMobile} />}>
        <Scene isMobile={isMobile} />
      </ErrorBoundary>

      {/* Pure Editorial Content Layout (Strictly the two requested elements) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center pointer-events-none px-7 sm:px-12 md:px-16 lg:px-24 xl:px-28">
        <div className="max-w-xl md:max-w-2xl pointer-events-auto">
          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.035em] text-[#141413] leading-[1.08] animate-hero-heading">
            Hello, I'm Creddy.
          </h1>

          {/* Body */}
          <p className="mt-5 sm:mt-7 text-lg sm:text-xl md:text-2xl font-normal text-[#4A4843] leading-[1.6] sm:leading-[1.62] tracking-[-0.01em] animate-hero-body">
            I’m building my career at the intersection of Artificial Intelligence and Cybersecurity, focused on securing AI systems, LLMs, and intelligent agents
          </p>

          {/* Status Line */}
          <div className="mt-5 sm:mt-6 flex items-center gap-2.5 text-xs sm:text-[13px] text-[#7A766F] font-normal tracking-[-0.01em] animate-hero-status">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#524E48] opacity-25"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4A4741]"></span>
            </span>
            <span>Currently building — more coming soon.</span>
          </div>

          {/* Social / Contact Icons */}
          <div className="mt-6 sm:mt-8 flex items-center gap-5 animate-hero-icons">
            <a
              href="https://www.linkedin.com/in/thecreddy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="group p-2 -ml-2 rounded-lg text-[#55524C] hover:text-[#141413] transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141413]/25 focus-visible:ring-offset-2"
            >
              <svg
                className="w-[23px] h-[23px] transition-transform duration-300 ease-out group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" rx="0.5" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>

            <a
              href="mailto:contact@thecreddy.in"
              aria-label="Email"
              className="group p-2 rounded-lg text-[#55524C] hover:text-[#141413] transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141413]/25 focus-visible:ring-offset-2"
            >
              <svg
                className="w-[24px] h-[24px] transition-transform duration-300 ease-out group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;
