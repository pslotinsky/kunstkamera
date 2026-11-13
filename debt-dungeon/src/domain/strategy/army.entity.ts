import { uuid } from '@/lib/utils/uuid';

import type { Squad } from './squad.entity';

export type ArmyId = string;

interface Params {
  squads: readonly Squad[];
}

export class Army {
  public static create(params: Params): Army {
    return new Army(params);
  }

  public readonly id: ArmyId;
  public readonly squads: readonly Squad[];

  private constructor(params: Params) {
    this.id = uuid();
    this.squads = [...params.squads];
  }
}
