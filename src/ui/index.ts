import type { Audio } from "../audio/input";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initUi(audio: Audio) {
  const msg = $("msg"), overlay = $("overlay"), file = $<HTMLInputElement>("file");
  const play = $("play"), bpmEl = $("bpm"), dot = $("dot"), track = $("track"), hud = $("hud");
  const say = (t = "") => { msg.textContent = t; };

  const syncPlay = () => {
    play.hidden = audio.state === "mic";
    play.textContent = audio.state === "playing" ? "Pause" : "Play";
  };
  audio.onEnded = () => {
    if (audio.state === "idle") say("The microphone was disconnected.");
    syncPlay();
  };

  // Every source goes through here so failures surface in the live region, never alert().
  async function start(fn: () => Promise<void>, fail: string, label: string, isMic = false) {
    say();
    try {
      await fn();
      if (audio.state === "paused") await audio.play();
    } catch (e) {
      const name = (e as DOMException)?.name;
      say(name === "NotAllowedError" && !isMic ? "Click once to enable audio, then try again." :
        isMic && (name === "NotAllowedError" || name === "SecurityError") ? "Microphone access was denied." :
        isMic && name === "NotFoundError" ? "No microphone found." : fail);
      return;
    }
    overlay.hidden = true;
    hud.hidden = false;
    track.textContent = label;
    syncPlay();
    wake();
  }

  const demo = () => { audio.loop = true; return audio.loadUrl(`${import.meta.env.BASE_URL}audio/synthwave-house-loop.ogg`); };
  const openFile = (f: File) => {
    if (f.type && !f.type.startsWith("audio/")) { say("That file is not an audio file."); return; }
    audio.loop = false;
    void start(() => audio.loadFile(f), "That audio file could not be played. Try MP3, WAV, OGG or M4A.", f.name.replace(/\.[^.]+$/, ""));
  };
  const mic = () => start(() => audio.useMic(), "Could not start the microphone.", "Microphone", true);

  $("demo").onclick = () => void start(demo, "The demo track could not be loaded.", "Synthwave House Loop (demo)");
  for (const id of ["load", "load2"]) $(id).onclick = () => file.click();
  for (const id of ["mic", "mic2"]) $(id).onclick = () => void mic();
  file.onchange = () => { const f = file.files?.[0]; file.value = ""; if (f) openFile(f); };
  const toggle = async () => {
    try { if (audio.state === "playing") audio.pause(); else await audio.play(); } catch { say("Playback failed."); }
    syncPlay();
  };
  play.onclick = toggle;
  addEventListener("dragover", (e) => e.preventDefault());
  addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer?.files[0]; if (f) openFile(f); });

  const full = $("full");
  if (!document.fullscreenEnabled) full.hidden = true;
  const fullscreen = () => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => say("Fullscreen is not available."));
  full.onclick = fullscreen;

  // Space and F work once driving, unless focus is on a control that already handles the key.
  addEventListener("keydown", (e) => {
    if (hud.hidden || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest("button, input")) return;
    if (e.key === " " && audio.state !== "mic") { e.preventDefault(); void toggle(); }
    else if (e.key === "f" || e.key === "F") fullscreen();
  });

  // Hide the cursor and controls after a few still seconds of playback; a paused player keeps them up.
  let idleTimer = 0;
  function wake() {
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => { if (!hud.hidden && audio.state !== "paused") document.body.classList.add("idle"); }, 3000);
  }
  for (const ev of ["pointermove", "pointerdown", "keydown"]) addEventListener(ev, wake, { passive: true });

  let lastBpm = "", lastOn = "";
  return (f: { bpm: number | null; beat: number }) => {
    const t = f.bpm ? `${Math.round(f.bpm)} BPM` : "— BPM";
    if (t !== lastBpm) { bpmEl.textContent = t; lastBpm = t; }
    const on = reduced ? "0" : f.beat > 0.5 ? "1" : "0"; // no flashing under reduced motion
    if (on !== lastOn) { dot.dataset.on = on; lastOn = on; }
  };
}
