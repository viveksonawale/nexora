import Link from "next/link";
import { Navbar } from "./components/Navbar";
import { ShinyButton } from "./components/ShinyButton";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col relative overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 md:px-12 text-center pb-20">
        <h1 className="font-accent text-[10rem] sm:text-[14rem] md:text-[18rem] lg:text-[22rem] font-normal leading-none tracking-tight text-[var(--text-primary)]">
          404
        </h1>
        
        <p className="font-accent text-lg sm:text-xl md:text-2xl lg:text-3xl text-[var(--text-secondary)] mt-2 mb-10 tracking-wide">
          The page you're looking for doesn't exist
        </p>

        <Link href="/">
          <ShinyButton variant="outline" size="md" className="uppercase font-mono tracking-widest text-xs px-8 text-[#F97316] border-[#F97316]/50 hover:bg-[#F97316]/10 hover:border-[#F97316] !rounded-sm">
            RETURN TO HOME
          </ShinyButton>
        </Link>
      </div>

      {/* Topographic/Background texture for 404 */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden opacity-50">
        <div className="w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] lg:w-[100vw] lg:h-[100vw] rounded-full border-[1px] border-[var(--border)] absolute scale-[0.9]"></div>
        <div className="w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] lg:w-[100vw] lg:h-[100vw] rounded-full border-[1px] border-[var(--border)] absolute scale-[0.75]"></div>
        <div className="w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] lg:w-[100vw] lg:h-[100vw] rounded-full border-[1px] border-[var(--border)] absolute scale-[0.6]"></div>
        <div className="w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] lg:w-[100vw] lg:h-[100vw] rounded-full border-[1px] border-[var(--border)] absolute scale-[0.45]"></div>
        <div className="w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] lg:w-[100vw] lg:h-[100vw] rounded-full border-[1px] border-[var(--border)] absolute scale-[0.3]"></div>
        <div className="w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] lg:w-[100vw] lg:h-[100vw] rounded-full border-[1px] border-[var(--border)] absolute scale-[0.15]"></div>
      </div>

    </main>
  );
}
