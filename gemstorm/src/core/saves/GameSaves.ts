import type { World } from '@/core/domain/World';

import { SavedGame, type SaveSummary } from './SavedGame';
import { UnsupportedSaveError } from './SaveFile';

const SAVE_KEY = 'gemstorm.save';

export const SAVE_SLOTS = [1, 2, 3] as const;

export type SlotNumber = (typeof SAVE_SLOTS)[number];

export type ReadySaveSlot = {
  readonly number: SlotNumber;
  readonly status: 'ready';
  readonly summary: SaveSummary;
};

type FailedStatus = 'damaged' | 'unsupported' | 'unavailable';

type SaveSlotWithoutSummary = {
  readonly number: SlotNumber;
  readonly status: 'empty' | FailedStatus;
};

export type SaveSlot = ReadySaveSlot | SaveSlotWithoutSummary;

type OpenedSaveSlot = ReadySaveSlot & {
  readonly world: World;
};

type SlotRead = OpenedSaveSlot | SaveSlotWithoutSummary;

interface Inspection {
  readonly serialized: string;
  readonly slot: SaveSlot;
}

export class GameSaves {
  private readonly inspections = new Map<SlotNumber, Inspection>();

  public list(): readonly SaveSlot[] {
    return SAVE_SLOTS.map((number) => this.inspect(number));
  }

  public newest(slots = this.list()): ReadySaveSlot | undefined {
    const ready = slots.filter((slot) => slot.status === 'ready');
    const [newest] = ready.sort(
      (left, right) => right.summary.savedAt - left.summary.savedAt,
    );

    return newest;
  }

  public save(number: SlotNumber, world: World): boolean {
    let isSaved = true;

    try {
      const serialized = SavedGame.capture(world).serialize();

      this.ensureLoadable(serialized);
      this.storage.setItem(this.key(number), serialized);
    } catch (error) {
      console.debug('[saves] could not save', error);
      isSaved = false;
    }

    return isSaved;
  }

  public load(number: SlotNumber): World | undefined {
    let world: World | undefined;

    try {
      const serialized = this.readStorage(number);
      const slot =
        serialized === null ? undefined : this.openSlot(number, serialized);

      world = slot?.status === 'ready' ? slot.world : undefined;
    } catch (error) {
      console.debug('[saves] storage is unavailable', error);
    }

    return world;
  }

  private inspect(number: SlotNumber): SaveSlot {
    let slot: SaveSlot;

    try {
      const serialized = this.readStorage(number);

      slot =
        serialized === null
          ? { number, status: 'empty' }
          : this.inspectSaved(number, serialized);
    } catch (error) {
      console.debug('[saves] storage is unavailable', error);
      slot = { number, status: 'unavailable' };
    }

    return slot;
  }

  private inspectSaved(number: SlotNumber, serialized: string): SaveSlot {
    const remembered = this.inspections.get(number);
    let slot: SaveSlot;

    if (remembered?.serialized === serialized) {
      slot = remembered.slot;
    } else {
      slot = this.withoutWorld(this.openSlot(number, serialized));
      this.inspections.set(number, { serialized, slot });
    }

    return slot;
  }

  private openSlot(number: SlotNumber, serialized: string): SlotRead {
    let slot: SlotRead;

    try {
      const saved = SavedGame.parse(serialized);
      const world = saved.restore();
      const summary = saved.summary;

      slot = { number, status: 'ready', world, summary };
    } catch (error) {
      const status =
        error instanceof UnsupportedSaveError ? 'unsupported' : 'damaged';

      console.debug(`[saves] slot ${number} is ${status}`, error);
      slot = { number, status };
    }

    return slot;
  }

  private ensureLoadable(serialized: string): void {
    SavedGame.parse(serialized).restore();
  }

  private readStorage(number: SlotNumber): string | null {
    return this.storage.getItem(this.key(number));
  }

  private withoutWorld(slot: SlotRead): SaveSlot {
    return slot.status === 'ready'
      ? { number: slot.number, status: slot.status, summary: slot.summary }
      : slot;
  }

  private get storage(): Storage {
    return globalThis.localStorage;
  }

  private key(number: SlotNumber): string {
    return `${SAVE_KEY}.${number}`;
  }
}
