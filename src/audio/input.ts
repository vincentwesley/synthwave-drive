// Audio sources -> one AnalyserNode. Context is created/resumed only inside gesture-called methods.
export type AudioState = "idle" | "paused" | "playing" | "mic";

export function createAudio() {
  let ctx: AudioContext | null = null;
  let an: AnalyserNode | null = null;
  let el: HTMLAudioElement | null = null;
  let src: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null;
  let stream: MediaStream | null = null;
  let objUrl: string | null = null;
  const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]);

  const api = {
    state: "idle" as AudioState,
    loop: false,
    gen: 0, // bumped on every source change so the engine can reset its analysis
    onEnded: null as (() => void) | null,
    get ctx() { return ctx; },
    get analyser() { return an; },

    async init() {
      if (!ctx) {
        const nav = navigator as Navigator & { audioSession?: { type: string } };
        if (nav.audioSession) nav.audioSession.type = "playback";
        ctx = new AudioContext();
        an = ctx.createAnalyser();
        an.fftSize = 2048;
        an.smoothingTimeConstant = 0.1;
      }
      if (ctx.state !== "running") {
        await withTimeout(ctx.resume(), 1500); // stays pending without a user gesture
        if ((ctx.state as AudioContextState) !== "running") throw new DOMException("Audio is blocked until you interact", "NotAllowedError");
      }
      return ctx;
    },

    cleanup() {
      el?.pause();
      src?.disconnect();
      an?.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
      if (objUrl) URL.revokeObjectURL(objUrl);
      el = src = stream = objUrl = null;
      api.gen++;
    },

    async loadUrl(url: string, revoke = false) {
      api.cleanup();
      if (revoke) objUrl = url; // set before init so a failed start still revokes it
      let c: AudioContext;
      try { c = await api.init(); } catch (e) { api.cleanup(); api.state = "idle"; throw e; }
      el = new Audio();
      el.crossOrigin = "anonymous";
      el.loop = api.loop;
      el.src = url;
      el.onended = () => { api.state = "paused"; api.onEnded?.(); };
      src = c.createMediaElementSource(el);
      src.connect(an!);
      an!.connect(c.destination);
      api.state = "paused";
    },

    // Decoded locally by the media element from an object URL; nothing is uploaded.
    loadFile(file: File) { return api.loadUrl(URL.createObjectURL(file), true); },

    async useMic() {
      const c = await api.init();
      let s: MediaStream;
      try { s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      }); } catch (e) { api.state = "idle"; throw e; }
      api.cleanup();
      stream = s;
      s.getTracks()[0]?.addEventListener("ended", () => { if (stream === s) { api.cleanup(); api.state = "idle"; api.onEnded?.(); } });
      src = c.createMediaStreamSource(s);
      src.connect(an!); // analyser not routed to destination in mic mode: no feedback
      api.state = "mic";
    },

    async play() {
      if (!el) return;
      await api.init();
      await el.play();
      api.state = "playing";
    },

    pause() {
      if (!el) return;
      el.pause();
      api.state = "paused";
    },
  };
  return api;
}
export type Audio = ReturnType<typeof createAudio>;
