import { uuid } from '@/lib/utils/uuid';

import type { Commander } from './commander.entity';
import type { Troop } from './troop.entity';

export type SquadId = string;

interface Params {
  commander: Commander;
  troop?: Troop;
}

export class Squad {
  public static create(params: Params): Squad {
    return new Squad(params);
  }

  public readonly id: SquadId;
  public readonly commander: Commander;
  public readonly troop?: Troop;

  private constructor(params: Params) {
    this.id = uuid();
    this.commander = params.commander;
    this.troop = params.troop;
  }
}
