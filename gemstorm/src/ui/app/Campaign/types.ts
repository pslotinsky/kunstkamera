import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';
import type { BattleScreenControl } from '@/ui/screens/BattleScreen/BattleScreenControl';
import type { StrategyScreenControl } from '@/ui/screens/StrategyScreen/StrategyScreenControl';

export interface CampaignContext {
  readonly world: World;
  readonly events: EventBus;
  readonly commands: readonly CommandGroup[];
  readonly sounds: SoundBoard;
}

export type CampaignControls = {
  readonly strategyScreen: StrategyScreenControl;
  readonly battleScreen: BattleScreenControl;
};

export type CampaignViews = ChildrenViews<CampaignControls>;
