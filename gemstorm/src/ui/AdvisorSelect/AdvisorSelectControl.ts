import type { Scenario } from '@/config/scenarios';
import type { Advisor } from '@/core/domain/Advisor';
import { WorldFactory } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { getAdvisorPortraitUrl } from '@/ui/art/getAdvisorPortraitUrl';
import { ScenarioMapControl } from '@/ui/Setup/ScenarioMap/ScenarioMapControl';
import { TileSelectedEvent } from '@/ui/Setup/TileGrid/events/TileSelectedEvent';
import { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';
import type { Tile } from '@/ui/Setup/TileGrid/TileGridView';

import { AdvisorPreviewControl } from './AdvisorPreview/AdvisorPreviewControl';
import { AdvisorSelectView } from './AdvisorSelectView';
import type { AdvisorSelectControls } from './types';

export class AdvisorSelectControl extends Control<
  AdvisorSelectView,
  AdvisorSelectControls
> {
  private readonly advisors: readonly Advisor[];
  private selected: Advisor;

  public constructor() {
    const advisors = new WorldFactory().createAdvisors();

    super(
      AdvisorSelectView,
      {},
      {
        advisors: new TileGridControl({
          name: 'advisors',
          size: advisors.length,
          picture: 'portrait',
        }),
        preview: new AdvisorPreviewControl(),
        map: new ScenarioMapControl(),
      },
    );
    this.advisors = advisors;
    this.selected = advisors[0]!;
  }

  public get advisor(): Advisor {
    return this.selected;
  }

  public show(scenario: Scenario, familyName: string): void {
    const map = new WorldFactory().createMap(scenario);
    const family = map.getOwners().find((owner) => owner.name === familyName);
    const provinces = family ? map.getFamilyProvinces(family) : [];

    this.controls.map.show(scenario, map, familyName);
    this.controls.map.highlight(provinces);
    this.view.show();
  }

  public hide(): void {
    this.view.hide();
  }

  protected override onMount(): void {
    this.controls.advisors.view.subscribe(TileSelectedEvent, (event) =>
      this.select(event.key),
    );
    this.controls.advisors.showTiles(
      this.advisors.map((advisor) => this.toTile(advisor)),
    );
    this.select(this.selected.name);
  }

  private select(name: string): void {
    const advisor = this.advisors.find((candidate) => candidate.name === name);

    if (advisor) {
      this.selected = advisor;
      this.controls.advisors.select(advisor.name);
      this.controls.preview.showAdvisor(advisor);
    }
  }

  private toTile(advisor: Advisor): Tile {
    return {
      key: advisor.name,
      image: getAdvisorPortraitUrl(advisor),
      label: advisor.name,
    };
  }
}
