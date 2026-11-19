import type { Scenario } from '@/config/scenarios';
import type { CalendarDate } from '@/core/domain/CalendarDate';
import type { Family } from '@/core/domain/Family';
import type { WorldMap } from '@/core/domain/WorldMap';
import { WorldFactory } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { getFamilyCrestUrl } from '@/ui/common/art/getFamilyCrestUrl';
import { ScenarioMapControl } from '@/ui/screens/NewGameScreen/ScenarioMap/ScenarioMapControl';
import { TileSelectedEvent } from '@/ui/screens/NewGameScreen/TileGrid/events/TileSelectedEvent';
import { TileGridControl } from '@/ui/screens/NewGameScreen/TileGrid/TileGridControl';
import type { Tile } from '@/ui/screens/NewGameScreen/TileGrid/TileGridView';

import { FamilySelectView } from './FamilySelectView';
import { RulerPreviewControl } from './RulerPreview/RulerPreviewControl';
import type { FamilySelectControls } from './types';

const PLAYABLE_HOUSES = 4;

export class FamilySelectControl extends Control<
  FamilySelectView,
  FamilySelectControls
> {
  private scenario?: Scenario;
  private startDate?: CalendarDate;
  private map?: WorldMap;
  private families: readonly Family[] = [];
  private selected?: Family;

  public constructor() {
    super(
      FamilySelectView,
      {},
      {
        houses: new TileGridControl({
          name: 'houses',
          size: PLAYABLE_HOUSES,
          picture: 'emblem',
        }),
        ruler: new RulerPreviewControl(),
        map: new ScenarioMapControl(),
      },
    );
  }

  public get family(): Family {
    if (!this.selected) {
      throw new Error('No family selected');
    }

    return this.selected;
  }

  public show(scenario: Scenario): void {
    if (scenario !== this.scenario) {
      this.prepare(scenario);
    }

    this.view.show();
  }

  public hide(): void {
    this.view.hide();
  }

  protected override onMount(): void {
    this.controls.houses.view.subscribe(TileSelectedEvent, (event) =>
      this.select(event.key),
    );
  }

  private prepare(scenario: Scenario): void {
    const factory = new WorldFactory();
    const map = factory.createMap(scenario);
    const owners = map.getOwners();

    this.scenario = scenario;
    this.map = map;
    this.startDate = factory.getStartDate(scenario);
    this.families = scenario.playableFamilies.flatMap((name) =>
      owners.filter((owner) => owner.name === name),
    );
    this.controls.houses.showTiles(
      this.families.map((family) => this.toTile(family)),
    );
    this.controls.map.show(scenario, map);
    this.select(scenario.playableFamilies[0]!);
  }

  private select(familyName: string): void {
    const family = this.families.find(
      (candidate) => candidate.name === familyName,
    );

    if (family && this.map && this.startDate) {
      const rulerAge = family.ruler.getAgeAt(this.startDate);
      const provinces = this.map.getFamilyProvinces(family);

      this.selected = family;
      this.controls.houses.select(family.name);
      this.controls.ruler.showRuler(family, rulerAge);
      this.controls.map.highlight(provinces);
    }
  }

  private toTile(family: Family): Tile {
    return {
      key: family.name,
      image: getFamilyCrestUrl(family),
      label: family.name,
    };
  }
}
