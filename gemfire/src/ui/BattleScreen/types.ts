import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { DropdownControl } from '@/ui/Dropdown/DropdownControl';

import type { BattleBoardControl } from './BattleBoard/BattleBoardControl';
import type { ClashControl } from './Clash/ClashControl';
import type { SkyControl } from './Sky/SkyControl';

export interface BattleScreenContext {
  readonly world: World;
  readonly events: EventBus;
}

export type BattleScreenControls = {
  readonly sky: SkyControl;
  readonly board: BattleBoardControl;
  readonly clash: ClashControl;
  readonly refuge: DropdownControl;
};

export type BattleScreenViews = ChildrenViews<BattleScreenControls>;
