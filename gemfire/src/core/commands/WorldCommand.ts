import type { World } from '@/core/domain/World';
import type { EventBus } from '@/lib/EventBus';

export interface WorldCommandContext {
  readonly world: World;
  readonly events: EventBus;
}

export abstract class WorldCommand {
  public constructor(
    public readonly label: string,
    protected readonly context: WorldCommandContext,
  ) {}

  public abstract execute(): void;
}
