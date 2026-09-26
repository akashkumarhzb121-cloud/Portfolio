import { socialLinks } from '@/data/socialLinks';
import { navigation } from '@/data/navigation';
import { Mail, ArrowUp } from 'lucide-react';

function SocialIcon({ iconName }: { iconName: string }) {
  switch (iconName) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-pink-600 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'mail':
      return <Mail className="w-3.5 h-3.5 text-cyan-600" />;
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-slate-900">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-blue-600">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.59 1.59 0 1 0 0-3.18 1.59 1.59 0 0 0 0 3.18m1.4 9.74v-8.37H5.06v8.37h2.8z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-slate-800">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="relative bg-[#f8fafc] text-slate-800 pt-0 overflow-hidden" aria-label="Site Footer">
      {/* Footer 2: Curved SVG Visual Overlay transitioning seamlessly from dark contact section to white footer */}
      <div className="w-full overflow-hidden leading-none rotate-180 -mb-1 bg-[#f8fafc]" aria-hidden="true">
        <svg
          viewBox="0 0 1440 90"
          className="w-full h-12 sm:h-16 md:h-20 text-[#050505] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C480,90 960,90 1440,0 L1440,90 L0,90 Z" />
        </svg>
      </div>

      {/* Atmospheric subtle radial mesh background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.06)_0%,transparent_65%)]"
        aria-hidden="true"
      />

      <div className="site-container relative z-10 pt-12 pb-16">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* AK Brand Monogram */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-500 p-0.5 shadow-md mb-6">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-cyan-400">
              AK<span className="text-purple-400"></span>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Akash Kumar
          </h3>

          <p className="mt-2 text-sm text-slate-600 max-w-md font-normal leading-relaxed">
            Full-stack & creative developer crafting expressive, performant interfaces where motion and modern engineering work together.
          </p>

          {/* Quick Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 my-8 text-xs font-semibold uppercase tracking-wider text-slate-600" aria-label="Footer navigation">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-cyan-600 transition-colors focus-visible:outline-2 focus-visible:outline-cyan-500 rounded"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Social Links Pill Bar matching Services clean white styling */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200/90 hover:border-cyan-500/50 shadow-sm text-xs font-medium text-slate-700 hover:text-slate-950 transition-all flex items-center gap-2 hover:scale-105"
                aria-label={link.label}
              >
                <SocialIcon iconName={link.iconName} />
                <span>{link.label}</span>
              </a>
            ))}
          </div>

          {/* Back to top button */}
          <button
            type="button"
            onClick={scrollToTop}
            className="p-3 rounded-full border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:scale-110 mb-8"
            aria-label="Back to top of page"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Akash Kumar. All rights reserved.</p>
          <p>Full-Stack Architecture · React · Node.js · Express · MongoDB</p>
        </div>
      </div>
    </footer>
  );
}