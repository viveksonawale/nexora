"use client";

import { useEffect, useRef } from "react";

export interface ColorBendsProps {
  color?: string;
  speed?: number;
  frequency?: number;
  noise?: number;
  bandWidth?: number;
  rotation?: number;
  fadeTop?: number;
  iterations?: number;
  intensity?: number;
  className?: string;
}

export function ColorBends({
  color = "#F97316",
  speed = 0.4,
  frequency = 1.8,
  noise = 0.18,
  bandWidth = 0.22,
  rotation = 115,
  fadeTop = 0.7,
  iterations = 1,
  intensity = 1.4,
  className = "",
}: ColorBendsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let animationFrameId: number;

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

    const hex2rgb = (hex: string) => {
      const clean = hex.replace("#", "");
      const match = clean.length === 3
        ? clean.split("").map((c) => c + c).join("").match(/.{1,2}/g)
        : clean.match(/.{1,2}/g);
      return match ? match.map((x) => parseInt(x, 16)) : [249, 115, 22];
    };
    const [r, g, b] = hex2rgb(color);

    const render = () => {
      time += speed * 0.012;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.52;
      const rotRad = (rotation * Math.PI) / 180;
      const cosR = Math.cos(rotRad);
      const sinR = Math.sin(rotRad);

      // Layered luminous ribbons
      const numPasses = Math.max(1, iterations * 3);

      for (let pass = 0; pass < numPasses; pass++) {
        const passOffset = pass * noise * 0.8;
        const passAlpha = (intensity * (1 - (pass / (numPasses + 1)) * 0.6)) / numPasses;

        ctx.save();
        ctx.beginPath();

        // Sample wave points
        const step = 8;
        let isFirst = true;

        for (let x = -w * 0.2; x <= w * 1.2; x += step) {
          const normX = x / w;
          const wave1 = Math.sin(normX * frequency * Math.PI * 2 + time + passOffset);
          const wave2 = Math.cos(normX * frequency * 1.4 * Math.PI + time * 0.7 + pass * 0.2);
          const totalWave = (wave1 * 0.75 + wave2 * 0.25) * (h * bandWidth);

          // Apply rotation transformation around center
          const relX = x - cx;
          const finalX = cx + relX * cosR - totalWave * sinR;
          const finalY = cy + relX * sinR + totalWave * cosR;

          if (isFirst) {
            ctx.moveTo(finalX, finalY);
            isFirst = false;
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }

        // Create glowing ribbon stroke with subtle gradient
        const ribbonGrad = ctx.createLinearGradient(0, 0, w, h);
        ribbonGrad.addColorStop(0, `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 20)}, ${passAlpha * 0.9})`);
        ribbonGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${passAlpha * 1.2})`);
        ribbonGrad.addColorStop(1, `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 20)}, ${Math.max(0, b)}, ${passAlpha * 0.7})`);

        ctx.strokeStyle = ribbonGrad;
        ctx.lineWidth = Math.max(30, 90 - pass * 18);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        // Multi-level glow blur
        ctx.filter = `blur(${Math.max(20, 55 + pass * 25)}px)`;
        ctx.stroke();

        ctx.restore();
      }

      // Add central luminous core beam
      ctx.save();
      ctx.beginPath();
      let firstCore = true;
      for (let x = -w * 0.1; x <= w * 1.1; x += 10) {
        const normX = x / w;
        const wave = Math.sin(normX * frequency * Math.PI * 2 + time) * (h * bandWidth);
        const relX = x - cx;
        const finalX = cx + relX * cosR - wave * sinR;
        const finalY = cy + relX * sinR + wave * cosR;

        if (firstCore) {
          ctx.moveTo(finalX, finalY);
          firstCore = false;
        } else {
          ctx.lineTo(finalX, finalY);
        }
      }
      ctx.strokeStyle = `rgba(255, 230, 180, ${intensity * 0.35})`;
      ctx.lineWidth = 14;
      ctx.filter = "blur(18px)";
      ctx.stroke();
      ctx.restore();

      // Top and bottom ambient fade gradient
      if (fadeTop > 0) {
        const topGrad = ctx.createLinearGradient(0, 0, 0, h * fadeTop);
        topGrad.addColorStop(0, "rgba(18, 17, 16, 0.95)");
        topGrad.addColorStop(0.6, "rgba(18, 17, 16, 0.4)");
        topGrad.addColorStop(1, "rgba(18, 17, 16, 0)");
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, h * fadeTop);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed, frequency, noise, bandWidth, rotation, fadeTop, iterations, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
