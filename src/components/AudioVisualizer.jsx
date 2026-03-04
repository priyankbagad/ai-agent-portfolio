import { useEffect, useMemo, useRef, useState } from 'react';

export default function AudioVisualizer({ audio, bars = 40 }) {
  const barRefs = useRef([]);
  const rafRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataRef = useRef(null);
  const maxBarHeightRef = useRef(80);

  const [active, setActive] = useState(false);

  const indices = useMemo(() => {
    // 40 bars mapped across frequency bins (computed later when analyser exists)
    return Array.from({ length: bars }).map((_, i) => i);
  }, [bars]);

  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 768px)');
    const update = () => {
      maxBarHeightRef.current = mq?.matches ? 40 : 80;
    };
    update();
    mq?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      mq?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    // cleanup any prior loop + nodes
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
    } catch (e) {
      // ignore
    }
    sourceRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    setActive(false);

    if (!audio) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;

    // Important: createMediaElementSource can only be called once per audio element.
    const source = ctx.createMediaElementSource(audio);
    sourceRef.current = source;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    const freq = new Uint8Array(analyser.frequencyBinCount);
    dataRef.current = freq;

    const onPlay = async () => {
      try {
        if (ctx.state === 'suspended') await ctx.resume();
      } catch (e) {
        // ignore
      }
      setActive(true);
    };

    const onEnd = () => setActive(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onEnd);

    const loop = () => {
      const a = analyserRef.current;
      const arr = dataRef.current;
      if (a && arr && !audio.paused) {
        a.getByteFrequencyData(arr);

        const step = Math.max(1, Math.floor(arr.length / bars));
        const maxH = maxBarHeightRef.current;
        for (let i = 0; i < bars; i += 1) {
          const idx = i * step;
          const v = arr[idx] / 255; // 0..1
          const h = 2 + Math.min(maxH, Math.floor(v * maxH));
          const el = barRefs.current[i];
          if (el) el.style.height = `${h}px`;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // If audio already playing, activate
    if (!audio.paused) onPlay();

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onEnd);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      try {
        source.disconnect();
        analyser.disconnect();
      } catch (e) {
        // ignore
      }
    };
  }, [audio, bars]);

  return (
    <div className={`visualizer ${active ? 'active' : 'idle'}`} aria-hidden="true">
      {indices.map((i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="bar"
        />
      ))}
    </div>
  );
}

