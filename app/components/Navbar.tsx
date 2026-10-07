"use client";

import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Trophy, Sparkles, Info } from "lucide-react";
import { ShinyButton } from "./ShinyButton";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Hackathons", href: "/hackathons", icon: Trophy },
    { label: "Features", href: "/features", icon: Sparkles },
    { label: "About", href: "/about", icon: Info },
  ];

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [tabStyle, setTabStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [activeTab, setActiveTab] = useState(-1);

  useEffect(() => {
    let current = navLinks.findIndex(item => {
      const base = item.href.split("#")[0] || "/";
      return pathname === base || (base !== "/" && pathname.startsWith(base));
    });
    setActiveTab(current);
  }, [pathname]);

  useEffect(() => {
    if (activeTab >= 0 && tabRefs.current[activeTab]) {
      const el = tabRefs.current[activeTab];
      if (el) {
        setTabStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
      }
    } else {
      setTabStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [activeTab, scrolled]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOpenAuth = () => setIsAuthOpen(true);
    window.addEventListener("open-auth-modal", handleOpenAuth);
    return () => window.removeEventListener("open-auth-modal", handleOpenAuth);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexora-theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        setTheme(current);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("nexora-theme", nextTheme);
    } catch {
      // Ignore if localStorage unavailable
    }
  };

  const isHackathonSubpage = pathname.startsWith("/hackathons/") && pathname.split("/").filter(Boolean).length >= 2;
  const isHiddenOnSubpage = isHackathonSubpage && scrolled;
  const isDarkHeroTop = (pathname === "/" || isHackathonSubpage) && !scrolled;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-300 ease-out ${
          isHiddenOnSubpage ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        } ${
          scrolled && !isHiddenOnSubpage
            ? "pt-3 px-4 pointer-events-none"
            : "pt-0 px-0"
        }`}
      >
        <nav
          className={`relative w-full flex items-center justify-between transition-all duration-300 ease-out pointer-events-auto ${
            scrolled
              ? "max-w-5xl h-16 px-8 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur-xl shadow-xl shadow-black/20"
              : "max-w-7xl h-24 px-6 md:px-12 bg-transparent border border-transparent"
          }`}
        >
          {/* Left: Brand / Logo */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image src="/logo/logo.png" alt="Nexora Logo" width={36} height={36} className="object-contain" />
              </div>
              <span className={`font-display font-extrabold text-xl tracking-tight transition-colors ${isDarkHeroTop ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                Nexora
              </span>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex flex-none items-center relative h-full">
            <span
              style={{
                position: 'absolute',
                left: tabStyle.left,
                width: tabStyle.width,
                height: '40px',
                top: '50%',
                marginTop: '-20px',
                backgroundColor: isDarkHeroTop ? 'rgba(255, 255, 255, 0.1)' : 'var(--text-primary)',
                opacity: tabStyle.opacity ? (isDarkHeroTop ? 1 : 0.05) : 0,
                borderRadius: '9999px',
                transition: 'left .4s cubic-bezier(.65,0,.35,1), width .4s cubic-bezier(.65,0,.35,1), opacity .4s ease',
                pointerEvents: 'none'
              }}
            />
            <div className="flex items-center gap-1">
              {navLinks.map((item, i) => {
                const isActive = activeTab === i;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setActiveTab(i)}
                    ref={(el) => { tabRefs.current[i] = el; }}
                    className={`px-5 py-2.5 rounded-full text-base font-semibold tracking-wide transition-colors duration-400 z-10 focus:outline-none ${
                      isDarkHeroTop
                        ? isActive ? "text-white" : "text-white/70 hover:text-white"
                        : isActive ? "text-[#F97316]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`hidden md:flex p-2.5 transition-all rounded-full cursor-pointer ${
                isDarkHeroTop
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-[var(--text-primary)] hover:text-[#F97316] hover:bg-[var(--bg-inverse)]/5"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            
            <ShinyButton 
              variant="primary" 
              size="md"
              onClick={() => setIsAuthOpen(true)}
            >
              Sign Up
            </ShinyButton>
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[100] bg-[var(--bg-elevated)]/80 backdrop-blur-2xl border border-[var(--border)] rounded-full shadow-2xl shadow-black/20 p-1.5 flex items-center justify-between">
        {navLinks.map((item) => {
          const isActive = pathname === item.href.replace("/#", "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 items-center justify-center h-11 px-3 rounded-full transition-all text-xs font-bold tracking-wide ${
                isActive 
                  ? "bg-[var(--bg-canvas)] text-[#F97316] shadow-sm border border-[var(--border)]" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        
        <div className="w-px h-6 bg-[var(--border)] mx-1"></div>
        
        <button
          onClick={toggleTheme}
          className="flex flex-shrink-0 items-center justify-center w-11 h-11 rounded-full bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-all ml-1"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
