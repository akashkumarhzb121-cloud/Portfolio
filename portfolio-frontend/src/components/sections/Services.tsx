import TextScatter from '@/components/effects/TextScatter';
import AccordionGallery from '@/components/effects/AccordionGallery';
import BendingMarquee from '@/components/effects/BendingMarquee';
import { services } from '@/data/services';
import { CheckCircle2 } from 'lucide-react';

export default function Services() {
  return (
    <section
      id="services"
      className="relative text-slate-900 transition-colors duration-500 overflow-hidden pt-0 pb-0"
      aria-label="Capabilities and Services"
    >
      {/* Curved SVG Visual Overlay transitioning smoothly from dark Projects into light Services */}
      <div className="w-full overflow-hidden leading-none -mt-1 bg-transparent relative" aria-hidden="true">
        <svg
          viewBox="0 0 1440 90"
          className="relative z-10 w-full h-12 sm:h-16 md:h-20 text-[#f8fafc] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,90 C480,0 960,0 1440,90 L1440,90 L0,90 Z" />
        </svg>
      </div>

      <div className="relative bg-[#f8fafc]">
        {/* Light subtle ambient glow */}
        <div
          className="pointer-events-none absolute top-10 left-10 w-[500px] h-[500px] bg-gradient-to-br from-cyan-100/50 via-sky-100/40 to-transparent blur-[120px] rounded-full"
          aria-hidden="true"
        />

      <div className="site-container pt-10 sm:pt-14 mb-10 sm:mb-14 relative z-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
            <TextScatter>Services</TextScatter>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
            From design systems and micro-interactions to scalable Node.js REST APIs and MongoDB data layers. Every service is delivered with production-grade reliability and strict clean-code principles.
          </p>
        </div>
      </div>

      {/* Accordion Gallery with 5 full-stack services */}
      <div className="site-container mb-14 relative z-10">
        <AccordionGallery
          items={services}
          defaultIndex={0}
          height={480}
          expandRatio={0.46}
          tilt={6}
          parallax={0.4}
          accentColor="#06b6d4"
          overlayColor="#0a0f1d"
        />

        {/* Deliverables summary grid for all 5 services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 pt-8 border-t border-slate-200/80">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs text-cyan-600 font-bold uppercase tracking-wider">
                  0{service.number}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="#contact"
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1"
                >
                  <span>Get in touch</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bending Marquee flowing along a curved SVG path */}
      <div className="mt-4">
        <BendingMarquee
          text=" FULL-STACK · ⚛️ React · 💻 TypeScript · 🟢 Node.js · 🍃 MongoDB · 📝 Express.js · 🌐 Three.js · 🪄 GSAP "
          color="#0284c7"
          speed={1.8}
        />
      </div>

      {/* Curved SVG Visual Overlay transitioning smoothly from light Services into dark About */}
      <div className="w-full overflow-hidden leading-none -mb-1 mt-12 bg-[#f8fafc]" aria-hidden="true">
        <svg
          viewBox="0 0 1440 90"
          className="w-full h-12 sm:h-16 md:h-20 text-[#050505] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,90 C480,0 960,0 1440,90 L1440,90 L0,90 Z" />
        </svg>
      </div>
    </div>
    </section>
  );
}