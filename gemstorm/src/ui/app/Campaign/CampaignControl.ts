import { createCommandGroups } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import type { GameSaves } from '@/core/saves/GameSaves';
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

type CampaignOpening = (engine: WorldEngine) => void;

export class CampaignControl extends Control<CampaignView, CampaignControls> {
  public static create(
    start: CampaignStart,
    sounds: SoundBoard,
    saves: GameSaves,
  ): CampaignControl {
    const world = new WorldFactory().create(start);
    const context = CampaignControl.createContext(world, sounds, saves);

    return new CampaignControl(context, (engine) => engine.start());
  }

  public static resume(
    world: World,
    sounds: SoundBoard,
    saves: GameSaves,
  ): CampaignControl {
    const context = CampaignControl.createContext(world, sounds, saves);

    return new CampaignControl(context, (engine) => engine.resume());
  }

  private static createContext(
    world: World,
    sounds: SoundBoard,
    saves: GameSaves,
  ): CampaignContext {
    const events = new EventBus();
    const commands = createCommandGroups({ world, events });

    return { world, events, commands, sounds, saves };
  }

  private readonly engine: WorldEngine;
  private readonly director: CampaignSoundDirector;
  private readonly opening: CampaignOpening;

  public constructor(context: CampaignContext, opening: CampaignOpening) {
    const engine = new WorldEngine(context.world, context.events);

    super(CampaignView, context, {
      strategyScreen: new StrategyScreenControl({
        ...context,
        saveBlocker: () => engine.saveBlocker,
      }),
      battleScreen: new BattleScreenControl({
        world: context.world,
        events: context.events,
        sounds: context.sounds,
      }),
    });
    this.engine = engine;
    this.opening = opening;
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

    this.opening(this.engine);
  }

  protected override onUnmount(): void {
    this.engine.stop();
    this.director.stop();
  }
}
