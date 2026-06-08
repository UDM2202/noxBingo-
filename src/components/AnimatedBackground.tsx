import { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  isTwinkling: boolean;
}

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;

    function generateStars(width: number, height: number): Star[] {
      const starCount = isMobile ? 80 : 200;
      const stars: Star[] = [];
      const twinklePercent = 0.1;

      for (let i = 0; i < starCount; i++) {
        const isTwinkling = Math.random() < twinklePercent;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.8 + 0.2,
          opacity: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
          isTwinkling,
        });
      }

      return stars;
    }

    function createOffscreenCanvas(width: number, height: number, stars: Star[]) {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d', { alpha: true, willReadFrequently: false });
      if (!offCtx) return null;

      offCtx.clearRect(0, 0, width, height);
      stars.forEach(star => {
        if (star.isTwinkling) return;
        offCtx.beginPath();
        offCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        offCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        offCtx.fill();
      });

      return offscreen;
    }

    function resize() {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      if (dimensionsRef.current.width === width && dimensionsRef.current.height === height) {
        return;
      }

      dimensionsRef.current = { width, height };
      currentCanvas.width = width;
      currentCanvas.height = height;

      starsRef.current = generateStars(width, height);
      offscreenRef.current = createOffscreenCanvas(width, height, starsRef.current);
    }

    function draw(timestamp: number) {
      const currentCanvas = canvasRef.current;
      if (!ctx || !currentCanvas) return;

      const { width, height } = dimensionsRef.current;
      ctx.clearRect(0, 0, width, height);

      if (offscreenRef.current) {
        ctx.drawImage(offscreenRef.current, 0, 0);
      }

      const twinklingStars = starsRef.current.filter(s => s.isTwinkling);
      let anyTwinklingChanged = false;

      twinklingStars.forEach(star => {
        const twinkleValue = Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset);
        const currentOpacity = star.opacity * (0.4 + 0.6 * ((twinkleValue + 1) / 2));

        if (Math.abs(twinkleValue) > 0.01 || timestamp < 100) {
          anyTwinklingChanged = true;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();

        if (currentOpacity > 0.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
         ctx.fillStyle = `rgba(0, 229, 255, ${currentOpacity * 0.1})`;
          ctx.fill();
        }
      });

      if (timestamp < 100 || anyTwinklingChanged) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        setTimeout(() => {
          rafRef.current = requestAnimationFrame(draw);
        }, 500);
      }
    }

    resize();
    rafRef.current = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default AnimatedBackground;