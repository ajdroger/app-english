export function speak(text: string, ttsLang = 'en-US') {
  const synth = window.speechSynthesis
  synth.cancel()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = ttsLang
  u.rate = 0.9

  const doSpeak = () => {
    const voices = synth.getVoices()
    const voice = voices.find(v => v.lang === ttsLang)
      ?? voices.find(v => v.lang.startsWith(ttsLang.split('-')[0]))
      ?? voices[0]
    if (voice) u.voice = voice
    synth.speak(u)
  }

  if (synth.getVoices().length > 0) {
    doSpeak()
  } else {
    synth.addEventListener('voiceschanged', doSpeak, { once: true })
  }
}
