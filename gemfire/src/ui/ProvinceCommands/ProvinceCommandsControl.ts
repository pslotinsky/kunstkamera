import type { CommandGroup } from '@/core/commands/province/catalog';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import { CommandSelectedEvent } from './CommandSelectedEvent';
import { ProvinceCommandsView } from './ProvinceCommandsView';
import { TurnSkippedEvent } from './TurnSkippedEvent';

export class ProvinceCommandsControl extends Control<ProvinceCommandsView> {
  public constructor(
    world: World,
    commands: readonly CommandGroup[],
    events: EventBus,
  ) {
    super(ProvinceCommandsView, { world, commands, events });
  }

  public showProvince(province: Province): void {
    this.view.showProvince(province);
  }

  public clear(): void {
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(CommandSelectedEvent, (event) => {
      event.command.execute();
    });
    this.subscribe(TurnSkippedEvent, () => {
      this.context.events.publish(new TurnEndedEvent());
    });
  }
}
