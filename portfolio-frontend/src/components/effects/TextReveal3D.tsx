import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TextReveal3DProps {
  text?: string;
  subtext?: string;
  className?: string;
}

export default function TextReveal3D({
  text = "Crafting high-precision interfaces where motion, usability, and modern architecture converge.",
  subtext = "Bridging the gap between software engineering and expressive digital design.",
  className = ""
}: TextReveal3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const reducedMotion = useReducedMotion();

  const words = text.split(" ");

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    const targets = wordsRef.current.filter(Boolean);
    if (!targets.length) return;

    // Set initial 3D pose
    gsap.set(targets, {
      opacity: 0.15,
      rotateX: 65,
      translateY: 40,
      translateZ: -70,
      filter: "blur(6px)",
      transformOrigin: "50% 100% -40px"
    });

    let animated = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            gsap.to(targets, {
              opacity: 1,
              rotateX: 0,
              translateY: 0,
              translateZ: 0,
              filter: "blur(0px)",
              duration: 1.1,
              stagger: 0.045,
              ease: "power3.out"
            });
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [reducedMotion, words.length]);

  return (
    <section
      ref={containerRef}
      className={`relative py-28 md:py-36 overflow-hidden bg-transparent transition-colors duration-700 ${className}`}
      aria-label="Philosophy transition"
    >
      <div className="site-container relative z-10 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/30 text-cyan-300 font-mono text-xs uppercase tracking-widest shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#67e8f9] animate-pulse" />
          Creative Engineering Standard
        </div>

        <div
          className="max-w-4xl mx-auto"
          style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}
        >
          <h2
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.2] text-slate-100 flex flex-wrap justify-center gap-x-[0.3em] gap-y-2 drop-shadow-md"
            style={{ transformStyle: "preserve-3d" }}
          >
            {words.map((word, i) => (
              <span
                key={i}
                ref={(el: HTMLSpanElement | null) => {
                  wordsRef.current[i] = el;
                }}
                className="inline-block will-change-transform select-none"
                style={{
                  transformStyle: "preserve-3d"
                }}
              >
                {word}
              </span>
            ))}
          </h2>
        </div>

        {subtext && (
          <p className="mt-8 text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-medium drop-shadow">
            {subtext}
          </p>
        )}
      </div>
    </section>
  );
}