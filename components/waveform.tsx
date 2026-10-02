"use client";

import { useEffect, useRef } from "react";

/** Live bar waveform driven by the microphone stream. */
export function Waveform({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth;
    const h = el.clientHeight;
    el.width = w * dpr;
    el.height = h * dpr;
    ctx.scale(dpr, dpr);
    const color = getComputedStyle(el).color;

    const BARS = 32;
    const draw = (levels: number[]) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const gap = 3;
      const bw = (w - gap * (BARS - 1)) / BARS;
      levels.forEach((l, i) => {
        const bh = Math.max(4, l * h);
        ctx.globalAlpha = active ? 0.55 + l * 0.45 : 0.3;
        ctx.beginPath();
        ctx.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, bw / 2);
        ctx.fill();
      });
    };

    if (!stream || !active) {
      draw(new Array(BARS).fill(0));
      return;
    }

    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    audio.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      // Mirror the lower voice-range bins around the centre so the middle is liveliest.
      const half = BARS / 2;
      const levels = new Array(BARS).fill(0);
      for (let i = 0; i < half; i++) {
        const v = Math.min(1, (data[i + 1] / 255) * 1.4);
        levels[half + i] = v;
        levels[half - 1 - i] = v;
      }
      draw(levels);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      void audio.close();
    };
  }, [stream, active]);

  return <canvas ref={canvas} className="h-14 w-full text-brand" aria-hidden />;
}