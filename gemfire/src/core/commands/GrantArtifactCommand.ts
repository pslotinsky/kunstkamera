import type { Artifact } from '@/core/domain/Artifact';
import type { General } from '@/core/domain/General';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class GrantArtifactCommand extends WorldCommand {
  private artifact: Artifact | undefined;
  private recipient: General | undefined;

  public constructor(context: WorldCommandContext) {
    super('Grant Artifact', context);
  }

  public grant(artifact: Artifact, recipient: General): void {
    this.artifact = artifact;
    this.recipient = recipient;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    if (this.artifact && this.recipient) {
      this.recipient.receive(this.artifact);
    }
  }
}
