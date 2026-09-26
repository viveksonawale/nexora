"use client";

import { useEffect, useRef } from "react";

export interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  className?: string;
}

export function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 420,
  cursorForce = 0.26,
  bulgeOnly = true,
  bulgeStrength = 105,
  glowRadius = 210,
  sparkle = true,
  waveAmplitude = 0,
  className = "",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = -2000;
    let mouseY = -2000;
    let targetMouseX = -2000;
    let targetMouseY = -2000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      targetMouseX = -2000;
      targetMouseY = -2000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent ? parent.clientWidth : window.innerWidth;
      const height = parent ? parent.clientHeight : window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    let time = 0;

    const render = () => {
      time += 0.035;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);
      
      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.12;
      mouseY += (targetMouseY - mouseY) * 0.12;

      const accentColor = "#F97316";
      const secondaryColor = "#A39E8F";

      for (let x = dotSpacing / 2; x < w; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < h; y += dotSpacing) {
          let drawX = x;
          let drawY = y;
          let r = dotRadius;

          const dx = mouseX - x;
          const dy = mouseY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Interactive cursor proximity physics
          if (dist < cursorRadius) {
            const factor = 1 - dist / cursorRadius;
            const force = Math.pow(factor, 1.8) * cursorForce;
            
            if (bulgeOnly) {
              r += force * bulgeStrength * 0.12;
            } else {
              drawX -= dx * force;
              drawY -= dy * force;
            }
          }
          
          if (sparkle) {
            const sparkleVal = Math.sin(time * 1.5 + x * 0.05 + y * 0.08);
            r = Math.max(0.6, r + sparkleVal * 0.35);
          }

          if (waveAmplitude > 0) {
            drawY += Math.sin(x * 0.02 + time) * waveAmplitude;
          }

          ctx.beginPath();
          ctx.arc(drawX, drawY, Math.max(0.4, r), 0, Math.PI * 2);
          
          if (dist < glowRadius) {
            const glowRatio = 1 - dist / glowRadius;
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.5 + glowRatio * 0.5;
          } else {
            ctx.fillStyle = secondaryColor;
            ctx.globalAlpha = 0.22;
          }

          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, glowRadius, sparkle, waveAmplitude]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none object-cover ${className}`}
    />
  );
}
