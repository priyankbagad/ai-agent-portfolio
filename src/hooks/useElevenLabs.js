// Store audio context globally outside the function
let globalAudioContext = null;

export async function speakText(text) {
  try {
    // Resume or create audio context before every play (iOS can suspend between plays)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      if (!globalAudioContext) {
        globalAudioContext = new AudioContext();
      }
      if (globalAudioContext?.state === 'suspended') {
        await globalAudioContext.resume();
      }
    }

    const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';

    const response = await fetch(`${proxyUrl}/api/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      if (response.status === 402) return { error: 'out_of_credits' };
      return { error: 'tts_failed' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = audioUrl;
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    audio.onerror = (e) => {
      console.error('Audio error:', e);
      URL.revokeObjectURL(audioUrl);
    };

    try {
      await audio.play();
    } catch (playErr) {
      console.error('Play failed:', playErr);
    }

    return audio;
  } catch (err) {
    console.error('ElevenLabs error:', err);
    return null;
  }
}
