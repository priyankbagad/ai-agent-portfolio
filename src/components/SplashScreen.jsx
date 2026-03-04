import { useMemo, useState } from 'react';
import { unlockAudio } from '../lib/unlockAudio';

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SplashScreen({ onInitialize }) {
  const [leaving, setLeaving] = useState(false);
  const [burst, setBurst] = useState(false);

  const bg = useMemo(() => {
    const rand = mulberry32(777);
    return Array.from({ length: 34 }).map((_, i) => {
      const x = Math.floor(rand() * 1000) / 10;
      const size = 1 + Math.floor(rand() * 3);
      const opacity = 0.12 + rand() * 0.14;
      const delay = `${Math.floor(rand() * 9000)}ms`;
      const dur = `${16 + Math.floor(rand() * 22)}s`;
      const tint = rand() < 0.6 ? 'amber' : 'white';
      return {
        id: i,
        className: `splashDot ${tint}`,
        style: {
          '--x': `${x}%`,
          '--size': `${size}px`,
          '--opacity': opacity.toFixed(3),
          '--delay': delay,
          '--dur': dur,
        },
      };
    });
  }, []);

  const burstParticles = useMemo(() => {
    const rand = mulberry32(2026);
    return Array.from({ length: 80 }).map((_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 150 + rand() * 150; // 150..300
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const size = 2 + Math.floor(rand() * 3); // 2..4
      const delay = `${Math.floor(rand() * 120)}ms`;
      const tint = rand() < 0.55 ? 'amber' : 'white';
      return {
        id: i,
        className: `burstParticle ${tint}`,
        style: {
          '--dx': `${dx.toFixed(1)}px`,
          '--dy': `${dy.toFixed(1)}px`,
          '--size': `${size}px`,
          '--delay': delay,
        },
      };
    });
  }, []);

  async function handleClick() {
    if (leaving) return;

    unlockAudio();

    setBurst(true);
    setLeaving(true);
    try {
      await onInitialize?.();
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className={`splash ${leaving ? 'leaving' : ''}`} role="dialog" aria-modal="true">
      <div className="splashBg" aria-hidden="true">
        {bg.map((p) => (
          <span key={p.id} className={p.className} style={p.style} />
        ))}
      </div>

      <div className="splashCenter">
        <div className="splashTitle">priyank.exe</div>
        <div className="splashSubtitle">Software Engineer · MS Northeastern</div>

        <div className="initWrap">
          <button type="button" className={`initBtn ${leaving ? 'fadeOut' : ''}`} onClick={handleClick}>
            Initialize
          </button>

          {burst ? (
            <div className="burst" aria-hidden="true">
              {burstParticles.map((p) => (
                <span key={p.id} className={p.className} style={p.style} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

