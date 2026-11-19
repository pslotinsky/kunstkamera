import type { NegotiationMission } from '@/core/commands/province/NegotiateCommand';

export class MissionSelectedEvent {
  public constructor(public readonly mission: NegotiationMission) {}
}
