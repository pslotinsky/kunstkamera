import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import type { ConfirmCommandDialogControl } from './CommandDialog/ConfirmCommandDialogControl';

export interface ProvinceCommandsContext {
  readonly world: World;
  readonly commands: readonly CommandGroup[];
  readonly events: EventBus;
}

export type ProvinceCommandsControls = {
  readonly cultivationDialog: ConfirmCommandDialogControl;
  readonly protectionDialog: ConfirmCommandDialogControl;
};

export type ProvinceCommandsViews = ChildrenViews<ProvinceCommandsControls>;
