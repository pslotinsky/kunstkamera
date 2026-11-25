import type { DefectionClass, RecruitClass } from '@/core/domain/General';
import type { MarketRateName } from '@/core/domain/MarketRate';

const VERSION = 1;

export interface SavedDate {
  readonly year: number;
  readonly month: number;
}

export interface SavedUnit {
  readonly name: string;
  readonly strength: number;
}

export interface SavedGeneral {
  readonly name: string;
  readonly birth: SavedDate;
  readonly stats: {
    readonly intelligence: number;
    readonly war: number;
    readonly charisma: number;
  };
  readonly lineage: string | null;
  readonly houseMembership: boolean;
  readonly recruitClass: RecruitClass;
  readonly defectionClass: DefectionClass;
  readonly captureImmune: boolean;
}

export interface SavedFamily {
  readonly name: string;
  readonly ruler: string;
  readonly members: readonly string[];
  readonly home: number;
  readonly ally: string | null;
  readonly fame: number;
  readonly royal: boolean;
  readonly gems: readonly {
    readonly name: string;
    readonly readyOn: SavedDate | null;
  }[];
}

export interface SavedProvince {
  readonly number: number;
  readonly family: string | null;
  readonly governor: string | null;
  readonly resources: {
    readonly gold: number;
    readonly food: number;
    readonly troops: number;
  };
  readonly development: {
    readonly cultivation: number;
    readonly protection: number;
    readonly loyalty: number;
  };
  readonly entrusted: boolean;
  readonly goodwill: number;
  readonly actionCount: number;
  readonly stationed: readonly SavedUnit[];
  readonly offers: readonly SavedUnit[];
}

export interface SavedCaptive {
  readonly general: string;
  readonly house: string;
  readonly captor: string;
  readonly battlefield: number;
  readonly ransom: { readonly gold: number; readonly food: number } | null;
}

export interface SaveData {
  readonly scenario: number;
  readonly date: SavedDate;
  readonly advisor: string | null;
  readonly player: string;
  readonly market: MarketRateName;
  readonly artifacts: readonly string[];
  readonly provinces: readonly SavedProvince[];
  readonly families: readonly SavedFamily[];
  readonly activeFamilies: readonly string[];
  readonly generals: readonly SavedGeneral[];
  readonly activeGenerals: readonly string[];
  readonly exiles: readonly string[];
  readonly captives: readonly SavedCaptive[];
  readonly order: readonly number[];
  readonly turnIndex: number;
}

interface StoredSave {
  readonly version: number;
  readonly savedAt: number;
  readonly data: SaveData;
}

export class UnsupportedSaveError extends Error {}

export class SaveFile {
  public static parse(serialized: string): SaveFile {
    const stored: unknown = JSON.parse(serialized);

    if (!SaveFile.hasVersion(stored)) {
      throw new Error('Invalid saved game');
    }
    if (stored.version !== VERSION) {
      throw new UnsupportedSaveError('Unsupported save version');
    }
    if (!SaveFile.isStoredSave(stored)) {
      throw new Error('Invalid saved game');
    }

    return new SaveFile(stored.data, stored.savedAt);
  }

  private static hasVersion(
    stored: unknown,
  ): stored is Pick<StoredSave, 'version'> {
    return typeof stored === 'object' && stored !== null && 'version' in stored;
  }

  private static isStoredSave(
    stored: Pick<StoredSave, 'version'>,
  ): stored is StoredSave {
    return (
      'savedAt' in stored &&
      typeof stored.savedAt === 'number' &&
      'data' in stored &&
      typeof stored.data === 'object'
    );
  }

  public readonly data: SaveData;
  public readonly savedAt: number;

  public constructor(data: SaveData, savedAt: number) {
    this.data = data;
    this.savedAt = savedAt;
  }

  public serialize(): string {
    const { data, savedAt } = this;
    const stored: StoredSave = { version: VERSION, savedAt, data };

    return JSON.stringify(stored);
  }
}
