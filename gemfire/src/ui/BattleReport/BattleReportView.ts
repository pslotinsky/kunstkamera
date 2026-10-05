import { html, type TemplateResult } from 'lit-html';

import type { Army } from '@/core/domain/Army';
import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import type { World } from '@/core/domain/World';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';

import { BattleReportDismissedEvent } from './BattleReportDismissedEvent';

import styles from './BattleReport.module.scss';

const DAY_ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];
const DAY_COUNTS = ['one', 'two', 'three', 'four', 'five'];
const NO_UNIT = '—';

export interface BattleReportContext {
  readonly world: World;
  readonly events: EventBus;
}

export class BattleReportView extends View<BattleReportContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}">
        <header class=${styles.header}>
          <h2 class=${styles.title} data-title></h2>
          <button
            class=${styles.close}
            type="button"
            @click=${() => this.publish(new BattleReportDismissedEvent())}
          >
            Close
          </button>
        </header>
        <p class=${styles.war} data-war></p>
        <table class=${styles.sides} data-sides></table>
        <p class=${styles.verdict} data-verdict></p>
        <p class="${styles.capture} ${styles.hidden}" data-capture></p>
      </section>
    `;
  }

  public showReport(report: InvasionReport): void {
    this.title.textContent = this.renderHeading(report);
    this.war.textContent = this.renderWar(report);
    this.showSides(report);
    this.verdict.textContent = this.renderVerdict(report);
    this.showCapture(report);
    this.element.classList.remove(styles.hidden!);
    this.closeButton.focus();
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private renderHeading(report: InvasionReport): string {
    const { target, attacker, outcome } = report;

    return outcome
      ? this.renderFightHeading(target.name, attacker, outcome)
      : this.renderAnswerHeading(report);
  }

  private renderFightHeading(
    province: string,
    attacker: Army,
    outcome: BattleOutcome,
  ): string {
    const day = DAY_ORDINALS[outcome.days - 1];
    const commander = attacker.commander.name;

    let heading = `${province} holds out for ${DAY_COUNTS[outcome.days - 1]} days`;

    if (outcome.isWonBy(BattleSide.attacker)) {
      heading =
        outcome.reason === 'starvation'
          ? `${province} is starved out on the ${day} day`
          : `${province} falls on the ${day} day`;
    } else if (outcome.reason === 'starvation') {
      heading = `${commander} runs out of food on the ${day} day`;
    } else if (outcome.reason === 'rout') {
      heading = `${commander}'s army breaks on the ${day} day`;
    }

    return heading;
  }

  private renderWar(report: InvasionReport): string {
    const { source, target, defending } = report;
    const held = defending ? `, held by ${defending.name}` : '';

    return `${source.family?.name} attacks ${target.name}${held}.`;
  }

  private renderAnswerHeading(report: InvasionReport): string {
    const province = report.target.name;

    return report.answer === 'retreat'
      ? `${province} is abandoned`
      : `${province} surrenders`;
  }

  private renderVerdict(report: InvasionReport): string {
    const { attacker, defender, outcome, refuge } = report;
    const province = report.target.name;
    const flight = refuge
      ? `${defender.commander.name} flees to ${refuge.name}${this.renderEscort(report)}. `
      : '';

    let verdict = `${defender.commander.name} surrenders. ${this.renderFall(report)}`;

    if (outcome && report.isTaken) {
      verdict = `${flight}${this.renderFall(report)} ${attacker.commander.name} holds it${this.renderSurvivors(report, outcome)}.`;
    } else if (outcome) {
      verdict = `${province} holds. ${attacker.commander.name} goes home${this.renderSurvivors(report, outcome)}.`;
    } else if (refuge) {
      verdict = `${flight}${this.renderFall(report)}`;
    }

    return verdict;
  }

  private renderFall(report: InvasionReport): string {
    const victor = report.source.family;
    const province = report.target.name;

    return victor?.isEqual(this.context.world.player)
      ? `${province} is yours.`
      : `${province} falls to ${victor?.name}.`;
  }

  private showCapture(report: InvasionReport): void {
    const line = this.renderCapture(report);

    this.capture.textContent = line;
    this.capture.classList.toggle(styles.hidden!, line === '');
  }

  private renderCapture(report: InvasionReport): string {
    const captive = report.captive;

    if (!captive) {
      return '';
    }

    return captive.captor.isEqual(this.context.world.player)
      ? `${captive.general.name} of ${captive.house.name} is your prisoner.`
      : `${captive.general.name} is taken by ${captive.captor.name}.`;
  }

  private renderEscort(report: InvasionReport): string {
    const { defender } = report;

    return this.isPlayerSide(report) && defender.hasTroops
      ? ` with ${defender.troops} troops`
      : '';
  }

  private renderSurvivors(
    report: InvasionReport,
    outcome: BattleOutcome,
  ): string {
    return this.isPlayerSide(report)
      ? ` with ${outcome.attackerSurvivors} troops`
      : '';
  }

  private isPlayerSide(report: InvasionReport): boolean {
    return report.hasSide(this.context.world.player);
  }

  private showSides(report: InvasionReport): void {
    const { outcome } = report;

    this.sides.classList.toggle(
      styles.hidden!,
      !report.isFought || !this.isPlayerSide(report),
    );

    if (outcome) {
      this.sides.innerHTML = this.renderSides(report, outcome);
    }
  }

  private renderSides(report: InvasionReport, outcome: BattleOutcome): string {
    const { attacker, defender } = report;

    return `
      <thead><tr><th></th>${this.renderCommander(attacker)}${this.renderCommander(defender)}</tr></thead>
      <tbody>
        ${this.renderRow('troops', [
          attacker.committedTroops,
          defender.committedTroops,
        ])}
        ${this.renderRow('5th unit', [
          attacker.unit?.name ?? NO_UNIT,
          defender.unit?.name ?? NO_UNIT,
        ])}
        ${this.renderRow('left', [
          outcome.attackerSurvivors,
          outcome.defenderSurvivors,
        ])}
      </tbody>
    `;
  }

  private renderCommander(army: Army): string {
    const mine = this.context.world.player.members.some((member) =>
      member.isEqual(army.commander),
    );
    const style = mine
      ? `${styles.commander} ${styles.mine}`
      : styles.commander;
    const suffix = mine ? ' (you)' : '';

    return `<th class="${style}">${army.commander.name}${suffix}</th>`;
  }

  private renderRow(
    label: string,
    cells: readonly (string | number)[],
  ): string {
    const columns = cells.map((cell) => `<td>${cell}</td>`).join('');

    return `<tr><td class="${styles.label}">${label}</td>${columns}</tr>`;
  }

  private get title(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-title]')!;
  }

  private get war(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-war]')!;
  }

  private get sides(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-sides]')!;
  }

  private get verdict(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-verdict]')!;
  }

  private get capture(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-capture]')!;
  }

  private get closeButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('button')!;
  }
}
