import { html, type TemplateResult } from 'lit-html';

import type { NegotiationMission } from '@/core/commands/province/NegotiateCommand';
import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { CandidateSelectedEvent } from './CandidateSelectedEvent';
import { CommandDialogView } from './CommandDialogView';
import { MissionSelectedEvent } from './MissionSelectedEvent';

import styles from './CommandDialog.module.scss';

const MISSIONS: {
  readonly mission: NegotiationMission;
  readonly label: string;
}[] = [
  { mission: 'defection', label: 'Defection' },
  { mission: 'surrender', label: 'Surrender' },
];

export interface Candidate {
  readonly general: General;
  readonly posting: string;
  readonly selected: boolean;
}

export class NegotiateDialogView extends CommandDialogView {
  public showTarget(target: Province | undefined): void {
    this.prompt.textContent = target ? `Send an envoy to ${target}` : '';
  }

  public showMission(mission: NegotiationMission | undefined): void {
    this.missions.classList.toggle(styles.hidden!, !isDefined(mission));

    for (const button of this.missionButtons) {
      button.classList.toggle(
        styles.selected!,
        button.dataset.mission === mission,
      );
    }

    if (!isDefined(mission)) {
      this.options.innerHTML = '';
    }
  }

  public showCandidates(candidates: readonly Candidate[]): void {
    this.options.innerHTML = candidates.length
      ? candidates.map((candidate) => this.renderCandidate(candidate)).join('')
      : `<p class=${styles.prompt}>No one here will hear your envoy.</p>`;
  }

  public showDemand(family: Family, demander: Family): void {
    this.options.innerHTML = `<p class=${styles.prompt}>Demand that ${family.name} yield all its lands and gems to ${demander.name}.</p>`;
  }

  public enableConfirm(enabled: boolean): void {
    this.confirmButton.disabled = !enabled;
  }

  protected override onMount(): void {
    this.options.addEventListener('click', (event) => this.onPick(event), {
      signal: this.lifetime.signal,
    });
  }

  protected renderBody(): TemplateResult {
    return html`
      <h2 class=${styles.title} data-prompt></h2>
      <div class="${styles.actions} ${styles.hidden}" data-missions>
        ${MISSIONS.map(
          ({ mission, label }) => html`<button
            class=${styles.button}
            type="button"
            data-mission=${mission}
            @click=${() => this.publish(new MissionSelectedEvent(mission))}
          >
            ${label}
          </button>`,
        )}
      </div>
      <div class="${styles.lords} ${styles.section}" data-options></div>
      <div class="${styles.actions} ${styles.footer}">
        <button
          class=${styles.button}
          type="button"
          data-action="confirm"
          disabled
          @click=${() => this.confirm()}
        >
          Yea
        </button>
        <button
          class=${styles.button}
          type="button"
          @click=${() => this.cancel()}
        >
          Nay
        </button>
      </div>
    `;
  }

  private renderCandidate(candidate: Candidate): string {
    const { general, posting, selected } = candidate;
    const { war, charisma } = general.stats;
    const active = selected ? styles.selected : '';

    return `<button class="${styles.button} ${active}" type="button" data-candidate="${general.name}">${general.name} — ${posting} · WAR ${war} CHA ${charisma}</button>`;
  }

  private onPick(event: MouseEvent): void {
    const button = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-candidate]',
    );

    if (isDefined(button?.dataset.candidate)) {
      this.publish(new CandidateSelectedEvent(button.dataset.candidate));
    }
  }

  private get prompt(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-prompt]')!;
  }

  private get missions(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-missions]')!;
  }

  private get missionButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-mission]');
  }

  private get options(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-options]')!;
  }

  private get confirmButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="confirm"]',
    )!;
  }
}
