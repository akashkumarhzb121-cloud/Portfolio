import { useRef } from 'react';
import TextScatter from '@/components/effects/TextScatter';
import CircularGallery, { type CircularGalleryRef } from '@/components/effects/CircularGallery';
import { techGalleryItems } from '@/data/techGalleryItems';
import { MoveHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TechStack() {
  const galleryRef = useRef<CircularGalleryRef>(null);

  return (
    <section
      id="tech-stack"
      className="section-wrapper relative bg-transparent text-white transition-colors duration-500 overflow-hidden"
      aria-label="Technology Stack"
    >
      <div className="site-container relative z-10 mb-8 sm:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              <TextScatter>Tech Stack</TextScatter>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
              Technologies and tools I use to build frontend interfaces, scalable Node/Express backends, MongoDB & SQL databases, system design, and cloud deployments.
            </p>
          </div>

          {/* Quick spin buttons on header right */}
          <div className="hidden md:flex items-center gap-2.5 pb-1">
            <button
              onClick={() => galleryRef.current?.spin(-1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all font-mono text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              aria-label="Spin 3D cylinder left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Spin Left</span>
            </button>
            <button
              onClick={() => galleryRef.current?.spin(1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all font-mono text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              aria-label="Spin 3D cylinder right"
            >
              <span>Spin Right</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Circular Curved Gallery with interactive controls */}
      <div className="relative z-10 w-full h-[520px] sm:h-[600px] group">
        <CircularGallery
          ref={galleryRef}
          items={techGalleryItems}
          bend={1.4}
          textColor="#67E8F9"
          borderRadius={0.06}
          scrollSpeed={2}
          scrollEase={0.05}
          autoRotate={true}
          autoRotateSpeed={0.06}
        />

        {/* Floating Side Spin Affordances */}
        <button
          onClick={() => galleryRef.current?.spin(-1)}
          className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/80 shadow-[0_0_20px_rgba(103,232,249,0.2)] items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          aria-label="Spin cylinder left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => galleryRef.current?.spin(1)}
          className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/80 shadow-[0_0_20px_rgba(103,232,249,0.2)] items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          aria-label="Spin cylinder right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom hint and mobile controls */}
      <div className="site-container relative z-10 mt-6 flex flex-col items-center gap-3 text-xs text-slate-400 font-mono sm:flex-row sm:justify-between">
        <div className="flex items-center justify-center gap-2 text-center">
          <span>Drag or scroll to rotate</span>
        </div>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <div className="flex items-center justify-center gap-2 sm:hidden">
            <button
              onClick={() => galleryRef.current?.spin(-1)}
              className="px-3 py-1.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300"
              aria-label="Spin technology stack left"
            >
              <ChevronLeft className="inline w-3.5 h-3.5 mr-1" />
              Spin
            </button>
            <button
              onClick={() => galleryRef.current?.spin(1)}
              className="px-3 py-1.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300"
              aria-label="Spin technology stack right"
            >
              Spin
              <ChevronRight className="inline w-3.5 h-3.5 ml-1" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <span className="font-semibold text-slate-300">14+ Technologies</span>
          </div>
        </div>
      </div>
    </section>
  );
}