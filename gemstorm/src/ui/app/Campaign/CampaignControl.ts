import { createCommandGroups } from '@/core/commands/province/catalog';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { WorldEngine } from '@/core/WorldEngine';
import { type CampaignStart, WorldFactory } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { EventBus } from '@/lib/EventBus';
import { CampaignSoundDirector } from '@/ui/app/Campaign/CampaignSoundDirector';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';
import { BattleScreenControl } from '@/ui/screens/BattleScreen/BattleScreenControl';
import { StrategyScreenControl } from '@/ui/screens/StrategyScreen/StrategyScreenControl';

import { CampaignView } from './CampaignView';
import type { CampaignContext, CampaignControls } from './types';

export class CampaignControl extends Control<CampaignView, CampaignControls> {
  public static create(
    start: CampaignStart,
    sounds: SoundBoard,
  ): CampaignControl {
    const world = new WorldFactory().create(start);
    const events = new EventBus();
    const commands = createCommandGroups({ world, events });

    return new CampaignControl({ world, events, commands, sounds });
  }

  private readonly engine: WorldEngine;
  private readonly director: CampaignSoundDirector;

  public constructor(context: CampaignContext) {
    super(CampaignView, context, {
      strategyScreen: new StrategyScreenControl(context),
      battleScreen: new BattleScreenControl({
        world: context.world,
        events: context.events,
        sounds: context.sounds,
      }),
    });
    this.engine = new WorldEngine(context.world, context.events);
    this.director = new CampaignSoundDirector(context);
  }

  public onQuit(handler: () => void): void {
    this.controls.strategyScreen.onQuit(handler);
  }

  protected override onMount(): void {
    const { events } = this.context;

    if (import.meta.env.DEV) {
      events.observe((event) => {
        console.debug(`[event] ${event.constructor.name}`, event);
      }, this.signal);
    }
    events.subscribe(
      BattleStartedEvent,
      (event) => this.controls.battleScreen.play(event.battle, event.invasion),
      this.signal,
    );
    events.subscribe(
      BattleEndedEvent,
      () => this.controls.battleScreen.close(),
      this.signal,
    );
    this.director.listen();
    this.engine.start();
  }

  protected override onUnmount(): void {
    this.engine.stop();
    this.director.stop();
  }
}
