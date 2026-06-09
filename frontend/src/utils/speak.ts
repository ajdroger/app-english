export function speak(text: string) {
  const synth = window.speechSynthesis
  synth.cancel()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9

  const doSpeak = () => {
    const voices = synth.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en-US'))
      ?? voices.find(v => v.lang.startsWith('en'))
      ?? voices[0]
    if (enVoice) u.voice = enVoice
    synth.speak(u)
  }

  // Voices may not be loaded yet on first call (common on Linux/Chromium)
  if (synth.getVoices().length > 0) {
    doSpeak()
  } else {
    synth.addEventListener('voiceschanged', doSpeak, { once: true })
  }
}
