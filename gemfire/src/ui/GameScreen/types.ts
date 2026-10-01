import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { AnnouncementsControl } from '@/ui/Announcements/AnnouncementsControl';
import type { BattleReportControl } from '@/ui/BattleReport/BattleReportControl';
import type { CaptiveDialogControl } from '@/ui/CaptiveDialog/CaptiveDialogControl';
import type { FamilyOverviewControl } from '@/ui/FamilyOverview/FamilyOverviewControl';
import type { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
import type { HireMonsterDialogControl } from '@/ui/ProvinceCommands/CommandDialog/HireMonsterDialogControl';
import type { SearchReportControl } from '@/ui/SearchReport/SearchReportControl';
import type { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

export interface GameScreenContext {
  readonly world: World;
  readonly events: EventBus;
  readonly commands: readonly CommandGroup[];
}

export type GameScreenControls = {
  readonly worldMap: WorldMapControl;
  readonly gamePanel: GamePanelControl;
  readonly familyOverview: FamilyOverviewControl;
  readonly hireMonster: HireMonsterDialogControl;
  readonly searchReport: SearchReportControl;
  readonly battleReport: BattleReportControl;
  readonly captiveDialog: CaptiveDialogControl;
  readonly announcements: AnnouncementsControl;
};

export type GameScreenViews = ChildrenViews<GameScreenControls>;
