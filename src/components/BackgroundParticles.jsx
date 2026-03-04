import { useMemo } from 'react';

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function BackgroundParticles({ count = 40 }) {
  const particles = useMemo(() => {
    const rand = mulberry32(4242);
    return Array.from({ length: count }).map((_, i) => {
      const x = Math.floor(rand() * 1000) / 10; // 0..100 with 0.1 precision
      const size = 1 + Math.floor(rand() * 3); // 1..3
      const opacity = 0.15 + rand() * 0.15; // 0.15..0.30
      const delay = `${Math.floor(rand() * 18000)}ms`;
      const dur = `${18 + Math.floor(rand() * 28)}s`; // 18..45s
      const tint = rand() < 0.55 ? 'amber' : 'white';
      return {
        id: i,
        className: `bgParticle ${tint}`,
        style: {
          '--x': `${x}%`,
          '--size': `${size}px`,
          '--opacity': opacity.toFixed(3),
          '--delay': delay,
          '--dur': dur,
        },
      };
    });
  }, [count]);

  return (
    <div className="bgParticles" aria-hidden="true">
      {particles.map((p) => (
        <span key={p.id} className={p.className} style={p.style} />
      ))}
    </div>
  );
}

