let didUnlock = false;

export function unlockAudio() {
  if (didUnlock) return;
  didUnlock = true;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      ctx
        .resume()
        .then(() => {
          console.log('Audio context unlocked');
        })
        .catch(() => {});
    }
  } catch (e) {
    // ignore
  }

  try {
    const audio = new Audio();
    audio.src =
      'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA';
    audio.play().catch(() => {});
  } catch (e) {
    // ignore
  }
}

