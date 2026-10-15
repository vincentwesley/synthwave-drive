// Dev-only: node tests/make-kicks-wav.mjs
//  -> tests/fixtures/kicks-120bpm.wav     (mono 22050Hz, 8s, kick every 0.5s)
//  -> tests/fixtures/quiet-then-loud.wav  (14s quiet kicks, then 10s loud kicks + noise hits; triggers profile "surge")
import { writeFileSync } from "node:fs";
const sr = 22050;
const kick = (pcm, s0, amp) => {
  for (let i = 0; i < sr * 0.3 && s0 + i < pcm.length; i++) {
    const t = i / sr;
    const phase = 2 * Math.PI * (50 * t + (110 / 18) * (1 - Math.exp(-18 * t))); // 160Hz -> 50Hz sweep
    pcm[s0 + i] += Math.sin(phase) * Math.exp(-t * 14) * amp;
  }
};
const noise = (pcm, s0, amp) => {
  for (let i = 0; i < sr * 0.12 && s0 + i < pcm.length; i++) pcm[s0 + i] += (Math.random() * 2 - 1) * Math.exp(-i / sr * 12) * amp;
};
const wav = (name, secs, fill) => {
  const n = sr * secs, f = new Float32Array(n);
  fill(f);
  const pcm = Int16Array.from(f, (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + n * 2, 4); h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(n * 2, 40);
  writeFileSync(new URL(`./fixtures/${name}`, import.meta.url), Buffer.concat([h, Buffer.from(pcm.buffer)]));
};
wav("kicks-120bpm.wav", 8, (f) => { for (let b = 0; b < 16; b++) kick(f, (b * sr) / 2, 30000 / 32767); });
wav("quiet-then-loud.wav", 24, (f) => {
  for (let b = 0; b < 48; b++) {
    const loud = b >= 28;
    kick(f, (b * sr) / 2, loud ? 0.95 : 0.012);
    if (loud) for (let k = 0; k < 4; k++) noise(f, (b * sr) / 2 + (k * sr) / 8, 0.35); // 16th-note hats
  }
});
