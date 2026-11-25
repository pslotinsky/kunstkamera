import type { SaveSlot } from '@/core/saves/GameSaves';
import { Control } from '@/lib/Control';

import { SaveSlotSelectedEvent } from './events/SaveSlotSelectedEvent';
import { type SaveSlotsContext, SaveSlotsView } from './SaveSlotsView';

export class SaveSlotsControl extends Control<SaveSlotsView> {
  public constructor(context: SaveSlotsContext) {
    super(SaveSlotsView, context);
  }

  public onSelect(handler: (slot: SaveSlot) => void): void {
    this.subscribe(SaveSlotSelectedEvent, ({ slot }) => handler(slot));
  }
}
