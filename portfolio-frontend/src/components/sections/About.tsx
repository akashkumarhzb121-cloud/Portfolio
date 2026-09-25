import TextScatter from '@/components/effects/TextScatter';
import Lanyard from '@/components/effects/Lanyard';
import { User, Download, CheckCircle2, ArrowRight } from 'lucide-react';

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
            <div className="eyebrow-badge">
              <User className="w-3.5 h-3.5" />
              <span>04 · About & Experience</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              <TextScatter>Curious by default.</TextScatter>
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              <p>
                I’m <strong className="text-white font-semibold">Akash Kumar</strong>, a full-stack engineer and creative developer who bridges the gap between interactive frontend craftsmanship and robust backend architecture.
              </p>
              <p>
                With strong grounding in computer science fundamentals—data structures, algorithms, object-oriented design, and database systems—I construct end-to-end applications where intuitive user experiences are backed by resilient Node/Express APIs and scalable MongoDB/SQL databases.
              </p>
              <p>
                I prioritize clean modular code, strict TypeScript typing, sub-second API response times, and accessible micro-interactions that make every application a delight to use.
              </p>
            </div>

            {/* Core Competency Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/[0.08]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Full-Stack Engineering</h3>
                  <p className="text-xs text-slate-400 mt-0.5">React, Node.js, Express, TypeScript, and REST APIs.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Databases & Architecture</h3>
                  <p className="text-xs text-slate-400 mt-0.5">MongoDB Atlas, Mongoose, SQL schema design, and RBAC.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Creative Motion & 3D</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Three.js, WebGL shaders, OGL, and GSAP timelines.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white">Cloud, Tools & CI/CD</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Git, GitHub Actions, Postman, Vercel, Render, and Cloudinary.</p>
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
                <span>Download Resume (PDF)</span>
              </a>

              <a
                href="#contact"
                className="px-6 py-3.5 rounded-full border border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-white text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <span>Let's collaborate</span>
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