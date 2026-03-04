import { useMemo } from 'react';

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function AvatarParticles({ count = 20 }) {
  const parts = useMemo(() => {
    const rand = mulberry32(9001);
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * 360 + rand() * 10;
      const size = 3 + Math.floor(rand() * 3); // 3..5
      const delay = `${Math.floor(rand() * 700)}ms`;
      const alpha = 0.35 + rand() * 0.5;
      return {
        id: i,
        style: {
          '--angle': `${angle}deg`,
          '--size': `${size}px`,
          '--delay': delay,
          '--alpha': alpha.toFixed(3),
        },
      };
    });
  }, [count]);

  return (
    <div className="avatarParticles" aria-hidden="true">
      {parts.map((p) => (
        <span key={p.id} className="ap" style={p.style} />
      ))}
    </div>
  );
}

