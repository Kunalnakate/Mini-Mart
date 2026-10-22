/**
 * Procedural Web Audio synthesizer for Mini Mart 3D.
 * Implements a complete supermarket audio landscape:
 * - Subtle room-tone murmur & crowd presence (filtered procedural pink noise & formant modulation)
 * - Authentic shopping cart wheel rattles & tile clicks
 * - Soft distant market intercom chime
 * - Gentle, relaxing supermarket lounge music (marimba, warm bass, soft shaker)
 * - Dynamic game sound effects (harvest, stock, checkout, coin cascade, unlock, upgrade)
 * 100% procedural Web Audio API with zero external file dependencies or 404s.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private ambianceGain: GainNode | null = null;

  // Music State
  private bgmPlaying: boolean = false;
  private bgmTimeoutId: number | null = null;
  private bgmCurrentBar: number = 0;

  // Ambiance State
  private ambiancePlaying: boolean = false;
  private murmurSource: AudioBufferSourceNode | null = null;
  private murmurGain: GainNode | null = null;
  private murmurLfo: OscillatorNode | null = null;
  private cartTimeoutId: number | null = null;
  private chimeTimeoutId: number | null = null;

  // Rain Audio State
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainPlaying: boolean = false;

  // Sound effect tracking
  private coinPitchIndex: number = 0;
  private lastCoinTime: number = 0;
  private lastCartRattleTime: number = 0;

  constructor() {
    // Initialized on first user interaction to comply with browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Sub-bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // BGM Sub-bus (gentle mix level)
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Store Ambiance Sub-bus (warm, subtle backdrop)
      this.ambianceGain = this.ctx.createGain();
      this.ambianceGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.ambianceGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.75, t + 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // -------------------------------------------------------------
  // STORE AMBIANCE GENERATOR
  // -------------------------------------------------------------

  /**
   * Starts supermarket room tone, crowd murmurs, and periodic shopping cart activity.
   */
  public startAmbiance() {
    if (this.ambiancePlaying) return;
    this.initCtx();
    if (!this.ctx || !this.ambianceGain) return;

    this.ambiancePlaying = true;
    this.startRoomMurmur();
    this.scheduleNextCartRattle();
    this.scheduleNextIntercomChime();
  }

  public stopAmbiance() {
    this.ambiancePlaying = false;

    if (this.cartTimeoutId !== null) {
      window.clearTimeout(this.cartTimeoutId);
      this.cartTimeoutId = null;
    }

    if (this.chimeTimeoutId !== null) {
      window.clearTimeout(this.chimeTimeoutId);
      this.chimeTimeoutId = null;
    }

    if (this.murmurSource) {
      try {
        this.murmurSource.stop();
        this.murmurSource.disconnect();
      } catch {
        // Ignored if already stopped
      }
      this.murmurSource = null;
    }

    if (this.murmurLfo) {
      try {
        this.murmurLfo.stop();
        this.murmurLfo.disconnect();
      } catch {
        // Ignored
      }
      this.murmurLfo = null;
    }

    this.stopRainSound();
  }

  /**
   * Procedural filtered pink noise with slow dual-LFO volume swelling to simulate
   * the natural hum, ventilation, and distant gentle murmurs of shoppers.
   */
  private startRoomMurmur() {
    if (!this.ctx || !this.ambianceGain) return;

    // Generate 4-second seamless pink noise loop
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    const left = noiseBuffer.getChannelData(0);
    const right = noiseBuffer.getChannelData(1);

    // Paul Kellet's pink noise algorithm
    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      b0L = 0.99886 * b0L + whiteL * 0.0555179;
      b1L = 0.99332 * b1L + whiteL * 0.0750759;
      b2L = 0.969 * b2L + whiteL * 0.153852;
      b3L = 0.8665 * b3L + whiteL * 0.3104856;
      b4L = 0.55 * b4L + whiteL * 0.5329522;
      b5L = -0.7616 * b5L - whiteL * 0.016898;
      left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.08;
      b6L = whiteL * 0.115926;

      const whiteR = Math.random() * 2 - 1;
      b0R = 0.99886 * b0R + whiteR * 0.0555179;
      b1R = 0.99332 * b1R + whiteR * 0.0750759;
      b2R = 0.969 * b2R + whiteR * 0.153852;
      b3R = 0.8665 * b3R + whiteR * 0.3104856;
      b4R = 0.55 * b4R + whiteR * 0.5329522;
      b5R = -0.7616 * b5R - whiteR * 0.016898;
      right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.08;
      b6R = whiteR * 0.115926;
    }

    // Source node
    this.murmurSource = this.ctx.createBufferSource();
    this.murmurSource.buffer = noiseBuffer;
    this.murmurSource.loop = true;

    // Filter to warm low supermarket room-tone (350Hz low-pass)
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(360, this.ctx.currentTime);
    lowpass.Q.setValueAtTime(1.1, this.ctx.currentTime);

    // Formant vocal presence peak (distant chatter resonance at 750Hz)
    const formantPeaking = this.ctx.createBiquadFilter();
    formantPeaking.type = 'peaking';
    formantPeaking.frequency.setValueAtTime(750, this.ctx.currentTime);
    formantPeaking.gain.setValueAtTime(4.0, this.ctx.currentTime);
    formantPeaking.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Gain node for murmur volume & LFO modulation
    this.murmurGain = this.ctx.createGain();
    this.murmurGain.gain.setValueAtTime(0.065, this.ctx.currentTime);

    // Subtle breathing LFO at 0.12 Hz (swells crowd murmur gently)
    this.murmurLfo = this.ctx.createOscillator();
    this.murmurLfo.type = 'sine';
    this.murmurLfo.frequency.setValueAtTime(0.11, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.025, this.ctx.currentTime);

    this.murmurLfo.connect(lfoGain);
    lfoGain.connect(this.murmurGain.gain);

    // Connect audio chain
    this.murmurSource.connect(lowpass);
    lowpass.connect(formantPeaking);
    formantPeaking.connect(this.murmurGain);
    this.murmurGain.connect(this.ambianceGain);

    this.murmurSource.start();
    this.murmurLfo.start();
  }

  /**
   * Sets the volume of the procedural rain ambience (0.0 to 1.0).
   * Lazy initializes the rain sound generator if volume > 0.
   */
  public setRainVolume(volume: number) {
    if (this.isMuted) return;

    if (volume > 0.01) {
      if (!this.rainPlaying) {
        this.startRainSound();
      }
      if (this.ctx && this.rainGain) {
        const t = this.ctx.currentTime;
        const clampedVol = Math.max(0, Math.min(0.45, volume * 0.35));
        this.rainGain.gain.cancelScheduledValues(t);
        this.rainGain.gain.linearRampToValueAtTime(clampedVol, t + 0.2);
      }
    } else if (this.rainPlaying && this.rainGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.rainGain.gain.cancelScheduledValues(t);
      this.rainGain.gain.linearRampToValueAtTime(0.0001, t + 0.3);
    }
  }

  /**
   * Generates a 3-second seamless procedural rainfall audio loop
   * combining filtered white-pink noise and subtle droplet clicks.
   */
  private startRainSound() {
    if (this.rainPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.ambianceGain) return;

    this.rainPlaying = true;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const rainBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    const left = rainBuffer.getChannelData(0);
    const right = rainBuffer.getChannelData(1);

    // Multi-layer rain noise: low rumble + high patter
    for (let i = 0; i < bufferSize; i++) {
      const wL = (Math.random() * 2 - 1) * 0.08;
      const wR = (Math.random() * 2 - 1) * 0.08;
      // Random micro droplet impulses
      const microDropL = Math.random() < 0.004 ? (Math.random() * 0.25) : 0;
      const microDropR = Math.random() < 0.004 ? (Math.random() * 0.25) : 0;
      left[i] = wL + microDropL;
      right[i] = wR + microDropR;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = rainBuffer;
    this.rainSource.loop = true;

    // Bandpass filter centered at 1400Hz to evoke natural rain texture hitting foliage & ground
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // High shelf to gently attenuate harsh treble
    const highShelf = this.ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(3500, this.ctx.currentTime);
    highShelf.gain.setValueAtTime(-4, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.rainSource.connect(filter);
    filter.connect(highShelf);
    highShelf.connect(this.rainGain);
    this.rainGain.connect(this.ambianceGain);

    this.rainSource.start();
  }

  private stopRainSound() {
    this.rainPlaying = false;
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch {
        // Ignored
      }
      this.rainSource = null;
    }
    this.rainGain = null;
  }

  /**
   * Plays realistic shopping cart wheel rattle and caster clicks over supermarket floor tiles.
   * Can be triggered on shopper movement or scheduled periodically.
   */
  public playCartRattle(volumeScale: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.ambianceGain) return;

    const now = Date.now();
    // Throttle close rapid triggers
    if (now - this.lastCartRattleTime < 180) return;
    this.lastCartRattleTime = now;

    const t = this.ctx.currentTime;
    const clicks = 2 + Math.floor(Math.random() * 3); // 2 to 4 rapid caster wheel clicks

    for (let i = 0; i < clicks; i++) {
      const clickTime = t + i * (0.035 + Math.random() * 0.03);

      // 1. Resonant metallic caster basket click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      const resonantFreq = 1800 + Math.random() * 1200; // 1.8kHz - 3.0kHz metal clink
      osc.frequency.setValueAtTime(resonantFreq, clickTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(resonantFreq, clickTime);
      filter.Q.setValueAtTime(6.0, clickTime);

      const amp = (0.015 + Math.random() * 0.02) * volumeScale;
      gain.gain.setValueAtTime(amp, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambianceGain);

      osc.start(clickTime);
      osc.stop(clickTime + 0.045);

      // 2. Low wheel tire bump over tile grout line
      const bumpOsc = this.ctx.createOscillator();
      const bumpGain = this.ctx.createGain();
      bumpOsc.type = 'sine';
      bumpOsc.frequency.setValueAtTime(140 + Math.random() * 40, clickTime);
      bumpOsc.frequency.exponentialRampToValueAtTime(60, clickTime + 0.035);

      bumpGain.gain.setValueAtTime(0.025 * volumeScale, clickTime);
      bumpGain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.035);

      bumpOsc.connect(bumpGain);
      bumpGain.connect(this.ambianceGain);

      bumpOsc.start(clickTime);
      bumpOsc.stop(clickTime + 0.035);
    }
  }

  private scheduleNextCartRattle() {
    if (!this.ambiancePlaying) return;

    // Random interval between 3.5s and 7.5s for authentic periodic store atmosphere
    const nextInterval = 3500 + Math.random() * 4000;
    this.cartTimeoutId = window.setTimeout(() => {
      if (this.ambiancePlaying && !this.isMuted) {
        this.playCartRattle(0.8 + Math.random() * 0.4);
      }
      this.scheduleNextCartRattle();
    }, nextInterval);
  }

  /**
   * Gentle, soft two-tone supermarket announcement chime (ding-dong) in the distance.
   */
  public playStoreChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.ambianceGain) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 783.99, delay: 0 },    // G5
      { freq: 659.25, delay: 0.28 }, // E5
    ];

    notes.forEach((note) => {
      if (!this.ctx || !this.ambianceGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, t + note.delay);

      gain.gain.setValueAtTime(0.04, t + note.delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.delay + 0.85);

      osc.connect(gain);
      gain.connect(this.ambianceGain);

      osc.start(t + note.delay);
      osc.stop(t + note.delay + 0.85);
    });
  }

  private scheduleNextIntercomChime() {
    if (!this.ambiancePlaying) return;

    // Distant intercom chime every 28 to 45 seconds
    const interval = 28000 + Math.random() * 17000;
    this.chimeTimeoutId = window.setTimeout(() => {
      if (this.ambiancePlaying && !this.isMuted) {
        this.playStoreChime();
      }
      this.scheduleNextIntercomChime();
    }, interval);
  }

  // -------------------------------------------------------------
  // GENTLE SUPERMARKET LOUNGE MUSIC (BGM)
  // -------------------------------------------------------------

  /**
   * Starts both background music and supermarket ambient audio loop.
   */
  public startStoreAudio() {
    this.startAmbiance();
    this.startBgm();
  }

  public stopStoreAudio() {
    this.stopAmbiance();
    this.stopBgm();
  }

  public startBgm() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.scheduleNextBgmBar();
  }

  public stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  /**
   * 8-bar cheerful, relaxing supermarket lounge bossa chord progression:
   * Cmaj7 -> Am7 -> Dm7 -> G7(13) -> Em7 -> A7 -> Dm7 -> G7sus4
   */
  private scheduleNextBgmBar() {
    if (!this.bgmPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.bgmGain) {
      this.bgmTimeoutId = window.setTimeout(() => this.scheduleNextBgmBar(), 1000);
      return;
    }

    const t = this.ctx.currentTime + 0.05;
    const barDuration = 2.4; // 100 BPM (0.6s per beat)
    const beatDuration = barDuration / 4;

    const progression = [
      // Bar 0: Cmaj7
      { root: 130.81, chord: [261.63, 329.63, 392.0, 493.88], bass: [130.81, 196.0] },
      // Bar 1: Am7
      { root: 110.0, chord: [220.0, 261.63, 329.63, 392.0], bass: [110.0, 164.81] },
      // Bar 2: Dm7
      { root: 146.83, chord: [293.66, 349.23, 440.0, 523.25], bass: [146.83, 220.0] },
      // Bar 3: G7
      { root: 98.0, chord: [246.94, 293.66, 349.23, 440.0], bass: [98.0, 146.83] },
      // Bar 4: Em7
      { root: 164.81, chord: [329.63, 392.0, 493.88, 587.33], bass: [164.81, 246.94] },
      // Bar 5: A7
      { root: 110.0, chord: [220.0, 277.18, 329.63, 392.0], bass: [110.0, 164.81] },
      // Bar 6: Dm9
      { root: 146.83, chord: [293.66, 349.23, 440.0, 659.25], bass: [146.83, 220.0] },
      // Bar 7: G7sus4 -> G7
      { root: 98.0, chord: [261.63, 293.66, 349.23, 392.0], bass: [98.0, 146.83] },
    ];

    const currentData = progression[this.bgmCurrentBar % progression.length];
    this.bgmCurrentBar = (this.bgmCurrentBar + 1) % progression.length;

    // 1. Warm Acoustic Walking Bass (Beats 1 & 3)
    [0, 2].forEach((beatIdx, i) => {
      if (!this.ctx || !this.bgmGain) return;
      const bassTime = t + beatIdx * beatDuration;
      const freq = currentData.bass[i % currentData.bass.length];

      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(freq, bassTime);

      bGain.gain.setValueAtTime(0.09, bassTime);
      bGain.gain.exponentialRampToValueAtTime(0.001, bassTime + beatDuration * 1.6);

      bOsc.connect(bGain);
      bGain.connect(this.bgmGain);

      bOsc.start(bassTime);
      bOsc.stop(bassTime + beatDuration * 1.6);
    });

    // 2. Sweet Marimba & Vibraphone Arpeggio
    const pattern = [0, 2, 1, 3, 2, 0, 1, 2]; // 8th note arpeggio
    pattern.forEach((noteIdx, step) => {
      if (!this.ctx || !this.bgmGain) return;
      // Skip some steps occasionally for musical breathing room
      if (step === 3 && Math.random() > 0.6) return;
      if (step === 7 && Math.random() > 0.5) return;

      const stepTime = t + (step * barDuration) / 8;
      const noteFreq = currentData.chord[noteIdx % currentData.chord.length];

      // Primary tone
      const mOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      mOsc.type = 'triangle';
      mOsc.frequency.setValueAtTime(noteFreq, stepTime);

      // Soft marimba attack & decay
      mGain.gain.setValueAtTime(0.045, stepTime);
      mGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.22);

      mOsc.connect(mGain);
      mGain.connect(this.bgmGain);

      mOsc.start(stepTime);
      mOsc.stop(stepTime + 0.22);

      // Subtle upper harmonic bell chime on select beats
      if (step === 0 || step === 4) {
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(noteFreq * 2, stepTime);

        bellGain.gain.setValueAtTime(0.015, stepTime);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.35);

        bellOsc.connect(bellGain);
        bellGain.connect(this.bgmGain);

        bellOsc.start(stepTime);
        bellOsc.stop(stepTime + 0.35);
      }
    });

    // 3. Gentle Shaker / Brushed Hat on off-beats (beats 2 & 4)
    [1, 3].forEach((beatIdx) => {
      if (!this.ctx || !this.bgmGain) return;
      const shakerTime = t + beatIdx * beatDuration;

      // Filtered noise pulse
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.045);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'highpass';
      bandpass.frequency.setValueAtTime(6000, shakerTime);

      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(0.015, shakerTime);
      sGain.gain.exponentialRampToValueAtTime(0.0001, shakerTime + 0.045);

      noise.connect(bandpass);
      bandpass.connect(sGain);
      sGain.connect(this.bgmGain);

      noise.start(shakerTime);
      noise.stop(shakerTime + 0.045);
    });

    // Schedule next bar with a small lookahead
    this.bgmTimeoutId = window.setTimeout(() => {
      this.scheduleNextBgmBar();
    }, barDuration * 1000 - 80);
  }

  // -------------------------------------------------------------
  // GAMEPLAY SOUND EFFECTS
  // -------------------------------------------------------------

  public playHarvest() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playStock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.09);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const now = Date.now();
    if (now - this.lastCoinTime > 300) {
      this.coinPitchIndex = 0;
    } else {
      this.coinPitchIndex = (this.coinPitchIndex + 1) % 6;
    }
    this.lastCoinTime = now;

    const pitches = [987.77, 1174.66, 1318.51, 1567.98, 1760.0, 1975.53]; // B5, D6, E6, G6, A6, B6
    const baseFreq = pitches[this.coinPitchIndex];

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playCheckout() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Scanner beep
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, t); // A6
    gain1.gain.setValueAtTime(0.25, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Cash register bell
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2093, t + 0.05); // C7
    gain2.gain.setValueAtTime(0.25, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.35);
  }

  public playUnlock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.25, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.3);
    });
  }

  public playUpgrade() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.25);
    });
  }
}

export const sound = new SoundSystem();
