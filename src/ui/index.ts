import type { Audio } from "../audio/input";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initTheme() {
  const root = document.documentElement, btn = $("theme");
  const set = (light: boolean) => {
    if (light) root.dataset.theme = "light"; else delete root.dataset.theme;
    btn.setAttribute("aria-pressed", String(light));
    btn.textContent = light ? "Dark UI" : "Light UI";
  };
  let saved = false;
  try { saved = localStorage.getItem("theme") === "light"; } catch { /* storage blocked */ }
  set(saved);
  btn.onclick = () => {
    const light = root.dataset.theme !== "light";
    set(light);
    try { localStorage.setItem("theme", light ? "light" : "dark"); } catch { /* ignore */ }
  };
}

export function initUi(audio: Audio) {
  const msg = $("msg"), overlay = $("overlay"), file = $<HTMLInputElement>("file");
  const play = $("play"), bpmEl = $("bpm"), dot = $("dot");
  const say = (t = "") => { msg.textContent = t; };

  const syncPlay = () => {
    play.hidden = audio.state === "mic";
    play.textContent = audio.state === "playing" ? "Pause" : "Play";
  };
  audio.onEnded = syncPlay;

  // Every source goes through here so failures surface in the live region, never alert().
  async function start(fn: () => Promise<void>, fail: string) {
    say();
    try {
      await fn();
      if (audio.state === "paused") await audio.play();
    } catch (e) {
      const name = (e as DOMException)?.name;
      say(name === "NotAllowedError" || name === "SecurityError" ? "Microphone access was denied." :
        name === "NotFoundError" ? "No microphone found." : fail);
      return;
    }
    overlay.hidden = true;
    $("bar").hidden = false;
    $("hud").hidden = false;
    syncPlay();
  }

  const demo = () => { audio.loop = true; return audio.loadUrl(`${import.meta.env.BASE_URL}audio/synthwave-house-loop.ogg`); };
  const openFile = (f: File) => {
    if (!f.type.startsWith("audio/")) { say("That file is not an audio file."); return; }
    audio.loop = false;
    void start(() => audio.loadFile(f), "That audio file could not be played. Try MP3, WAV, OGG or M4A.");
  };
  const mic = () => start(() => audio.useMic(), "Could not start the microphone.");

  $("demo").onclick = () => void start(demo, "The demo track could not be loaded.");
  for (const id of ["load", "load2"]) $(id).onclick = () => file.click();
  for (const id of ["mic", "mic2"]) $(id).onclick = () => void mic();
  file.onchange = () => { const f = file.files?.[0]; file.value = ""; if (f) openFile(f); };
  play.onclick = async () => {
    try { if (audio.state === "playing") audio.pause(); else await audio.play(); } catch { say("Playback failed."); }
    syncPlay();
  };
  addEventListener("dragover", (e) => e.preventDefault());
  addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer?.files[0]; if (f) openFile(f); });

  const full = $("full");
  if (!document.fullscreenEnabled) full.hidden = true;
  full.onclick = () => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => say("Fullscreen is not available."));

  let lastBpm = "", lastOn = "";
  return (f: { bpm: number | null; beat: number }) => {
    const t = f.bpm ? `${Math.round(f.bpm)} BPM` : "— BPM";
    if (t !== lastBpm) { bpmEl.textContent = t; lastBpm = t; }
    const on = reduced ? "0" : f.beat > 0.5 ? "1" : "0"; // no flashing under reduced motion
    if (on !== lastOn) { dot.dataset.on = on; lastOn = on; }
  };
}
