import { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import JellyRadio from '@/components/effects/JellyRadio';
import { navigation } from '@/data/navigation';

export default function Header() {
  const [activeSection, setActiveSection] = useState('Home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sectionIds = navigation.map(item => item.href.replace('#', ''));
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const element = document.getElementById(id);
        if (element && element.offsetTop <= scrollPosition) {
          const matchedItem = navigation.find(item => item.href === `#${id}`);
          if (matchedItem) {
            setActiveSection(matchedItem.label);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (label: string) => {
    const item = navigation.find(n => n.label === label);
    if (!item) return;

    setActiveSection(label);
    setIsMobileMenuOpen(false);

    const targetId = item.href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050505]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="site-container flex items-center justify-between">
        {/* Monogram Brand */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('Home');
          }}
          className="group flex items-center gap-1 text-xl font-extrabold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-cyan-400 rounded-lg p-1"
          aria-label="Akash Kumar - Return to top"
        >
          <span className="group-hover:text-cyan-400 transition-colors">AK</span>
          <span className="text-cyan-400 group-hover:scale-125 transition-transform inline-block"></span>
        </a>

        {/* Desktop Navigation using JellyRadio effect */}
        <nav className="hidden md:flex items-center" aria-label="Main Navigation">
          <JellyRadio
            items={navigation.map(item => item.label)}
            value={activeSection}
            onChange={(val) => handleNavClick(val)}
            chipColor="rgba(255, 255, 255, 0.04)"
            activeColor="#67e8f9"
            textColor="#94a3b8"
            activeTextColor="#050505"
            size="md"
            ariaLabel="Site sections"
          />
        </nav>

        {/* Right Action / Contact CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('Contact');
            }}
            className="group px-4 py-2 rounded-full border border-white/[0.14] hover:border-cyan-400/50 bg-white/[0.03] hover:bg-cyan-400/[0.08] text-xs font-semibold tracking-wide text-white transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(103,232,249,0.2)]"
          >
            <span>Let's talk</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-cyan-400"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 py-6 mt-3 bg-[#0a0a0c]/95 backdrop-blur-2xl border-b border-white/[0.1] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => {
              const isActive = activeSection === item.label;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.label);
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#67e8f9]" />}
                </a>
              );
            })}
            <div className="pt-4 mt-2 border-t border-white/[0.08]">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('Contact');
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(103,232,249,0.3)]"
              >
                <span>Let's talk</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}