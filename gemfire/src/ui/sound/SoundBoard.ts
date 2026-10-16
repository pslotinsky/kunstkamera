import type { ZZFX } from 'zzfx';

import type { RangePattern } from '@/core/domain/Unit';
import { getPublicAssetUrl } from '@/ui/art/getPublicAssetUrl';

const MASTER_LEVEL = 0.4;
const EFFECTS_LEVEL = 0.35;
const DEFAULT_ATTACK = 0.005;
const SILENCE = 0.001;

function prefers(engine: string): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has(engine)
  );
}

const PREFERS_ZZFX = prefers('zzfx');

const MUSIC_LEVEL = 0.25;
const MUSIC_FADE = 0.6;

const MUSIC_TRACKS = {
  map: getPublicAssetUrl('music/strategic-map.mp3'),
  battle: getPublicAssetUrl('music/battle.mp3'),
} as const;

export type MusicTrack = keyof typeof MUSIC_TRACKS;

interface MusicChannel {
  readonly element: HTMLAudioElement;
  readonly gain: GainNode;
  track?: MusicTrack;
}

function spread(name: string, count: number): readonly string[] {
  return [...Array(count).keys()].map((index) => `${name}-${index}`);
}

interface SampleCue {
  readonly files: readonly string[];
  readonly volume: number;
  readonly varies?: boolean;
}

const SAMPLE_BANK: Readonly<Record<string, SampleCue>> = {
  click: { files: spread('click', 1), volume: 0.5 },
  step: { files: spread('step', 5), volume: 0.5, varies: true },
  strike: { files: spread('strike', 5), volume: 0.6, varies: true },
  blow: { files: spread('blow', 4), volume: 0.5, varies: true },
  melee: { files: spread('melee', 4), volume: 0.6, varies: true },
  ranged: { files: spread('ranged', 4), volume: 0.6, varies: true },
  magic: { files: spread('magic', 4), volume: 0.55 },
  horn: { files: spread('horn', 4), volume: 0.5 },
  herald: { files: spread('herald', 2), volume: 0.5 },
  knock: { files: spread('knock', 5), volume: 0.6, varies: true },
  crack: { files: spread('crack', 5), volume: 0.6, varies: true },
  bell: { files: spread('bell', 5), volume: 0.5 },
  glitter: { files: spread('glitter', 2), volume: 0.5 },
};

const STRIKE_CUES: Readonly<Record<RangePattern, string>> = {
  short: 'melee',
  long: 'ranged',
  circular: 'magic',
  largest: 'magic',
};

interface ZzfxNote {
  readonly params: readonly number[];
  readonly delay?: number;
}

const ZZFX_CLICK: readonly ZzfxNote[] = [
  { params: [0.12, 0, 900, 0.001, 0.01, 0.04, 1, 1.5, -20] },
];

const ZZFX_STEP: readonly ZzfxNote[] = [
  { params: [0.12, 0.15, 110, 0.005, 0, 0.08, 0, 1, 0, 0, 0, 0, 0, 4] },
];

const ZZFX_STRIKE: readonly ZzfxNote[] = [
  {
    params: [
      0.45, 0.1, 470, 0.002, 0.03, 0.18, 3, 1.9, -8, 0, 0, 0, 0, 0.9, 0, 0.1, 0,
      0.7, 0.04,
    ],
  },
];

const ZZFX_BLOW: readonly ZzfxNote[] = [
  { params: [0.55, 0.05, 95, 0.01, 0, 0.22, 0, 1, 0, 0, 0, 0, 0, 5] },
];

const ZZFX_KNOCK: readonly ZzfxNote[] = [
  { params: [0.25, 0.05, 240, 0.002, 0.02, 0.06, 0, 1, 0, 0, 0, 0, 0, 2.5] },
  {
    params: [0.2, 0.05, 210, 0.002, 0.02, 0.06, 0, 1, 0, 0, 0, 0, 0, 2.5],
    delay: 0.15,
  },
];

const ZZFX_CRACK: readonly ZzfxNote[] = [
  { params: [0.3, 0.1, 1000, 0.001, 0.02, 0.14, 4, 1, -4, 0, 0, 0, 0, 3] },
];

const ZZFX_HORN: readonly ZzfxNote[] = [
  { params: [0.18, 0.02, 110, 0.25, 0.5, 0.45, 2, 1.2, 0, 0, 0, 0, 0, 0, 1.5] },
];

const ZZFX_FANFARE: readonly ZzfxNote[] = [
  { params: [0.16, 0, 523.25, 0.01, 0.08, 0.12, 1, 1.5] },
  { params: [0.16, 0, 659.25, 0.01, 0.08, 0.12, 1, 1.5], delay: 0.13 },
  { params: [0.16, 0, 783.99, 0.01, 0.08, 0.12, 1, 1.5], delay: 0.26 },
  { params: [0.16, 0, 1046.5, 0.01, 0.3, 0.3, 1, 1.5], delay: 0.39 },
];

const ZZFX_DIRGE: readonly ZzfxNote[] = [
  { params: [0.16, 0, 220, 0.05, 0.3, 0.3, 1, 1] },
  { params: [0.16, 0, 174.61, 0.05, 0.4, 0.5, 1, 1], delay: 0.55 },
];

const ZZFX_BELL: readonly ZzfxNote[] = [
  {
    params: [
      0.14, 0, 330, 0.002, 0.08, 1.6, 0, 1, 0, 0, 0, 0, 0, 0, 1.2, 0, 0, 0.5,
      0.1,
    ],
  },
];

const ZZFX_GLITTER: readonly ZzfxNote[] = [
  { params: [0.1, 0, 880, 0.001, 0.02, 0.06, 1, 1] },
  { params: [0.1, 0, 1174.66, 0.001, 0.02, 0.06, 1, 1], delay: 0.07 },
  { params: [0.1, 0, 1567.98, 0.001, 0.02, 0.06, 1, 1], delay: 0.14 },
  { params: [0.1, 0, 2093, 0.001, 0.02, 0.06, 1, 1], delay: 0.21 },
];

const ZZFX_ALARM: readonly ZzfxNote[] = [
  { params: [0.2, 0.01, 196, 0.02, 0.2, 0.12, 2, 1] },
  { params: [0.2, 0.01, 196, 0.02, 0.28, 0.12, 2, 1], delay: 0.42 },
];

interface Output {
  readonly context: AudioContext;
  readonly master: GainNode;
  readonly effects: GainNode;
}

interface EnvelopeParams {
  readonly duration: number;
  readonly peak: number;
  readonly delay?: number;
  readonly attack?: number;
}

interface ToneParams extends EnvelopeParams {
  readonly type: OscillatorType;
  readonly frequency: number;
  readonly glideTo?: number;
}

interface NoiseParams extends EnvelopeParams {
  readonly filter: BiquadFilterType;
  readonly frequency: number;
}

export class SoundBoard {
  private context?: AudioContext;
  private master?: GainNode;
  private effects?: GainNode;
  private noiseBuffer?: AudioBuffer;
  private zzfx?: typeof ZZFX;
  private samples?: Map<string, AudioBuffer[]>;
  private track?: MusicTrack;
  private music?: MusicChannel;
  private switching?: ReturnType<typeof setTimeout> | undefined;

  public unlock(): void {
    const context = this.ensureContext();

    if (context?.state === 'suspended') {
      void context.resume().then(() => this.startMusic());
    }

    this.loadZzfx();
    this.loadSamples();
    this.startMusic();
  }

  public playMusic(track: MusicTrack): void {
    if (this.track !== track) {
      this.track = track;
      this.startMusic();
    }
  }

  public playClick(): void {
    if (this.hasSample('click')) {
      this.playSample('click');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_CLICK);
    } else {
      this.playClickRecipe();
    }
  }

  public playStep(): void {
    if (this.hasSample('step')) {
      this.playSample('step');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_STEP);
    } else {
      this.playStepRecipe();
    }
  }

  public playStrike(range: RangePattern): void {
    const cue = STRIKE_CUES[range];

    if (this.hasSample(cue)) {
      this.playSample(cue);
    } else if (this.hasSample('strike')) {
      this.playSample('strike');
    } else if (this.zzfx) {
      this.playPlan(ZZFX_STRIKE);
    } else {
      this.playStrikeRecipe();
    }
  }

  public playBlow(): void {
    if (this.hasSample('blow')) {
      this.playSample('blow');
    } else if (this.zzfx) {
      this.playPlan(ZZFX_BLOW);
    } else {
      this.playBlowRecipe();
    }
  }

  public playKnock(): void {
    if (this.hasSample('knock')) {
      this.playSample('knock');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_KNOCK);
    } else {
      this.playKnockRecipe();
    }
  }

  public playCrack(): void {
    if (this.hasSample('crack')) {
      this.playSample('crack');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_CRACK);
    } else {
      this.playCrackRecipe();
    }
  }

  public playHorn(): void {
    if (this.hasSample('horn')) {
      this.playSample('horn');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_HORN);
    } else {
      this.playHornRecipe();
    }
  }

  public playFanfare(): void {
    if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_FANFARE);
    } else {
      this.playFanfareRecipe();
    }
  }

  public playDirge(): void {
    if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_DIRGE);
    } else {
      this.playDirgeRecipe();
    }
  }

  public playBell(): void {
    if (this.hasSample('bell')) {
      this.playSample('bell');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_BELL);
    } else {
      this.playBellRecipe();
    }
  }

  public playGlitter(): void {
    if (this.hasSample('glitter')) {
      this.playSample('glitter');
    } else if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_GLITTER);
    } else {
      this.playGlitterRecipe();
    }
  }

  public playAlarm(): void {
    if (PREFERS_ZZFX && this.zzfx) {
      this.playPlan(ZZFX_ALARM);
    } else {
      this.playAlarmRecipe();
    }
  }

  public playSkirmish(): void {
    if (this.hasSample('strike')) {
      this.playSample('strike', { scale: 0.5 });
      this.playSample('strike', { scale: 0.35, delay: 0.25 });
    } else if (this.zzfx) {
      this.playPlan(ZZFX_STRIKE);
    }
  }

  public playHerald(): void {
    if (this.hasSample('herald')) {
      this.playSample('herald');
    } else {
      this.playHeraldRecipe();
    }
  }

  private playClickRecipe(): void {
    this.tone({
      type: 'square',
      frequency: 1100,
      glideTo: 740,
      duration: 0.045,
      peak: 0.1,
    });
  }

  private playStepRecipe(): void {
    const footfall = 380 + Math.random() * 120;

    this.noise({
      filter: 'lowpass',
      frequency: footfall,
      duration: 0.055,
      peak: 0.12,
    });
  }

  private playStrikeRecipe(): void {
    const ring = Math.random() * 40;

    this.noise({
      filter: 'highpass',
      frequency: 2500,
      duration: 0.09,
      peak: 0.16,
    });
    this.tone({
      type: 'square',
      frequency: 440 + ring,
      glideTo: 330,
      duration: 0.14,
      peak: 0.1,
    });
    this.tone({
      type: 'square',
      frequency: 587 + ring,
      glideTo: 415,
      duration: 0.11,
      peak: 0.07,
    });
  }

  private playBlowRecipe(): void {
    this.tone({
      type: 'sine',
      frequency: 120,
      glideTo: 45,
      duration: 0.3,
      peak: 0.3,
    });
    this.noise({
      filter: 'lowpass',
      frequency: 320,
      duration: 0.12,
      peak: 0.1,
    });
  }

  private playKnockRecipe(): void {
    this.noise({
      filter: 'bandpass',
      frequency: 640,
      duration: 0.05,
      peak: 0.22,
    });
    this.noise({
      filter: 'bandpass',
      frequency: 520,
      duration: 0.05,
      peak: 0.18,
      delay: 0.15,
    });
  }

  private playCrackRecipe(): void {
    this.noise({
      filter: 'bandpass',
      frequency: 1200,
      duration: 0.16,
      peak: 0.24,
    });
    this.tone({
      type: 'triangle',
      frequency: 210,
      glideTo: 80,
      duration: 0.15,
      peak: 0.1,
    });
  }

  private playHornRecipe(): void {
    this.tone({
      type: 'sawtooth',
      frequency: 110,
      duration: 1.2,
      peak: 0.14,
      attack: 0.3,
    });
    this.tone({
      type: 'sawtooth',
      frequency: 164.8,
      duration: 1.2,
      peak: 0.09,
      attack: 0.3,
    });
  }

  private playFanfareRecipe(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((note, beat) => {
      const holds = beat === notes.length - 1;

      this.tone({
        type: 'triangle',
        frequency: note,
        duration: holds ? 0.6 : 0.17,
        peak: 0.13,
        delay: beat * 0.13,
        attack: 0.01,
      });
    });
  }

  private playDirgeRecipe(): void {
    this.tone({
      type: 'triangle',
      frequency: 220,
      duration: 0.6,
      peak: 0.13,
      attack: 0.05,
    });
    this.tone({
      type: 'triangle',
      frequency: 174.61,
      duration: 1,
      peak: 0.13,
      delay: 0.55,
      attack: 0.05,
    });
  }

  private playBellRecipe(): void {
    this.tone({ type: 'sine', frequency: 220, duration: 2, peak: 0.12 });
    this.tone({ type: 'sine', frequency: 440, duration: 1.6, peak: 0.07 });
    this.tone({ type: 'sine', frequency: 587, duration: 1.1, peak: 0.05 });
    this.tone({ type: 'sine', frequency: 923, duration: 0.7, peak: 0.03 });
  }

  private playGlitterRecipe(): void {
    const notes = [880, 1174.66, 1567.98, 2093];

    notes.forEach((note, beat) => {
      this.tone({
        type: 'triangle',
        frequency: note,
        duration: 0.09,
        peak: 0.07,
        delay: beat * 0.07,
      });
    });
  }

  private playAlarmRecipe(): void {
    this.tone({
      type: 'sawtooth',
      frequency: 196,
      duration: 0.3,
      peak: 0.16,
      attack: 0.02,
    });
    this.tone({
      type: 'sawtooth',
      frequency: 196,
      duration: 0.45,
      peak: 0.16,
      delay: 0.42,
      attack: 0.02,
    });
  }

  private playHeraldRecipe(): void {
    this.tone({
      type: 'triangle',
      frequency: 523.25,
      duration: 0.12,
      peak: 0.1,
    });
    this.tone({
      type: 'triangle',
      frequency: 659.25,
      duration: 0.2,
      peak: 0.1,
      delay: 0.12,
    });
  }

  private loadZzfx(): void {
    if (!this.zzfx) {
      void import('zzfx').then((module) => {
        this.zzfx = module.ZZFX;
      });
    }
  }

  private startMusic(): void {
    const output = this.findOutput();
    const track = this.track;

    if (output && track) {
      const music = this.ensureMusic(output);
      const url = MUSIC_TRACKS[track];

      if (music.track !== track) {
        music.track = track;
        this.fadeTo(output, music, url);
      }
    }
  }

  private ensureMusic(output: Output): MusicChannel {
    if (!this.music) {
      const element = new Audio();
      const gain = new GainNode(output.context, { gain: MUSIC_LEVEL });
      const source = output.context.createMediaElementSource(element);

      element.loop = true;
      source.connect(gain);
      gain.connect(output.master);
      this.music = { element, gain };
    }

    return this.music;
  }

  private fadeTo(output: Output, music: MusicChannel, url: string): void {
    if (this.switching !== undefined) {
      clearTimeout(this.switching);
      this.switching = undefined;
    }

    if (music.element.src) {
      const start = output.context.currentTime;

      music.gain.gain.cancelScheduledValues(start);
      music.gain.gain.setValueAtTime(music.gain.gain.value, start);
      music.gain.gain.linearRampToValueAtTime(0, start + MUSIC_FADE);
      this.switching = setTimeout(() => {
        this.switching = undefined;
        this.swapTrack(output, music, url);
      }, MUSIC_FADE * 1000);
    } else {
      this.swapTrack(output, music, url);
    }
  }

  private swapTrack(output: Output, music: MusicChannel, url: string): void {
    const start = output.context.currentTime;

    music.element.src = url;
    void music.element.play().catch(() => undefined);
    music.gain.gain.cancelScheduledValues(start);
    music.gain.gain.setValueAtTime(0, start);
    music.gain.gain.linearRampToValueAtTime(MUSIC_LEVEL, start + MUSIC_FADE);
  }

  private loadSamples(): void {
    const context = this.context;

    if (!this.samples && context) {
      const bank = new Map<string, AudioBuffer[]>();

      this.samples = bank;

      for (const [cue, sample] of Object.entries(SAMPLE_BANK)) {
        const buffers: AudioBuffer[] = [];

        bank.set(cue, buffers);

        for (const file of sample.files) {
          void this.fetchSample(context, file).then((buffer) => {
            if (buffer) {
              buffers.push(buffer);
            }
          });
        }
      }
    }
  }

  private async fetchSample(
    context: AudioContext,
    file: string,
  ): Promise<AudioBuffer | undefined> {
    try {
      const source = getPublicAssetUrl(`sounds/${file}.ogg`);
      const response = await fetch(source);
      const encoded = await response.arrayBuffer();

      return await context.decodeAudioData(encoded);
    } catch {
      return undefined;
    }
  }

  private hasSample(cue: string): boolean {
    return (this.samples?.get(cue)?.length ?? 0) > 0;
  }

  private playSample(
    cue: string,
    options: { scale?: number; delay?: number } = {},
  ): void {
    const output = this.findOutput();
    const buffers = this.samples?.get(cue) ?? [];
    const sample = SAMPLE_BANK[cue];
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];

    if (output && sample && buffer) {
      const level = new GainNode(output.context, {
        gain: sample.volume * (options.scale ?? 1),
      });
      const source = new AudioBufferSourceNode(output.context, {
        buffer,
        playbackRate: sample.varies ? 0.94 + Math.random() * 0.12 : 1,
      });

      source.connect(level);
      level.connect(output.effects);
      source.start(output.context.currentTime + (options.delay ?? 0));
    }
  }

  private playPlan(plan: readonly ZzfxNote[]): void {
    const zzfx = this.zzfx;

    if (zzfx) {
      for (const note of plan) {
        const samples = zzfx.buildSamples(...note.params);

        this.playSamples(samples, note.delay ?? 0);
      }
    }
  }

  private playSamples(samples: Float32Array, delay: number): void {
    const output = this.findOutput();
    const zzfx = this.zzfx;

    if (output && zzfx) {
      const buffer = output.context.createBuffer(
        1,
        samples.length,
        zzfx.sampleRate,
      );

      buffer.getChannelData(0).set(samples);

      const source = new AudioBufferSourceNode(output.context, { buffer });

      source.connect(output.effects);
      source.start(output.context.currentTime + delay);
    }
  }

  private tone(params: ToneParams): void {
    const output = this.findOutput();

    if (output) {
      const start = output.context.currentTime + (params.delay ?? 0);
      const end = start + params.duration;
      const oscillator = new OscillatorNode(output.context, {
        type: params.type,
        frequency: params.frequency,
      });
      const envelope = this.shapeEnvelope(output.context, params, start, end);

      if (params.glideTo !== undefined) {
        oscillator.frequency.setValueAtTime(params.frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(params.glideTo, end);
      }

      oscillator.connect(envelope);
      envelope.connect(output.effects);
      oscillator.start(start);
      oscillator.stop(end);
    }
  }

  private noise(params: NoiseParams): void {
    const output = this.findOutput();

    if (output) {
      const start = output.context.currentTime + (params.delay ?? 0);
      const end = start + params.duration;
      const source = new AudioBufferSourceNode(output.context, {
        buffer: this.getNoiseBuffer(output.context),
      });
      const filter = new BiquadFilterNode(output.context, {
        type: params.filter,
        frequency: params.frequency,
      });
      const envelope = this.shapeEnvelope(output.context, params, start, end);

      source.connect(filter);
      filter.connect(envelope);
      envelope.connect(output.effects);
      source.start(start);
      source.stop(end);
    }
  }

  private shapeEnvelope(
    context: AudioContext,
    params: EnvelopeParams,
    start: number,
    end: number,
  ): GainNode {
    const attack = params.attack ?? DEFAULT_ATTACK;
    const envelope = new GainNode(context, { gain: 0 });

    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(params.peak, start + attack);
    envelope.gain.exponentialRampToValueAtTime(SILENCE, end);

    return envelope;
  }

  private getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const buffer = context.createBuffer(
        1,
        context.sampleRate,
        context.sampleRate,
      );
      const samples = buffer.getChannelData(0);

      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }

      this.noiseBuffer = buffer;
    }

    return this.noiseBuffer;
  }

  private findOutput(): Output | undefined {
    const context = this.ensureContext();
    const master = this.master;
    const effects = this.effects;

    return context && master && effects && context.state === 'running'
      ? { context, master, effects }
      : undefined;
  }

  private ensureContext(): AudioContext | undefined {
    if (!this.context && typeof AudioContext !== 'undefined') {
      const context = new AudioContext();
      const master = new GainNode(context, { gain: MASTER_LEVEL });
      const effects = new GainNode(context, { gain: EFFECTS_LEVEL });

      master.connect(context.destination);
      effects.connect(master);
      this.context = context;
      this.master = master;
      this.effects = effects;
    }

    return this.context;
  }
}
