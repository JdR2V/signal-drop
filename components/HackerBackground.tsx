"use client";

import { useEffect, useRef } from "react";

/**
 * Animated grid + scanline background.
 * Renders on a <canvas> element fixed to the viewport.
 * The grid subtly pulses and faint scanlines scroll across.
 */
export default function HackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animationId: number;
    let frame = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      frame++;
      const W = canvas.width;
      const H = canvas.height;

      // Clear with a very dark background
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);

      const CELL = 40; // grid cell size in px
      const pulse = 0.4 + 0.15 * Math.sin(frame / 80); // gentle pulse

      // ── Vertical grid lines ──────────────────────────────
      ctx.strokeStyle = `rgba(0, 255, 80, ${pulse * 0.12})`;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // ── Horizontal grid lines ────────────────────────────
      for (let y = 0; y <= H; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // ── Grid intersection dots ───────────────────────────
      ctx.fillStyle = `rgba(0, 255, 80, ${pulse * 0.35})`;
      for (let x = 0; x <= W; x += CELL) {
        for (let y = 0; y <= H; y += CELL) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Scanlines (scrolling horizontal bands) ───────────
      const scanY = (frame * 0.5) % H;
      const gradient = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      gradient.addColorStop(0, "rgba(0, 255, 80, 0)");
      gradient.addColorStop(0.4, "rgba(0, 255, 80, 0.03)");
      gradient.addColorStop(0.5, "rgba(0, 255, 80, 0.06)");
      gradient.addColorStop(0.6, "rgba(0, 255, 80, 0.03)");
      gradient.addColorStop(1, "rgba(0, 255, 80, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 60, W, 120);

      // ── Vignette (dark edges) ────────────────────────────
      const vignette = ctx.createRadialGradient(
        W / 2,
        H / 2,
        H * 0.3,
        W / 2,
        H / 2,
        H * 0.9,
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
