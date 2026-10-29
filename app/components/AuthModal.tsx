"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { ShinyButton } from "./ShinyButton";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "signup";
  returnUrl?: string;
}

export function AuthModal({ isOpen, onClose, initialTab = "signup", returnUrl }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [step, setStep] = useState<"form" | "success">("form");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");

  const { refreshSession, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setError(null);
    } else {
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => {
        setStep("form");
        setActiveTab(initialTab || "signup");
        setEmail("");
        setPassword("");
        setName("");
        setCollege("");
        setError(null);
      }, 200);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "signup") {
        // Normal signup with JWT - two-step verification is disabled
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });

        // Automatically log in newly created user
        await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        await refreshSession();
        setStep("success");
      } else {
        // Normal login using JWT
        await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        await refreshSession();
        setStep("success");
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/v1/auth/oauth/google/start";
  };

  const handleContinueAfterSuccess = () => {
    onClose();
    if (returnUrl) {
      router.push(returnUrl);
      return;
    }
    if (user?.platformRole === "SUPER_ADMIN") {
      router.push("/admin");
    } else if (user?.requestedRole === "STUDENT" || (!user?.requestedRole && user?.platformRole === "USER" && (!user?.orgMemberships || user.orgMemberships.length === 0))) {
      router.push("/student");
    } else if (!user?.onboardingStatus || user?.onboardingStatus === "NOT_STARTED") {
      router.push("/onboarding");
    } else if (user?.onboardingStatus === "PENDING_VERIFICATION") {
      router.push("/onboarding/pending");
    } else if (user?.onboardingStatus === "REJECTED") {
      router.push("/onboarding");
    } else if (user?.orgMemberships && user.orgMemberships.length > 0) {
      router.push("/dashboard");
    } else {
      router.push("/student");
    }
  };

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("TestPass123!");
    setActiveTab("login");
    setError(null);
  };

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-all cursor-pointer font-medium shadow-sm hover:shadow-md"
      aria-label="Continue with Google"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {step === "form" ? (
          <>
            {/* Header Tabs */}
            <div className="flex border-b border-[var(--border)]/50 pt-2 px-2 shrink-0">
              <button
                type="button"
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${activeTab === 'login' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                onClick={() => { setActiveTab('login'); setError(null); }}
              >
                Login
                {activeTab === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F97316] rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors relative ${activeTab === 'signup' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                onClick={() => { setActiveTab('signup'); setError(null); }}
              >
                Sign Up
                {activeTab === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F97316] rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="absolute right-4 top-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inverse)]/5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div
              className="p-4 overflow-y-auto"
              style={{ minHeight: activeTab === 'signup' ? '460px' : '360px' }}
            >
              {error && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium leading-relaxed animate-in fade-in">
                  {error}
                </div>
              )}

              <form className="space-y-3 relative" onSubmit={handleSubmit}>
                {activeTab === 'signup' ? (
                  <div key="signup" className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1.5">
                      <label htmlFor="auth-name" className="text-sm font-medium text-[var(--text-primary)]">Full Name</label>
                      <input
                        id="auth-name"
                        type="text" required
                        value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="auth-email-signup" className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
                      <input
                        id="auth-email-signup"
                        type="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="auth-password-signup" className="text-sm font-medium text-[var(--text-primary)]">Password</label>
                      <input
                        id="auth-password-signup"
                        type="password" required
                        minLength={8}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                      />
                      {/* Password Strength Indicator */}
                      {(isPasswordFocused || password.length > 0) && (
                        <div className="pt-1.5 space-y-1 animate-in fade-in duration-300">
                          <div className="flex gap-1 h-1.5">
                            {[1, 2, 3, 4].map((level) => {
                              const strength =
                                (password.length > 5 ? 1 : 0) +
                                (password.length > 8 ? 1 : 0) +
                                (/[A-Z]/.test(password) ? 1 : 0) +
                                (/[0-9!@#$%^&*]/.test(password) ? 1 : 0);

                              let bgColor = 'bg-[var(--border)]';
                              if (strength >= level) {
                                if (strength <= 2) bgColor = 'bg-red-500';
                                else if (strength === 3) bgColor = 'bg-yellow-500';
                                else bgColor = 'bg-green-500';
                              }

                              return (
                                <div key={level} className={`flex-1 rounded-full transition-colors duration-300 ${bgColor}`} />
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] text-right">
                            {
                              (password.length > 5 ? 1 : 0) +
                                (password.length > 8 ? 1 : 0) +
                                (/[A-Z]/.test(password) ? 1 : 0) +
                                (/[0-9!@#$%^&*]/.test(password) ? 1 : 0) <= 2 ? 'Weak' :
                                (password.length > 5 ? 1 : 0) +
                                  (password.length > 8 ? 1 : 0) +
                                  (/[A-Z]/.test(password) ? 1 : 0) +
                                  (/[0-9!@#$%^&*]/.test(password) ? 1 : 0) === 3 ? 'Medium' : 'Strong'
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="auth-college" className="text-sm font-medium text-[var(--text-primary)]">College</label>
                      <select
                        id="auth-college"
                        value={college} onChange={(e) => setCollege(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select your college (Search)</option>
                        <option value="mit">Massachusetts Institute of Technology (MIT)</option>
                        <option value="stanford">Stanford University</option>
                        <option value="iit">Indian Institute of Technology (IIT)</option>
                        <option value="other">Other</option>
                      </select>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Optional: Match with campus events.</p>
                    </div>

                    <div className="pt-1">
                      <ShinyButton
                        variant="primary"
                        className="w-full justify-center py-2.5 cursor-pointer"
                        disabled={loading}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </ShinyButton>
                    </div>
                  </div>
                ) : (
                  <div key="login" className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-1.5">
                      <label htmlFor="auth-email-login" className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
                      <input
                        id="auth-email-login"
                        type="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="auth-password-login" className="text-sm font-medium text-[var(--text-primary)]">Password</label>
                      <input
                        id="auth-password-login"
                        type="password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                      />
                    </div>

                    <div className="pt-1">
                      <ShinyButton
                        variant="primary"
                        className="w-full justify-center py-2.5 cursor-pointer"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Log In"}
                      </ShinyButton>
                    </div>

                    <div className="text-center">
                      <Link
                        href="/forgot-password"
                        onClick={onClose}
                        className="text-sm text-[var(--text-secondary)] hover:text-[#F97316] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                )}

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-[var(--border)]"></div>
                  <span className="flex-shrink-0 mx-4 text-[var(--text-secondary)] text-sm">or</span>
                  <div className="flex-grow border-t border-[var(--border)]"></div>
                </div>

                <GoogleButton />

                {/* Safe Development Test Account Quick Selectors */}
                <div className="pt-3 border-t border-[var(--border)]/60">
                  <p className="text-[11px] font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 text-center">
                    Development Test Roles (1-Click Fill)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => fillTestAccount("admin@nexora.app")}
                      className="px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#F97316] hover:border-[#F97316]/50 text-left transition-colors"
                    >
                      <span className="font-semibold block text-[var(--text-primary)]">Admin</span>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate block">admin@nexora.app</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestAccount("organizer@nexora.app")}
                      className="px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#F97316] hover:border-[#F97316]/50 text-left transition-colors"
                    >
                      <span className="font-semibold block text-[var(--text-primary)]">Organizer</span>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate block">organizer@nexora.app</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestAccount("judge@nexora.app")}
                      className="px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#F97316] hover:border-[#F97316]/50 text-left transition-colors"
                    >
                      <span className="font-semibold block text-[var(--text-primary)]">Judge</span>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate block">judge@nexora.app</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestAccount("hacker@nexora.app")}
                      className="px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#F97316] hover:border-[#F97316]/50 text-left transition-colors"
                    >
                      <span className="font-semibold block text-[var(--text-primary)]">Hacker</span>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate block">hacker@nexora.app</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </>
        ) : (
          <div className="p-8 space-y-6 flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2 ring-8 ring-green-500/10">
              <Check size={40} className="animate-in fade-in zoom-in duration-500 delay-150" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {activeTab === 'login' ? "Login Successful!" : "Account Created!"}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Welcome to Nexora. Your session is active.
              </p>
            </div>

            <div className="pt-6 w-full">
              <ShinyButton
                variant="primary"
                className="w-full justify-center py-3 cursor-pointer"
                onClick={handleContinueAfterSuccess}
              >
                Continue to App
              </ShinyButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
