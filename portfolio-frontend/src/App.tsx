import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import SystemOverview from "@/components/sections/SystemOverview";
import TechStack from "@/components/sections/TechStack";
import Projects from "@/components/sections/Projects";
import Services from "@/components/sections/Services";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";
import GlowCursor from "@/components/effects/GlowCursor";
import Chatbot from "@/components/ai/Chatbot";
import "@/styles/design-tokens.css";
import "@/styles/globals.css";

export default function App() {
  return (
    <TooltipProvider>
      <GlowCursor
        color="#67E8F9"
        secondaryColor="#A78BFA"
        trailLength={38}
        trailWidth={7}
        trailTaper={0.8}
        followSpeed={0.16}
        glowIntensity={1.8}
        glowSpread={1.2}
        hotspot={0.65}
        brightness={1.25}
        opacity={1}
        blendMode="screen"
      >
        <div className="site-shell relative min-h-screen bg-[#050505]">
          {/* Master Global 24px Grid: completely continuous, zero offset, zero seam across all sections */}
          <div
            className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0"
            aria-hidden="true"
          />

          <Header />
          <main
            className="relative z-10"
            style={{
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              willChange: 'transform'
            }}
          >
            {/* 1. Hero Section (#home) */}
            <Hero />

            {/* 2. System Overview Dashboard (#system-overview) */}
            <SystemOverview />

            {/* 3. Tech Stack Section (#tech-stack) */}
            <TechStack />

            {/* 4. Projects Section (#projects) */}
            <Projects />

            {/* 5. Services Section (#services) */}
            <Services />

            {/* 6. About / Resume Section (#about) */}
            <About />

            {/* 7. Contact Section (#contact) */}
            <Contact />
          </main>
          <Footer />
          <Chatbot />
          <Toaster richColors position="bottom-right" />
        </div>
      </GlowCursor>
    </TooltipProvider>
  );
}
