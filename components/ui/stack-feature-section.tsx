"use client";

import { ShinyButton } from "@/app/components/ShinyButton";
import Link from "next/link";
import {
  FaReact,
  FaAws,
  FaDocker,
  FaNodeJs,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaGoogle,
  FaApple,
} from "react-icons/fa";
import {
  SiNextdotjs,
  SiVercel,
  SiRedux,
  SiTypescript,
  SiFacebook,
} from "react-icons/si";

const iconConfigs = [
  { Icon: FaReact, color: "#F97316" },
  { Icon: FaAws, color: "#F97316" },
  { Icon: FaDocker, color: "#F97316" },
  { Icon: FaNodeJs, color: "#F97316" },
  { Icon: SiNextdotjs, color: "#F97316" },
  { Icon: SiVercel, color: "#F97316" },
  { Icon: SiRedux, color: "#F97316" },
  { Icon: SiTypescript, color: "#F97316" },
  { Icon: FaGithub, color: "#F97316" },
  { Icon: FaTwitter, color: "#F97316" },
  { Icon: FaLinkedin, color: "#F97316" },
  { Icon: FaInstagram, color: "#F97316" },
  { Icon: FaGoogle, color: "#F97316" },
  { Icon: FaApple, color: "#F97316" },
  { Icon: SiFacebook, color: "#F97316" },
];

export default function FeatureSection() {
  const orbitCount = 3;
  const orbitGap = 4.5; // rem between orbits
  const iconsPerOrbit = Math.ceil(iconConfigs.length / orbitCount);

  return (
    <section className="relative max-w-7xl mx-auto my-16 pl-6 md:pl-12 pr-0 flex flex-col md:flex-row items-center justify-between min-h-[22rem] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden rounded-[8px] z-10">
      {/* Left side: Heading and Text */}
      <div className="w-full md:w-[55%] z-10 py-12 md:py-16 relative pr-6 md:pr-0">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-[var(--text-primary)] tracking-tight">
          Build your <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] bg-clip-text text-transparent italic font-accent font-normal">idea</span>
        </h2>
        <p className="font-sans text-[var(--text-secondary)] mb-8 max-w-lg text-lg md:text-xl leading-relaxed">
          NEXORA is an advanced hackathon management system. Streamline registrations, team formations, and project submissions seamlessly.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="#get-started">
            <ShinyButton variant="primary" size="md">
              Get Started
            </ShinyButton>
          </Link>
          <Link href="#learn-more">
            <ShinyButton variant="secondary" size="md">
              Learn More
            </ShinyButton>
          </Link>
        </div>
      </div>

      {/* Right side: Orbit animation cropped to 1/4 */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-[45%] h-[22rem] md:h-[28rem] flex items-center justify-start pointer-events-none mt-8 md:mt-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-elevated)] to-transparent z-10 md:hidden pointer-events-none"></div>
        <div className="relative w-[28rem] md:w-[35rem] h-[28rem] md:h-[35rem] translate-x-1/2 flex items-center justify-center ml-auto">
          {/* Center Circle */}
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#1c2128] border border-[var(--border)] shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center z-20 pointer-events-auto">
            <FaReact className="w-8 h-8 md:w-12 md:h-12 text-[#F97316] animate-pulse" />
          </div>

          {/* Generate Orbits */}
          {[...Array(orbitCount)].map((_, orbitIdx) => {
            const size = `${11 + orbitGap * (orbitIdx + 1)}rem`; // equal spacing
            const angleStep = (2 * Math.PI) / iconsPerOrbit;
            const duration = `${15 + orbitIdx * 8}s`;

            return (
              <div
                key={orbitIdx}
                className="absolute rounded-full border-2 border-dotted border-[#F97316]/30 z-10 animate-spin pointer-events-none"
                style={{
                  width: size,
                  height: size,
                  animationDuration: duration,
                }}
              >
                {iconConfigs
                  .slice(
                    orbitIdx * iconsPerOrbit,
                    orbitIdx * iconsPerOrbit + iconsPerOrbit,
                  )
                  .map((cfg, iconIdx) => {
                    const angle = iconIdx * angleStep;
                    const x = (50 + 50 * Math.cos(angle)).toFixed(4);
                    const y = (50 + 50 * Math.sin(angle)).toFixed(4);

                    return (
                      <div
                        key={iconIdx}
                        className="absolute"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div
                          className="bg-[#1c2128] border border-[var(--border)] rounded-full p-2.5 shadow-lg flex items-center justify-center animate-spin pointer-events-auto"
                          style={{
                            animationDuration: duration,
                            animationDirection: "reverse",
                          }}
                        >
                          <cfg.Icon
                            className="w-5 h-5 md:w-7 md:h-7"
                            style={{ color: cfg.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
