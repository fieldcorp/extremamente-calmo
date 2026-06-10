export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'pt-BR',
            name: 'pt-BR-Wavenet-A',
            ssmlGender: 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.85,
            pitch: -1.0,
            effectsProfileId: ['small-bluetooth-speaker-class-device'],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || response.status);
    }

    const data = await response.json();
    res.status(200).json({ audioContent: data.audioContent });
  } catch (e) {
    console.error('TTS error:', e);
    res.status(500).json({ error: 'Erro ao gerar áudio' });
  }
}
