const LEVEL_SMOOTHING = 0.08;

export class SoundChannel {
  private volumeShare = 1;
  private enabled = true;
  private node?: GainNode;

  public constructor(
    private readonly fullLevel: number,
    private readonly parent?: SoundChannel,
  ) {}

  public get volume(): number {
    return this.volumeShare;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public get isAdjustable(): boolean {
    return this.parent?.isAudible ?? true;
  }

  public get isAudible(): boolean {
    return this.enabled && this.isAdjustable;
  }

  public get level(): number {
    return this.enabled ? this.fullLevel * this.volumeShare : 0;
  }

  public connect(context: AudioContext, destination: AudioNode): GainNode {
    const node = new GainNode(context, { gain: this.level });

    node.connect(destination);
    this.node = node;

    return node;
  }

  public setVolume(volume: number): void {
    this.volumeShare = volume;
    this.applyLevel();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyLevel();
  }

  private applyLevel(): void {
    if (this.node) {
      const now = this.node.context.currentTime;

      this.node.gain.cancelScheduledValues(now);
      this.node.gain.setTargetAtTime(this.level, now, LEVEL_SMOOTHING);
    }
  }
}
