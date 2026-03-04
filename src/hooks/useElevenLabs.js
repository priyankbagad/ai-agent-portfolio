// Global vars outside component
let audioContext = null;
let audioQueue = [];
let isPlaying = false;

const initAudioContext = async () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!audioContext) {
    audioContext = new AudioContext();
    try {
      window.__priyankAudioContext = audioContext;
    } catch (e) {
      // ignore
    }
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
};

async function fetchTtsArrayBuffer(text) {
  const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';
  const response = await fetch(`${proxyUrl}/api/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.substring(0, 500) }),
  });

  if (!response.ok) {
    if (response.status === 402) return { error: 'out_of_credits' };
    return { error: 'tts_failed' };
  }

  const arrayBuffer = await response.arrayBuffer();
  return { arrayBuffer };
}

function playViaWebAudio(arrayBuffer) {
  const ctx = audioContext;
  if (!ctx) return null;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.85;

  const handle = {
    kind: 'webaudio',
    ctx,
    analyser,
    source: null,
    ended: false,
    onended: null,
    stop: () => {
      try {
        handle.source?.stop?.(0);
      } catch (e) {
        // ignore
      }
    },
    _ended: null,
  };

  let endedResolve;
  handle._ended = new Promise((r) => {
    endedResolve = r;
  });

  return ctx
    .decodeAudioData(arrayBuffer.slice(0))
    .then((audioBuffer) => {
      const source = ctx.createBufferSource();
      handle.source = source;
      source.buffer = audioBuffer;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      source.onended = () => {
        handle.ended = true;
        try {
          if (typeof handle.onended === 'function') handle.onended();
        } finally {
          try {
            source.disconnect();
            analyser.disconnect();
          } catch (e) {
            // ignore
          }
          endedResolve?.(handle);
        }
      };

      source.start(0);
      return handle;
    });
}

async function playViaHtmlAudio(text) {
  const result = await fetchTtsArrayBuffer(text);
  if (result?.error) return result;

  const blob = new Blob([result.arrayBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);

  try {
    await audio.play();
  } catch (e) {
    // ignore (mobile autoplay blocks can happen; unlock should handle most cases)
  }

  return audio;
}

async function processQueue() {
  if (isPlaying) return;
  isPlaying = true;

  while (audioQueue.length) {
    const item = audioQueue.shift();
    if (!item) continue;

    try {
      await initAudioContext();
      const result = await fetchTtsArrayBuffer(item.text);

      if (result?.error) {
        item.resolve(result);
        continue;
      }

      let playback = null;
      try {
        playback = await playViaWebAudio(result.arrayBuffer);
      } catch (e) {
        console.error('WebAudio decode/play failed:', e);
      }

      if (!playback) {
        playback = await playViaHtmlAudio(item.text);
      }

      item.resolve(playback);

      // Wait for playback to finish before next item (prevents iOS flakiness)
      if (playback?.error) continue;
      if (playback?.kind === 'webaudio' && playback._ended) {
        await playback._ended;
        continue;
      }
      if (typeof playback?.addEventListener === 'function') {
        await new Promise((r) => {
          const done = () => r();
          playback.addEventListener('ended', done, { once: true });
          playback.addEventListener('pause', done, { once: true });
          playback.addEventListener('error', done, { once: true });
        });
      }
    } catch (err) {
      console.error('ElevenLabs error:', err);
      item.resolve(null);
    }
  }

  isPlaying = false;
}

export async function speakText(text) {
  try {
    if (!text) return null;

    return await new Promise((resolve) => {
      audioQueue.push({ text, resolve });
      processQueue();
    });
  } catch (err) {
    console.error('ElevenLabs error:', err);
    return null;
  }
}
