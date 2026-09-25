import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface LightspeedProps {
  starCount?: number;
  baseSpeed?: number;
  warpSpeedMultiplier?: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  color: string;
}

const COLORS = ['#67e8f9', '#a78bfa', '#f8fafc', '#38bdf8', '#c084fc'];

export default function Lightspeed({
  starCount = 380,
  baseSpeed = 1.4,
  warpSpeedMultiplier = 5,
  className = ''
}: LightspeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const speedRef = useRef(baseSpeed);
  const targetSpeedRef = useRef(baseSpeed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    let cx = width / 2;
    let cy = height / 2;
    const fov = 300;

    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * 1000 + 1,
      prevZ: 1000,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

    let animId: number;

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      cx = width / 2;
      cy = height / 2;
    };

    window.addEventListener('resize', handleResize);

    const onPointerDown = () => {
      if (!reducedMotion) {
        targetSpeedRef.current = baseSpeed * warpSpeedMultiplier;
      }
    };

    const onPointerUp = () => {
      targetSpeedRef.current = baseSpeed;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    const render = () => {
      // Ease speed
      speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.08;
      const currentSpeed = reducedMotion ? 0.2 : speedRef.current;

      // Dark space trail clear
      ctx.fillStyle = 'rgba(5, 7, 13, 0.35)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.prevZ = star.z;
        star.z -= currentSpeed * 4;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = 1000;
          star.prevZ = 1000;
        }

        const k = fov / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const prevK = fov / star.prevZ;
          const prevPx = star.x * prevK + cx;
          const prevPy = star.y * prevK + cy;

          const size = Math.max((1 - star.z / 1000) * 2.2, 0.5);

          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = star.color;
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [starCount, baseSpeed, warpSpeedMultiplier, reducedMotion]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-auto select-none ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {/* Radial fade to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-[#05070d]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,7,13,0.3)_0%,rgba(5,7,13,0.85)_100%)] pointer-events-none" />
    </div>
  );
}