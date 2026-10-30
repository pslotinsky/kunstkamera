import { html, type TemplateResult } from 'lit-html';

import { Coronation } from '@/core/domain/Coronation';
import type { Disbanding } from '@/core/domain/Disbanding';
import type { SabotageDamage } from '@/core/domain/Infiltration';
import type { World } from '@/core/domain/World';
import type { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import type { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import type { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';
import type { GeneralDiedEvent } from '@/core/events/GeneralDiedEvent';
import type {
  MissionOutcome,
  MissionReportedEvent,
} from '@/core/events/MissionReportedEvent';
import type {
  SuccessionCause,
  SuccessionReportedEvent,
} from '@/core/events/SuccessionReportedEvent';
import type {
  DesertionReason,
  UnitDesertedEvent,
} from '@/core/events/UnitDesertedEvent';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import { getFamilyCrestUrl } from '@/ui/art/getFamilyCrestUrl';
import { getFifthUnitPortraitUrl } from '@/ui/art/getFifthUnitPortraitUrl';
import { getGeneralPortraitUrl } from '@/ui/art/getGeneralPortraitUrl';
import type { DropdownControl } from '@/ui/Dropdown/DropdownControl';

import { AnnouncementDismissedEvent } from './AnnouncementDismissedEvent';
import { ChoiceConfirmedEvent } from './ChoiceConfirmedEvent';
import { ChoiceDeclinedEvent } from './ChoiceDeclinedEvent';

import styles from './Announcements.module.scss';

const DESERTION_REASONS: Record<DesertionReason, string> = {
  unpaid: 'went unpaid',
  faithless: 'lost faith in your family',
};

const SABOTAGE_DAMAGES: Record<SabotageDamage, string> = {
  troops: 'cut down the troops of',
  loyalty: 'turned the people against the lord of',
  protection: 'burned the walls of',
};

interface Choice {
  readonly label: string;
  readonly action: string;
  readonly decline?: string | undefined;
}

type Verdict = CaptiveJudgedEvent['outcome'];

const VERDICTS: Record<Verdict, string> = {
  joined: 'recruited',
  refused: 'released',
  released: 'released',
  banished: 'banished',
};

interface Announcement {
  readonly text: string;
  readonly icon?: string | undefined;
  readonly detail?: string | undefined;
}

export interface AnnouncementsContext {
  readonly world: World;
  readonly events: EventBus;
}

export type AnnouncementsControls = {
  readonly recipient: DropdownControl;
};

export type AnnouncementsViews = ChildrenViews<AnnouncementsControls>;

export class AnnouncementsView extends View<
  AnnouncementsContext,
  AnnouncementsViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class="${styles.root} ${styles.hidden}" data-overlay>
        <figure class=${styles.scroll}>
          <img class=${styles.icon} data-icon alt="" />
          <div>
            <figcaption class=${styles.text} data-text></figcaption>
            <p class=${styles.detail} data-detail></p>
          </div>
        </figure>
        <div class="${styles.ask} ${styles.hidden}" data-ask>
          <span class=${styles.askLabel} data-ask-label></span>
          <div class=${styles.recipient} data-picker>
            ${this.views.recipient.template}
          </div>
          <button
            class="${styles.action} ${styles.take}"
            type="button"
            data-decline
            @click=${() => this.publish(new ChoiceDeclinedEvent())}
          ></button>
          <button
            class="${styles.action} ${styles.take}"
            type="button"
            data-choose
            @click=${() => this.publish(new ChoiceConfirmedEvent())}
          ></button>
        </div>
        <footer class=${styles.footer}>
          <span class=${styles.pending} data-pending></span>
          <button
            class=${styles.action}
            type="button"
            data-continue
            @click=${() => this.publish(new AnnouncementDismissedEvent())}
          >
            Continue
          </button>
        </footer>
      </div>
    `;
  }

  public showDesertion(event: UnitDesertedEvent, pending: number): void {
    const { unit, province, reason } = event;

    this.tell(
      {
        text: `The ${unit.name} of ${province.name} ${DESERTION_REASONS[reason]} and deserted.`,
        icon: getFifthUnitPortraitUrl(unit),
      },
      pending,
    );
  }

  public showFind(event: ArtifactFoundEvent, pending: number): void {
    const { foundIn, artifact } = event;

    this.ask(
      {
        text: `Your spy came back from ${foundIn.name} with the ${artifact.name}.`,
        detail: artifact.effect,
      },
      { label: 'It goes to', action: 'Take' },
      pending,
    );
  }

  public showMission(event: MissionReportedEvent, pending: number): void {
    const actor = event.province.family;
    const name = actor?.name ?? '';

    this.tell(
      actor?.isEqual(this.context.world.player)
        ? this.describeMission(event.outcome, name)
        : this.describeRivalMission(event.outcome, name),
      pending,
    );
  }

  public showVerdict(event: CaptiveJudgedEvent, pending: number): void {
    const { captive, outcome } = event;

    this.tell(
      {
        text: `${captive.captor.name} ${VERDICTS[outcome]} ${captive.general.name}.`,
        icon: getGeneralPortraitUrl(captive.general),
      },
      pending,
    );
  }

  public askForAlliance(event: AllianceOfferedEvent, pending: number): void {
    const { proposer } = event;

    this.ask(
      {
        text: `${proposer.ruler.name} of ${proposer.name} proposes an alliance.`,
        icon: getFamilyCrestUrl(proposer),
      },
      { label: '', action: 'Accept', decline: 'Decline' },
      pending,
    );
  }

  public showDeath(event: GeneralDiedEvent, pending: number): void {
    const { general } = event;

    this.tell(
      {
        text: `${general.name} has died of old age.`,
        icon: getGeneralPortraitUrl(general),
      },
      pending,
    );
  }

  public showSuccession(event: SuccessionReportedEvent, pending: number): void {
    const { outcome, cause } = event;
    const departure = this.describeDeparture(outcome, cause);
    const consequence =
      outcome instanceof Coronation
        ? `${outcome.heir?.name} takes the throne.`
        : this.describeDisbanding(outcome);

    this.tell(
      {
        text: `${departure} ${consequence}`,
        icon: getFamilyCrestUrl(outcome.family),
      },
      pending,
    );
  }

  public askForHeir(event: SuccessionReportedEvent, pending: number): void {
    const { outcome, cause } = event;

    this.ask(
      {
        text: this.describeDeparture(outcome, cause),
        detail: `Who takes the throne of ${outcome.family.name}?`,
        icon: getFamilyCrestUrl(outcome.family),
      },
      { label: 'The heir', action: 'Crown' },
      pending,
    );
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private describeDeparture(
    outcome: Coronation | Disbanding,
    cause: SuccessionCause,
  ): string {
    const { deposed, family } = outcome;

    return cause === 'death'
      ? `${deposed.name} of ${family.name} has died of old age.`
      : `${deposed.name} of ${family.name} is banished from Ishmeria.`;
  }

  private describeDisbanding(disbanding: Disbanding): string {
    const { family, breakaways, gems, beneficiary } = disbanding;

    if (family.isEqual(this.context.world.player)) {
      return 'Your house is no more.';
    }

    const rulers = breakaways.map(
      (breakaway) =>
        ` ${breakaway.ruler.name} now rules ${breakaway.homeProvince.name} as ${breakaway.name}.`,
    );
    const passing =
      beneficiary && gems.length
        ? ` ${gems.map((gem) => gem.name).join(' and ')} ${gems.length > 1 ? 'pass' : 'passes'} to ${beneficiary.name}.`
        : '';

    return `${family.name} has no heir and is no more.${rulers.join('')}${passing}`;
  }

  private describeMission(outcome: MissionOutcome, you: string): Announcement {
    switch (outcome.kind) {
      case 'alliance':
        return {
          text: outcome.accepted
            ? `${outcome.family.name} accepts. Peace holds between ${you} and ${outcome.family.name}.`
            : `${outcome.family.name} will not ally with you.`,
          icon: getFamilyCrestUrl(outcome.family),
        };
      case 'break':
        return {
          text: `The alliance with ${outcome.family.name} is broken.`,
          icon: getFamilyCrestUrl(outcome.family),
        };
      case 'defection':
        return {
          text: this.describeDefection(outcome, you),
          icon: getGeneralPortraitUrl(outcome.general),
        };
      case 'surrender':
        return {
          text: this.describeSurrender(outcome, you),
          icon: getFamilyCrestUrl(outcome.family),
        };
      case 'sabotage':
        return {
          text: outcome.damage
            ? `Your agents ${SABOTAGE_DAMAGES[outcome.damage]} ${outcome.target.name}.`
            : `Your agents were caught in ${outcome.target.name} and wrecked nothing.`,
        };
      case 'plunder':
        return {
          text: outcome.loot
            ? `Your agents plundered ${outcome.target.name}: ${outcome.loot.gold} gold, ${outcome.loot.food} food.`
            : `Your agents were caught in ${outcome.target.name} and came back empty-handed.`,
        };
    }
  }

  private describeRivalMission(
    outcome: MissionOutcome,
    rival: string,
  ): Announcement {
    switch (outcome.kind) {
      case 'surrender':
        return {
          text: this.describeSurrender(outcome, rival),
          icon: getFamilyCrestUrl(outcome.family),
        };
      case 'break':
        return { text: `${rival} has broken the alliance with you.` };
      case 'defection':
        return {
          text: this.describeLoss(outcome, rival),
          icon: getGeneralPortraitUrl(outcome.general),
        };
      case 'sabotage':
        return {
          text: outcome.damage
            ? `Agents from ${rival} ${SABOTAGE_DAMAGES[outcome.damage]} ${outcome.target.name}.`
            : `Agents from ${rival} were caught in ${outcome.target.name}.`,
        };
      case 'plunder':
        return {
          text: outcome.loot
            ? `Agents from ${rival} plundered ${outcome.target.name}: ${outcome.loot.gold} gold, ${outcome.loot.food} food.`
            : `Agents from ${rival} were caught in ${outcome.target.name}.`,
        };
      default:
        return { text: '' };
    }
  }

  private describeLoss(
    outcome: Extract<MissionOutcome, { kind: 'defection' }>,
    rival: string,
  ): string {
    const { general, province, persuaded } = outcome;

    if (!persuaded) {
      return `${general.name} turned away the envoys of ${rival}.`;
    }

    return province
      ? `${general.name} has defected to ${rival}, taking ${province.name} with him.`
      : `${general.name} has defected to ${rival}.`;
  }

  private describeDefection(
    outcome: Extract<MissionOutcome, { kind: 'defection' }>,
    you: string,
  ): string {
    const { general, family, province, persuaded } = outcome;

    if (!persuaded) {
      return `${general.name} stays loyal to ${family.name}.`;
    }

    return province
      ? `${general.name} has left ${family.name} for ${you}, and ${province.name} passes to ${you}.`
      : `${general.name} has left ${family.name} for ${you}.`;
  }

  private describeSurrender(
    outcome: Extract<MissionOutcome, { kind: 'surrender' }>,
    you: string,
  ): string {
    const { family, gems, yielded } = outcome;

    if (!yielded) {
      return `${family.name} will not surrender.`;
    }

    return gems.length
      ? `${family.name} yields. ${gems.map((gem) => gem.name).join(' and ')} ${gems.length > 1 ? 'pass' : 'passes'} to ${you}.`
      : `${family.name} yields to ${you}.`;
  }

  private showAnnouncement(announcement: Announcement, pending: number): void {
    this.text.textContent = announcement.text;
    this.detail.textContent = announcement.detail ?? '';
    this.showIcon(announcement.icon);
    this.pending.textContent = pending > 0 ? `${pending} more to come` : '';
    this.element.classList.remove(styles.hidden!);
  }

  private showIcon(icon: string | undefined): void {
    this.icon.classList.toggle(styles.hidden!, icon === undefined);

    if (icon !== undefined) {
      this.icon.src = icon;
    }
  }

  private tell(announcement: Announcement, pending: number): void {
    this.showAnnouncement(announcement, pending);
    this.showChoice(undefined);
    this.continueButton.focus();
  }

  private ask(
    announcement: Announcement,
    choice: Choice,
    pending: number,
  ): void {
    this.showAnnouncement(announcement, pending);
    this.showChoice(choice);
    this.chooseButton.focus();
  }

  private showChoice(choice: Choice | undefined): void {
    const decline = choice?.decline;

    this.choice.classList.toggle(styles.hidden!, !choice);
    this.continueButton.classList.toggle(styles.hidden!, !!choice);
    this.picker.classList.toggle(styles.hidden!, decline !== undefined);
    this.declineButton.classList.toggle(styles.hidden!, decline === undefined);
    this.askLabel.textContent = choice?.label ?? '';
    this.chooseButton.textContent = choice?.action ?? '';
    this.declineButton.textContent = decline ?? '';
  }

  private get icon(): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>('[data-icon]')!;
  }

  private get text(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-text]')!;
  }

  private get detail(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-detail]')!;
  }

  private get pending(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-pending]')!;
  }

  private get choice(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-ask]')!;
  }

  private get askLabel(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-ask-label]')!;
  }

  private get picker(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-picker]')!;
  }

  private get declineButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-decline]')!;
  }

  private get chooseButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-choose]')!;
  }

  private get continueButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-continue]')!;
  }
}
