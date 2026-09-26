import { ArrowUpRight, ArrowDown, Sparkles, FileText } from 'lucide-react';
import ParticleText from '@/components/effects/ParticleText';
import Lightspeed from '@/components/effects/Lightspeed';
import SpaceshipCockpitFrame from '@/components/effects/SpaceshipCockpitFrame';

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-center pt-28 pb-16 overflow-hidden"
      aria-label="Introduction and Hero"
    >
      {/* Hyperspace Lightspeed atmospheric background */}
      <Lightspeed />

      {/* Spaceship Cockpit Viewport Frame & Telemetry HUD */}
      <SpaceshipCockpitFrame />

      <div className="site-container relative z-10 my-auto">
        <div className="max-w-4xl">
          {/* Headline with ParticleText on Akash Kumar */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-white leading-[1.05]">
              <span className="sr-only">Akash Kumar</span>
              <ParticleText color="#67e8f9" particleSize={2.4}>
                Akash Kumar
              </ParticleText>
            </h1>
            <p className="mt-4 text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-200">
              Building expressive, motion-driven digital experiences.
            </p>
          </div>

          {/* Introduction copy */}
          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-normal mb-10">
            I design and develop fast, thoughtful interfaces where motion, usability, and visual identity work together. Specializing in React, TypeScript, and interactive WebGL craft.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href="#projects"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(103,232,249,0.35)] hover:shadow-[0_0_35px_rgba(103,232,249,0.5)] transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Explore My Work</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="#contact"
              className="px-6 py-3.5 rounded-full border border-white/[0.16] hover:border-cyan-400/50 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm tracking-wide transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>Start a Conversation</span>
              <ArrowDown className="w-4 h-4 text-cyan-400" />
            </a>

            <a
              href="/resume/AKASH_KUMAR_RESUME.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-full border border-transparent hover:border-white/[0.1] text-slate-400 hover:text-white font-medium text-xs tracking-wider transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resume PDF</span>
            </a>
          </div>
        </div>

        {/* Hero Bottom Meta Banner */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>Available for select collaborations & roles</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Based in India · Remote worldwide</span>
            <div className="hidden sm:flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scroll to explore ↓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}