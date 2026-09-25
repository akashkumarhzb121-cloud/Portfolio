import { ArrowUpRight, FolderGit2, Code2, CheckCircle2 } from 'lucide-react';
import TextScatter from '@/components/effects/TextScatter';
import ScrollStack, { ScrollStackItem } from '@/components/effects/ScrollStack';
import { projects } from '@/data/projects';

export default function Projects() {
  return (
    <section
      id="projects"
      className="section-wrapper relative bg-transparent text-white transition-colors duration-500 overflow-hidden pb-16 md:pb-24"
      aria-label="Featured Projects"
    >

      <div className="site-container mb-12 sm:mb-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-cyan-400 border border-cyan-500/30 font-mono text-xs uppercase tracking-widest shadow-md">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>02 · Selected Work</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              <TextScatter>Projects</TextScatter>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              A curated collection of production applications, full-stack cloud platforms, and interactive 3D experiments crafted with obsessive attention to detail.
            </p>
          </div>

          <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-widest hidden md:block">
            Scroll to inspect stack (04 Full-Scale Systems)
          </div>
        </div>
      </div>

      <div className="site-container relative z-10">
        {/* React Bits ScrollStack with Lenis inertial smooth scrolling */}
        <ScrollStack
          useWindowScroll={true}
          stackPosition="12%"
          scaleEndPosition="6%"
          itemDistance={360}
          itemStackDistance={0}
          itemScale={0}
          baseScale={1}
        >
          {projects.map((project) => (
            <ScrollStackItem
              key={project.id}
              itemClassName="w-full rounded-2xl md:rounded-3xl bg-[#0c0c0e]/95 border border-white/[0.12] hover:border-cyan-400/40 shadow-[0_-20px_50px_rgba(0,0,0,0.9),0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden transition-colors duration-200 group backdrop-blur-xl"
            >
              <article className="w-full h-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px] lg:h-[72vh] lg:min-h-[560px] max-h-[720px]">
                  {/* Visual Image Preview with Fallback */}
                  <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] lg:min-h-full overflow-hidden bg-slate-950">
                    <img
                      src={project.image}
                      alt={`Interface preview of ${project.title}`}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.style.background = project.fallbackGradient;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0c0c0e]" />

                    {/* Corner Project Index */}
                    <div className="absolute top-6 left-6 font-mono text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-[#050505]/85 backdrop-blur-md border border-white/10 text-cyan-400 shadow-md">
                      CASE {project.number}
                    </div>
                  </div>

                  {/* Content & Metadata */}
                  <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                          {project.category || 'Featured Application'}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                        {project.title}
                      </h3>

                      <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                        {project.description}
                      </p>

                      {/* Architecture / Performance Highlights */}
                      {project.highlights && project.highlights.length > 0 && (
                        <div className="mt-5 space-y-2.5 pt-4 border-t border-white/[0.08]">
                          {project.highlights.map((highlight, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                              <span>{highlight}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Technology tags */}
                      <div className="flex flex-wrap gap-2 mt-6">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(103,232,249,0.3)] hover:scale-105"
                          aria-label={`View live demo of ${project.title}`}
                        >
                          <span>Live Demo</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all"
                          aria-label={`View GitHub source code of ${project.title}`}
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Source</span>
                        </a>
                      </div>

                      <span className="font-mono text-xs text-slate-500 font-bold">
                        #{project.number}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>
    </section>
  );
}