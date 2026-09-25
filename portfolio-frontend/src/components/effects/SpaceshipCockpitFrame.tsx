export default function SpaceshipCockpitFrame() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Cockpit Windshield Bevel / Canopy Frame Outline */}
      <div className="absolute inset-2 sm:inset-4 md:inset-6 rounded-2xl md:rounded-3xl border border-cyan-500/20 shadow-[inset_0_0_80px_rgba(0,0,0,0.85),0_0_30px_rgba(103,232,249,0.05)]">
        {/* Chamfered Tech Brackets at 4 Corners */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400/70" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400/70" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400/70" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400/70" />

        {/* Top Canopy Visor / Indicator LEDs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 sm:h-3 px-8 sm:px-16 bg-[#0a0e17]/90 border-b border-x border-cyan-500/30 rounded-b-xl flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#67e8f9] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a78bfa] animate-pulse" />
        </div>

        {/* Glass Windshield Diagonal Reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.04] via-transparent to-purple-500/[0.02] opacity-70" />
      </div>

      {/* 2. Cockpit Canopy Side Pillars (Left & Right Struts) */}
      <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-[#030408]/90 via-[#0a0e17]/60 to-transparent border-r border-white/[0.05]">
        <div className="h-full flex flex-col justify-around py-24 opacity-30 text-[9px] font-mono text-cyan-300 writing-vertical-lr tracking-widest pl-1">
          <span>PORT STRUT // SEC-01</span>
          <span>HULL REINFORCED</span>
        </div>
      </div>
      <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-[#030408]/90 via-[#0a0e17]/60 to-transparent border-l border-white/[0.05]">
        <div className="h-full flex flex-col justify-around py-24 opacity-30 text-[9px] font-mono text-cyan-300 writing-vertical-lr tracking-widest pl-1">
          <span>STARBOARD // SEC-02</span>
          <span>SHIELDS OPTIMAL</span>
        </div>
      </div>

      {/* 3. Central Flight Vector Crosshair / Reticle (Where stars emerge) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-72 h-48 sm:h-72 rounded-full border border-cyan-400/10 flex items-center justify-center opacity-40">
        <div className="w-24 sm:w-36 h-24 sm:h-36 rounded-full border border-cyan-400/15 border-dashed animate-[spin_60s_linear_infinite]" />
        {/* Crosshair ticks */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
        <div className="w-3 h-3 rounded-full border border-cyan-400/40" />
      </div>

      {/* 4. Spaceship HUD Corner Telemetry */}
      {/* Top Left */}
      <div className="hidden sm:flex absolute top-5 md:top-8 left-5 md:left-9 items-center gap-2 font-mono text-[10px] text-cyan-400/70 tracking-widest uppercase bg-[#050505]/75 px-3 py-1.5 rounded-lg border border-cyan-500/20 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>NAV // HYPERDRIVE: 0.94c</span>
      </div>

      {/* Top Right */}
      <div className="hidden sm:flex absolute top-5 md:top-8 right-5 md:right-9 items-center gap-2 font-mono text-[10px] text-slate-400/70 tracking-widest uppercase bg-[#050505]/75 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>SECTOR: DEEP-SPACE // GRID: ONLINE</span>
      </div>

      {/* Bottom Left */}
      <div className="hidden md:flex absolute bottom-5 md:bottom-8 left-5 md:left-9 items-center gap-2 font-mono text-[10px] text-slate-400/70 tracking-widest uppercase bg-[#050505]/75 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
        <span>CABIN: 1.0 ATM · STABILIZERS: ON</span>
      </div>

      {/* Bottom Right */}
      <div className="hidden md:flex absolute bottom-5 md:bottom-8 right-5 md:right-9 items-center gap-2 font-mono text-[10px] text-cyan-400/70 tracking-widest uppercase bg-[#050505]/75 px-3 py-1.5 rounded-lg border border-cyan-500/20 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        <span>STARSHIP CONSOLE // VECTOR LOCKED</span>
      </div>
    </div>
  );
}
