import { CoastFoam } from './CoastFoam';
import { RiverShimmer } from './RiverShimmer';
import { SeaSwell } from './SeaSwell';
import { Volcano } from './Volcano';

export class MapAmbience {
  public constructor(private readonly svg: SVGSVGElement) {}

  public play(signal: AbortSignal): void {
    new SeaSwell(this.svg).play(signal);
    new CoastFoam(this.svg).play(signal);
    new RiverShimmer(this.svg).play(signal);
    new Volcano(this.svg).mount();
  }
}
