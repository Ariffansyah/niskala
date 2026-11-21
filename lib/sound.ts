let ctx: AudioContext | null = null;

/** Two soft struck tones, a fifth apart, like a small bonang. Silent if audio is unavailable. */
export function chime() {
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const t = now + i * 0.18;
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  } catch {}
}
