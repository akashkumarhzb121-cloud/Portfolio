import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

/**
 * CyberCorners: Four high-tech corner brackets and animated scanner sweep
 * that reveal on card hover, matching ashishk.online exactly.
 */
const CyberCorners = () => (
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:animate-scanner" />
    <div className="absolute inset-0 border border-blue-500/50" />
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500" />
  </div>
);

/**
 * TerminalCard: Strict rectangular sci-fi HUD panel with CRT scanline texture
 * and zero rounded corners (matching ashishk.online).
 */
const TerminalCard = ({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay }}
      className={`relative group bg-black border border-white/10 hover:border-white/20 transition-colors overflow-hidden ${className}`}
    >
      <CyberCorners />
      <div className="p-6 h-full flex flex-col relative z-10">
        {children}
      </div>
      {/* Subtle CRT Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />
    </motion.div>
  );
};

/**
 * Live Terminal Code Stream for Phase II
 */
const LiveCodeTerminal = () => (
  <div className="font-mono text-[10px] text-green-500/70 overflow-hidden h-full leading-tight select-none">
    <motion.div
      animate={{ y: [0, -180] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
    >
      {Array.from({ length: 20 }).map((_, t) => (
        <div key={t} className="whitespace-nowrap mb-1">
          <span className="text-blue-400">const</span> module_{t} = require(&apos;lib-v{t}&apos;);<br />
          <span className="text-purple-400">await</span> <span className="text-yellow-400">compile</span>(module_{t});
        </div>
      ))}
    </motion.div>
  </div>
);

/**
 * Live Oscillogram Waveform for Phase III (Stress Test)
 */
const StressWaveform = () => (
  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
    <defs>
      <linearGradient id="stressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path d="M0 50 H100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    <path d="M0 25 H100" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" strokeWidth="1" />
    <motion.path
      d="M0 45 L10 42 L20 45 L30 35 L40 40 L50 20 L60 25 L70 10 L80 15 L90 5 L100 45"
      fill="none"
      stroke="#ef4444"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <rect x="0" y="0" width="100" height="50" fill="url(#stressGrad)" opacity="0.2" />
  </svg>
);

/**
 * Live Equalizer Signal Bars for Phase IV (Deploy)
 */
const EqualizerMeters = () => (
  <div className="flex gap-1 h-full items-center">
    {[1, 2, 3].map((e) => (
      <motion.div
        key={e}
        className="w-1 bg-green-500"
        animate={{ opacity: [0.3, 1, 0.3], height: ['10px', '26px', '14px'] }}
        transition={{ duration: 0.5 + e * 0.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

export default function SystemOverview() {
  const [copied, setCopied] = useState(false);
  const directEmail = 'akashkumarhzb121@gmail.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(directEmail);
      setCopied(true);
      toast.success('Transmission complete: Email copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(`Email: ${directEmail}`);
    }
  };

  return (
    <section
      id="system-overview"
      className="py-16 md:py-24 bg-transparent text-white relative"
      aria-label="System Overview"
    >
      <div className="site-container relative z-10">
        {/* Top Header Bar */}
        <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tighter text-white font-mono">
              System Overview
            </h2>
            <p className="text-xs font-mono text-blue-400 mt-1">
              /// STATUS: ONLINE ///
            </p>
          </div>
          <div className="hidden md:block text-right font-mono text-[10px] text-gray-500">
            <div>LOC: HAZARIBAGH, IN</div>
            <div>UPTIME: 99.9%</div>
          </div>
        </div>

        {/* 4-Column Strict Rectangular Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rows-[auto_auto_auto] gap-4">
          
          {/* Card 1: Left Bio / Operator Card (spans 2 cols, 2 rows) */}
          <TerminalCard className="lg:col-span-2 lg:row-span-2 h-min-64" delay={0}>
            <div className="flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="relative">
                  <div className="w-20 h-20 border border-white/20 p-1 bg-black">
                    <img
                      src="/images/profile/akash.png"
                      alt="Akash Kumar"
                      className="w-full h-full object-cover grayscale"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/hero.png';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 text-[10px] font-mono bg-blue-600 text-black px-1 font-bold">
                    OP_ID: AKASH
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500 font-mono">ROLE_DEFINITION</div>
                  <h3 className="text-xl font-bold uppercase font-mono text-white">Full Stack Engineer</h3>
                  <div className="flex gap-2 justify-end items-center mt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-green-400">AVAILABLE FOR HIRE</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-blue-500/30 pl-4 font-sans">
                  I don&apos;t just write code; I engineer resilient systems. From architectural blueprints to high-stress production environments, I handle the full lifecycle. Specializing in{' '}
                  <span className="text-white font-semibold">MERN Stack</span>,{' '}
                  <span className="text-white font-semibold">Next.js</span>, and{' '}
                  <span className="text-white font-semibold">Scalable Backend Infrastructure</span>.
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex gap-4 font-mono text-xs text-gray-500">
                <div>&gt; EXP_LEVEL: PRODUCTION READY</div>
                <div>&gt; PROJECT_COUNT: 15+</div>
              </div>
            </div>
          </TerminalCard>

          {/* Card 2: Phase I: ARCHITECTURE */}
          <TerminalCard className="lg:col-span-1 h-48" delay={0.1}>
            <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600">SYS_01</div>
            <h4 className="text-sm font-bold text-blue-400 mb-2 font-mono">PHASE I: ARCHITECTURE</h4>
            <div className="flex items-center justify-center h-20 border border-dashed border-white/20 my-2 bg-white/5 relative overflow-hidden">
              <svg className="w-12 h-12 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              {/* Subtle animated scan beam across blueprint */}
              <motion.div
                className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent pointer-events-none"
                animate={{ x: [-120, 240] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-2 leading-tight">
              &gt; Schema Design (SQL/NoSQL)<br />
              &gt; API Contract Definition<br />
              &gt; Component Atomic Structure
            </p>
          </TerminalCard>

          {/* Card 3: Phase II: CORE DEV */}
          <TerminalCard className="lg:col-span-1 h-48" delay={0.2}>
            <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600">SYS_02</div>
            <h4 className="text-sm font-bold text-yellow-400 mb-2 font-mono">PHASE II: CORE DEV</h4>
            <div className="h-20 bg-black border border-gray-800 p-2 relative overflow-hidden">
              <LiveCodeTerminal />
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </div>
            <div className="flex gap-2 mt-3 font-mono">
              {['React', 'Node', 'Next', 'TS'].map((tech) => (
                <span key={tech} className="text-[9px] bg-white/10 px-1 text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
          </TerminalCard>

          {/* Card 4: Phase III: STRESS TEST */}
          <TerminalCard className="lg:col-span-1 h-48" delay={0.3}>
            <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600">SYS_03</div>
            <h4 className="text-sm font-bold text-red-400 mb-2 font-mono">PHASE III: STRESS TEST</h4>
            <div className="h-20 bg-red-900/10 border border-red-500/20 relative">
              <StressWaveform />
              <div className="absolute top-1 right-1 text-[8px] text-red-500 font-mono animate-pulse">
                CRITICAL LOAD
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-2 leading-tight">
              &gt; Latency Checks<br />
              &gt; Load Balancing<br />
              &gt; Jest / Cypress Integration
            </p>
          </TerminalCard>

          {/* Card 5: Phase IV: DEPLOY */}
          <TerminalCard className="lg:col-span-1 h-48" delay={0.4}>
            <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600">SYS_04</div>
            <h4 className="text-sm font-bold text-green-400 mb-2 font-mono">PHASE IV: DEPLOY</h4>
            <div className="flex justify-between items-center h-20 bg-green-900/5 border border-green-500/10 px-4">
              <div className="text-[10px] font-mono text-green-500 leading-tight">
                STATUS: LIVE<br />
                PORT: 3000<br />
                SSL: TRUE
              </div>
              <EqualizerMeters />
            </div>
            <div className="mt-2 w-full bg-gray-800 h-1 overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: 'linear' }}
              />
            </div>
          </TerminalCard>

          {/* Card 6: TELEMETRY DATA */}
          <TerminalCard className="lg:col-span-2 lg:col-start-1 row-start-3 lg:row-auto" delay={0.5}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white font-mono">TELEMETRY DATA</h4>
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-white rounded-full" />
                <span className="w-1 h-1 bg-white rounded-full opacity-50" />
                <span className="w-1 h-1 bg-white rounded-full opacity-25" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 divide-x divide-white/10">
              <div className="text-center">
                <div className="text-2xl font-mono text-white font-bold">2000+</div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1 font-mono">
                  Req / Sec
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono text-white font-bold">10k+</div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1 font-mono">
                  Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono text-white font-bold">99.9%</div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1 font-mono">
                  Uptime
                </div>
              </div>
            </div>
          </TerminalCard>

          {/* Card 7: ESTABLISH UPLINK */}
          <TerminalCard className="lg:col-span-2 row-start-4 lg:row-auto" delay={0.6}>
            <h4 className="text-sm font-bold text-white mb-4 font-mono">ESTABLISH UPLINK</h4>
            <div className="flex gap-4 h-full items-center">
              <a
                href="/resume/AKASH_KUMAR_RESUME.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="AKASH_KUMAR_RESUME.pdf"
                className="flex-1 bg-white text-black h-12 flex items-center justify-center font-bold font-mono text-xs uppercase hover:bg-blue-500 hover:text-white transition-colors cursor-pointer"
              >
                Init_Download [CV]
              </a>
              <button
                onClick={handleCopyEmail}
                className="flex-1 border border-white/20 text-white h-12 flex items-center justify-center font-mono text-xs uppercase hover:bg-white/5 transition-colors relative overflow-hidden cursor-pointer"
              >
                {copied ? (
                  <span className="text-green-500">&gt;&gt; TRANSMISSION COMPLETE</span>
                ) : (
                  <span className="animate-pulse">&gt;&gt; COPY_SECURE_ID [EMAIL]</span>
                )}
              </button>
            </div>
          </TerminalCard>

        </div>
      </div>
    </section>
  );
}
