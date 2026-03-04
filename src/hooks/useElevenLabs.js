export async function speakText(text) {
  try {
    const response = await fetch('http://localhost:3001/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('TTS proxy failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    audio.onerror = () => URL.revokeObjectURL(audioUrl);
    await audio.play();
    return audio;
  } catch (err) {
    console.error('ElevenLabs error:', err);
    return null;
  }
}
