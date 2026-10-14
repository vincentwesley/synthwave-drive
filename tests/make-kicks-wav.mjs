// Dev-only: node tests/make-kicks-wav.mjs -> tests/fixtures/kicks-120bpm.wav (mono 22050Hz, 8s, kick every 0.5s)
import { writeFileSync } from "node:fs";
const sr = 22050, secs = 8, n = sr * secs;
const pcm = new Int16Array(n);
for (let b = 0; b < 16; b++) {
  const s0 = (b * sr) / 2;
  for (let i = 0; i < sr * 0.3 && s0 + i < n; i++) {
    const t = i / sr;
    const phase = 2 * Math.PI * (50 * t + (110 / 18) * (1 - Math.exp(-18 * t))); // 160Hz -> 50Hz sweep
    pcm[s0 + i] = Math.round(Math.sin(phase) * Math.exp(-t * 14) * 30000);
  }
}
const h = Buffer.alloc(44);
h.write("RIFF", 0); h.writeUInt32LE(36 + n * 2, 4); h.write("WAVEfmt ", 8);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
h.write("data", 36); h.writeUInt32LE(n * 2, 40);
writeFileSync(new URL("./fixtures/kicks-120bpm.wav", import.meta.url), Buffer.concat([h, Buffer.from(pcm.buffer)]));
