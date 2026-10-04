"use client";

import { FeaturesGrid } from "../components/FeaturesGrid";
import FeatureSection from "@/components/ui/stack-feature-section";
import { Sparkles } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      
      {/* ── Hero / Header Ambient Glows ── */}
      <div className="relative overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-[100px]" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-[#FB923C]/5 rounded-full blur-[100px]" />
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="pt-8">
        <FeaturesGrid />
      </div>

      {/* Stack Feature Section */}
      <div className="pb-24">
        <FeatureSection />
      </div>

    </div>
  );
}
