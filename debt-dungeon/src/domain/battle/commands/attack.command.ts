import { Command } from '@/lib/domain/command';

import type { SquadId } from '../battle-squad.entity';

interface Params {
  sourceId: SquadId;
  targetId: SquadId;
}

export class AttackCommand extends Command {
  public readonly sourceId: SquadId;
  public readonly targetId: SquadId;

  constructor(params: Params) {
    super();
    this.sourceId = params.sourceId;
    this.targetId = params.targetId;
  }
}
