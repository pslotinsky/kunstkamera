import type { SaveSlot } from '@/core/saves/GameSaves';

export class SaveSlotSelectedEvent {
  public readonly slot: SaveSlot;

  public constructor(slot: SaveSlot) {
    this.slot = slot;
  }
}
