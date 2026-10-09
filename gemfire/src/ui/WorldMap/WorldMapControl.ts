import type { InvasionReport } from '@/core/domain/InvasionReport';
import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';
import type { WorldMapContext } from './types';
import { CLASH_MS, MARCH_MS } from './WarMarch';
import { WorldMapView } from './WorldMapView';

export class WorldMapControl extends Control<WorldMapView> {
  private deferred: Map<number, Province> | undefined;

  public constructor(context: WorldMapContext) {
    super(WorldMapView, context);
  }

  public onProvinceSelected(handler: (province: Province) => void): void {
    this.subscribe(ProvinceSelectedEvent, (event) => {
      handler(this.context.map.getProvince(event.provinceNumber));
    });
  }

  public showWar(report: InvasionReport, onShown: () => void): void {
    const duration = report.isFought ? MARCH_MS + CLASH_MS : MARCH_MS;

    this.deferred = new Map();
    this.view.showWar(report);

    if (report.isFought) {
      setTimeout(() => this.context.sounds.playSkirmish(), MARCH_MS);
    }

    setTimeout(() => {
      this.view.clearWar();
      this.actualizeDeferred();
      onShown();
    }, duration);
  }

  public showCurrent(province: Province): void {
    this.clearHighlighting();
    this.view.addHighlighting(province.number, 'current');
  }

  public actualizeProvince(province: Province): void {
    if (this.deferred) {
      this.deferred.set(province.number, province);
    } else {
      this.view.actualizeProvince(province);
    }
  }

  public showSelectable(provinceNumbers: readonly number[]): void {
    for (const provinceNumber of provinceNumbers) {
      this.view.addHighlighting(provinceNumber, 'selectable');
    }
  }

  public showSelected(provinceNumber: number): void {
    this.view.addHighlighting(provinceNumber, 'selected');
  }

  public clearHighlighting(): void {
    this.view.clearHighlighting();
  }

  private actualizeDeferred(): void {
    const provinces = [...(this.deferred?.values() ?? [])];

    this.deferred = undefined;

    for (const province of provinces) {
      this.view.actualizeProvince(province);
    }
  }
}
