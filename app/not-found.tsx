import Link from "next/link";
import { ShinyButton } from "./components/ShinyButton";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center relative">
      <div className="flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display font-black text-8xl sm:text-[10rem] tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#F97316] to-[#EA580C] leading-none mb-6">
          404
        </h1>
        
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
          Page Not Found
        </h2>
        
        <p className="font-sans text-base sm:text-lg text-[var(--text-secondary)] max-w-md mb-10">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link href="/">
          <ShinyButton variant="primary" size="md">
            Return to Home
          </ShinyButton>
        </Link>
      </div>
    </main>
  );
}
