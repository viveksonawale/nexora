"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Trophy, Sparkles, Info } from "lucide-react";
import { ShinyButton } from "./ShinyButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const pathname = usePathname();

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

  const navLinks = [
    { label: "Hackathons", href: "/hackathons", icon: Trophy },
    { label: "Features", href: "/#features", icon: Sparkles },
    { label: "About", href: "/about", icon: Info },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-300 ease-out ${
          scrolled
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
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-[#121110] font-display font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
                N
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
                Nexora
              </span>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex flex-none items-center gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inverse)]/5 transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inverse)]/5 transition-all rounded-full cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            
            <button onClick={() => setIsAuthOpen(true)} className="inline-block">
              <ShinyButton variant="primary" size="md">
                Sign Up
              </ShinyButton>
            </button>
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
