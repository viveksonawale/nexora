"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Moon, Sun, Trophy, Sparkles, Info, LogOut, LayoutDashboard, Shield, Clock, AlertCircle } from "lucide-react";
import { ShinyButton } from "./ShinyButton";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "./AuthModal";
import { useSession } from "@/lib/contexts/SessionContext";
import { apiFetch } from "@/lib/api-client";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";

function NavbarContent() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("signup");
  const [returnUrl, setReturnUrl] = useState<string | undefined>(undefined);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshSession } = useSession();

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

  // Handle URL query parameters for auth popup routing (?auth=login or ?auth=signup)
  useEffect(() => {
    const authQuery = searchParams.get("auth");
    const ret = searchParams.get("returnUrl");
    if (ret) setReturnUrl(ret);

    if (authQuery === "login") {
      setAuthTab("login");
      setIsAuthOpen(true);
    } else if (authQuery === "signup") {
      setAuthTab("signup");
      setIsAuthOpen(true);
    }
  }, [searchParams]);

  // Listen for open-auth-modal custom event
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: "login" | "signup"; returnUrl?: string }>;
      if (customEvent.detail?.tab) {
        setAuthTab(customEvent.detail.tab);
      }
      if (customEvent.detail?.returnUrl) {
        setReturnUrl(customEvent.detail.returnUrl);
      }
      setIsAuthOpen(true);
    };
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

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best effort
    }
    await refreshSession();
    router.push("/");
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    if (searchParams.get("auth")) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("auth");
      router.replace(currentUrl.pathname + (currentUrl.search ? currentUrl.search : ""), { scroll: false });
    }
  };

  const isHackathonSubpage = pathname.startsWith("/hackathons/") && pathname.split("/").filter(Boolean).length >= 2;
  const isHiddenOnSubpage = isHackathonSubpage && scrolled;
  const isDarkHeroTop = (pathname === "/" || isHackathonSubpage) && !scrolled;

  const getDashboardLink = () => {
    if (!user) return "/hackathons";
    if (user.platformRole === "SUPER_ADMIN") return "/admin";

    // If verification is pending, only students skip to dashboard
    if (user.onboardingStatus === "PENDING_VERIFICATION") {
      const isStudent =
        user.requestedRole === "STUDENT" ||
        (!user.requestedRole && user.platformRole === "USER");
      return isStudent ? "/student" : "/onboarding/pending";
    }

    if (user.onboardingStatus === "REJECTED" || !user.onboardingStatus || user.onboardingStatus === "NOT_STARTED") {
      return "/onboarding";
    }

    if (user.staffRoles && user.staffRoles.some(s => s.role === "JUDGE")) return "/judge/assignments";
    if ((user.orgMemberships && user.orgMemberships.length > 0) || (user.staffRoles && user.staffRoles.length > 0)) {
      return "/dashboard";
    }
    return "/student";
  };

  const getDashboardLabel = () => {
    if (!user) return "Dashboard";
    if (user.platformRole === "SUPER_ADMIN") return "Admin";

    if (user.onboardingStatus === "PENDING_VERIFICATION") {
      const isStudent =
        user.requestedRole === "STUDENT" ||
        (!user.requestedRole && user.platformRole === "USER");
      return isStudent ? "Dashboard" : "Pending";
    }

    if (user.onboardingStatus === "REJECTED") {
      return "Onboarding";
    }

    if (user.onboardingStatus !== "VERIFIED") {
      return "Get Started";
    }

    if (user.staffRoles && user.staffRoles.some(s => s.role === "JUDGE")) return "Judging";
    if ((user.orgMemberships && user.orgMemberships.length > 0) || (user.staffRoles && user.staffRoles.length > 0)) {
      return "Organizer";
    }
    return "Dashboard";
  };

  // Do not render floating public Navbar on internal dashboard views
  // (Admin, Organizer Dashboard, Judge Portal, Student Dashboard have their own dedicated headers & sidebars)
  const isDashboardRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/judge") ||
    pathname.startsWith("/student");

  if (isDashboardRoute) return null;

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
                <Image src="/logo/logo.png" alt="Nexora Logo" width={36} height={36} className="object-contain" priority />
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
          <div className="flex-1 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`hidden md:flex p-2.5 transition-all rounded-full cursor-pointer ${
                isDarkHeroTop
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-[var(--text-primary)] hover:text-[#F97316] hover:bg-[var(--bg-inverse)]/5"
              }`}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationDropdown />
                <Link href={getDashboardLink()}>
                  <ShinyButton variant="secondary" size="md" className="gap-1.5 py-2 px-3.5">
                    {user.platformRole === "SUPER_ADMIN" ? (
                      <Shield size={15} className="text-[#F97316]" />
                    ) : user.onboardingStatus === "PENDING_VERIFICATION" ? (
                      <Clock size={15} className="text-amber-500" />
                    ) : user.onboardingStatus === "REJECTED" ? (
                      <AlertCircle size={15} className="text-red-500" />
                    ) : (
                      <LayoutDashboard size={15} className="text-[#F97316]" />
                    )}
                    <span>{getDashboardLabel()}</span>
                  </ShinyButton>
                </Link>
                <ShinyButton 
                  variant="primary" 
                  size="md"
                  onClick={handleLogout}
                  className="gap-1.5 py-2 px-3.5"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Log Out</span>
                </ShinyButton>
              </div>
            ) : (
              <ShinyButton 
                variant="primary" 
                size="md"
                onClick={() => {
                  setAuthTab("signup");
                  setIsAuthOpen(true);
                }}
              >
                Sign Up
              </ShinyButton>
            )}
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
          type="button"
          onClick={toggleTheme}
          className="flex flex-shrink-0 items-center justify-center w-11 h-11 rounded-full bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-all ml-1"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleCloseAuth}
        initialTab={authTab}
        returnUrl={returnUrl}
      />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
