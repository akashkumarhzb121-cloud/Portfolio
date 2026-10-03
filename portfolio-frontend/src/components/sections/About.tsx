import TextScatter from '@/components/effects/TextScatter';
import Lanyard from '@/components/effects/Lanyard';
import { Download, CheckCircle2, ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <section
      id="about"
      className="section-wrapper relative bg-transparent text-white transition-colors duration-500 overflow-hidden"
      aria-label="About Akash Kumar and Resume"
    >

      <div className="site-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Biography and Career Positioning */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              <TextScatter>Curious by default.</TextScatter>
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              <p>
                I’m <strong className="text-white font-semibold">Akash Kumar</strong>, a full-stack engineer and creative developer based in India. I build web applications that combine clean architecture with interactive, motion-driven frontends.
              </p>
              <p>
                Focused on React, TypeScript, Node.js, and WebGL—I construct end-to-end applications where intuitive user experiences are backed by resilient Node/Express APIs and scalable MongoDB/SQL databases.
              </p>
            </div>

            {/* Core Competency Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/[0.08]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Full-Stack</h3>
                  <p className="text-xs text-slate-400 mt-0.5">React, Node.js, Express, TypeScript, REST APIs.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Databases</h3>
                  <p className="text-xs text-slate-400 mt-0.5">MongoDB Atlas, Mongoose, SQL schemas.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Motion & 3D</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Three.js, WebGL, Rapier physics, GSAP.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Tools & Cloud</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Git, GitHub, Vercel, Render, Cloudinary.</p>
                </div>
              </div>
            </div>

            {/* Direct Resume Download & Contact Links */}
            <div className="flex flex-wrap items-center gap-4 mt-10">
              <a
                href="/resume/AKASH_KUMAR_RESUME.pdf"
                download="AKASH_KUMAR_RESUME.pdf"
                className="px-7 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.3)] transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Resume (PDF)</span>
              </a>

              <a
                href="#contact"
                className="px-6 py-3.5 rounded-full border border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-white text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <span>Get in touch</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </a>
            </div>
          </div>

          {/* Interactive Lanyard Card Column */}
          <div className="lg:col-span-5 flex justify-center">
            <Lanyard resumeUrl="/resume/AKASH_KUMAR_RESUME.pdf" />
          </div>
        </div>
      </div>
    </section>
  );
}