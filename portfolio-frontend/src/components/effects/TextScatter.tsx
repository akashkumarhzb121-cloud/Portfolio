import { useState, useId, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TextScatterProps {
  children: string;
  className?: string;
  maxDistance?: number;
  maxRotation?: number;
}

export default function TextScatter({
  children,
  className = '',
  maxDistance = 14,
  maxRotation = 18
}: TextScatterProps) {
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const componentId = useId();

  if (typeof children !== 'string') {
    return <span className={className}>{children as ReactNode}</span>;
  }

  // Pre-generate deterministic scatter offsets for each character based on index
  const letters = children.split('');

  return (
    <span
      className={`inline-block select-none cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      role="text"
      aria-label={children}
    >
      <span className="sr-only">{children}</span>
      <span className="inline-flex flex-wrap" aria-hidden="true">
        {letters.map((char, index) => {
          if (char === ' ') {
            return (
              <span key={`${componentId}-space-${index}`} className="inline-block w-[0.3em]">
                &nbsp;
              </span>
            );
          }

          // Deterministic pseudo-random offset
          const seed = (index * 9301 + 49297) % 233280;
          const rand1 = (seed / 233280) * 2 - 1; // -1 to 1
          const rand2 = (((seed * 13) % 233280) / 233280) * 2 - 1;
          const rand3 = (((seed * 37) % 233280) / 233280) * 2 - 1;

          const offsetX = rand1 * maxDistance;
          const offsetY = rand2 * maxDistance;
          const rotation = rand3 * maxRotation;

          const style = !reducedMotion && isHovered
            ? {
                transform: `translate3d(${offsetX}px, ${offsetY}px, 0px) rotate(${rotation}deg) scale(1.08)`,
                color: 'var(--accent-cyan)',
                textShadow: '0 0 16px rgba(103, 232, 249, 0.6)',
                transition: `transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.015}s, color 0.3s ease, text-shadow 0.3s ease`
              }
            : {
                transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
                transition: `transform 0.5s cubic-bezier(0.25, 1, 0.5, 1) ${(letters.length - index) * 0.01}s, color 0.3s ease, text-shadow 0.3s ease`
              };

          return (
            <span
              key={`${componentId}-char-${index}`}
              className="inline-block will-change-transform"
              style={style}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}