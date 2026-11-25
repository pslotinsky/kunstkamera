import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { GameSaves } from '@/core/saves/GameSaves';
import type { SaveBlocker } from '@/core/WorldEngine';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { PlaqueControl } from '@/ui/common/Plaque/PlaqueControl';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';
import type { AdviceControl } from '@/ui/screens/StrategyScreen/Advice/AdviceControl';
import type { AnnouncementsControl } from '@/ui/screens/StrategyScreen/Announcements/AnnouncementsControl';
import type { BattleReportControl } from '@/ui/screens/StrategyScreen/BattleReport/BattleReportControl';
import type { CampaignEndingControl } from '@/ui/screens/StrategyScreen/CampaignEnding/CampaignEndingControl';
import type { CaptiveDialogControl } from '@/ui/screens/StrategyScreen/CaptiveDialog/CaptiveDialogControl';
import type { CommandDialogsControl } from '@/ui/screens/StrategyScreen/CommandDialogs/CommandDialogsControl';
import type { DefenseDialogControl } from '@/ui/screens/StrategyScreen/DefenseDialog/DefenseDialogControl';
import type { GameMenuControl } from '@/ui/screens/StrategyScreen/GameMenu/GameMenuControl';
import type { GamePanelControl } from '@/ui/screens/StrategyScreen/GamePanel/GamePanelControl';
import type { SearchReportControl } from '@/ui/screens/StrategyScreen/SearchReport/SearchReportControl';
import type { WorldMapControl } from '@/ui/screens/StrategyScreen/WorldMap/WorldMapControl';

export interface StrategyScreenContext {
  readonly world: World;
  readonly events: EventBus;
  readonly commands: readonly CommandGroup[];
  readonly sounds: SoundBoard;
  readonly saves: GameSaves;
  readonly saveBlocker: () => SaveBlocker | undefined;
}

export type StrategyScreenControls = {
  readonly worldMap: WorldMapControl;
  readonly gamePanel: GamePanelControl;
  readonly commandDialogs: CommandDialogsControl;
  readonly advice: AdviceControl;
  readonly searchReport: SearchReportControl;
  readonly battleReport: BattleReportControl;
  readonly captiveDialog: CaptiveDialogControl;
  readonly announcements: AnnouncementsControl;
  readonly defenseDialog: DefenseDialogControl;
  readonly campaignEnding: CampaignEndingControl;
  readonly turnStatus: PlaqueControl;
  readonly gameMenu: GameMenuControl;
};

export type StrategyScreenViews = ChildrenViews<StrategyScreenControls>;
