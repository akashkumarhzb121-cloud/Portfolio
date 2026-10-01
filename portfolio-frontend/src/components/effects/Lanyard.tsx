import { useState, useRef, type MouseEvent, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Download, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import './Lanyard.css';

export interface LanyardProps {
  resumeUrl?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Step 2: Optimized React Three Fiber Canvas Wrapper
 * - frameloop="demand": stops the GPU from rendering heavy off-screen physics cycles when scrolling
 * - gl={{ powerPreference: "high-performance", antialias: true }}: locks to high-performance GPU context
 */
export function LanyardCanvas({
  children,
  className = '',
  camera = { position: [0, 0, 13], fov: 25 },
  ...props
}: {
  children?: ReactNode;
  className?: string;
  camera?: any;
  [key: string]: any;
}) {
  return (
    <div className={`lanyard-canvas-container ${className}`}>
      <Canvas
        frameloop="demand"
        gl={{ powerPreference: "high-performance", antialias: true }}
        camera={camera}
        {...props}
      >
        {children}
      </Canvas>
    </div>
  );
}

export default function Lanyard({
  resumeUrl = '/resume/AKASH_KUMAR_RESUME.pdf',
  className = '',
  children
}: LanyardProps) {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [downloaded, setDownloaded] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: x * 18,
      y: -y * 18
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  if (children && !reducedMotion) {
    return (
      <div className={`lanyard-wrapper ${className}`}>
        <LanyardCanvas>
          {children}
        </LanyardCanvas>
      </div>
    );
  }

  return (
    <div className={`lanyard-wrapper ${className}`}>
      <div className="lanyard-fallback-container">
        {/* Physical Lanyard Strap */}
        <div className="lanyard-strap" aria-hidden="true" />

        {/* Physical Metallic Clip & Ring */}
        <div className="lanyard-clip" aria-hidden="true">
          <div className="lanyard-clip-ring" />
        </div>

        {/* 3D Holographic ID Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="lanyard-badge group"
          style={{
            transform: reducedMotion
              ? 'none'
              : `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
          role="region"
          aria-label="Interactive Developer Badge for Akash Kumar"
        >
          {/* Hologram Light Reflection */}
          <div className="lanyard-hologram" aria-hidden="true" />

          {/* Top Badge Section */}
          <div>
            <div className="lanyard-badge-hole" aria-hidden="true" />
            <div className="flex items-center justify-between mt-2">
              <div className="lanyard-chip" aria-hidden="true" />
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">
                VERIFIED 2026
              </span>
            </div>
          </div>

          {/* Middle Badge Section - Name & Title */}
          <div className="my-auto py-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-4 text-cyan-300 font-extrabold text-2xl tracking-tighter">
              AK
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Akash Kumar
            </h3>
            <p className="text-xs font-mono text-cyan-300 mt-1 uppercase tracking-wider">
              A Software Engineer & Developer
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Full-Stack UI · 3D Interactions · WebGL</span>
            </div>
          </div>

          {/* Bottom Badge Section - Barcode & Direct Action */}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>ID: DEV-2026-AK</span>
              <span className="tracking-widest">||||| | |||| |||</span>
            </div>

            <a
              href={resumeUrl}
              download="AKASH_KUMAR_RESUME.pdf"
              onClick={handleDownload}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-400"
              aria-label="Download Akash Kumar's Resume PDF"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Resume Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Download Resume (PDF)</span>
                </>
              )}
            </a>
          </div>
        </div>

        {/* Secondary Clean Link */}
        <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 underline underline-offset-4 decoration-slate-600 hover:decoration-cyan-400"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open PDF in new tab</span>
          </a>
        </div>
      </div>
    </div>
  );
}