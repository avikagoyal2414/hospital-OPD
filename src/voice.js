// Reads text aloud in the chosen language using the browser's built-in voices.
export function speak(text, locale) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;
  const want = locale.toLowerCase();
  const base = want.split("-")[0];
  const voices = synth.getVoices();
  const voice =
    voices.find((v) => v.lang.replace("_", "-").toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(base));
  if (voice) u.voice = voice;
  u.rate = 0.9;
  setTimeout(() => synth.speak(u), 50); // small delay: avoids Chrome dropping speech right after cancel()
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}