import type { Artifact } from '@/core/domain/Artifact';
import type { Province } from '@/core/domain/Province';

export class ArtifactFoundEvent {
  public constructor(
    public readonly province: Province,
    public readonly foundIn: Province,
    public readonly artifact: Artifact,
  ) {}
}
