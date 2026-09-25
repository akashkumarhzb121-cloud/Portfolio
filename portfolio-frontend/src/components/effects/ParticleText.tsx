import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ParticleTextProps {
  children?: string;
  className?: string;
  color?: string;
  particleSize?: number;
}

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  color: string;
}

export default function ParticleText({
  children = "Akash Kumar",
  className = "",
  color = "#67e8f9",
  particleSize = 2.2
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 75
    };

    const init = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const displayWidth = Math.max(rect.width, 280);
      // Height based on aspect ratio
      const displayHeight = Math.max(rect.height, 120);

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      ctx.scale(dpr, dpr);

      // Render text offscreen to sample pixels
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.fillStyle = '#ffffff';

      // Responsive font sizing based on container width
      const fontSize = Math.min(displayWidth / 6.5, 96);
      ctx.font = `900 ${fontSize}px "Geist Variable", system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(children, 0, displayHeight / 2);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      particles = [];

      // Sample step
      const step = Math.max(Math.floor(dpr * 4), 3);

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const index = (y * canvas.width + x) * 4;
          const alpha = data[index + 3];

          if (alpha > 128) {
            const logicalX = x / dpr;
            const logicalY = y / dpr;

            // Random slight color variations between cyan, purple, and pure white
            const colors = [color, '#a78bfa', '#f8fafc', '#38bdf8'];
            const pColor = colors[Math.floor(Math.random() * colors.length)];

            particles.push({
              x: logicalX + (Math.random() - 0.5) * 60,
              y: logicalY + (Math.random() - 0.5) * 60,
              homeX: logicalX,
              homeY: logicalY,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: pColor
            });
          }
        }
      }

      setIsReady(true);
    };

    // Wait for document fonts
    if (document.fonts?.ready) {
      document.fonts.ready.then(init);
    } else {
      init();
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', init);

    const render = () => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Distance to pointer
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius) * 12;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force;
          p.vy -= Math.sin(angle) * force;
        }

        // Return to home spring physics
        const homeDx = p.homeX - p.x;
        const homeDy = p.homeY - p.y;

        p.vx += homeDx * 0.08;
        p.vy += homeDy * 0.08;

        // Friction / damping
        p.vx *= 0.85;
        p.vy *= 0.85;

        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', init);
    };
  }, [children, color, particleSize, reducedMotion]);

  if (reducedMotion) {
    return (
      <span className={`inline-block font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block align-middle w-full max-w-2xl min-h-[90px] sm:min-h-[110px] md:min-h-[140px] ${className}`}
    >
      <span className="sr-only">{children}</span>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair select-none"
        aria-hidden="true"
      />
      {!isReady && (
        <span
          className="absolute inset-0 flex items-center font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300"
          aria-hidden="true"
        >
          {children}
        </span>
      )}
    </div>
  );
}