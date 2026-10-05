import type { DefenderAnswer } from '@/core/domain/DefensePolicy';

export class AnswerChosenEvent {
  public constructor(public readonly answer: DefenderAnswer) {}
}
