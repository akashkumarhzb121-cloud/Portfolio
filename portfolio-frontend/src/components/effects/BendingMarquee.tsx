import { useRef, useEffect, useId } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface BendingMarqueeProps {
  text: string;
  speed?: number;
  curveAmount?: number;
  direction?: 'left' | 'right';
  className?: string;
  color?: string;
  fontSize?: number;
}

export default function BendingMarquee({
  text,
  speed = 1.8,
  curveAmount = 55,
  direction = 'left',
  className = '',
  color = '#d8f56a',
  fontSize = 32
}: BendingMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const pathId = useId();
  const reducedMotion = useReducedMotion();

  // Repeat text to fill the path smoothly
  const repeatedText = `${text}  ✦  ${text}  ✦  ${text}  ✦  ${text}  ✦  ${text}  ✦  `;

  useEffect(() => {
    if (reducedMotion) return;

    let animId: number;
    let currentOffset = 0;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      scrollVelocity = delta * 0.15;
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const animate = () => {
      // Natural speed + scroll velocity influence
      const dirMultiplier = direction === 'left' ? -1 : 1;
      const baseDelta = dirMultiplier * speed;
      currentOffset += baseDelta - scrollVelocity;
      scrollVelocity *= 0.92; // Friction

      // Keep offset within a smooth cycling range
      if (currentOffset <= -2000) currentOffset += 2000;
      if (currentOffset >= 2000) currentOffset -= 2000;

      if (textPathRef.current) {
        textPathRef.current.setAttribute('startOffset', `${currentOffset}px`);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [speed, direction, reducedMotion]);

  // SVG curved path: starts at (0, 70), curves upward at center, ends at (1400, 70)
  const pathD = `M -200 ${80 + curveAmount} Q 700 ${80 - curveAmount} 1600 ${80 + curveAmount}`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none pointer-events-none py-6 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1400 160"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <path id={pathId} d={pathD} fill="none" />
        </defs>
        <text
          fill={color}
          fontSize={fontSize}
          fontWeight="800"
          letterSpacing="0.08em"
          textAnchor="start"
          className="uppercase tracking-widest font-mono"
          style={{
            filter: `drop-shadow(0 0 12px ${color}40)`
          }}
        >
          <textPath
            ref={textPathRef}
            href={`#${pathId}`}
            startOffset="0px"
          >
            {repeatedText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}