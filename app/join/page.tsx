"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShinyButton } from "../components/ShinyButton";
import { Check } from "lucide-react";

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Mock token decoding
  const [collegeName, setCollegeName] = useState("Loading...");
  const [role, setRole] = useState("Loading...");
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Simulate API call to decode token
    if (token) {
      setTimeout(() => {
        setCollegeName("Massachusetts Institute of Technology (MIT)");
        setRole("Organizer");
      }, 500);
    } else {
      setCollegeName("Unknown College");
      setRole("Participant");
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  const GoogleButton = () => (
    <button 
      type="button"
      onClick={() => setIsSuccess(true)}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-all cursor-pointer font-medium shadow-sm hover:shadow-md"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative z-10 bg-[var(--bg-canvas)]">
      {/* Navbar placeholder for consistency, though wireframe says standalone */}
      {/* Assuming we just want a clean centered form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-8">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
                  You've been invited
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  Join <span className="font-semibold text-[var(--text-primary)]">{collegeName}</span> as an <span className="font-semibold text-[var(--text-primary)]">{role}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Full Name</label>
                  <input 
                    type="text" required
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Password</label>
                  <input 
                    type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316] transition-all"
                  />
                  {/* Password Strength Indicator */}
                  {(isPasswordFocused || password.length > 0) && (
                    <div className="pt-2 space-y-1.5 animate-in fade-in duration-300">
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

                <div className="pt-4">
                  <ShinyButton variant="primary" className="w-full justify-center py-3 cursor-pointer">
                    Accept & Join
                  </ShinyButton>
                </div>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-[var(--border)]"></div>
                  <span className="flex-shrink-0 mx-4 text-[var(--text-secondary)] text-sm">or</span>
                  <div className="flex-grow border-t border-[var(--border)]"></div>
                </div>

                <GoogleButton />
              </form>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2 ring-8 ring-green-500/10">
                <Check size={40} className="animate-in fade-in zoom-in duration-500 delay-150" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Invitation Accepted!
                </h3>
                <p className="text-[var(--text-secondary)]">
                  You are now an {role} for {collegeName}.
                </p>
              </div>
              <div className="pt-6 w-full">
                <ShinyButton 
                  variant="primary" 
                  className="w-full justify-center py-3 cursor-pointer"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Dashboard
                </ShinyButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">Loading...</div>}>
      <InviteContent />
    </Suspense>
  );
}
