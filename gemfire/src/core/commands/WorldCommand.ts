import type { World } from '@/core/domain/World';
import type { EventBus } from '@/lib/EventBus';

import type { Province } from '../domain/Province';

export interface WorldCommandContext {
  readonly world: World;
  readonly events: EventBus;
}

export abstract class WorldCommand {
  public readonly label: string;

  protected readonly context: WorldCommandContext;

  public constructor(label: string, context: WorldCommandContext) {
    this.label = label;
    this.context = context;
  }

  public abstract execute(): void;

  public canExecute(): boolean {
    return true;
  }

  public consumesTurn(): boolean {
    return true;
  }

  public get selectableTargets(): readonly number[] {
    return [];
  }

  public get requiresTarget(): boolean {
    return this.selectableTargets.length > 0;
  }

  protected get currentProvince(): Province | undefined {
    const { world } = this.context;

    return world.turnQueue.current;
  }

  protected publish(event: object): void {
    this.context.events.publish(event);
  }
}
