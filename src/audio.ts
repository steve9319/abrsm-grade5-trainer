import { toMidi, type Pitch } from './theory/pitch';

let context: AudioContext | null = null;

export function playPitches(groups: Pitch[][]): void {
  const Audio = window.AudioContext;
  if (!Audio || groups.length === 0) return;
  if (!context) context = new Audio();
  const active = context;
  if (active.state === 'suspended') void active.resume();
  const start = active.currentTime + 0.04;
  groups.forEach((group, index) => {
    const time = start + index * 0.48;
    for (const note of group) {
      const midi = toMidi(note);
      if (midi < 24 || midi > 108) continue;
      const oscillator = active.createOscillator();
      const filter = active.createBiquadFilter();
      const gain = active.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      filter.type = 'lowpass';
      filter.frequency.value = 1600;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.08, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(active.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.45);
    }
  });
}
