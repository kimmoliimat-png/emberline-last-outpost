type Tone = {
  type: OscillatorType;
  freq: number;
  dur: number;
  gain: number;
  slide?: number;
};

class EmberAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private drone: OscillatorNode | null = null;
  muted = false;
  unlocked = false;

  unlock() {
    try {
      if (!this.ctx) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctx({ latencyHint: "interactive" });
        this.master = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.music = this.ctx.createGain();
        this.sfx.gain.value = 0.28;
        this.music.gain.value = 0.12;
        this.master.gain.value = this.muted ? 0 : 0.7;
        this.sfx.connect(this.master);
        this.music.connect(this.master);
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      this.unlocked = true;
      this.startDrone();
    } catch {
      this.unlocked = true;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.03);
    }
  }

  private beep(t: Tone, dest?: GainNode) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = t.type;
    osc.frequency.setValueAtTime(t.freq, this.ctx.currentTime);
    if (t.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, t.slide), this.ctx.currentTime + t.dur);
    g.gain.setValueAtTime(t.gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + t.dur);
    osc.connect(g);
    g.connect(dest ?? this.sfx);
    osc.start();
    osc.stop(this.ctx.currentTime + t.dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private startDrone() {
    if (!this.ctx || !this.music || this.drone) return;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o2.type = "triangle";
    o.frequency.value = 55;
    o2.frequency.value = 82;
    g.gain.value = 0.18;
    o.connect(g);
    o2.connect(g);
    g.connect(this.music);
    o.start();
    o2.start();
    this.drone = o;
  }

  shot() {
    const jitter = 0.92 + Math.random() * 0.16;
    this.beep({ type: "square", freq: 420 * jitter, dur: 0.07, gain: 0.09, slide: 180 });
  }

  hit() {
    this.beep({ type: "sawtooth", freq: 180, dur: 0.12, gain: 0.12, slide: 70 });
  }

  boom() {
    this.beep({ type: "triangle", freq: 90, dur: 0.28, gain: 0.2, slide: 40 });
  }

  pickup() {
    this.beep({ type: "sine", freq: 520, dur: 0.12, gain: 0.1, slide: 880 });
  }

  hurt() {
    this.beep({ type: "square", freq: 140, dur: 0.18, gain: 0.16, slide: 60 });
  }

  overheat() {
    this.beep({ type: "sawtooth", freq: 240, dur: 0.4, gain: 0.14, slide: 90 });
  }

  buff() {
    this.beep({ type: "sine", freq: 360, dur: 0.22, gain: 0.12, slide: 720 });
  }

  win() {
    this.beep({ type: "sine", freq: 440, dur: 0.18, gain: 0.12, slide: 660 });
    setTimeout(() => this.beep({ type: "sine", freq: 660, dur: 0.28, gain: 0.12, slide: 880 }), 120);
  }

  fail() {
    this.beep({ type: "triangle", freq: 220, dur: 0.4, gain: 0.14, slide: 70 });
  }
}

export const audio = new EmberAudio();
