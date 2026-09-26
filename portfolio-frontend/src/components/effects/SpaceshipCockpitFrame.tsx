export default function SpaceshipCockpitFrame() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Cockpit Windshield Bevel / Curved Canopy Frame (Clean, Visible, No Corner Boxes) */}
      <div className="absolute inset-2 sm:inset-4 md:inset-6 rounded-2xl md:rounded-3xl border border-cyan-400/35 sm:border-2 sm:border-cyan-400/40 shadow-[inset_0_0_80px_rgba(0,0,0,0.85),0_0_25px_rgba(103,232,249,0.18)]">
        {/* Top Canopy Visor / Indicator LEDs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2.5 sm:h-3.5 px-8 sm:px-16 bg-[#0a0e17]/90 border-b border-x border-cyan-500/40 rounded-b-xl flex items-center gap-3 shadow-[0_4px_12px_rgba(103,232,249,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#67e8f9] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a78bfa] animate-pulse" />
        </div>

        {/* Glass Windshield Diagonal Reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.04] via-transparent to-purple-500/[0.02] opacity-70" />
      </div>

      {/* 2. Cockpit Canopy Side Pillars (Clean, without text or corner blocks) */}
      <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-[#030408]/90 via-[#0a0e17]/60 to-transparent border-r border-white/[0.05]" />
      <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-[#030408]/90 via-[#0a0e17]/60 to-transparent border-l border-white/[0.05]" />

      {/* 3. Central Flight Vector Crosshair / Reticle (Where stars emerge) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-72 h-48 sm:h-72 rounded-full border border-cyan-400/10 flex items-center justify-center opacity-40">
        <div className="w-24 sm:w-36 h-24 sm:h-36 rounded-full border border-cyan-400/15 border-dashed animate-[spin_60s_linear_infinite]" />
        {/* Crosshair ticks */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
        <div className="w-3 h-3 rounded-full border border-cyan-400/40" />
      </div>
    </div>
  );
}
