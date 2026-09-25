import { useRef, useEffect, useState, useMemo, type ReactNode } from 'react';
import type { Skill } from '@/types/portfolio';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Reliable crisp vector SVG icons for all technologies
function TechIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();

  switch (normalized) {
    case 'react':
      return (
        <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-10 h-10 fill-none stroke-[#61DAFB]">
          <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
          <g strokeWidth="1">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      );
    case 'typescript':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect width="100" height="100" rx="16" fill="#3178C6" />
          <path d="M30 36v8h12v36h10V44h12v-8H30zm36 12c-2-2-5-3-9-3-5 0-9 3-9 7 0 5 4 7 10 9 7 2 11 5 11 11 0 7-6 11-13 11-5 0-10-2-13-5l4-7c2 2 5 4 9 4 4 0 7-2 7-5 0-4-3-6-9-8-7-2-11-5-11-11 0-7 6-11 13-11 5 0 9 2 11 4l-4 7z" fill="#FFFFFF" />
        </svg>
      );
    case 'javascript':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect width="100" height="100" rx="16" fill="#F7DF1E" />
          <path d="M28 72l7-4c2 3 4 5 7 5 4 0 6-2 6-8V38h9v27c0 10-6 15-15 15-6 0-11-3-14-8zm33-2l7-4c3 4 7 6 12 6 5 0 8-3 8-6 0-4-3-6-9-8l-4-2c-7-3-12-7-12-14 0-8 6-13 15-13 6 0 11 2 14 6l-6 5c-2-3-5-4-8-4-4 0-6 2-6 5 0 3 2 5 7 7l4 2c8 3 13 7 13 15 0 8-6 14-17 14-8 0-14-4-17-9z" fill="#000000" />
        </svg>
      );
    case 'tailwind css':
    case 'tailwind':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#06B6D4]">
          <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z" />
        </svg>
      );
    case 'three.js':
    case 'threejs':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 stroke-white fill-none stroke-[6]">
          <path d="M50 15 L85 75 L15 75 Z" />
          <path d="M50 15 L50 75" />
          <path d="M85 75 L32 45" />
          <path d="M15 75 L68 45" />
        </svg>
      );
    case 'gsap':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect width="100" height="100" rx="16" fill="#0F141C" stroke="#0AE448" strokeWidth="4" />
          <text x="50" y="62" fill="#0AE448" fontSize="28" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">GSAP</text>
        </svg>
      );
    case 'figma':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <path d="M35 15h15v23H35a11.5 11.5 0 0 1 0-23z" fill="#F24E1E" />
          <path d="M50 15h15a11.5 11.5 0 0 1 0 23H50V15z" fill="#FF7262" />
          <path d="M35 38h15v24H35a12 12 0 1 1 0-24z" fill="#A259FF" />
          <path d="M50 38h15a12 12 0 1 1 0 24H50V38z" fill="#1ABCFE" />
          <path d="M35 62h15v12.5A12.5 12.5 0 0 1 35 62z" fill="#0ACF83" />
        </svg>
      );
    case 'node.js':
    case 'nodejs':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="#222" stroke="#5FA04E" strokeWidth="6" />
          <text x="50" y="58" fill="#5FA04E" fontSize="30" fontWeight="bold" textAnchor="middle">node</text>
        </svg>
      );
    case 'express.js':
    case 'express':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect width="100" height="100" rx="16" fill="#18181B" stroke="#A1A1AA" strokeWidth="3" />
          <text x="50" y="60" fill="#FFFFFF" fontSize="22" fontWeight="bold" textAnchor="middle" fontFamily="monospace">ex</text>
        </svg>
      );
    case 'mongodb':
    case 'mongodb atlas':
    case 'mongoose':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <path d="M50 10 C50 10, 25 35, 25 60 C25 78, 38 90, 50 90 C62 90, 75 78, 75 60 C75 35, 50 10, 50 10 Z" fill="#13AA52" />
          <path d="M50 10 C50 10, 48 35, 48 60 C48 78, 49 90, 50 90 C51 90, 52 78, 52 60 C52 35, 50 10, 50 10 Z" fill="#FFFFFF" opacity="0.3" />
        </svg>
      );
    case 'sql':
    case 'dbms':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none" stroke="#00758F" strokeWidth="6">
          <ellipse cx="50" cy="25" rx="35" ry="12" fill="#00758F" fillOpacity="0.2" />
          <path d="M15 25 v25 c0 7 16 12 35 12 s35 -5 35 -12 v-25" />
          <path d="M15 50 v25 c0 7 16 12 35 12 s35 -5 35 -12 v-25" />
        </svg>
      );
    case 'jwt':
    case 'jwt (json web tokens)':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect width="100" height="100" rx="16" fill="#200030" stroke="#D63AFF" strokeWidth="3" />
          <text x="50" y="60" fill="#D63AFF" fontSize="24" fontWeight="900" textAnchor="middle">JWT</text>
        </svg>
      );
    case 'git':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10" fill="#F05032">
          <path d="M85 45 L55 15 a6 6 0 0 0 -8 0 L39 23 l13 13 a7 7 0 0 1 9 9 l12 12 a6 6 0 1 1 -5 5 l-11 -11 v20 a7 7 0 1 1 -8 0 V51 a7 7 0 0 1 -4 -9 L32 29 15 47 a6 6 0 0 0 0 8 l30 30 a6 6 0 0 0 8 0 l32 -32 a6 6 0 0 0 0 -8z" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 fill-white">
          <path d="M50 15 C30 15 15 30 15 50 c0 16 10 29 24 34 2 0 2 -1 2 -2 v-7 c-10 2 -12 -5 -12 -5 -2 -4 -4 -5 -4 -5 -3 -2 0 -2 0 -2 3 0 5 3 5 3 3 5 8 4 10 3 0 -2 1 -4 2 -5 -8 -1 -16 -4 -16 -18 0 -4 1 -7 4 -10 0 -1 -2 -5 0 -10 0 0 3 -1 10 4 3 -1 6 -1 10 -1 3 0 7 0 10 1 7 -5 10 -4 10 -4 2 5 0 9 0 10 3 3 4 6 4 10 0 14 -8 17 -16 18 1 1 2 3 2 7 v10 c0 1 0 2 2 2 14 -5 24 -18 24 -34 0 -20 -15 -35 -35 -35z" />
        </svg>
      );
    case 'postman':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <circle cx="50" cy="50" r="44" fill="#FF6C37" />
          <path d="M30 50 L65 30 L50 65 L45 55 Z" fill="#FFFFFF" />
        </svg>
      );
    case 'vercel':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 fill-white">
          <polygon points="50,15 88,80 12,80" />
        </svg>
      );
    case 'render':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect width="100" height="100" rx="16" fill="#141E28" stroke="#46E3B7" strokeWidth="3" />
          <circle cx="50" cy="50" r="22" fill="#46E3B7" />
        </svg>
      );
    case 'cloudinary':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10 fill-[#3448C5]">
          <path d="M68 40 a16 16 0 0 0 -30 -6 18 18 0 0 0 -18 18 c0 10 8 18 18 18 h30 a14 14 0 0 0 0 -28 z" />
        </svg>
      );
    case 'vs code':
    case 'vscode':
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <path d="M72 15 L28 48 L15 38 L15 62 L28 52 L72 85 Z" fill="#007ACC" />
          <path d="M72 15 L88 23 L88 77 L72 85 Z" fill="#1F9CF0" />
        </svg>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-xs uppercase font-mono">
          {name.slice(0, 3)}
        </div>
      );
  }
}

export interface InfiniteGalleryProps {
  items: Skill[];
  speed?: number;
  className?: string;
  children?: ReactNode;
}

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Databases', 'CS Fundamentals', 'Tools & Cloud'];

export default function InfiniteGallery({
  items,
  speed = 90, // Fast fluid speed as requested so all items are clearly visible
  className = ''
}: InfiniteGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Filter skills based on selected category
  const filteredSkills = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter(skill => {
      if (activeCategory === 'Tools & Cloud') {
        return skill.category === 'Tools & Cloud' || skill.category === 'Tools' || skill.category === 'Cloud';
      }
      return skill.category.toLowerCase().includes(activeCategory.toLowerCase());
    });
  }, [items, activeCategory]);

  // Triple items for seamless continuous looping
  const repeated = useMemo(() => {
    return [...filteredSkills, ...filteredSkills, ...filteredSkills];
  }, [filteredSkills]);

  useEffect(() => {
    if (reducedMotion) return;
    const track = trackRef.current;
    if (!track) return;

    let animId: number;
    let position = 0;
    let isPaused = false;

    const step = () => {
      if (!isPaused && !isDragging) {
        position += speed * 0.045; // Fast and silky smooth auto-scroll
        const singleSetWidth = track.scrollWidth / 3;
        if (singleSetWidth > 0 && position >= singleSetWidth) {
          position = 0;
        }
        track.scrollLeft = position;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    const onEnter = () => {
      isPaused = true;
    };
    const onLeave = () => {
      isPaused = false;
      position = track.scrollLeft;
    };

    track.addEventListener('mouseenter', onEnter);
    track.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(animId);
      track.removeEventListener('mouseenter', onEnter);
      track.removeEventListener('mouseleave', onLeave);
    };
  }, [speed, reducedMotion, isDragging, repeated]);

  // Pointer drag controls
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (trackRef.current?.offsetLeft || 0));
    setScrollLeftState(trackRef.current?.scrollLeft || 0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current.offsetLeft || 0);
    const walk = (x - startX) * 1.6;
    trackRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Parallax tilt on mouse hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 6, y: -y * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none py-2 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1200px'
      }}
    >
      {/* Category Filter Pills in Deep Blue aesthetic */}
      <div className="site-container mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count = cat === 'All' ? items.length : items.filter(s => s.category.includes(cat) || (cat === 'Tools & Cloud' && s.category.includes('Tools'))).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(103,232,249,0.4)] scale-105'
                    : 'bg-[#0f1d38]/80 hover:bg-[#15274d] text-slate-300 hover:text-white border border-cyan-500/20 shadow-sm'
                }`}
              >
                <span>{cat}</span>
                <span className={`ml-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edge gradient masks in dark black */}
      <div
        className="pointer-events-none absolute left-0 top-16 bottom-0 w-16 md:w-32 z-20 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-16 bottom-0 w-16 md:w-32 z-20 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent"
        aria-hidden="true"
      />

      {/* 3D Track with Fast Momentum */}
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-hidden py-6 px-4 cursor-grab active:cursor-grabbing no-scrollbar will-change-transform"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="region"
        aria-label="3D Interactive full-stack tech stack gallery. Drag or scroll to browse."
        tabIndex={0}
      >
        {repeated.map((skill, index) => (
          <div
            key={`${skill.name}-${index}`}
            className="flex-shrink-0 w-64 md:w-72 p-6 rounded-2xl bg-[#0b1630]/95 border border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_12px_35px_rgba(103,232,249,0.35)] transition-all duration-300 group flex flex-col justify-between h-[215px] shadow-lg backdrop-blur-md"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] group-hover:scale-110 group-hover:bg-white/[0.12] transition-transform duration-300">
                <TechIcon name={skill.name} />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-700/50">
                {skill.category}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                {skill.name}
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed line-clamp-2">
                {skill.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}