declare module 'zzfx' {
  export const ZZFX: {
    readonly sampleRate: number;
    buildSamples(...parameters: readonly number[]): Float32Array;
  };
}
