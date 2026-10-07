import React, { useEffect, useRef } from 'react';

interface FallbackVisualProps {
  isMobile: boolean;
}

export const FallbackVisual: React.FC<FallbackVisualProps> = ({ isMobile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      pointerRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Particle nodes for procedural neural flow
    const particleCount = isMobile ? 80 : 160;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      theta: Math.random() * Math.PI * 2,
      radiusBase: 90 + Math.random() * 160,
      radiusOffset: Math.random() * 40,
      speed: (0.15 + Math.random() * 0.35) * (Math.random() > 0.5 ? 1 : -1),
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.5,
      color: i % 3 === 0 ? '#262524' : i % 2 === 0 ? '#54514B' : '#8A867E',
    }));

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // Pointer damping
      pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.05;
      pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Center position
      const centerX = isMobile ? width * 0.5 : width * 0.62 + pointerRef.current.x * 25;
      const centerY = isMobile ? height * 0.6 : height * 0.5 + pointerRef.current.y * 20;

      // Continuous breathing cycle (simulating the 5 transformation phases)
      const cycleProgress = (elapsed * 0.25) % (Math.PI * 2);
      const breathScale = 1.0 + 0.18 * Math.sin(cycleProgress);

      // Draw subtle orbital verification rings
      const rings = [70, 130, 200, 260];
      rings.forEach((r, idx) => {
        const ringRadius = r * breathScale;
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          ringRadius,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(80, 76, 70, 0.12)' : 'rgba(140, 134, 124, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash(idx % 2 === 0 ? [4, 6] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw central intelligent core
      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        45 * breathScale
      );
      coreGradient.addColorStop(0, 'rgba(40, 38, 36, 0.85)');
      coreGradient.addColorStop(0.7, 'rgba(90, 85, 78, 0.4)');
      coreGradient.addColorStop(1, 'rgba(250, 249, 245, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, 45 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Draw connecting filaments between close particles
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(70, 66, 60, 0.08)';
      ctx.lineWidth = 0.8;

      const positions: { x: number; y: number }[] = [];

      particles.forEach((p) => {
        const currentTheta = p.theta + elapsed * p.speed * 0.2;
        const currentRadius = (p.radiusBase + Math.sin(elapsed + p.radiusOffset) * 20) * breathScale;
        const px = centerX + Math.cos(currentTheta) * currentRadius;
        const py = centerY + Math.sin(currentTheta) * currentRadius * 0.75;
        positions.push({ x: px, y: py });
      });

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 4200) {
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
          }
        }
      }
      ctx.stroke();

      // Draw particles
      positions.forEach((pos, idx) => {
        const p = particles[idx];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

